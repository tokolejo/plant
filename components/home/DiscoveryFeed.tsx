"use client";

import * as React from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { SAMPLE_LISTINGS, type ExtendedListingCardProps } from "@/lib/mock-data";
import { createClient } from "@/utils/supabase/client";
import { formatPrice } from "@/lib/utils";
import { 
  MapPin, 
  ArrowRight, 
  Sparkles, 
  RefreshCw, 
  Flame, 
  Sprout, 
  Sun,
  Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { getMergedListings } from "@/lib/listings-service";

interface DiscoveryFeedProps {
  listings?: ExtendedListingCardProps[];
}

export function DiscoveryFeed({ listings = SAMPLE_LISTINGS }: DiscoveryFeedProps) {
  const locale = useLocale();
  const isKa = locale !== "en";
  const supabase = createClient();

  const [activeTab, setActiveTab] = React.useState<"ALL" | "SALE" | "TRADE" | "PLANTS" | "INVENTORY">("ALL");
  const [allListings, setAllListings] = React.useState<ExtendedListingCardProps[]>(listings);
  const [totalDbCount, setTotalDbCount] = React.useState<number>(listings.length);

  // Fetch live active listings and total count from Supabase
  React.useEffect(() => {
    async function loadLiveFeed() {
      try {
        const merged = await getMergedListings();
        const localized = merged.map((item: any) => ({
          ...item,
          title: isKa ? (item.titleKa || item.title_ka || item.title) : (item.titleEn || item.title_en || item.title),
        }));
        setAllListings(localized);
        setTotalDbCount(localized.length);
      } catch (e) {
        console.error("Supabase live listings fetch failed, using fallback:", e);
      }
    }
    loadLiveFeed();
  }, [isKa]);

  // Fair Premium Boost Sorting & Tab Filtering
  const filtered = React.useMemo(() => {
    // 1. Filter by Tab
    const tabFiltered = allListings.filter((item) => {
      if (activeTab === "SALE") return item.transactionType === "FIXED" || item.transactionType === "NEGOTIABLE";
      if (activeTab === "TRADE") return item.transactionType === "TRADE";
      if (activeTab === "PLANTS") return item.itemType === "PLANT";
      if (activeTab === "INVENTORY") return item.itemType === "INVENTORY";
      return true;
    });

    // 2. Sort: Active Premium/VIP listings at the top, followed by regular items
    return [...tabFiltered].sort((a, b) => {
      const aVip = a.isPremium || a.isFeatured ? 1 : 0;
      const bVip = b.isPremium || b.isFeatured ? 1 : 0;
      if (aVip !== bVip) return bVip - aVip;
      return (b.viewsCount || 0) - (a.viewsCount || 0);
    });
  }, [allListings, activeTab]);

  return (
    <section className="py-10 sm:py-14">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Header & Live Database Metric Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2.5">
              <span className="text-2xl">🔥</span>
              <span>{isKa ? "ახალი & პრემიუმ შეთავაზებები" : "New & Premium Listings"}</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {isKa 
                ? "საუკეთესო და დაწინაურებული შეთავაზებები მცენარეების მოყვარულებისგან" 
                : "Top featured & latest listings from verified growers"}
            </p>
          </div>

          {/* Real Live Database Count Metric */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-secondary-container text-primary dark:text-primary-fixed text-xs sm:text-sm font-bold shadow-xs border border-border/50">
              🌿 <strong className="font-black">{totalDbCount}</strong> {isKa ? "აქტიური შეთავაზება ბაზაში" : "active listings in database"}
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 no-scrollbar">
          {[
            { id: "ALL", labelKa: "ყველა", labelEn: "All" },
            { id: "SALE", labelKa: "გაყიდვა", labelEn: "Sale" },
            { id: "TRADE", labelKa: "გაცვლა 🔄", labelEn: "Trade 🔄" },
            { id: "PLANTS", labelKa: "მცენარეები 🌱", labelEn: "Plants 🌱" },
            { id: "INVENTORY", labelKa: "ინვენტარი 🪴", labelEn: "Inventory 🪴" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-white shadow-ambient scale-[1.02]"
                    : "bg-surface-container/70 hover:bg-surface-container text-foreground border border-border/40 hover:border-primary/30"
                }`}
              >
                {isKa ? tab.labelKa : tab.labelEn}
              </button>
            );
          })}
        </div>

        {/* Uniform Sized Card Grid with Premium VIP Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {filtered.slice(0, 10).map((item, idx) => {
            const img = item.images?.[0] || "https://images.unsplash.com/photo-1545241047-6083a3684587?w=600&auto=format&fit=crop&q=80";
            const isVip = item.isPremium || item.isFeatured;

            // Generate contextual tag
            let tag = { text: "🌿 ბოტანიკა", icon: Sprout, bg: "bg-secondary-container text-primary font-bold" };
            if (isVip) {
              tag = { text: "⭐ VIP TOP", icon: Crown, bg: "bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black shadow-md" };
            } else if (item.transactionType === "TRADE") {
              tag = { text: "Trade 🔄", icon: RefreshCw, bg: "bg-amber-500 text-white font-black" };
            } else if (idx % 3 === 0) {
              tag = { text: "Rare ✨", icon: Sparkles, bg: "bg-secondary-container text-primary font-bold" };
            } else if (idx % 3 === 1) {
              tag = { text: "High Light ☀️", icon: Sun, bg: "bg-secondary-container text-primary font-bold" };
            }

            const Icon = tag.icon;

            return (
              <Link
                key={item.id}
                href={`/listings/${item.id}`}
                className={`group flex flex-col rounded-[24px] bg-card overflow-hidden transition-all duration-300 ${
                  isVip
                    ? "border-2 border-amber-500/70 dark:border-amber-400/60 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/15"
                    : "border border-border/70 shadow-ambient hover:shadow-ambient-lg hover:border-primary/40"
                }`}
              >
                {/* Top Image — Uniform 4:3 Aspect Ratio */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-container">
                  <Image
                    src={img}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
                  />

                  {/* Floating VIP / Category Tag */}
                  <div className="absolute top-3.5 left-3.5 z-10">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] backdrop-blur-md ${tag.bg}`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tag.text}</span>
                    </span>
                  </div>
                </div>

                {/* Bottom Content Area */}
                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  {/* Title & Price in Same Row */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="line-clamp-2 text-sm sm:text-[15px] font-bold text-foreground leading-snug group-hover:text-primary transition-colors flex-1">
                      {item.title}
                    </h3>
                    <div className="shrink-0 text-right">
                      {item.transactionType === "TRADE" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-black">
                          გაცვლა
                        </span>
                      ) : (
                        <span className={`text-base sm:text-lg font-black ${
                          isVip ? "text-amber-600 dark:text-amber-400" : "text-primary dark:text-primary-fixed"
                        }`}>
                          {formatPrice(item.price)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Category / Subtitle */}
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-3">
                    {isVip 
                      ? (isKa ? "⭐ პრემიუმ დაწინაურებული განცხადება" : "⭐ Premium Featured Listing") 
                      : (item.itemType === "PLANT" ? "მცენარე, ფესვიანი კალამი" : "ბოტანიკური ინვენტარი")}
                  </p>

                  {/* City Location with Icon */}
                  <div className="mt-auto pt-2.5 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground font-semibold">
                    <span className="flex items-center gap-1 text-primary">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.city}</span>
                    </span>
                    {item.seller?.rating && (
                      <span className="text-amber-600 font-bold">
                        ★ {item.seller.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Center View All Button */}
        <div className="flex justify-center items-center mt-10">
          <Link href="/listings">
            <Button
              className="rounded-[20px] px-8 h-12 text-sm font-bold bg-primary hover:bg-primary-container text-white shadow-ambient-lg gap-2 hover:scale-[1.02] transition-all"
            >
              <Sprout className="w-4 h-4" />
              <span>{isKa ? "ყველა განცხადების ნახვა" : "View All Listings"}</span>
              <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full ml-1 font-black">
                {totalDbCount}
              </span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
