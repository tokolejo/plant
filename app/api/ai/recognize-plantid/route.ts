import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 45;

const GEORGIAN_PLANT_TRANSLATIONS: Record<string, { ka: string; careDifficulty: "Easy" | "Medium" | "Expert" }> = {
  monstera: { ka: "მონსტერა", careDifficulty: "Easy" },
  philodendron: { ka: "ფილოდენდრონი", careDifficulty: "Easy" },
  anthurium: { ka: "ანთურიუმი", careDifficulty: "Medium" },
  alocasia: { ka: "ალოკაზია", careDifficulty: "Medium" },
  ficus: { ka: "ფიკუსი", careDifficulty: "Easy" },
  sansevieria: { ka: "სანსევიერია (ხანჯალა)", careDifficulty: "Easy" },
  dracaena: { ka: "დრაცენა", careDifficulty: "Easy" },
  spathiphyllum: { ka: "სპატიფილუმი (ქალური ბედნიერება)", careDifficulty: "Easy" },
  epipremnum: { ka: "პოთოსი (ეპიპრემნუმი)", careDifficulty: "Easy" },
  scindapsus: { ka: "სცინდაპსუსი", careDifficulty: "Easy" },
  calathea: { ka: "კალათეა", careDifficulty: "Medium" },
  maranta: { ka: "მარანტა", careDifficulty: "Medium" },
  phalaenopsis: { ka: "ორქიდეა (ფალენოპსისი)", careDifficulty: "Medium" },
  orchid: { ka: "ორქიდეა", careDifficulty: "Medium" },
  crassula: { ka: "კრასულა (ბარაქის ხე)", careDifficulty: "Easy" },
  echeveria: { ka: "ეჩევერია (სუქულენტი)", careDifficulty: "Easy" },
  sedum: { ka: "სედუმი", careDifficulty: "Easy" },
  cactus: { ka: "კაქტუსი", careDifficulty: "Easy" },
  zamioculcas: { ka: "ზამიოკულკასი (დოლარის ხე)", careDifficulty: "Easy" },
  hoya: { ka: "ხოია (ცვილის ყვავილი)", careDifficulty: "Medium" },
  begonia: { ka: "ბეგონია", careDifficulty: "Medium" },
  syngonium: { ka: "სინგონიუმი", careDifficulty: "Easy" },
  schefflera: { ka: "შეფლერა", careDifficulty: "Easy" },
  peperomia: { ka: "პეპერომია", careDifficulty: "Easy" },
  chlorophytum: { ka: "ქლოროფიტუმი", careDifficulty: "Easy" },
  bonsai: { ka: "ბონსაი", careDifficulty: "Expert" },
  fern: { ka: "გვიმრა", careDifficulty: "Medium" },
  nephrolepis: { ka: "ნეფროლეპისი (გვიმრა)", careDifficulty: "Medium" },
};

function getGeorgianNameAndCare(scientificName: string, commonNames: string[]) {
  const s = scientificName.toLowerCase();
  for (const [key, val] of Object.entries(GEORGIAN_PLANT_TRANSLATIONS)) {
    if (s.includes(key)) {
      return val;
    }
  }
  for (const cn of commonNames) {
    const c = cn.toLowerCase();
    for (const [key, val] of Object.entries(GEORGIAN_PLANT_TRANSLATIONS)) {
      if (c.includes(key)) {
        return val;
      }
    }
  }
  return { ka: commonNames[0] || scientificName, careDifficulty: "Easy" as const };
}

function translateWatering(watering: any, bestWatering?: string): string {
  if (bestWatering) return bestWatering;
  if (!watering) return "კვირაში 1-ხელ (ნიადაგის შეშრობისას)";
  if (typeof watering === "string") return watering;

  if (watering.max !== undefined && watering.min !== undefined) {
    if (watering.min === 1 && watering.max === 1) return "კვირაში 1-ხელ";
    if (watering.min >= 2) return `${watering.min}-${watering.max} კვირაში 1-ხელ`;
    return `კვირაში ${watering.min}-${watering.max}-ჯერ`;
  }
  return "კვირაში 1-ხელ";
}

function translateLight(bestLight?: string): string {
  if (!bestLight) return "კაშკაშა გაფანტული";
  const l = bestLight.toLowerCase();
  if (l.includes("direct") && l.includes("sun")) return "კაშკაშა მზის სინათლე";
  if (l.includes("low") || l.includes("shade")) return "ნახევრად ჩრდილი";
  if (l.includes("filtered")) return "ფილტრირებული გაფანტული";
  return "კაშკაშა გაფანტული";
}

