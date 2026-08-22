"use client";

import * as React from "react";
import { useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
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
  const locale = useLocale();
  const isKa = locale !== "en";
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

  const [showAllTags, setShowAllTags] = React.useState(false);

  const allTrendingTagsKa = [
    "Monstera Albo",
    "Philodendron",
    "Ficus Lyrata",
    "🎁 გაჩუქება",
    "კერამიკული ქოთანი",
    "სუბსტრატი",
    "ორქიდეა",
    "სანსევიერია",
    "ალოკაზია",
  ];

  const allTrendingTagsEn = [
    "Monstera Albo",
    "Philodendron",
    "Ficus Lyrata",
    "🎁 Giveaway",
    "Ceramic Pot",
    "Soil Mix",
    "Orchid",
    "Sansevieria",
    "Alocasia",
  ];

  const trendingTags = isKa ? allTrendingTagsKa : allTrendingTagsEn;
  const visibleTags = showAllTags ? trendingTags : trendingTags.slice(0, 5);

  return (
    <section className="relative py-6 sm:py-8 lg:py-10 border-b border-border/60 bg-surface-cream/40" style={{ overflow: 'visible' }}>
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">

        {/* Hero Title & Beta / Test Mode Notice */}
        <div className="text-center mb-6 max-w-3xl mx-auto space-y-2.5">
          <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-black tracking-tight text-foreground leading-tight">
            {isKa ? (
              <>
                პირველი ქართული მცენარეების მარკეტფლეისი{" "}
                <span className="text-primary dark:text-emerald-400">
                  საქართველოში
                </span>
              </>
            ) : (
              <>
                The First Plant Marketplace in{" "}
                <span className="text-primary dark:text-emerald-400">
                  Georgia
                </span>
              </>
            )}
          </h1>

          <div className="flex items-center justify-center">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-900 dark:text-amber-300 text-xs sm:text-[13px] font-bold border border-amber-500/25 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>{isKa ? "საიტი მუშაობს სატესტო რეჟიმში" : "Platform operates in Beta / Test Mode"}</span>
            </span>
          </div>
        </div>

        {/* 📊 1. Live Real-Time Platform Statistics with Community Growth Micro-Copy */}
        <div className="mb-6 space-y-2.5 max-w-4xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {/* 1. Users */}
            <div className="flex flex-col justify-between p-3 sm:p-4 rounded-[16px] sm:rounded-[18px] bg-card border border-border/70 shadow-2xs hover:shadow-xs transition-all text-left">
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-[10px] sm:rounded-[12px] bg-primary/10 text-primary shrink-0">
                  <Users className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-[6px] border border-emerald-500/20 whitespace-nowrap">
                  {stats.totalUsers < 100 ? (isKa ? "🚀 მზარდი" : "🚀 Rising") : "+"}
                </span>
              </div>
              <div>
                <p className="text-lg sm:text-xl font-black text-foreground leading-tight tracking-tight">
                  {stats.totalUsers}
                </p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">
                  {isKa ? "მომხმარებელი" : "Members"}
                </p>
              </div>
            </div>

            {/* 2. Active Plant Listings */}
            <div className="flex flex-col justify-between p-3 sm:p-4 rounded-[16px] sm:rounded-[18px] bg-card border border-border/70 shadow-2xs hover:shadow-xs transition-all text-left">
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-[10px] sm:rounded-[12px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Sprout className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-[6px] border border-emerald-500/20 whitespace-nowrap">
                  {isKa ? "🌱 ცოცხალი" : "🌱 Live"}
                </span>
              </div>
              <div>
                <p className="text-lg sm:text-xl font-black text-foreground leading-tight tracking-tight">
                  {stats.totalListings}
                </p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">
                  {isKa ? "მცენარე" : "Plant Listings"}
                </p>
              </div>
            </div>

            {/* 3. Trades & Giveaways */}
            <div className="flex flex-col justify-between p-3 sm:p-4 rounded-[16px] sm:rounded-[18px] bg-card border border-border/70 shadow-2xs hover:shadow-xs transition-all text-left">
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-[10px] sm:rounded-[12px] bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                  <Gift className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
                <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-[6px] border border-amber-500/20 whitespace-nowrap">
                  {isKa ? "🎁 უფასო" : "🎁 Free"}
                </span>
              </div>
              <div>
                <p className="text-lg sm:text-xl font-black text-foreground leading-tight tracking-tight">
                  {stats.totalTradesAndGifts}
                </p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">
                  {isKa ? "გაცვლა & ჩუქება" : "Trades & Gifts"}
                </p>
              </div>
            </div>

            {/* 4. Verified Shops */}
            <div className="flex flex-col justify-between p-3 sm:p-4 rounded-[16px] sm:rounded-[18px] bg-card border border-border/70 shadow-2xs hover:shadow-xs transition-all text-left">
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-[10px] sm:rounded-[12px] bg-secondary-container text-primary shrink-0">
                  <Store className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
                <span className="text-[10px] font-extrabold text-primary bg-primary/10 px-1.5 py-0.5 rounded-[6px] border border-primary/20 whitespace-nowrap">
                  {isKa ? "⭐ მაღაზია" : "⭐ Verified"}
                </span>
              </div>
              <div>
                <p className="text-lg sm:text-xl font-black text-foreground leading-tight tracking-tight">
                  {stats.totalShops}
                </p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">
                  {isKa ? "სანერგე & შოპი" : "Shops & Nurseries"}
                </p>
              </div>
            </div>
          </div>

          {/* Social Proof & Invitation Micro-Copy */}
          <div className="text-center pt-1 px-2">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              🌿 {isKa 
                ? "იყავი პირველ ელიტურ კოლექციონერთა შორის — შემოუერთდი მცენარეების მოყვარულთა საზოგადოებას!" 
                : "Be among the first elite collectors — join our rapidly growing botanical community!"}
            </p>
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
                placeholder={isKa ? "მოძებნე: Monstera, ფიკუსი, ქოთანი, სუბსტრატი..." : "Search: Monstera, Ficus, Pot, Soil..."}
                className="w-full bg-transparent text-sm sm:text-base font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="rounded-[16px] bg-primary hover:bg-primary-container text-white font-black text-sm h-11 sm:h-12 px-8 shadow-xs shrink-0 cursor-pointer"
            >
              {isKa ? "ძიება" : "Search"}
            </Button>
          </form>
        </div>

        {/* 🏷️ Top 5 Trending Tags with Expandable Clutter-Free Toggle */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs">
          <span className="flex items-center gap-1 font-black text-primary dark:text-primary-fixed text-xs">
            <TrendingUp className="w-3.5 h-3.5" /> {isKa ? "ტრენდული:" : "Trending:"}
          </span>
          {visibleTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                const cleanTag = tag.replace(/🎁\s*/, "");
                setSearchTerm(cleanTag);
                router.push(`/listings?q=${encodeURIComponent(cleanTag)}`);
              }}
              className="rounded-full bg-secondary-container/80 hover:bg-secondary-container px-3 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 transition-colors border border-border/60 cursor-pointer shadow-2xs hover:border-primary/40"
            >
              #{tag}
            </button>
          ))}
          {trendingTags.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllTags(!showAllTags)}
              className="rounded-full bg-surface-container hover:bg-surface-container-high px-2.5 py-1 text-xs font-bold text-primary transition-colors border border-primary/20 cursor-pointer"
            >
              {showAllTags 
                ? (isKa ? "ნაკლები ∧" : "Less ∧") 
                : (isKa ? `+${trendingTags.length - 5} მეტი ∨` : `+${trendingTags.length - 5} more ∨`)}
            </button>
          )}
        </div>

      </div>
    </section>
  );
}
