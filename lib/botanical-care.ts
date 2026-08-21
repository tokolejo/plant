export interface PlantCareInfo {
  lightKa: string;
  lightEn: string;
  wateringKa: string;
  wateringEn: string;
  soilKa: string;
  soilEn: string;
  tempKa: string;
  tempEn: string;
  careLevelKa: string;
  careLevelEn: string;
  humidityKa: string;
  humidityEn: string;
  scientificFamily?: string;
}

export const BOTANICAL_CARE_DATABASE: Record<string, PlantCareInfo> = {
  monstera: {
    lightKa: "კაშკაშა გაფანტული",
    lightEn: "Bright Indirect",
    wateringKa: "კვირაში 1-ჯერ (ზედაპირის შეშრობისას)",
    wateringEn: "1x per week (when topsoil dries)",
    soilKa: "აროიდული მიქსი (ქერქი + პერლიტი)",
    soilEn: "Chunky Aroid Mix (Bark + Perlite)",
    tempKa: "18°C - 27°C",
    tempEn: "18°C - 27°C",
    careLevelKa: "მარტივი / საშუალო",
    careLevelEn: "Easy to Moderate",
    humidityKa: "60% - 80% (მაღალი)",
    humidityEn: "60% - 80% (High)",
    scientificFamily: "Araceae",
  },
  philodendron: {
    lightKa: "გაფანტული ნათელი",
    lightEn: "Filtered Light",
    wateringKa: "5-7 დღეში ერთხელ",
    wateringEn: "Every 5-7 days",
    soilKa: "ფხვიერი აროიდული სუბსტრატი",
    soilEn: "Airy Aroid Substrate",
    tempKa: "18°C - 26°C",
    tempEn: "18°C - 26°C",
    careLevelKa: "მარტივი",
    careLevelEn: "Easy Care",
    humidityKa: "55% - 75%",
    humidityEn: "55% - 75%",
    scientificFamily: "Araceae",
  },
  "cactus-succulent": {
    lightKa: "პირდაპირი მზის სინათლე",
    lightEn: "Full Direct Sun",
    wateringKa: "2-3 კვირაში 1-ჯერ (იშვიათად)",
    wateringEn: "1x every 2-3 weeks (sparse)",
    soilKa: "ქვიშიანი / სუქულენტის გრუნტი",
    soilEn: "Cactus & Succulent Grit Mix",
    tempKa: "15°C - 32°C",
    tempEn: "15°C - 32°C",
    careLevelKa: "ძალიან მარტივი",
    careLevelEn: "Very Easy",
    humidityKa: "30% - 40% (მშრალი)",
    humidityEn: "30% - 40% (Dry)",
    scientificFamily: "Cactaceae / Crassulaceae",
  },
  orchid: {
    lightKa: "რბილი გაფანტული შუქი",
    lightEn: "Soft Filtered Light",
    wateringKa: "7-10 დღეში ერთხელ (დალბობით)",
    wateringEn: "Every 7-10 days (Soak Method)",
    soilKa: "ფიჭვის ქერქი & სფაგნუმის ხავსი",
    soilEn: "Pine Bark & Sphagnum Moss",
    tempKa: "18°C - 25°C",
    tempEn: "18°C - 25°C",
    careLevelKa: "საშუალო",
    careLevelEn: "Moderate",
    humidityKa: "50% - 70%",
    humidityEn: "50% - 70%",
    scientificFamily: "Orchidaceae",
  },
  anthurium: {
    lightKa: "უხვი გაფანტული სინათლე",
    lightEn: "Bright Filtered Light",
    wateringKa: "კვირაში 1-ჯერ (ზომიერად)",
    wateringEn: "1x per week (moderate)",
    soilKa: "უხეში აროიდული მიქსი & პერლიტი",
    soilEn: "Coarse Aroid Mix & Perlite",
    tempKa: "19°C - 28°C",
    tempEn: "19°C - 28°C",
    careLevelKa: "საშუალო / გამოცდილი",
    careLevelEn: "Moderate to Expert",
    humidityKa: "65% - 85% (მაღალი)",
    humidityEn: "65% - 85% (High)",
    scientificFamily: "Araceae",
  },
  alocasia: {
    lightKa: "კაშკაშა გაფანტული (არა პირდაპირი)",
    lightEn: "Bright Indirect (No direct sun)",
    wateringKa: "5-6 დღეში ერთხელ (მუდმივად ნესტიანი)",
    wateringEn: "Every 5-6 days (consistently moist)",
    soilKa: "დრენირებადი ჰაეროვანი მიქსი",
    soilEn: "Well-Draining Airy Soil",
    tempKa: "20°C - 28°C",
    tempEn: "20°C - 28°C",
    careLevelKa: "გამოცდილი",
    careLevelEn: "Expert / Intermediate",
    humidityKa: "70% - 85% (ძალიან მაღალი)",
    humidityEn: "70% - 85% (Very High)",
    scientificFamily: "Araceae",
  },
  calathea: {
    lightKa: "ნახევრად ჩრდილი / გაფანტული",
    lightEn: "Medium Indirect / Shade",
    wateringKa: "კვირაში 2-ჯერ (გაფილტრული წყლით)",
    wateringEn: "2x per week (filtered water)",
    soilKa: "ტორფი + პერლიტი (ტენიანობის შემნახველი)",
    soilEn: "Peat & Perlite (Moisture Retentive)",
    tempKa: "18°C - 25°C",
    tempEn: "18°C - 25°C",
    careLevelKa: "საშუალო / მომთხოვნი",
    careLevelEn: "Demanding / Intermediate",
    humidityKa: "65% - 80%",
    humidityEn: "65% - 80%",
    scientificFamily: "Marantaceae",
  },
  "pothos-scindapsus": {
    lightKa: "ნებისმიერი / ჩრდილიდან სინათლემდე",
    lightEn: "Low to Bright Indirect",
    wateringKa: "7-10 დღეში ერთხელ",
    wateringEn: "Every 7-10 days",
    soilKa: "უნივერსალური ოთახის გრუნტი",
    soilEn: "Standard Indoor Potting Mix",
    tempKa: "16°C - 27°C",
    tempEn: "16°C - 27°C",
    careLevelKa: "ძალიან მარტივი",
    careLevelEn: "Very Easy",
    humidityKa: "40% - 60%",
    humidityEn: "40% - 60%",
    scientificFamily: "Araceae",
  },
  ficus: {
    lightKa: "უხვი გაფანტული შუქი",
    lightEn: "Bright Ambient Light",
    wateringKa: "კვირაში 1-ჯერ (ზედა 3 სმ გაშრობისას)",
    wateringEn: "1x per week (when top 3cm dry)",
    soilKa: "ნოყიერი დრენირებადი გრუნტი",
    soilEn: "Rich Well-Draining Soil",
    tempKa: "18°C - 26°C",
    tempEn: "18°C - 26°C",
    careLevelKa: "საშუალო",
    careLevelEn: "Moderate",
    humidityKa: "50% - 70%",
    humidityEn: "50% - 70%",
    scientificFamily: "Moraceae",
  },
  palm: {
    lightKa: "კაშკაშა გაფანტული სინათლე",
    lightEn: "Bright Filtered Light",
    wateringKa: "კვირაში 1-2 ჯერ",
    wateringEn: "1-2x per week",
    soilKa: "პალმების ქვიშიანი ნოყიერი ნიადაგი",
    soilEn: "Palm Sandy Loam Mix",
    tempKa: "18°C - 27°C",
    tempEn: "18°C - 27°C",
    careLevelKa: "საშუალო",
    careLevelEn: "Moderate",
    humidityKa: "55% - 75%",
    humidityEn: "55% - 75%",
    scientificFamily: "Arecaceae",
  },
  fern: {
    lightKa: "ჩრდილი / გაფანტული რბილი შუქი",
    lightEn: "Shade / Soft Filtered Light",
    wateringKa: "კვირაში 2-3 ჯერ (მუდმივი ტენი)",
    wateringEn: "2-3x per week (consistently moist)",
    soilKa: "ტორფიანი ნოყიერი სუბსტრატი",
    soilEn: "Rich Peaty Soil Mix",
    tempKa: "16°C - 24°C",
    tempEn: "16°C - 24°C",
    careLevelKa: "საშუალო",
    careLevelEn: "Moderate",
    humidityKa: "70% - 90% (ძალიან მაღალი)",
    humidityEn: "70% - 90% (Very High)",
    scientificFamily: "Polypodiaceae",
  },
  bonsai: {
    lightKa: "დილის მზე / უხვი სინათლე",
    lightEn: "Morning Sun / High Light",
    wateringKa: "ყოველდღე / 2 დღეში ერთხელ",
    wateringEn: "Daily or every 2 days",
    soilKa: "აკადამა & ვულკანური ლავა",
    soilEn: "Akadama & Volcanic Bonsai Soil",
    tempKa: "14°C - 26°C",
    tempEn: "14°C - 26°C",
    careLevelKa: "გამოცდილი",
    careLevelEn: "Expert Care",
    humidityKa: "50% - 70%",
    humidityEn: "50% - 70%",
    scientificFamily: "Bonsai Specimen",
  },
  sansevieria: {
    lightKa: "ნებისმიერი (ჩრდილიდან მზემდე)",
    lightEn: "Any Light (Low to Full Sun)",
    wateringKa: "თვეში 1-2-ჯერ (მხოლოდ სრულ გაშრობაზე)",
    wateringEn: "1-2x per month (let fully dry)",
    soilKa: "სუქულენტის / კაქტუსის გრუნტი",
    soilEn: "Succulent & Cactus Grit",
    tempKa: "15°C - 30°C",
    tempEn: "15°C - 30°C",
    careLevelKa: "უაღრესად მარტივი",
    careLevelEn: "Extremely Hardy",
    humidityKa: "30% - 50%",
    humidityEn: "30% - 50%",
    scientificFamily: "Asparagaceae",
  },
  "zz-plant": {
    lightKa: "ჩრდილი / გაფანტული შუქი",
    lightEn: "Low to Moderate Light",
    wateringKa: "2-3 კვირაში 1-ჯერ",
    wateringEn: "1x every 2-3 weeks",
    soilKa: "ფხვიერი დრენირებადი გრუნტი",
    soilEn: "Well-Draining Potting Soil",
    tempKa: "16°C - 26°C",
    tempEn: "16°C - 26°C",
    careLevelKa: "უაღრესად მარტივი",
    careLevelEn: "Virtually Indestructible",
    humidityKa: "35% - 55%",
    humidityEn: "35% - 55%",
    scientificFamily: "Araceae",
  },
  "rare-variegated": {
    lightKa: "კაშკაშა გაფანტული (ვარიეგაციისთვის)",
    lightEn: "Bright Filtered (for Variegation)",
    wateringKa: "კვირაში 1-ჯერ (ზომიერად)",
    wateringEn: "1x per week (moderately)",
    soilKa: "პრემიუმ აროიდული სუბსტრატი",
    soilEn: "Premium Chunky Aroid Mix",
    tempKa: "20°C - 27°C",
    tempEn: "20°C - 27°C",
    careLevelKa: "საშუალო / გამოცდილი",
    careLevelEn: "Intermediate to Expert",
    humidityKa: "65% - 85%",
    humidityEn: "65% - 85%",
    scientificFamily: "Rare Aroid / Variegata",
  },
  cutting: {
    lightKa: "რბილი გაფანტული სინათლე",
    lightEn: "Soft Diffused Light",
    wateringKa: "წყალში / სფაგნუმში მუდმივი ტენი",
    wateringEn: "Keep moist in water/moss",
    soilKa: "პერლიტი / სფაგნუმის ხავსი / წყალი",
    soilEn: "Perlite / Sphagnum / Water",
    tempKa: "20°C - 26°C",
    tempEn: "20°C - 26°C",
    careLevelKa: "მარტივი",
    careLevelEn: "Easy",
    humidityKa: "70% - 90%",
    humidityEn: "70% - 90%",
    scientificFamily: "Rooted Cutting",
  },
  "outdoor-garden": {
    lightKa: "ღია ცის ქვეშ / პირდაპირი მზე",
    lightEn: "Full Outdoor Sun / Partial Shade",
    wateringKa: "კვირაში 2-3 ჯერ (სეზონურად)",
    wateringEn: "2-3x per week (seasonal)",
    soilKa: "ბაღის ნოყიერი ნიადაგი",
    soilEn: "Rich Garden Soil",
    tempKa: "-5°C - 35°C (ყინვაგამძლე)",
    tempEn: "-5°C - 35°C (Frost Tolerant)",
    careLevelKa: "საშუალო",
    careLevelEn: "Moderate",
    humidityKa: "ბუნებრივი გარემო",
    humidityEn: "Natural Outdoor",
    scientificFamily: "Garden Flora",
  },
};

