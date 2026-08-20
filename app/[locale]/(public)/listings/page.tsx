"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePathname } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { ListingCard } from "@/components/listings/ListingCard";
import { LocationSearchCombobox, GEORGIA_CITIES } from "@/components/common/LocationSearchCombobox";
import { SAMPLE_LISTINGS, type PlantCategory } from "@/lib/mock-data";
import { createClient } from "@/utils/supabase/client";
import { calculateDistanceKm } from "@/lib/utils";
import {
  SlidersHorizontal,
  X,
  Sparkles,
  Sprout,
  Leaf,
  Flower2,
  TreeDeciduous,
  Layers,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  RotateCcw,
  Navigation,
  Flame,
  ArrowDownUp,
  Loader2,
  LayoutGrid,
  List
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Localized Category Taxonomy ──────────────────────────────────────────────
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
      { id: "cutting", labelKa: "კალმები & ფესვიანი დაფესვიანებულები", labelEn: "Cuttings & Rooted", emoji: "✂️" },
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

// ─── Collapsible Filter Section Component ─────────────────────────────────────
function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="border-b border-border/60 py-3.5 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-1 text-left group"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-foreground">
          {title}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
      </button>
      {open && <div className="pt-2 pb-1">{children}</div>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function ListingsCatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const isKa = locale !== "en";
  const supabase = createClient();

  const queryParam = searchParams.get("q") || "";
  const cityParam = searchParams.get("city") || "მთელი საქართველო";

  // Real Database listings state
  const [allListings, setAllListings] = React.useState<any[]>(SAMPLE_LISTINGS);

  // User GPS / Pinpoint Coordinates
  const [userCoords, setUserCoords] = React.useState<[number, number] | null>([41.7116, 44.7554]);
  const [gpsActive, setGpsActive] = React.useState(false);
  const [gpsLoading, setGpsLoading] = React.useState(false);

  // View Mode: Grid (Compact) vs List
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  // Local filter state
  const [searchQ, setSearchQ] = React.useState(queryParam);
  const [selectedCity, setSelectedCity] = React.useState(cityParam);
  const [selectedCategories, setSelectedCategories] = React.useState<PlantCategory[]>([]);
  const [selectedTrans, setSelectedTrans] = React.useState<string[]>([]);
  const [selectedDelivery, setSelectedDelivery] = React.useState<string[]>([]);
  const [priceRange, setPriceRange] = React.useState<[number, number]>([0, 500]);
  const [sortBy, setSortBy] = React.useState<"nearest" | "newest" | "price-asc" | "price-desc" | "views">("nearest");
  const [mobileFilterOpen, setMobileFilterOpen] = React.useState(false);

  // Accordion state for category groups
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({
    aroid: true,
    flowering: false,
    "tree-ficus": false,
    "cactus-etc": false,
    inventory: false,
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleSortClick = (optId: string) => {
    if (optId === "nearest") {
      setSortBy("nearest");
      if (navigator.geolocation) {
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserCoords([pos.coords.latitude, pos.coords.longitude]);
            setGpsActive(true);
            setGpsLoading(false);
          },
          () => {
            setGpsLoading(false);
          },
          { timeout: 8000, enableHighAccuracy: true }
        );
      }
    } else if (optId === "price") {
      // Toggle between price-desc and price-asc on each click
      if (sortBy === "price-desc") {
        setSortBy("price-asc");
      } else {
        setSortBy("price-desc");
      }
    } else {
      setSortBy(optId as any);
    }
  };

  // Attempt auto GPS detection on mount
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords([pos.coords.latitude, pos.coords.longitude]);
          setGpsActive(true);
        },
        () => {
          // Keep default coords
        },
        { timeout: 5000 }
      );
    }
  }, []);

  // Fetch real listings from Supabase with VIP automatic expiration check
  React.useEffect(() => {
    async function loadLiveListings() {
      try {
        const { data: dbData } = await supabase
          .from("listings")
          .select(`
            id,
            title_ka,
            title_en,
            price,
            item_type,
            plant_category,
            transaction_type,
            delivery_methods,
            images,
            city,
            views_count,
            is_featured,
            featured_until,
            created_at,
            profiles:user_id (id, full_name, avatar_url, rating, total_reviews, custom_slug)
          `)
          .eq("status", "ACTIVE")
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false });

        if (dbData && dbData.length > 0) {
          const now = new Date();
          const formatted = dbData.map((item: any, idx: number) => {
            const fallbackCoords: [number, number] = [
              41.7151 + (idx % 3 === 0 ? 0.01 : idx % 3 === 1 ? -0.02 : 0.03),
              44.7871 + (idx % 2 === 0 ? 0.02 : -0.01),
            ];
            // Automatic VIP expiration validation: Active only if is_featured is true AND expiration is not in the past
            const isVipValid = Boolean(
              item.is_featured && (!item.featured_until || new Date(item.featured_until) > now)
            );

            return {
              id: item.id,
              title: isKa ? (item.title_ka || item.title_en || "მცენარე") : (item.title_en || item.title_ka || "Plant"),
              price: Number(item.price) || 0,
              itemType: item.item_type || "PLANT",
              plantCategory: item.plant_category || "other-plant",
              transactionType: item.transaction_type || "FIXED",
              deliveryMethods: item.delivery_methods || ["PICKUP"],
              lat: item.lat || fallbackCoords[0],
              lng: item.lng || fallbackCoords[1],
              isPremium: isVipValid,
              isFeatured: isVipValid,
              images: item.images && item.images.length > 0 ? item.images : [
                "https://images.unsplash.com/photo-1545241047-6083a3684587?w=800&auto=format&fit=crop&q=80"
              ],
              city: item.city || "თბილისი",
              viewsCount: item.views_count || 0,
              seller: {
                id: item.profiles?.id || "usr-1",
                fullName: item.profiles?.full_name || "გამყიდველი",
                avatarUrl: item.profiles?.avatar_url || "",
                rating: item.profiles?.rating || 5.0,
                totalReviews: item.profiles?.total_reviews || 0,
                badges: ["Verified Seller"],
                customSlug: item.profiles?.custom_slug,
              },
            };
          });
          setAllListings(formatted);
        }
      } catch (e) {
        console.error("Supabase live listings fetch failed, using fallback:", e);
      }
    }
    loadLiveListings();
  }, [supabase, isKa]);

  // Derived active filter count
  const activeFilterCount =
    selectedCategories.length +
    selectedTrans.length +
    selectedDelivery.length +
    (priceRange[0] > 0 || priceRange[1] < 500 ? 1 : 0) +
    (selectedCity !== "მთელი საქართველო" && !selectedCity.includes("ჩემი ლოკაცია") ? 1 : 0);

  const resetAll = () => {
    setSearchQ("");
    setSelectedCity("მთელი საქართველო");
    setSelectedCategories([]);
    setSelectedTrans([]);
    setSelectedDelivery([]);
    setPriceRange([0, 500]);
    setSortBy("nearest");
  };

  const toggleCategory = (cat: PlantCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleTrans = (t: string) => {
    setSelectedTrans((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const toggleDelivery = (d: string) => {
    setSelectedDelivery((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  // Dynamic live count by category from database
  const countByCategory = (cat: PlantCategory) =>
    allListings.filter((l) => l.plantCategory === cat).length;

  // Calculate distance for all listings and apply filters
  let filtered = React.useMemo(() => {
    return allListings
      .map((item) => {
        const itemLat = item.lat || 41.7151;
        const itemLng = item.lng || 44.8271;
        const dist = userCoords
          ? calculateDistanceKm(userCoords[0], userCoords[1], itemLat, itemLng)
          : undefined;
        return {
          ...item,
          distanceKm: dist,
        };
      })
      .filter((item) => {
        if (searchQ.trim()) {
          const q = searchQ.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchCategory = item.plantCategory?.toLowerCase().includes(q);
          const matchCity = item.city.toLowerCase().includes(q);
          if (!matchTitle && !matchCategory && !matchCity) return false;
        }

        // Filter by city ONLY if user specifically chose a city other than "მთელი საქართველო" and NOT "ჩემი ლოკაცია"
        if (
          selectedCity !== "მთელი საქართველო" &&
          !selectedCity.includes("ჩემი ლოკაცია") &&
          !selectedCity.includes("GPS")
        ) {
          if (!item.city.toLowerCase().includes(selectedCity.toLowerCase())) {
            return false;
          }
        }

        if (selectedCategories.length > 0 && !selectedCategories.includes(item.plantCategory as PlantCategory)) return false;
        if (selectedTrans.length > 0 && !selectedTrans.includes(item.transactionType)) return false;
        if (selectedDelivery.length > 0 && !selectedDelivery.some((d: string) => item.deliveryMethods?.includes(d as any))) return false;
        if (item.transactionType !== "TRADE") {
          if (item.price < priceRange[0] || item.price > priceRange[1]) return false;
        }
        return true;
      });
  }, [
    allListings,
    userCoords,
    searchQ,
    selectedCity,
    selectedCategories,
    selectedTrans,
    selectedDelivery,
    priceRange,
  ]);

  // Sort Pipeline
  const sortedListings = React.useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === "nearest") {
        return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
      }
      if (sortBy === "price-asc") return (a.price || 0) - (b.price || 0);
      if (sortBy === "price-desc") return (b.price || 0) - (a.price || 0);
      if (sortBy === "views") return (b.viewsCount || 0) - (a.viewsCount || 0);
      return 0; // newest = default order
    });
  }, [filtered, sortBy]);

  // ─── Fair VIP 2-Row Allocation & Random Rotation ─────────────────────────
  // First 2 rows: up to 8 items on desktop 4-column grid (or 4 on mobile 2-col)
  const MAX_VIP_TOP_SLOTS = 8;

  const displayListings = React.useMemo(() => {
    const vipPool = sortedListings.filter((l) => l.isPremium || l.isFeatured);
    const regularPool = sortedListings.filter((l) => !l.isPremium && !l.isFeatured);

    if (vipPool.length === 0) return regularPool;

    // If more VIPs than top 2 rows, take a randomized / rotated slice of VIPs for top rows
    // and place remaining VIPs into the regular flow
    let topVips: typeof vipPool = [];
    let overflowVips: typeof vipPool = [];

    if (vipPool.length <= MAX_VIP_TOP_SLOTS) {
      topVips = vipPool;
    } else {
      // Deterministic fair shuffle so it rotates evenly
      const shuffled = [...vipPool].sort(() => Math.random() - 0.5);
      topVips = shuffled.slice(0, MAX_VIP_TOP_SLOTS);
      overflowVips = shuffled.slice(MAX_VIP_TOP_SLOTS);
    }

    return [...topVips, ...overflowVips, ...regularPool];
  }, [sortedListings]);

  // ─── Sidebar JSX ───────────────────────────────────────────────────────────
  const SidebarContent = (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-border/60">
        <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          {isKa ? "ფილტრები" : "Filters"}
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[11px] font-black">
              {activeFilterCount}
            </span>
          )}
        </h2>
        {activeFilterCount > 0 && (
          <button
            onClick={resetAll}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" /> {isKa ? "გასუფთავება" : "Clear"}
          </button>
        )}
      </div>

      {/* Search */}
      <FilterSection title={isKa ? "საძიებო სიტყვა" : "Keyword Search"}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder={isKa ? "Monstera, ფიკუსი, ქოთანი..." : "Monstera, Ficus, Pot..."}
            className="w-full pl-9 pr-4 py-2.5 rounded-[12px] border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {searchQ && (
            <button onClick={() => setSearchQ("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </FilterSection>

      {/* Location */}
      <FilterSection title={isKa ? "ლოკაცია" : "Location"}>
        <div className="rounded-[14px] border border-border/80 bg-background overflow-visible">
          <LocationSearchCombobox
            selectedCity={selectedCity}
            onCityChange={(cityName, coords) => {
              setSelectedCity(cityName);
              if (coords) setUserCoords(coords);
            }}
          />
        </div>
        {userCoords && (
          <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1 font-medium">
            <Navigation className="w-3 h-3 text-primary animate-pulse" />
            {isKa ? "მანძილი გამოითვლება თქვენი ლოკაციიდან" : "Distance calculated from your location"}
          </p>
        )}
      </FilterSection>

      {/* 💰 Price Range — Moved to Top under Search & Location */}
      <FilterSection title={isKa ? "ფასის დიაპაზონი (₾)" : "Price Range (₾)"} defaultOpen={true}>
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
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-medium text-muted-foreground">დან</span>
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
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-medium text-muted-foreground">მდე</span>
            </div>
            <span className="text-sm font-black text-primary">₾</span>
          </div>

          {/* Quick Price Chips */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {[[0, 30], [0, 100], [0, 200], [0, 500]].map(([min, max]) => (
              <button
                key={`${min}-${max}`}
                onClick={() => setPriceRange([min, max])}
                className={`px-2.5 py-1 rounded-[8px] text-[11px] font-bold transition-all ${
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

      {/* Plant Categories */}
      <FilterSection title={isKa ? "მცენარის კატეგორიები" : "Plant Categories"}>
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
                  className="w-full flex items-center justify-between py-2 px-2 rounded-[10px] text-left hover:bg-surface-container/60 transition-colors"
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
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-[10px] text-xs sm:text-sm transition-all text-left ${
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

      {/* Transaction Type */}
      <FilterSection title={isKa ? "გარიგების ტიპი" : "Transaction Type"}>
        <div className="grid grid-cols-1 gap-2">
          {[
            { id: "FIXED", label: isKa ? "💰 ფიქსირებული ფასი" : "💰 Fixed Price", desc: isKa ? "პირდაპირი ყიდვა" : "Buy instantly" },
            { id: "NEGOTIABLE", label: isKa ? "🤝 ფასი შეთანხმებით" : "🤝 Negotiable", desc: isKa ? "მოლაპარაკება ფასზე" : "Open to offers" },
            { id: "TRADE", label: isKa ? "🔄 მცენარის გაცვლა" : "🔄 Trade Only", desc: isKa ? "გაცვლა სხვა მცენარეში" : "Swap for other plants" },
            { id: "GIFT", label: isKa ? "🎁 გაჩუქება (უფასოდ)" : "🎁 Free Giveaway", desc: isKa ? "საჩუქარი მემცენარეებისთვის" : "Free plant to community" },
          ].map((t) => {
            const active = selectedTrans.includes(t.id);
            const count = allListings.filter((l) => l.transactionType === t.id).length;
            return (
              <button
                key={t.id}
                onClick={() => toggleTrans(t.id)}
                className={`flex items-center justify-between p-3 rounded-[14px] border text-left transition-all ${
                  active
                    ? "border-primary bg-primary text-white font-bold shadow-sm"
                    : "border-border/70 bg-card hover:bg-surface-container/50 text-foreground"
                }`}
              >
                <div>
                  <p className="text-sm font-bold">{t.label}</p>
                  <p className={`text-xs ${active ? "text-primary-fixed/80" : "text-muted-foreground"}`}>{t.desc}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ml-2 ${
                  active ? "bg-white/20 text-white" : "bg-secondary-container text-muted-foreground"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Delivery */}
      <FilterSection title={isKa ? "მიწოდების მეთოდები" : "Delivery Methods"} defaultOpen={false}>
        <div className="space-y-1.5">
          {[
            { id: "PICKUP", label: isKa ? "📍 ადგილზე გატანა" : "📍 Local Pickup" },
            { id: "COURIER", label: isKa ? "🚚 საკურიერო მიწოდება" : "🚚 Courier Delivery" },
            { id: "MARSHRUTKA", label: isKa ? "🚐 სამარშრუტო ტრანსპორტი" : "🚐 Intercity Transport" },
          ].map((d) => {
            const active = selectedDelivery.includes(d.id);
            return (
              <button
                key={d.id}
                onClick={() => toggleDelivery(d.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-sm transition-all text-left ${
                  active
                    ? "bg-primary/10 text-primary font-bold border border-primary/30"
                    : "text-foreground hover:bg-surface-container border border-transparent"
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
    </div>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            {isKa ? "მცენარეები & ინვენტარი" : "Plants & Botanical Care"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            <strong className="text-foreground font-bold">{filtered.length}</strong> {isKa ? "აქტიური განცხადება" : "active listings"} /{" "}
            <strong className="text-foreground font-bold">{allListings.length}</strong> {isKa ? "სულ ბაზაში" : "total in catalog"}
          </p>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[14px] border border-border bg-card text-sm font-bold text-foreground shadow-xs"
          >
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            {isKa ? "ფილტრები" : "Filters"}
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active Filter Chips */}
      {(selectedCategories.length > 0 || selectedTrans.length > 0 || selectedDelivery.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-5">
          {selectedCategories.map((catId) => {
            const cat = PLANT_CATEGORY_GROUPS.flatMap((g) => g.children).find((c) => c.id === catId);
            return cat ? (
              <span key={catId} className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-[10px] bg-primary/10 text-primary text-xs sm:text-sm font-bold border border-primary/20">
                {cat.emoji} {isKa ? cat.labelKa : cat.labelEn}
                <button onClick={() => toggleCategory(catId)} className="hover:opacity-75"><X className="w-3.5 h-3.5" /></button>
              </span>
            ) : null;
          })}
          {selectedTrans.map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-[10px] bg-amber-500/15 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-bold border border-amber-500/30">
              {t === "FIXED" ? (isKa ? "💰 ფიქსირებული" : "💰 Fixed") : t === "NEGOTIABLE" ? (isKa ? "🤝 შეთანხმებით" : "🤝 Negotiable") : (isKa ? "🔄 გაცვლა" : "🔄 Trade")}
              <button onClick={() => toggleTrans(t)} className="hover:opacity-75"><X className="w-3.5 h-3.5" /></button>
            </span>
          ))}
          {selectedDelivery.map((d) => (
            <span key={d} className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-[10px] bg-teal-500/15 text-teal-900 dark:text-teal-200 text-xs sm:text-sm font-bold border border-teal-500/30">
              {d === "COURIER" ? (isKa ? "🚚 კურიერი" : "🚚 Courier") : d === "MARSHRUTKA" ? (isKa ? "🚐 სამარშრუტო" : "🚐 Intercity") : (isKa ? "📍 ადგილზე" : "📍 Pickup")}
              <button onClick={() => toggleDelivery(d)} className="hover:opacity-75"><X className="w-3.5 h-3.5" /></button>
            </span>
          ))}
        </div>
      )}

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="lg:hidden mb-6 rounded-[24px] border border-border/80 bg-card p-5 shadow-ambient-lg">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-base font-bold text-foreground">{isKa ? "ფილტრები" : "Filters"}</span>
            <button onClick={() => setMobileFilterOpen(false)} className="p-1 rounded-[8px] hover:bg-surface-container">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          {SidebarContent}
        </div>
      )}

      <div className="flex gap-6 lg:gap-7">
        {/* Sidebar — Desktop */}
        <aside className="hidden lg:block w-76 sm:w-80 shrink-0">
          <div className="sticky top-20 rounded-[24px] border border-border/80 bg-card p-5 shadow-ambient">
            {SidebarContent}
          </div>
        </aside>

        {/* Results Column */}
        <div className="flex-1 min-w-0">
          {/* ✨ Top Sorting Pill Bar & View Mode Switcher (Clean Single Row) */}
          <div className="mb-5 flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
            {/* Sort Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:inline-block">
                {isKa ? "სორტირება:" : "Sort By:"}
              </span>

              {[
                { 
                  id: "nearest", 
                  labelKa: "📍 ჩემთან ახლოს", 
                  labelEn: "📍 Nearest",
                  isActive: sortBy === "nearest"
                },
                { 
                  id: "newest", 
                  labelKa: "✨ უახლესი", 
                  labelEn: "✨ Newest",
                  isActive: sortBy === "newest"
                },
                { 
                  id: "price", 
                  labelKa: sortBy === "price-desc" ? "💰 ფასი ↓" : sortBy === "price-asc" ? "💰 ფასი ↑" : "💰 ფასი ⇅", 
                  labelEn: sortBy === "price-desc" ? "💰 Price ↓" : sortBy === "price-asc" ? "💰 Price ↑" : "💰 Price ⇅",
                  isActive: sortBy === "price-asc" || sortBy === "price-desc"
                },
                { 
                  id: "views", 
                  labelKa: "🔥 პოპულარული", 
                  labelEn: "🔥 Popular",
                  isActive: sortBy === "views"
                },
              ].map((opt) => {
                const isActive = opt.isActive;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSortClick(opt.id)}
                    className={`px-3 sm:px-3.5 py-2 rounded-[14px] text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-white shadow-ambient scale-[1.02]"
                        : "bg-card border border-border/70 text-foreground hover:bg-surface-container hover:border-primary/40"
                    }`}
                  >
                    {opt.id === "nearest" && gpsLoading ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        {isKa ? "GPS..." : "Locating..."}
                      </span>
                    ) : (
                      isKa ? opt.labelKa : opt.labelEn
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right: View Mode Toggle (Grid vs List) */}
            <div className="flex items-center gap-1 shrink-0">
              <div className="flex items-center gap-0.5 bg-card border border-border/80 rounded-[12px] p-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-[9px] transition-all ${
                    viewMode === "grid"
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-container"
                  }`}
                  title={isKa ? "გრიდის ხედი" : "Grid View"}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-[9px] transition-all ${
                    viewMode === "list"
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-container"
                  }`}
                  title={isKa ? "სიის ხედი" : "List View"}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Grid / List Results with 2-Row Fair VIP Placement */}
          {displayListings.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-border/80 bg-card/60 p-14 text-center shadow-ambient">
              <Sparkles className="w-10 h-10 text-primary mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-1 text-foreground">
                {isKa ? "განცხადება ვერ მოიძებნა" : "No listings found"}
              </h3>
              <p className="text-sm text-muted-foreground mb-5">
                {isKa ? "სცადეთ ფილტრების გასუფთავება ან საძიებო სიტყვის შეცვლა." : "Try clearing filters or changing search query."}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={resetAll}
                className="rounded-[12px] text-xs font-bold gap-1.5 border-border"
              >
                <RotateCcw className="w-4 h-4" /> {isKa ? "ფილტრების გასუფთავება" : "Reset Filters"}
              </Button>
            </div>
          ) : viewMode === "grid" ? (
            /* 2x More Compact Grid (4 to 5 columns on desktop, 2 on mobile) */
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-3 sm:gap-4">
              {displayListings.map((item) => (
                <ListingCard key={item.id} {...item} variant="compact" />
              ))}
            </div>
          ) : (
            /* Sleek List View */
            <div className="flex flex-col gap-3 sm:gap-3.5">
              {displayListings.map((item) => (
                <ListingCard key={item.id} {...item} variant="list" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ListingsCatalogPage() {
  return (
    <React.Suspense
      fallback={
        <div className="container mx-auto px-4 py-16 text-center text-sm text-muted-foreground">
          იტვირთება კატალოგი...
        </div>
      }
    >
      <ListingsCatalogContent />
    </React.Suspense>
  );
}
