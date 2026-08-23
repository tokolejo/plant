import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, name, email, phone, subject, message, rating } = body;

    if (!message || (!email && !name)) {
      return NextResponse.json(
        { success: false, error: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Try to insert into feedback table if available, else gracefully log
    try {
      await supabase.from("feedback").insert({
        user_id: user?.id || null,
        type: type || "general",
        name: name || "Anonymous",
        email: email || "",
        phone: phone || null,
        subject: subject || "Feedback",
        message: message,
        rating: rating || null,
        created_at: new Date().toISOString(),
      });
    } catch (insertErr) {
      console.warn("[Feedback Insert Fallback]:", insertErr);
    }

    return NextResponse.json({
      success: true,
      message: "Feedback received successfully. Thank you!",
    });
  } catch (err: any) {
    console.error("[Feedback API Error]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
