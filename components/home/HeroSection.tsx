"use client";

import * as React from "react";
import { useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { LocationSearchCombobox } from "@/components/common/LocationSearchCombobox";
import { 
  Search, 
  Sprout, 
  TrendingUp, 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const router = useRouter();
  const locale = useLocale();
  const isKa = locale !== "en";

  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCity, setSelectedCity] = React.useState("მთელი საქართველო");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (searchTerm.trim()) query.set("q", searchTerm.trim());
    if (selectedCity && selectedCity !== "მთელი საქართველო") {
      query.set("city", selectedCity);
    }
    router.push(`/listings?${query.toString()}`);
  };

  const trendingTags = [
    { label: "Monstera Albo", query: "Monstera Albo" },
    { label: "Philodendron", query: "Philodendron" },
    { label: "Ficus Lyrata", query: "Ficus Lyrata" },
    { label: isKa ? "🎁 გაჩუქება" : "🎁 Giveaway", query: "GIFT", isFilter: true },
    { label: isKa ? "🔄 გაცვლა" : "🔄 Swap", query: "TRADE", isFilter: true },
    { label: isKa ? "კერამიკული ქოთანი" : "Ceramic Pot", query: "ქოთანი" },
    { label: isKa ? "სუკულენტები" : "Succulents", query: "სუქულენტი" },
    { label: isKa ? "ორქიდეა" : "Orchid", query: "ორქიდეა" },
  ];

  return (
    <section className="relative py-6 sm:py-8 border-b border-border/60 bg-surface-cream/30" style={{ overflow: 'visible' }}>
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">

        {/* 🌟 1. Compact Airbnb-Style Header */}
        <div className="text-center mb-5 sm:mb-6 space-y-1.5">
          <h1 className="text-xl sm:text-2xl lg:text-[26px] font-black tracking-tight text-foreground leading-snug">
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

          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            {isKa
              ? "საქართველოს პირველი სპეციალიზებული ბოტანიკური მარკეტპლეისი"
              : "Georgia's First Dedicated Botanical Marketplace"}
          </p>
        </div>

        {/* 🔍 2. Airbnb Floating Capsule Search Bar */}
        <div className="relative max-w-2xl mx-auto z-20" style={{ overflow: 'visible' }}>
          <form
            onSubmit={handleSearch}
            className="w-full rounded-full border border-border/80 bg-card p-1.5 sm:p-2 shadow-ambient hover:shadow-ambient-lg flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 transition-all focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15"
            style={{ overflow: 'visible' }}
          >
            {/* Location Selector */}
            <div className="w-full sm:w-auto border-b sm:border-b-0 sm:border-r border-border/60 shrink-0 sm:min-w-[200px] sm:max-w-[230px] overflow-visible pl-1">
              <LocationSearchCombobox
                selectedCity={selectedCity}
                onCityChange={(city) => {
                  setSelectedCity(city);
                }}
              />
            </div>

            {/* Keyword Input */}
            <div className="flex flex-1 w-full items-center gap-2 px-3 py-1">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isKa ? "მოძებნე: Monstera, ფიკუსი, ქოთანი..." : "Search: Monstera, Ficus, Pot..."}
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>

            {/* Airbnb-Style Rounded Search Button */}
            <Button
              type="submit"
              className="w-full sm:w-auto rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm h-10 px-5 shadow-xs shrink-0 cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <Search className="w-3.5 h-3.5 mr-1" />
              <span>{isKa ? "ძიება" : "Search"}</span>
            </Button>
          </form>
        </div>

        {/* 🏷️ 3. Clean Category / Filter Shortcuts */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-4 text-xs">
          <span className="flex items-center gap-1 font-bold text-muted-foreground text-[11px] mr-0.5">
            <TrendingUp className="w-3 h-3 text-primary" />
            <span>{isKa ? "პოპულარული:" : "Popular:"}</span>
          </span>
          {trendingTags.map((item, idx) => (
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
              className="rounded-full bg-card hover:bg-surface-container px-2.5 py-1 text-[11px] font-semibold text-foreground transition-all border border-border/70 cursor-pointer shadow-2xs hover:border-primary/40 hover:text-primary active:scale-95"
            >
              #{item.label}
            </button>
          ))}
        </div>

      </div>
    </section>
  );
}
