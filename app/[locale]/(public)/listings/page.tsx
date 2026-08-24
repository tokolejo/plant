"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePathname, Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { ListingCard } from "@/components/listings/ListingCard";
import { LocationSearchCombobox, GEORGIA_CITIES } from "@/components/common/LocationSearchCombobox";
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
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
  RotateCcw,
  Navigation,
  Flame,
  ArrowDownUp,
  Loader2,
  LayoutGrid,
  List,
  Plus
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
          <span className="text-xs font-bold uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">
            {title}
          </span>
          {badgeCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-primary text-white text-[10px] font-black">
              {badgeCount}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
      </button>
      {isOpen && <div className="pt-2 pb-1 animate-in fade-in duration-150">{children}</div>}
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
  const rawType = (searchParams.get("type") || "ALL").toUpperCase();

  const categoryParam = searchParams.get("category");
  const transParam = searchParams.get("trans");

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
  const [selectedTrans, setSelectedTrans] = React.useState<string[]>([]);
  const [selectedDelivery, setSelectedDelivery] = React.useState<string[]>([]);
  const [priceRange, setPriceRange] = React.useState<[number, number]>([0, 500]);
  const [sortBy, setSortBy] = React.useState<"nearest" | "newest" | "price-asc" | "price-desc" | "views">("nearest");
  const [pageSize, setPageSize] = React.useState<number>(20);
  const [visibleCount, setVisibleCount] = React.useState<number>(20);
  const [mobileFilterOpen, setMobileFilterOpen] = React.useState(false);

  // Accordion state for filter sections — Search open by default, other sections collapsed
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
    search: true,
    location: false,
    price: false,
    transaction: false,
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
    if (transParam) {
      setSelectedTrans([transParam]);
      setOpenSections((prev) => ({ ...prev, transaction: true }));
    }
  }, [transParam]);

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

  // Fetch real listings from Supabase + Realtime WebSockets
  React.useEffect(() => {
    async function loadLiveListings() {
      try {
        const merged = await getMergedListings();
        const localized = merged.map((item: any) => ({
          ...item,
          title: isKa ? (item.titleKa || item.title_ka || item.title) : (item.titleEn || item.title_en || item.title),
        }));
        setAllListings(localized);
      } catch (e) {
        console.error("Supabase live listings fetch failed:", e);
      } finally {
        setLoading(false);
      }
    }
    loadLiveListings();

    const channel = supabase
      .channel("public:catalog_listings_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listings" },
        () => {
          loadLiveListings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isKa, supabase]);

  // Dynamic live categories from Supabase + live listings
  const [dbCategories, setDbCategories] = React.useState<any[]>([]);

  React.useEffect(() => {
    async function loadDbCategories() {
      try {
        const { data } = await supabase.from("categories").select("*").order("name_ka");
        if (data && data.length > 0) {
          setDbCategories(data);
        }
      } catch (err) {
        console.warn("Could not load db categories:", err);
      }
    }
    loadDbCategories();
  }, [supabase]);

  const dynamicCategoryGroups = React.useMemo(() => {
    const groups: LocalizedCategoryGroup[] = PLANT_CATEGORY_GROUPS.map((g) => ({
      ...g,
      children: [...g.children],
    }));

    const standardCatIds = new Set(
      PLANT_CATEGORY_GROUPS.flatMap((g) => g.children.map((c) => c.id as string))
    );

    const customCatsMap = new Map<string, LocalizedCategory>();

    dbCategories.forEach((dbCat: any) => {
      const slug = dbCat.slug || dbCat.name_ka;
      if (!standardCatIds.has(slug) && !customCatsMap.has(slug)) {
        customCatsMap.set(slug, {
          id: slug as any,
          labelKa: dbCat.name_ka || slug,
          labelEn: dbCat.name_en || dbCat.name_ka || slug,
          emoji: dbCat.icon || (dbCat.item_type === "INVENTORY" ? "📦" : "🌿"),
        });
      }
    });

    allListings.forEach((item: any) => {
      const cat = item.plantCategory || item.plant_category;
      if (cat && !standardCatIds.has(cat) && !customCatsMap.has(cat)) {
        customCatsMap.set(cat, {
          id: cat as any,
          labelKa: cat,
          labelEn: cat,
          emoji: item.itemType === "INVENTORY" ? "📦" : "🌿",
        });
      }
    });

    if (customCatsMap.size > 0) {
      groups.push({
        id: "custom-categories",
        labelKa: "✨ ახალი & დამატებითი კატეგორიები",
        labelEn: "✨ Custom & New Categories",
        icon: Sparkles,
        color: "text-purple-700 dark:text-purple-400",
        children: Array.from(customCatsMap.values()),
      });
    }

    return groups;
  }, [allListings, dbCategories]);

  // Smart auto-expansion: when arriving from homepage / link with a categoryParam
  React.useEffect(() => {
    if (categoryParam) {
      setSelectedCategories([categoryParam as any]);
      // Open ONLY categories section
      setOpenSections((prev) => ({ ...prev, categories: true }));
      // Open ONLY the specific group that contains this plant category
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
          "custom-categories": false,
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
    setItemTypeFilter("ALL");
    setOpenSections({
      search: true,
      location: false,
      price: false,
      transaction: false,
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
  };

  const toggleDelivery = (d: string) => {
    setSelectedDelivery((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  // Dynamic live count by category from database and listings
  const countByCategory = (cat: string) =>
    allListings.filter((l) => (l.plantCategory === cat || l.plant_category === cat)).length;

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
          const matchCategory = (item.plantCategory || item.plant_category)?.toLowerCase().includes(q);
          const matchCity = item.city.toLowerCase().includes(q);
          if (!matchTitle && !matchCategory && !matchCity) return false;
        }

        if (itemTypeFilter !== "ALL") {
          if (item.itemType !== itemTypeFilter) return false;
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

        if (selectedCategories.length > 0) {
          const itemCat = item.plantCategory || item.plant_category;
          if (!selectedCategories.includes(itemCat as any)) return false;
        }

        if (selectedTrans.length > 0 && !selectedTrans.includes(item.transactionType)) return false;
        if (selectedDelivery.length > 0 && !selectedDelivery.some((d: string) => item.deliveryMethods?.includes(d as any))) return false;
        if (item.transactionType !== "TRADE") {
          if (item.price < priceRange[0] || item.price > priceRange[1]) return false;
        }
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
    priceRange,
    itemTypeFilter,
  ]);

  const paginatedListings = React.useMemo(() => {
    return displayListings.slice(0, visibleCount);
  }, [displayListings, visibleCount]);

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

      {/* 💰 Price Range */}
      <FilterSection
        title={isKa ? "ფასის დიაპაზონი (₾)" : "Price Range (₾)"}
        isOpen={openSections.price}
        onToggle={() => toggleSection("price")}
        badgeCount={priceRange[0] > 0 || priceRange[1] < 500 ? 1 : 0}
        className="relative z-10"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <input
                type="number"
                value={priceRange[0]}
                onChange={(e) => {
                  setPriceRange([Number(e.target.value), priceRange[1]]);
                  setOpenSections((prev) => ({ ...prev, price: true }));
                }}
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
                onChange={(e) => {
                  setPriceRange([priceRange[0], Number(e.target.value)]);
                  setOpenSections((prev) => ({ ...prev, price: true }));
                }}
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

          {/* Quick Price Chips */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {[[0, 30], [0, 100], [0, 200], [0, 500]].map(([min, max]) => (
              <button
                key={`${min}-${max}`}
                onClick={() => {
                  setPriceRange([min, max]);
                  setOpenSections((prev) => ({ ...prev, price: true }));
                }}
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

      {/* Transaction Type */}
      <FilterSection
        title={isKa ? "გარიგების ტიპი" : "Transaction Type"}
        isOpen={openSections.transaction}
        onToggle={() => toggleSection("transaction")}
        badgeCount={selectedTrans.length}
      >
        <div className="grid grid-cols-1 gap-2">
          {[
            { id: "FIXED", label: isKa ? "ფიქსირებული ფასი" : "Fixed Price" },
            { id: "NEGOTIABLE", label: isKa ? "ფასი შეთანხმებით" : "Negotiable" },
            { id: "TRADE", label: isKa ? "მცენარის გაცვლა" : "Trade Only" },
            { id: "GIFT", label: isKa ? "გაჩუქება (უფასოდ)" : "Free Giveaway" },
          ].map((t) => {
            const active = selectedTrans.includes(t.id);
            const count = allListings.filter((l) => l.transactionType === t.id).length;
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
      <FilterSection
        title={isKa ? "კატეგორიები" : "Categories"}
        isOpen={openSections.categories}
        onToggle={() => toggleSection("categories")}
        badgeCount={selectedCategories.length}
      >
        <div className="space-y-2">
          {dynamicCategoryGroups.map((group) => {
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
      {/* 1. Header Hero Banner (Identical to Services layout) */}
      <div className="rounded-[28px] bg-gradient-to-r from-emerald-600/10 via-primary/10 to-teal-500/10 border border-border/80 p-6 sm:p-8 shadow-ambient flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
            {isKa ? "მცენარეები & ბაღის ინვენტარი" : "Plants & Garden Marketplace"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {isKa
              ? "შეიძინეთ, გაცვალეთ ან გააჩუქეთ ოთახის და ეზოს მცენარეები, იშვიათი კოლექციები, ქოთნები და ორგანული სასუქები."
              : "Buy, trade, and discover houseplants, rare botanical specimens, pots, substrates, and care supplies."}
          </p>
        </div>

        <Link href="/dashboard/listings/new">
          <Button
            type="button"
            className="rounded-[16px] bg-primary hover:bg-primary/90 text-white font-black text-xs sm:text-sm h-12 px-6 gap-2 shadow-ambient cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isKa ? "განცხადების დამატება" : "Add Listing"}</span>
          </Button>
        </Link>
      </div>

      {/* Top Toolbar: Switcher Tabs + Mobile Controls Bar */}
      <div className="space-y-3 mb-5">
        {/* Row 1: Item Type Switcher Tabs (All -> Plants -> Inventory) */}
        <div className="w-full">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-[16px] bg-secondary-container/70 border border-border/60 w-full">
            {/* 1. All */}
            <button
              type="button"
              onClick={() => setItemTypeFilter("ALL")}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 rounded-[12px] text-xs font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
                itemTypeFilter === "ALL"
                  ? "bg-primary text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{isKa ? "ყველა" : "All"}</span>
              <span className="text-[10px] opacity-80 font-mono">({allListings.length})</span>
            </button>

            {/* 2. Plants */}
            <button
              type="button"
              onClick={() => setItemTypeFilter("PLANT")}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 rounded-[12px] text-xs font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
                itemTypeFilter === "PLANT"
                  ? "bg-primary text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sprout className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
              <span>{isKa ? "მცენარეები" : "Plants"}</span>
              <span className="text-[10px] opacity-80 font-mono">({plantsCount})</span>
            </button>

            {/* 3. Inventory */}
            <button
              type="button"
              onClick={() => setItemTypeFilter("INVENTORY")}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 rounded-[12px] text-xs font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
                itemTypeFilter === "INVENTORY"
                  ? "bg-primary text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
              <span>{isKa ? "ინვენტარი" : "Supplies"}</span>
              <span className="text-[10px] opacity-80 font-mono">({inventoryCount})</span>
            </button>
          </div>
        </div>

        {/* Row 2 (Mobile Only Action Bar): Filters Button + Page Size + Grid/List Mode */}
        <div className="flex lg:hidden items-center justify-between gap-2">
          {/* Left: Mobile Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="flex items-center gap-2 h-9 px-3.5 rounded-[14px] border border-border/80 bg-card text-xs font-bold text-foreground shadow-2xs hover:bg-surface-container transition-all cursor-pointer shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            <span>{isKa ? "ფილტრები" : "Filters"}</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Right: Page Size & Grid/List Mode Toggle */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Page Size Selector */}
            <div className="relative inline-flex items-center">
              <select
                value={pageSize}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPageSize(val);
                  setVisibleCount(val);
                }}
                className="h-9 pl-2.5 pr-6 rounded-[12px] bg-card border border-border/80 text-xs font-bold text-foreground hover:bg-surface-container transition-all cursor-pointer appearance-none focus:outline-none focus:ring-1.5 focus:ring-primary shadow-2xs"
                title={isKa ? "რაოდენობა" : "Items per page"}
              >
                <option value={20}>20</option>
                <option value={40}>40</option>
                <option value={60}>60</option>
                <option value={80}>80</option>
                <option value={100}>100</option>
              </select>
              <ChevronDown className="w-3 h-3 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-70" />
            </div>

            {/* Grid / List View Toggle */}
            <div className="flex items-center gap-0.5 bg-card border border-border/80 rounded-[12px] p-0.5 shadow-2xs h-9">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`h-7.5 w-7.5 rounded-[8px] flex items-center justify-center transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-container"
                }`}
                title={isKa ? "გრიდის ხედი" : "Grid View"}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`h-7.5 w-7.5 rounded-[8px] flex items-center justify-center transition-all cursor-pointer ${
                  viewMode === "list"
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-container"
                }`}
                title={isKa ? "სიის ხედი" : "List View"}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
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
          {selectedTrans.map((t) => {
            const chipClass = 
              t === "TRADE"
                ? "bg-indigo-500/15 text-indigo-900 dark:text-indigo-200 border-indigo-500/30"
                : t === "NEGOTIABLE"
                ? "bg-stone-500/15 text-stone-900 dark:text-stone-200 border-stone-400/30"
                : "bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 border-emerald-500/30";
            return (
              <span key={t} className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-[10px] text-xs sm:text-sm font-bold border ${chipClass}`}>
                {t === "FIXED" ? (isKa ? "💰 ფიქსირებული" : "💰 Fixed") : t === "NEGOTIABLE" ? (isKa ? "🤝 შეთანხმებით" : "🤝 Negotiable") : (isKa ? "🔄 გაცვლა" : "🔄 Trade")}
                <button onClick={() => toggleTrans(t)} className="hover:opacity-75"><X className="w-3.5 h-3.5" /></button>
              </span>
            );
          })}
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
        <div className="lg:hidden mb-6 rounded-[24px] border border-border/80 bg-card p-5 shadow-ambient-lg relative z-30 overflow-visible">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-base font-bold text-foreground">{isKa ? "ფილტრები" : "Filters"}</span>
            <button onClick={() => setMobileFilterOpen(false)} className="p-1 rounded-[8px] hover:bg-surface-container cursor-pointer">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          {SidebarContent}
        </div>
      )}

      <div className="flex gap-6 lg:gap-7">
        {/* Sidebar — Desktop */}
        <aside className="hidden lg:block w-76 sm:w-80 shrink-0 relative z-30">
          <div className="sticky top-20 rounded-[24px] border border-border/80 bg-card p-5 shadow-ambient overflow-visible relative z-30">
            {SidebarContent}
          </div>
        </aside>

        {/* Results Column */}
        <div className="flex-1 min-w-0">
          {/* Top Sorting Pill Bar (Mobile & Desktop) */}
          <div className="mb-4 flex items-center justify-between gap-2">
            {/* Sort Buttons (Smooth horizontal pill bar) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-0.5">
              {[
                { 
                  id: "nearest", 
                  labelKa: "ახლოს", 
                  labelEn: "Nearest",
                  isActive: sortBy === "nearest"
                },
                { 
                  id: "views", 
                  labelKa: "პოპულარული", 
                  labelEn: "Popular",
                  isActive: sortBy === "views"
                },
                { 
                  id: "newest", 
                  labelKa: "უახლესი", 
                  labelEn: "Newest",
                  isActive: sortBy === "newest"
                },
                { 
                  id: "price", 
                  labelKa: sortBy === "price-desc" ? "ფასი ↓" : sortBy === "price-asc" ? "ფასი ↑" : "ფასი ⇅", 
                  labelEn: sortBy === "price-desc" ? "Price ↓" : sortBy === "price-asc" ? "Price ↑" : "Price ⇅",
                  isActive: sortBy === "price-asc" || sortBy === "price-desc"
                },
              ].map((opt) => {
                const isActive = opt.isActive;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSortClick(opt.id)}
                    className={`shrink-0 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-primary text-white shadow-xs scale-[1.02]"
                        : "bg-card border border-border/70 text-foreground hover:bg-surface-container hover:border-primary/40"
                    }`}
                  >
                    {opt.id === "nearest" && gpsLoading ? (
                      <span className="flex items-center justify-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>{isKa ? "GPS..." : "Locating..."}</span>
                      </span>
                    ) : (
                      isKa ? opt.labelKa : opt.labelEn
                    )}
                  </button>
                );
              })}
            </div>

            {/* Desktop Only: Page Size Selector & View Mode Switcher */}
            <div className="hidden lg:flex items-center gap-2 shrink-0">
              {/* Page Size Selector Dropdown */}
              <div className="relative inline-flex items-center">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setPageSize(val);
                    setVisibleCount(val);
                  }}
                  className="h-8.5 pl-2.5 pr-6 rounded-xl bg-card border border-border/70 text-xs font-bold text-foreground hover:bg-surface-container hover:border-primary/40 transition-all cursor-pointer appearance-none focus:outline-none focus:ring-1.5 focus:ring-primary shadow-2xs"
                  title={isKa ? "რაოდენობა" : "Items per page"}
                >
                  <option value={20}>20</option>
                  <option value={40}>40</option>
                  <option value={60}>60</option>
                  <option value={80}>80</option>
                  <option value={100}>100</option>
                </select>
                <ChevronDown className="w-3 h-3 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-70" />
              </div>

              {/* View Mode Toggle (Grid vs List) */}
              <div className="flex items-center gap-0.5 bg-card border border-border/80 rounded-xl p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-[8px] transition-all cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-container"
                  }`}
                  title={isKa ? "გრიდის ხედი" : "Grid View"}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-[8px] transition-all cursor-pointer ${
                    viewMode === "list"
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-container"
                  }`}
                  title={isKa ? "სიის ხედი" : "List View"}
                >
                  <List className="w-3.5 h-3.5" />
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
              {paginatedListings.map((item) => (
                <ListingCard key={item.id} {...item} variant="compact" />
              ))}
            </div>
          ) : (
            /* Sleek List View */
            <div className="flex flex-col gap-3 sm:gap-3.5">
              {paginatedListings.map((item) => (
                <ListingCard key={item.id} {...item} variant="list" />
              ))}
            </div>
          )}

          {/* Load More Button ("მეტის ნახვა") */}
          {displayListings.length > visibleCount && (
            <div className="flex flex-col items-center justify-center pt-8 pb-4 space-y-2">
              <Button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + pageSize)}
                className="h-11 px-8 rounded-[16px] bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm font-bold shadow-ambient gap-2 hover:scale-[1.02] transition-all cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
                <span>{isKa ? "მეტის ნახვა" : "Load More"}</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-[6px] text-xs font-mono">
                  +{Math.min(pageSize, displayListings.length - visibleCount)}
                </span>
              </Button>
              <p className="text-xs text-muted-foreground font-medium">
                {isKa
                  ? `ნაჩვენებია ${Math.min(visibleCount, displayListings.length)} / ${displayListings.length}-დან`
                  : `Showing ${Math.min(visibleCount, displayListings.length)} of ${displayListings.length}`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ListingsCatalogPage() {
  const locale = useLocale();
  const isKa = locale !== "en";
  return (
    <React.Suspense
      fallback={
        <div className="container mx-auto px-4 py-16 text-center text-sm text-muted-foreground">
          {isKa ? "იტვირთება კატალოგი..." : "Loading catalog..."}
        </div>
      }
    >
      <ListingsCatalogContent />
    </React.Suspense>
  );
}
