export interface TaxonomyCategory {
  id: string;
  nameKa: string;
  nameEn: string;
  emoji: string;
  itemType: "PLANT" | "INVENTORY";
  keywords: string[];
}

export const STRUCTURED_CATEGORIES: TaxonomyCategory[] = [
  // Plants
  { 
    id: "monstera", 
    nameKa: "მონსტერა (Monstera)", 
    nameEn: "Monstera", 
    emoji: "🌿", 
    itemType: "PLANT", 
    keywords: ["მონსტერა", "monstera", "ალბო", "ტაი", "დელიციოზა", "ადონსონი", "monstera deliciosa", "thai constellation", "albo"] 
  },
  { 
    id: "philodendron", 
    nameKa: "ფილოდენდრონი (Philodendron)", 
    nameEn: "Philodendron", 
    emoji: "🌱", 
    itemType: "PLANT", 
    keywords: ["ფილოდენდრონი", "philodendron", "პრინცესა", "რაინდი", "ბიროკინი", "pink princess", "white knight", "birkin"] 
  },
  { 
    id: "cactus-succulent", 
    nameKa: "კაქტუსი & სუქულენტი", 
    nameEn: "Cactus & Succulent", 
    emoji: "🌵", 
    itemType: "PLANT", 
    keywords: ["კაქტუსი", "სუქულენტი", "სუკულენტი", "cactus", "succulent", "ეჩევერია", "ჰავორტია", "კრასულა", "ალოე", "echeveria", "haworthia", "crassula", "aloe"] 
  },
  { 
    id: "orchid", 
    nameKa: "ორქიდეა (Orchid)", 
    nameEn: "Orchid", 
    emoji: "🌸", 
    itemType: "PLANT", 
    keywords: ["ორქიდეა", "orchid", "ფალენოპსისი", "დენდრობიუმი", "ვანდა", "ონციდიუმი", "phalaenopsis", "dendrobium", "vanda"] 
  },
  { 
    id: "anthurium", 
    nameKa: "ანთურიუმი (Anthurium)", 
    nameEn: "Anthurium", 
    emoji: "🌺", 
    itemType: "PLANT", 
    keywords: ["ანთურიუმი", "anthurium", "კლარინერვიუმი", "ანდრეანუმი", "კრისტალინუმი", "clarinervium", "andreanum", "crystallinum"] 
  },
  { 
    id: "alocasia", 
    nameKa: "ალოკაზია (Alocasia)", 
    nameEn: "Alocasia", 
    emoji: "🍃", 
    itemType: "PLANT", 
    keywords: ["ალოკაზია", "alocasia", "პოლი", "ფრაიდეკი", "ამაზონიკა", "დრაგონ სკეილი", "polly", "frydek", "amazonica", "dragon scale"] 
  },
  { 
    id: "calathea", 
    nameKa: "კალათეა / მარანტა", 
    nameEn: "Calathea / Maranta", 
    emoji: "🌿", 
    itemType: "PLANT", 
    keywords: ["კალათეა", "მარანტა", "calathea", "maranta", "ორბიფოლია", "ზებრინა", "სტრომანტე", "orbifolia", "zebrina", "stromanthe"] 
  },
  { 
    id: "pothos-scindapsus", 
    nameKa: "პოთოსი / სცინდაპსუსი", 
    nameEn: "Pothos / Scindapsus", 
    emoji: "🌾", 
    itemType: "PLANT", 
    keywords: ["პოთოსი", "სცინდაპსუსი", "pothos", "scindapsus", "ეპიპრემნუმი", "ოქროსფერი", "epipremnum", "golden pothos"] 
  },
  { 
    id: "ficus", 
    nameKa: "ფიკუსი (Ficus)", 
    nameEn: "Ficus", 
    emoji: "🌳", 
    itemType: "PLANT", 
    keywords: ["ფიკუსი", "ficus", "ლირატა", "ბენჯამინა", "ელასტიკა", "რობუსტა", "მიკროკარპა", "lyrata", "benjamina", "elastica", "robusta"] 
  },
  { 
    id: "palm", 
    nameKa: "პალმა (Palm)", 
    nameEn: "Palm", 
    emoji: "🌴", 
    itemType: "PLANT", 
    keywords: ["პალმა", "palm", "არეკა", "ხამედორეა", "ფიცი", "როიალ პალმა", "areca", "chamaedorea"] 
  },
  { 
    id: "fern", 
    nameKa: "გვიმრა (Fern)", 
    nameEn: "Fern", 
    emoji: "🌿", 
    itemType: "PLANT", 
    keywords: ["გვიმრა", "fern", "ნეფროლეპისი", "ასპლენიუმი", "პლატიცერიუმი", "nephrolepis", "asplenium"] 
  },
  { 
    id: "bonsai", 
    nameKa: "ბონსაი (Bonsai)", 
    nameEn: "Bonsai", 
    emoji: "🎋", 
    itemType: "PLANT", 
    keywords: ["ბონსაი", "bonsai", "მინიატურული ხე"] 
  },
  { 
    id: "sansevieria", 
    nameKa: "სანსევიერია / ხანჯალა", 
    nameEn: "Sansevieria", 
    emoji: "🪴", 
    itemType: "PLANT", 
    keywords: ["სანსევიერია", "ხანჯალა", "sansevieria", "გველის მცენარე", "ლაურენტი", "snake plant", "laurentii"] 
  },
  { 
    id: "zz-plant", 
    nameKa: "ზამიოკულკასი (ZZ Plant)", 
    nameEn: "ZZ Plant", 
    emoji: "🌿", 
    itemType: "PLANT", 
    keywords: ["ზამიოკულკასი", "ზზ", "zz", "დოლარის ხე", "zamioculcas", "რავენი", "raven"] 
  },
  { 
    id: "rare-variegated", 
    nameKa: "იშვიათი & ვარიეგატული", 
    nameEn: "Rare & Variegated", 
    emoji: "✨", 
    itemType: "PLANT", 
    keywords: ["იშვიათი", "ვარიეგატული", "rare", "variegated", "ჭრელი", "მუტაცია"] 
  },
  { 
    id: "cutting", 
    nameKa: "კალმები & ნერგები", 
    nameEn: "Cuttings & Rooted", 
    emoji: "✂️", 
    itemType: "PLANT", 
    keywords: ["კალამი", "კალმები", "ნერგი", "ნერგები", "დაფესვიანებული", "cutting", "rooted"] 
  },
  { 
    id: "outdoor-garden", 
    nameKa: "ბაღის & ეზოს მცენარეები", 
    nameEn: "Outdoor & Garden", 
    emoji: "🌻", 
    itemType: "PLANT", 
    keywords: ["ბაღის", "ეზოს", "გარე", "outdoor", "garden", "ხე", "ბუჩქი", "ყვავილი", "მარადმწვანე"] 
  },
  
  // Inventory
  { 
    id: "pots-ceramic", 
    nameKa: "კერამიკული ქოთნები & სადგამები", 
    nameEn: "Ceramic Pots & Saucers", 
    emoji: "🏺", 
    itemType: "INVENTORY", 
    keywords: ["ქოთანი", "ქოთნები", "კერამიკა", "თიხა", "სადგამი", "თეფში", "pots", "ceramic", "clay"] 
  },
  { 
    id: "pots-plastic", 
    nameKa: "პლასტიკური & საწარმოო ქოთნები", 
    nameEn: "Plastic & Nursery Pots", 
    emoji: "🪣", 
    itemType: "INVENTORY", 
    keywords: ["პლასტიკი", "პლასტმასი", "საწარმოო", "გამჭვირვალე", "ტორფიანი", "plastic", "nursery"] 
  },
  { 
    id: "substrate-soil", 
    nameKa: "სუბსტრატები, გრუნტი & პერლიტი", 
    nameEn: "Substrates, Soil & Perlite", 
    emoji: "🌍", 
    itemType: "INVENTORY", 
    keywords: ["სუბსტრატი", "გრუნტი", "მიწა", "ნიადაგი", "პერლიტი", "ვერმიკულიტი", "ნახშირი", "ქერქი", "ტორფი", "soil", "bark", "perlite", "substrate"] 
  },
  { 
    id: "fertilizer", 
    nameKa: "სასუქები, ვიტამინები & მოვლა", 
    nameEn: "Fertilizers & Nutrients", 
    emoji: "🧪", 
    itemType: "INVENTORY", 
    keywords: ["სასუქი", "ვიტამინი", "სასუქები", "კვება", "აზოტი", "ფოსფორი", "ფუნგიციდი", "ინსექტიციდი", "fertilizer", "nutrients"] 
  },
  { 
    id: "tools-care", 
    nameKa: "მცენარის მოვლის ხელსაწყოები", 
    nameEn: "Care Tools & Shears", 
    emoji: "🔧", 
    itemType: "INVENTORY", 
    keywords: ["ხელსაწყო", "მაკრატელი", "სასხლავი", "საპკურებელი", "პულვერიზატორი", "tools", "shears", "sprayer"] 
  },
  { 
    id: "lighting-grow", 
    nameKa: "ფიტო-განათება (Grow Light)", 
    nameEn: "Grow Lighting", 
    emoji: "💡", 
    itemType: "INVENTORY", 
    keywords: ["ფიტო", "განათება", "ნათურა", "ლამპა", "ფიტონათურა", "grow light", "lighting", "led"] 
  },
];
