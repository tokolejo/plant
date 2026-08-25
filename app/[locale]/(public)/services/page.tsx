"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePathname, Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { ServiceCard } from "@/components/services/ServiceCard";
import { LocationSearchCombobox, GEORGIA_CITIES } from "@/components/common/LocationSearchCombobox";
import { 
  MOCK_SERVICES, 
  SERVICE_CATEGORIES, 
  type GardeningServiceItem, 
  type ServiceCategory 
} from "@/lib/mock-services";
import { createClient } from "@/utils/supabase/client";
import {
  SlidersHorizontal,
  X,
  Sparkles,
  Sprout,
  Wrench,
  TreePine,
  Layers,
  Building2,
  Droplets,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
  RotateCcw,
  LayoutGrid,
  List,
  MapPin,
  Star,
  ShieldCheck,
  Plus,
  ArrowDownUp,
  Navigation,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  TreePine,
  Sparkles,
  Layers,
  Building2,
  Droplets,
  Stethoscope,
  Sprout,
};

// ─── Collapsible Filter Section Component (Exact Match with Listings) ────────
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

function GardeningServicesCatalogContent() {
  const locale = useLocale();
  const isKa = locale !== "en";
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // Data States
  const [services, setServices] = React.useState<GardeningServiceItem[]>(MOCK_SERVICES);
  const [loading, setLoading] = React.useState(true);

  // Filter States from URL / State
  const [searchQ, setSearchQ] = React.useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = React.useState<string>(searchParams.get("category") || "ALL");
  const [selectedCity, setSelectedCity] = React.useState<string>(searchParams.get("city") || "მთელი საქართველო");
  const [userCoords, setUserCoords] = React.useState<[number, number] | null>(null);
  const [priceRange, setPriceRange] = React.useState<[number, number]>([
    Number(searchParams.get("minPrice")) || 0,
    Number(searchParams.get("maxPrice")) || 500,
  ]);
  const [verifiedOnly, setVerifiedOnly] = React.useState<boolean>(searchParams.get("verified") === "true");
  const [sortBy, setSortBy] = React.useState<string>(searchParams.get("sort") || "newest");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [pageSize, setPageSize] = React.useState<number>(20);
  const [visibleCount, setVisibleCount] = React.useState<number>(20);

  // Horizontal Category Slider Ref & Handler
  const categoryScrollRef = React.useRef<HTMLDivElement>(null);
  const scrollCategories = (direction: "left" | "right") => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === "left" ? -280 : 280;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Accordion Section States (Search, Location, Price, Category, Verified)
  const [openSections, setOpenSections] = React.useState({
    search: true,
    location: true,
    price: true,
    category: true,
    verified: true,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Mobile Filter Drawer State
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  // Fetch Services from Supabase (merging with mock seed)
  React.useEffect(() => {
    async function loadServices() {
      try {
        const { data, error } = await supabase
          .from("gardening_services")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          const dbItems: GardeningServiceItem[] = data.map((d: any) => ({
            id: d.id,
            provider_id: d.provider_id,
            provider_slug: d.provider_slug,
            provider_name: d.provider_name,
            provider_avatar: d.provider_avatar,
            provider_bio: d.provider_bio,
            provider_experience_years: d.provider_experience_years || 5,
            completed_jobs_count: d.completed_jobs_count || 10,
            is_verified: d.is_verified ?? true,
            category: d.category as ServiceCategory,
            title: d.title,
            description: d.description,
            price_from: Number(d.price_from) || 0,
            price_unit: d.price_unit || "ხეზე",
            city: d.city || "თბილისი",
            phone: d.phone,
            whatsapp: d.whatsapp,
            portfolio_images: d.portfolio_images && d.portfolio_images.length > 0 ? d.portfolio_images : [
              "https://images.unsplash.com/photo-1558904541-efa8c4a08931?w=600&auto=format&fit=crop&q=80"
            ],
            rating: Number(d.rating) || 5.0,
            reviews_count: Number(d.reviews_count) || 1,
            included_features: d.included_features || [],
            created_at: d.created_at,
          }));

          const existingIds = new Set(dbItems.map((item) => item.id));
          const mockFiltered = MOCK_SERVICES.filter((item) => !existingIds.has(item.id));
          setServices([...dbItems, ...mockFiltered]);
        }
      } catch (err) {
        console.warn("Failed to fetch gardening services:", err);
      } finally {
        setLoading(false);
      }
    }
    loadServices();
  }, [supabase]);

  // Sync with URL params
  const updateQueryParams = React.useCallback(
    (params: Record<string, string | null>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      Object.entries(params).forEach(([key, val]) => {
        if (!val || val === "ALL" || val === "მთელი საქართველო" || val === "false" || val === "0") {
          current.delete(key);
        } else {
          current.set(key, val);
        }
      });
      const search = current.toString();
      const query = search ? `?${search}` : "";
      router.replace(`${pathname}${query}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    updateQueryParams({ category: catId });
  };

  const handleResetFilters = () => {
    setSearchQ("");
    setSelectedCategory("ALL");
    setSelectedCity("მთელი საქართველო");
    setPriceRange([0, 500]);
    setVerifiedOnly(false);
    setSortBy("newest");
    router.replace(pathname, { scroll: false });
  };

  const handleSortClick = (type: string) => {
    if (type === "newest") {
      setSortBy("newest");
      updateQueryParams({ sort: "newest" });
    } else if (type === "rating") {
      setSortBy("rating");
      updateQueryParams({ sort: "rating" });
    } else if (type === "price") {
      if (sortBy === "price-asc") {
        setSortBy("price-desc");
        updateQueryParams({ sort: "price-desc" });
      } else if (sortBy === "price-desc") {
        setSortBy("newest");
        updateQueryParams({ sort: "newest" });
      } else {
        setSortBy("price-asc");
        updateQueryParams({ sort: "price-asc" });
      }
    }
  };

  // Active filters count calculation
  const activeFilterCount =
    (searchQ.trim() ? 1 : 0) +
    (selectedCategory !== "ALL" ? 1 : 0) +
    (selectedCity && selectedCity !== "მთელი საქართველო" ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 500 ? 1 : 0) +
    (verifiedOnly ? 1 : 0);

  // Filter & Sort Logic
  const filteredServices = React.useMemo(() => {
    return services
      .filter((srv) => {
        // 1. Search Query
        if (searchQ.trim()) {
          const q = searchQ.toLowerCase();
          const match =
            srv.title.toLowerCase().includes(q) ||
            srv.description.toLowerCase().includes(q) ||
            srv.provider_name.toLowerCase().includes(q) ||
            srv.city.toLowerCase().includes(q);
          if (!match) return false;
        }

        // 2. Category Filter
        if (selectedCategory !== "ALL" && srv.category !== selectedCategory) {
          return false;
        }

        // 3. City Filter
        if (
          selectedCity !== "მთელი საქართველო" &&
          !selectedCity.includes("ჩემი ლოკაცია") &&
          !selectedCity.includes("GPS")
        ) {
          if (!srv.city.toLowerCase().includes(selectedCity.toLowerCase())) {
            return false;
          }
        }

        // 4. Price Filter
        if (srv.price_from < priceRange[0] || srv.price_from > priceRange[1]) {
          return false;
        }

        // 5. Verified Only
        if (verifiedOnly && !srv.is_verified) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.price_from - b.price_from;
        if (sortBy === "price-desc") return b.price_from - a.price_from;
        if (sortBy === "rating") return b.rating - a.rating;
        return 0; // newest
      });
  }, [services, searchQ, selectedCategory, selectedCity, priceRange, verifiedOnly, sortBy]);

  const paginatedServices = React.useMemo(() => {
    return filteredServices.slice(0, visibleCount);
  }, [filteredServices, visibleCount]);

  // Count items per category
  const getCategoryCount = (catId: string) => {
    if (catId === "ALL") return services.length;
    return services.filter((s) => s.category === catId).length;
  };

  // ─── EXACT MATCH SIDEBAR JSX ───────────────────────────────────────────────
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
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> {isKa ? "გასუფთავება" : "Clear"}
          </button>
        )}
      </div>

      {/* 1. Search */}
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
              updateQueryParams({ q: e.target.value });
              setOpenSections((prev) => ({ ...prev, search: true }));
            }}
            placeholder={isKa ? "გასხვლა, ლანდშაფტი, ოსტატი..." : "Pruning, Landscape, Expert..."}
            className="w-full pl-9 pr-4 py-2.5 rounded-[12px] border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {searchQ && (
            <button
              type="button"
              onClick={() => {
                setSearchQ("");
                updateQueryParams({ q: null });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </FilterSection>

      {/* 2. Location Combobox */}
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
              updateQueryParams({ city: cityName });
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

      {/* 3. Service Categories */}
      <FilterSection
        title={isKa ? "სერვისის კატეგორია" : "Service Category"}
        isOpen={openSections.category}
        onToggle={() => toggleSection("category")}
        badgeCount={selectedCategory !== "ALL" ? 1 : 0}
      >
        <div className="space-y-1">
          {SERVICE_CATEGORIES.map((cat) => {
            const IconComp = CATEGORY_ICON_MAP[cat.iconName] || Wrench;
            const isSelected = selectedCategory === cat.id;
            const count = getCategoryCount(cat.id);

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-[10px] text-xs sm:text-sm transition-all text-left cursor-pointer ${
                  isSelected
                    ? "bg-primary text-white font-bold shadow-xs"
                    : "text-foreground hover:bg-surface-container font-medium"
                }`}
              >
                <div className="flex items-center gap-2">
                  <IconComp className={`w-4 h-4 ${isSelected ? "text-white" : "text-emerald-600"}`} />
                  <span>{isKa ? cat.labelKa : cat.labelEn}</span>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-secondary-container text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* 4. Price Range (₾) */}
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
                  const val = Number(e.target.value);
                  setPriceRange([val, priceRange[1]]);
                  updateQueryParams({ minPrice: val > 0 ? String(val) : null });
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
                  const val = Number(e.target.value);
                  setPriceRange([priceRange[0], val]);
                  updateQueryParams({ maxPrice: val < 500 ? String(val) : null });
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
            {[[0, 30], [0, 50], [0, 100], [0, 200], [0, 500]].map(([min, max]) => (
              <button
                key={`${min}-${max}`}
                type="button"
                onClick={() => {
                  setPriceRange([min, max]);
                  updateQueryParams({ minPrice: min > 0 ? String(min) : null, maxPrice: max < 500 ? String(max) : null });
                  setOpenSections((prev) => ({ ...prev, price: true }));
                }}
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

      {/* 5. Verified Specialists */}
      <FilterSection
        title={isKa ? "ნდობა & სტატუსი" : "Trust & Verification"}
        isOpen={openSections.verified}
        onToggle={() => toggleSection("verified")}
        badgeCount={verifiedOnly ? 1 : 0}
      >
        <button
          type="button"
          onClick={() => {
            const nextVal = !verifiedOnly;
            setVerifiedOnly(nextVal);
            updateQueryParams({ verified: nextVal ? "true" : null });
          }}
          className={`w-full flex items-center justify-between p-3 rounded-[14px] border transition-all cursor-pointer ${
            verifiedOnly
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 font-bold"
              : "bg-card border-border/70 text-foreground hover:bg-surface-container"
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-4 h-4 ${verifiedOnly ? "text-emerald-600" : "text-muted-foreground"}`} />
            <span className="text-xs font-bold">
              {isKa ? "მხოლოდ ვერიფიცირებული" : "Verified Only"}
            </span>
          </div>
          <div
            className={`w-4 h-4 rounded-[5px] border flex items-center justify-center ${
              verifiedOnly ? "bg-emerald-600 border-emerald-600 text-white" : "border-border/80"
            }`}
          >
            {verifiedOnly && <Check className="w-3 h-3" />}
          </div>
        </button>
      </FilterSection>
    </div>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl space-y-6 pb-28 sm:pb-12">
      {/* Horizontal Scroll Category Slider with Nav Arrows & "ყველა" Button */}
      <div className="relative group/cats">
        <div className="flex items-center justify-between gap-2">
          {/* Left Scroll Arrow */}
          <button
            type="button"
            onClick={() => scrollCategories("left")}
            className="hidden sm:flex h-9 w-9 rounded-full border border-border/80 bg-card hover:bg-surface-container items-center justify-center text-foreground transition-all shadow-2xs hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
            title={isKa ? "მარცხნივ" : "Scroll Left"}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Scrollable Track */}
          <div
            ref={categoryScrollRef}
            className="flex items-center gap-2 overflow-x-auto scroll-smooth no-scrollbar py-1 flex-1 px-0.5"
          >
            {/* 1. All Services Pill */}
            <button
              type="button"
              onClick={() => handleCategorySelect("ALL")}
              className={`px-4 py-2.5 rounded-[14px] text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                selectedCategory === "ALL"
                  ? "bg-primary text-white border-primary shadow-xs scale-102"
                  : "bg-card hover:bg-surface-container text-foreground border-border/80"
              }`}
            >
              <Wrench className={`w-3.5 h-3.5 ${selectedCategory === "ALL" ? "text-white" : "text-primary"}`} />
              <span>{isKa ? "ყველა სერვისი" : "All Services"}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  selectedCategory === "ALL" ? "bg-white/20 text-white" : "bg-secondary-container text-muted-foreground"
                }`}
              >
                {services.length}
              </span>
            </button>

            {/* Categories */}
            {SERVICE_CATEGORIES.map((cat) => {
              const IconComp = CATEGORY_ICON_MAP[cat.iconName] || Wrench;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`px-4 py-2.5 rounded-[14px] text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                    isSelected
                      ? "bg-primary text-white border-primary shadow-xs scale-102"
                      : "bg-card hover:bg-surface-container text-foreground border-border/80"
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-emerald-600"}`} />
                  <span>{isKa ? cat.labelKa : cat.labelEn}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isSelected ? "bg-white/20 text-white" : "bg-secondary-container text-muted-foreground"
                    }`}
                  >
                    {getCategoryCount(cat.id)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Scroll Arrow */}
          <button
            type="button"
            onClick={() => scrollCategories("right")}
            className="hidden sm:flex h-9 w-9 rounded-full border border-border/80 bg-card hover:bg-surface-container items-center justify-center text-foreground transition-all shadow-2xs hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
            title={isKa ? "მარჯვნივ" : "Scroll Right"}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Main Catalog Grid (Sidebar + Results) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Desktop Sticky Sidebar (3 cols) */}
        <div className="hidden lg:block lg:col-span-3 sticky top-24 space-y-6">
          <div className="rounded-[22px] border border-border/80 bg-card p-4 sm:p-5 shadow-2xs">
            {SidebarContent}
          </div>
        </div>

        {/* Results Area (9 cols) */}
        <div className="lg:col-span-9 space-y-5">
          {/* Active Filter Chips Strip */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-[16px] bg-secondary-container/40 border border-border/60">
              <span className="text-[11px] font-black text-muted-foreground uppercase mr-1">
                {isKa ? "აქტიური ფილტრები:" : "Active Filters:"}
              </span>

              {searchQ && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                  <span>ძებნა: "{searchQ}"</span>
                  <button onClick={() => { setSearchQ(""); updateQueryParams({ q: null }); }} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              )}

              {selectedCategory !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                  <span>{SERVICE_CATEGORIES.find((c) => c.id === selectedCategory)?.[isKa ? "labelKa" : "labelEn"]}</span>
                  <button onClick={() => handleCategorySelect("ALL")} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              )}

              {selectedCity && selectedCity !== "მთელი საქართველო" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                  <span>{selectedCity}</span>
                  <button onClick={() => { setSelectedCity("მთელი საქართველო"); updateQueryParams({ city: null }); }} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              )}

              {(priceRange[0] > 0 || priceRange[1] < 500) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                  <span>{priceRange[0]}₾ – {priceRange[1]}₾</span>
                  <button onClick={() => { setPriceRange([0, 500]); updateQueryParams({ minPrice: null, maxPrice: null }); }} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              )}

              {verifiedOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  <span>{isKa ? "ვერიფიცირებული" : "Verified"}</span>
                  <button onClick={() => { setVerifiedOnly(false); updateQueryParams({ verified: null }); }} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              )}

              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors ml-auto cursor-pointer"
              >
                {isKa ? "ყველას გასუფთავება" : "Clear All"}
              </button>
            </div>
          )}

          {/* Controls Bar: Sort Pills (Left) + Mobile Filter & Page Size & Grid/List (Right) */}
          <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
            {/* Left: Sort Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 w-full sm:w-auto">
              {[
                { id: "newest", labelKa: "უახლესი", labelEn: "Newest", isActive: sortBy === "newest" },
                { id: "rating", labelKa: "პოპულარული", labelEn: "Popular", isActive: sortBy === "rating" },
                {
                  id: "price",
                  labelKa: sortBy === "price-desc" ? "ფასი ↓" : sortBy === "price-asc" ? "ფასი ↑" : "ფასი ⇅",
                  labelEn: sortBy === "price-desc" ? "Price ↓" : sortBy === "price-asc" ? "Price ↑" : "Price ⇅",
                  isActive: sortBy === "price-asc" || sortBy === "price-desc",
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSortClick(opt.id)}
                  className={`shrink-0 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    opt.isActive
                      ? "bg-primary text-white shadow-xs scale-[1.02]"
                      : "bg-card border border-border/70 text-foreground hover:bg-surface-container hover:border-primary/40"
                  }`}
                >
                  {isKa ? opt.labelKa : opt.labelEn}
                </button>
              ))}
            </div>

            {/* Right: Mobile Filter Button (lg:hidden) + Page Size & View Mode */}
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              {/* Mobile Filter Toggle */}
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-1.5 h-8.5 px-3 rounded-xl border border-border/70 bg-card text-xs font-bold text-foreground shadow-2xs hover:bg-surface-container transition-all cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                <span>{isKa ? "ფილტრები" : "Filters"}</span>
                {activeFilterCount > 0 && (
                  <span className="w-4.5 h-4.5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Page Size Selector */}
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

              {/* View Mode Toggle */}
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

          {/* Cards Grid / List Output */}
          {filteredServices.length === 0 ? (
            <div className="py-20 rounded-[28px] border border-dashed border-border/80 bg-card/60 text-center space-y-4">
              <Sprout className="w-12 h-12 text-muted-foreground/40 mx-auto" />
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                {isKa ? "სერვისები ვერ მოიძებნა" : "No services found"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {isKa
                  ? "სცადეთ შეცვალოთ ფილტრის პარამეტრები ან ლოკაცია."
                  : "Try modifying your filter options or selecting a different city."}
              </p>
              <Button
                type="button"
                onClick={handleResetFilters}
                className="rounded-[12px] bg-primary text-white text-xs font-bold h-9 px-4 cursor-pointer"
              >
                {isKa ? "ფილტრების გასუფთავება" : "Reset Filters"}
              </Button>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                  : "flex flex-col gap-4"
              }
            >
              {paginatedServices.map((service) => (
                <ServiceCard key={service.id} service={service} variant={viewMode === "grid" ? "compact" : "list"} />
              ))}
            </div>
          )}

          {/* Load More Button */}
          {filteredServices.length > visibleCount && (
            <div className="flex flex-col items-center justify-center pt-8 pb-4 space-y-2">
              <Button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + pageSize)}
                className="h-11 px-8 rounded-[16px] bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm font-bold shadow-ambient gap-2 hover:scale-[1.02] transition-all cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
                <span>{isKa ? "მეტის ნახვა" : "Load More"}</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-[6px] text-xs font-mono">
                  +{Math.min(pageSize, filteredServices.length - visibleCount)}
                </span>
              </Button>
              <p className="text-xs text-muted-foreground font-medium">
                {isKa
                  ? `ნაჩვენებია ${Math.min(visibleCount, filteredServices.length)} / ${filteredServices.length}-დან`
                  : `Showing ${Math.min(visibleCount, filteredServices.length)} of ${filteredServices.length}`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sticky Floating Filter Trigger */}
      <div className="fixed bottom-6 right-6 lg:hidden z-40">
        <Button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="rounded-full h-12 px-5 bg-primary hover:bg-primary/90 text-white font-black text-xs shadow-ambient flex items-center gap-2 cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>{isKa ? "ფილტრები" : "Filters"}</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-white text-primary text-[10px] font-black flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Mobile Filter Sheet Drawer (Exact Match with Listings) */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden animate-in fade-in">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative w-full max-h-[85vh] overflow-y-auto rounded-t-[28px] bg-card border-t border-border p-5 space-y-4 shadow-ambient">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                {isKa ? "ფილტრები" : "Filters"}
              </h3>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="h-8 w-8 rounded-full bg-surface-container flex items-center justify-center text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {SidebarContent}

            <div className="pt-3 border-t border-border/60 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetFilters}
                className="flex-1 rounded-[12px] text-xs font-bold"
              >
                {isKa ? "გასუფთავება" : "Clear"}
              </Button>
              <Button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="flex-1 rounded-[12px] bg-primary text-white text-xs font-black"
              >
                {isKa ? `შედეგების ჩვენება (${filteredServices.length})` : `Show Results (${filteredServices.length})`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GardeningServicesCatalogPage() {
  const locale = useLocale();
  const isKa = locale !== "en";
  return (
    <React.Suspense
      fallback={
        <div className="container mx-auto px-4 py-24 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="font-bold">{isKa ? "იტვირთება სერვისების კატალოგი..." : "Loading services..."}</span>
        </div>
      }
    >
      <GardeningServicesCatalogContent />
    </React.Suspense>
  );
}
