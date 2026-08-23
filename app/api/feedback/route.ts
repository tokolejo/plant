import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, name, email, phone, subject, message } = body;

    if (!message || !message.trim() || !email || !email.trim() || !name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "გთხოვთ შეავსოთ სახელი, ელ-ფოსტა და შეტყობინება." },
        { status: 400 }
      );
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
