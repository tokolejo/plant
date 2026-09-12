"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { 
  Shuffle, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  PlusCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/listings/ListingCard";
import { formatDbListing, DEPRECATED_TEST_LISTING_IDS } from "@/lib/listings-service";
import type { ExtendedListingCardProps } from "@/lib/mock-data";

export function IsoBoardPreview() {
  const locale = useLocale();
  const isKa = locale !== "en";
  const supabase = createClient();

  const [activeTab, setActiveTab] = React.useState<"ALL" | "PLANTS" | "INVENTORY">("ALL");
  const [tradeListings, setTradeListings] = React.useState<ExtendedListingCardProps[]>([]);
  const [totalCount, setTotalCount] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(true);

  const sliderRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

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
  }, [tradeListings]);

  const scrollSlider = (direction: "left" | "right") => {
    if (!sliderRef.current) return;
    const containerWidth = sliderRef.current.clientWidth;
    const scrollAmount = direction === "left" ? -containerWidth * 0.75 : containerWidth * 0.75;
    sliderRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  React.useEffect(() => {
    async function loadTradeListings() {
      try {
        const { data, count, error } = await supabase
          .from("listings")
          .select(`
            *,
            profiles:user_id (
              id,
              full_name,
              avatar_url,
              phone,
              average_rating,
              total_reviews,
              subscription_tier,
              custom_slug,
              role,
              is_admin,
              is_verified
            )
          `, { count: "exact" })
          .eq("status", "ACTIVE")
          .or("transaction_type.eq.TRADE,trade_preferences.neq.{}")
          .order("created_at", { ascending: false });

        if (data && data.length > 0 && !error) {
          const valid = data
            .filter((row: any) => !DEPRECATED_TEST_LISTING_IDS.has(row.id))
            .map((row: any) => formatDbListing(row, row.profiles));

          // Ensure TRADE items are prioritized first
          const sorted = valid.sort((a, b) => {
            const aIsTrade = a.transactionType === "TRADE" ? 1 : 0;
            const bIsTrade = b.transactionType === "TRADE" ? 1 : 0;
            if (aIsTrade !== bIsTrade) return bIsTrade - aIsTrade;
            return (b.viewsCount || 0) - (a.viewsCount || 0);
          });

          setTradeListings(sorted);
          setTotalCount(count || valid.length);
        } else {
          setTradeListings([]);
          setTotalCount(0);
        }
      } catch (err) {
        console.error("Error loading swap listings:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTradeListings();
  }, [supabase]);

  // Tab Filtering for Swaps: ALL, PLANTS, INVENTORY (Identical to DiscoveryFeed)
  const filtered = React.useMemo(() => {
    return tradeListings.filter((item) => {
      if (activeTab === "PLANTS") return item.itemType === "PLANT";
      if (activeTab === "INVENTORY") return item.itemType === "INVENTORY";
      return true;
    });
  }, [tradeListings, activeTab]);

  return (
    <section className="pt-4 sm:pt-6 pb-8 sm:pb-10 bg-surface-cream/40 border-y border-border/60">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        
        {/* 1. Unified Section Header: Title Badge + Category Pills + Desktop Navigation Arrows */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5">
          {/* Section Title Badge */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Shuffle className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground">
              {isKa ? "მცენარეების გაცვლა" : "Plant Swaps & Trades"}
            </h2>
          </div>

          {/* Pills + Arrows Group */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {[
                { id: "ALL", labelKa: "ყველა", labelEn: "All" },
                { id: "PLANTS", labelKa: "მცენარეები", labelEn: "Plants" },
                { id: "INVENTORY", labelKa: "ინვენტარი", labelEn: "Inventory" },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
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

            {/* Desktop Prominent Slider Navigation Arrows */}
            <div className="hidden sm:flex items-center gap-1.5 shrink-0 ml-2">
              <button
                type="button"
                onClick={() => scrollSlider("left")}
                disabled={!canScrollLeft}
                aria-label={isKa ? "წინა" : "Previous"}
                className="h-9 w-9 rounded-full border-2 border-border/80 bg-card hover:border-primary hover:bg-primary hover:text-white flex items-center justify-center text-foreground transition-all shadow-sm active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title={isKa ? "წინა" : "Previous"}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollSlider("right")}
                disabled={!canScrollRight}
                aria-label={isKa ? "შემდეგი" : "Next"}
                className="h-9 w-9 rounded-full border-2 border-border/80 bg-card hover:border-primary hover:bg-primary hover:text-white flex items-center justify-center text-foreground transition-all shadow-sm active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title={isKa ? "შემდეგი" : "Next"}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Unified Card Slider (165px on mobile, matching DiscoveryFeed exactly) */}
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
          <div className="rounded-[22px] border border-border/70 bg-card p-6 sm:p-8 text-center space-y-3 max-w-md mx-auto my-2 shadow-ambient">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto">
              <Shuffle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">
                {isKa ? "გასაცვლელი მცენარეები ჯერ არ არის" : "No Plant Swaps Found"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
                {isKa 
                  ? "განათავსეთ თქვენი პირველი მოთხოვნა ან გაცვლის შეთავაზება სრულიად უფასოდ." 
                  : "Post your wishlist or trade offer for free and connect with fellow collectors."}
              </p>
            </div>
            <Link href="/dashboard/listings/new?trans=TRADE" className="inline-block pt-1">
              <Button className="rounded-[14px] bg-primary hover:bg-primary/90 text-white text-xs font-bold h-9 px-5 shadow-ambient cursor-pointer">
                <PlusCircle className="w-4 h-4 mr-1.5" />
                <span>{isKa ? "+ შეთავაზების დამატება" : "+ Post Trade"}</span>
              </Button>
            </Link>
          </div>
        )}

        {/* 3. Centered Bottom CTA Button (Matching DiscoveryFeed styling) */}
        {filtered.length > 0 && (
          <div className="flex justify-center items-center mt-5">
            <Link href="/iso">
              <Button
                className="rounded-[14px] sm:rounded-[18px] px-5 sm:px-6 h-9 sm:h-10 text-xs sm:text-sm font-bold bg-primary hover:bg-primary-container text-white shadow-ambient gap-1.5 hover:scale-[1.02] transition-all cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>{isKa ? "ყველა გაცვლა" : "View All Swaps"}</span>
                <span className="bg-white/20 text-white text-[11px] px-2 py-0.5 rounded-full font-black">
                  {totalCount || tradeListings.length}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        )}

      </div>
    </section>
  );
}
