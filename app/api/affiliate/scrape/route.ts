import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export const maxDuration = 30;

// Botanical keywords dictionary for auto-tagging
const BOTANICAL_KEYWORDS = [
  "monstera", "მონსტერა",
  "philodendron", "ფილოდენდრონი",
  "anthurium", "ანთურიუმი",
  "alocasia", "ალოკაზია",
  "ficus", "ფიკუსი",
  "orchid", "ორქიდეა",
  "cactus", "კაქტუსი",
  "succulent", "სუქულენტი",
  "sansevieria", "სანსევიერია",
  "zamioculcas", "ზამიოკულკასი",
  "calathea", "კალათეა",
  "syngonium", "სინგონიუმი",
  "pothos", "ეპიპრემნუმი",
  "hoya", "ხოია",
  "begonia", "ბეგონია",
  "palm", "პალმა",
  "fern", "გვიმრა",
  "pot", "ქოთანი", "კერამიკა",
  "soil", "სუბსტრატი", "ტორფი", "პერლიტი", "გრუნტი",
  "fertilizer", "სასუქი", "ვიტამინი",
  "grow light", "ფიტო ნათურა", "განათება",
  "tools", "მაკრატელი", "სეკატორი",
  "moss pole", "საყრდენი",
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

function parseMetaTag(html: string, propertyName: string): string | null {
  // Matches <meta property="..." content="..."> or <meta name="..." content="...">
  const patterns = [
    new RegExp(`<meta[^>]*property=["']${propertyName}["'][^>]*content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${propertyName}["']`, "i"),
    new RegExp(`<meta[^>]*name=["']${propertyName}["'][^>]*content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${propertyName}["']`, "i"),
  ];

  for (const regex of patterns) {
    const match = html.match(regex);
    if (match && match[1]) {
      return decodeHtmlEntities(match[1].trim());
    }
  }
  return null;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function extractJsonLd(html: string): any | null {
  try {
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed["@type"] === "Product" || parsed["@type"]?.includes?.("Product")) {
          return parsed;
        }
        if (Array.isArray(parsed["@graph"])) {
          const product = parsed["@graph"].find((item: any) => item["@type"] === "Product");
          if (product) return product;
        }
      } catch {
        // continue
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function detectMatchingTags(text: string): string[] {
  const lower = text.toLowerCase();
  const matched = new Set<string>();
  for (const kw of BOTANICAL_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      matched.add(kw);
    }
  }
  return Array.from(matched).slice(0, 10);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Verify User & Admin permissions if saving
    const body = await req.json();
    const { url, autoSave = false, partnerName: customPartnerName, commissionPct = 0 } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ success: false, error: "გთხოვთ მიუთითოთ პროდუქტის ვალიდური URL" }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ success: false, error: "არასწორი URL ფორმატი" }, { status: 400 });
    }

    // Fetch Target URL HTML with realistic headers
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 PlantioBot/1.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "ka-GE,ka;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `ვერ მოხერხდა გვერდის ჩატვირთვა (HTTP ${response.status})` },
        { status: 502 }
      );
    }

    const html = await response.text();

    // 1. JSON-LD Extraction (Most reliable for eCommerce)
    const jsonLd = extractJsonLd(html);

    // 2. OpenGraph / Twitter Fallbacks
    const ogTitle = parseMetaTag(html, "og:title") || parseMetaTag(html, "twitter:title");
    const ogDesc = parseMetaTag(html, "og:description") || parseMetaTag(html, "twitter:description") || parseMetaTag(html, "description");
    let ogImage = parseMetaTag(html, "og:image") || parseMetaTag(html, "twitter:image");

    // Title tag fallback
    let docTitle: string | null = null;
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      docTitle = decodeHtmlEntities(titleMatch[1].trim());
    }

    const productName =
      jsonLd?.name ||
      ogTitle ||
      docTitle ||
      "პარტნიორი პროდუქტი";

    const description =
      jsonLd?.description ||
      ogDesc ||
      "";

    // Image URL resolution
    if (!ogImage && jsonLd?.image) {
      if (typeof jsonLd.image === "string") {
        ogImage = jsonLd.image;
      } else if (Array.isArray(jsonLd.image) && jsonLd.image[0]) {
        ogImage = typeof jsonLd.image[0] === "string" ? jsonLd.image[0] : jsonLd.image[0].url;
      } else if (jsonLd.image?.url) {
        ogImage = jsonLd.image.url;
      }
    }

    if (ogImage && ogImage.startsWith("//")) {
      ogImage = "https:" + ogImage;
    } else if (ogImage && ogImage.startsWith("/")) {
      ogImage = parsedUrl.origin + ogImage;
    }

    // Price and Currency extraction
    let price: number | null = null;
    let currency = "GEL";

    if (jsonLd?.offers) {
      const offers = Array.isArray(jsonLd.offers) ? jsonLd.offers[0] : jsonLd.offers;
      if (offers?.price) price = parseFloat(offers.price);
      if (offers?.priceCurrency) currency = offers.priceCurrency;
    }

    if (price === null) {
      const ogPrice = parseMetaTag(html, "og:price:amount") || parseMetaTag(html, "product:price:amount");
      if (ogPrice) price = parseFloat(ogPrice.replace(/[^0-9.]/g, ""));
      const ogCurrency = parseMetaTag(html, "og:price:currency") || parseMetaTag(html, "product:price:currency");
      if (ogCurrency) currency = ogCurrency;
    }

    // Fallback price regex (e.g. 24.50 ₾ or $19.99 or 45.00 GEL)
    if (price === null || isNaN(price)) {
      const priceRegex = /([0-9]+(?:[.,][0-9]{2})?)\s*(?:₾|GEL|USD|\$|EUR|€)/i;
      const match = html.match(priceRegex);
      if (match && match[1]) {
        price = parseFloat(match[1].replace(",", "."));
      }
    }

    const partnerName = customPartnerName || extractDomainName(url);
    const combinedText = `${productName} ${description} ${partnerName}`;
    const matchingTags = detectMatchingTags(combinedText);

    const scrapedData = {
      partnerName,
      productName: productName.replace(/\s+/g, " ").slice(0, 200),
      description: description.replace(/\s+/g, " ").slice(0, 500),
      imageUrl: ogImage || null,
      productUrl: url,
      price: price && !isNaN(price) ? price : null,
      currency: currency || "GEL",
      commissionPct: Number(commissionPct) || 0,
      matchingTags,
      isActive: true,
    };

    let savedRecord = null;

    // Auto-save to Supabase if requested
    if (autoSave) {
      if (!user) {
        return NextResponse.json({ success: false, error: "ავტორიზაცია აუცილებელია ბაზაში შესანახად" }, { status: 401 });
      }

      const adminClient = createAdminClient();
      const { data: inserted, error: insertError } = await adminClient
        .from("affiliate_products")
        .insert({
          partner_name: scrapedData.partnerName,
          product_name: scrapedData.productName,
          description: scrapedData.description,
          image_url: scrapedData.imageUrl,
          product_url: scrapedData.productUrl,
          price: scrapedData.price,
          currency: scrapedData.currency,
          commission_pct: scrapedData.commissionPct,
          matching_tags: scrapedData.matchingTags,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({
          success: true,
          data: scrapedData,
          saveError: insertError.message,
        });
      }
      savedRecord = inserted;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...scrapedData,
        savedRecord,
      },
    });
  } catch (err: any) {
    console.error("[Affiliate Scraper Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "სკრეიპერის შესრულების შეცდომა" },
      { status: 500 }
    );
  }
}