export function getBotanicalCareDetails(listing: any): PlantCareInfo {
  // If explicitly categorized
  const catKey = (listing.plant_category || listing.plantCategory || "").toLowerCase();
  if (catKey && BOTANICAL_CARE_DATABASE[catKey]) {
    return BOTANICAL_CARE_DATABASE[catKey];
  }

  // Detect by title, latin name, description or tags
  const fullText = `${listing.title_ka || listing.titleKa || ""} ${listing.title_en || listing.titleEn || ""} ${listing.description_ka || listing.descriptionKa || ""} ${JSON.stringify(listing.trade_preferences || listing.tradePreferences || [])}`.toLowerCase();

  if (fullText.includes("monstera") || fullText.includes("მონსტერა") || fullText.includes("ალბო") || fullText.includes("constellation")) {
    return BOTANICAL_CARE_DATABASE["monstera"];
  }
  if (fullText.includes("philodendron") || fullText.includes("ფილოდენდრონი") || fullText.includes("princess") || fullText.includes("birkin")) {
    return BOTANICAL_CARE_DATABASE["philodendron"];
  }
  if (fullText.includes("cactus") || fullText.includes("succulent") || fullText.includes("კაქტუს") || fullText.includes("სუქულენტ") || fullText.includes("სუკულენტ") || fullText.includes("ალოე") || fullText.includes("ეჩევერია")) {
    return BOTANICAL_CARE_DATABASE["cactus-succulent"];
  }
  if (fullText.includes("orchid") || fullText.includes("ორქიდეა") || fullText.includes("phalaenopsis") || fullText.includes("ფალენოპსის")) {
    return BOTANICAL_CARE_DATABASE["orchid"];
  }
  if (fullText.includes("anthurium") || fullText.includes("ანთურიუმ") || fullText.includes("clarinervium")) {
    return BOTANICAL_CARE_DATABASE["anthurium"];
  }
  if (fullText.includes("alocasia") || fullText.includes("ალოკაზია") || fullText.includes("frydek") || fullText.includes("polly")) {
    return BOTANICAL_CARE_DATABASE["alocasia"];
  }
  if (fullText.includes("calathea") || fullText.includes("maranta") || fullText.includes("კალათეა") || fullText.includes("მარანტა")) {
    return BOTANICAL_CARE_DATABASE["calathea"];
  }
  if (fullText.includes("pothos") || fullText.includes("scindapsus") || fullText.includes("პოთოს") || fullText.includes("სცინდაპსუს") || fullText.includes("ეპიპრემნუმ")) {
    return BOTANICAL_CARE_DATABASE["pothos-scindapsus"];
  }
  if (fullText.includes("ficus") || fullText.includes("ფიკუს") || fullText.includes("lyrata") || fullText.includes("ლირატა")) {
    return BOTANICAL_CARE_DATABASE["ficus"];
  }
  if (fullText.includes("sansevieria") || fullText.includes("სანსევიერია") || fullText.includes("ხანჯალა") || fullText.includes("snake plant")) {
    return BOTANICAL_CARE_DATABASE["sansevieria"];
  }
  if (fullText.includes("zz") || fullText.includes("ზამიოკულკას") || fullText.includes("zamioculcas") || fullText.includes("raven")) {
    return BOTANICAL_CARE_DATABASE["zz-plant"];
  }
  if (fullText.includes("palm") || fullText.includes("პალმა") || fullText.includes("areca")) {
    return BOTANICAL_CARE_DATABASE["palm"];
  }
  if (fullText.includes("fern") || fullText.includes("გვიმრა")) {
    return BOTANICAL_CARE_DATABASE["fern"];
  }
  if (fullText.includes("bonsai") || fullText.includes("ბონსაი")) {
    return BOTANICAL_CARE_DATABASE["bonsai"];
  }

  // Default houseplant care
  return BOTANICAL_CARE_DATABASE["monstera"];
}
