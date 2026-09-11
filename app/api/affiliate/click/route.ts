import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { appendReferralParam } from "@/lib/affiliate-tagger";

export const dynamic = "force-dynamic";

async function recordClick(affiliateId: string): Promise<{ productUrl: string | null }> {
  const adminClient = createAdminClient();

  try {
    await adminClient.rpc("increment_affiliate_click", { product_id: affiliateId });
  } catch {
    // fallback direct column updates
  }

  try {
    const { data } = await adminClient
      .from("affiliate_products")
      .select("clicks, clicks_count, product_url")
      .eq("id", affiliateId)
      .maybeSingle();

    if (data) {
      const nextClicks = ((data as any).clicks || 0) + 1;
      const nextClicksCount = ((data as any).clicks_count || 0) + 1;

      await adminClient
        .from("affiliate_products")
        .update({
          clicks: nextClicks,
          clicks_count: nextClicksCount,
        })
        .eq("id", affiliateId);

      return { productUrl: (data as any).product_url || null };
    }
  } catch (e) {
    console.warn("Could not update affiliate clicks:", e);
  }

  return { productUrl: null };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { affiliateId, targetUrl, referralParam } = body;

    if (!affiliateId) {
      return NextResponse.json({ success: false, error: "affiliateId is required" }, { status: 400 });
    }

    const { productUrl } = await recordClick(affiliateId);

    // Use DB-stored URL as source of truth; fall back to client-provided only if DB lookup fails
    const safeUrl = productUrl || targetUrl || "";
    const finalUrl = appendReferralParam(safeUrl, referralParam || "?ref=plantio");
    return NextResponse.json({ success: true, targetUrl: finalUrl });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 200 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const affiliateId = searchParams.get("id");
  const ref = searchParams.get("ref") || "?ref=plantio";

  if (!affiliateId) {
    // ID არ არის — arbitrary URL-ზე გადამისამართებას ვერ ვაკეთებთ
    return NextResponse.redirect(new URL("/", req.url), 302);
  }

  const { productUrl } = await recordClick(affiliateId);

  if (!productUrl) {
    // ID ბაზაში ვერ მოიძებნა — refuse to redirect to arbitrary URL
    return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
  }

  const finalUrl = appendReferralParam(productUrl, ref);
  return NextResponse.redirect(finalUrl, 302);
}

