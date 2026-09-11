import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { detectAffiliateCategory, detectAffiliateTags } from "@/lib/affiliate-tagger";

export const maxDuration = 60; // Allow up to 60s for multi-page category crawling

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

const JUNK_TITLE_PATTERNS = [
  "ნაპოვნი",
  "შედეგი",
  "კალათაში",
  "კალათა",
  "ფილტრი",
  "დახარისხება",
  "შედარება",
  "ავტორიზაცია",
  "რეგისტრაცია",
  "გასვლა",
  "შესვლა",
  "search results",
  "products found",
];

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

function isJunkTitle(title: string): boolean {
  if (!title || title.length < 4) return true;
  const lower = title.toLowerCase();
  return JUNK_TITLE_PATTERNS.some((pattern) => lower.includes(pattern));
}

function isJunkUrl(url: string): boolean {
  if (!url || typeof url !== "string") return true;
  const lower = url.toLowerCase();
  return (
    lower.startsWith("javascript:") ||
    lower.startsWith("#") ||
    lower.startsWith("mailto:") ||
    lower.startsWith("tel:") ||
    lower.includes("/cart") ||
    lower.includes("/checkout") ||
    lower.includes("/wishlist")
  );
}

/**
 * Universal category item parser from HTML with CS-Cart, JSON-LD, and standard eCommerce card support
 */
