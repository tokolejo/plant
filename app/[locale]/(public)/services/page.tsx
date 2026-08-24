"use client";

import * as React from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { 
  Wrench, 
  TreePine, 
  Sparkles, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Star, 
  ShieldCheck, 
  Search, 
  X, 
  Plus, 
  ChevronRight, 
  Clock, 
  Droplets, 
  Building2, 
  Stethoscope, 
  CheckCircle2, 
  ExternalLink,
  Layers,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface GardeningService {
  id: string;
  provider_id?: string;
  provider_name: string;
  provider_avatar?: string;
  is_verified: boolean;
  category: "PRUNING" | "LANDSCAPE" | "LAWN" | "GREENING" | "IRRIGATION" | "DOCTOR_VISIT";
  title: string;
  description: string;
  price_from: number;
  price_unit: string;
  city: string;
  phone: string;
  whatsapp?: string;
  portfolio_images: string[];
  rating: number;
  reviews_count: number;
  created_at?: string;
}

const CATEGORIES = [
  { id: "ALL", label: "ყველა სერვისი", icon: Wrench },
  { id: "PRUNING", label: "ხეების გასხვლა & ფორმირება", icon: TreePine },
  { id: "LANDSCAPE", label: "ლანდშაფტის დიზაინი", icon: Sparkles },
  { id: "LAWN", label: "რულონური გაზონი & მოვლა", icon: Layers },
  { id: "GREENING", label: "ოფისების გამწვანება", icon: Building2 },
  { id: "IRRIGATION", label: "სარწყავი სისტემების მონტაჟი", icon: Droplets },
  { id: "DOCTOR_VISIT", label: "მცენარის ექიმის გამოძახება", icon: Stethoscope },
];

const SEED_SERVICES: GardeningService[] = [
  {
    id: "srv-1",
    provider_name: "GreenCraft ლანდშაფტი",
    provider_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    is_verified: true,
    category: "LANDSCAPE",
    title: "ეზოსა და აგარაკის სრული ლანდშაფტური დაგეგმარება 3D ვიზუალიზაციით",
    description: "პროფესიონალური ლანდშაფტური არქიტექტურა, მცენარეების შერჩევა ქართული კლიმატისთვის, განათება და ბილიკების მოწყობა.",
    price_from: 25,
    price_unit: "მ²-დან",
    city: "თბილისი & მცხეთა",
    phone: "+995599123456",
    whatsapp: "995599123456",
    portfolio_images: [
      "https://images.unsplash.com/photo-1558904541-efa8c4a08931?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1584467746765-a8f895c10fa8?auto=format&fit=crop&w=600&q=80",
    ],
    rating: 4.9,
    reviews_count: 24,
  },
  {
    id: "srv-2",
    provider_name: "ოსტატი გიორგი — მებაღე",
    provider_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    is_verified: true,
    category: "PRUNING",
    title: "ხეხილისა და დეკორატიული ხეების გასხვლა, შეწამვლა და გაახალგაზრდავება",
    description: "15-წლიანი გამოცდილება. ხეხილის სწორი ფორმირება უხვი მოსავლიანობისთვის, მშრალი ტოტების უსაფრთხო მოჭრა.",
    price_from: 35,
    price_unit: "ხეზე",
    city: "თბილისი, რუსთავი, კახეთი",
    phone: "+995598765432",
    whatsapp: "995598765432",
    portfolio_images: [
      "https://images.unsplash.com/photo-1592417817098-8f3d6eb22295?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1617576683096-00fc8eecb3af?auto=format&fit=crop&w=600&q=80",
    ],
    rating: 5.0,
    reviews_count: 38,
  },
  {
    id: "srv-3",
    provider_name: "HydroGarden Georgia",
    provider_avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80",
    is_verified: true,
    category: "IRRIGATION",
    title: "ავტომატური სარწყავი & წვეთოვანი სისტემების პროექტირება და მონტაჟი (Hunter, RainBird)",
    description: "სმარტფონით მართვადი ჭკვიანი სარწყავი სისტემები გაზონისა და ბაღებისთვის. წყლის 50%-იანი ეკონომია.",
    price_from: 150,
    price_unit: "წერტილიდან",
    city: "მთელი საქართველო",
    phone: "+995591998877",
    whatsapp: "995591998877",
    portfolio_images: [
      "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
    ],
    rating: 4.8,
    reviews_count: 19,
  },
  {
    id: "srv-4",
    provider_name: "PlantDoctor — ბიო ექიმი",
    provider_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
    is_verified: true,
    category: "DOCTOR_VISIT",
    title: "მცენარეთა ექიმის ვიზიტი ადგილზე — დაავადებების დიაგნოსტიკა, შეწამვლა & მკურნალობა",
    description: "ოთახის მცენარეების, ორანჟერეებისა და ეზოს მცენარეების კომპლექსური გაჯანსაღება ეკოლოგიურად სუფთა ბიო-პრეპარატებით.",
    price_from: 60,
    price_unit: "ვიზიტზე",
    city: "თბილისი",
    phone: "+995597112233",
    whatsapp: "995597112233",
    portfolio_images: [
      "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=80",
    ],
    rating: 4.9,
    reviews_count: 42,
  },
  {
    id: "srv-5",
    provider_name: "RollLawn Georgia",
    provider_avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    is_verified: true,
    category: "LAWN",
    title: "პრემიუმ ხარისხის რულონური გაზონის დაგება, გასუფთავება და მოვლა",
    description: "სპორტული და დეკორატიული ცოცხალი გაზონი პირდაპირ პლანტაციიდან. ნიადაგის მომზადება და 100%-იანი გახარების გარანტია.",
    price_from: 14,
    price_unit: "მ²",
    city: "თბილისი, ბათუმი, ქუთაისი",
    phone: "+995593445566",
    whatsapp: "995593445566",
    portfolio_images: [
      "https://images.unsplash.com/photo-1599818816942-0f04c6e93892?auto=format&fit=crop&w=600&q=80",
    ],
    rating: 4.7,
    reviews_count: 31,
  },
  {
    id: "srv-6",
    provider_name: "BioOffice Green",
    provider_avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80",
    is_verified: true,
    category: "GREENING",
    title: "ოფისების, რესტორნებისა და ვერანდების ფიტოდიზაინი & მცენარეებით გამწვანება",
    description: "ინტერიერის გამწვანება, ვერტიკალური ბაღები და ცოცხალი კედლები. ყოველთვიური სააბონენტო მომსახურებით.",
    price_from: 200,
    price_unit: "ობიექტიდან",
    city: "თბილისი, ბათუმი",
    phone: "+995599887766",
    whatsapp: "995599887766",
    portfolio_images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80",
    ],
    rating: 5.0,
    reviews_count: 15,
  },
];

