import { NextRequest, NextResponse } from "next/server";
import { lookupBotanicalTaxon } from "@/lib/botanical-dictionary";

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.PLANTNET_API_KEY || process.env.NEXT_PUBLIC_PLANTNET_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "Pl@ntNet API Key არ არის კონფიგურირებული გარემოს ცვლადებში" }, { status: 500 });
    }

    let targetBlob: Blob | null = null;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      const rawBase64 = body.imageBase64 || body.image || body.base64;
      if (rawBase64) {
        const cleanBase64 = rawBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
        const mime = body.mimeType || "image/jpeg";
        const buffer = Buffer.from(cleanBase64, "base64");
        targetBlob = new Blob([buffer], { type: mime });
      }
    } else {
      const formData = await req.formData();
      const imageFiles = formData.getAll("images") as File[];
      const singleImage = (formData.get("image") || formData.get("file")) as File | null;
      targetBlob = singleImage || (imageFiles && imageFiles.length > 0 ? imageFiles[0] : null);
    }

    if (!targetBlob) {
      return NextResponse.json({ success: false, error: "ფოტო არ არის ატვირთული" }, { status: 400 });
    }

    const plantNetFormData = new FormData();
    plantNetFormData.append("images", targetBlob, "plant.jpg");
    plantNetFormData.append("organs", "auto");

    const plantNetUrl = `https://my-api.plantnet.org/v2/identify/all?api-key=${apiKey}&lang=en`;

    const resp = await fetch(plantNetUrl, {
      method: "POST",
      body: plantNetFormData,
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.warn("Pl@ntNet API error:", resp.status, errText);
      return NextResponse.json({ success: false, error: `Pl@ntNet API შეცდომა (${resp.status})` }, { status: resp.status });
    }

    const plantNetData = await resp.json();

    if (!plantNetData.results || plantNetData.results.length === 0) {
      return NextResponse.json({ success: false, error: "Pl@ntNet-მა მცენარე ვერ ამოიცნო" }, { status: 404 });
    }

    const best = plantNetData.results[0];
    const species = best.species;
    const scientificName = species?.scientificNameWithoutAuthor || species?.scientificName || "Unknown species";
    const commonNames: string[] = species?.commonNames || [];
    const taxon = lookupBotanicalTaxon(scientificName, commonNames);

    const titleKa = `${taxon.ka} (${scientificName})`;
    const titleEn = `${commonNames[0] || taxon.en} (${scientificName})`;

    const descKa = `${taxon.ka} (${scientificName}) — ჯანსაღი და ხარისხიანი მცენარე. იდეალურია სახლის, აივნისა თუ ბაღისთვის.\n\n🌱 მოვლის მოკლე რჩევა:\n• მორწყვა: ${taxon.wateringKa}\n• განათება: ${taxon.lightKa}\n• სირთულე: ${taxon.difficulty === "Easy" ? "მარტივი" : taxon.difficulty === "Medium" ? "საშუალო" : "რთული"}\n• ტოქსიკურობა: ${taxon.toxicityKa}`;
    const descEn = `${commonNames[0] || taxon.en} (${scientificName}) — Healthy and well-established plant.\n\n🌱 Care Tips:\n• Watering: ${taxon.wateringEn}\n• Light: ${taxon.lightEn}\n• Difficulty: ${taxon.difficulty}\n• Pet safety: ${taxon.toxicityEn}`;

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
        confidence_score: Math.round((best.score || 0.9) * 100),
      },
    });
  } catch (error: any) {
    console.error("Pl@ntNet error:", error);
    return NextResponse.json({ success: false, error: error.message || "Pl@ntNet შეცდომა" }, { status: 500 });
  }
}
