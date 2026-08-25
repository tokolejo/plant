import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check Admin status
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, role")
      .eq("id", user.id)
      .single();

    const isSuperAdmin = user.email === "tokolejo@gmail.com";
    const hasAdminAccess = isSuperAdmin || profile?.is_admin || profile?.role === "SUPER_ADMIN" || profile?.role === "MODERATOR";

    if (!hasAdminAccess) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "300");

    const adminClient = createAdminClient();

    // Query audit_logs joined with profiles
    const { data: logs, error } = await adminClient
      .from("audit_logs")
      .select(`
        id,
        actor_id,
        action,
        target_type,
        target_id,
        old_data,
        new_data,
        ip_address,
        user_agent,
        created_at,
        actor:actor_id (
          id,
          full_name,
          avatar_url,
          role
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Audit log fetch error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: logs || [] });
  } catch (err: any) {
    console.error("Server error in GET /api/admin/audit:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json();
    const { action, targetType, targetId, oldData, newData, actorId } = body;

    if (!action || !targetType) {
      return NextResponse.json({ success: false, error: "action and targetType are required" }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const effectiveActorId = actorId || user?.id || null;

    const payload = {
      actor_id: effectiveActorId,
      action: String(action),
      target_type: String(targetType),
      target_id: targetId || null,
      old_data: oldData || null,
      new_data: newData || null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await adminClient
      .from("audit_logs")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.warn("Audit insert notice in API route:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Server error in POST /api/admin/audit:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
