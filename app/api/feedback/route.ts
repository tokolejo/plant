import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendFeedbackAdminNotification, sendFeedbackUserConfirmation } from "@/lib/services/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // 1. IP Rate Limiting: Max 3 submissions per 5 minutes
    const { allowed: ipAllowed } = checkRateLimit(`feedback:ip:${ip}`, 3, 300000);
    if (!ipAllowed) {
      return NextResponse.json(
        { success: false, error: "ძალიან ბევრი მოთხოვნა. გთხოვთ დაიცადოთ 5 წუთი." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      type = "general",
      name,
      email,
      phone,
      subject,
      message,
      website,
      bot_trap,
      form_load_time,
    } = body;

    // 2. Anti-Bot Honeypot Trap (Silent discard)
    if (website || bot_trap) {
      console.warn(`[Anti-Spam] Honeypot triggered from IP: ${ip}`);
      return NextResponse.json({
        success: true,
        message: "შეტყობინება წარმატებით გაიგზავნა.",
      });
    }

    // 3. Timing Check: Bots submit instantly (< 1800ms)
    if (form_load_time) {
      const duration = Date.now() - Number(form_load_time);
      if (duration < 1800) {
        console.warn(`[Anti-Spam] Instant submission detected (${duration}ms) from IP: ${ip}`);
        return NextResponse.json({
          success: true,
          message: "შეტყობინება წარმატებით გაიგზავნა.",
        });
      }
    }

    // 4. Input Validations
    if (!message || !message.trim() || !email || !email.trim() || !name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "გთხოვთ შეავსოთ სახელი, ელ-ფოსტა და შეტყობინება." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: "გთხოვთ მიუთითოთ ვალიდური ელ-ფოსტის მისამართი." },
        { status: 400 }
      );
    }

    // Email Rate Limiting: Max 2 submissions per 10 minutes per email
    const { allowed: emailAllowed } = checkRateLimit(`feedback:email:${cleanEmail}`, 2, 600000);
    if (!emailAllowed) {
      return NextResponse.json(
        { success: false, error: "ამ ელ-ფოსტიდან ცოტა ხნის წინ უკვე გაიგზავნა შეტყობინება. გთხოვთ დაიცადოთ." },
        { status: 429 }
      );
    }

    if (name.trim().length > 80) {
      return NextResponse.json({ success: false, error: "სახელი მეტისმეტად გრძელია." }, { status: 400 });
    }
    if (message.trim().length > 3000) {
      return NextResponse.json({ success: false, error: "შეტყობინება მეტისმეტად გრძელია (მაქს. 3000 სიმბოლო)." }, { status: 400 });
    }

    // Block spam containing excessive hyperlinks (> 3 links)
    const linkMatches = message.match(/https?:\/\/[^\s]+/gi);
    if (linkMatches && linkMatches.length > 3) {
      return NextResponse.json({ success: false, error: "შეტყობინება შეიცავს მეტისმეტად ბევრ ბმულს." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      user_id: user?.id || null,
      type: ["general", "suggestion", "bug", "correction", "partnership"].includes(type) ? type : "general",
      name: name.trim(),
      email: cleanEmail,
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
        console.warn("[Feedback Insert adminClient notice]:", error.message);
        // Fallback to user client
        const { data: userData, error: userErr } = await supabase
          .from("feedback")
          .insert(payload)
          .select()
          .single();
        if (!userErr && userData) {
          insertedData = userData;
        }
      } else {
        insertedData = data;
      }
    } catch (insertErr) {
      console.warn("[Feedback Admin Client Insert]:", insertErr);
    }

    // Trigger asynchronous background email dispatch (non-blocking)
    sendFeedbackAdminNotification(payload).catch((e) => console.warn("[Feedback Admin Email Notice]:", e));
    sendFeedbackUserConfirmation(payload).catch((e) => console.warn("[Feedback User Confirmation Notice]:", e));

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
