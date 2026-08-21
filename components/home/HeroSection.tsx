"use client";

import * as React from "react";
import { useRouter } from "@/i18n/routing";
import { LocationSearchCombobox } from "@/components/common/LocationSearchCombobox";
import { createClient } from "@/utils/supabase/client";
import { getMergedListings } from "@/lib/listings-service";
import { 
  Search, 
  Sprout, 
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

  // Real Database Live Counts Synced with Supabase ONLY
  const [stats, setStats] = React.useState({
    totalUsers: 0,
    totalListings: 0,
    totalShops: 0,
    totalTradesAndGifts: 0,
  });

  const fetchLiveStats = React.useCallback(async () => {
    try {
      const [
        { count: usersCount },
        { count: listingsCount },
        { count: tradesGiftsCount },
        { count: shopsCount }
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "ACTIVE"),
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "ACTIVE").in("transaction_type", ["TRADE", "GIFT"]),
        supabase.from("profiles").select("*", { count: "exact", head: true }).not("custom_slug", "is", null),
      ]);

      setStats({
        totalUsers: usersCount || 0,
        totalListings: listingsCount || 0,
        totalShops: shopsCount || 0,
        totalTradesAndGifts: tradesGiftsCount || 0,
      });
    } catch (e) {
      console.error("Failed to load real stats from Supabase:", e);
    }
  }, [supabase]);

  React.useEffect(() => {
    fetchLiveStats();

    // Supabase Realtime Listener: Auto-updates stats on user register, listing add/delete/update
    const statsChannel = supabase
      .channel("realtime-stats-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listings" },
        () => {
          fetchLiveStats();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          fetchLiveStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statsChannel);
    };
  }, [fetchLiveStats, supabase]);

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
    <section className="relative py-6 sm:py-8 lg:py-10 border-b border-border/60 bg-surface-cream/40" style={{ overflow: 'visible' }}>
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">

        {/* Hero Title — Clean, Bold & Minimalist */}
        <div className="text-center mb-6 max-w-3xl mx-auto">
          <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-black tracking-tight text-foreground leading-tight">
            იყიდე, გაყიდე,{" "}
            <span className="text-primary dark:text-emerald-400">
              გაცვალე მცენარეები
            </span>
          </h1>
        </div>

        {/* 📊 1. Live Real-Time Platform Statistics (100% Real Database Data) */}
        <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
          {/* 1. Users */}
          <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-[18px] bg-card border border-border/70 shadow-2xs hover:shadow-xs transition-all text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-primary/10 text-primary shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-base sm:text-lg font-black text-foreground leading-tight">
                {stats.totalUsers}
              </p>
              <p className="text-xs font-bold text-muted-foreground">მომხმარებელი</p>
            </div>
          </div>

          {/* 2. Active Plant Listings */}
          <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-[18px] bg-card border border-border/70 shadow-2xs hover:shadow-xs transition-all text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <p className="text-base sm:text-lg font-black text-foreground leading-tight">
                {stats.totalListings}
              </p>
              <p className="text-xs font-bold text-muted-foreground">მცენარე</p>
            </div>
          </div>

          {/* 3. Trades & Giveaways */}
          <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-[18px] bg-card border border-border/70 shadow-2xs hover:shadow-xs transition-all text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <p className="text-base sm:text-lg font-black text-foreground leading-tight">
                {stats.totalTradesAndGifts}
              </p>
              <p className="text-xs font-bold text-muted-foreground">გაცვლა & გაჩუქება</p>
            </div>
          </div>

          {/* 4. Verified Shops */}
          <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-[18px] bg-card border border-border/70 shadow-2xs hover:shadow-xs transition-all text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-secondary-container text-primary shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <p className="text-base sm:text-lg font-black text-foreground leading-tight">
                {stats.totalShops}
              </p>
              <p className="text-xs font-bold text-muted-foreground">მაღაზია & სანერგე</p>
            </div>
          </div>
        </div>

        {/* 🔍 2. Search Box — Spacious, Full-Container & Touch Friendly */}
        <div className="relative max-w-4xl mx-auto z-20" style={{ overflow: 'visible' }}>
          <form
            onSubmit={handleSearch}
            className="w-full rounded-[22px] border border-border/80 bg-card p-2 sm:p-2.5 shadow-ambient flex flex-col sm:flex-row gap-2 transition-all focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15"
            style={{ overflow: 'visible' }}
          >
            {/* Location Combobox */}
            <div className="border-b sm:border-b-0 sm:border-r border-border/60 shrink-0 sm:min-w-[240px] sm:max-w-[280px] overflow-visible">
              <LocationSearchCombobox
                selectedCity={selectedCity}
                onCityChange={(city) => {
                  setSelectedCity(city);
                }}
              />
            </div>

            {/* Keyword Input */}
            <div className="flex flex-1 items-center gap-2.5 px-3 py-1.5">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="მოძებნე: Monstera, ფიკუსი, ქოთანი, სუბსტრატი..."
                className="w-full bg-transparent text-sm sm:text-base font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="rounded-[16px] bg-primary hover:bg-primary-container text-white font-black text-sm h-11 sm:h-12 px-8 shadow-xs shrink-0 cursor-pointer"
            >
              ძიება
            </Button>
          </form>
        </div>

        {/* Popular Tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-bold text-primary dark:text-primary-fixed text-xs">
            <TrendingUp className="w-3.5 h-3.5" /> პოპულარული:
          </span>
          {["Monstera Albo", "Philodendron", "Ficus Lyrata", "🎁 გაჩუქება", "კერამიკული ქოთანი", "სუბსტრატი"].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                const cleanTag = tag.replace("🎁 ", "");
                setSearchTerm(cleanTag);
                router.push(`/listings?q=${encodeURIComponent(cleanTag)}`);
              }}
              className="rounded-full bg-secondary-container/70 hover:bg-secondary-container px-3 py-1 text-xs font-bold text-foreground transition-colors border border-border/50 cursor-pointer"
            >
              #{tag}
            </button>
          ))}
        </div>

      </div>
    </section>
  );
}
