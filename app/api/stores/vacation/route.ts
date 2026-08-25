import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { isOnVacation } = body;

    const { data, error } = await supabase
      .from("profiles")
      .update({
        is_on_vacation: Boolean(isOnVacation),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select("id, full_name, is_on_vacation")
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      isOnVacation: data.is_on_vacation,
      message: data.is_on_vacation
        ? "თქვენი პროფილი გადავიდა შვებულების რეჟიმში"
        : "თქვენი პროფილი გააქტიურდა",
    });
  } catch (err: any) {
    console.error("[Vacation Toggle Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
