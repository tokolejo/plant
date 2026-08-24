export type ServiceCategory = 
  | "PRUNING" 
  | "LANDSCAPE" 
  | "LAWN" 
  | "GREENING" 
  | "IRRIGATION" 
  | "DOCTOR_VISIT"
  | "TRANSPLANT";

export interface GardeningServiceItem {
  id: string;
  provider_id?: string;
  provider_name: string;
  provider_avatar?: string;
  provider_bio?: string;
  provider_experience_years?: number;
  completed_jobs_count?: number;
  is_verified: boolean;
  category: ServiceCategory;
  title: string;
  description: string;
  price_from: number;
  price_unit: string; // e.g. "ხეზე", "მ²", "ვიზიტზე", "საათში", "პროექტზე"
  city: string;
  phone: string;
  whatsapp?: string;
  portfolio_images: string[];
  rating: number;
  reviews_count: number;
  included_features?: string[];
  working_hours?: string;
  created_at: string;
}

export interface ServiceCategoryMeta {
  id: ServiceCategory;
  labelKa: string;
  labelEn: string;
  descriptionKa: string;
  iconName: string;
}

export const SERVICE_CATEGORIES: ServiceCategoryMeta[] = [
  {
    id: "PRUNING",
    labelKa: "ხეების გასხვლა & ფორმირება",
    labelEn: "Tree Pruning & Shaping",
    descriptionKa: "ხეხილის, დეკორატიული და მაღალი ხეების პროფესიონალური გასხვლა და გაახალგაზრდავება",
    iconName: "TreePine",
  },
  {
    id: "LANDSCAPE",
    labelKa: "ლანდშაფტის დიზაინი",
    labelEn: "Landscape Architecture",
    descriptionKa: "ეზოებისა და აგარაკების 3D დაგეგმარება, მცენარეების შერჩევა და დარგვა",
    iconName: "Sparkles",
  },
  {
    id: "LAWN",
    labelKa: "რულონური გაზონი & მოვლა",
    labelEn: "Roll Lawn & Turf Care",
    descriptionKa: "ცოცხალი გაზონის დაგება, აერაცია, გათიბვა და ნიადაგის მომზადება",
    iconName: "Layers",
  },
  {
    id: "GREENING",
    labelKa: "ინტერიერის & ოფისის გამწვანება",
    labelEn: "Office & Interior Greening",
    descriptionKa: "ფიტოდიზაინი, ვერტიკალური ცოცხალი კედლები და ოფისების რეგულარული მოვლა",
    iconName: "Building2",
  },
  {
    id: "IRRIGATION",
    labelKa: "სარწყავი სისტემების მონტაჟი",
    labelEn: "Automatic Irrigation Systems",
    descriptionKa: "ავტომატური წვეთოვანი და სპრინკლერული სისტემები (Hunter, RainBird)",
    iconName: "Droplets",
  },
  {
    id: "DOCTOR_VISIT",
    labelKa: "მცენარეთა ექიმის გამოძახება",
    labelEn: "Plant Doctor House-calls",
    descriptionKa: "დაავადებების დიაგნოსტიკა, ბიო-შეწამვლა და მავნებლებისგან დაცვა ადგილზე ვიზიტით",
    iconName: "Stethoscope",
  },
  {
    id: "TRANSPLANT",
    labelKa: "გადარგვა & ნიადაგის მომზადება",
    labelEn: "Repotting & Soil Prep",
    descriptionKa: "დიდი ზომის მცენარეებისა და ხეების უსაფრთხო გადარგვა სპეციალური ნიადაგით",
    iconName: "Sprout",
  },
];