export default function GardeningServicesPage() {
  const locale = useLocale();
  const isKa = locale !== "en";
  const supabase = createClient();

  const [services, setServices] = React.useState<GardeningService[]>(SEED_SERVICES);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
  const [selectedCity, setSelectedCity] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  React.useEffect(() => {
    async function fetchDbServices() {
      try {
        const { data, error } = await supabase
          .from("gardening_services")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          setServices([...data, ...SEED_SERVICES]);
        }
      } catch (err) {
        console.warn("Using seed services:", err);
      }
    }
    fetchDbServices();
  }, [supabase]);

  const filteredServices = React.useMemo(() => {
    return services.filter((srv) => {
      if (selectedCategory !== "ALL" && srv.category !== selectedCategory) return false;

      if (selectedCity !== "ALL") {
        if (!srv.city.toLowerCase().includes(selectedCity.toLowerCase())) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          srv.title.toLowerCase().includes(q) ||
          srv.description.toLowerCase().includes(q) ||
          srv.provider_name.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [services, selectedCategory, selectedCity, searchQuery]);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-6xl space-y-8">
      {/* 1. Header & Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/60">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 text-xs font-black">
            <Wrench className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isKa ? "მებაღეობა & გამწვანება" : "Pro Gardening & Landscaping"}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
            {isKa ? "მებაღეობის & გამწვანების სერვისები" : "Gardening & Landscaping Services"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {isKa
              ? "იპოვეთ გამოცდილი მებაღეები, ლანდშაფტის დიზაინერები, ხეების მესხვლელები და სარწყავი სისტემების ოსტატები მთელი საქართველოს მასშტაბით."
              : "Find trusted gardeners, landscape architects, tree pruning pros, and irrigation installers across Georgia."}
          </p>
        </div>

        <Link href="/dashboard/services">
          <Button
            type="button"
            className="rounded-[16px] bg-primary hover:bg-primary/90 text-white font-black text-xs sm:text-sm h-12 px-5 gap-2 shadow-ambient cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isKa ? "სერვისის დამატება" : "Offer a Service"}</span>
          </Button>
        </Link>
      </div>

      {/* 2. Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const CatIcon = cat.icon;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-[14px] text-xs font-black whitespace-nowrap transition-all cursor-pointer shadow-2xs flex items-center gap-2 ${
                isSelected
                  ? "bg-emerald-600 text-white shadow-ambient scale-102"
                  : "bg-card text-muted-foreground hover:text-foreground border border-border/80"
              }`}
            >
              <CatIcon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Search & City Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-[22px] bg-secondary-container/40 border border-border/60">
        <div className="sm:col-span-2 relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isKa ? "მოძებნეთ სერვისი, მებაღე ან მომსახურება..." : "Search services..."}
            className="h-10 pl-9 rounded-[14px] text-xs font-bold bg-card"
          />
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full h-10 px-3 rounded-[14px] border border-border/80 bg-card text-xs font-bold text-foreground outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="ALL">ყველა ქალაქი / რეგიონი</option>
            <option value="თბილისი">თბილისი</option>
            <option value="ბათუმი">ბათუმი</option>
            <option value="ქუთაისი">ქუთაისი</option>
            <option value="მცხეთა">მცხეთა</option>
            <option value="რუსთავი">რუსთავი</option>
            <option value="კახეთი">კახეთი</option>
          </select>
        </div>
      </div>

      {/* 4. Services Catalog Grid */}
      {filteredServices.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-border/80 rounded-[24px] bg-card/40 p-8 space-y-3">
          <Wrench className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <h3 className="text-base font-black text-foreground">
            {isKa ? "სერვისები ამ ფილტრით ვერ მოიძებნა" : "No services found"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isKa ? "სცადეთ სხვა კატეგორიის ან ქალაქის არჩევა." : "Try adjusting your filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((srv) => (
            <div
              key={srv.id}
              className="rounded-[24px] border border-border/80 bg-card p-5 shadow-2xs hover:shadow-ambient transition-all flex flex-col justify-between space-y-4 group overflow-hidden"
            >
              {/* Top: Portfolio Image Carousel / Thumbnail */}
              <div className="space-y-3.5">
                {srv.portfolio_images && srv.portfolio_images.length > 0 && (
                  <div className="relative h-44 w-full rounded-[18px] overflow-hidden bg-surface-container border border-border/60">
                    <img
                      src={srv.portfolio_images[0]}
                      alt={srv.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-black border border-white/20">
                        {srv.city}
                      </span>
                    </div>
                  </div>
                )}

                {/* Provider Header */}
                <div className="flex items-center gap-3">
                  {srv.provider_avatar ? (
                    <img
                      src={srv.provider_avatar}
                      alt={srv.provider_name}
                      className="h-9 w-9 rounded-full object-cover border border-border shrink-0 shadow-2xs"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                      {srv.provider_name.charAt(0)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-black text-foreground truncate">
                        {srv.provider_name}
                      </h4>
                      {srv.is_verified && (
                        <span title="ვერიფიცირებული ოსტატი">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold">
                      <Star className="w-3 h-3 fill-amber-500" />
                      <span>{srv.rating}</span>
                      <span className="text-muted-foreground font-normal">({srv.reviews_count})</span>
                    </div>
                  </div>
                </div>

                {/* Service Title & Desc */}
                <div>
                  <h3 className="text-sm font-black text-foreground leading-snug line-clamp-2">
                    {srv.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {srv.description}
                  </p>
                </div>
              </div>

              {/* Bottom: Pricing & Direct Actions */}
              <div className="pt-3 border-t border-border/50 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    საორიენტაციო ფასი
                  </span>
                  <div className="text-right">
                    <span className="text-base font-black text-emerald-700 dark:text-emerald-300">
                      {srv.price_from} ₾
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">/ {srv.price_unit}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${srv.phone}`}
                    className="h-9 px-3 rounded-[12px] bg-secondary-container/60 hover:bg-secondary-container text-foreground text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-border/40"
                  >
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    <span>დარეკვა</span>
                  </a>

                  {srv.whatsapp ? (
                    <a
                      href={`https://wa.me/${srv.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`გამარჯობა, დავინტერესდი თქვენი სერვისით Plant.ge-ზე: „${srv.title}“`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 px-3 rounded-[12px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  ) : (
                    <a
                      href={`tel:${srv.phone}`}
                      className="h-9 px-3 rounded-[12px] bg-primary hover:bg-primary/90 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <span>კონტაქტი</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
