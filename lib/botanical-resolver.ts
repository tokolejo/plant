import { lookupBotanicalTaxon, BotanicalTaxon } from "./botanical-dictionary";
import { STRUCTURED_CATEGORIES } from "./categories-data";

// In-memory runtime cache for dynamically resolved species across requests
const dynamicTaxonCache = new Map<string, BotanicalTaxon>();

const VALID_CATEGORY_IDS = STRUCTURED_CATEGORIES.map((c) => c.id);

/**
 * Intelligently resolves any plant (local dictionary or dynamic Gemini AI classification).
 * Ensures 100% of recognized plants get:
 * - Proper Georgian title & common name
 * - Accurate category from STRUCTURED_CATEGORIES
 * - Precise care instructions (watering, light, difficulty, toxicity)
 * - Search tags
 */
export async function resolveIntelligentBotanicalTaxon(
  scientificName: string,
  commonNames: string[] = []
): Promise<BotanicalTaxon> {
  const cleanName = (scientificName || "").trim();
  const cacheKey = cleanName.toLowerCase();

  // 1. Check in-memory dynamic cache first
  if (dynamicTaxonCache.has(cacheKey)) {
    return dynamicTaxonCache.get(cacheKey)!;
  }

  // 2. Check local botanical dictionary
  const localMatch = lookupBotanicalTaxon(cleanName, commonNames);
  
  // If local match has a specific category and recognized genus (not generic fallback)
  const isGenericFallback = localMatch.categoryId === "other-plant" && localMatch.tags.includes("მცენარე");

  if (!isGenericFallback) {
    dynamicTaxonCache.set(cacheKey, localMatch);
    return localMatch;
  }

  // 3. Dynamic AI Classification & Translation for rare/unknown species
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    return localMatch;
  }

  try {
    const prompt = `You are an expert botanist and Georgian plant translator.
Classify the following plant:
- Scientific Name: "${cleanName}"
- Common Names: ${JSON.stringify(commonNames)}

Available Category IDs in our database:
${VALID_CATEGORY_IDS.join(", ")}

Respond with ONLY a valid JSON object in this exact schema:
{
  "ka": "Georgian plant name (e.g. 'დისქიდია' or 'ჰოია' or 'ალოე' - ONLY plant name, no sentences)",
  "en": "English common name (e.g. 'String of Nickels')",
  "categoryId": "one of the available Category IDs listed above (e.g. 'cactus-succulent', 'rare-variegated', 'monstera', 'ficus', 'orchid', 'outdoor-garden', etc.)",
  "wateringKa": "მორწყვის სიხშირე ქართულად (მაგ: 'კვირაში 1-ხელ (შეშრობისას)')",
  "wateringEn": "Watering schedule in English",
  "lightKa": "სინათლის მოთხოვნა ქართულად (მაგ: 'კაშკაშა გაფანტული')",
  "lightEn": "Light requirement in English",
  "difficulty": "Easy",
  "toxicityKa": "ტოქსიკურობა ქართულად (მაგ: 'უსაფრთხოა' ან 'ტოქსიკურია კატებისთვის')",
  "toxicityEn": "Pet toxicity in English",
  "tags": ["3-5 Georgian/English search tags"]
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
            maxOutputTokens: 600,
          },
        }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const parsed = JSON.parse(rawText);
        const resolvedTaxon: BotanicalTaxon = {
          ka: parsed.ka || localMatch.ka,
          en: parsed.en || localMatch.en,
          categoryId: VALID_CATEGORY_IDS.includes(parsed.categoryId) ? parsed.categoryId : localMatch.categoryId,
          wateringKa: parsed.wateringKa || localMatch.wateringKa,
          wateringEn: parsed.wateringEn || localMatch.wateringEn,
          lightKa: parsed.lightKa || localMatch.lightKa,
          lightEn: parsed.lightEn || localMatch.lightEn,
          difficulty: parsed.difficulty === "Expert" ? "Expert" : parsed.difficulty === "Medium" ? "Medium" : "Easy",
          toxicityKa: parsed.toxicityKa || localMatch.toxicityKa,
          toxicityEn: parsed.toxicityEn || localMatch.toxicityEn,
          tags: Array.isArray(parsed.tags) && parsed.tags.length > 0 ? parsed.tags : localMatch.tags,
        };

        // Cache for all subsequent users
        dynamicTaxonCache.set(cacheKey, resolvedTaxon);
        return resolvedTaxon;
      }
    }
  } catch (err) {
    console.warn("Dynamic botanical classification fallback failed:", err);
  }

  return localMatch;
}
