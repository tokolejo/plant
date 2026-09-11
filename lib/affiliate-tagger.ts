/**
 * Botanical Auto-Tagger & Smart Category Detection for Affiliate Inventory
 */

export interface AffiliateCategoryDefinition {
  id: string;
  nameKa: string;
  nameEn: string;
  keywords: string[];
}

export const AFFILIATE_CATEGORIES: AffiliateCategoryDefinition[] = [
  {
    id: "pots",
    nameKa: "ქოთნები & კაშპო",
    nameEn: "Pots & Planters",
    keywords: [
      "ქოთანი", "ქოთნები", "კაშპო", "კერამიკა", "თიხის", "პლასტმასის ქოთანი", "დამკიდი", "საკიდით",
      "საკიდი", "ლარნაკი", "სადგამი", "საჩითილე", "pot", "planter", "saucer", "ceramic pot"
    ],
  },
  {
    id: "soil",
    nameKa: "სუბსტრატი & გრუნტი",
    nameEn: "Soil & Substrates",
    keywords: [
      "სუბსტრატი", "მიწა", "გრუნტი", "ტორფი", "პერლიტი", "ვერმიკულიტი", "დრენაჟი",
      "კერამზიტი", "ფიჭვის ქერქი", "ქერქი", "ქოქოსის", "ქოქოსი", "სფაგნუმი", "ნახშირი", "soil", "peat", "perlite", "bark", "moss"
    ],
  },
  {
    id: "fertilizer",
    nameKa: "სასუქი & ვიტამინები",
    nameEn: "Fertilizers & Care",
    keywords: [
      "სასუქი", "ვიტამინი", "ბიოჰუმუსი", "სტიმულატორი", "ფესვის", "მავნებლების",
      "ფუნგიციდი", "ინსექტიციდი", "ფოთლოვანი", "ორგანული", "მინერალური", "fertilizer", "nutrient", "stimulator", "feed"
    ],
  },
  {
    id: "tools",
    nameKa: "ხელსაწყოები & ინვენტარი",
    nameEn: "Tools & Equipment",
    keywords: [
      "მაკრატელი", "სეკატორი", "პულვერიზატორი", "სარწყავი", "ხავსის საყრდენი",
      "საყრდენი", "ბადე", "ხელთათმანი", "ნიჩაბი", "ფიწალი", "ინსტრუმენტი", "ინსტრუმენტები",
      "ინსტრუმენტების", "ხელსაწყო", "ხელსაწყოები", "ხელსაწყოების", "ბაღის ინსტრუმენტები",
      "ნაკრები", "ფოცხი", "სასხლავი", "ხერხი", "შლანგი", "tools", "shears", "sprayer", "moss pole", "tool"
    ],
  },
  {
    id: "lighting",
    nameKa: "განათება & ფიტო-ნათურები",
    nameEn: "Grow Lights & Electrics",
    keywords: [
      "ფიტო", "ნათურა", "განათება", "ლედი", "ტაიმერი", "სანათი", "grow light", "led", "lamp"
    ],
  },
];

export const PLANT_SPECIFIC_KEYWORDS: Record<string, string[]> = {
  orchid: ["ორქიდეა", "ფალენოპსისი", "ორქიდეის", "orchid", "phalaenopsis"],
  succulent: ["სუკულენტი", "კაქტუსი", "კრასულა", "succulent", "cactus", "crassula"],
  monstera: ["მონსტერა", "ფილოდენდრონი", "ალოკაზია", "monstera", "philodendron", "alocasia"],
  ficus: ["ფიკუსი", "ficus", "ბენჯამინი", "ლირატა"],
  palm: ["პალმა", "ქამედორეა", "არეკა", "palm"],
  bonsai: ["ბონსაი", "bonsai"],
  citrus: ["ციტრუსი", "ლიმონი", "მანდარინი", "citrus", "lemon"],
  fern: ["გვიმრა", "fern", "ნეფროლეპისი"],
  sansevieria: ["სანსევიერია", "sansevieria"],
  zamioculcas: ["ზამიოკულკასი", "ზამია", "zamioculcas", "zz plant"],
};

/**
 * Automatically detects the primary category based on product title and description
 */
export function detectAffiliateCategory(name: string, description: string = ""): string {
  const combined = `${name} ${description}`.toLowerCase();

  for (const cat of AFFILIATE_CATEGORIES) {
    for (const kw of cat.keywords) {
      if (combined.includes(kw.toLowerCase())) {
        return cat.nameKa;
      }
    }
  }

  return "ინვენტარი";
}

/**
 * Automatically extracts matching botanical tags from product info
 */
export function detectAffiliateTags(name: string, description: string = ""): string[] {
  const combined = `${name} ${description}`.toLowerCase();
  const tags = new Set<string>();

  // 1. Check categories
  for (const cat of AFFILIATE_CATEGORIES) {
    for (const kw of cat.keywords) {
      if (combined.includes(kw.toLowerCase())) {
        tags.add(kw);
        tags.add(cat.nameKa.split(" ")[0]); // e.g. "ქოთნები", "სუბსტრატი"
        break;
      }
    }
  }

  // 2. Check plant-specific affinities
  for (const [plantKey, keywords] of Object.entries(PLANT_SPECIFIC_KEYWORDS)) {
    for (const kw of keywords) {
      if (combined.includes(kw.toLowerCase())) {
        tags.add(plantKey);
        tags.add(kw);
        break;
      }
    }
  }

  // Add generic fallback if empty
  if (tags.size === 0) {
    tags.add("ინვენტარი");
    tags.add("მცენარის მოვლა");
  }

  return Array.from(tags).slice(0, 8);
}

/**
 * Appends affiliate tracking params (e.g. ?ref=plantio) to target URL cleanly
 */
export function appendReferralParam(rawUrl: string, templateParam?: string): string {
  if (!rawUrl) return "";
  const param = templateParam?.trim() || "?ref=plantio";

  try {
    const url = new URL(rawUrl);
    // Parse key=value from templateParam (handles "?ref=plantio" or "ref=plantio" or "?utm_source=plantio")
    const cleanParam = param.startsWith("?") ? param.slice(1) : param;
    const searchParams = new URLSearchParams(cleanParam);
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
    return url.toString();
  } catch {
    // If URL parsing fails, string concatenation fallback
    if (rawUrl.includes("?")) {
      const extra = param.startsWith("?") ? param.slice(1) : param;
      return `${rawUrl}&${extra}`;
    }
    return `${rawUrl}${param.startsWith("?") ? param : `?${param}`}`;
  }
}
