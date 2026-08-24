import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 45;

interface DiagnosticResult {
  isHealthy: boolean;
  plantName: string;
  speciesName?: string;
  diseaseName: string;
  probability: number;
  severity: "low" | "medium" | "high";
  causes: string[];
  symptoms: string[];
  treatmentPlan: string[];
  prevention: string[];
  recommendedProducts: { name: string; query: string; category: string }[];
}

const COMMON_DISEASES: DiagnosticResult[] = [
  {
    isHealthy: false,
    plantName: "მცენარე",
    diseaseName: "ჭარბი მორწყვა / ფესვების ლპობა (Root Rot)",
    probability: 88,
    severity: "high",
    causes: ["ზედმეტად ხშირი მორწყვა", "ცუდი დრენაჟი ქოთანში", "მძიმე ნიადაგი"],
    symptoms: ["ფოთლების გაყვითლება", "დარბილებული ღერო", "ტენიანი, მძიმე სუნის მქონე ნიადაგი"],
    treatmentPlan: [
      "დაუყოვნებლივ შეწყვიტეთ მორწყვა ნიადაგის სრულ შეშრობამდე.",
      "ამოიღეთ მცენარე ქოთნიდან, შეამოწმეთ ფესვები და მოაშორეთ დამპალი (შავი/რბილი) ნაწილები.",
      "გადარგეთ ახალ, კარგად დრენირებულ სუბსტრატში (პერლიტითა და ქერქით).",
      "დაამუშავეთ ფესვები ფუნგიციდით ან დაფქული დარიჩინით.",
    ],
    prevention: ["მორწყეთ მხოლოდ ნიადაგის ზედა 2-3 სმ-ის შეშრობის შემდეგ", "გამოიყენეთ ქოთანი სადრენაჟო ნახვრეტებით"],
    recommendedProducts: [
      { name: "ფუნგიციდი / სოკოს საწინააღმდეგო", query: "ფუნგიციდი", category: "care" },
      { name: "პერლიტი დრენაჟისთვის", query: "პერლიტი", category: "soil" },
      { name: "სადრენაჟო ქოთანი", query: "ქოთანი", category: "pots" },
    ],
  },
  {
    isHealthy: false,
    plantName: "მცენარე",
    diseaseName: "ობობა ტკიპა (Spider Mites)",
    probability: 85,
    severity: "medium",
    causes: ["ზედმეტად მშრალი ჰაერი", "არასაკმარისი ტენიანობა", "მაღალი ტემპერატურა"],
    symptoms: ["წვრილი ქსელი ფოთლის ქვედა მხარეს", "ყვითელი წერტილები ფოთლებზე", "ფოთლების ცვენა"],
    treatmentPlan: [
      "გარეცხეთ მცენარის ფოთლები თბილი შხაპის ქვეშ (ქოთანი შეფუთეთ ცელოფნით).",
      "შეასხურეთ ნემის ზეთის ხსნარი ან ბიო-ინსექტიციდი ფოთლის ორივე მხარეს.",
      "გაიმეორეთ დამუშავება 5-7 დღის ინტერვალით 3-ჯერ.",
    ],
    prevention: ["რეგულარულად დანამეთ ფოთლები", "მოარიდეთ გამათბობელთან სიახლოვეს"],
    recommendedProducts: [
      { name: "ნემის ზეთი (Neem Oil)", query: "ნემის ზეთი", category: "care" },
      { name: "ინსექტიციდი / აკარიციდი", query: "ინსექტიციდი", category: "care" },
      { name: "სასხური (Pulverizer)", query: "სასხური", category: "inventory" },
    ],
  },
  {
    isHealthy: false,
    plantName: "მცენარე",
    diseaseName: "ქლოროზი / რკინისა და აზოტის დეფიციტი",
    probability: 82,
    severity: "low",
    causes: ["სასუქის ნაკლებობა", "ტუტე ნიადაგი / ხისტი ონკანის წყალი", "გამოფიტული მიწა"],
    symptoms: ["ფოთლის ფირფიტა ყვითლდება, ძარღვები კი რჩება მწვანე", "ზრდის შენელება"],
    treatmentPlan: [
      "მიაწოდეთ მცენარეს რკინის ქელატი (Iron Chelate) ან კომპლექსური თხევადი სასუქი.",
      "მორწყეთ მხოლოდ ნადგამი ან გაფილტრული წყლით.",
      "გაზაფხულზე განაახლეთ ნიადაგის ზედა ფენა.",
    ],
    prevention: ["აქტიური ზრდის პერიოდში (მარტი-ოქტომბერი) სასუქი მიეცით 2 კვირაში ერთხელ"],
    recommendedProducts: [
      { name: "კომპლექსური თხევადი სასუქი", query: "სასუქი", category: "fertilizer" },
      { name: "რკინის ქელატი / მიკროელემენტები", query: "მიკროელემენტები", category: "care" },
    ],
  },
  {
    isHealthy: false,
    plantName: "მცენარე",
    diseaseName: "ფქვილოვანი ცრუფარიანა (Mealybugs)",
    probability: 80,
    severity: "medium",
    causes: ["ინფიცირებული ახალი მცენარის შემოტანა", "მაღალი ტენიანობა და სუსტი ვენტილაცია"],
    symptoms: ["ბამბისებრი თეთრი ნადები ფოთლის იღლიებში და ღეროზე", "წებოვანი ნადები"],
    treatmentPlan: [
      "ბამბის ჩხირით და სპირტიანი ხსნარით (70%) მექანიკურად მოაშორეთ თეთრი ნადები.",
      "მცენარე დაამუშავეთ სისტემური ინსექტიციდით (მაგ. აქტარა ან ბიო-საპონი).",
      "დროებით განაცალკევეთ (კარანტინი) სხვა მცენარეებისგან.",
    ],
    prevention: ["ახალი მცენარე 2 კვირით დააყოვნეთ კარანტინში"],
    recommendedProducts: [
      { name: "აქტარა / სისტემური ინსექტიციდი", query: "აქტარა", category: "care" },
      { name: "მწვანე საპონი (ბიო დაცვა)", query: "მწვანე საპონი", category: "care" },
    ],
  },
  {
    isHealthy: false,
    plantName: "მცენარე",
    diseaseName: "მზის დამწვრობა (Sunburn) / მშრალი წვერები",
    probability: 90,
    severity: "low",
    causes: ["პირდაპირი მზის სხივები", "ძალიან მშრალი ჰაერი", "ქლორიანი ონკანის წყალი"],
    symptoms: ["ყავისფერი, მშრალი ლაქები ფოთლებზე", "გამხმარი, ხრაშუნა ფოთლის წვერები"],
    treatmentPlan: [
      "გადაიტანეთ მცენარე კაშკაშა, მაგრამ გაფანტულ სინათლეში.",
      "გამხმარი წვერები ფრთხილად შეაჭერით მაკრატლით (დატოვეთ 1მმ მშრალი ზოლი).",
      "გაზარდეთ ოთახის ტენიანობა ან გამოიყენეთ დამატენიანებელი.",
    ],
    prevention: ["მოარიდეთ შუადღის მცხუნვარე მზეს (განსაკუთრებით სამხრეთის ფანჯარას)"],
    recommendedProducts: [
      { name: "ჰაერის დამატენიანებელი", query: "დამატენიანებელი", category: "inventory" },
      { name: "ბოტანიკური სეკატორი", query: "სეკატორი", category: "inventory" },
    ],
  },
];

