import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30; // 30 seconds max duration

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: "სურათის მონაცემები არ არის გადაცემული" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Gemini API Key არ არის კონფიგურირებული" },
        { status: 500 }
      );
    }

    // Clean base64 string if it has data url prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");

    const prompt = `You are an expert botanist, horticulturist, and plant marketplace copywriter in Georgia.
Analyze the plant or gardening product shown in the provided photo.
Identify its exact botanical (Latin) name and common Georgian & English names, health status, and care requirements.
IMPORTANT: Do NOT estimate or suggest any price.

Return ONLY a raw JSON object (strictly no markdown formatting, no codeblocks, no explanations) adhering exactly to this JSON schema:
{
  "latinName": "Exact botanical Latin name (e.g. Monstera deliciosa, Epipremnum aureum, Ficus lyrata)",
  "nameKa": "მცენარის ან ნივთის ქართული სახელი (მაგ: მონსტერა დელიციოზა)",
  "nameEn": "English common name (e.g. Swiss Cheese Plant / Monstera)",
  "titleKa": "მცენარის ქართული სახელი (ლათინური სახელი) — მოკლე მიმზიდველი სათაური (მაგ: მონსტერა დელიციოზა (Monstera deliciosa) — ჯანსაღი ოთახის მცენარე)",
  "titleEn": "English Name (Latin Name) — Attractive Listing Title (e.g. Golden Pothos (Epipremnum aureum) — Healthy Houseplant)",
  "descKa": "ბუნებრივი, დეტალური და მიმზიდველი გაყიდვის აღწერა ქართულად (აღწერე მცენარის მდგომარეობა, ფოთლები, ქოთანი, ზრდის პოტენციალი და მოვლის მოკლე რჩევა)",
  "descEn": "Natural, detailed and appealing sales description in English (health condition, foliage, pot, growth habits, and quick care advice)",
  "category": "PLANT",
  "careLevel": "მარტივი",
  "light": "ირიბი გაფანტული სინათლე",
  "watering": "ზომიერი მორწყვა, ნიადაგის გამოშრობისას",
  "tags": ["მცენარე", "ოთახის ყვავილი", "იშვიათი"]
}

Note for 'category': Use "PLANT" if it's a living plant, seedling, cutting, flower, cactus, tree, bonsai, etc. Use "INVENTORY" if it's a pot, soil/substrate, tool, fertilizer, trellis, lamp, or accessory.`;

    // Multi-model array for automatic failover in case of traffic spikes
    const modelsToTry = [
      "gemini-3.6-flash",
      "gemini-flash-latest",
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
                        data: cleanBase64,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                topK: 32,
                topP: 0.95,
              },
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          lastErrorMsg = data?.error?.message || `HTTP ${response.status}`;
          console.warn(`[Gemini API - ${model}] failed:`, lastErrorMsg);
          continue; // Try next model
        }

        const candidate = data.candidates?.[0];
        const rawText = candidate?.content?.parts?.[0]?.text;

        if (!rawText) {
          lastErrorMsg = "Gemini-მ არ დააბრუნა პასუხი";
          continue;
        }

        // Clean any markdown backticks if returned
        const cleanedJson = rawText
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();

        const parsedData = JSON.parse(cleanedJson);

        return NextResponse.json({
          success: true,
          data: parsedData,
          modelUsed: model,
        });
      } catch (err: any) {
        lastErrorMsg = err.message || "Parse or network error";
        console.warn(`[Gemini API - ${model}] error:`, err);
      }
    }

    // Fallback if all attempts failed
    return NextResponse.json(
      {
        success: false,
        error: lastErrorMsg || "ვერ მოხერხდა AI ანალიზის დასრულება",
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
