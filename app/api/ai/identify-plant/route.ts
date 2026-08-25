import { NextRequest, NextResponse } from "next/server";
import { STRUCTURED_CATEGORIES } from "@/lib/categories-data";

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFiles = formData.getAll("images") as File[];
    const singleImage = (formData.get("image") || formData.get("file")) as File | null;

    const targetFile = singleImage || (imageFiles && imageFiles.length > 0 ? imageFiles[0] : null);

    if (!targetFile) {
      return NextResponse.json({ success: false, error: "ფოტო არ არის ატვირთული" }, { status: 400 });
    }

    const mimeType = targetFile.type || "image/jpeg";
    const buffer = await targetFile.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString("base64");

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "AI API Key არ არის კონფიგურირებული გარემოს ცვლადებში" },
        { status: 500 }
      );
    }

    const categoryListStr = STRUCTURED_CATEGORIES.map((c) => `${c.id} (${c.nameKa} / ${c.nameEn})`).join(", ");

    const prompt = `You are a master botanist and plant marketplace expert in Georgia.
Look at the attached plant / garden photo.
1. Identify the exact botanical species / cultivar (e.g. Lilium bulbiferum / Red Lily, Monstera deliciosa, Philodendron Pink Princess, Phalaenopsis Orchid, Ficus, Rose, Succulent, etc.).
2. Generate an attractive marketplace title and description in Georgian (ქართულად) and English.
3. Select the best category ID from this taxonomy list:
[${categoryListStr}]
4. Provide watering schedule in Georgian, light requirement in Georgian, difficulty ("Easy" | "Medium" | "Expert"), pet toxicity warning, and search tags.
IMPORTANT: Do NOT suggest or write any price.

Return ONLY raw JSON (STRICTLY NO markdown, NO codeblocks, NO preamble):
{
  "latinName": "Botanical Latin name (e.g. Lilium bulbiferum, Monstera deliciosa)",
  "commonName": "მცენარის ქართული სახელი (მაგ: შროშანი / აზიური ლილია)",
  "nameKa": "ქართული სახელი",
  "nameEn": "English common name",
  "titleKa": "მცენარის სახელი (ლათინური სახელი) — მოკლე სათაური",
  "titleEn": "English Name (Latin Name) — Listing Title",
  "descKa": "დეტალური, მიმზიდველი და ცოცხალი აღწერა ქართულად (მდგომარეობა, ყვავილობა/ფოთლები, მოვლა)",
  "descEn": "Detailed and appealing sales description in English",
  "categoryId": "best matching category ID from the list above",
  "careDifficulty": "Easy",
  "light": "კაშკაშა გაფანტული",
  "watering": "კვირაში 1-2 ჯერ",
  "toxicity": "ტოქსიკურია კატებისთვის (ან: უსაფრთხოა ცხოველებისთვის / Pet Friendly)",
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
            confidence_score: 95,
          },
        });
      } catch (err: any) {
        lastError = err.message || "Failed";
      }
    }

    return NextResponse.json({ success: false, error: lastError || "ამოცნობა ვერ მოხერხდა" }, { status: 502 });
  } catch (error: any) {
    console.error("Botanical identification error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to identify plant" }, { status: 500 });
  }
}
