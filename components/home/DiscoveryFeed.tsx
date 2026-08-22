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
  Sprout, 
  Layers,
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

  // Auto-fetch Real Listings from Database on Mount
  React.useEffect(() => {
    getMergedListings().then((merged) => {
      setAllListings(merged);
      setTotalDbCount(merged.length);
      setLoading(false);
    });
  }, []);

  // Update scroll navigation arrow states
  const updateScrollState = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  React.useEffect(() => {
    const slider = sliderRef.current;
    if (slider) {
      slider.addEventListener("scroll", updateScrollState, { passive: true });
      updateScrollState();
      return () => slider.removeEventListener("scroll", updateScrollState);
    }
  }, [allListings]);

  const scrollSlider = (direction: "left" | "right") => {
    if (!sliderRef.current) return;
    const containerWidth = sliderRef.current.clientWidth;
    const scrollAmount = direction === "left" ? -containerWidth * 0.75 : containerWidth * 0.75;
    sliderRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
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
        
        {/* 🌟 1. Centered Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-foreground text-center">
            {isKa ? "ახალი პრემიუმ შეთავაზებები" : "New Premium Listings"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
            {isKa 
              ? "საუკეთესო და დაწინაურებული შეთავაზებები მცენარეების მოყვარულებისგან" 
              : "Top featured & latest listings from verified growers"}
          </p>

          {/* Centered Live Database Count Metric */}
          <div className="pt-1 flex items-center justify-center">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-secondary-container text-foreground text-xs font-bold shadow-2xs border border-border/50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <strong className="font-black">{totalDbCount}</strong> {isKa ? "აქტიური შეთავაზება ბაზაში" : "active listings in database"}
            </span>
          </div>
        </div>

        {/* 🏷️ 2. Tabs Row + High-Visibility Desktop Slider Navigation Arrows */}
        <div className="flex items-center justify-between gap-2 mb-5">
          <div className="flex-1 flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {[
              { id: "ALL", labelKa: "ყველა", labelEn: "All" },
              { id: "SALE", labelKa: "გაყიდვა", labelEn: "Sale" },
              { id: "TRADE", labelKa: "გაცვლა", labelEn: "Trade" },
              { id: "PLANTS", labelKa: "მცენარეები", labelEn: "Plants" },
              { id: "INVENTORY", labelKa: "ინვენტარი", labelEn: "Inventory" },
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

          {/* Desktop Prominent Slider Navigation Arrows (In tabs row, not covering cards) */}
          <div className="hidden sm:flex items-center gap-2 shrink-0 ml-2">
            <button
              type="button"
              onClick={() => scrollSlider("left")}
              disabled={!canScrollLeft}
              aria-label={isKa ? "წინა" : "Previous"}
              className="h-10 w-10 rounded-full border-2 border-border/80 bg-card hover:border-primary hover:bg-primary hover:text-white flex items-center justify-center text-foreground transition-all shadow-sm active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title={isKa ? "წინა" : "Previous"}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollSlider("right")}
              disabled={!canScrollRight}
              aria-label={isKa ? "შემდეგი" : "Next"}
              className="h-10 w-10 rounded-full border-2 border-border/80 bg-card hover:border-primary hover:bg-primary hover:text-white flex items-center justify-center text-foreground transition-all shadow-sm active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title={isKa ? "შემდეგი" : "Next"}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 📱 3. Horizontal Touch-Swipeable Slider */}
        {filtered.length > 0 ? (
          <div
            ref={sliderRef}
            className="flex gap-3 sm:gap-3.5 md:gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar pb-3 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0"
          >
            {filtered.map((item) => (
              <div
                key={item.id}
                className="w-[165px] sm:w-[200px] md:w-[220px] lg:w-[calc(20%-13px)] xl:w-[calc(16.666%-14px)] shrink-0 snap-start"
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

        {/* 🔗 4. Compact & Refined View All Button */}
        <div className="flex justify-center items-center mt-6">
          <Link href="/listings">
            <Button
              className="rounded-[14px] sm:rounded-[18px] px-5 sm:px-6 h-9 sm:h-10 text-xs sm:text-sm font-bold bg-primary hover:bg-primary-container text-white shadow-ambient gap-1.5 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <Sprout className="w-3.5 h-3.5" />
              <span>{isKa ? "ყველა განცხადება" : "View All Listings"}</span>
              <span className="bg-white/20 text-white text-[11px] px-2 py-0.5 rounded-full font-black">
                {totalDbCount}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}
