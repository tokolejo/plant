"use client";

import * as React from "react";
import { useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { LocationSearchCombobox } from "@/components/common/LocationSearchCombobox";
import { 
  Search, 
  Sprout, 
  TrendingUp, 
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const router = useRouter();
  const locale = useLocale();
  const isKa = locale !== "en";

  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCity, setSelectedCity] = React.useState("მთელი საქართველო");
  const [expandedTags, setExpandedTags] = React.useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (searchTerm.trim()) query.set("q", searchTerm.trim());
    if (selectedCity && selectedCity !== "მთელი საქართველო") {
      query.set("city", selectedCity);
    }
    router.push(`/listings?${query.toString()}`);
  };

  const allTrendingTags = [
    { label: "Monstera Albo", query: "Monstera Albo" },
    { label: "Philodendron", query: "Philodendron" },
    { label: "Ficus Lyrata", query: "Ficus Lyrata" },
    { label: isKa ? "გაჩუქება" : "Giveaway", query: "GIFT", isFilter: true },
    { label: isKa ? "გაცვლა" : "Swap", query: "TRADE", isFilter: true },
    { label: isKa ? "კერამიკული ქოთანი" : "Ceramic Pot", query: "ქოთანი" },
    { label: isKa ? "სუკულენტები" : "Succulents", query: "სუქულენტი" },
    { label: isKa ? "ორქიდეა" : "Orchid", query: "ორქიდეა" },
    { label: isKa ? "ალოკაზია" : "Alocasia", query: "ალოკაზია" },
    { label: isKa ? "სანსევიერია" : "Sansevieria", query: "სანსევიერია" },
    { label: isKa ? "ბონსაი" : "Bonsai", query: "ბონსაი" },
    { label: isKa ? "სუბსტრატი" : "Soil Mix", query: "სუბსტრატი" },
  ];

  const visibleTags = expandedTags ? allTrendingTags : allTrendingTags.slice(0, 5);

  return (
    <section className="relative py-5 sm:py-8 border-b border-border/60 bg-surface-cream/30" style={{ overflow: 'visible' }}>
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">

        {/*  1. Compact Header */}
        <div className="text-center mb-4 sm:mb-6 space-y-1">
          <h1 className="text-lg sm:text-2xl lg:text-[26px] font-black tracking-tight text-foreground leading-snug">
            {isKa ? (
              <>
                აღმოაჩინეთ, შეიძინეთ და{" "}
                <span className="text-primary dark:text-emerald-400">
                  გაცვალეთ მცენარეები
                </span>
              </>
            ) : (
              <>
                Discover, Buy &{" "}
                <span className="text-primary dark:text-emerald-400">
                  Swap Plants
                </span>
              </>
            )}
          </h1>

          <p className="text-[11px] sm:text-sm text-muted-foreground font-semibold flex items-center justify-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>
              {isKa
                ? "საიტი მუშაობს სატესტო (Beta) რეჟიმში"
                : "The website is currently operating in Test (Beta) mode"}
            </span>
          </p>
        </div>

        {/*  2. Sleek Search Box — Clean Modern Card on Mobile, Pill Capsule on Desktop */}
        <div className="relative max-w-2xl mx-auto z-20" style={{ overflow: 'visible' }}>
          <form
            onSubmit={handleSearch}
            className="w-full rounded-[16px] sm:rounded-full border border-border/80 bg-card p-2 sm:p-2 shadow-ambient hover:shadow-ambient-lg flex flex-col sm:flex-row items-center gap-2 sm:gap-2 transition-all focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15"
            style={{ overflow: 'visible' }}
          >
            {/* Location Selector */}
            <div className="w-full sm:w-auto border-b sm:border-b-0 sm:border-r border-border/60 shrink-0 sm:min-w-[200px] sm:max-w-[230px] overflow-visible pb-1 sm:pb-0 sm:pl-1">
              <LocationSearchCombobox
                selectedCity={selectedCity}
                onCityChange={(city) => {
                  setSelectedCity(city);
                }}
              />
            </div>

            {/* Keyword Input */}
            <div className="flex flex-1 w-full items-center gap-2 px-2 sm:px-3 py-1">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isKa ? "მოძებნე: Monstera, ფიკუსი, ქოთანი..." : "Search: Monstera, Ficus, Pot..."}
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>

            {/* Search Button */}
            <Button
              type="submit"
              className="w-full sm:w-auto rounded-[12px] sm:rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm h-10 sm:h-10 px-5 shadow-xs shrink-0 cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <Search className="w-3.5 h-3.5 mr-1" />
              <span>{isKa ? "ძიება" : "Search"}</span>
            </Button>
          </form>
        </div>

        {/* ️ 3. Clean Category / Filter Shortcuts with Icon-Only Expand/Collapse */}
        <div className="flex items-center gap-1.5 sm:gap-2 mt-3.5 text-xs overflow-x-auto sm:overflow-visible no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center">
          <span className="flex items-center gap-1 font-bold text-muted-foreground text-[11px] shrink-0 mr-0.5">
            <TrendingUp className="w-3 h-3 text-primary" />
            <span>{isKa ? "პოპულარული:" : "Popular:"}</span>
          </span>

          {visibleTags.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (item.isFilter) {
                  router.push(item.query === "TRADE" ? "/iso" : `/listings?trans=${item.query}`);
                } else {
                  setSearchTerm(item.query);
                  router.push(`/listings?q=${encodeURIComponent(item.query)}`);
                }
              }}
              className="rounded-full bg-card hover:bg-surface-container px-2.5 py-1 text-[11px] font-semibold text-foreground transition-all border border-border/70 cursor-pointer shadow-2xs hover:border-primary/40 hover:text-primary active:scale-95 shrink-0 whitespace-nowrap"
            >
              #{item.label}
            </button>
          ))}

          {/*  Icon-Only Expand / Collapse Button */}
          <button
            type="button"
            onClick={() => setExpandedTags(!expandedTags)}
            aria-label={expandedTags ? (isKa ? "აკეცვა" : "Collapse") : (isKa ? "ჩამოშლა" : "Expand")}
            title={expandedTags ? (isKa ? "აკეცვა" : "Collapse") : (isKa ? "ჩამოშლა" : "Expand")}
            className="w-6.5 h-6.5 rounded-full bg-card hover:bg-surface-container border border-border/80 hover:border-primary/40 text-muted-foreground hover:text-primary flex items-center justify-center transition-all shadow-2xs shrink-0 cursor-pointer active:scale-95"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedTags ? "rotate-180 text-primary" : ""}`} />
          </button>
        </div>

      </div>
    </section>
  );
}
