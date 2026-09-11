import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { detectAffiliateCategory, detectAffiliateTags, appendReferralParam } from "@/lib/affiliate-tagger";

export const maxDuration = 60; // Allow up to 60s for category crawling

interface ScrapedItem {
  partnerName: string;
  productName: string;
  description: string;
  imageUrl: string | null;
  productUrl: string;
  price: number | null;
  currency: string;
  category: string;
  matchingTags: string[];
}

function extractDomainName(urlString: string): string {
  try {
    const parsed = new URL(urlString);
    let host = parsed.hostname.replace(/^www\./, "");
    const parts = host.split(".");
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  } catch {
    return "Partner Store";
  }
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&sup2;/g, "²");
}

function cleanText(text: string): string {
  return decodeHtmlEntities(text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

/**
 * Universal category item parser from HTML
 */
function parseCategoryHtml(html: string, baseUrl: URL, partnerName: string, limit: number): ScrapedItem[] {
  const items: ScrapedItem[] = [];
  const seenUrls = new Set<string>();

  // ─── METHOD 1: JSON-LD ItemList / Products ───
  try {
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        const listCandidates = [];

        if (parsed["@type"] === "ItemList" && Array.isArray(parsed.itemListElement)) {
          listCandidates.push(...parsed.itemListElement);
        } else if (Array.isArray(parsed["@graph"])) {
          for (const node of parsed["@graph"]) {
            if (node["@type"] === "ItemList" && Array.isArray(node.itemListElement)) {
              listCandidates.push(...node.itemListElement);
            } else if (node["@type"] === "Product") {
              listCandidates.push({ item: node });
            }
          }
        } else if (Array.isArray(parsed)) {
          for (const node of parsed) {
            if (node["@type"] === "Product") listCandidates.push({ item: node });
          }
        }

        for (const candidate of listCandidates) {
          if (items.length >= limit) break;
          const prod = candidate.item || candidate;
          const name = prod.name || prod.headline;
          const rawUrl = prod.url || prod["@id"];
          if (!name || !rawUrl) continue;

          let fullUrl = rawUrl;
          if (fullUrl.startsWith("/")) fullUrl = baseUrl.origin + fullUrl;
          if (seenUrls.has(fullUrl)) continue;

          let img = prod.image;
          if (Array.isArray(img)) img = img[0];
          if (typeof img === "object" && img?.url) img = img.url;
          if (typeof img === "string" && img.startsWith("/")) img = baseUrl.origin + img;

          let price: number | null = null;
          let currency = "GEL";
          if (prod.offers) {
            const offer = Array.isArray(prod.offers) ? prod.offers[0] : prod.offers;
            if (offer?.price) price = parseFloat(offer.price);
            if (offer?.priceCurrency) currency = offer.priceCurrency;
          }

          const desc = prod.description || "";
          items.push({
            partnerName,
            productName: cleanText(name).slice(0, 200),
            description: cleanText(desc).slice(0, 400),
            imageUrl: typeof img === "string" ? img : null,
            productUrl: fullUrl,
            price: price && !isNaN(price) ? price : null,
            currency: currency || "GEL",
            category: detectAffiliateCategory(name, desc),
            matchingTags: detectAffiliateTags(name, desc),
          });
          seenUrls.add(fullUrl);
        }
      } catch {
        // continue
      }
    }
  } catch {
    // ignore
  }

  if (items.length >= limit) return items.slice(0, limit);

  // ─── METHOD 2: DOM Card Pattern Matching ───
  // Regex to detect common product card blocks
  // e.g. <div class="...product..."><a href="/product/123">...<img src="...">...<span>25.00 ₾</span></div>
  const cardRegex = /<(?:div|article|li)[^>]*class=["'][^"']*(?:product|catalog-item|item-card|goods-item|shop-item|product-item)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|article|li)>/gi;
  let cardMatch;

  while ((cardMatch = cardRegex.exec(html)) !== null && items.length < limit) {
    const cardHtml = cardMatch[1];

    // Find link
    const linkMatch = cardHtml.match(/<a[^>]*href=["']([^"']+)["'][^>]*>/i);
    if (!linkMatch) continue;

    let prodUrl = linkMatch[1];
    if (prodUrl.startsWith("/")) prodUrl = baseUrl.origin + prodUrl;
    if (prodUrl.includes("#") || prodUrl === baseUrl.href) continue;
    if (seenUrls.has(prodUrl)) continue;

    // Find title/name
    let title: string | null = null;
    const titleMatch =
      cardHtml.match(/<(?:h2|h3|h4|span|div)[^>]*class=["'][^"']*(?:title|name|heading)[^"']*["'][^>]*>([\s\S]*?)<\/(?:h2|h3|h4|span|div)>/i) ||
      cardHtml.match(/title=["']([^"']{5,150})["']/i);

    if (titleMatch) {
      title = cleanText(titleMatch[1]);
    } else {
      // Fallback: look for <a> text with sufficient length
      const aTextMatch = cardHtml.match(/<a[^>]*>([\s\S]*?)<\/a>/i);
      if (aTextMatch) {
        const text = cleanText(aTextMatch[1]);
        if (text.length >= 5 && !text.toLowerCase().includes("კალათაში") && !text.toLowerCase().includes("ყიდვა")) {
          title = text;
        }
      }
    }

    if (!title || title.length < 3) continue;

    // Find image
    let imgUrl: string | null = null;
    const imgMatch =
      cardHtml.match(/<img[^>]*(?:data-src|data-lazy|src)=["']([^"']+)["'][^>]*>/i);
    if (imgMatch && imgMatch[1]) {
      let rawImg = imgMatch[1];
      if (rawImg.startsWith("//")) rawImg = "https:" + rawImg;
      else if (rawImg.startsWith("/")) rawImg = baseUrl.origin + rawImg;
      if (!rawImg.includes("data:image/svg") && !rawImg.includes("blank.gif")) {
        imgUrl = rawImg;
      }
    }

    // Find Price
    let price: number | null = null;
    const priceRegex = /([0-9]+(?:[.,][0-9]{2})?)\s*(?:₾|GEL|ლარი)/i;
    const priceMatch = cardHtml.match(priceRegex);
    if (priceMatch && priceMatch[1]) {
      price = parseFloat(priceMatch[1].replace(",", "."));
    }

    items.push({
      partnerName,
      productName: title.slice(0, 200),
      description: "",
      imageUrl: imgUrl,
      productUrl: prodUrl,
      price: price && !isNaN(price) ? price : null,
      currency: "GEL",
      category: detectAffiliateCategory(title, ""),
      matchingTags: detectAffiliateTags(title, ""),
    });
    seenUrls.add(prodUrl);
  }

  return items.slice(0, limit);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json();
    const {
      categoryUrl,
      partnerName: customPartnerName,
      partnerId,
      limit = 30,
      autoSave = false,
      referralParamTemplate = "?ref=plantge",
    } = body;

    if (!categoryUrl || typeof categoryUrl !== "string") {
      return NextResponse.json({ success: false, error: "მიუთითეთ კატეგორიის ვალიდური URL" }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(categoryUrl);
    } catch {
      return NextResponse.json({ success: false, error: "არასწორი URL ფორმატი" }, { status: 400 });
    }

    const partnerName = customPartnerName?.trim() || extractDomainName(categoryUrl);

    // Fetch target category page with realistic desktop browser headers
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "ka-GE,ka;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `ვერ მოხერხდა კატეგორიის ჩატვირთვა (HTTP ${response.status})` },
        { status: 502 }
      );
    }

    const html = await response.text();
    const cleanLimit = Math.min(Math.max(Number(limit) || 30, 5), 80);
    const parsedItems = parseCategoryHtml(html, parsedUrl, partnerName, cleanLimit);

    if (parsedItems.length === 0) {
      return NextResponse.json({
        success: true,
        items: [],
        message: "მოცემულ გვერდზე პროდუქტების ავტომატური ამოცნობა ვერ მოხერხდა. შეგიძლიათ გამოიყენოთ ერთეული URL სკრეიპერი ან CSV იმპორტი.",
      });
    }

    let savedCount = 0;
    let saveErrors: string[] = [];

    // Optional Auto-Save directly to Database
    if (autoSave) {
      if (!user) {
        return NextResponse.json({ success: false, error: "ავტორიზაცია აუცილებელია ბაზაში შესანახად" }, { status: 401 });
      }

      const adminClient = createAdminClient();
      const insertRows = parsedItems.map((item) => ({
        partner_name: item.partnerName,
        partner_id: partnerId || null,
        product_name: item.productName,
        description: item.description,
        image_url: item.imageUrl,
        product_url: item.productUrl,
        price: item.price || 0,
        currency: item.currency || "GEL",
        commission_pct: 5,
        category: item.category,
        matching_tags: item.matchingTags,
        is_active: true,
      }));

      // Insert in chunks of 25
      for (let i = 0; i < insertRows.length; i += 25) {
        const chunk = insertRows.slice(i, i + 25);
        const { error: insertErr } = await adminClient.from("affiliate_products").insert(chunk);
        if (insertErr) {
          saveErrors.push(insertErr.message);
        } else {
          savedCount += chunk.length;
        }
      }
    }

    return NextResponse.json({
      success: true,
      partnerName,
      foundCount: parsedItems.length,
      savedCount: autoSave ? savedCount : 0,
      saveErrors: saveErrors.length > 0 ? saveErrors : undefined,
      items: parsedItems,
    });
  } catch (err: any) {
    console.error("[Category Scraper Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "კატეგორიის სკრეიპერის შეცდომა" },
      { status: 500 }
    );
  }
}
