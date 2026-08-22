import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 45;

interface BotanicalCareProfile {
  ka: string;
  en: string;
  botanical: string;
  category: string;
  watering: string;
  light: string;
  difficulty: "Easy" | "Medium" | "Expert";
  toxicity: string;
  tags: string[];
}

const BOTANICAL_DATABASE: Record<string, BotanicalCareProfile> = {
  monstera: {
    ka: "მონსტერა",
    en: "Monstera (Swiss Cheese Plant)",
    botanical: "Monstera deliciosa",
    category: "monstera",
    watering: "Weekly (კვირაში 1-ხელ, ნიადაგის შეშრობისას)",
    light: "Bright Indirect (კაშკაშა გაფანტული სინათლე)",
    difficulty: "Easy",
    toxicity: "ტოქსიკურია კატებისთვის/ძაღლებისთვის (უმი ფოთლები)",
    tags: ["მონსტერა", "აროიდი", "ოთახის მცენარე", "დიდფოთოლა"],
  },
  philodendron: {
    ka: "ფილოდენდრონი",
    en: "Philodendron",
    botanical: "Philodendron hederaceum",
    category: "philodendron",
    watering: "Weekly (კვირაში 1-ხელ)",
    light: "Medium to Bright Indirect (საშუალო/გაფანტული)",
    difficulty: "Easy",
    toxicity: "ზომიერად ტოქსიკურია ცხოველებისთვის",
    tags: ["ფილოდენდრონი", "აროიდი", "ლიანა", "ოთახის მცენარე"],
  },
  anthurium: {
    ka: "ანთურიუმი",
    en: "Anthurium (Flamingo Flower)",
    botanical: "Anthurium andraeanum",
    category: "anthurium",
    watering: "Every 7-10 days (7-10 დღეში 1-ხელ)",
    light: "Bright Indirect (გაფანტული სინათლე)",
    difficulty: "Medium",
    toxicity: "ტოქსიკურია ცხოველებისთვის",
    tags: ["ანთურიუმი", "ყვავილოვანი", "იშვიათი", "ტროპიკული"],
  },
  alocasia: {
    ka: "ალოკაზია",
    en: "Alocasia (Elephant Ear)",
    botanical: "Alocasia amazonica",
    category: "alocasia",
    watering: "Every 5-7 days (5-7 დღეში 1-ხელ)",
    light: "Bright Filtered (კაშკაშა ფილტრირებული)",
    difficulty: "Medium",
    toxicity: "ტოქსიკურია ცხოველებისთვის",
    tags: ["ალოკაზია", "ეგზოტიკური", "დეკორატიული ფოთოლი"],
  },
  ficus: {
    ka: "ფიკუსი",
    en: "Ficus (Rubber Tree / Fiddle Leaf)",
    botanical: "Ficus elastica",
    category: "ficus",
    watering: "Weekly (კვირაში 1-ხელ)",
    light: "Bright Ambient (უხვი გაფანტული)",
    difficulty: "Easy",
    toxicity: "ზომიერად ტოქსიკურია (რძისებრი წვენი)",
    tags: ["ფიკუსი", "ხისებრი", "ელასტიკა", "ლირატა"],
  },
  sansevieria: {
    ka: "სანსევიერია (ხანჯალა)",
    en: "Snake Plant (Sansevieria)",
    botanical: "Sansevieria trifasciata",
    category: "cactus-succulent",
    watering: "Bi-weekly (2-3 კვირაში 1-ხელ)",
    light: "Low to High (ნებისმიერი განათება)",
    difficulty: "Easy",
    toxicity: "მსუბუქად ტოქსიკურია",
    tags: ["სანსევიერია", "სუქულენტი", "გამძლე", "ჰაერის გამწმენდი"],
  },
  dracaena: {
    ka: "დრაცენა",
    en: "Dracaena (Dragon Tree)",
    botanical: "Dracaena marginata",
    category: "palm",
    watering: "Every 10 days (10 დღეში 1-ხელ)",
    light: "Medium Light (საშუალო სინათლე)",
    difficulty: "Easy",
    toxicity: "ტოქსიკურია კატებისთვის",
    tags: ["დრაცენა", "პალმისებრი", "ოთახის მცენარე"],
  },
  spathiphyllum: {
    ka: "სპატიფილუმი (ქალური ბედნიერება)",
    en: "Peace Lily (Spathiphyllum)",
    botanical: "Spathiphyllum wallisii",
    category: "other-plant",
    watering: "Twice a week (კვირაში 2-ჯერ)",
    light: "Low to Medium (ნახევრად ჩრდილი)",
    difficulty: "Easy",
    toxicity: "ზომიერად ტოქსიკურია ცხოველებისთვის",
    tags: ["სპატიფილუმი", "ყვავილოვანი", "ტენის მოყვარული"],
  },
  epipremnum: {
    ka: "პოთოსი (ეპიპრემნუმი)",
    en: "Pothos (Devil's Ivy)",
    botanical: "Epipremnum aureum",
    category: "pothos-scindapsus",
    watering: "Weekly (კვირაში 1-ხელ)",
    light: "Low to Bright Indirect (ნებისმიერი)",
    difficulty: "Easy",
    toxicity: "ზომიერად ტოქსიკურია",
    tags: ["პოთოსი", "მცოცავი", "მარტივი მოვლა"],
  },
  calathea: {
    ka: "კალათეა / მარანტა",
    en: "Calathea (Prayer Plant)",
    botanical: "Calathea orbifolia",
    category: "calathea",
    watering: "Every 4-6 days (4-6 დღეში 1-ხელ)",
    light: "Medium Filtered (ნახევრად ჩრდილი)",
    difficulty: "Medium",
    toxicity: "✅ არატოქსიკურია (Pet Friendly)",
    tags: ["კალათეა", "მარანტა", "ტენიანობის მოყვარული"],
  },
  orchis: {
    ka: "ორქიდეა (ფალენოფსისი)",
    en: "Orchid (Phalaenopsis)",
    botanical: "Phalaenopsis aphrodite",
    category: "orchid",
    watering: "Every 7-10 days (ჩაძირვის მეთოდით)",
    light: "Bright Indirect (გაფანტული სინათლე)",
    difficulty: "Medium",
    toxicity: "✅ არატოქსიკურია (Pet Friendly)",
    tags: ["ორქიდეა", "ფალენოფსისი", "ყვავილოვანი"],
  },
  sedum: {
    ka: "სედუმი / ეჩევერია",
    en: "Succulent (Echeveria / Sedum)",
    botanical: "Echeveria elegans",
    category: "cactus-succulent",
    watering: "Every 2-3 weeks (2-3 კვირაში 1-ხელ)",
    light: "Direct Sun (პირდაპირი მზე)",
    difficulty: "Easy",
    toxicity: "✅ არატოქსიკურია (Pet Friendly)",
    tags: ["სუქულენტი", "კაქტუსი", "მინიატურული"],
  },
  crassula: {
    ka: "კრასულა (ბარაქის ხე)",
    en: "Jade Plant (Crassula ovata)",
    botanical: "Crassula ovata",
    category: "cactus-succulent",
    watering: "Every 2-3 weeks (2-3 კვირაში 1-ხელ)",
    light: "Bright Direct/Indirect (კაშკაშა სინათლე)",
    difficulty: "Easy",
    toxicity: "ტოქსიკურია ცხოველებისთვის",
    tags: ["კრასულა", "ბარაქის ხე", "სუქულენტი"],
  },
  zamioculcas: {
    ka: "ზამიოკულკასი (დოლარის ხე)",
    en: "ZZ Plant (Zamioculcas zamiifolia)",
    botanical: "Zamioculcas zamiifolia",
    category: "other-plant",
    watering: "Every 2-3 weeks (2-3 კვირაში 1-ხელ)",
    light: "Low to High (ნებისმიერი განათება)",
    difficulty: "Easy",
    toxicity: "ტოქსიკურია ცხოველებისთვის",
    tags: ["ზამიოკულკასი", "დოლარის ხე", "გამძლე"],
  }
};

