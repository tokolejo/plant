import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { allowed } = checkRateLimit(`feedback:${ip}`, 5, 60000);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "ძალიან ბევრი მოთხოვნა. გთხოვთ დაიცადოთ ცოტა ხანი." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { type, name, email, phone, subject, message, website, bot_trap } = body;

    // Honeypot check for bots (silent reject)
    if (website || bot_trap) {
      return NextResponse.json({
        success: true,
        message: "შეტყობინება წარმატებით გაიგზავნა.",
      });
    }

    if (!message || !message.trim() || !email || !email.trim() || !name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "გთხოვთ შეავსოთ სახელი, ელ-ფოსტა და შეტყობინება." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: "გთხოვთ მიუთითოთ ვალიდური ელ-ფოსტის მისამართი." },
        { status: 400 }
      );
    }

    if (name.trim().length > 80) {
      return NextResponse.json({ success: false, error: "სახელი მეტისმეტად გრძელია." }, { status: 400 });
    }
    if (message.trim().length > 3000) {
      return NextResponse.json({ success: false, error: "შეტყობინება მეტისმეტად გრძელია (მაქს. 3000 სიმბოლო)." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      user_id: user?.id || null,
      type: type || "general",
      name: name.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : null,
      subject: subject ? subject.trim() : "შეტყობინება საკონტაქტო ფორმიდან",
      message: message.trim(),
      status: "NEW",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let insertedData: any = null;

    try {
      const adminClient = createAdminClient();
      const { data, error } = await adminClient
        .from("feedback")
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.warn("[Feedback Insert Notice]:", error.message);
      } else {
        insertedData = data;
      }
    } catch (insertErr) {
      console.warn("[Feedback Admin Client Insert]:", insertErr);
    }

    return NextResponse.json({
      success: true,
      data: insertedData || payload,
      message: "შეტყობინება წარმატებით გაიგზავნა.",
    });
  } catch (err: any) {
    console.error("[Feedback API Error]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "სერვერის შეცდომა" },
      { status: 500 }
    );
  }
}