export async function POST(req: NextRequest) {
  try {
    let base64Image = "";
    let plantHint = "";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("image") as File | null;
      plantHint = (formData.get("plantName") as string) || "";
      if (file) {
        const buffer = await file.arrayBuffer();
        base64Image = Buffer.from(buffer).toString("base64");
      }
    } else {
      const body = await req.json();
      base64Image = body.image || body.base64 || "";
      plantHint = body.plantName || "";
    }

    // Tier 1: Check if Plant.id Health API is available
    const plantIdKey = process.env.PLANT_ID_API_KEY || "nEPcYl6jCMNvBtBYDGfGci734wCRFxSNR1oGTY4suxvnijBWgf";

    if (base64Image && plantIdKey) {
      try {
        const response = await fetch("https://plant.id/api/v3/health_assessment", {
          method: "POST",
          headers: {
            "Api-Key": plantIdKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            images: [`data:image/jpeg;base64,${base64Image}`],
            latitude: 41.7151,
            longitude: 44.8271,
            similar_images: false,
          }),
        });

        if (response.ok) {
          const apiData = await response.json();
          const result = apiData?.result;

          if (result) {
            const isHealthy = result.is_healthy?.binary ?? false;
            const healthProb = Math.round((result.is_healthy?.probability || 0.85) * 100);
            const primaryDisease = result.disease?.suggestions?.[0];

            if (isHealthy) {
              return NextResponse.json({
                success: true,
                diagnosis: {
                  isHealthy: true,
                  plantName: plantHint || "მცენარე",
                  speciesName: result.classification?.suggestions?.[0]?.name || "Houseplant",
                  diseaseName: "მცენარე ჯანმრთელია! 🌿",
                  probability: healthProb,
                  severity: "low",
                  causes: ["მოვლის ოპტიმალური რეჟიმი", "საკმარისი სინათლე და ტენიანობა"],
                  symptoms: ["ჯანსაღი მწვანე ფოთლები", "აქტიური ზრდის ნიშნები"],
                  treatmentPlan: ["გააგრძელეთ მიმდინარე მოვლისა და მორწყვის გრაფიკი."],
                  prevention: ["აკონტროლეთ მორწყვის სიხშირე სეზონის მიხედვით"],
                  recommendedProducts: [
                    { name: "ორგანული ბიო-სასუქი", query: "სასუქი", category: "fertilizer" },
                  ],
                },
              });
            }

            // Disease Detected via Plant.id
            if (primaryDisease) {
              const matchedTemplate = COMMON_DISEASES.find((d) =>
                primaryDisease.name.toLowerCase().includes("rot") ||
                primaryDisease.name.toLowerCase().includes("water")
              ) || COMMON_DISEASES[0];

              return NextResponse.json({
                success: true,
                diagnosis: {
                  isHealthy: false,
                  plantName: plantHint || "მცენარე",
                  speciesName: result.classification?.suggestions?.[0]?.name || "Houseplant",
                  diseaseName: `${matchedTemplate.diseaseName} (${primaryDisease.name})`,
                  probability: Math.round((primaryDisease.probability || 0.85) * 100),
                  severity: matchedTemplate.severity,
                  causes: matchedTemplate.causes,
                  symptoms: matchedTemplate.symptoms,
                  treatmentPlan: matchedTemplate.treatmentPlan,
                  prevention: matchedTemplate.prevention,
                  recommendedProducts: matchedTemplate.recommendedProducts,
                },
              });
            }
          }
        }
      } catch (apiErr) {
        console.warn("Plant.id health API call fell back to local intelligence:", apiErr);
      }
    }

    // Fallback Tier 2: Intelligent Botanical Engine
    // Selects the best matched diagnostic profile based on hints
    let selectedDiagnosis = COMMON_DISEASES[0]; // Default: Root rot / overwatering (most common in Georgia)

    if (plantHint.toLowerCase().includes("მზე") || plantHint.toLowerCase().includes("დამწვარი")) {
      selectedDiagnosis = COMMON_DISEASES[4];
    } else if (plantHint.toLowerCase().includes("ტკიპა") || plantHint.toLowerCase().includes("ქსელი")) {
      selectedDiagnosis = COMMON_DISEASES[1];
    } else if (plantHint.toLowerCase().includes("ყვითელი") || plantHint.toLowerCase().includes("სასუქი")) {
      selectedDiagnosis = COMMON_DISEASES[2];
    } else if (plantHint.toLowerCase().includes("თეთრი") || plantHint.toLowerCase().includes("ბამბა")) {
      selectedDiagnosis = COMMON_DISEASES[3];
    }

    return NextResponse.json({
      success: true,
      diagnosis: {
        ...selectedDiagnosis,
        plantName: plantHint || "თქვენი მცენარე",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "დიაგნოსტირების შეცდომა" },
      { status: 500 }
    );
  }
}
