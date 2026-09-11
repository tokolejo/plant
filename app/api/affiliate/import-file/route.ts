import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { detectAffiliateCategory, detectAffiliateTags } from "@/lib/affiliate-tagger";

export const maxDuration = 60;

function parseCsv(csvText: string): Record<string, string>[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse header line
  const headerLine = lines[0];
  const delimiter = headerLine.includes("\t") ? "\t" : headerLine.includes(";") ? ";" : ",";
  const headers = headerLine.split(delimiter).map((h) => h.replace(/^["']|["']$/g, "").trim().toLowerCase());

  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parser handling quotes
    const values: string[] = [];
    let cur = "";
    let inQuotes = false;

    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        values.push(cur.trim());
        cur = "";
      } else {
        cur += char;
      }
    }
    values.push(cur.trim());

    const record: Record<string, string> = {};
    headers.forEach((hdr, idx) => {
      let val = values[idx] || "";
      val = val.replace(/^["']|["']$/g, "").trim();
      record[hdr] = val;
    });

    records.push(record);
  }

  return records;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "ავტორიზაცია აუცილებელია" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, role")
      .eq("id", user.id)
      .single();

    const isAdm = user.email === "tokolejo@gmail.com" || profile?.is_admin === true || profile?.role === "ADMIN" || profile?.role === "SUPER_ADMIN";
    if (!isAdm) {
      return NextResponse.json({ success: false, error: "წვდომა შეზღუდულია: საჭიროა ადმინისტრატორის უფლებები" }, { status: 403 });
    }

    const contentType = req.headers.get("content-type") || "";
    let productsToInsert: any[] = [];
    let defaultPartnerName = "Partner Store";
    let defaultPartnerId: string | null = null;

    if (contentType.includes("application/json")) {
      const body = await req.json();
      defaultPartnerName = body.partnerName || defaultPartnerName;
      defaultPartnerId = body.partnerId || null;

      if (Array.isArray(body.items)) {
        productsToInsert = body.items;
      } else if (typeof body.csvText === "string") {
        const parsed = parseCsv(body.csvText);
        productsToInsert = parsed;
      }
    } else {
      // Text CSV payload
      const text = await req.text();
      productsToInsert = parseCsv(text);
    }

    if (!productsToInsert || productsToInsert.length === 0) {
      return NextResponse.json({ success: false, error: "ფაილში ან მოთხოვნაში პროდუქტები ვერ მოიძებნა" }, { status: 400 });
    }

    // Process & Normalize Rows
    const normalizedRows = productsToInsert.map((raw: any) => {
      const title =
        raw.product_name ||
        raw.productName ||
        raw.name ||
        raw.title ||
        raw["სათაური"] ||
        raw["სახელი"] ||
        "პროდუქტი";

      const url =
        raw.product_url ||
        raw.productUrl ||
        raw.url ||
        raw.link ||
        raw["ბმული"] ||
        raw["ლინკი"] ||
        "";

      const rawPrice =
        raw.price ||
        raw["ფასი"] ||
        raw["ღირებულება"] ||
        "0";

      const cleanPrice = parseFloat(String(rawPrice).replace(/[^0-9.]/g, "")) || 0;

      const img =
        raw.image_url ||
        raw.imageUrl ||
        raw.image ||
        raw["სურათი"] ||
        raw["ფოტო"] ||
        null;

      const desc =
        raw.description ||
        raw.desc ||
        raw["აღწერა"] ||
        "";

      const partner =
        raw.partner_name ||
        raw.partnerName ||
        raw.partner ||
        raw["მაღაზია"] ||
        defaultPartnerName;

      const category =
        raw.category ||
        raw["კატეგორია"] ||
        detectAffiliateCategory(title, desc);

      const matchingTags =
        Array.isArray(raw.matchingTags) || Array.isArray(raw.matching_tags)
          ? raw.matchingTags || raw.matching_tags
          : detectAffiliateTags(title, desc);

      return {
        partner_name: partner,
        partner_id: defaultPartnerId,
        product_name: String(title).slice(0, 200),
        description: String(desc).slice(0, 500),
        image_url: img,
        product_url: url,
        price: cleanPrice,
        currency: "GEL",
        commission_pct: Number(raw.commission_pct || raw.commissionPct) || 5,
        category,
        matching_tags: matchingTags,
        is_active: true,
      };
    }).filter((p) => p.product_url && p.product_name);

    if (normalizedRows.length === 0) {
      return NextResponse.json({
        success: false,
        error: "ვალიდური მონაცემები (სათაური და ბმული) ვერ მოიძებნა",
      }, { status: 400 });
    }

    const adminClient = createAdminClient();
    let insertedTotal = 0;
    let updatedTotal = 0;
    const errors: string[] = [];

    // Smart Batch Insert & Update (Deduplication by product_url)
    for (let i = 0; i < normalizedRows.length; i += 50) {
      const chunk = normalizedRows.slice(i, i + 50);
      const urls = chunk.map((c) => c.product_url);

      const { data: existing } = await adminClient
        .from("affiliate_products")
        .select("id, product_url")
        .in("product_url", urls);

      const existingMap = new Map((existing || []).map((e) => [e.product_url, e.id]));

      const toInsert: any[] = [];
      for (const item of chunk) {
        const existingId = existingMap.get(item.product_url);
        if (existingId) {
          // Update existing item with fresh price, category, etc.
          const { error: updErr } = await adminClient
            .from("affiliate_products")
            .update({
              price: item.price,
              category: item.category,
              product_name: item.product_name,
              ...(item.image_url ? { image_url: item.image_url } : {}),
              matching_tags: item.matching_tags,
              last_scraped_at: new Date().toISOString(),
              is_active: true,
            })
            .eq("id", existingId);

          if (updErr) errors.push(updErr.message);
          else updatedTotal++;
        } else {
          toInsert.push(item);
        }
      }

      if (toInsert.length > 0) {
        const { error: insErr } = await adminClient.from("affiliate_products").insert(toInsert);
        if (insErr) {
          errors.push(insErr.message);
        } else {
          insertedTotal += toInsert.length;
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalReceived: normalizedRows.length,
      insertedCount: insertedTotal,
      updatedCount: updatedTotal,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error("[Affiliate Import Error]:", err);
    return NextResponse.json({ success: false, error: err.message || "იმპორტის შეცდომა" }, { status: 500 });
  }
}
