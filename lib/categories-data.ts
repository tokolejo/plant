export interface TaxonomyCategory {
  id: string;
  nameKa: string;
  nameEn: string;
  emoji: string;
  itemType: "PLANT" | "INVENTORY";
  keywords: string[];
}

export const STRUCTURED_CATEGORIES: TaxonomyCategory[] = [
  // ─── 🌿 1. Aroids & Foliage (Araceae) ──────────────────────────────────────
  { 
    id: "monstera", 
    nameKa: "მონსტერა (Monstera)", 
    nameEn: "Monstera", 
    emoji: "🌿", 
    itemType: "PLANT", 
    keywords: ["მონსტერა", "monstera", "ალბო", "ტაი", "დელიციოზა", "ადონსონი", "დუბია", "სილტეპეკანა", "monstera deliciosa", "thai constellation", "albo", "adansonii", "dubia", "standleyana"] 
  },
  { 
    id: "philodendron", 
    nameKa: "ფილოდენდრონი (Philodendron)", 
    nameEn: "Philodendron", 
    emoji: "🌱", 
    itemType: "PLANT", 
    keywords: ["ფილოდენდრონი", "philodendron", "პრინცესა", "რაინდი", "ბიროკინი", "გლორიოზუმი", "ვერუკოზუმი", "მიკანსი", "pink princess", "white knight", "birkin", "gloriosum", "verrucosum", "melanochrysum", "micans", "xanadu"] 
  },
  { 
    id: "anthurium", 
    nameKa: "ანთურიუმი (Anthurium)", 
    nameEn: "Anthurium", 
    emoji: "🌺", 
    itemType: "PLANT", 
    keywords: ["ანთურიუმი", "anthurium", "კლარინერვიუმი", "ანდრეანუმი", "კრისტალინუმი", "ვაროკვეანუმი", "clarinervium", "andreanum", "crystallinum", "warocqueanum", "luxurians", "regale"] 
  },
  { 
    id: "alocasia", 
    nameKa: "ალოკაზია (Alocasia)", 
    nameEn: "Alocasia", 
    emoji: "🍃", 
    itemType: "PLANT", 
    keywords: ["ალოკაზია", "alocasia", "პოლი", "ფრაიდეკი", "ამაზონიკა", "დრაგონ სკეილი", "ბლექ ველვეტი", "ზებრინა", "polly", "frydek", "amazonica", "dragon scale", "black velvet", "zebrina", "silver dragon"] 
  },
  { 
    id: "syngonium", 
    nameKa: "სინგონიუმი (Syngonium)", 
    nameEn: "Syngonium", 
    emoji: "🌱", 
    itemType: "PLANT", 
    keywords: ["სინგონიუმი", "syngonium", "ნეონი", "ალბო", "რედ სპოტი", "მოხიტო", "arrowhead", "neon robusta", "albo variegata", "red spot", "mojito", "wendlandii"] 
  },
  { 
    id: "pothos-scindapsus", 
    nameKa: "პოთოსი & სცინდაპსუსი (Epipremnum)", 
    nameEn: "Pothos & Scindapsus", 
    emoji: "🌾", 
    itemType: "PLANT", 
    keywords: ["პოთოსი", "სცინდაპსუსი", "ეპიპრემნუმი", "pothos", "scindapsus", "epipremnum", "golden pothos", "marble queen", "neon pothos", "pictus", "trebie", "moonlight"] 
  },
  { 
    id: "aglaonema", 
    nameKa: "აგლაონემა (Aglaonema)", 
    nameEn: "Aglaonema", 
    emoji: "🌿", 
    itemType: "PLANT", 
    keywords: ["აგლაონემა", "aglaonema", "chinese evergreen", "silver bay", "pink dalmatian", "crete", "lady valentine", "წითელი აგლაონემა"] 
  },
  { 
    id: "spathiphyllum", 
    nameKa: "სპატიფილუმი (ქალური ბედნიერება)", 
    nameEn: "Peace Lily (Spathiphyllum)", 
    emoji: "🤍", 
    itemType: "PLANT", 
    keywords: ["სპატიფილუმი", "ქალური ბედნიერება", "spathiphyllum", "peace lily", "დომინო", "domino", "sensation", "თეთრი ყვავილი"] 
  },
  { 
    id: "dieffenbachia", 
    nameKa: "დიფენბახია (Dieffenbachia)", 
    nameEn: "Dieffenbachia", 
    emoji: "🍃", 
    itemType: "PLANT", 
    keywords: ["დიფენბახია", "dieffenbachia", "dumb cane", "camilla", "tropic snow", "reflector"] 
  },

  // ─── 🌵 2. Succulents & Cacti (Cactaceae / Crassulaceae) ───────────────────
  { 
    id: "cactus-succulent", 
    nameKa: "კაქტუსი & სუქულენტი", 
    nameEn: "Cactus & Succulent", 
    emoji: "🌵", 
    itemType: "PLANT", 
    keywords: ["კაქტუსი", "სუქულენტი", "სუკულენტი", "cactus", "succulent", "ეჩევერია", "ჰავორტია", "კრასულა", "ალოე", "სედუმი", "კალანჰოე", "ბარაქის ხე", "echeveria", "haworthia", "crassula", "aloe", "sedum", "kalanchoe", "jade plant"] 
  },
  { 
    id: "sansevieria", 
    nameKa: "სანსევიერია / ხანჯალა (Snake Plant)", 
    nameEn: "Sansevieria (Snake Plant)", 
    emoji: "🪴", 
    itemType: "PLANT", 
    keywords: ["სანსევიერია", "ხანჯალა", "sansevieria", "გველის მცენარე", "ლაურენტი", "მუნშაინი", "ვეილ ფინი", "snake plant", "laurentii", "moonshine", "cylindrica", "whale fin"] 
  },
  { 
    id: "zz-plant", 
    nameKa: "ზამიოკულკასი / დოლარის ხე (ZZ Plant)", 
    nameEn: "ZZ Plant (Zamioculcas)", 
    emoji: "🌿", 
    itemType: "PLANT", 
    keywords: ["ზამიოკულკასი", "ზზ", "zz", "დოლარის ხე", "zamioculcas", "რავენი", "ზენზი", "raven", "zenzi", "chameleon"] 
  },
  { 
    id: "euphorbia", 
    nameKa: "ეუფორბია / რძიანა (Euphorbia)", 
    nameEn: "Euphorbia", 
    emoji: "🌵", 
    itemType: "PLANT", 
    keywords: ["ეუფორბია", "რძიანა", "euphorbia", "trigona", "crown of thorns", "pencil cactus", "აფრიკული რძიანა"] 
  },

  // ─── 🌳 3. Trees, Shrubs & Wood (Moraceae / Dracaena) ──────────────────────
  { 
    id: "ficus", 
    nameKa: "ფიკუსი (Ficus)", 
    nameEn: "Ficus", 
    emoji: "🌳", 
    itemType: "PLANT", 
    keywords: ["ფიკუსი", "ficus", "ლირატა", "ბენჯამინა", "ელასტიკა", "რობუსტა", "მიკროკარპა", "ოდრი", "lyrata", "benjamina", "elastica", "robusta", "audrey", "ginseng", "rubber tree"] 
  },
  { 
    id: "dracaena-cordyline", 
    nameKa: "დრაცენა & კორდილინა (Dracaena)", 
    nameEn: "Dracaena & Cordyline", 
    emoji: "🌴", 
    itemType: "PLANT", 
    keywords: ["დრაცენა", "კორდილინა", "dracaena", "cordyline", "მარგინატა", "ფრაგრონსი", "ლაქი ბამბუკი", "marginata", "fragrans", "lucky bamboo"] 
  },
  { 
    id: "schefflera", 
    nameKa: "შეფლერა / ქოლგის ხე (Schefflera)", 
    nameEn: "Schefflera", 
    emoji: "🌿", 
    itemType: "PLANT", 
    keywords: ["შეფლერა", "ქოლგის ხე", "schefflera", "umbrella tree", "arboricola", "ჭრელი შეფლერა"] 
  },
  { 
    id: "citrus-fruit", 
    nameKa: "ციტრუსი & ყავის ხე (Citrus & Fruit)", 
    nameEn: "Citrus & Fruiting Plants", 
    emoji: "🍋", 
    itemType: "PLANT", 
    keywords: ["ლიმონი", "ციტრუსი", "კალამონდინი", "ყავა", "ყავის ხე", "კუმკვატი", "citrus", "lemon", "calamondin", "coffee arabica", "kumquat"] 
  },

  // ─── 🌸 4. Orchids, Hoyas & Flowers ─────────────────────────────────────────
  { 
    id: "orchid", 
    nameKa: "ორქიდეა (Orchid)", 
    nameEn: "Orchid", 
    emoji: "🌸", 
    itemType: "PLANT", 
    keywords: ["ორქიდეა", "orchid", "ფალენოპსისი", "დენდრობიუმი", "ვანდა", "ონციდიუმი", "კატლეია", "ციმბიდიუმი", "phalaenopsis", "dendrobium", "vanda", "cattleya", "oncidium", "cymbidium"] 
  },
  { 
    id: "hoya", 
    nameKa: "ხოია / ცვილისებრი ყვავილი (Hoya)", 
    nameEn: "Hoya (Wax Plant)", 
    emoji: "🌸", 
    itemType: "PLANT", 
    keywords: ["ხოია", "ცვილისებრი", "hoya", "carnosa", "kerrii", "pubicalyx", "australis", "krimson queen", "გულის ფორმის ხოია"] 
  },
  { 
    id: "begonia", 
    nameKa: "ბეგონია (Begonia)", 
    nameEn: "Begonia", 
    emoji: "🌺", 
    itemType: "PLANT", 
    keywords: ["ბეგონია", "begonia", "რექსი", "მაკულატა", "rex", "maculata", "polka dot", "ჭრელი ბეგონია"] 
  },
  { 
    id: "bromeliad-tillandsia", 
    nameKa: "ბრომელია & ტილანდსია (Air Plants)", 
    nameEn: "Bromeliad & Air Plants", 
    emoji: "🪻", 
    itemType: "PLANT", 
    keywords: ["ბრომელია", "ტილანდსია", "გუზმანია", "ვრიეზია", "tillandsia", "air plants", "guzmania", "vriesea", "bromeliad", "ჰაერის მცენარე"] 
  },
  { 
    id: "carnivorous", 
    nameKa: "მწერიჭამია მცენარეები (Carnivorous)", 
    nameEn: "Carnivorous Plants", 
    emoji: "🪤", 
    itemType: "PLANT", 
    keywords: ["მწერიჭამია", "დიონეა", "ნეპენტესი", "დროზერა", "venus flytrap", "nepenthes", "drosera", "sarracenia", "carnivorous"] 
  },

  // ─── 🍃 5. Jungle, Ferns, Palms & Shade ────────────────────────────────────
  { 
    id: "calathea", 
    nameKa: "კალათეა / მარანტა (Prayer Plant)", 
    nameEn: "Calathea & Maranta", 
    emoji: "🌿", 
    itemType: "PLANT", 
    keywords: ["კალათეა", "მარანტა", "calathea", "maranta", "ორბიფოლია", "ზებრინა", "სტრომანტე", "ქტენანტე", "orbifolia", "zebrina", "stromanthe", "ctenanthe", "rattlesnake", "medallion"] 
  },
  { 
    id: "fern", 
    nameKa: "გვიმრა (Fern)", 
    nameEn: "Fern", 
    emoji: "🌿", 
    itemType: "PLANT", 
    keywords: ["გვიმრა", "fern", "ნეფროლეპისი", "ასპლენიუმი", "პლატიცერიუმი", "ადიანტუმი", "nephrolepis", "asplenium", "staghorn", "maidenhair"] 
  },
  { 
    id: "palm", 
    nameKa: "პალმა & ციკასი (Palm & Cycad)", 
    nameEn: "Palm & Cycad", 
    emoji: "🌴", 
    itemType: "PLANT", 
    keywords: ["პალმა", "palm", "არეკა", "ხამედორეა", "კენტია", "ციკასი", "როიალ პალმა", "areca", "chamaedorea", "kentia", "cycas"] 
  },
  { 
    id: "peperomia", 
    nameKa: "პეპერომია (Peperomia)", 
    nameEn: "Peperomia", 
    emoji: "🍃", 
    itemType: "PLANT", 
    keywords: ["პეპერომია", "peperomia", "საზამთროსებრი", "watermelon", "hope", "prostrata", "string of turtles", "polybotrya"] 
  },

  // ─── 🎋 6. Special, Garden & Propagation ───────────────────────────────────
  { 
    id: "bonsai", 
    nameKa: "ბონსაი (Bonsai)", 
    nameEn: "Bonsai", 
    emoji: "🎋", 
    itemType: "PLANT", 
    keywords: ["ბონსაი", "bonsai", "მინიატურული ხე", "ღვია", "იაპონური ნეკერჩხალი", "ulmus", "juniper", "carmona"] 
  },
  { 
    id: "rare-variegated", 
    nameKa: "იშვიათი & ვარიეგატული კოლექცია", 
    nameEn: "Rare & Variegated Collection", 
    emoji: "✨", 
    itemType: "PLANT", 
    keywords: ["იშვიათი", "ვარიეგატული", "rare", "variegated", "ჭრელი", "მუტაცია", "tissue culture", "საკოლექციო"] 
  },
  { 
    id: "cutting", 
    nameKa: "კალმები & დასაფესვიანებელი ნერგები", 
    nameEn: "Cuttings & Rooted Starters", 
    emoji: "✂️", 
    itemType: "PLANT", 
    keywords: ["კალამი", "კალმები", "ნერგი", "ნერგები", "დაფესვიანებული", "cutting", "rooted", "კალამი წყალში"] 
  },
  { 
    id: "outdoor-garden", 
    nameKa: "ბაღის, ეზოს & მარადმწვანე მცენარეები", 
    nameEn: "Outdoor, Garden & Conifers", 
    emoji: "🌻", 
    itemType: "PLANT", 
    keywords: ["ბაღის", "ეზოს", "გარე", "outdoor", "garden", "ხე", "ბუჩქი", "ვარდი", "ჰორტენზია", "წიწვოვანი", "ტუია", "ლავანდა", "rose", "hydrangea", "conifer", "lavender"] 
  },
  { 
    id: "herbs-spices", 
    nameKa: "სამკურნალო მცენარეები & სანელებლები", 
    nameEn: "Herbs & Edible Greens", 
    emoji: "🌿", 
    itemType: "PLANT", 
    keywords: ["მწვანილი", "სანელებელი", "ბაზილიკი", "როზმარინი", "პიტნა", "თიმიანი", "herbs", "basil", "rosemary", "mint", "thyme"] 
  },
  { 
    id: "other-plant", 
    nameKa: "სხვა ოთახის & ბოტანიკური მცენარე", 
    nameEn: "Other Botanical Plant", 
    emoji: "🌱", 
    itemType: "PLANT", 
    keywords: ["სხვა", "მცენარე", "ოთახის", "other", "botanical", "houseplant"] 
  },
  
  // ─── 🏺 7. Inventory: Pots & Planters ──────────────────────────────────────
  { 
    id: "pots-ceramic", 
    nameKa: "კერამიკული, თიხის & ტერაკოტა ქოთნები", 
    nameEn: "Ceramic & Terracotta Pots", 
    emoji: "🏺", 
    itemType: "INVENTORY", 
    keywords: ["ქოთანი", "ქოთნები", "კერამიკა", "თიხა", "ტერაკოტა", "სადგამი", "თეფში", "pots", "ceramic", "clay", "terracotta"] 
  },
  { 
    id: "pots-plastic", 
    nameKa: "პლასტიკური & საწარმოო გამჭვირვალე ქოთნები", 
    nameEn: "Plastic & Clear Nursery Pots", 
    emoji: "🪣", 
    itemType: "INVENTORY", 
    keywords: ["პლასტიკი", "პლასტმასი", "საწარმოო", "გამჭვირვალე", "ტორფიანი", "კაშპო", "plastic", "nursery", "clear pot"] 
  },
  { 
    id: "pots-hanging", 
    nameKa: "ჩამოსაკიდი ქოთნები & მაკრამე", 
    nameEn: "Hanging Pots & Macrame", 
    emoji: "🧺", 
    itemType: "INVENTORY", 
    keywords: ["ჩამოსაკიდი", "მაკრამე", "კედლის", "hanging pot", "macrame", "planter"] 
  },
  { 
    id: "pots-selfwatering", 
    nameKa: "თვითმორწყვადი ქოთნები (Self-Watering)", 
    nameEn: "Self-Watering Pots", 
    emoji: "🪴", 
    itemType: "INVENTORY", 
    keywords: ["თვითმორწყვადი", "ლეჩუზა", "ავტომატური", "self watering", "lechuza"] 
  },

  // ─── 🌍 8. Inventory: Substrates, Soil & Nutrition ─────────────────────────
  { 
    id: "substrate-aroid", 
    nameKa: "აროიდების სუბსტრატი & ფიჭვის ქერქი", 
    nameEn: "Chunky Aroid Mix & Pine Bark", 
    emoji: "🪵", 
    itemType: "INVENTORY", 
    keywords: ["აროიდული", "სუბსტრატი", "ქერქი", "ფიჭვი", "ნახშირი", "aroid mix", "bark", "chunky soil", "charcoal"] 
  },
  { 
    id: "substrate-soil", 
    nameKa: "უნივერსალური გრუნტი, ნიადაგი & ტორფი", 
    nameEn: "All-Purpose Potting Soil & Peat", 
    emoji: "🌍", 
    itemType: "INVENTORY", 
    keywords: ["გრუნტი", "მიწა", "ნიადაგი", "ტორფი", "შავმიწა", "soil", "potting mix", "peat moss"] 
  },
  { 
    id: "substrate-grit", 
    nameKa: "პერლიტი, ვერმიკულიტი, ლავა & კერამზიტი", 
    nameEn: "Perlite, Vermiculite & Pumice", 
    emoji: "⚪", 
    itemType: "INVENTORY", 
    keywords: ["პერლიტი", "ვერმიკულიტი", "კერამზიტი", "ლავა", "პემზა", "დრენაჟი", "perlite", "vermiculite", "pumice", "leca"] 
  },
  { 
    id: "substrate-moss", 
    nameKa: "სფაგნუმის ხავსი & ქოქოსის ჩიფსი", 
    nameEn: "Sphagnum Moss & Coco Chips", 
    emoji: "🌾", 
    itemType: "INVENTORY", 
    keywords: ["სფაგნუმი", "ხავსი", "ქოქოსი", "კოირა", "sphagnum moss", "coco coir", "coco chips"] 
  },
  { 
    id: "fertilizer", 
    nameKa: "სასუქები, ვიტამინები & საკვები ელემენტები", 
    nameEn: "Fertilizers & Plant Nutrients", 
    emoji: "🧪", 
    itemType: "INVENTORY", 
    keywords: ["სასუქი", "ვიტამინი", "სასუქები", "კვება", "აზოტი", "ფოსფორი", "კალიუმი", "ორგანული", "npk", "fertilizer", "nutrients"] 
  },
  { 
    id: "pest-control", 
    nameKa: "მავნებლებისგან დაცვა, ფუნგიციდი & ინსექტიციდი", 
    nameEn: "Pest Control & Fungicides", 
    emoji: "🛡️", 
    itemType: "INVENTORY", 
    keywords: ["ინსექტიციდი", "ფუნგიციდი", "აკარიციდი", "მავნებელი", "ნემსის ზეთი", "ტკიპა", "pest control", "fungicide", "insecticide", "neem oil"] 
  },
  { 
    id: "tools-care", 
    nameKa: "მცენარის მაკრატლები & მოვლის ხელსაწყოები", 
    nameEn: "Plant Care Tools & Pruners", 
    emoji: "✂️", 
    itemType: "INVENTORY", 
    keywords: ["ხელსაწყო", "მაკრატელი", "სასხლავი", "საპკურებელი", "პულვერიზატორი", "ტენიანობის საზომი", "tools", "shears", "sprayer", "moisture meter"] 
  },
  { 
    id: "lighting-grow", 
    nameKa: "ფიტო-განათება & LED Grow Lights", 
    nameEn: "Grow Lights & Phytolamps", 
    emoji: "💡", 
    itemType: "INVENTORY", 
    keywords: ["ფიტო", "განათება", "ნათურა", "ლამპა", "ფიტონათურა", "ტაიმერი", "grow light", "lighting", "led grow light"] 
  },
  { 
    id: "trellis-poles", 
    nameKa: "ხავსის ბოძები (Moss Pole) & საყრდენები", 
    nameEn: "Moss Poles & Plant Supports", 
    emoji: "🪵", 
    itemType: "INVENTORY", 
    keywords: ["ხავსის ბოძი", "საყრდენი", "ბადე", "კლიპსი", "moss pole", "trellis", "plant support"] 
  },
];
