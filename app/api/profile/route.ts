import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

// ── GET: Fetch Current User Profile ──────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, profile });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ── PUT / PATCH: Update Current User Profile ──────────────────────────────────
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
    const {
      first_name,
      last_name,
      phone,
      avatar_url,
      location,
      city,
      bio,
      custom_slug,
    } = body;

    const adminClient = createAdminClient();

    const fullName = [first_name, last_name].filter(Boolean).join(" ").trim() || undefined;

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (first_name !== undefined) updatePayload.first_name = first_name.trim();
    if (last_name !== undefined) updatePayload.last_name = last_name.trim();
    if (fullName) updatePayload.full_name = fullName;
    if (phone !== undefined) updatePayload.phone = phone.trim();
    if (avatar_url !== undefined) updatePayload.avatar_url = avatar_url;
    if (location !== undefined) updatePayload.location = location.trim();
    if (city !== undefined) updatePayload.city = city.trim();
    if (bio !== undefined) updatePayload.bio = bio.trim();
    if (custom_slug !== undefined) updatePayload.custom_slug = custom_slug.trim();
    if (body.social_links !== undefined) updatePayload.social_links = body.social_links;
    if (body.notification_preferences !== undefined) updatePayload.notification_preferences = body.notification_preferences;

    const { data: updatedProfile, error } = await adminClient
      .from("profiles")
      .update(updatePayload)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