export const MOCK_SERVICES: GardeningServiceItem[] = [
  {
    id: "srv-1",
    provider_name: "GreenCraft ლანდშაფტი",
    provider_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    provider_bio: "ლანდშაფტური არქიტექტურისა და ურბანული გამწვანების სტუდია 8-წლიანი გამოცდილებით.",
    provider_experience_years: 8,
    completed_jobs_count: 142,
    is_verified: true,
    category: "LANDSCAPE",
    title: "ეზოსა და აგარაკის სრული ლანდშაფტური დაგეგმარება 3D ვიზუალიზაციით",
    description: "გთავაზობთ ეზოს, აგარაკისა და კომერციული ობიექტების სრულ ლანდშაფტურ პროექტირებას. მოიცავს: ტერიტორიის გეოდეზიურ აზომვას, 3D ფოტორეალისტურ ვიზუალიზაციას, მცენარეების შერჩევას ქართული კლიმატის გათვალისწინებით (ყინვაგამძლეობა, მზის ექსპოზიცია), დეკორატიული ბილიკებისა და გარე განათების გეგმას.",
    price_from: 25,
    price_unit: "მ²-დან",
    city: "თბილისი",
    phone: "+995599123456",
    whatsapp: "995599123456",
    portfolio_images: [
      "https://images.unsplash.com/photo-1558904541-efa8c4a08931?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1584467746765-a8f895c10fa8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1592417817098-8f3d6eb22295?auto=format&fit=crop&w=1200&q=80",
    ],
    rating: 4.9,
    reviews_count: 24,
    included_features: [
      "ადგილზე ვიზიტი & კონსულტაცია",
      "დეტალური 3D ვიზუალიზაცია",
      "დენდროლოგიური გეგმა & მცენარეთა ნუსხა",
      "ხარჯთაღრიცხვის შედგენა",
      "ავტორობის ზედამხედველობა",
    ],
    working_hours: "ორშაბათი - შაბათი: 09:00 - 19:00",
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
  },
  {
    id: "srv-2",
    provider_name: "ოსტატი გიორგი — მებაღე",
    provider_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    provider_bio: "პროფესიონალი მებაღე 15-წლიანი გამოცდილებით ხეხილის და დეკორატიული მცენარეების მოვლაში.",
    provider_experience_years: 15,
    completed_jobs_count: 310,
    is_verified: true,
    category: "PRUNING",
    title: "ხეხილისა და დეკორატიული ხეების გასხვლა, შეწამვლა და გაახალგაზრდავება",
    description: "ხეხილის (ვაშლი, მსხალი, ატამი, ბალი, კაკალი, ვაზი) სწორი ფორმირება უხვი და ხარისხიანი მოსავლისთვის. მშრალი, დაავადებული ტოტების უსაფრთხო მოჭრა, ჭრილობების დამუშავება ბაღის ვარით, სეზონური პროფილაქტიკური შეწამვლა ბორდოს ნარევითა და ბიო-ინსექტიციდებით.",
    price_from: 35,
    price_unit: "ხეზე",
    city: "თბილისი & მცხეთა",
    phone: "+995598765432",
    whatsapp: "995598765432",
    portfolio_images: [
      "https://images.unsplash.com/photo-1592417817098-8f3d6eb22295?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617576683096-00fc8eecb3af?auto=format&fit=crop&w=1200&q=80",
    ],
    rating: 5.0,
    reviews_count: 38,
    included_features: [
      "პროფესიონალური ხელსაწყოებით მუშაობა (Stihl, Felco)",
      "ჭრილობების ბიო-დეზინფექცია",
      "მოჭრილი ტოტების დაქუცმაცება / შეგროვება",
      "მოვლის რეკომენდაციები მომდევნო სეზონისთვის",
    ],
    working_hours: "ყოველდღე: 08:00 - 20:00",
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
  },
  {
    id: "srv-3",
    provider_name: "HydroGarden Georgia",
    provider_avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80",
    provider_bio: "ჭკვიანი საინჟინრო სარწყავი სისტემების ავტორიზებული ინსტალატორი საქართველოში.",
    provider_experience_years: 10,
    completed_jobs_count: 185,
    is_verified: true,
    category: "IRRIGATION",
    title: "ავტომატური სარწყავი & წვეთოვანი სისტემების პროექტირება და მონტაჟი (Hunter, RainBird)",
    description: "სრული ციკლი: ჰიდრავლიკური გათვლა, მილსადენების გაყვანა, სარქველების მონტაჟი, წვიმის სენსორებისა და Wi-Fi ჭკვიანი კონტროლერის ინტეგრაცია (სმარტფონიდან მართვა). სისტემა უზრუნველყოფს წყლის თანაბარ განაწილებას და 50%-იან ეკონომიას.",
    price_from: 150,
    price_unit: "წერტილიდან",
    city: "მთელი საქართველო",
    phone: "+995591998877",
    whatsapp: "995591998877",
    portfolio_images: [
      "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1584467746765-a8f895c10fa8?auto=format&fit=crop&w=1200&q=80",
    ],
    rating: 4.8,
    reviews_count: 19,
    included_features: [
      "ორიგინალი Hunter / RainBird კომპონენტები",
      "Wi-Fi კონტროლერის კონფიგურაცია",
      "ზამთრის დაკონსერვების ინსტრუქცია",
      "2-წლიანი გარანტია მონტაჟზე",
    ],
    working_hours: "ორშაბათი - პარასკევი: 09:00 - 18:00",
    created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
  },
  {
    id: "srv-4",
    provider_name: "PlantDoctor — ბიო ექიმი",
    provider_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    provider_bio: "აგრონომ-ბიოლოგი, სპეციალიზებული ოთახისა და ეგზოტიკური მცენარეების რეანიმაციაში.",
    provider_experience_years: 6,
    completed_jobs_count: 220,
    is_verified: true,
    category: "DOCTOR_VISIT",
    title: "მცენარეთა ექიმის ვიზიტი ადგილზე — დაავადებების დიაგნოსტიკა, შეწამვლა & მკურნალობა",
    description: "თუ თქვენს მცენარეს უყვითლდება ფოთლები, ეყრება კვირტები ან გაუჩნდა მავნებლები (ტკიპა, ფარიანა, ცრუფარიანა, ტრიპსი, ობი), ჩვენი სპეციალისტი ჩამოვა ადგილზე, დასვამს ზუსტ დიაგნოზს და ჩაატარებს მკურნალობას უსაფრთხო ბიოლოგიური პრეპარატებით, რომლებიც არ აზიანებს ადამიანებსა და შინაურ ცხოველებს.",
    price_from: 60,
    price_unit: "ვიზიტზე",
    city: "თბილისი",
    phone: "+995597112233",
    whatsapp: "995597112233",
    portfolio_images: [
      "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=1200&q=80",
    ],
    rating: 4.9,
    reviews_count: 42,
    included_features: [
      "ადგილზე სრული დიაგნოსტიკა",
      "პირველადი კომპლექსური შეწამვლა",
      "ნიადაგისა და ფესვთა სისტემის შემოწმება",
      "ინდივიდუალური სამკურნალო გეგმა",
    ],
    working_hours: "ყოველდღე: 10:00 - 20:00",
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: "srv-5",
    provider_name: "RollLawn Georgia",
    provider_avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    provider_bio: "რულონური გაზონის უმსხვილესი მწარმოებელი და პროფესიონალი შემსრულებელი.",
    provider_experience_years: 12,
    completed_jobs_count: 450,
    is_verified: true,
    category: "LAWN",
    title: "პრემიუმ ხარისხის რულონური გაზონის დაგება, გასუფთავება და მოვლა",
    description: "პირველი კატეგორიის სპორტული და დეკორატიული ცოცხალი გაზონი პირდაპირ პლანტაციიდან. სერვისი მოიცავს: მიწის მოხვნა-მოსწორებას, სარეველების მოცილებას, ნაყოფიერი შავი მიწის დაყრას, რულონების დაგებას, დატკეპნასა და პირველად მორწყვა-განაყოფიერებას.",
    price_from: 14,
    price_unit: "მ²",
    city: "თბილისი, ბათუმი, ქუთაისი",
    phone: "+995593445566",
    whatsapp: "995593445566",
    portfolio_images: [
      "https://images.unsplash.com/photo-1599818816942-0f04c6e93892?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1558904541-efa8c4a08931?auto=format&fit=crop&w=1200&q=80",
    ],
    rating: 4.7,
    reviews_count: 31,
    included_features: [
      "ახლად მოჭრილი მწვანე რულონური გაზონი",
      "ნიადაგის პროფესიონალური მომზადება",
      "დაგება და შეერთების ნაკერების დამუშავება",
      "100%-იანი გახარების გარანტია",
    ],
    working_hours: "ორშაბათი - შაბათი: 08:00 - 19:00",
    created_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
  },
  {
    id: "srv-6",
    provider_name: "BioOffice Green",
    provider_avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
    provider_bio: "კორპორატიული ფიტოდიზაინისა და სამუშაო სივრცეების გამწვანების კომპანია.",
    provider_experience_years: 7,
    completed_jobs_count: 95,
    is_verified: true,
    category: "GREENING",
    title: "ოფისების, რესტორნებისა და ვერანდების ფიტოდიზაინი & მცენარეებით გამწვანება",
    description: "სამუშაო გარემოს ეკოლოგიური გაუმჯობესება. ვარჩევთ მცენარეებს, რომლებიც ასუფთავებენ ჰაერს და ზრდიან გუნდის პროდუქტიულობას. ვამონტაჟებთ ცოცხალ კედლებს (ვერტიკალური გამწვანება) და გთავაზობთ ყოველთვიურ სააბონენტო მომსახურებას (მორწყვა, გაწმენდა, სასუქი, გარანტია).",
    price_from: 200,
    price_unit: "ობიექტიდან",
    city: "თბილისი, ბათუმი",
    phone: "+995599887766",
    whatsapp: "995599887766",
    portfolio_images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1200&q=80",
    ],
    rating: 5.0,
    reviews_count: 15,
    included_features: [
      "ოფისის განათებისა და მიკროკლიმატის აუდიტი",
      "პრემიუმ ქოთნებისა და მცენარეების მიწოდება",
      "ყოველთვიური პროფესიონალური მოვლა",
      "გამხმარი მცენარის უფასო შეცვლის გარანტია",
    ],
    working_hours: "ორშაბათი - პარასკევი: 09:00 - 18:00",
    created_at: new Date(Date.now() - 3600000 * 24 * 6).toISOString(),
  },
  {
    id: "srv-7",
    provider_name: "Tbilisi Plant Clinic",
    provider_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    provider_bio: "ოთახის დიდი მცენარეების გადარგვა და სუბსტრატების ექსპერტიზა.",
    provider_experience_years: 5,
    completed_jobs_count: 160,
    is_verified: true,
    category: "TRANSPLANT",
    title: "დიდი ზომის მცენარეების (ფიკუსი, მონსტერა, პალმა) უსაფრთხო გადარგვა",
    description: "გიგანტური ოთახის მცენარეების გადარგვა ფესვთა სისტემის დაზიანების გარეშე. მოგვაქვს სპეციალური პრემიუმ აროიდული სუბსტრატი (ქერქი, პერლიტი, ტორფი, ბიოჰუმუსი), დრენაჟი და შესაბამისი ზომის ქოთნები.",
    price_from: 45,
    price_unit: "მცენარეზე",
    city: "თბილისი",
    phone: "+995598112244",
    whatsapp: "995598112244",
    portfolio_images: [
      "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=1200&q=80",
    ],
    rating: 4.9,
    reviews_count: 27,
    included_features: [
      "სპეციალიზებული პრემიუმ გრუნტი",
      "ფესვების ანტისეპტიკური დამუშავება",
      "საყრდენების (მოსპოლების) მონტაჟი",
      "სისუფთავის დაცვა სამუშაოს შემდეგ",
    ],
    working_hours: "ყოველდღე: 09:00 - 21:00",
    created_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
  },
];
