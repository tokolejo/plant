import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { affiliateId, targetUrl } = body;

    if (!affiliateId) {
      return NextResponse.json({ success: false, error: "affiliateId is required" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Increment clicks_count
    try {
      await adminClient.rpc("increment_affiliate_click", { product_id: affiliateId });
    } catch {
      // fallback direct update
      const { data } = await adminClient
        .from("affiliate_products")
        .select("clicks_count")
        .eq("id", affiliateId)
        .single();

      if (data) {
        await adminClient
          .from("affiliate_products")
          .update({ clicks_count: (data.clicks_count || 0) + 1 })
          .eq("id", affiliateId);
      }
    }

    return NextResponse.json({ success: true, targetUrl });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 200 });
  }
}
