import { NextRequest, NextResponse } from "next/server";
import { lookupBotanicalTaxon } from "@/lib/botanical-dictionary";

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.PLANT_ID_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "Plant.id API Key არ არის კონფიგურირებული გარემოს ცვლადებში" }, { status: 500 });
    }

    let base64Images: string[] = [];
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const files = formData.getAll("images") as File[];
      const single = (formData.get("image") || formData.get("file")) as File | null;
      const allFiles = files.length > 0 ? files : single ? [single] : [];

      for (const f of allFiles.slice(0, 2)) {
        const buffer = await f.arrayBuffer();
        const b64 = Buffer.from(buffer).toString("base64");
        const mime = f.type || "image/jpeg";
        base64Images.push(`data:${mime};base64,${b64}`);
      }
    } else {
      const body = await req.json();
      if (body.images && Array.isArray(body.images)) {
        base64Images = body.images;
      } else if (body.imageBase64 || body.image) {
        const raw = body.imageBase64 || body.image;
        const mime = body.mimeType || "image/jpeg";
        base64Images.push(raw.startsWith("data:") ? raw : `data:${mime};base64,${raw}`);
      }
    }

    if (base64Images.length === 0) {
      return NextResponse.json({ success: false, error: "ფოტო არ არის გადაცემული" }, { status: 400 });
    }

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
      console.warn("Plant.id API response error:", response.status, errText);
      return NextResponse.json({ success: false, error: `Plant.id API შეცდომა (${response.status})` }, { status: response.status });
    }

    const data = await response.json();
    const result = data.result;

    if (!result || !result.classification || !result.classification.suggestions || result.classification.suggestions.length === 0) {
      return NextResponse.json({ success: false, error: "Plant.id-ით მცენარის ამოცნობა ვერ მოხერხდა" }, { status: 404 });
    }

    const best = result.classification.suggestions[0];
    const scientificName = best.name || "Unknown plant";
    const commonNames: string[] = best.details?.common_names || [];
    const taxon = lookupBotanicalTaxon(scientificName, commonNames);

    const titleKa = taxon.ka || scientificName;
    const titleEn = commonNames[0] || taxon.en || scientificName;

    const descKa = `${taxon.ka} — ჯანსაღი და ხარისხიანი დეკორატიული მცენარე.`;
    const descEn = `${commonNames[0] || taxon.en} — Healthy and well-established ornamental plant.`;

    return NextResponse.json({
      success: true,
      data: {
        titleKa,
        titleEn,
        descKa,
        descEn,
        botanicalName: scientificName,
        commonName: taxon.ka,
        category: taxon.categoryId,
        itemType: "PLANT",
        watering: taxon.wateringKa,
        light: taxon.lightKa,
        careDifficulty: taxon.difficulty,
        toxicity: taxon.toxicityKa,
        tags: Array.from(new Set([...taxon.tags, scientificName.split(" ")[0]])),
        confidence_score: Math.round((best.probability || 0.9) * 100),
      },
    });
  } catch (err: any) {
    console.error("Plant.id error:", err);
    return NextResponse.json({ success: false, error: err.message || "Plant.id შეცდომა" }, { status: 500 });
  }
}
