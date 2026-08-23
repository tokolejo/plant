"use client";

import * as React from "react";
import { useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { LocationSearchCombobox } from "@/components/common/LocationSearchCombobox";
import { 
  Search, 
  Sprout, 
  Sparkles, 
  TrendingUp, 
  Gift,
  RefreshCw
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
    <section className="relative py-10 sm:py-14 lg:py-16 border-b border-border/60 bg-gradient-to-b from-surface-cream/70 via-surface-cream/30 to-background" style={{ overflow: 'visible' }}>
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">

        {/* 🌟 1. Confident, Clean & Modern Headline */}
        <div className="text-center mb-8 sm:mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20 shadow-2xs">
            <Sprout className="w-3.5 h-3.5" />
            <span>{isKa ? "საქართველოს პირველი ბოტანიკური ჰაბი" : "Georgia's First Botanical Hub"}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-[1.15]">
            {isKa ? (
              <>
                აღმოაჩინეთ, შეიძინეთ და{" "}
                <span className="text-primary dark:text-emerald-400">
                  გაცვალეთ მცენარეები
                </span>
              </>
            ) : (
              <>
                Discover, Buy, and{" "}
                <span className="text-primary dark:text-emerald-400">
                  Swap Plants
                </span>
              </>
            )}
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
            {isKa
              ? "ოთახისა და ეზოს მცენარეები, იშვიათი კალმები, ქოთნები და მოვლის აქსესუარები პირდაპირ მებაღეებისგან."
              : "Houseplants, rare cuttings, pots, and botanical care supplies directly from local growers."}
          </p>
        </div>

        {/* 🔍 2. Modern, Spacious Search Box */}
        <div className="relative max-w-3xl mx-auto z-20" style={{ overflow: 'visible' }}>
          <form
            onSubmit={handleSearch}
            className="w-full rounded-[24px] border border-border/80 bg-card p-2 sm:p-2.5 shadow-ambient flex flex-col sm:flex-row gap-2 transition-all focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15"
            style={{ overflow: 'visible' }}
          >
            {/* Location Combobox */}
            <div className="border-b sm:border-b-0 sm:border-r border-border/60 shrink-0 sm:min-w-[220px] sm:max-w-[260px] overflow-visible">
              <LocationSearchCombobox
                selectedCity={selectedCity}
                onCityChange={(city) => {
                  setSelectedCity(city);
                }}
              />
            </div>

            {/* Keyword Input */}
            <div className="flex flex-1 items-center gap-2.5 px-3 py-2">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isKa ? "მოძებნე: Monstera, ფიკუსი, ქოთანი, სუბსტრატი..." : "Search: Monstera, Ficus, Pot, Soil..."}
                className="w-full bg-transparent text-sm sm:text-base font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>

            {/* Search Button */}
            <Button
              type="submit"
              className="rounded-[18px] bg-primary hover:bg-primary/90 text-white font-bold text-sm h-11 sm:h-12 px-7 shadow-xs shrink-0 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <Search className="w-4 h-4 mr-1.5" />
              <span>{isKa ? "ძიება" : "Search"}</span>
            </Button>
          </form>
        </div>

        {/* 🏷️ 3. Quick-Access Category / Tag Shortcuts */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-5 text-xs">
          <span className="flex items-center gap-1 font-bold text-muted-foreground mr-1 text-xs">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
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
              className="rounded-full bg-card hover:bg-surface-container px-3 py-1.5 text-xs font-semibold text-foreground transition-all border border-border/70 cursor-pointer shadow-2xs hover:border-primary/40 hover:text-primary active:scale-95"
            >
              #{item.label}
            </button>
          ))}
        </div>

      </div>
    </section>
  );
}