function parseCategoryHtml(
  html: string,
  baseUrl: URL,
  partnerName: string,
  limit: number,
  categoryOverride?: string
): ScrapedItem[] {
  const items: ScrapedItem[] = [];
  const seenUrls = new Set<string>();

  // ─── STRATEGY 1: CS-Cart / UniTheme2 Product Forms (Gorgia, Domino, and standard CS-Cart) ───
  const formRegex = /<form[^>]*name=["']product_form_\d+["'][^>]*>([\s\S]*?)<\/form>/gi;
  let formMatch;

  while ((formMatch = formRegex.exec(html)) !== null && items.length < limit) {
    const card = formMatch[1];

    // Find Link
    const linkMatch =
      card.match(/<a[^>]*class=["'][^"']*(?:product-title|product_icon_lnk)[^"']*["'][^>]*href=["']([^"']+)["']/i) ||
      card.match(/<a[^>]*href=["'](https?:\/\/[^"'\s>]+)["']/i) ||
      card.match(/<a[^>]*href=["'](\/[^"'\s>]+)["']/i);

    if (!linkMatch) continue;

    let prodUrl = linkMatch[1];
    if (prodUrl.startsWith("/")) prodUrl = baseUrl.origin + prodUrl;
    if (isJunkUrl(prodUrl) || seenUrls.has(prodUrl)) continue;

    // Find Title
    let title: string | null = null;
    const titleMatch =
      card.match(/<a[^>]*class=["'][^"']*product-title[^"']*["'][^>]*title=["']([^"']+)["']/i) ||
      card.match(/<a[^>]*class=["'][^"']*product-title[^"']*["'][^>]*>([\s\S]*?)<\/a>/i);

    if (titleMatch) {
      title = cleanText(titleMatch[1]);
    } else {
      const altMatch = card.match(/<img[^>]*alt=["']([^"']{5,150})["']/i);
      if (altMatch) title = cleanText(altMatch[1]);
    }

    if (!title || isJunkTitle(title)) continue;

    // Find Image
    let imgUrl: string | null = null;
    const imgMatch = card.match(/<img[^>]*(?:srcset|data-src|src)=["']([^"']+)["']/i);
    if (imgMatch) {
      let rawImg = imgMatch[1];
      if (rawImg.includes(" ")) rawImg = rawImg.split(" ")[0];
      if (rawImg.startsWith("//")) rawImg = "https:" + rawImg;
      else if (rawImg.startsWith("/")) rawImg = baseUrl.origin + rawImg;
      if (!rawImg.includes("blank.gif") && !rawImg.includes("data:image/svg")) {
        imgUrl = rawImg;
      }
    }

    // Find Price
    let price: number | null = null;
    const numPriceMatch = card.match(/<span[^>]*class=["'][^"']*ty-price-num[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
    if (numPriceMatch) {
      const cleanNum = numPriceMatch[1].replace(/<[^>]*>/g, "").replace(/[^0-9.]/g, "");
      if (cleanNum) price = parseFloat(cleanNum);
    }

    if (price === null) {
      const generalPriceMatch = card.match(/([0-9]+(?:[.,][0-9]{2})?)\s*(?:₾|GEL|ლარი)/i);
      if (generalPriceMatch) {
        price = parseFloat(generalPriceMatch[1].replace(",", "."));
      }
    }

    const cat = categoryOverride && categoryOverride !== "AUTO" ? categoryOverride : detectAffiliateCategory(title, "");

    items.push({
      partnerName,
      productName: title.slice(0, 200),
      description: "",
      imageUrl: imgUrl,
      productUrl: prodUrl,
      price: price && !isNaN(price) ? price : null,
      currency: "GEL",
      category: cat,
      matchingTags: detectAffiliateTags(title, ""),
    });
    seenUrls.add(prodUrl);
  }

  if (items.length >= limit) return items.slice(0, limit);

  // ─── STRATEGY 2: JSON-LD ItemList / Products (Schema.org) ───
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
          if (isJunkUrl(fullUrl) || seenUrls.has(fullUrl)) continue;

          const titleClean = cleanText(name);
          if (isJunkTitle(titleClean)) continue;

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

          const desc = cleanText(prod.description || "");
          const cat =
            categoryOverride && categoryOverride !== "AUTO"
              ? categoryOverride
              : detectAffiliateCategory(titleClean, desc);

          items.push({
            partnerName,
            productName: titleClean.slice(0, 200),
            description: desc.slice(0, 400),
            imageUrl: typeof img === "string" ? img : null,
            productUrl: fullUrl,
            price: price && !isNaN(price) ? price : null,
            currency: currency || "GEL",
            category: cat,
            matchingTags: detectAffiliateTags(titleClean, desc),
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

  // ─── STRATEGY 3: General DOM Card Pattern Matching ───
  const cardRegex =
    /<(?:div|article|li)[^>]*class=["'][^"']*(?:ut2-gl__item|ty-grid-list__item|catalog__item|product-item|product-card|goods-item)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|article|li)>/gi;
  let cardMatch;

  while ((cardMatch = cardRegex.exec(html)) !== null && items.length < limit) {
    const cardHtml = cardMatch[1];

    const linkMatch = cardHtml.match(/<a[^>]*href=["']([^"']+)["'][^>]*>/i);
    if (!linkMatch) continue;

    let prodUrl = linkMatch[1];
    if (prodUrl.startsWith("/")) prodUrl = baseUrl.origin + prodUrl;
    if (isJunkUrl(prodUrl) || seenUrls.has(prodUrl)) continue;

    let title: string | null = null;
    const titleMatch =
      cardHtml.match(/<(?:h2|h3|h4|span|div)[^>]*class=["'][^"']*(?:title|name|heading|product-title)[^"']*["'][^>]*>([\s\S]*?)<\/(?:h2|h3|h4|span|div)>/i) ||
      cardHtml.match(/title=["']([^"']{5,150})["']/i);

    if (titleMatch) {
      title = cleanText(titleMatch[1]);
    }

    if (!title || isJunkTitle(title)) continue;

    let imgUrl: string | null = null;
    const imgMatch = cardHtml.match(/<img[^>]*(?:data-src|data-lazy|srcset|src)=["']([^"']+)["'][^>]*>/i);
    if (imgMatch && imgMatch[1]) {
      let rawImg = imgMatch[1].split(" ")[0];
      if (rawImg.startsWith("//")) rawImg = "https:" + rawImg;
      else if (rawImg.startsWith("/")) rawImg = baseUrl.origin + rawImg;
      if (!rawImg.includes("data:image/svg") && !rawImg.includes("blank.gif")) {
        imgUrl = rawImg;
      }
    }

    let price: number | null = null;
    const priceMatch = cardHtml.match(/([0-9]+(?:[.,][0-9]{2})?)\s*(?:₾|GEL|ლარი)/i);
    if (priceMatch && priceMatch[1]) {
      price = parseFloat(priceMatch[1].replace(",", "."));
    }

    const cat = categoryOverride && categoryOverride !== "AUTO" ? categoryOverride : detectAffiliateCategory(title, "");

    items.push({
      partnerName,
      productName: title.slice(0, 200),
      description: "",
      imageUrl: imgUrl,
      productUrl: prodUrl,
      price: price && !isNaN(price) ? price : null,
      currency: "GEL",
      category: cat,
      matchingTags: detectAffiliateTags(title, ""),
    });
    seenUrls.add(prodUrl);
  }

  return items.slice(0, limit);
}

async function fetchPageHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "ka-GE,ka;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
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
      categoryOverride,
      autoSave = false,
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
    const cleanLimit = Math.min(Math.max(Number(limit) || 30, 5), 80);

    // 1. Fetch Page 1
    const html1 = await fetchPageHtml(parsedUrl.toString());
    if (!html1) {
      return NextResponse.json(
        { success: false, error: "ვერ მოხერხდა კატეგორიის ჩატვირთვა" },
        { status: 502 }
      );
    }

    let allItems = parseCategoryHtml(html1, parsedUrl, partnerName, cleanLimit, categoryOverride);

    // 2. If user requested more items and Page 1 gave fewer than limit, attempt Page 2
    if (allItems.length < cleanLimit && allItems.length >= 15) {
      let page2Url = "";
      const baseClean = parsedUrl.toString().replace(/\/$/, "");

      if (baseClean.includes("page-")) {
        page2Url = baseClean.replace(/page-\d+/, "page-2") + "/";
      } else if (parsedUrl.searchParams.has("page")) {
        const nextUrl = new URL(parsedUrl.toString());
        nextUrl.searchParams.set("page", "2");
        page2Url = nextUrl.toString();
      } else {
        page2Url = `${baseClean}/page-2/`;
      }

      const html2 = await fetchPageHtml(page2Url);
      if (html2) {
        const page2Items = parseCategoryHtml(
          html2,
          new URL(page2Url),
          partnerName,
          cleanLimit - allItems.length,
          categoryOverride
        );
        // Deduplicate and append
        const existingUrls = new Set(allItems.map((i) => i.productUrl));
        for (const it of page2Items) {
          if (!existingUrls.has(it.productUrl)) {
            allItems.push(it);
            existingUrls.add(it.productUrl);
          }
        }
      }
    }

    if (allItems.length === 0) {
      return NextResponse.json({
        success: true,
        items: [],
        message: "მოცემულ გვერდზე პროდუქტები ვერ ამოიცნო. დარწმუნდით რომ კატეგორიის გვერდია.",
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
      const insertRows = allItems.map((item) => ({
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
      foundCount: allItems.length,
      savedCount: autoSave ? savedCount : 0,
      saveErrors: saveErrors.length > 0 ? saveErrors : undefined,
      items: allItems,
    });
  } catch (err: any) {
    console.error("[Category Scraper Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "კატეგორიის სკრეიპერის შეცდომა" },
      { status: 500 }
    );
  }
}
