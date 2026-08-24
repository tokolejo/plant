"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePathname, Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { ListingCard } from "@/components/listings/ListingCard";
import { LocationSearchCombobox } from "@/components/common/LocationSearchCombobox";
import { SAMPLE_LISTINGS, type PlantCategory } from "@/lib/mock-data";
import { getMergedListings } from "@/lib/listings-service";
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
  LayoutGrid,
  List,
  Shuffle,
  Gift,
  Plus,
  PlusCircle,
  ArrowRight
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
  isOpen,
  onToggle,
  badgeCount = 0,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  badgeCount?: number;
  className?: string;
}) {
  return (
    <div className={`border-b border-border/60 py-3 last:border-b-0 ${className}`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-1 text-left group cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground group-hover:text-amber-600 transition-colors">
            {title}
          </span>
          {badgeCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-amber-600 text-white text-[10px] font-black">
              {badgeCount}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-amber-600 transition-colors" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-amber-600 transition-colors" />
        )}
      </button>
      {isOpen && <div className="pt-2 pb-1 animate-in fade-in duration-150">{children}</div>}
    </div>
  );
}

// ─── Main ISO Swap Page Content ───────────────────────────────────────────────
function IsoCatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const isKa = locale !== "en";
  const supabase = createClient();

  const queryParam = searchParams.get("q") || "";
  const cityParam = searchParams.get("city") || "მთელი საქართველო";
  const rawType = (searchParams.get("type") || "ALL").toUpperCase();
  const categoryParam = searchParams.get("category");
  const transParam = searchParams.get("trans") || "ALL";

  // Real Database listings state
  const [allListings, setAllListings] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Item Type Filter: PLANT, INVENTORY, or ALL
  const [itemTypeFilter, setItemTypeFilter] = React.useState<"ALL" | "PLANT" | "INVENTORY">(
    rawType === "PLANT" || rawType === "INVENTORY" ? (rawType as any) : "ALL"
  );

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
  const [selectedTrans, setSelectedTrans] = React.useState<string[]>(
    transParam === "TRADE" || transParam === "GIFT" ? [transParam] : []
  );
  const [selectedDelivery, setSelectedDelivery] = React.useState<string[]>([]);
  const [sortBy, setSortBy] = React.useState<"nearest" | "newest" | "views">("nearest");
  const [pageSize, setPageSize] = React.useState<number>(20);
  const [visibleCount, setVisibleCount] = React.useState<number>(20);
  const [mobileFilterOpen, setMobileFilterOpen] = React.useState(false);

  // Accordion state for filter sections — Search open by default, other sections collapsed
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
    search: true,
    location: false,
    swapType: false,
    delivery: false,
    categories: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Accordion state for category sub-groups — ALL COLLAPSED BY DEFAULT
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

  React.useEffect(() => {
    if (rawType === "PLANT" || rawType === "INVENTORY") {
      setItemTypeFilter(rawType as any);
    } else if (!searchParams.get("type")) {
      setItemTypeFilter("ALL");
    }
  }, [rawType, searchParams]);

  React.useEffect(() => {
    if (cityParam && cityParam !== "მთელი საქართველო") {
      setSelectedCity(cityParam);
      setOpenSections((prev) => ({ ...prev, location: true }));
    }
  }, [cityParam]);

  React.useEffect(() => {
    if (queryParam) {
      setSearchQ(queryParam);
      setOpenSections((prev) => ({ ...prev, search: true }));
    }
  }, [queryParam]);

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

  // Fetch real listings from Supabase + Realtime WebSockets
  React.useEffect(() => {
    async function loadLiveTradeListings() {
      try {
        const merged = await getMergedListings();
        // Filter items that are either TRADE, GIFT, or have tradePreferences
        const tradesOnly = merged.filter(
          (l) => l.transactionType === "TRADE" || l.transactionType === "GIFT" || (l.tradePreferences && l.tradePreferences.length > 0)
        );

        const listToUse = tradesOnly.length > 0
          ? tradesOnly
          : merged.map((item, i) => ({
              ...item,
              transactionType: i % 2 === 0 ? "TRADE" : "GIFT",
              tradePreferences: item.tradePreferences?.length ? item.tradePreferences : ["Monstera", "Ficus", "სუკულენტი"],
            }));

        const localized = listToUse.map((item: any) => ({
          ...item,
          title: isKa ? (item.titleKa || item.title_ka || item.title) : (item.titleEn || item.title_en || item.title),
        }));
        setAllListings(localized);
      } catch (e) {
        console.error("Supabase live trade listings fetch failed:", e);
      } finally {
        setLoading(false);
      }
    }
    loadLiveTradeListings();

    const channel = supabase
      .channel("public:iso_listings_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listings" },
        () => {
          loadLiveTradeListings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isKa, supabase]);

  // Dynamic category taxonomy
  const dynamicCategoryGroups = React.useMemo(() => {
    return PLANT_CATEGORY_GROUPS;
  }, []);

  // Smart auto-expansion: when arriving with categoryParam
  React.useEffect(() => {
    if (categoryParam) {
      setSelectedCategories([categoryParam as any]);
      setOpenSections((prev) => ({ ...prev, categories: true }));
      const targetGroup = dynamicCategoryGroups.find((g) =>
        g.children.some((c) => c.id === categoryParam)
      );
      if (targetGroup) {
        setOpenGroups({
          aroid: false,
          flowering: false,
          "tree-ficus": false,
          "cactus-etc": false,
          inventory: false,
          [targetGroup.id]: true,
        });
      }
    }
  }, [categoryParam, dynamicCategoryGroups]);

  // Derived active filter count
  const activeFilterCount =
    selectedCategories.length +
    selectedTrans.length +
    selectedDelivery.length +
    (selectedCity !== "მთელი საქართველო" && !selectedCity.includes("ჩემი ლოკაცია") ? 1 : 0);

  const resetAll = () => {
    setSearchQ("");
    setSelectedCity("მთელი საქართველო");
    setSelectedCategories([]);
    setSelectedTrans([]);
    setSelectedDelivery([]);
    setSortBy("nearest");
    setItemTypeFilter("ALL");
    setOpenSections({
      search: true,
      location: false,
      swapType: false,
      delivery: false,
      categories: false,
    });
    setOpenGroups({
      aroid: false,
      flowering: false,
      "tree-ficus": false,
      "cactus-etc": false,
      inventory: false,
    });
  };

  const plantsCount = React.useMemo(() => allListings.filter((l) => l.itemType === "PLANT").length, [allListings]);
  const inventoryCount = React.useMemo(() => allListings.filter((l) => l.itemType === "INVENTORY").length, [allListings]);

  const toggleCategory = (cat: PlantCategory | string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat as any) ? prev.filter((c) => c !== cat) : [...prev, cat as any]
    );
    setOpenSections((prev) => ({ ...prev, categories: true }));
  };

  const toggleTrans = (t: string) => {
    setSelectedTrans((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
    setOpenSections((prev) => ({ ...prev, swapType: true }));
  };

  const toggleDelivery = (d: string) => {
    setSelectedDelivery((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
    setOpenSections((prev) => ({ ...prev, delivery: true }));
  };

  const countByCategory = (cat: string) =>
    allListings.filter((l) => (l.plantCategory === cat || l.plant_category === cat)).length;

  // Calculate distance for all listings and apply filters
  const filtered = React.useMemo(() => {
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
          const matchCategory = (item.plantCategory || item.plant_category)?.toLowerCase().includes(q);
          const matchCity = item.city.toLowerCase().includes(q);
          const matchTrade = item.tradePreferences?.some((t: string) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchCategory && !matchCity && !matchTrade) return false;
        }

        if (itemTypeFilter !== "ALL") {
          if (item.itemType !== itemTypeFilter) return false;
        }

        if (
          selectedCity !== "მთელი საქართველო" &&
          !selectedCity.includes("ჩემი ლოკაცია") &&
          !selectedCity.includes("GPS")
        ) {
          if (!item.city.toLowerCase().includes(selectedCity.toLowerCase())) {
            return false;
          }
        }

        if (selectedCategories.length > 0) {
          const itemCat = item.plantCategory || item.plant_category;
          if (!selectedCategories.includes(itemCat as any)) return false;
        }

        if (selectedTrans.length > 0 && !selectedTrans.includes(item.transactionType)) return false;
        if (selectedDelivery.length > 0 && !selectedDelivery.some((d: string) => item.deliveryMethods?.includes(d as any))) return false;

        return true;
      });
  }, [
    allListings,
    itemTypeFilter,
    userCoords,
    searchQ,
    selectedCity,
    selectedCategories,
    selectedTrans,
    selectedDelivery,
  ]);

  // Sort Pipeline
  const sortedListings = React.useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === "nearest") {
        return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
      }
      if (sortBy === "views") return (b.viewsCount || 0) - (a.viewsCount || 0);
      return 0; // newest
    });
  }, [filtered, sortBy]);

  // Reset pagination when filters change
  React.useEffect(() => {
    setVisibleCount(pageSize);
  }, [
    pageSize,
    sortBy,
    searchQ,
    selectedCity,
    selectedCategories,
    selectedTrans,
    selectedDelivery,
    itemTypeFilter,
  ]);

  const paginatedListings = React.useMemo(() => {
    return sortedListings.slice(0, visibleCount);
  }, [sortedListings, visibleCount]);

  // ─── Sidebar Content JSX ───────────────────────────────────────────────────
  const SidebarContent = (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-border/60">
        <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          {isKa ? "გაცვლის ფილტრები" : "Swap Filters"}
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[11px] font-black">
              {activeFilterCount}
            </span>
          )}
        </h2>
        {activeFilterCount > 0 && (
          <button
            onClick={resetAll}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> {isKa ? "გასუფთავება" : "Clear"}
          </button>
        )}
      </div>

      {/* Search */}
      <FilterSection
        title={isKa ? "ძებნა" : "Search"}
        isOpen={openSections.search}
        onToggle={() => toggleSection("search")}
        badgeCount={searchQ ? 1 : 0}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQ}
            onChange={(e) => {
              setSearchQ(e.target.value);
              setOpenSections((prev) => ({ ...prev, search: true }));
            }}
            placeholder={isKa ? "Monstera, ფიკუსი, სუკულენტი..." : "Monstera, Ficus, Succulent..."}
            className="w-full pl-9 pr-4 py-2.5 rounded-[12px] border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {searchQ && (
            <button onClick={() => setSearchQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </FilterSection>

      {/* Location */}
      <FilterSection
        title={isKa ? "ლოკაცია" : "Location"}
        isOpen={openSections.location}
        onToggle={() => toggleSection("location")}
        badgeCount={selectedCity && selectedCity !== "მთელი საქართველო" ? 1 : 0}
        className="relative z-40 overflow-visible"
      >
        <div className="rounded-[14px] border border-border/80 bg-background overflow-visible relative">
          <LocationSearchCombobox
            selectedCity={selectedCity}
            onCityChange={(cityName, coords) => {
              setSelectedCity(cityName);
              if (coords) setUserCoords(coords);
              setOpenSections((prev) => ({ ...prev, location: true }));
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

      {/* Swap / Deal Mode */}
      <FilterSection
        title={isKa ? "გარიგების ფორმა" : "Trade Mode"}
        isOpen={openSections.swapType}
        onToggle={() => toggleSection("swapType")}
        badgeCount={selectedTrans.length}
      >
        <div className="grid grid-cols-1 gap-2">
          {[
            { id: "TRADE", label: isKa ? "მცენარის გაცვლა" : "Plant Trade" },
            { id: "GIFT", label: isKa ? "გაჩუქება (უფასოდ)" : "Free Giveaway" },
          ].map((t) => {
            const active = selectedTrans.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelectedTrans((prev) =>
                    prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id]
                  );
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-[12px] text-xs font-bold transition-all cursor-pointer border ${
                  active
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-background border-border/70 text-foreground hover:bg-surface-container"
                }`}
              >
                <span>{t.label}</span>
                {active && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Delivery Methods */}
      <FilterSection
        title={isKa ? "მიწოდების მეთოდები" : "Delivery Methods"}
        isOpen={openSections.delivery}
        onToggle={() => toggleSection("delivery")}
        badgeCount={selectedDelivery.length}
      >
        <div className="space-y-1.5">
          {[
            { id: "PICKUP", label: isKa ? "ადგილზე გატანა" : "Local Pickup" },
            { id: "COURIER", label: isKa ? "საკურიერო მიწოდება" : "Courier Delivery" },
            { id: "MARSHRUTKA", label: isKa ? "სამარშრუტო ტრანსპორტი" : "Regional Transit" },
          ].map((d) => {
            const active = selectedDelivery.includes(d.id);
            return (
              <button
                key={d.id}
                onClick={() => toggleDelivery(d.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-xs sm:text-sm transition-all text-left cursor-pointer ${
                  active
                    ? "bg-indigo-500/10 text-indigo-900 dark:text-indigo-300 font-bold border border-indigo-500/30"
                    : "text-foreground hover:bg-surface-container border border-border/50 bg-card"
                }`}
              >
                <div className={`w-4 h-4 rounded-[6px] border flex items-center justify-center shrink-0 ${
                  active ? "bg-indigo-600 border-indigo-600 text-white" : "border-border"
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
      <FilterSection
        title={isKa ? "კატეგორიები" : "Categories"}
        isOpen={openSections.categories}
        onToggle={() => toggleSection("categories")}
        badgeCount={selectedCategories.length}
      >
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
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-7xl space-y-8">
      {/* 1. Header Hero Banner (Identical layout to Marketplace and Services) */}
      <div className="rounded-[28px] bg-gradient-to-r from-emerald-600/10 via-primary/10 to-teal-500/10 border border-border/80 p-6 sm:p-8 shadow-ambient flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
            {isKa ? "მცენარეების გაცვლა & ძიება (ISO)" : "Plant Swaps & In Search Of"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {isKa
              ? "განათავსეთ თქვენი გასაცვლელი მცენარე, მოძებნეთ სასურველი ჯიშები და შესთავაზეთ გაცვლა სხვა წევრებს."
              : "Post your plants for swap, search desired varieties, and propose trades directly to community members."}
          </p>
        </div>

        <Link href="/dashboard/listings/new?trans=TRADE">
          <Button
            type="button"
            className="rounded-[16px] bg-primary hover:bg-primary/90 text-white font-black text-xs sm:text-sm h-12 px-6 gap-2 shadow-ambient cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isKa ? "განცხადების დამატება" : "Post Swap Listing"}</span>
          </Button>
        </Link>
      </div>

      {/* 🌟 2. Main Grid Layout (Sidebar + Results) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:col-span-1 rounded-[24px] border border-border/80 bg-card p-5 shadow-ambient sticky top-20">
          {SidebarContent}
        </aside>

        {/* Mobile Filter Drawer */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-[120] lg:hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-card p-6 shadow-2xl overflow-y-auto flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-border/80 mb-4">
                  <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-primary" />
                    {isKa ? "ფილტრები" : "Filters"}
                  </h3>
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="p-1.5 rounded-full hover:bg-surface-container text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {SidebarContent}
              </div>
              <div className="pt-6 border-t border-border/80 mt-6">
                <Button
                  className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold cursor-pointer"
                  onClick={() => setMobileFilterOpen(false)}
                >
                  {isKa ? `შედეგების ნახვა (${filtered.length})` : `Show Results (${filtered.length})`}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Results Column */}
        <div className="lg:col-span-3 space-y-4">
          {/* Top Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border/80 rounded-[20px] p-3 sm:p-3.5 shadow-2xs">
            {/* Left: Item Type Switcher */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setItemTypeFilter("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  itemTypeFilter === "ALL"
                    ? "bg-foreground text-background shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-container"
                }`}
              >
                {isKa ? "ყველა" : "All"} ({allListings.length})
              </button>
              <button
                type="button"
                onClick={() => setItemTypeFilter("PLANT")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  itemTypeFilter === "PLANT"
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-container"
                }`}
              >
                <Sprout className="w-3.5 h-3.5" />
                <span>{isKa ? "მცენარეები" : "Plants"}</span>
              </button>
              <button
                type="button"
                onClick={() => setItemTypeFilter("INVENTORY")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  itemTypeFilter === "INVENTORY"
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-container"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isKa ? "ინვენტარი" : "Care & Pots"}</span>
              </button>
            </div>

            {/* Mobile Filter Toggle */}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-bold cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
              <span>{isKa ? "ფილტრები" : "Filters"}</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Right: Sort & Layout Toggle */}
            <div className="flex items-center gap-2 ml-auto">
              <div className="flex items-center gap-1 bg-secondary-container/60 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleSortClick("nearest")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    sortBy === "nearest"
                      ? "bg-card text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isKa ? "უახლოესი" : "Nearest"}
                </button>
                <button
                  type="button"
                  onClick={() => handleSortClick("newest")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    sortBy === "newest"
                      ? "bg-card text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isKa ? "უახლესი" : "Newest"}
                </button>
                <button
                  type="button"
                  onClick={() => handleSortClick("views")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    sortBy === "views"
                      ? "bg-card text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isKa ? "პოპულარული" : "Views"}
                </button>
              </div>

              {/* View Mode Toggle (Grid vs List) */}
              <div className="flex items-center gap-0.5 bg-card border border-border/80 rounded-xl p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1 sm:p-1.5 rounded-[8px] transition-all cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-container"
                  }`}
                  title={isKa ? "გრიდის ხედი" : "Grid View"}
                >
                  <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1 sm:p-1.5 rounded-[8px] transition-all cursor-pointer ${
                    viewMode === "list"
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-container"
                  }`}
                  title={isKa ? "სიის ხედი" : "List View"}
                >
                  <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Results Listings */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="rounded-[20px] border border-border bg-card p-4 h-64 animate-pulse" />
              ))}
            </div>
          ) : sortedListings.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-border/80 bg-card/60 p-14 text-center shadow-ambient space-y-3">
              <Shuffle className="w-10 h-10 text-indigo-600 mx-auto mb-2" />
              <h3 className="font-bold text-lg text-foreground">
                {isKa ? "გასაცვლელი მცენარე ვერ მოიძებნა" : "No plant trade listings found"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {isKa ? "სცადეთ ფილტრების გასუფთავება ან იყავით პირველი, ვინც დაამატებს გასაცვლელ მცენარეს." : "Try resetting filters or be the first to post a plant trade."}
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
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {paginatedListings.map((item) => (
                <ListingCard key={item.id} {...item} variant="compact" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:gap-3.5">
              {paginatedListings.map((item) => (
                <ListingCard key={item.id} {...item} variant="list" />
              ))}
            </div>
          )}

          {/* Load More Button ("მეტის ნახვა") */}
          {sortedListings.length > visibleCount && (
            <div className="flex flex-col items-center justify-center pt-8 pb-4 space-y-2">
              <Button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + pageSize)}
                className="h-11 px-8 rounded-[16px] bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-ambient gap-2 hover:scale-[1.02] transition-all cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
                <span>{isKa ? "მეტის ნახვა" : "Load More"}</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-[6px] text-xs font-mono">
                  +{Math.min(pageSize, sortedListings.length - visibleCount)}
                </span>
              </Button>
              <p className="text-xs text-muted-foreground font-medium">
                {isKa
                  ? `ნაჩვენებია ${Math.min(visibleCount, sortedListings.length)} / ${sortedListings.length}-დან`
                  : `Showing ${Math.min(visibleCount, sortedListings.length)} of ${sortedListings.length}`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function IsoBoardPage() {
  const locale = useLocale();
  const isKa = locale !== "en";
  return (
    <React.Suspense
      fallback={
        <div className="container mx-auto px-4 py-16 text-center text-sm text-muted-foreground">
          {isKa ? "იტვირთება გაცვლის დაფა..." : "Loading swap board..."}
        </div>
      }
    >
      <IsoCatalogContent />
    </React.Suspense>
  );
}
