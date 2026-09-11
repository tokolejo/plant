import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { appendReferralParam } from "@/lib/affiliate-tagger";

export const dynamic = "force-dynamic";

async function recordClick(affiliateId: string): Promise<void> {
  const adminClient = createAdminClient();

  try {
    await adminClient.rpc("increment_affiliate_click", { product_id: affiliateId });
    return;
  } catch {
    // fallback direct column updates
  }

  try {
    const { data } = await adminClient
      .from("affiliate_products")
      .select("clicks, clicks_count")
      .eq("id", affiliateId)
      .maybeSingle();

    if (data) {
      const nextClicks = ((data as any).clicks || 0) + 1;
      const nextClicksCount = ((data as any).clicks_count || 0) + 1;

      // Update both column names to be 100% resilient
      await adminClient
        .from("affiliate_products")
        .update({
          clicks: nextClicks,
          clicks_count: nextClicksCount,
        })
        .eq("id", affiliateId);
    }
  } catch (e) {
    console.warn("Could not update affiliate clicks:", e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { affiliateId, targetUrl, referralParam } = body;

    if (!affiliateId) {
      return NextResponse.json({ success: false, error: "affiliateId is required" }, { status: 400 });
    }

    await recordClick(affiliateId);

    const finalUrl = appendReferralParam(targetUrl || "", referralParam || "?ref=plantge");
    return NextResponse.json({ success: true, targetUrl: finalUrl });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 200 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const affiliateId = searchParams.get("id");
  const targetUrl = searchParams.get("url") || "https://google.com";
  const ref = searchParams.get("ref") || "?ref=plantge";

  if (affiliateId) {
    await recordClick(affiliateId);
  }

  const finalUrl = appendReferralParam(targetUrl, ref);
  return NextResponse.redirect(finalUrl, 302);
}