function matchBotanicalProfile(speciesName: string, genus: string, family: string): BotanicalCareProfile {
  const s = speciesName.toLowerCase();
  const g = genus.toLowerCase();
  const f = family.toLowerCase();

  for (const [key, profile] of Object.entries(BOTANICAL_DATABASE)) {
    if (s.includes(key) || g.includes(key) || f.includes(key)) {
      return profile;
    }
  }

  // Succulent/Cactus fallback
  if (f.includes("cact") || f.includes("crassul") || f.includes("aizoac") || f.includes("asphodel")) {
    return {
      ka: genus ? `${genus}` : "სუქულენტი",
      en: genus ? `${genus}` : "Succulent",
      botanical: speciesName || "Succulent",
      category: "cactus-succulent",
      watering: "Bi-weekly (2-3 კვირაში 1-ხელ)",
      light: "Bright / Direct Sun (კაშკაშა მზე)",
      difficulty: "Easy",
      toxicity: "✅ ძირითადად არატოქსიკურია",
      tags: ["სუქულენტი", "კაქტუსი", "გამძლე"],
    };
  }

  // General Houseplant Fallback
  return {
    ka: speciesName || "ოთახის მცენარე",
    en: speciesName || "Indoor Plant",
    botanical: speciesName || "Plantae",
    category: "other-plant",
    watering: "Weekly (კვირაში 1-ხელ)",
    light: "Bright Indirect (გაფანტული სინათლე)",
    difficulty: "Easy",
    toxicity: "ინდივიდუალური",
    tags: ["ოთახის მცენარე", "დეკორატიული"],
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFiles = formData.getAll("images") as File[];
    const singleImage = formData.get("image") as File | null;

    const filesToProcess: File[] = [];
    if (imageFiles && imageFiles.length > 0) {
      filesToProcess.push(...imageFiles);
    } else if (singleImage) {
      filesToProcess.push(singleImage);
    }

    if (filesToProcess.length === 0) {
      return NextResponse.json({ success: false, error: "No image uploaded" }, { status: 400 });
    }

    const apiKey = process.env.PLANTNET_API_KEY || "2b10Dskv0e8zWjR0LSmW8v2wP";
    const plantNetFormData = new FormData();

    for (const f of filesToProcess.slice(0, 4)) {
      plantNetFormData.append("images", f, f.name || "plant.jpg");
      plantNetFormData.append("organs", "leaf");
    }

    const plantNetUrl = `https://my-api.plantnet.org/v2/identify/all?api-key=${apiKey}&lang=en`;

    let plantNetData: any = null;
    try {
      const resp = await fetch(plantNetUrl, {
        method: "POST",
        body: plantNetFormData,
      });

      if (resp.ok) {
        plantNetData = await resp.json();
      } else {
        const errText = await resp.text();
        console.warn("Pl@ntNet API response status:", resp.status, errText);
      }
    } catch (netErr) {
      console.warn("Pl@ntNet request failed:", netErr);
    }

    // Process result
    if (plantNetData && plantNetData.results && plantNetData.results.length > 0) {
      const bestMatch = plantNetData.results[0];
      const species = bestMatch.species;
      const scientificName = species?.scientificNameWithoutAuthor || species?.scientificName || "Unknown species";
      const genus = species?.genus?.scientificNameWithoutAuthor || "";
      const family = species?.family?.scientificNameWithoutAuthor || "";
      const confidence = Math.round((bestMatch.score || 0.85) * 100);
      const commonNames: string[] = species?.commonNames || [];
      const plantnetId = `pln_${species?.id || genus || "plant"}`;

      const profile = matchBotanicalProfile(scientificName, genus, family);

      const titleKa = profile.ka !== scientificName ? `${profile.ka} (${scientificName})` : scientificName;
      const titleEn = commonNames[0] ? `${commonNames[0]} (${scientificName})` : scientificName;
      const commonName = profile.ka || commonNames[0] || scientificName;

      return NextResponse.json({
        success: true,
        data: {
          botanical_name: scientificName,
          common_name: commonName,
          title_ka: titleKa,
          title_en: titleEn,
          suggested_category: profile.category, // only suggested, NEVER forced
          watering_schedule: profile.watering,
          light_requirement: profile.light,
          care_difficulty: profile.difficulty,
          toxicity: profile.toxicity,
          plantnet_id: plantnetId,
          confidence_score: confidence,
          tags: Array.from(new Set([...profile.tags, genus.toLowerCase()])),
        },
      });
    }

    // Fallback if no specific plant recognized
    return NextResponse.json({
      success: true,
      data: {
        botanical_name: "Botanical Plant",
        common_name: "მცენარე",
        title_ka: "მწვანე მცენარე",
        title_en: "Green Houseplant",
        suggested_category: "other-plant",
        watering_schedule: "Weekly (კვირაში 1-ხელ)",
        light_requirement: "Bright Indirect (გაფანტული სინათლე)",
        care_difficulty: "Easy",
        toxicity: "არატოქსიკური",
        plantnet_id: null,
        confidence_score: 50,
        tags: ["მცენარე", "ოთახის მცენარე"],
      },
    });
  } catch (error: any) {
    console.error("Botanical identification error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to identify plant" }, { status: 500 });
  }
}
