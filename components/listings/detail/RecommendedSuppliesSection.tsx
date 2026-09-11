"use client";

import * as React from "react";
import Image from "next/image";
import { 
  ShoppingBag, 
  Sparkles, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight, 
  Boxes, 
  Layers, 
  Sprout, 
  Store,
  CheckCircle2
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { PlantCareInfo } from "@/lib/botanical-care";

export interface AffiliateOfferItem {
  id: string;
  titleKa: string;
  titleEn: string;
  categoryKa: string;
  categoryEn: string;
  price: number | string;
  image: string;
  link: string;
  shopName: string;
  shopBadge: string;
  shopColor?: string;
  isExternal?: boolean;
  referralParam?: string;
}

interface RecommendedSuppliesSectionProps {
  offers: AffiliateOfferItem[];
  plantTitle: string;
  plantCategory?: string;
  careInfo?: PlantCareInfo;
  isKa?: boolean;
  className?: string;
}

export function RecommendedSuppliesSection({
  offers = [],
  plantTitle,
  plantCategory,
  careInfo,
  isKa = true,
  className = "",
}: RecommendedSuppliesSectionProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Track click telemetry via existing API endpoint without blocking navigation
  const handleProductClick = (item: AffiliateOfferItem) => {
    try {
      if (typeof window !== "undefined" && item.id) {
        fetch("/api/affiliate/click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            affiliateId: item.id,
            targetUrl: item.link,
            referralParam: item.referralParam || "?ref=plantio",
          }),
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Telemetry error must never block outbound click
    }
  };

  // Botanical Fallback Recommendations when zero affiliate products exist in database yet
  const fallbackAccessories = React.useMemo(() => {
    const soilRec = careInfo?.soilKa || "უნივერსალური პრემიუმ სუბსტრატი & პერლიტი";
    return [
      {
        id: "fb-soil",
        categoryKa: "სუბსტრატი & გრუნტი",
        categoryEn: "Soil & Substrates",
        titleKa: `${plantTitle}-ს სპეციალური სუბსტრატი`,
        titleEn: `Tailored Substrate for ${plantTitle}`,
        descriptionKa: `რეკომენდებული შემადგენლობა: ${soilRec}`,
        descriptionEn: `Recommended mix: ${careInfo?.soilEn || "Well-draining rich substrate"}`,
        icon: Boxes,
        suggestedPartner: "Domino / Gorgia",
      },
      {
        id: "fb-pot",
        categoryKa: "ქოთნები & კაშპო",
        categoryEn: "Pots & Planters",
        titleKa: "სადრენაჟო კერამიკული ან თიხის ქოთანი",
        titleEn: "Drainage Ceramic or Terracotta Pot",
        descriptionKa: "ფესვების აერაციისთვის და ზედმეტი ტენის გადინებისთვის",
        descriptionEn: "Essential for root aeration and preventing waterlogging",
        icon: Layers,
        suggestedPartner: "Agrohub / Miaplant",
      },
      {
        id: "fb-fertilizer",
        categoryKa: "სასუქი & ვიტამინები",
        categoryEn: "Fertilizers & Care",
        titleKa: "კომპლექსური ბიო-სასუქი და სტიმულატორი",
        titleEn: "Complex Bio-Fertilizer & Root Booster",
        descriptionKa: "აქტიური ზრდის, ფესვთა სისტემისა და ჯანსაღი ფოთლებისთვის",
        descriptionEn: "Promotes healthy leaf coloration and vigorous root growth",
        icon: Sprout,
        suggestedPartner: "Domino / Agrohub",
      },
      {
        id: "fb-tools",
        categoryKa: "ხელსაწყოები & მოვლა",
        categoryEn: "Tools & Equipment",
        titleKa: "ხავსის საყრდენი ან პულვერიზატორი",
        titleEn: "Moss Pole or Fine Mist Sprayer",
        descriptionKa: `ტენიანობის შენარჩუნებისთვის (${careInfo?.humidityKa || "რეგულარული დანამვა"})`,
        descriptionEn: "Maintains optimal foliage humidity and climbing support",
        icon: Store,
        suggestedPartner: "Bricorama / Amazon",
      },
    ];
  }, [careInfo, plantTitle]);

  return (
    <div className={`pt-6 border-t border-border/60 space-y-4 ${className}`}>
      {/* ── Section Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-foreground">
              {isKa ? "შეთავაზებული პროდუქტები & მოვლის საშუალებები" : "Recommended Products & Care Supplies"}
            </h3>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-3 h-3" />
              {isKa ? "ამ მცენარისთვის" : "Plant-Specific"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isKa 
              ? `შესაბამისი ნიადაგი, ქოთნები და სასუქები ${plantTitle}-სთვის პარტნიორი მაღაზიებიდან` 
              : `Curated soil, pots and care nutrients tailored for ${plantTitle} from partner shops`}
          </p>
        </div>

        {/* Carousel controls if products exist */}
        {offers.length > 0 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Previous products"
              className="h-8 w-8 rounded-full border border-border/80 bg-background hover:bg-secondary-container flex items-center justify-center text-foreground transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Next products"
              className="h-8 w-8 rounded-full border border-border/80 bg-background hover:bg-secondary-container flex items-center justify-center text-foreground transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── CASE 1: ACTIVE AFFILIATE PRODUCTS DISPLAY ── */}
      {offers.length > 0 ? (
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar pb-2 pt-1"
        >
          {offers.map((item) => (
            <div
              key={item.id}
              className="snap-start group relative flex flex-col justify-between w-[220px] sm:w-[240px] shrink-0 rounded-[18px] border border-border/70 bg-card hover:border-primary/50 hover:shadow-md transition-all p-3.5 shadow-2xs"
            >
              {/* Product Image */}
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[14px] bg-secondary-container mb-3">
                <Image
                  src={item.image}
                  alt={isKa ? item.titleKa : item.titleEn}
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Partner Store Badge */}
                <div
                  className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-[8px] text-[10px] font-black text-white shadow-xs flex items-center gap-1 backdrop-blur-xs"
                  style={{ backgroundColor: item.shopColor || "rgba(22, 163, 74, 0.95)" }}
                >
                  <Store className="w-2.5 h-2.5" />
                  <span>{item.shopBadge || item.shopName}</span>
                </div>

                {/* Category Chip */}
                <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-[8px] text-[9px] font-bold bg-background/90 text-foreground shadow-2xs border border-border/40 backdrop-blur-xs">
                  {isKa ? item.categoryKa : item.categoryEn}
                </div>
              </div>

              {/* Information Content */}
              <div className="flex flex-1 flex-col justify-between space-y-2">
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                    {isKa ? item.categoryKa : item.categoryEn}
                  </span>
                  <h4 className="text-xs sm:text-sm font-black text-foreground line-clamp-2 mt-0.5 leading-snug group-hover:text-primary transition-colors">
                    {isKa ? item.titleKa : item.titleEn}
                  </h4>
                </div>

                {/* Price & Action CTA Button */}
                <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                  <span className="text-sm font-black text-primary">
                    {typeof item.price === "number" ? formatPrice(item.price) : `${item.price} ₾`}
                  </span>

                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleProductClick(item)}
                    className="h-8 px-2.5 rounded-[10px] bg-primary/10 hover:bg-primary text-primary hover:text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <span>{isKa ? "მაღაზიაში" : "Store"}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── CASE 2: CLEAN BOTANICAL CURATION & PLACEHOLDER STATE ── */
        <div className="space-y-4">
          {/* Curation Notice Strip */}
          <div className="p-4 rounded-[18px] bg-secondary-container/40 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-[12px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
                  <span>{isKa ? "პარტნიორი მაღაზიების ინვენტარი მალე დაემატება" : "Partner Store Products Coming Soon"}</span>
                  <span className="px-1.5 py-0.5 rounded-[6px] text-[9px] font-extrabold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    {isKa ? "მზადდება" : "In Progress"}
                  </span>
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {isKa 
                    ? "ამ მცენარისთვის რეკომენდებული სუბსტრატები, ქოთნები და სასუქები მალე პირდაპირ გამოჩნდება Domino, Gorgia, Agrohub და Miaplant-იდან." 
                    : "Verified substrates, planters and fertilizers for this plant will be available directly from partner shops."}
                </p>
              </div>
            </div>

            {/* Partner Store Badges Preview */}
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              {[
                { name: "Domino", bg: "#16a34a" },
                { name: "Gorgia", bg: "#ea580c" },
                { name: "Agrohub", bg: "#059669" },
                { name: "Miaplant", bg: "#0284c7" },
              ].map((p) => (
                <span
                  key={p.name}
                  className="px-2 py-0.5 rounded-[8px] text-[10px] font-bold text-white shadow-2xs"
                  style={{ backgroundColor: p.bg }}
                >
                  {p.name}
                </span>
              ))}
            </div>
          </div>

          {/* Curated Botanical Care Kit Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {fallbackAccessories.map((acc) => {
              const IconComp = acc.icon;
              return (
                <div
                  key={acc.id}
                  className="p-3.5 rounded-[16px] border border-border/70 bg-card hover:border-primary/40 transition-all space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider">
                        {isKa ? acc.categoryKa : acc.categoryEn}
                      </span>
                      <div className="w-6 h-6 rounded-[8px] bg-primary/10 text-primary flex items-center justify-center">
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <h5 className="text-xs font-bold text-foreground leading-snug">
                      {isKa ? acc.titleKa : acc.titleEn}
                    </h5>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                      {isKa ? acc.descriptionKa : acc.descriptionEn}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="font-semibold">{acc.suggestedPartner}</span>
                    <span className="inline-flex items-center gap-1 font-bold text-primary">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isKa ? "რეკომენდაცია" : "Curated"}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
