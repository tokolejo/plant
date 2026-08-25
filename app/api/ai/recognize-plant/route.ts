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

    const prompt = `Identify this plant / flower / gardening item.
Rules:
1. "titleKa": ONLY the plant name in Georgian (e.g. "შროშანი", "მონსტერა დელიციოზა", "ფიკუსი ელასტიკა"). STRICTLY NO care tips or extra sentences in the title.
2. "titleEn": ONLY the English plant name (e.g. "Lily", "Monstera Deliciosa", "Rubber Tree").
3. "descKa": Brief 1-sentence visual description in Georgian only (NO watering/care tips here). E.g. "ჯანსაღი, ხასხასა ფოთლებით გამორჩეული დეკორატიული მცენარე."
4. "descEn": Brief 1-sentence visual description in English only.
5. "latinName": Exact botanical binomial Latin name (e.g. "Monstera deliciosa", "Crassula ovata"). ALWAYS in Latin.
6. "categoryId": closest ID from: [${categoryListStr}].
7. Botanical fields: "careDifficulty" ("Easy"|"Medium"|"Expert"), "light" (Georgian), "lightEn" (English), "watering" (Georgian), "wateringEn" (English), "toxicity" (Georgian), "toxicityEn" (English), "tags" (array of 3-5 strings).

Return ONLY raw JSON (no markdown):
{
  "titleKa": "მცენარის სახელი",
  "titleEn": "Plant Name",
  "latinName": "Botanical Latin Name",
  "descKa": "მოკლე ვიზუალური აღწერა (1 წინადადება)",
  "descEn": "Brief 1-sentence visual description",
  "categoryId": "category-id",
  "careDifficulty": "Easy",
  "light": "კაშკაშა გაფანტული",
  "lightEn": "Bright indirect light",
  "watering": "კვირაში 1-ხელ",
  "wateringEn": "Weekly when topsoil dries",
  "toxicity": "უსაფრთხოა ცხოველებისთვის",
  "toxicityEn": "Non-toxic to pets",
  "tags": ["ტეგი1", "ტეგი2", "ტეგი3"]
}`;

    const modelsToTry = [
      "gemini-3.5-flash-lite",
      "gemini-flash-latest",
      "gemini-3.6-flash",
      "gemini-3.7-flash",
    ];

    let lastErrorMsg = "";

    for (const model of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
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
            lightKa: parsed.light || "კაშკაშა გაფანტული",
            lightEn: parsed.lightEn || "Bright indirect light",
            watering: parsed.watering || "კვირაში 1-ხელ",
            wateringKa: parsed.watering || "კვირაში 1-ხელ",
            wateringEn: parsed.wateringEn || "Weekly when topsoil dries",
            toxicity: parsed.toxicity || "გადაამოწმეთ",
            toxicityKa: parsed.toxicity || "გადაამოწმეთ",
            toxicityEn: parsed.toxicityEn || "Check toxicity",
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
