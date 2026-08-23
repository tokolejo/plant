"use client";

import * as React from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { 
  Store, 
  MapPin, 
  Phone, 
  Star, 
  ShieldCheck, 
  Award, 
  Sprout, 
  ArrowRight,
  Search,
  Sparkles,
  CheckCircle2,
  SlidersHorizontal,
  Navigation
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface ShopProfile {
  id: string;
  name: string;
  slug: string;
  avatarUrl?: string;
  bannerUrl?: string;
  city: string;
  rating: number;
  totalReviews: number;
  verified: boolean;
  tier: "TIER_1" | "TIER_2" | "TIER_3" | "FREE";
  descriptionKa: string;
  descriptionEn: string;
  plantsCount: number;
  tags: string[];
}

const FEATURED_SHOPS: ShopProfile[] = [
  {
    id: "shop-1",
    name: "Tbilisi Flora Studio",
    slug: "tbilisi-flora",
    avatarUrl: "https://images.unsplash.com/photo-1545241047-6083a3684587?w=150&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=800&auto=format&fit=crop&q=80",
    city: "თბილისი",
    rating: 5.0,
    totalReviews: 28,
    verified: true,
    tier: "TIER_3",
    descriptionKa: "იშვიათი აროიდები, ვარიეგატული მონსტერები და პრემიუმ კერამიკული ქოთნები.",
    descriptionEn: "Rare aroids, variegated monsteras, and premium handcrafted ceramic pots.",
    plantsCount: 14,
    tags: ["Monstera", "Philodendron", "Rare Aroids", "Ceramics"]
  },
  {
    id: "shop-2",
    name: "Batumi Tropical Nursery",
    slug: "batumi-tropical",
    avatarUrl: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=150&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&auto=format&fit=crop&q=80",
    city: "ბათუმი",
    rating: 4.9,
    totalReviews: 19,
    verified: true,
    tier: "TIER_2",
    descriptionKa: "სუბტროპიკული ეგზოტიკური პალმები, ციტრუსები და გარე ეზოს მცენარეები.",
    descriptionEn: "Subtropical exotic palms, citrus trees, and outdoor garden landscaping specimens.",
    plantsCount: 22,
    tags: ["Palms", "Citrus", "Garden", "Outdoor"]
  },
  {
    id: "shop-3",
    name: "Kutaisi Cactus & Bonsai Hub",
    slug: "kutaisi-cactus",
    avatarUrl: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=150&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=800&auto=format&fit=crop&q=80",
    city: "ქუთაისი",
    rating: 4.8,
    totalReviews: 14,
    verified: true,
    tier: "TIER_2",
    descriptionKa: "იშვიათი კაქტუსები, ექივერიები, ასტროფიტუმები და იაპონური ბონსაი.",
    descriptionEn: "Rare collectors cacti, echeverias, astrophytums, and Japanese bonsai cultivars.",
    plantsCount: 9,
    tags: ["Succulents", "Cacti", "Bonsai", "Astrophytum"]
  }
];

export default function ShopsDirectoryPage() {
  const locale = useLocale();
  const isKa = locale !== "en";
  const supabase = createClient();

  const [shops, setShops] = React.useState<ShopProfile[]>(FEATURED_SHOPS);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCity, setSelectedCity] = React.useState("ALL");

  React.useEffect(() => {
    async function loadDbShops() {
      try {
        const { data: dbProfiles, error } = await supabase
          .from("profiles")
          .select("*")
          .not("custom_slug", "is", null);

        if (dbProfiles && dbProfiles.length > 0 && !error) {
          const formatted: ShopProfile[] = dbProfiles.map((p) => ({
            id: p.id,
            name: p.shop_name || p.full_name || "Plant Shop",
            slug: p.custom_slug || p.id,
            avatarUrl: p.avatar_url || undefined,
            bannerUrl: p.banner_url || undefined,
            city: p.city || "თბილისი",
            rating: p.average_rating || 5.0,
            totalReviews: p.total_reviews || 1,
            verified: true,
            tier: p.subscription_tier || "TIER_2",
            descriptionKa: p.bio || "ოფიციალური ბოტანიკური მაღაზია Plant.ge-ზე",
            descriptionEn: p.bio || "Official botanical nursery on Plant.ge",
            plantsCount: 5,
            tags: ["Plants", "Verified Shop"]
          }));

          // Merge with sample shops
          const existingSlugs = new Set(formatted.map(s => s.slug));
          const nonDupSamples = FEATURED_SHOPS.filter(s => !existingSlugs.has(s.slug));
          setShops([...formatted, ...nonDupSamples]);
        }
      } catch (e) {
        console.error("Error loading shops:", e);
      }
    }

    loadDbShops();
  }, [supabase]);

  const filteredShops = React.useMemo(() => {
    return shops.filter((shop) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = shop.name.toLowerCase().includes(q);
        const matchDesc = (shop.descriptionKa + shop.descriptionEn).toLowerCase().includes(q);
        const matchCity = shop.city.toLowerCase().includes(q);
        const matchTags = shop.tags.some(t => t.toLowerCase().includes(q));
        if (!matchName && !matchDesc && !matchCity && !matchTags) return false;
      }
      if (selectedCity !== "ALL" && shop.city !== selectedCity) {
        return false;
      }
      return true;
    });
  }, [shops, searchQuery, selectedCity]);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-7xl">
      
      {/* 🌟 1. Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-2.5 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20 shadow-2xs">
          <Store className="w-3.5 h-3.5" />
          <span>{isKa ? "ვერიფიცირებული სანერგეები & სტუდიები" : "Verified Nurseries & Botanical Studios"}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
          {isKa ? "ბოტანიკური მაღაზიები და სანერგეები" : "Botanical Shops & Nurseries"}
        </h1>

        <p className="text-xs sm:text-sm text-muted-foreground font-medium">
          {isKa 
            ? "აღმოაჩინეთ საუკეთესო სანერგეები, სპეციალიზებული ორანჟერეები და კერამიკის ოსტატები მთელი საქართველოს მასშტაბით."
            : "Explore trusted local plant nurseries, specialized greenhouses, and ceramic studios across Georgia."}
        </p>
      </div>

      {/* 🔍 2. Search & City Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-8 bg-card border border-border/70 p-3 sm:p-4 rounded-[20px] shadow-ambient">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isKa ? "ძებნა: სახელი, ქალაქი, ჯიში..." : "Search shop, city, species..."}
            className="pl-9 h-10 rounded-[14px] bg-surface-container/50 border-border/60 text-xs font-semibold"
          />
        </div>

        {/* City Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
          {[
            { id: "ALL", labelKa: "ყველა ქალაქი", labelEn: "All Cities" },
            { id: "თბილისი", labelKa: "თბილისი", labelEn: "Tbilisi" },
            { id: "ბათუმი", labelKa: "ბათუმი", labelEn: "Batumi" },
            { id: "ქუთაისი", labelKa: "ქუთაისი", labelEn: "Kutaisi" },
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCity(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCity === c.id
                  ? "bg-primary text-white shadow-2xs"
                  : "bg-surface-container/70 hover:bg-surface-container text-foreground border border-border/40"
              }`}
            >
              {isKa ? c.labelKa : c.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* 🏪 3. Shops Grid */}
      {filteredShops.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredShops.map((shop) => (
            <div
              key={shop.id}
              className="rounded-[22px] border border-border/80 bg-card overflow-hidden shadow-ambient hover:shadow-ambient-lg transition-all flex flex-col justify-between group"
            >
              {/* Banner Image */}
              <div className="relative h-32 w-full bg-surface-container">
                {shop.bannerUrl ? (
                  <img
                    src={shop.bannerUrl}
                    alt={shop.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-emerald-800 to-teal-900 flex items-center justify-center">
                    <Store className="w-8 h-8 text-white/30" />
                  </div>
                )}
                
                {/* VIP / Pro Badge */}
                <div className="absolute top-3 right-3">
                  <Badge className="bg-black/60 backdrop-blur-md text-amber-300 border border-amber-400/40 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3 h-3 fill-amber-300" />
                    <span>{shop.tier === "TIER_3" ? "PREMIUM SHOP" : "VERIFIED PRO"}</span>
                  </Badge>
                </div>
              </div>

              {/* Shop Content */}
              <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
                <div>
                  {/* Avatar & Title Row */}
                  <div className="flex items-start gap-3 -mt-10 mb-3">
                    <div className="h-14 w-14 rounded-[16px] border-3 border-card bg-card shadow-md overflow-hidden relative shrink-0">
                      {shop.avatarUrl ? (
                        <img src={shop.avatarUrl} alt={shop.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary text-white font-black text-lg flex items-center justify-center">
                          {shop.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 pt-6">
                      <div className="flex items-center gap-1">
                        <h3 className="font-bold text-sm sm:text-base text-foreground truncate">
                          {shop.name}
                        </h3>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-600/20 shrink-0" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 font-medium">
                        <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                          <Star className="w-3 h-3 fill-current" />
                          {shop.rating.toFixed(1)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-3 h-3 text-primary" />
                          {shop.city}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3 font-medium">
                    {isKa ? shop.descriptionKa : shop.descriptionEn}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {shop.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="rounded-[6px] bg-secondary-container/80 px-2 py-0.5 text-[10.5px] font-bold text-slate-800 dark:text-slate-200 border border-border/40"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="border-t border-border/50 pt-3.5 flex items-center justify-between gap-2 mt-auto">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    <strong className="text-foreground">{shop.plantsCount}</strong> {isKa ? "მცენარე მარაგში" : "plants available"}
                  </span>

                  <Link href={`/shops/${shop.slug}`}>
                    <Button size="sm" className="h-8 rounded-[12px] text-xs font-bold gap-1 bg-primary hover:bg-primary/90 text-white shadow-xs cursor-pointer">
                      <span>{isKa ? "დათვალიერება" : "Visit Shop"}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center rounded-[24px] border border-border/70 bg-card p-8">
          <Store className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-bold text-base text-foreground mb-1">
            {isKa ? "მაღაზიები ვერ მოიძებნა" : "No shops found"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
            {isKa ? "სცადეთ სხვა საძიებო სიტყვა ან გაასუფთავეთ ქალაქის ფილტრი." : "Try adjusting your search terms or filter selection."}
          </p>
          <Button variant="outline" onClick={() => { setSearchQuery(""); setSelectedCity("ALL"); }} className="rounded-[14px] text-xs font-bold">
            {isKa ? "ფილტრების გასუფთავება" : "Clear Filters"}
          </Button>
        </div>
      )}

      {/* 🚀 4. Pro Shop Registration CTA Banner */}
      <div className="mt-12 rounded-[24px] border border-primary/20 bg-gradient-to-br from-primary/10 via-surface-container to-secondary-container/40 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left max-w-xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isKa ? "გაქვთ სანერგე ან ბოტანიკური მაღაზია?" : "Own a Nursery or Botanical Shop?"}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground">
            {isKa ? "გახსენით თქვენი ოფიციალური Pro მაღაზია Plant.ge-ზე" : "Launch your Official Pro Shop on Plant.ge"}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            {isKa 
              ? "მიიღეთ პერსონალური ბმული (plant.ge/shops/your-name), შეუზღუდავი მარაგები და პირდაპირი წვდომა ათასობით ქართველ მყიდველთან."
              : "Get a custom storefront URL, unlimited listings, and direct access to thousands of plant enthusiasts in Georgia."}
          </p>
        </div>

        <Link href="/pricing" className="shrink-0">
          <Button className="rounded-[16px] bg-primary hover:bg-primary/90 text-white font-black text-xs sm:text-sm h-11 px-6 shadow-ambient">
            <Store className="w-4 h-4 mr-1.5" />
            <span>{isKa ? "მაღაზიის გახსნა" : "Open Pro Shop"}</span>
          </Button>
        </Link>
      </div>

    </div>
  );
}
