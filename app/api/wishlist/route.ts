import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("wishlists")
      .select(`
        id,
        created_at,
        listing:listing_id (
          id,
          title_ka,
          title_en,
          price,
          item_type,
          plant_category,
          images,
          city,
          status,
          is_vip,
          created_at,
          profiles:user_id (
            id,
            full_name,
            phone
          )
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const items = (data || [])
      .filter((w) => w.listing !== null)
      .map((w: any) => ({
        wishlistId: w.id,
        savedAt: w.created_at,
        ...w.listing,
      }));

    return NextResponse.json({ success: true, count: items.length, data: items });
  } catch (err: any) {
    console.error("[Wishlist GET Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "გთხოვთ გაიაროთ ავტორიზაცია" }, { status: 401 });
    }

    const body = await req.json();
    const { listingId } = body;

    if (!listingId) {
      return NextResponse.json({ success: false, error: "listingId is required" }, { status: 400 });
    }

    // Check if already in wishlist
    const { data: existing } = await supabase
      .from("wishlists")
      .select("id")
      .eq("user_id", user.id)
      .eq("listing_id", listingId)
      .maybeSingle();

    if (existing) {
      // Toggle: remove if already exists
      await supabase.from("wishlists").delete().eq("id", existing.id);
      return NextResponse.json({ success: true, action: "removed", inWishlist: false });
    }

    // Insert
    const { data, error } = await supabase
      .from("wishlists")
      .insert({
        user_id: user.id,
        listing_id: listingId,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, action: "added", inWishlist: true, data });
  } catch (err: any) {
    console.error("[Wishlist POST Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const listingId = searchParams.get("listingId");

    if (!listingId) {
      return NextResponse.json({ success: false, error: "listingId is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listingId);

    if (error) throw error;

    return NextResponse.json({ success: true, inWishlist: false });
  } catch (err: any) {
    console.error("[Wishlist DELETE Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
