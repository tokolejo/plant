"use client";

import * as React from "react";
import { useRouter } from "@/i18n/routing";
import { LocationSearchCombobox } from "@/components/common/LocationSearchCombobox";
import { useSubscriptionPlans } from "@/lib/plans-store";
import { 
  Search, 
  Sprout, 
  Shuffle, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCity, setSelectedCity] = React.useState("მთელი საქართველო");

  const plans = useSubscriptionPlans();
  const freePlan = plans.find((p) => p.id === "FREE") || { listingLimit: 5 };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (searchTerm.trim()) query.set("q", searchTerm.trim());
    if (selectedCity && selectedCity !== "მთელი საქართველო") {
      query.set("city", selectedCity);
    }
    router.push(`/listings?${query.toString()}`);
  };

  return (
    <section className="relative pt-6 pb-8 border-b border-border/60 bg-surface-cream/50" style={{ overflow: 'visible' }}>
      <div className="container mx-auto px-4 sm:px-6">

        {/* Hero Heading + Sub */}
        <div className="text-center mb-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-secondary-container/80 px-3.5 py-1 text-xs font-bold text-primary dark:text-primary-fixed mb-4 shadow-ambient">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>ბოტანიკური მარკეტპლეისი & გაცვლის პლატფორმა</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.15] mb-3">
            იყიდე, გაყიდე და{" "}
            <span className="text-primary font-black">
              გაცვალე მცენარეები
            </span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
            იშვიათი მონსტერები, ოთახის ყვავილები, კერამიკული ქოთნები, სუბსტრატები და ხელსაწყოები მთელი საქართველოს მასშტაბით.
          </p>
        </div>

        {/* Search Box */}
        <div className="relative max-w-3xl mx-auto" style={{ zIndex: 9998 }}>
          <form
            onSubmit={handleSearch}
            className="w-full rounded-[20px] border border-border/80 bg-card p-2.5 shadow-ambient-lg flex flex-col sm:flex-row gap-2 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
            style={{ overflow: 'visible' }}
          >
            {/* Location Combobox */}
            <div className="border-b sm:border-b-0 sm:border-r border-border/60 shrink-0 sm:min-w-[220px] sm:max-w-[240px] overflow-visible">
              <LocationSearchCombobox
                selectedCity={selectedCity}
                onCityChange={(city) => {
                  setSelectedCity(city);
                }}
              />
            </div>

            {/* Keyword Input */}
            <div className="flex flex-1 items-center gap-2.5 px-3 py-1">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="მოძებნე: Monstera, Philodendron, ქოთანი..."
                className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="rounded-[16px] bg-primary hover:bg-primary-container text-white font-bold text-sm h-12 px-8 shadow-ambient"
            >
              ძიება
            </Button>
          </form>
        </div>

        {/* Popular Tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-bold text-primary dark:text-primary-fixed">
            <TrendingUp className="w-3.5 h-3.5" /> პოპულარული:
          </span>
          {["Monstera Thai", "Philodendron", "ფიკუსი", "ორქიდეა", "ქოთნები"].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setSearchTerm(tag);
                router.push(`/listings?q=${encodeURIComponent(tag)}`);
              }}
              className="rounded-[10px] bg-secondary-container/70 px-2.5 py-1 font-medium hover:bg-secondary-container hover:text-primary transition-colors text-foreground text-xs"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Feature Highlights Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-border/50">
          <div className="rounded-[18px] border border-border/60 bg-card p-3.5 flex items-center gap-3 shadow-ambient">
            <div className="h-9 w-9 rounded-[12px] bg-secondary-container text-primary flex items-center justify-center font-bold text-xs shrink-0">
              0 ₾
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{freePlan.listingLimit} უფასო</p>
              <p className="text-[10px] text-muted-foreground truncate">განცხადება ყოველთვის 0 ₾</p>
            </div>
          </div>

          <div className="rounded-[18px] border border-border/60 bg-card p-3.5 flex items-center gap-3 shadow-ambient">
            <div className="h-9 w-9 rounded-[12px] bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Shuffle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">ISO Match</p>
              <p className="text-[10px] text-muted-foreground truncate">მცენარეების გაცვლის დაფა</p>
            </div>
          </div>

          <div className="rounded-[18px] border border-border/60 bg-card p-3.5 flex items-center gap-3 shadow-ambient">
            <div className="h-9 w-9 rounded-[12px] bg-secondary-container text-primary flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">3 მიწოდება</p>
              <p className="text-[10px] text-muted-foreground truncate">ადგილზე, კურიერი, სამარშრუტო</p>
            </div>
          </div>

          <div className="rounded-[18px] border border-border/60 bg-card p-3.5 flex items-center gap-3 shadow-ambient">
            <div className="h-9 w-9 rounded-[12px] bg-secondary-container text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">100% Verified</p>
              <p className="text-[10px] text-muted-foreground truncate">სანდო მაღაზიები და ორანჟერეები</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
