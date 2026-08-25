import { NextRequest, NextResponse } from "next/server";
import { STRUCTURED_CATEGORIES } from "@/lib/categories-data";

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let base64Image = "";
    let mimeType = "image/jpeg";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const files = formData.getAll("images") as File[];
      const single = (formData.get("image") || formData.get("file")) as File | null;
      const target = single || (files.length > 0 ? files[0] : null);

      if (!target) {
        return NextResponse.json({ success: false, error: "სურათი ვერ მოიძებნა" }, { status: 400 });
      }

      mimeType = target.type || "image/jpeg";
      const buffer = await target.arrayBuffer();
      base64Image = Buffer.from(buffer).toString("base64");
    } else {
      const body = await req.json();
      const raw = body.imageBase64 || body.image || "";
      if (!raw) {
        return NextResponse.json({ success: false, error: "სურათი ვერ მოიძებნა" }, { status: 400 });
      }
      mimeType = body.mimeType || "image/jpeg";
      base64Image = raw.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "AI API Key არ არის კონფიგურირებული" },
        { status: 500 }
      );
    }

    const categoryListStr = STRUCTURED_CATEGORIES.map((c) => `${c.id} (${c.nameKa} / ${c.nameEn})`).join(", ");

    const prompt = `You are a master botanist and plant specialist in Georgia.
Look at this plant photo.
1. Identify the exact botanical species (e.g. Lilium bulbiferum, Monstera, Philodendron, Orchid, Ficus, etc.).
2. Write an attractive marketplace title and description in Georgian (ქართულად) and English.
3. Select the best category ID from this taxonomy list:
[${categoryListStr}]
4. Provide watering schedule in Georgian, light requirement in Georgian, difficulty ("Easy" | "Medium" | "Expert"), pet toxicity warning, and search tags.
IMPORTANT: Do NOT suggest any price.

Return ONLY raw JSON (STRICTLY NO markdown, NO codeblocks):
{
  "latinName": "Botanical Latin name",
  "commonName": "ქართული სახელი (მაგ: შროშანი / აზიური ლილია)",
  "nameKa": "ქართული სახელი",
  "nameEn": "English common name",
  "titleKa": "მცენარის სახელი (ლათინური სახელი) — მოკლე სათაური",
  "titleEn": "English Name (Latin Name) — Listing Title",
  "descKa": "დეტალური და მიმზიდველი აღწერა ქართულად",
  "descEn": "Detailed marketplace description in English",
  "categoryId": "category ID from list",
  "careDifficulty": "Easy",
  "light": "კაშკაშა გაფანტული",
  "watering": "კვირაში 1-2 ჯერ",
  "toxicity": "ტოქსიკურია კატებისთვის (ან: უსაფრთხოა ცხოველებისთვის)",
  "tags": ["მცენარე", "ყვავილოვანი", "იშვიათი"]
}`;

    const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-flash", "gemini-1.5-pro"];
    let lastError = "";

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
                temperature: 0.15,
                topK: 32,
                topP: 0.95,
              },
            }),
          }
        );

        const data = await response.json();
        if (!response.ok) {
          lastError = data?.error?.message || `HTTP ${response.status}`;
          continue;
        }

        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) continue;

        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) continue;

        const parsed = JSON.parse(jsonMatch[0]);

        let matchedCategory = parsed.categoryId || parsed.category || "other-plant";
        const validCategory = STRUCTURED_CATEGORIES.find((c) => c.id === matchedCategory);
        if (!validCategory) {
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
            itemType: "PLANT",
            careDifficulty: parsed.careDifficulty || "Easy",
            light: parsed.light || "კაშკაშა გაფანტული",
            watering: parsed.watering || "კვირაში 1-2 ჯერ",
            toxicity: parsed.toxicity || "გადაამოწმეთ",
            tags: Array.isArray(parsed.tags) ? parsed.tags : ["მცენარე"],
            confidence_score: 96,
          },
        });
      } catch (err: any) {
        lastError = err.message || "Failed";
      }
    }

    return NextResponse.json({ success: false, error: lastError || "Plant.id ამოცნობა ვერ მოხერხდა" }, { status: 502 });
  } catch (error: any) {
    console.error("Plant.id identification error:", error);
    return NextResponse.json({ success: false, error: error.message || "Plant.id სერვისთან კავშირი შეწყდა" }, { status: 500 });
  }
}
