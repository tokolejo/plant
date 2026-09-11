import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

interface PlatformSettings {
  subscriptionsMode: "COMING_SOON" | "ACTIVE";
  greenhouseEnabled: boolean;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  subscriptionsMode: "COMING_SOON",
  greenhouseEnabled: false,
};

export async function GET() {
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("site_settings")
      .select("value")
      .eq("key", "platform_features")
      .single();

    if (error || !data?.value) {
      return NextResponse.json({
        success: true,
        settings: DEFAULT_SETTINGS,
      });
    }

    const val = data.value;
    const settings: PlatformSettings = {
      subscriptionsMode: val.subscriptionsMode === "ACTIVE" ? "ACTIVE" : "COMING_SOON",
      greenhouseEnabled: Boolean(val.greenhouseEnabled),
    };

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (err: any) {
    console.error("GET /api/admin/settings error:", err);
    return NextResponse.json({
      success: true,
      settings: DEFAULT_SETTINGS,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Verify Admin Status
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, role")
      .eq("id", user.id)
      .single();

    const isSuperAdmin = user.email === "tokolejo@gmail.com";
    const hasAdminAccess =
      isSuperAdmin ||
      profile?.is_admin === true ||
      profile?.role === "SUPER_ADMIN" ||
      profile?.role === "MODERATOR";

    if (!hasAdminAccess) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const body = await req.json();
    const incoming = body.settings || body;

    const validatedSettings: PlatformSettings = {
      subscriptionsMode: incoming.subscriptionsMode === "ACTIVE" ? "ACTIVE" : "COMING_SOON",
      greenhouseEnabled: Boolean(incoming.greenhouseEnabled),
    };

    const adminClient = createAdminClient();
    const { error: upsertError } = await adminClient
      .from("site_settings")
      .upsert({
        key: "platform_features",
        value: validatedSettings,
        description: "Public Platform Feature Flags (Subscriptions mode, Greenhouse visibility)",
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      });

    if (upsertError) {
      console.error("Error saving site_settings:", upsertError);
      return NextResponse.json({ success: false, error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      settings: validatedSettings,
    });
  } catch (err: any) {
    console.error("POST /api/admin/settings error:", err);
    return NextResponse.json({ success: false, error: err.message || "Internal server error" }, { status: 500 });
  }
}
