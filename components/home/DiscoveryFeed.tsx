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
    <section className="py-10 sm:py-14">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Header & Live Database Metric Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2.5">
              <span className="text-2xl">🔥</span>
              <span>{isKa ? "ახალი პრემიუმ შეთავაზებები" : "New Premium Listings"}</span>
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

        {/* Uniform Sized Card Grid with Shared ListingCard Component */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
          {filtered.slice(0, 12).map((item) => (
            <ListingCard key={item.id} {...item} variant="compact" />
          ))}
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
