"use client";

import * as React from "react";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { SAMPLE_LISTINGS, type PlantCategory, type ExtendedListingCardProps } from "@/lib/mock-data";
import { ListingCard } from "@/components/listings/ListingCard";
import { ServiceCard } from "@/components/services/ServiceCard";
import { MOCK_SERVICES, type GardeningServiceItem } from "@/lib/mock-services";
import { 
  Store, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Star, 
  ShieldCheck, 
  Award, 
  Sprout, 
  Share2, 
  Check, 
  ChevronLeft, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Sparkles, 
  Search, 
  SlidersHorizontal, 
  RotateCcw, 
  X, 
  Leaf, 
  Flower2, 
  TreeDeciduous, 
  Navigation,
  Wrench
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDbListing } from "@/lib/listings-service";

type LocalizedCategory = {
  id: PlantCategory;
  labelKa: string;
  labelEn: string;
  emoji: string;
};

type LocalizedCategoryGroup = {
  id: string;
  labelKa: string;
  labelEn: string;
  icon: React.ElementType;
  color: string;
  children: LocalizedCategory[];
};

const PLANT_CATEGORY_GROUPS: LocalizedCategoryGroup[] = [
  {
    id: "aroid",
    labelKa: "აროიდები",
    labelEn: "Aroids",
    icon: Leaf,
    color: "text-emerald-700 dark:text-emerald-400",
    children: [
      { id: "monstera", labelKa: "მონსტერა", labelEn: "Monstera", emoji: "🌿" },
      { id: "philodendron", labelKa: "ფილოდენდრონი", labelEn: "Philodendron", emoji: "🌱" },
      { id: "anthurium", labelKa: "ანთურიუმი", labelEn: "Anthurium", emoji: "🌺" },
      { id: "alocasia", labelKa: "ალოკაზია", labelEn: "Alocasia", emoji: "🍃" },
      { id: "calathea", labelKa: "კალათეა / მარანტა", labelEn: "Calathea / Maranta", emoji: "🌿" },
      { id: "pothos-scindapsus", labelKa: "პოთოსი / სცინდაპსუსი", labelEn: "Pothos / Scindapsus", emoji: "🌾" },
    ],
  },
  {
    id: "flowering",
    labelKa: "ყვავილოვანი მცენარეები",
    labelEn: "Flowering Plants",
    icon: Flower2,
    color: "text-rose-700 dark:text-rose-400",
    children: [
      { id: "orchid", labelKa: "ორქიდეა", labelEn: "Orchid", emoji: "🌸" },
      { id: "bromeliad", labelKa: "ბრომელია", labelEn: "Bromeliad", emoji: "🌺" },
    ],
  },
  {
    id: "tree-ficus",
    labelKa: "ხეები, ფიკუსები & პალმები",
    labelEn: "Trees, Ficus & Palms",
    icon: TreeDeciduous,
    color: "text-teal-700 dark:text-teal-400",
    children: [
      { id: "ficus", labelKa: "ფიკუსი", labelEn: "Ficus", emoji: "🌳" },
      { id: "palm", labelKa: "პალმა", labelEn: "Palm", emoji: "🌴" },
      { id: "fern", labelKa: "გვიმრა", labelEn: "Fern", emoji: "🌿" },
      { id: "outdoor-garden", labelKa: "ბაღის & ეზოს მცენარეები", labelEn: "Outdoor & Garden", emoji: "🌻" },
    ],
  },
  {
    id: "cactus-etc",
    labelKa: "კაქტუსები, სუქულენტები & იშვიათები",
    labelEn: "Cactus, Succulents & Rare",
    icon: Sprout,
    color: "text-amber-700 dark:text-amber-400",
    children: [
      { id: "cactus-succulent", labelKa: "კაქტუსი & სუქულენტი", labelEn: "Cactus & Succulent", emoji: "🌵" },
      { id: "rare-variegated", labelKa: "იშვიათი & ვარიეგატული მცენარეები", labelEn: "Rare & Variegated", emoji: "✨" },
      { id: "cutting", labelKa: "კალმები & ფესვიანები", labelEn: "Cuttings & Rooted", emoji: "✂️" },
    ],
  },
  {
    id: "inventory",
    labelKa: "ინვენტარი, მოვლა & აქსესუარები",
    labelEn: "Inventory, Care & Tools",
    icon: Layers,
    color: "text-slate-800 dark:text-slate-200",
    children: [
      { id: "pots-ceramic", labelKa: "კერამიკული ქოთნები & სადგამები", labelEn: "Ceramic Pots & Saucers", emoji: "🏺" },
      { id: "pots-plastic", labelKa: "პლასტიკური & საწარმოო ქოთნები", labelEn: "Plastic & Nursery Pots", emoji: "🪣" },
      { id: "substrate-soil", labelKa: "სუბსტრატები, გრუნტი & პერლიტი", labelEn: "Substrates, Soil & Perlite", emoji: "🌍" },
      { id: "fertilizer", labelKa: "სასუქები, ვიტამინები & მოვლა", labelEn: "Fertilizer & Growth Nutrients", emoji: "🧪" },
      { id: "tools-care", labelKa: "მცენარის მოვლის ხელსაწყოები", labelEn: "Care Tools & Shears", emoji: "🔧" },
      { id: "lighting-grow", labelKa: "ფიტო-განათება (Grow Light)", labelEn: "Grow Lighting", emoji: "💡" },
    ],
  },
];

