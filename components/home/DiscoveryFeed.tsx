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
import { ListingCard } from "@/components/listings/ListingCard";
import { getMergedListings, applyDiverseSellerRotation } from "@/lib/listings-service";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DiscoveryFeedProps {
  listings?: ExtendedListingCardProps[];
}

export function DiscoveryFeed({ listings = [] }: DiscoveryFeedProps) {
  const locale = useLocale();
  const isKa = locale !== "en";
  const supabase = createClient();

  const [activeTab, setActiveTab] = React.useState<"ALL" | "SALE" | "TRADE" | "PLANTS" | "INVENTORY">("ALL");
  const [allListings, setAllListings] = React.useState<ExtendedListingCardProps[]>(listings);
  const [loading, setLoading] = React.useState(listings.length === 0);
  const [totalDbCount, setTotalDbCount] = React.useState<number>(listings.length);

  const sliderRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  // Fetch live active listings and total count from Supabase + Realtime WebSockets
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
        console.error("Supabase live listings fetch failed:", e);
      } finally {
        setLoading(false);
      }
    }
    loadLiveFeed();

    // Supabase Realtime WebSocket subscription: updates automatically on any DB change
    const channel = supabase
      .channel("public:home_discovery_feed_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listings" },
        () => {
          loadLiveFeed();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isKa, supabase]);

  const checkScroll = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  React.useEffect(() => {
    checkScroll();
    const el = sliderRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true });
      return () => el.removeEventListener("scroll", checkScroll);
    }
  }, [allListings, activeTab]);

  const scrollSlider = (direction: "left" | "right") => {
    if (!sliderRef.current) return;
    const offset = direction === "left" ? -sliderRef.current.clientWidth * 0.85 : sliderRef.current.clientWidth * 0.85;
    sliderRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  // Fair Premium Boost Sorting & Diverse Tab Filtering (Anti-Monopoly Grid)
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
    const sorted = [...tabFiltered].sort((a, b) => {
      const aVip = a.isPremium || a.isFeatured ? 1 : 0;
      const bVip = b.isPremium || b.isFeatured ? 1 : 0;
      if (aVip !== bVip) return bVip - aVip;
      return (b.viewsCount || 0) - (a.viewsCount || 0);
    });

    // 3. Apply Fair Seller Rotation to prevent monopoly effect in the top grid
    return applyDiverseSellerRotation(sorted);
  }, [allListings, activeTab]);

  return (
    <section className="py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        
        {/* 🌟 1. Centered Header (Matches User Request & Design System) */}
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-foreground text-center">
            🔥 {isKa ? "ახალი პრემიუმ შეთავაზებები" : "New Premium Listings"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
            {isKa 
              ? "საუკეთესო და დაწინაურებული შეთავაზებები მცენარეების მოყვარულებისგან" 
              : "Top featured & latest listings from verified growers"}
          </p>

          {/* Centered Real Live Database Count Metric */}
          <div className="pt-1 flex items-center justify-center">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-secondary-container text-primary dark:text-primary-fixed text-xs font-bold shadow-2xs border border-border/50">
              🌿 <strong className="font-black">{totalDbCount}</strong> {isKa ? "აქტიური შეთავაზება ბაზაში" : "active listings in database"}
            </span>
          </div>
        </div>

        {/* 🏷️ 2. Centered Filter Tabs with Left/Right Arrows for Slider on Desktop */}
        <div className="flex items-center justify-between gap-2 mb-6">
          <div className="flex-1 flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-1 no-scrollbar">
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
                  className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
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

          {/* Desktop Slider Navigation Arrows */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0 ml-2">
            <button
              type="button"
              onClick={() => scrollSlider("left")}
              disabled={!canScrollLeft}
              className="h-8 w-8 rounded-full border border-border/70 bg-card hover:bg-surface-container flex items-center justify-center text-foreground transition-all shadow-2xs active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title={isKa ? "წინა" : "Previous"}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollSlider("right")}
              disabled={!canScrollRight}
              className="h-8 w-8 rounded-full border border-border/70 bg-card hover:bg-surface-container flex items-center justify-center text-foreground transition-all shadow-2xs active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title={isKa ? "შემდეგი" : "Next"}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 📱 3. Horizontal Touch-Swipeable Slider (Shows 4 cards cleanly on desktop, smooth swipe on mobile) */}
        {filtered.length > 0 ? (
          <div
            ref={sliderRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar pb-3 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0"
          >
            {filtered.map((item) => (
              <div
                key={item.id}
                className="w-[165px] sm:w-[210px] md:w-[240px] lg:w-[calc(25%-12px)] shrink-0 snap-start"
              >
                <ListingCard {...item} variant="compact" />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center rounded-[20px] border border-border/60 bg-card p-6">
            <p className="text-sm font-bold text-muted-foreground">
              {isKa ? "ამ კატეგორიაში განცხადებები ჯერ არ არის." : "No listings found in this category."}
            </p>
          </div>
        )}

        {/* 🔗 4. Center View All Button */}
        <div className="flex justify-center items-center mt-8">
          <Link href="/listings">
            <Button
              className="rounded-[20px] px-8 h-12 text-sm font-bold bg-primary hover:bg-primary-container text-white shadow-ambient gap-2 hover:scale-[1.02] transition-all cursor-pointer"
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
