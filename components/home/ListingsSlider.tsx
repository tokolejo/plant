"use client";

import * as React from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { ChevronLeft, ChevronRight, MapPin, Star, RefreshCw, Eye, Sparkles, Camera } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { ExtendedListingCardProps } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";

interface ListingsSliderProps {
  listings: ExtendedListingCardProps[];
}

/** Premium PalmStreet & Stitch styled showcase card */
function ShowcaseCard({ item }: { item: ExtendedListingCardProps }) {
  const img =
    item.images?.[0] ||
    "https://images.unsplash.com/photo-1545241047-6083a3684587?w=600&auto=format&fit=crop&q=80";

  return (
    <Link
      href={`/listings/${item.id}`}
      className="relative flex flex-col overflow-hidden rounded-[20px] border border-border bg-card shadow-2xs w-[240px] sm:w-[270px] shrink-0 snap-start select-none"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-container">
        <Image
          src={img}
          alt={item.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 240px, 270px"
          draggable={false}
        />

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
          {(item as any).isVip && (
            <Badge className="bg-amber-500 text-white font-black text-[10px] px-2 py-0.5 shadow-sm border-0">
              VIP
            </Badge>
          )}
          {item.isFeatured && !(item as any).isVip && (
            <Badge className="bg-primary text-white font-bold text-[10px] px-2 py-0.5 shadow-sm border-0">
              TOP
            </Badge>
          )}
        </div>

        {/* Photo Count */}
        <div className="absolute bottom-2.5 right-2.5 z-10 rounded-[8px] bg-black/60 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-bold text-white flex items-center gap-1">
          <Camera className="w-2.5 h-2.5" />
          <span>{item.images?.length || 1}</span>
        </div>
      </div>

      {/* Info Section */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        {/* Price & Location */}
        <div className="flex items-baseline justify-between gap-2 mb-1.5">
          <div>
            {item.transactionType === "GIFT" || item.price === 0 || !item.price ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-[8px] bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-xs font-black border border-emerald-500/30 shadow-2xs">
                <span>უფასო</span>
              </span>
            ) : item.transactionType === "TRADE" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] bg-amber-500/15 text-amber-900 dark:text-amber-300 text-xs font-black border border-amber-500/30">
                <RefreshCw className="w-2.5 h-2.5" />
                <span>გაცვლა</span>
              </span>
            ) : (
              <span className="text-lg sm:text-xl font-black tracking-tight text-primary dark:text-primary-fixed">
                {formatPrice(item.price)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-surface-container px-2 py-0.5 rounded-[6px] truncate max-w-[120px] border border-border/50">
            <MapPin className="w-3 h-3 text-primary shrink-0" />
            <span className="truncate">{item.city.split(" ")[0]}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 text-xs sm:text-sm font-bold text-foreground leading-snug mb-2">
          {item.title}
        </h3>

        {/* Seller Info */}
        <div className="mt-auto pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center font-black text-primary text-[10px] shrink-0 overflow-hidden border border-border/60">
              {item.seller.avatarUrl ? (
                <img src={item.seller.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                item.seller.fullName.charAt(0)
              )}
            </div>
            <span className="truncate font-bold text-slate-700 dark:text-slate-200">
              {item.seller.fullName}
            </span>
          </div>

          {item.seller.totalReviews > 0 && (
            <div className="flex items-center gap-0.5 font-black text-amber-600 dark:text-amber-400 shrink-0">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{item.seller.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ListingsSlider({ listings }: ListingsSliderProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 20);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 20);
  };

  React.useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true });
      return () => el.removeEventListener("scroll", checkScroll);
    }
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const offset = direction === "left" ? -320 : 320;
    scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <div className="relative group">
      {/* Left Navigation Arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          aria-label="წინა"
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-card/95 backdrop-blur-md shadow-ambient hover:bg-card hover:border-primary/50 text-foreground transition-all hover:scale-105"
        >
          <ChevronLeft className="w-5 h-5 text-primary" />
        </button>
      )}

      {/* Scrollable Track */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto px-4 sm:px-6 py-2 no-scrollbar scroll-smooth snap-x snap-mandatory"
      >
        {listings.map((item) => (
          <ShowcaseCard key={item.id} item={item} />
        ))}
      </div>

      {/* Right Navigation Arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          aria-label="შემდეგი"
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-card/95 backdrop-blur-md shadow-ambient hover:bg-card hover:border-primary/50 text-foreground transition-all hover:scale-105"
        >
          <ChevronRight className="w-5 h-5 text-primary" />
        </button>
      )}
    </div>
  );
}
