import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 45; // PlantNet + Gemini text generation

// Botanical dictionary mapping genus/family/species to Georgian botanical taxonomy
const BOTANICAL_GEORGIAN_MAP: Record<string, { ka: string; en: string; category: string; careKa: string; careEn: string }> = {
  monstera: {
    ka: "მონსტერა",
    en: "Monstera",
    category: "monstera",
    careKa: "სჭირდება გაფანტული ნათელი სინათლე და ზომიერი მორწყვა ნიადაგის ზედა ფენის გაშრობის შემდეგ. უყვარს მაღალი ტენიანობა და ჰაეროვანი აროიდული სუბსტრატი.",
    careEn: "Requires bright indirect sunlight and moderate watering after topsoil dries out. Thrives in high humidity and chunky aroid soil.",
  },
  philodendron: {
    ka: "ფილოდენდრონი",
    en: "Philodendron",
    category: "philodendron",
    careKa: "სჭირდება საშუალო ან გაფანტული ნათელი სინათლე, რეგულარული მაგრამ ზომიერი მორწყვა. არ უყვარს წყლის ჩადგომა ფესვებში.",
    careEn: "Needs medium to bright indirect light and regular moderate watering. Avoid waterlogged soil.",
  },
  syngonium: {
    ka: "სინგონიუმი",
    en: "Syngonium",
    category: "syngonium",
    careKa: "უყვარს გაფანტული სინათლე და ზომიერი მორწყვა. ჭრელი და ვარდისფერი ჯიშები საჭიროებენ მეტ სინათლეს.",
    careEn: "Thrives in indirect light with moderate watering. Variegated cultivars need good ambient light.",
  },
  aglaonema: {
    ka: "აგლაონემა",
    en: "Aglaonema",
    category: "aglaonema",
    careKa: "გამძლე ოთახის მცენარეა. კარგად გრძნობს თავს ნახევრად ჩრდილშიც. მორწყეთ ნიადაგის შეშრობისას.",
    careEn: "Very hardy foliage plant. Tolerates low to medium light. Water when topsoil is dry.",
  },
  spathiphyllum: {
    ka: "სპატიფილუმი (ქალური ბედნიერება)",
    en: "Peace Lily",
    category: "spathiphyllum",
    careKa: "უყვარს ტენიანი ნიადაგი და გაფანტული სინათლე. მორწყეთ რეგულარულად და მოარიდეთ პირდაპირ მზეს.",
    careEn: "Prefers consistent moisture and filtered light. Keep out of direct harsh sun.",
  },
  dieffenbachia: {
    ka: "დიფენბახია",
    en: "Dieffenbachia",
    category: "dieffenbachia",
    careKa: "დიდი და ეფექტური ფოთლები. სჭირდება ზომიერი სინათლე და ნიადაგის ზედაპირის გაშრობისას მორწყვა.",
    careEn: "Bold patterned leaves. Needs moderate ambient light and topsoil-dry watering.",
  },
  ficus: {
    ka: "ფიკუსი",
    en: "Ficus",
    category: "ficus",
    careKa: "სჭირდება უხვი გაფანტული სინათლე და სტაბილური ტემპერატურა. მორწყვა ზომიერად, ზედა ფენის გაშრობისას. მოარიდეთ ორპირ ქარს.",
    careEn: "Requires abundant indirect light and stable temperature. Water when top few inches dry out. Keep away from drafts.",
  },
  anthurium: {
    ka: "ანთურიუმი",
    en: "Anthurium",
    category: "anthurium",
    careKa: "უყვარს თბილი, ტენიანი გარემო და გაფანტული სინათლე. მორწყეთ მხოლოდ მაშინ, როცა სუბსტრატის ზედა ნახევარი შეშრება.",
    careEn: "Prefers warm, humid environment with filtered light. Water when top half of substrate is dry.",
  },
  alocasia: {
    ka: "ალოკაზია",
    en: "Alocasia",
    category: "alocasia",
    careKa: "სჭირდება კაშკაშა გაფანტული სინათლე და მუდმივად ოდნავ ტენიანი, თუმცა კარგად დრენირებადი სუბსტრატი. მოარიდეთ პირდაპირ მზეს.",
    careEn: "Requires bright filtered light and constantly slightly moist, well-draining soil mix.",
  },
  epipremnum: {
    ka: "პოთოსი (ეპიპრემნუმი)",
    en: "Pothos (Epipremnum)",
    category: "pothos-scindapsus",
    careKa: "ძალიან მარტივად მოსავლელი მცენარეა. კარგად იტანს ჩრდილსაც, მორწყვა საჭიროა მხოლოდ ნიადაგის გაშრობისას.",
    careEn: "Very easy care trailing houseplant. Tolerates lower light, water thoroughly once dry.",
  },
  scindapsus: {
    ka: "სცინდაპსუსი",
    en: "Scindapsus",
    category: "pothos-scindapsus",
    careKa: "უყვარს გაფანტული სინათლე და ზომიერი მორწყვა. ხავერდოვანი და ჭრელი ფოთლები ინარჩუნებს ფერს კარგ განათებაზე.",
    careEn: "Thrives in indirect light with moderate watering. Keeps vibrant foliage under bright ambient light.",
  },
  calathea: {
    ka: "კალათეა",
    en: "Calathea",
    category: "calathea",
    careKa: "უყვარს ნახევრად ჩრდილი და მაღალი ჰაერის ტენიანობა. მორწყეთ რბილი/გაფილტრული წყლით.",
    careEn: "Prefers medium indirect light and high humidity. Sensitive to tap water chemicals.",
  },
  maranta: {
    ka: "მარანტა",
    en: "Maranta",
    category: "calathea",
    careKa: "საღამოს კეცავს ფოთლებს. უყვარს რბილი გაფანტული სინათლე და ტენიანი გარემო.",
    careEn: "Folds leaves at night. Enjoys soft diffused light and high humidity.",
  },
  sansevieria: {
    ka: "სანსევიერია (ხანჯალა)",
    en: "Sansevieria (Snake Plant)",
    category: "sansevieria",
    careKa: "გამორჩეულად გამძლე მცენარეა. იტანს როგორც ჩრდილს, ისე მზეს. მორწყვა სჭირდება იშვიათად (თვეში 2-3 ჯერ).",
    careEn: "Extremely resilient plant. Tolerates low light and drought. Water sparingly once fully dry.",
  },
  dracaena: {
    ka: "დრაცენა",
    en: "Dracaena",
    category: "dracaena-cordyline",
    careKa: "უპრეტენზიო ოთახის მცენარეა. სჭირდება ზომიერი განათება და ზომიერი მორწყვა.",
    careEn: "Low-maintenance houseplant. Prefers moderate light and infrequent watering.",
  },
  schefflera: {
    ka: "შეფლერა (ქოლგის ხე)",
    en: "Schefflera",
    category: "schefflera",
    careKa: "სჭირდება გაფანტული ნათელი სინათლე და ზომიერი მორწყვა.",
    careEn: "Prefers bright filtered light and moderate watering.",
  },
  zamioculcas: {
    ka: "ზამიოკულკასი (ZZ Plant)",
    en: "ZZ Plant (Zamioculcas)",
    category: "zz-plant",
    careKa: "უძლებს მშრალ ჰაერს, ჩრდილს და იშვიათ მორწყვას. იდეალურია დაკავებული ადამიანებისთვის და ოფისებისთვის.",
    careEn: "Drought and low-light tolerant. Ideal hardy plant for busy collectors and office spaces.",
  },
  crassula: {
    ka: "კრასულა (ბარაქის ხე)",
    en: "Jade Plant (Crassula)",
    category: "cactus-succulent",
    careKa: "სუქულენტი, რომელსაც უყვარს ბევრი მზე და იშვიათი მორწყვა. სჭირდება სუქულენტების ქვიშიანი გრუნტი.",
    careEn: "Sun-loving succulent requiring direct or bright light and sparse watering.",
  },
  echeveria: {
    ka: "ეჩევერია",
    en: "Echeveria",
    category: "cactus-succulent",
    careKa: "კომპაქტური სუქულენტი. სჭირდება მზიანი ფანჯრის რაფა და იშვიათი მორწყვა.",
    careEn: "Rosette succulent needing full sun and minimal watering.",
  },
  haworthia: {
    ka: "ჰავორტია",
    en: "Haworthia",
    category: "cactus-succulent",
    careKa: "კომპაქტური სუქულენტი. იტანს გაფანტულ შუქსაც, მორწყეთ იშვიათად.",
    careEn: "Compact succulent thriving in bright indirect sun with minimal watering.",
  },
  aloe: {
    ka: "ალოე (Aloe)",
    en: "Aloe",
    category: "cactus-succulent",
    careKa: "სამკურნალო სუქულენტი. სჭირდება მზე და მშრალი, ქვიშიანი გრუნტი.",
    careEn: "Medicinal succulent needing full sun and well-draining dry soil.",
  },
  phalaenopsis: {
    ka: "ორქიდეა (ფალენოპსისი)",
    en: "Phalaenopsis Orchid",
    category: "orchid",
    careKa: "სჭირდება გამჭვირვალე ქოთანი, ფიჭვის ქერქის სუბსტრატი, გაფანტული სინათლე და მორწყვა დალბობის მეთოდით.",
    careEn: "Requires transparent pot, bark mix, filtered sunlight and soak-and-dry watering.",
  },
  dendrobium: {
    ka: "დენდრობიუმ ორქიდეა",
    en: "Dendrobium Orchid",
    category: "orchid",
    careKa: "უხვი ყვავილობა, სჭირდება კაშკაშა გაფანტული სინათლე და ქერქის სუბსტრატი.",
    careEn: "Bright indirect light and bark substrate with soak watering.",
  },
  hoya: {
    ka: "ხოია (ცვილისებრი ყვავილი)",
    en: "Hoya",
    category: "hoya",
    careKa: "სჭირდება კაშკაშა სინათლე და მორწყვა ნიადაგის სრულად გაშრობისას.",
    careEn: "Bright ambient light and soak-and-dry watering.",
  },
  begonia: {
    ka: "ბეგონია",
    en: "Begonia",
    category: "begonia",
    careKa: "ჭრელი დეკორატიული ფოთლები. სჭირდება ზომიერი ტენი და რბილი სინათლე.",
    careEn: "Vibrant foliage requiring moderate humidity and soft light.",
  },
  peperomia: {
    ka: "პეპერომია",
    en: "Peperomia",
    category: "peperomia",
    careKa: "კომპაქტური ოთახის მცენარე. უყვარს გაფანტული შუქი და ზომიერი მორწყვა.",
    careEn: "Compact houseplant loving indirect sun and light watering.",
  },
  citrus: {
    ka: "ციტრუსი (ლიმონი / მანდარინი)",
    en: "Citrus",
    category: "citrus-fruit",
    careKa: "სჭირდება მაქსიმალური მზის სინათლე და რეგულარული კვება ციტრუსების სასუქით.",
    careEn: "Needs maximum sunlight and regular citrus fertilizer feedings.",
  },
};

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: "სურათის მონაცემები არ არის გადაცემული" },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.PLANTNET_API_KEY ||
      process.env.NEXT_PUBLIC_PLANTNET_API_KEY ||
      "2b10FWMXQ5QkdV37AEvs6V9Aa";

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Pl@ntNet API Key არ არის კონფიგურირებული" },
        { status: 500 }
      );
    }

    // Clean base64 string if it has data URL header
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
    const imageBuffer = Buffer.from(cleanBase64, "base64");

    // Construct multipart/form-data for Pl@ntNet API
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: mimeType });
    formData.append("images", blob, "plant.jpg");
    formData.append("organs", "leaf");

    const plantnetUrl = `https://my-api.plantnet.org/v2/identify/all?include-related-images=false&lang=en&api-key=${encodeURIComponent(apiKey.trim())}`;

    const response = await fetch(plantnetUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn("[Pl@ntNet API Error]:", response.status, errorText);
      return NextResponse.json(
        {
          success: false,
          error: `Pl@ntNet API შეცდომა (${response.status}): დარწმუნდით რომ ფოტოზე მცენარე ნათლად ჩანს.`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return NextResponse.json(
        { success: false, error: "Pl@ntNet-მა მცენარე ვერ ამოიცნო. სცადეთ სხვა ფოტოს ატვირთვა." },
        { status: 404 }
      );
    }

    // Best matching result
    const bestMatch = data.results[0];
    const score = bestMatch.score || 0;
    const species = bestMatch.species || {};
    const scientificName = species.scientificNameWithoutAuthor || data.bestMatch || "Plant";
    const genus = (species.genus?.scientificNameWithoutAuthor || "").toLowerCase();
    const family = (species.family?.scientificNameWithoutAuthor || "").toLowerCase();
    const commonNames: string[] = species.commonNames || [];
    const bestCommonNameEn = commonNames[0] || scientificName;

    // Lookup Georgian botanical mapping
    const matchedTaxon =
      BOTANICAL_GEORGIAN_MAP[genus] ||
      (family.includes("cact") ? BOTANICAL_GEORGIAN_MAP["echeveria"] : null) ||
      (family.includes("orchid") ? BOTANICAL_GEORGIAN_MAP["phalaenopsis"] : null);

    const nameKa = matchedTaxon ? matchedTaxon.ka : scientificName;
    const plantCategory = matchedTaxon ? matchedTaxon.category : "other-plant";
    const careKa = matchedTaxon ? matchedTaxon.careKa : "სჭირდება გაფანტული სინათლე და რეგულარული ზომიერი მორწყვა ნიადაგის ზედაპირის შეშრობისას.";
    const careEn = matchedTaxon ? matchedTaxon.careEn : "Requires bright indirect light and moderate watering when topsoil dries.";

    const titleKa = `${nameKa} — ${scientificName}`;
    const titleEn = `${scientificName} (${bestCommonNameEn})`;

    // ─── Supabase helpers for cache ───────────────────────────────────────────
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");
    const cacheHeaders = {
      "Content-Type": "application/json",
      "apikey": serviceKey || anonKey,
      "Authorization": `Bearer ${serviceKey || anonKey}`,
    };

    // ─── 1. Check species cache first ────────────────────────────────────────
    let descKa = `ჯანსაღი ${nameKa} (${scientificName}). ${careKa}`;
    let descEn = `Healthy ${scientificName} (${bestCommonNameEn}). ${careEn}`;
    let fromCache = false;

    try {
      const cacheRes = await fetch(
        `${supabaseUrl}/rest/v1/plant_species_cache?scientific_name=ilike.${encodeURIComponent(scientificName)}&select=description_ka,description_en,hit_count&limit=1`,
        { headers: cacheHeaders }
      );
      if (cacheRes.ok) {
        const cacheRows = await cacheRes.json();
        if (cacheRows && cacheRows.length > 0 && cacheRows[0].description_ka) {
          descKa = cacheRows[0].description_ka;
          if (cacheRows[0].description_en) descEn = cacheRows[0].description_en;
          fromCache = true;
          // Increment hit counter async (fire and forget)
          fetch(
            `${supabaseUrl}/rest/v1/plant_species_cache?scientific_name=ilike.${encodeURIComponent(scientificName)}`,
            {
              method: "PATCH",
              headers: cacheHeaders,
              body: JSON.stringify({ hit_count: (cacheRows[0].hit_count || 1) + 1 }),
            }
          ).catch(() => {});
        }
      }
    } catch (cacheErr) {
      console.warn("[Cache lookup failed, continuing without cache]", cacheErr);
    }

    // ─── 2. Generate description with Gemini if not in cache ─────────────────
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!fromCache && geminiKey) {
      try {
        const allCommonNames = commonNames.slice(0, 3).join(", ") || bestCommonNameEn;
        const geminiPrompt = `შენ ხარ მცენარეების ექსპერტი. მომხმარებელი ყიდის ან გაცვლის შემდეგ მცენარეს:

სამეცნიერო სახელი: ${scientificName}
საერთო სახელები: ${allCommonNames}
ქართული სახელი: ${nameKa}
ოჯახი: ${family || "უცნობი"}

დაწერე მოკლე, **რეალისტური და ინფორმაციული** განცხადების აღწერა ქართულად (3-4 წინადადება, ემოჯი ნებადართულია). გამოყენება: მცენარის გაყიდვის/გაცვლის განცხადება ქართულ ბაზარზე.

შეიტანე:
• მცენარის გარეგნული მახასიათებლები (ფოთლები, ზომა, ფერი)
• სად გვხვდება ბუნებრივად (ტროპიკები, ამერიკა, აფრიკა და ა.შ.)
• მოვლის ძირითადი მოთხოვნები (განათება + მორწყვა) — კონკრეტულად
• ოთახის გამყოფად/ოფისში/სახლში გამოყენება

ნუ გამოიყენებ ზოგად ფრაზებს. ნუ დაწყებ "ეს არის". პასუხი: მხოლოდ ტექსტი.`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: geminiPrompt }] }],
              generationConfig: { maxOutputTokens: 320, temperature: 0.75 },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const generated = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (generated && generated.length > 30) {
            descKa = generated;

            // ─── 3. Save to cache (async, fire-and-forget) ──────────────────
            fetch(`${supabaseUrl}/rest/v1/plant_species_cache`, {
              method: "POST",
              headers: {
                ...cacheHeaders,
                "Prefer": "resolution=merge-duplicates",
              },
              body: JSON.stringify({
                scientific_name: scientificName,
                genus: genus || null,
                common_name_en: bestCommonNameEn,
                name_ka: nameKa,
                description_ka: descKa,
                description_en: descEn,
                plant_category: plantCategory,
                hit_count: 1,
              }),
            }).catch((e) => console.warn("[Cache write failed]", e));
          }
        }
      } catch (geminiErr) {
        console.warn("[Gemini description generation failed, using fallback]", geminiErr);
      }
    }

    const tags = Array.from(
      new Set(
        [
          nameKa,
          scientificName,
          genus ? genus.charAt(0).toUpperCase() + genus.slice(1) : "",
          bestCommonNameEn,
          "ოთახის მცენარე",
        ].filter(Boolean)
      )
    );

    return NextResponse.json({
      success: true,
      provider: "plantnet",
      fromCache,
      score: Math.round(score * 100) / 100,
      data: {
        latinName: scientificName,
        nameKa,
        nameEn: bestCommonNameEn,
        titleKa,
        titleEn,
        descKa,
        descEn,
        category: "PLANT",
        plantCategory,
        careLevel: "საშუალო",
        tags,
      },
    });
  } catch (err: any) {
    console.error("[Pl@ntNet Route Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Pl@ntNet სერვერთან კავშირი ვერ დამყარდა" },
      { status: 500 }
    );
  }
}

