import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

// ── GET: Fetch Offers for a Chat or User ──────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");
    const listingId = searchParams.get("listingId");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let query = supabase
      .from("trade_offers")
      .select(`
        *,
        sender:sender_id (id, full_name, avatar_url, phone),
        receiver:receiver_id (id, full_name, avatar_url, phone),
        requested_listing:requested_listing_id (id, title_ka, title_en, price, images, status),
        offered_listing:offered_listing_id (id, title_ka, title_en, price, images, status)
      `)
      .order("created_at", { ascending: false });

    if (chatId) {
      query = query.eq("chat_id", chatId);
    } else if (listingId) {
      query = query.eq("requested_listing_id", listingId);
    } else if (user) {
      query = query.or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
    } else {
      return NextResponse.json({ success: true, offers: [] });
    }

    const { data: offers, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, offers: offers || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ── POST: Create Trade Offer or Counter-Offer ──────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      chat_id,
      receiver_id,
      requested_listing_id,
      offered_listing_id,
      offered_price,
      cash_difference,
    } = body;

    if (!receiver_id || !requested_listing_id) {
      return NextResponse.json(
        { success: false, error: "receiver_id and requested_listing_id are required" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    const { data: newOffer, error: insertError } = await adminClient
      .from("trade_offers")
      .insert({
        chat_id: chat_id || null,
        sender_id: user.id,
        receiver_id,
        requested_listing_id,
        offered_listing_id: offered_listing_id || null,
        offered_price: offered_price !== undefined ? Number(offered_price) : null,
        cash_difference: cash_difference !== undefined ? Number(cash_difference) : 0,
        status: "pending",
      })
      .select(`
        *,
        sender:sender_id (id, full_name, avatar_url),
        receiver:receiver_id (id, full_name, avatar_url),
        requested_listing:requested_listing_id (id, title_ka, price, images),
        offered_listing:offered_listing_id (id, title_ka, price, images)
      `)
      .single();

    if (insertError) {
      return NextResponse.json({ success: false, error: insertError.message }, { status: 400 });
    }

    // Also optionally record an automated message in the conversation
    if (chat_id) {
      const isSwap = Boolean(offered_listing_id);
      const content = isSwap
        ? `ახალი შეთავაზება გაცვლაზე (+${cash_difference || 0} ₾)`
        : `ახალი ფასის შეთავაზება: ${offered_price} ₾`;

      await adminClient.from("messages").insert({
        conversation_id: chat_id,
        sender_id: user.id,
        content,
      });

      await adminClient.from("conversations").update({
        last_message_at: new Date().toISOString(),
      }).eq("id", chat_id);
    }

    // In-App Notification to receiver
    await adminClient.from("notifications").insert({
      user_id: receiver_id,
      type: "SYSTEM_ALERT",
      title: "ახალი შეთავაზება მცენარეზე",
      content: `თქვენს განცხადებაზე მიღებულია ახალი შეთავაზება. შეამოწმეთ შეტყობინებებში.`,
      link: chat_id ? `/dashboard/messages?conv=${chat_id}` : `/dashboard/messages`,
    });

    return NextResponse.json({ success: true, offer: newOffer });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ── PATCH: Update Offer Status (Accept / Decline / Counter) ───────────────────
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { offerId, status } = body;

    if (!offerId || !["accepted", "countered", "declined", "expired"].includes(status)) {
      return NextResponse.json({ success: false, error: "Valid offerId and status required" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Verify user is either sender or receiver
    const { data: offer } = await adminClient
      .from("trade_offers")
      .select("*")
      .eq("id", offerId)
      .single();

    if (!offer) {
      return NextResponse.json({ success: false, error: "Offer not found" }, { status: 404 });
    }

    if (offer.sender_id !== user.id && offer.receiver_id !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Update status (trigger automatically reserves listings on 'accepted')
    const { data: updatedOffer, error } = await adminClient
      .from("trade_offers")
      .update({ status })
      .eq("id", offerId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Send in-chat message status notification
    if (offer.chat_id) {
      let statusMsg = "";
      if (status === "accepted") statusMsg = "შეთავაზება მიღებულია! მცენარე დარეზერვდა (RESERVED).";
      else if (status === "declined") statusMsg = "შეთავაზება უარყოფილია.";
      else if (status === "countered") statusMsg = "გაკეთდა კონტრ-შეთავაზება.";

      if (statusMsg) {
        await adminClient.from("messages").insert({
          conversation_id: offer.chat_id,
          sender_id: user.id,
          content: statusMsg,
        });
      }
    }

    return NextResponse.json({ success: true, offer: updatedOffer });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
