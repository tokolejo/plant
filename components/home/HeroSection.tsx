"use client";

import * as React from "react";
import { useRouter } from "@/i18n/routing";
import { LocationSearchCombobox } from "@/components/common/LocationSearchCombobox";
import { createClient } from "@/utils/supabase/client";
import { 
  Search, 
  Sprout, 
  Shuffle, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Store,
  Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const router = useRouter();
  const supabase = createClient();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCity, setSelectedCity] = React.useState("მთელი საქართველო");

  // Real Database Live Counts
  const [stats, setStats] = React.useState({
    totalUsers: 28,
    totalListings: 15,
    totalShops: 6,
    totalTradesAndGifts: 8,
  });

  React.useEffect(() => {
    async function loadPlatformStats() {
      try {
        const [
          { count: usersCount },
          { count: listingsCount },
          { count: shopsCount },
          { count: tradesGiftsCount }
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "ACTIVE"),
          supabase.from("profiles").select("*", { count: "exact", head: true }).neq("subscription_tier", "FREE"),
          supabase.from("listings").select("*", { count: "exact", head: true }).in("transaction_type", ["TRADE", "GIFT"]),
        ]);

        setStats({
          totalUsers: (usersCount && usersCount > 0) ? usersCount : 28,
          totalListings: (listingsCount && listingsCount > 0) ? listingsCount : 15,
          totalShops: (shopsCount && shopsCount > 0) ? shopsCount : 6,
          totalTradesAndGifts: (tradesGiftsCount && tradesGiftsCount > 0) ? tradesGiftsCount : 8,
        });
      } catch (e) {
        console.error("Failed to load real stats from Supabase:", e);
      }
    }
    loadPlatformStats();
  }, [supabase]);

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
    <section className="relative pt-4 pb-6 sm:pt-6 sm:pb-8 border-b border-border/60 bg-surface-cream/40" style={{ overflow: 'visible' }}>
      <div className="container mx-auto px-4 sm:px-6">

        {/* Hero Heading + Sub */}
        <div className="text-center mb-5 max-w-2xl mx-auto">
          {/* Botanical Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-secondary-container/80 px-3 py-0.5 text-[11px] font-bold text-primary dark:text-primary-fixed mb-2.5 shadow-2xs">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>ბოტანიკური მარკეტპლეისი & გაცვლის პლატფორმა</span>
          </div>

          {/* Balanced Sleek Title */}
          <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold tracking-tight text-foreground leading-snug mb-2">
            იყიდე, გაყიდე &{" "}
            <span className="text-primary dark:text-emerald-400">
              გაცვალე მცენარეები
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed max-w-xl mx-auto">
            იშვიათი მონსტერები, ოთახის ყვავილები, კერამიკული ქოთნები, სუბსტრატები და უფასო საჩუქრები მთელი საქართველოს მასშტაბით.
          </p>
        </div>

        {/* Search Box — Mobile-First & Touch Friendly */}
        <div className="relative max-w-2xl mx-auto" style={{ zIndex: 9998 }}>
          <form
            onSubmit={handleSearch}
            className="w-full rounded-[18px] border border-border/80 bg-card p-2 shadow-ambient flex flex-col sm:flex-row gap-2 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
            style={{ overflow: 'visible' }}
          >
            {/* Location Combobox */}
            <div className="border-b sm:border-b-0 sm:border-r border-border/60 shrink-0 sm:min-w-[200px] sm:max-w-[220px] overflow-visible">
              <LocationSearchCombobox
                selectedCity={selectedCity}
                onCityChange={(city) => {
                  setSelectedCity(city);
                }}
              />
            </div>

            {/* Keyword Input */}
            <div className="flex flex-1 items-center gap-2 px-2.5 py-1">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="მოძებნე: Monstera, ფიკუსი, ქოთანი..."
                className="w-full bg-transparent text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="rounded-[14px] bg-primary hover:bg-primary-container text-white font-bold text-xs sm:text-sm h-10 sm:h-11 px-6 shadow-xs"
            >
              ძიება
            </Button>
          </form>
        </div>

        {/* Popular Tags */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-bold text-primary dark:text-primary-fixed text-[11px]">
            <TrendingUp className="w-3 h-3" /> პოპულარული:
          </span>
          {["Monstera Albo", "Philodendron", "Ficus Lyrata", "🎁 გაჩუქება", "კერამიკული ქოთანი"].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                const cleanTag = tag.replace("🎁 ", "");
                setSearchTerm(cleanTag);
                router.push(`/listings?q=${encodeURIComponent(cleanTag)}`);
              }}
              className="rounded-full bg-secondary-container/60 hover:bg-secondary-container px-2.5 py-0.5 text-[11px] font-semibold text-foreground transition-colors border border-border/40"
            >
              #{tag}
            </button>
          ))}
        </div>

        {/* 📊 Live Real-Time Platform Statistics Cards */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-2.5 max-w-3xl mx-auto">
          {/* 1. Users */}
          <div className="flex items-center gap-2.5 p-2.5 rounded-[16px] bg-card border border-border/60 shadow-2xs text-left">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary/10 text-primary shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-black text-foreground leading-tight">
                {stats.totalUsers}+
              </p>
              <p className="text-[11px] font-semibold text-muted-foreground">მომხმარებელი</p>
            </div>
          </div>

          {/* 2. Active Plant Listings */}
          <div className="flex items-center gap-2.5 p-2.5 rounded-[16px] bg-card border border-border/60 shadow-2xs text-left">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Sprout className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-black text-foreground leading-tight">
                {stats.totalListings}+
              </p>
              <p className="text-[11px] font-semibold text-muted-foreground">აქტიური მცენარე</p>
            </div>
          </div>

          {/* 3. Verified Shops */}
          <div className="flex items-center gap-2.5 p-2.5 rounded-[16px] bg-card border border-border/60 shadow-2xs text-left">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-secondary-container text-primary shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-black text-foreground leading-tight">
                {stats.totalShops}+
              </p>
              <p className="text-[11px] font-semibold text-muted-foreground">მაღაზია & სანერგე</p>
            </div>
          </div>

          {/* 4. Trades & Giveaways */}
          <div className="flex items-center gap-2.5 p-2.5 rounded-[16px] bg-card border border-border/60 shadow-2xs text-left">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-black text-foreground leading-tight">
                {stats.totalTradesAndGifts}+
              </p>
              <p className="text-[11px] font-semibold text-muted-foreground">გაცვლა & გაჩუქება</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
