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
  provider_slug?: string;
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
    provider_id: "greencraft-landscape",
    provider_slug: "greencraft-landscape",
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
      "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1598902108854-10e335adac99?w=800&auto=format&fit=crop&q=80",
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
];
