import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json();
    const { listingId } = body;

    if (!listingId) {
      return NextResponse.json({ success: false, error: "listingId is required" }, { status: 400 });
    }

    const userAgent = req.headers.get("user-agent") || "";
    let deviceType = "desktop";
    if (/mobile/i.test(userAgent)) deviceType = "mobile";
    else if (/tablet|ipad/i.test(userAgent)) deviceType = "tablet";

    const adminClient = createAdminClient();
    await adminClient.from("listing_views").insert({
      listing_id: listingId,
      viewer_id: user?.id || null,
      device_type: deviceType,
      viewed_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    // Non-blocking for client
    return NextResponse.json({ success: false, error: err.message }, { status: 200 });
  }
}
