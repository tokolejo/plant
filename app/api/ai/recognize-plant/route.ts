import { NextRequest, NextResponse } from "next/server";
import { STRUCTURED_CATEGORIES } from "@/lib/categories-data";

export const maxDuration = 45; // 45 seconds max duration for vision analysis

export async function POST(req: NextRequest) {
  try {
    let base64Image = "";
    let mimeType = "image/jpeg";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = (formData.get("image") || formData.get("file")) as File | null;
      const images = formData.getAll("images") as File[];
      const targetFile = file || (images && images.length > 0 ? images[0] : null);

      if (!targetFile) {
        return NextResponse.json(
          { success: false, error: "ფოტო არ არის გადაცემული" },
          { status: 400 }
        );
      }

      mimeType = targetFile.type || "image/jpeg";
      const buffer = await targetFile.arrayBuffer();
      base64Image = Buffer.from(buffer).toString("base64");
    } else {
      const body = await req.json();
      const rawBase64 = body.imageBase64 || body.image || "";
      if (!rawBase64) {
        return NextResponse.json(
          { success: false, error: "სურათის მონაცემები არ არის გადაცემული" },
          { status: 400 }
        );
      }
      mimeType = body.mimeType || "image/jpeg";
      base64Image = rawBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Gemini API Key არ არის კონფიგურირებული გარემოს ცვლადებში (GEMINI_API_KEY)",
        },
        { status: 500 }
      );
    }

    const categoryListStr = STRUCTURED_CATEGORIES.map((c) => `${c.id} (${c.nameKa} / ${c.nameEn})`).join(", ");

    const prompt = `You are a world-class master botanist, horticulturist, and plant marketplace specialist in Georgia.
Look carefully at the provided plant / flower / garden / gardening item photo.

1. Accurately identify the exact plant species, flower, cultivar, or gardening item shown (e.g. Red Lily / Lilium bulbiferum / Asiatic Lily, Monstera deliciosa, Philodendron Pink Princess, Orchid Phalaenopsis, Ficus Lyrata, Ceramic Pot, Substrate Mix, etc.).
2. Translate and formulate a highly professional, accurate, and appealing marketplace title and description in Georgian (ქართულად) and English.
3. Determine the closest category ID from this taxonomy list:
[${categoryListStr}]
4. Provide accurate botanical care details: watering schedule in Georgian, light requirement in Georgian, difficulty ("Easy" | "Medium" | "Expert"), pet toxicity warning, and search tags.
IMPORTANT: Do NOT suggest or write any price.

Return ONLY a raw JSON object (STRICTLY NO markdown, NO \`\`\`json codeblocks, NO preamble):
{
  "latinName": "Exact botanical binomial Latin name (e.g. Lilium bulbiferum, Monstera deliciosa, Philodendron erubescens)",
  "commonName": "მცენარის პოპულარული ქართული სახელი (მაგ: შროშანი / წითელი ლილია, მონსტერა დელიციოზა, ორქიდეა)",
  "nameKa": "ქართული სახელი",
  "nameEn": "English common name (e.g. Red Asiatic Lily, Swiss Cheese Plant)",
  "titleKa": "მცენარის ქართული სახელი (ლათინური სახელი) — მოკლე სათაური (მაგ: შროშანი (Lilium bulbiferum) — ჯანსაღი ყვავილოვანი მცენარე)",
  "titleEn": "English Title (e.g. Red Asiatic Lily (Lilium bulbiferum) — Healthy Plant)",
  "descKa": "დეტალური, ცოცხალი და მიმზიდველი აღწერა ქართულად (აღწერე მცენარის ჯანმრთელობა, ყვავილობა/ფოთლები, სიმაღლე, მოვლის რჩევები და სად გრძნობს თავს საუკეთესოდ)",
  "descEn": "Detailed and attractive marketplace description in English (condition, foliage/blooms, care advice, growth habit)",
  "categoryId": "the best matching category ID from the taxonomy list above (e.g. outdoor-garden, monstera, philodendron, orchid, cactus-succulent, bonsai, ficus, etc.)",
  "itemType": "PLANT",
  "careDifficulty": "Easy",
  "light": "კაშკაშა გაფანტული / მზის სინათლე",
  "watering": "კვირაში 1-2 ჯერ (ნიადაგის შეშრობისას)",
  "toxicity": "ტოქსიკურია კატებისთვის (ან: უსაფრთხოა ცხოველებისთვის / Pet Friendly)",
  "tags": ["შროშანი", "ლილია", "Lilium", "ბაღის მცენარე", "ყვავილოვანი", "იშვიათი"]
}`;

    const modelsToTry = [
      "gemini-1.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash-8b",
      "gemini-2.5-flash",
    ];

    let lastErrorMsg = "";

    for (const model of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inline_data: {
                        mime_type: mimeType,
                        data: base64Image,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 550,
                topK: 20,
                topP: 0.9,
              },
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          lastErrorMsg = data?.error?.message || `HTTP ${response.status}`;
          console.warn(`[Gemini API - ${model}] failed:`, lastErrorMsg);
          continue;
        }

        const candidate = data.candidates?.[0];
        const rawText = candidate?.content?.parts?.[0]?.text;

        if (!rawText) {
          lastErrorMsg = "Gemini-მ არ დააბრუნა პასუხი";
          continue;
        }

        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          lastErrorMsg = "Gemini-მ არ დააბრუნა ვალიდური JSON მონაცემები";
          continue;
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Normalize and validate category
        let matchedCategory = parsed.categoryId || parsed.category || "other-plant";
        const validCategory = STRUCTURED_CATEGORIES.find((c) => c.id === matchedCategory);
        if (!validCategory) {
          // Attempt fuzzy match on Latin name or tags
          const latin = (parsed.latinName || "").toLowerCase();
          const autoMatch = STRUCTURED_CATEGORIES.find((c) =>
            c.keywords.some((k) => latin.includes(k.toLowerCase()))
          );
          matchedCategory = autoMatch ? autoMatch.id : "other-plant";
        }

        return NextResponse.json({
          success: true,
          data: {
            titleKa: parsed.titleKa || parsed.nameKa || "მცენარე",
            titleEn: parsed.titleEn || parsed.nameEn || "Plant",
            descKa: parsed.descKa || "",
            descEn: parsed.descEn || "",
            botanicalName: parsed.latinName || "",
            commonName: parsed.commonName || parsed.nameKa || "",
            category: matchedCategory,
            itemType: parsed.itemType || (matchedCategory.startsWith("pots") || matchedCategory.startsWith("substrates") || matchedCategory.startsWith("tools") ? "INVENTORY" : "PLANT"),
            careDifficulty: parsed.careDifficulty || "Easy",
            light: parsed.light || "კაშკაშა გაფანტული",
            watering: parsed.watering || "კვირაში 1-ხელ",
            toxicity: parsed.toxicity || "გადაამოწმეთ",
            tags: Array.isArray(parsed.tags) ? parsed.tags : ["მცენარე"],
          },
          modelUsed: model,
        });
      } catch (err: any) {
        lastErrorMsg = err.message || "Parse or network error";
        console.warn(`[Gemini API - ${model}] error:`, err);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: lastErrorMsg || "ვერ მოხერხდა მცენარის AI ანალიზის დასრულება. სცადეთ ხელახლა.",
      },
      { status: 502 }
    );
  } catch (error: any) {
    console.error("[Recognize Plant API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "სერვერის შეცდომა" },
      { status: 500 }
    );
  }
}