function FilterSection({
  title,
  children,
  defaultOpen = false,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className={`border-b border-border/60 py-4 last:border-b-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-1 text-left group cursor-pointer"
      >
        <span className="text-xs font-black uppercase tracking-wider text-foreground">
          {title}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
      </button>
      {open && <div className="pt-3 pb-1">{children}</div>}
    </div>
  );
}

function getLocalizedBadge(badge: string, isKa: boolean) {
  const b = badge.toLowerCase();
  if (b.includes("trusted") || b.includes("trust") || b.includes("სანდო")) {
    return {
      label: isKa ? "სანდო გამყიდველი" : "Trusted Seller",
      icon: ShieldCheck,
      color: "text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/30",
    };
  }
  if (b.includes("verif") || b.includes("ვერიფიცირებული")) {
    return {
      label: isKa ? "ვერიფიცირებული მაღაზია" : "Verified Shop",
      icon: ShieldCheck,
      color: "text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/30",
    };
  }
  if (b.includes("green") || b.includes("thumb") || b.includes("მებაღე")) {
    return {
      label: isKa ? "გამოცდილი მებაღე" : "Experienced Grower",
      icon: Sprout,
      color: "text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/30",
    };
  }
  if (b.includes("top") || b.includes("ტოპ")) {
    return {
      label: isKa ? "ტოპ გამყიდველი" : "Top Seller",
      icon: Award,
      color: "text-amber-800 dark:text-amber-300 bg-amber-500/15 border-amber-500/30",
    };
  }
  return {
    label: badge,
    icon: Sparkles,
    color: "text-foreground bg-secondary-container/80 border-border/60",
  };
}

export default function ShopStorefrontPage({
  params: { slug },
}: {
  params: { slug: string };
}) {
  const locale = useLocale();
  const isKa = locale !== "en";
  const supabase = createClient();

  // Filter States
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [selectedTrans, setSelectedTrans] = React.useState<string[]>([]);
  const [selectedDelivery, setSelectedDelivery] = React.useState<string[]>([]);
  const [itemTypeFilter, setItemTypeFilter] = React.useState<"ALL" | "PLANT" | "INVENTORY">("ALL");
  const [storeTab, setStoreTab] = React.useState<"listings" | "services">("listings");
  const [providerServices, setProviderServices] = React.useState<GardeningServiceItem[]>([]);
  const [priceRange, setPriceRange] = React.useState<[number, number]>([0, 500]);
  const [sortBy, setSortBy] = React.useState<"newest" | "price-asc" | "price-desc" | "views">("newest");
  const [visibleCount, setVisibleCount] = React.useState<number>(16);
  const [mobileFilterOpen, setMobileFilterOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // Accordion State for category groups — all groups collapsed by default
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({
    aroid: false,
    flowering: false,
    "tree-ficus": false,
    "cactus-etc": false,
    inventory: false,
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
    setVisibleCount(16);
  };

  const toggleTrans = (t: string) => {
    setSelectedTrans((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
    setVisibleCount(16);
  };

  const toggleDelivery = (d: string) => {
    setSelectedDelivery((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
    setVisibleCount(16);
  };

  const resetAllFilters = () => {
    setSearchTerm("");
    setSelectedCategories([]);
    setSelectedTrans([]);
    setSelectedDelivery([]);
    setItemTypeFilter("ALL");
    setPriceRange([0, 500]);
    setVisibleCount(16);
  };

  // Shop Profile State
  const [shop, setShop] = React.useState<any>({
    id: "usr-shop",
    customSlug: slug,
    shopName: slug === "tamarbustan" ? "თამარ ბოტანიკა" : `@${slug}`,
    bio: "იშვიათი ოთახის მცენარეების, აროიდების, მონსტერების და პრემიუმ სუბსტრატების ორანჟერეა.",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1545241047-6083a3684587?w=1200&auto=format&fit=crop&q=80",
    city: "თბილისი",
    address: "",
    phone: "+995 599 12 34 56",
    whatsapp: "+995599123456",
    rating: 5.0,
    totalReviews: 8,
    badges: ["Verified Shop", "Trusted Seller", "Green Thumb"],
    tier: "TIER_2",
  });

  const [shopListings, setShopListings] = React.useState<ExtendedListingCardProps[]>(() => {
    return SAMPLE_LISTINGS.map((l, index) => ({
      ...l,
      id: `${slug}-${l.id}`,
      seller: {
        ...l.seller,
        id: "usr-shop",
        fullName: slug === "tamarbustan" ? "თამარ ბოტანიკა" : `@${slug}`,
        customSlug: slug,
      },
    }));
  });

  React.useEffect(() => {
    async function loadShopData() {
      try {
        let { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("custom_slug", slug)
          .maybeSingle();

        if (!profile && slug.length === 36) {
          const { data: pById } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", slug)
            .maybeSingle();
          profile = pById;
        }

        if (!profile) {
          const { data: pByEmail } = await supabase
            .from("profiles")
            .select("*")
            .ilike("email", `${slug}%`)
            .maybeSingle();
          profile = pByEmail;
        }

        if (profile) {
          const currentShopData = {
            id: profile.id,
            customSlug: profile.custom_slug || slug,
            shopName: profile.full_name || `@${slug}`,
            bio: profile.bio || "ჯანსაღი და ხარისხიანი მცენარეები.",
            avatarUrl: profile.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
            bannerUrl: profile.shop_banner_url || "https://images.unsplash.com/photo-1545241047-6083a3684587?w=1200&auto=format&fit=crop&q=80",
            city: profile.city || "თბილისი",
            address: profile.address || "",
            phone: profile.phone || "+995 599 12 34 56",
            whatsapp: profile.whatsapp || profile.phone || "+995599123456",
            rating: Number(profile.average_rating) || 5.0,
            totalReviews: Number(profile.total_reviews) || 0,
            badges: ["Verified Shop", "Community Member"],
            tier: profile.subscription_tier || "FREE",
            isOnVacation: profile.is_on_vacation || false,
            workingHours: profile.shop_working_hours || "10:00 - 20:00",
            deliveryTerms: profile.shop_delivery_terms || "",
          };
          setShop(currentShopData);

          const { data: dbListings } = await supabase
            .from("listings")
            .select("*")
            .eq("user_id", profile.id)
            .eq("status", "ACTIVE")
            .order("created_at", { ascending: false });

          if (dbListings && dbListings.length > 0) {
            setShopListings(dbListings.map((row) => formatDbListing(row, profile)));
          } else {
            // Populate demo listings for rich interactive storefront showcase
            setShopListings(
              SAMPLE_LISTINGS.map((l) => ({
                ...l,
                id: `${slug}-${l.id}`,
                seller: {
                  ...l.seller,
                  id: profile.id,
                  fullName: currentShopData.shopName,
                  customSlug: slug,
                },
              }))
            );
          }

          // Fetch provider's gardening services
          try {
            const { data: dbServices } = await supabase
              .from("gardening_services")
              .select("*")
              .or(`provider_id.eq.${profile.id},provider_slug.eq.${slug}`)
              .order("created_at", { ascending: false });

            if (dbServices && dbServices.length > 0) {
              setProviderServices(dbServices as any);
            } else {
              // Match mock services if specialist matches demo
              const matchedMocks = MOCK_SERVICES.filter(
                (s) => s.provider_slug === slug || s.provider_id === profile.id
              );
              if (matchedMocks.length > 0) {
                setProviderServices(matchedMocks);
              } else {
                setProviderServices(
                  MOCK_SERVICES.slice(0, 2).map((s) => ({
                    ...s,
                    provider_id: profile.id,
                    provider_slug: slug,
                    provider_name: currentShopData.shopName,
                    provider_avatar: currentShopData.avatarUrl,
                  }))
                );
              }
            }
          } catch (servErr) {
            console.warn("Error fetching provider services:", servErr);
          }
        }
      } catch (e) {
        console.warn("Shop profile loading error:", e);
      }
    }
    loadShopData();
  }, [slug, supabase]);

  const countByCategory = (catId: string) =>
    shopListings.filter((l) => l.plantCategory === catId).length;

  const plantsCount = React.useMemo(
    () => shopListings.filter((l) => l.itemType === "PLANT").length,
    [shopListings]
  );
  const inventoryCount = React.useMemo(
    () => shopListings.filter((l) => l.itemType === "INVENTORY").length,
    [shopListings]
  );

  const activeFilterCount =
    (searchTerm.trim() ? 1 : 0) +
    selectedCategories.length +
    selectedTrans.length +
    selectedDelivery.length +
    (itemTypeFilter !== "ALL" ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 500 ? 1 : 0);

  const filteredAndSortedListings = React.useMemo(() => {
    let result = shopListings.filter((l) => {
      // 1. Item Type Filter (ALL / PLANT / INVENTORY)
      if (itemTypeFilter === "PLANT" && l.itemType !== "PLANT") return false;
      if (itemTypeFilter === "INVENTORY" && l.itemType !== "INVENTORY") return false;

      // 2. Keyword Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = (l.title || "").toLowerCase().includes(q);
        const matchDesc = (l.descriptionKa || "").toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }

      // 3. Category Filter
      if (selectedCategories.length > 0) {
        if (!selectedCategories.includes(l.plantCategory as string)) return false;
      }

      // 4. Transaction Type
      if (selectedTrans.length > 0) {
        if (!selectedTrans.includes(l.transactionType)) return false;
      }

      // 5. Delivery Methods
      if (selectedDelivery.length > 0) {
        const hasDelivery = l.deliveryMethods?.some((d) => selectedDelivery.includes(d));
        if (!hasDelivery) return false;
      }

      // 6. Price Range
      const p = l.price ?? 0;
      if (l.transactionType !== "GIFT" && (p < priceRange[0] || p > priceRange[1])) {
        return false;
      }

      return true;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "price-asc") return (a.price || 0) - (b.price || 0);
      if (sortBy === "price-desc") return (b.price || 0) - (a.price || 0);
      if (sortBy === "views") return (b.viewsCount || 0) - (a.viewsCount || 0);
      return 0;
    });
  }, [shopListings, itemTypeFilter, searchTerm, selectedCategories, selectedTrans, selectedDelivery, priceRange, sortBy]);

  const copyShopLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const SidebarContent = (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/70">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          <span className="text-sm font-black text-foreground">
            {isKa ? "ფილტრები" : "Filters"}
          </span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] font-black flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={resetAllFilters}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isKa ? "გასუფთავება" : "Reset"}</span>
          </button>
        )}
      </div>

      {/* 🔍 Search Keyword */}
      <FilterSection title={isKa ? "ძებნა" : "Search"} defaultOpen={true}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isKa ? "მონსტერა, ქოთანი, ფიკუსი..." : "Monstera, Pot, Ficus..."}
            className="w-full pl-9 pr-8 py-2 rounded-[12px] border border-input bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </FilterSection>

      {/* 💰 Price Range */}
      <FilterSection title={isKa ? "ფასის დიაპაზონი (₾)" : "Price Range (₾)"}>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <input
                type="number"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                className="w-full pl-7 pr-2 py-2 rounded-[10px] border border-input bg-background text-xs sm:text-sm font-bold text-center"
                min={0}
                max={priceRange[1]}
              />
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-medium text-muted-foreground">
                {isKa ? "დან" : "From"}
              </span>
            </div>
            <span className="text-muted-foreground font-bold text-xs">—</span>
            <div className="relative flex-1">
              <input
                type="number"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="w-full pl-7 pr-2 py-2 rounded-[10px] border border-input bg-background text-xs sm:text-sm font-bold text-center"
                min={priceRange[0]}
                max={1000}
              />
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-medium text-muted-foreground">
                {isKa ? "მდე" : "To"}
              </span>
            </div>
            <span className="text-sm font-black text-primary">₾</span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {[[0, 30], [0, 100], [0, 200], [0, 500]].map(([min, max]) => (
              <button
                key={`${min}-${max}`}
                onClick={() => setPriceRange([min, max])}
                className={`px-2.5 py-1 rounded-[8px] text-[11px] font-bold transition-all cursor-pointer ${
                  priceRange[0] === min && priceRange[1] === max
                    ? "bg-primary text-white shadow-2xs"
                    : "bg-secondary-container text-foreground hover:bg-secondary-container/80"
                }`}
              >
                {min === 0 ? `≤ ${max} ₾` : `${min}–${max} ₾`}
              </button>
            ))}
          </div>
        </div>
      </FilterSection>

      {/* Transaction Type */}
      <FilterSection title={isKa ? "გარიგების ტიპი" : "Transaction Type"}>
        <div className="grid grid-cols-1 gap-2">
          {[
            { id: "FIXED", label: isKa ? "ფიქსირებული ფასი" : "Fixed Price" },
            { id: "NEGOTIABLE", label: isKa ? "ფასი შეთანხმებით" : "Negotiable" },
            { id: "TRADE", label: isKa ? "მცენარის გაცვლა" : "Trade Only" },
            { id: "GIFT", label: isKa ? "გაჩუქება (უფასოდ)" : "Free Giveaway" },
          ].map((t) => {
            const active = selectedTrans.includes(t.id);
            const count = shopListings.filter((l) => l.transactionType === t.id).length;
            return (
              <button
                key={t.id}
                onClick={() => toggleTrans(t.id)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-[12px] border text-left transition-all cursor-pointer ${
                  active
                    ? "border-primary bg-primary text-white font-bold shadow-sm"
                    : "border-border/70 bg-card hover:bg-surface-container/60 text-foreground font-semibold"
                }`}
              >
                <span className="text-xs sm:text-sm">{t.label}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                  active ? "bg-white/20 text-white" : "bg-secondary-container text-muted-foreground"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Delivery Methods */}
      <FilterSection title={isKa ? "მიწოდების მეთოდები" : "Delivery Methods"}>
        <div className="space-y-1.5">
          {[
            { id: "PICKUP", label: isKa ? "ადგილზე გატანა" : "Local Pickup" },
            { id: "COURIER", label: isKa ? "საკურიერო მიწოდება" : "Courier Delivery" },
            { id: "MARSHRUTKA", label: isKa ? "სამარშრუტო ტრანსპორტი" : "Intercity Transport" },
          ].map((d) => {
            const active = selectedDelivery.includes(d.id);
            return (
              <button
                key={d.id}
                onClick={() => toggleDelivery(d.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-xs sm:text-sm transition-all text-left cursor-pointer ${
                  active
                    ? "bg-primary/10 text-primary font-bold border border-primary/30"
                    : "text-foreground hover:bg-surface-container border border-border/50 bg-card"
                }`}
              >
                <div className={`w-4 h-4 rounded-[6px] border flex items-center justify-center shrink-0 ${
                  active ? "bg-primary border-primary text-white" : "border-border"
                }`}>
                  {active && <Check className="w-3 h-3" />}
                </div>
                <span className="font-semibold">{d.label}</span>
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Categories */}
      <FilterSection title={isKa ? "კატეგორიები" : "Categories"}>
        <div className="space-y-2">
          {PLANT_CATEGORY_GROUPS.map((group) => {
            const Icon = group.icon;
            const groupTotal = group.children.reduce(
              (sum, c) => sum + countByCategory(c.id),
              0
            );
            if (groupTotal === 0) return null;
            const isGroupOpen = openGroups[group.id] ?? false;
            const groupLabel = isKa ? group.labelKa : group.labelEn;

            return (
              <div key={group.id} className="border-b border-border/40 pb-2 last:border-b-0">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between py-2 px-2 rounded-[10px] text-left hover:bg-surface-container/60 transition-colors cursor-pointer"
                >
                  <div className={`flex items-center gap-2 ${group.color}`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-bold text-foreground">{groupLabel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground bg-secondary-container px-2 py-0.5 rounded-full">
                      {groupTotal}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isGroupOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {isGroupOpen && (
                  <div className="space-y-1 mt-1 pl-2">
                    {group.children.map((cat) => {
                      const count = countByCategory(cat.id);
                      if (count === 0) return null;
                      const isActive = selectedCategories.includes(cat.id);
                      const catLabel = isKa ? cat.labelKa : cat.labelEn;

                      return (
                        <button
                          key={cat.id}
                          onClick={() => toggleCategory(cat.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-[10px] text-xs sm:text-sm transition-all text-left cursor-pointer ${
                            isActive
                              ? "bg-primary text-white font-bold shadow-sm"
                              : "text-foreground hover:bg-surface-container font-medium"
                          }`}
                        >
                          <span className="flex items-center gap-2 pr-2">
                            <span className="text-base shrink-0">{cat.emoji}</span>
                            <span className="break-words">{catLabel}</span>
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ml-auto ${
                            isActive ? "bg-white/20 text-white" : "bg-secondary-container text-muted-foreground"
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </FilterSection>
    </div>
  );

  return (
    <div className="min-h-screen pb-16">
      {/* 1. Shop Header Banner */}
      <div className="relative h-48 sm:h-64 w-full overflow-hidden bg-muted">
        <Image
          src={shop.bannerUrl}
          alt={shop.shopName}
          fill
          priority
          className="object-cover brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

        <div className="container mx-auto px-4 sm:px-6 relative h-full flex items-end pb-4">
          <Link
            href="/listings"
            className="inline-flex items-center gap-1.5 rounded-xl bg-card/80 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-foreground hover:bg-card shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" /> უკან კატალოგში
          </Link>
        </div>
      </div>

      {/* 2. Shop Identity & Info Container */}
      <div className="container mx-auto px-4 sm:px-6 -mt-16 relative z-10 space-y-6 max-w-7xl">
        {/* Vacation Mode Banner */}
        {shop.isOnVacation && (
          <div className="rounded-2xl bg-amber-500/15 border border-amber-500/30 p-4 text-amber-800 dark:text-amber-300 text-xs sm:text-sm font-bold flex items-center gap-3 shadow-md backdrop-blur-md animate-in fade-in">
            <span className="text-sm font-black uppercase tracking-wider bg-amber-500/20 px-2.5 py-1 rounded-md">
              {isKa ? "შვებულება" : "Vacation"}
            </span>
            <div>
              <p className="font-extrabold text-foreground">
                {isKa ? "მაღაზია დროებით იმყოფება შვებულებაში" : "Store is currently on vacation mode"}
              </p>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                {isKa
                  ? "მომხმარებელს დროებით შეჩერებული აქვს შეკვეთების მიღება. შეგიძლიათ დაათვალიეროთ ასორტიმენტი ან შეინახოთ რჩეულებში."
                  : "The seller is temporarily not taking new orders. You can still browse the inventory or save items to your wishlist."}
              </p>
            </div>
          </div>
        )}

        <div className="rounded-[28px] border border-border/80 bg-card p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            {/* Left: Avatar & Bio */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-3xl overflow-hidden border-4 border-card bg-emerald-600/10 shadow-lg shrink-0">
                <Image
                  src={shop.avatarUrl}
                  alt={shop.shopName}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="space-y-1.5 max-w-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-foreground">
                    {shop.shopName}
                  </h1>
                  <Badge variant="emerald" className="font-bold text-xs gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> ვერიფიცირებული მაღაზია
                  </Badge>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1 font-semibold text-emerald-600">
                    <MapPin className="w-3.5 h-3.5" /> {shop.city} {shop.address && `• ${shop.address}`}
                  </span>
                  <span>•</span>
                  <div className="flex items-center gap-1 font-bold text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{shop.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground font-normal">({shop.totalReviews} {isKa ? "შეფასება" : "reviews"})</span>
                  </div>
                  <span>•</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    plantsale.ge/{slug}
                  </span>
                  {shop.workingHours && (
                    <>
                      <span>•</span>
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        ⏰ {shop.workingHours}
                      </span>
                    </>
                  )}
                  {shop.deliveryTerms && (
                    <>
                      <span>•</span>
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                        🚚 {shop.deliveryTerms}
                      </span>
                    </>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                  {shop.bio}
                </p>

                {/* Badges Earned */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {shop.badges.map((b: string) => {
                    const info = getLocalizedBadge(b, isKa);
                    const IconComponent = info.icon;
                    return (
                      <span
                        key={b}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-[11px] font-bold border transition-all ${info.color}`}
                      >
                        <IconComponent className="w-3 h-3" />
                        <span>{info.label}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Direct Contact Actions */}
            <div className="flex flex-wrap sm:flex-nowrap lg:flex-col gap-2 min-w-[200px] shrink-0">
              <a href={`tel:${shop.phone}`} className="w-full">
                <Button variant="botanical" className="w-full rounded-2xl text-xs font-bold h-11 gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{shop.phone}</span>
                </Button>
              </a>

              <a
                href={`https://wa.me/${shop.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="w-full"
              >
                <Button variant="outline" className="w-full rounded-2xl text-xs font-bold h-11 gap-2 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>{isKa ? "WhatsApp-ში მიწერა" : "Chat on WhatsApp"}</span>
                </Button>
              </a>

              <Button
                variant="ghost"
                onClick={copyShopLink}
                className="w-full rounded-2xl text-xs font-bold h-10 gap-1.5 text-muted-foreground cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                <span>{copied ? (isKa ? "ლინკი დაკოპირდა!" : "Link Copied!") : (isKa ? "მაღაზიის გაზიარება" : "Share Shop")}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 3. Shop Catalog & Inventory Feed with Full Filter System */}
        <div className="space-y-5 pt-4">
          {/* Top Toolbar: Switcher Tabs + Mobile Filter Button + Sorting */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Item Type & Services Switcher Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-[16px] bg-secondary-container/70 border border-border/60 w-fit">
              <button
                type="button"
                onClick={() => {
                  setStoreTab("listings");
                  setItemTypeFilter("ALL");
                  setVisibleCount(16);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[12px] text-xs font-bold transition-all cursor-pointer ${
                  storeTab === "listings" && itemTypeFilter === "ALL"
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{isKa ? "ყველა განცხადება" : "All Listings"}</span>
                <span className="text-[10px] opacity-80 font-mono">({shopListings.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStoreTab("listings");
                  setItemTypeFilter("PLANT");
                  setVisibleCount(16);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[12px] text-xs font-bold transition-all cursor-pointer ${
                  storeTab === "listings" && itemTypeFilter === "PLANT"
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{isKa ? "მცენარეები" : "Plants"}</span>
                <span className="text-[10px] opacity-80 font-mono">({plantsCount})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStoreTab("listings");
                  setItemTypeFilter("INVENTORY");
                  setVisibleCount(16);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[12px] text-xs font-bold transition-all cursor-pointer ${
                  storeTab === "listings" && itemTypeFilter === "INVENTORY"
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{isKa ? "ინვენტარი" : "Supplies"}</span>
                <span className="text-[10px] opacity-80 font-mono">({inventoryCount})</span>
              </button>

              {/* Services Tab */}
              <button
                type="button"
                onClick={() => {
                  setStoreTab("services");
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[12px] text-xs font-bold transition-all cursor-pointer ${
                  storeTab === "services"
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>{isKa ? "სერვისები" : "Services"}</span>
                <span className="text-[10px] opacity-80 font-mono">({providerServices.length})</span>
              </button>
            </div>

            {/* Mobile Filter Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-[14px] bg-card border border-border/80 text-foreground font-bold text-xs shadow-xs cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                <span>{isKa ? "ფილტრები" : "Filters"}</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Sorting Pills */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary-container/60 border border-border/60 shrink-0">
                <button
                  type="button"
                  onClick={() => setSortBy("newest")}
                  className={`px-3 py-1 rounded-[8px] text-xs font-bold transition-all cursor-pointer ${
                    sortBy === "newest"
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isKa ? "უახლესი" : "Newest"}
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy("views")}
                  className={`px-3 py-1 rounded-[8px] text-xs font-bold transition-all cursor-pointer ${
                    sortBy === "views"
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isKa ? "პოპულარული" : "Popular"}
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy(sortBy === "price-asc" ? "price-desc" : "price-asc")}
                  className={`px-3 py-1 rounded-[8px] text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    sortBy.startsWith("price")
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{isKa ? (sortBy === "price-desc" ? "ფასი ↓" : "ფასი ↑") : (sortBy === "price-desc" ? "Price ↓" : "Price ↑")}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active Filter Badges */}
          {(selectedCategories.length > 0 || selectedTrans.length > 0 || selectedDelivery.length > 0 || searchTerm.trim()) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {searchTerm.trim() && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[10px] bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                  <span>"{searchTerm}"</span>
                  <button onClick={() => setSearchTerm("")} className="hover:opacity-75 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                </span>
              )}
              {selectedCategories.map((catId) => {
                const cat = PLANT_CATEGORY_GROUPS.flatMap((g) => g.children).find((c) => c.id === catId);
                return cat ? (
                  <span key={catId} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[10px] bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                    {cat.emoji} {isKa ? cat.labelKa : cat.labelEn}
                    <button onClick={() => toggleCategory(catId)} className="hover:opacity-75 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                  </span>
                ) : null;
              })}
              {selectedTrans.map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[10px] bg-amber-500/15 text-amber-900 dark:text-amber-200 text-xs font-bold border border-amber-500/30">
                  {t === "FIXED" ? (isKa ? "ფიქსირებული" : "Fixed") : t === "NEGOTIABLE" ? (isKa ? "შეთანხმებით" : "Negotiable") : (isKa ? "გაცვლა" : "Trade")}
                  <button onClick={() => toggleTrans(t)} className="hover:opacity-75 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                </span>
              ))}
              {selectedDelivery.map((d) => (
                <span key={d} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[10px] bg-teal-500/15 text-teal-900 dark:text-teal-200 text-xs font-bold border border-teal-500/30">
                  {d === "COURIER" ? (isKa ? "🚚 კურიერი" : "🚚 Courier") : d === "MARSHRUTKA" ? (isKa ? "🚐 სამარშრუტო" : "🚐 Intercity") : (isKa ? "📍 ადგილზე" : "📍 Pickup")}
                  <button onClick={() => toggleDelivery(d)} className="hover:opacity-75 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                </span>
              ))}
            </div>
          )}

          {/* Mobile Filter Drawer */}
          {mobileFilterOpen && (
            <div className="lg:hidden mb-6 rounded-[24px] border border-border/80 bg-card p-5 shadow-ambient-lg relative z-30">
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-base font-bold text-foreground">{isKa ? "ფილტრები" : "Filters"}</span>
                <button onClick={() => setMobileFilterOpen(false)} className="p-1 rounded-[8px] hover:bg-surface-container cursor-pointer">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              {SidebarContent}
            </div>
          )}

          {/* Main Layout: Sidebar on Left (Desktop) + 4-Column Grid on Right */}
          <div className="flex gap-6 lg:gap-7">
            {/* Sidebar — Desktop */}
            <aside className="hidden lg:block w-76 sm:w-80 shrink-0 relative z-30">
              <div className="sticky top-20 rounded-[24px] border border-border/80 bg-card p-5 shadow-ambient">
                {SidebarContent}
              </div>
            </aside>

            {/* Results Column: 4 Columns x 4 Rows = 16 Items (or Services Grid) */}
            <div className="flex-1 min-w-0">
              {storeTab === "services" ? (
                providerServices.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {providerServices.map((srv) => (
                      <ServiceCard key={srv.id} service={srv} variant="compact" />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-card rounded-3xl border border-dashed border-border/80">
                    <Wrench className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                    <h3 className="text-base font-bold text-foreground">
                      {isKa ? "სერვისები არ მოიძებნა" : "No services offered yet"}
                    </h3>
                  </div>
                )
              ) : filteredAndSortedListings.length > 0 ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                    {filteredAndSortedListings.slice(0, visibleCount).map((listing) => (
                      <ListingCard key={listing.id} {...listing} variant="compact" />
                    ))}
                  </div>

                  {/* Load More Button */}
                  {visibleCount < filteredAndSortedListings.length && (
                    <div className="flex justify-center pt-4">
                      <Button
                        type="button"
                        onClick={() => setVisibleCount((prev) => prev + 16)}
                        className="px-8 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-primary hover:bg-primary/90 text-white cursor-pointer shadow-ambient"
                      >
                        {isKa 
                          ? `მეტის ნახვა (დარჩენილია ${filteredAndSortedListings.length - visibleCount})` 
                          : `Load More (${filteredAndSortedListings.length - visibleCount} remaining)`}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 bg-card rounded-3xl border border-dashed border-border/80">
                  <Sprout className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                  <h3 className="text-base font-bold text-foreground">
                    {isKa ? "განცხადებები არ მოიძებნა" : "No listings found"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isKa ? "სცადეთ სხვა კატეგორია ან გაასუფთავეთ ფილტრი" : "Try selecting another category or reset filters"}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetAllFilters}
                    className="mt-4 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    {isKa ? "ფილტრების გასუფთავება" : "Reset Filters"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
