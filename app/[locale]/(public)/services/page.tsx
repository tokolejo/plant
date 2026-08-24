"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePathname } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { ServiceCard } from "@/components/services/ServiceCard";
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
  Search,
  Check,
  RotateCcw,
  LayoutGrid,
  List,
  MapPin,
  Star,
  ShieldCheck,
  Plus,
  ArrowDownUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/routing";

const GEORGIA_CITIES = [
  "ყველა ქალაქი",
  "თბილისი",
  "ბათუმი",
  "ქუთაისი",
  "რუსთავი",
  "მცხეთა",
  "გორი",
  "თელავი",
  "ზუგდიდი",
  "ფოთი",
  "კახეთი",
  "მთელი საქართველო",
];

const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  TreePine,
  Sparkles,
  Layers,
  Building2,
  Droplets,
  Stethoscope,
  Sprout,
};

export default function GardeningServicesCatalogPage() {
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
  const [searchQuery, setSearchQuery] = React.useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = React.useState<string>(searchParams.get("category") || "ALL");
  const [selectedCity, setSelectedCity] = React.useState<string>(searchParams.get("city") || "ყველა ქალაქი");
  const [minPrice, setMinPrice] = React.useState<string>(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = React.useState<string>(searchParams.get("maxPrice") || "");
  const [verifiedOnly, setVerifiedOnly] = React.useState<boolean>(searchParams.get("verified") === "true");
  const [sortBy, setSortBy] = React.useState<string>(searchParams.get("sort") || "newest");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  // Mobile Filter Drawer State
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  // Fetch Services from Supabase (merging with mock services)
  React.useEffect(() => {
    async function loadServices() {
      try {
        const { data, error } = await supabase
          .from("gardening_services")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          // Merge database items with mock seed items
          const dbItems: GardeningServiceItem[] = data.map((d: any) => ({
            id: d.id,
            provider_id: d.provider_id,
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

          // Avoid duplicates by ID
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
        if (!val || val === "ALL" || val === "ყველა ქალაქი" || val === "false") {
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

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    updateQueryParams({ city });
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("ALL");
    setSelectedCity("ყველა ქალაქი");
    setMinPrice("");
    setMaxPrice("");
    setVerifiedOnly(false);
    setSortBy("newest");
    router.replace(pathname, { scroll: false });
  };

  // Filter & Sort Logic
  const filteredServices = React.useMemo(() => {
    return services
      .filter((srv) => {
        // 1. Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
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
        if (selectedCity !== "ყველა ქალაქი") {
          if (!srv.city.toLowerCase().includes(selectedCity.toLowerCase())) {
            return false;
          }
        }

        // 4. Min Price
        if (minPrice) {
          const min = parseFloat(minPrice);
          if (!isNaN(min) && srv.price_from < min) return false;
        }

        // 5. Max Price
        if (maxPrice) {
          const max = parseFloat(maxPrice);
          if (!isNaN(max) && srv.price_from > max) return false;
        }

        // 6. Verified Specialist Only
        if (verifiedOnly && !srv.is_verified) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") return a.price_from - b.price_from;
        if (sortBy === "price_desc") return b.price_from - a.price_from;
        if (sortBy === "rating") return b.rating - a.rating;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [services, searchQuery, selectedCategory, selectedCity, minPrice, maxPrice, verifiedOnly, sortBy]);

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCategory !== "ALL" ||
    selectedCity !== "ყველა ქალაქი" ||
    minPrice !== "" ||
    maxPrice !== "" ||
    verifiedOnly;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-7xl space-y-8">
      {/* 1. Header Hero Banner (Identical to Market Listings layout) */}
      <div className="rounded-[28px] bg-gradient-to-r from-emerald-600/10 via-primary/10 to-teal-500/10 border border-border/80 p-6 sm:p-8 shadow-ambient flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-xs font-black">
            <Wrench className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isKa ? "პროფესიონალური მებაღეობა & გამწვანება" : "Pro Gardening & Landscaping"}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
            {isKa ? "მებაღეობის & გამწვანების სერვისები" : "Gardening & Landscaping Services"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {isKa
              ? "იპოვეთ გამოცდილი მებაღეები, ხეების მესხვლელები, ლანდშაფტის დიზაინერები და სარწყავი სისტემების ოსტატები მთელი საქართველოს მასშტაბით."
              : "Discover verified gardening specialists, arborists, landscape designers, and irrigation contractors."}
          </p>
        </div>

        <Link href="/dashboard/services">
          <Button
            type="button"
            className="rounded-[16px] bg-primary hover:bg-primary/90 text-white font-black text-xs sm:text-sm h-12 px-6 gap-2 shadow-ambient cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isKa ? "სერვისის დამატება" : "Offer a Service"}</span>
          </Button>
        </Link>
      </div>

      {/* 2. Top Category Horizontal Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => handleCategorySelect("ALL")}
          className={`px-4 py-2.5 rounded-[16px] text-xs font-black whitespace-nowrap transition-all cursor-pointer shadow-2xs flex items-center gap-2 ${
            selectedCategory === "ALL"
              ? "bg-primary text-white shadow-ambient scale-102"
              : "bg-card text-muted-foreground hover:text-foreground border border-border/80"
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>{isKa ? "ყველა სერვისი" : "All Services"}</span>
        </button>

        {SERVICE_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const CatIcon = CATEGORY_ICON_MAP[cat.iconName] || Wrench;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategorySelect(cat.id)}
              className={`px-4 py-2.5 rounded-[16px] text-xs font-black whitespace-nowrap transition-all cursor-pointer shadow-2xs flex items-center gap-2 ${
                isSelected
                  ? "bg-emerald-600 text-white shadow-ambient scale-102"
                  : "bg-card text-muted-foreground hover:text-foreground border border-border/80"
              }`}
            >
              <CatIcon className="w-3.5 h-3.5" />
              <span>{isKa ? cat.labelKa : cat.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Main Catalog Layout: Left Sidebar + Right Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* DESKTOP FILTER SIDEBAR */}
        <aside className="hidden lg:block lg:col-span-1 rounded-[24px] border border-border/80 bg-card p-5 shadow-2xs space-y-6 sticky top-24">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <span className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              <span>{isKa ? "ფილტრები" : "Filters"}</span>
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] font-bold text-muted-foreground hover:text-destructive flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>გასუფთავება</span>
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              {isKa ? "ძიება" : "Search"}
            </label>
            <div className="relative">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isKa ? "სერვისი, ოსტატი..." : "Search..."}
                className="h-10 pl-9 pr-8 rounded-[14px] text-xs font-bold bg-background"
              />
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* City Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              {isKa ? "ქალაქი / რეგიონი" : "City / Region"}
            </label>
            <select
              value={selectedCity}
              onChange={(e) => handleCitySelect(e.target.value)}
              className="w-full h-10 px-3 rounded-[14px] border border-border/80 bg-background text-xs font-bold text-foreground outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
            >
              {GEORGIA_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              {isKa ? "საწყისი ფასი (₾)" : "Price Range (₾)"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="მინ"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  updateQueryParams({ minPrice: e.target.value });
                }}
                className="h-10 rounded-[12px] text-xs font-bold bg-background"
              />
              <Input
                type="number"
                placeholder="მაქს"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  updateQueryParams({ maxPrice: e.target.value });
                }}
                className="h-10 rounded-[12px] text-xs font-bold bg-background"
              />
            </div>
          </div>

          {/* Verified Specialists Only Toggle */}
          <div className="pt-2 border-t border-border/50">
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-foreground">
                  {isKa ? "მხოლოდ ვერიფიცირებული" : "Verified Only"}
                </span>
              </div>
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => {
                  setVerifiedOnly(e.target.checked);
                  updateQueryParams({ verified: e.target.checked ? "true" : null });
                }}
                className="h-4 w-4 rounded text-primary focus:ring-primary border-border cursor-pointer"
              />
            </label>
          </div>
        </aside>

        {/* RIGHT: CATALOG CONTENT */}
        <div className="lg:col-span-3 space-y-5">
          {/* Top Control Bar: Results count, Sort & View switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-[20px] bg-secondary-container/30 border border-border/60">
            <div className="flex items-center gap-2">
              {/* Mobile Filter Drawer Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden h-9 px-3 rounded-[12px] text-xs font-bold gap-1.5 bg-card border-border/80 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                <span>{isKa ? "ფილტრები" : "Filters"}</span>
                {hasActiveFilters && (
                  <span className="h-2 w-2 rounded-full bg-primary" />
                )}
              </Button>

              <span className="text-xs font-black text-foreground">
                {filteredServices.length} {isKa ? "სერვისი ნაპოვნია" : "Services found"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5">
                <ArrowDownUp className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    updateQueryParams({ sort: e.target.value });
                  }}
                  className="h-9 px-2.5 rounded-[12px] border border-border/80 bg-card text-xs font-bold text-foreground outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="newest">უახლესი</option>
                  <option value="rating">მაღალი რეიტინგი</option>
                  <option value="price_asc">ფასი: დაბლიდან მაღლა</option>
                  <option value="price_desc">ფასი: მაღლიდან დაბლა</option>
                </select>
              </div>

              {/* Grid / List View Mode Toggle */}
              <div className="flex items-center bg-card border border-border/80 p-0.5 rounded-[12px]">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-[9px] transition-all cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-[9px] transition-all cursor-pointer ${
                    viewMode === "list"
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Services Cards Grid / List */}
          {filteredServices.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-border/80 rounded-[24px] bg-card/40 p-8 space-y-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Wrench className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">
                  {isKa ? "სერვისები ამ ფილტრით ვერ მოიძებნა" : "No services match your filters"}
                </h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                  {isKa
                    ? "სცადეთ ფილტრების გასუფთავება ან სხვა ქალაქის / კატეგორიის არჩევა."
                    : "Try clearing your filters or selecting a different city."}
                </p>
              </div>
              <Button
                type="button"
                onClick={handleResetFilters}
                className="rounded-[14px] bg-primary hover:bg-primary/90 text-white text-xs font-black gap-2 shadow-ambient cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isKa ? "ფილტრების გასუფთავება" : "Reset Filters"}</span>
              </Button>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5"
                  : "flex flex-col gap-4"
              }
            >
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  variant={viewMode === "list" ? "list" : "compact"}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. MOBILE FILTER DRAWER MODAL */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-card border border-border/80 rounded-t-[28px] sm:rounded-[28px] max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <span className="text-sm font-black text-foreground flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                <span>{isKa ? "სერვისების ფილტრი" : "Filter Services"}</span>
              </span>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 p-1">
              {/* Category */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">კატეგორია</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  className="w-full h-10 px-3 rounded-[12px] border border-border/80 bg-background text-xs font-bold text-foreground"
                >
                  <option value="ALL">ყველა სერვისი</option>
                  {SERVICE_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.labelKa}
                    </option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">ქალაქი</label>
                <select
                  value={selectedCity}
                  onChange={(e) => handleCitySelect(e.target.value)}
                  className="w-full h-10 px-3 rounded-[12px] border border-border/80 bg-background text-xs font-bold text-foreground"
                >
                  {GEORGIA_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">ფასი (₾)</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="მინ"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="h-10 text-xs font-bold"
                  />
                  <Input
                    type="number"
                    placeholder="მაქს"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="h-10 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Verified Only */}
              <label className="flex items-center justify-between p-3 rounded-[14px] bg-secondary-container/40 border border-border/60">
                <span className="text-xs font-bold text-foreground">მხოლოდ ვერიფიცირებული ოსტატები</span>
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="h-4 w-4 rounded text-primary"
                />
              </label>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetFilters}
                className="flex-1 rounded-[12px] text-xs font-bold"
              >
                გასუფთავება
              </Button>
              <Button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="flex-1 rounded-[12px] bg-primary text-white text-xs font-black"
              >
                შედეგების ჩვენება ({filteredServices.length})
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