function translateToxicity(toxicity?: string): string {
  if (!toxicity) return "გადაამოწმეთ";
  const t = toxicity.toLowerCase();
  if (t.includes("non-toxic") || t.includes("not toxic") || t.includes("safe")) {
    return "უსაფრთხოა ცხოველებისთვის (Pet Friendly)";
  }
  if (t.includes("toxic") || t.includes("poisonous")) {
    return "ტოქსიკურია კატებისთვის და ძაღლებისთვის";
  }
  return toxicity;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.PLANT_ID_API_KEY || "nEPcYl6jCMNvBtBYDGfGci734wCRFxSNR1oGTY4suxvnijBWgf";

    let base64Images: string[] = [];

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const files = formData.getAll("images") as File[];
      const single = formData.get("image") as File | null;
      const allFiles = files.length > 0 ? files : single ? [single] : [];

      for (const f of allFiles.slice(0, 3)) {
        const buffer = await f.arrayBuffer();
        const b64 = Buffer.from(buffer).toString("base64");
        const mime = f.type || "image/jpeg";
        base64Images.push(`data:${mime};base64,${b64}`);
      }
    } else {
      const body = await req.json();
      if (body.images && Array.isArray(body.images)) {
        base64Images = body.images;
      } else if (body.imageBase64) {
        const mime = body.mimeType || "image/jpeg";
        base64Images.push(body.imageBase64.startsWith("data:") ? body.imageBase64 : `data:${mime};base64,${body.imageBase64}`);
      }
    }

    if (base64Images.length === 0) {
      return NextResponse.json({ success: false, error: "სურათი ვერ მოიძებნა" }, { status: 400 });
    }

    // Call Plant.id API v3
    const plantIdUrl = "https://plant.id/api/v3/identification?details=common_names,url,description,taxonomy,rank,gbif_id,inaturalist_id,image,synonyms,edible_parts,watering,propagation_methods,best_watering,best_light_condition,best_soil_type,toxicity";

    const response = await fetch(plantIdUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": apiKey,
      },
      body: JSON.stringify({
        images: base64Images.slice(0, 2),
        latitude: 41.7151,
        longitude: 44.8271,
        similar_images: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Plant.id API error:", response.status, errText);
      return NextResponse.json({ success: false, error: `Plant.id შეცდომა (${response.status}): ${errText}` }, { status: response.status });
    }

    const data = await response.json();
    const result = data.result;

    if (!result || !result.classification || !result.classification.suggestions || result.classification.suggestions.length === 0) {
      return NextResponse.json({
        success: false,
        error: "მცენარის ამოცნობა ვერ მოხერხდა. გთხოვთ ატვირთოთ უფრო მკაფიო ფოტო.",
      }, { status: 404 });
    }

    const bestSuggestion = result.classification.suggestions[0];
    const scientificName = bestSuggestion.name;
    const confidence = Math.round((bestSuggestion.probability || 0.9) * 100);
    const details = bestSuggestion.details || {};
    const commonNames: string[] = details.common_names || [];

    const geoMatch = getGeorgianNameAndCare(scientificName, commonNames);
    const primaryCommonName = commonNames[0] || geoMatch.ka || scientificName;

    const titleKa = geoMatch.ka !== scientificName ? `${geoMatch.ka} (${scientificName})` : scientificName;
    const titleEn = primaryCommonName !== scientificName ? `${primaryCommonName} (${scientificName})` : scientificName;

    const wateringSchedule = translateWatering(details.watering, details.best_watering);
    const lightRequirement = translateLight(details.best_light_condition);
    const toxicity = translateToxicity(details.toxicity);
    const careDifficulty = geoMatch.careDifficulty;

    const tags = Array.from(
      new Set([
        geoMatch.ka,
        primaryCommonName,
        scientificName.split(" ")[0],
        "ოთახის მცენარე",
        ...(commonNames.slice(0, 3)),
      ].filter(Boolean))
    );

    return NextResponse.json({
      success: true,
      data: {
        provider: "plant.id",
        botanical_name: scientificName,
        common_name: geoMatch.ka || primaryCommonName,
        title_ka: titleKa,
        title_en: titleEn,
        watering_schedule: wateringSchedule,
        light_requirement: lightRequirement,
        care_difficulty: careDifficulty,
        toxicity: toxicity,
        plantnet_id: `pid_${bestSuggestion.id || scientificName.replace(/\s+/g, "_")}`,
        confidence_score: confidence,
        tags: tags,
        description: details.description?.value || null,
        similar_images: bestSuggestion.similar_images?.map((s: any) => s.url) || [],
      },
    });
  } catch (error: any) {
    console.error("Plant.id identification error:", error);
    return NextResponse.json({ success: false, error: error.message || "Plant.id სერვისთან კავშირი შეწყდა" }, { status: 500 });
  }
}
