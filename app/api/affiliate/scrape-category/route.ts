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

function extractCleanPriceFromHtml(cardHtml: string): number | null {
  // 1. Check for integer followed by tags/dots/spaces and <sup> cents:
  // e.g. <span class="ty-price-num">7</span><span class="ty-price-sup">.</span><sup>90</sup> or 7<sup>90</sup> or 180<sup>00</sup>
  const supMatch = cardHtml.match(/([0-9]+)(?:<[^>]*>|[\s.,])*<\s*sup[^>]*>\s*\.?([0-9]{2})\s*<\s*\/sup>/i);
  if (supMatch) {
    const parsed = parseFloat(`${supMatch[1]}.${supMatch[2]}`);
    if (!isNaN(parsed)) return parsed;
  }

  // 2. Check 2 decimals before currency (e.g. 19.90 ₾, 25,50 GEL)
  const decMatch = cardHtml.match(/([0-9]+[.,][0-9]{2})\s*(?:₾|GEL|ლარი)/i);
  if (decMatch) {
    return parseFloat(decMatch[1].replace(",", "."));
  }

  // 3. Standalone integer in ty-price-num or standard price classes
  const numPriceMatch = cardHtml.match(/<span[^>]*class=["'][^"']*(?:ty-price-num|woocommerce-Price-amount|current-price|price-new|price-num)[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
  if (numPriceMatch) {
    let clean = numPriceMatch[1].replace(/<[^>]*>/g, "").replace(/[^0-9.,]/g, "").replace(",", ".");
    if (clean) {
      const parsed = parseFloat(clean);
      if (!isNaN(parsed)) return parsed;
    }
  }

  // 4. Match integer before currency (e.g. 35 ₾)
  const intMatch = cardHtml.match(/([0-9]+)\s*(?:₾|GEL|ლარი)/i);
  if (intMatch) {
    return parseFloat(intMatch[1]);
  }

  return null;
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

    // Find Price with robust Domino/Gorgia/CS-Cart sup handler
    const price = extractCleanPriceFromHtml(card);

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

  // ─── STRATEGY 3: General DOM Card Pattern Matching (WooCommerce, OpenCart, Shopify, Custom) ───
  const cardRegex =
    /<(?:div|article|li)[^>]*class=["'][^"']*(?:ut2-gl__item|ty-grid-list__item|catalog__item|product-item|product-card|goods-item|product_thumb|product-thumb|woocommerce-loop-product|type-product|grid-item|card--product)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|article|li)>/gi;
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
      cardHtml.match(/<(?:h1|h2|h3|h4|span|div|a)[^>]*class=["'][^"']*(?:title|name|heading|product-title|woocommerce-loop-product__title)[^"']*["'][^>]*>([\s\S]*?)<\/(?:h1|h2|h3|h4|span|div|a)>/i) ||
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

    const price = extractCleanPriceFromHtml(cardHtml);

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

function getCategoryPageUrl(parsedUrl: URL, pageNum: number): string {
  const baseClean = parsedUrl.toString().replace(/\/$/, "");
  if (baseClean.includes("page-")) {
    return baseClean.replace(/page-\d+/, `page-${pageNum}`) + "/";
  } else if (parsedUrl.searchParams.has("page")) {
    const nextUrl = new URL(parsedUrl.toString());
    nextUrl.searchParams.set("page", pageNum.toString());
    return nextUrl.toString();
  } else {
    // Check if domain is Domino or uses path-based pagination
    if (parsedUrl.hostname.includes("domino.com.ge")) {
      return `${baseClean}/page-${pageNum}/`;
    }
    // Generic query param pagination for Gorgia, Shopify, etc.
    const nextUrl = new URL(parsedUrl.toString());
    nextUrl.searchParams.set("page", pageNum.toString());
    return nextUrl.toString();
  }
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

    // Require authentication (prevents open SSRF proxy abuse)
    if (!user) {
      return NextResponse.json({ success: false, error: "ავტორიზაცია აუცილებელია" }, { status: 401 });
    }

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
    const cleanLimit = Math.min(Math.max(Number(limit) || 30, 5), 500);

    // 1. Fetch Page 1
    const html1 = await fetchPageHtml(parsedUrl.toString());
    if (!html1) {
      return NextResponse.json(
        { success: false, error: "ვერ მოხერხდა კატეგორიის ჩატვირთვა" },
        { status: 502 }
      );
    }

    let allItems = parseCategoryHtml(html1, parsedUrl, partnerName, cleanLimit, categoryOverride);

    // 2. Multi-page pagination loop (crawl pages 2..15 until cleanLimit reached or no more items)
    if (allItems.length < cleanLimit && allItems.length >= 10) {
      const seenUrls = new Set(allItems.map((i) => i.productUrl));
      let currentPage = 2;
      const maxPages = 15;

      while (allItems.length < cleanLimit && currentPage <= maxPages) {
        const pageUrl = getCategoryPageUrl(parsedUrl, currentPage);
        const pageHtml = await fetchPageHtml(pageUrl);
        if (!pageHtml) break;

        const pageItems = parseCategoryHtml(
          pageHtml,
          new URL(pageUrl),
          partnerName,
          cleanLimit - allItems.length,
          categoryOverride
        );

        if (pageItems.length === 0) break;

        let addedThisPage = 0;
        for (const it of pageItems) {
          if (!seenUrls.has(it.productUrl)) {
            allItems.push(it);
            seenUrls.add(it.productUrl);
            addedThisPage++;
          }
        }

        // If no new unique items were found on this page, stop to prevent infinite pagination
        if (addedThisPage === 0) break;

        currentPage++;
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

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin, role")
        .eq("id", user.id)
        .single();

      const isAdm = user.email === "tokolejo@gmail.com" || profile?.is_admin === true || profile?.role === "ADMIN" || profile?.role === "SUPER_ADMIN";
      if (!isAdm) {
        return NextResponse.json({ success: false, error: "წვდომა შეზღუდულია: საჭიროა ადმინისტრატორის უფლებები" }, { status: 403 });
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
        const urls = chunk.map((c) => c.product_url);
        const { data: existing } = await adminClient
          .from("affiliate_products")
          .select("id, product_url")
          .in("product_url", urls);

        const existingMap = new Map((existing || []).map((e) => [e.product_url, e.id]));
        const toInsert: any[] = [];

        for (const row of chunk) {
          const existingId = existingMap.get(row.product_url);
          if (existingId) {
            await adminClient
              .from("affiliate_products")
              .update({
                price: row.price,
                category: row.category,
                product_name: row.product_name,
                ...(row.image_url ? { image_url: row.image_url } : {}),
                matching_tags: row.matching_tags,
                last_scraped_at: new Date().toISOString(),
                is_active: true,
              })
              .eq("id", existingId);
            savedCount++;
          } else {
            toInsert.push(row);
          }
        }

        if (toInsert.length > 0) {
          const { error: insertErr } = await adminClient.from("affiliate_products").insert(toInsert);
          if (insertErr) {
            saveErrors.push(insertErr.message);
          } else {
            savedCount += toInsert.length;
          }
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
