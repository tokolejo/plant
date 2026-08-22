"use client";

import * as React from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { 
  MapPin, 
  Truck, 
  Store, 
  RefreshCw, 
  Star, 
  ShieldCheck, 
  Award, 
  Sprout, 
  Sparkles, 
  ChevronRight,
  Gift,
  Heart
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

export interface ListingCardProps {
  id: string;
  title: string;
  titleKa?: string;
  titleEn?: string;
  descriptionKa?: string;
  descriptionEn?: string;
  price: number;
  itemType: "PLANT" | "INVENTORY";
  plantCategory?: string;
  transactionType: "FIXED" | "NEGOTIABLE" | "TRADE" | "GIFT";
  deliveryMethods: ("PICKUP" | "COURIER" | "MARSHRUTKA")[];
  images: string[];
  city: string;
  address?: string;
  lat?: number;
  lng?: number;
  distanceKm?: number;
  isFeatured?: boolean;
  isPremium?: boolean;
  tradePreferences?: string[];
  viewsCount?: number;
  status?: string;
  createdAt?: string;
  rawCreatedAt?: string;
  variant?: "compact" | "list" | "normal";
  seller: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    rating: number;
    totalReviews: number;
    badges: string[];
    tier?: string;
    customSlug?: string;
    phone?: string;
  };
}

export function ListingCard({
  id,
  title,
  titleKa,
  titleEn,
  price,
  itemType,
  transactionType,
  deliveryMethods,
  images,
  city,
  distanceKm,
  isFeatured,
  isPremium,
  tradePreferences = [],
  viewsCount = 0,
  variant = "compact",
  seller,
}: ListingCardProps) {
  const locale = useLocale();
  const isKa = locale !== "en";

  const primaryImage = images?.[0] || "https://images.unsplash.com/photo-1545241047-6083a3684587?w=600&auto=format&fit=crop&q=80";
  const isVip = isFeatured || isPremium;
  const distLabel = distanceKm !== undefined 
    ? (distanceKm < 1 
        ? (isKa ? `${Math.round(distanceKm * 1000)} მ` : `${Math.round(distanceKm * 1000)} m`) 
        : (isKa ? `${distanceKm} კმ` : `${distanceKm} km`)) 
    : undefined;

  // Localized clean title display (strips redundant 'საჩუქარი:' prefixes)
  const rawTitle = isKa ? (titleKa || title || "") : (titleEn || title || "");
  const displayTitle = rawTitle.replace(/^(\s*🎁\s*(საჩუქარი|gift):?\s*|\s*🎁\s*|\s*(საჩუქარი|gift):?\s*)/i, "").trim();

  // Wishlist toggle state
  const [isWishlisted, setIsWishlisted] = React.useState(false);

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextState = !isWishlisted;
    setIsWishlisted(nextState);
    try {
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id }),
      });
    } catch {
      setIsWishlisted(!nextState);
    }
  };

  // ─── LIST VIEW VARIANT ───────────────────────────────────────────────────────
  if (variant === "list") {
    return (
      <div className={`group relative flex flex-col sm:flex-row items-stretch overflow-hidden rounded-[20px] bg-card transition-all duration-200 ${
        isVip 
          ? "border-2 border-amber-500/70 dark:border-amber-400/60 shadow-md ring-2 ring-amber-500/15" 
          : "border border-border/70 hover:border-primary/40 shadow-xs hover:shadow-ambient"
      }`}>
        {/* Left Image */}
        <Link href={`/listings/${id}`} className="relative w-full sm:w-48 md:w-56 shrink-0 aspect-[4/3] sm:aspect-auto overflow-hidden bg-surface-container block">
          <Image
            src={primaryImage}
            alt={displayTitle}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 240px"
          />

          {/* Badges on Image */}
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1 z-10">
            {isVip && (
              <span className="backdrop-blur-md bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-[10px] px-2 py-0.5 rounded-[8px] shadow-sm">
                ⭐ VIP
              </span>
            )}
            <span className="backdrop-blur-md bg-background/90 text-foreground text-[10px] font-bold px-2 py-0.5 rounded-[8px] border border-border/40">
              {itemType === "PLANT" ? (isKa ? "🌱 მცენარე" : "🌱 Plant") : (isKa ? "🪴 ინვენტარი" : "🪴 Care & Pot")}
            </span>
          </div>

          {/* Wishlist Heart Button Top Right */}
          <button
            type="button"
            onClick={handleWishlistClick}
            className={`absolute top-2.5 right-2.5 z-20 h-7 w-7 rounded-full backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-xs ${
              isWishlisted
                ? "bg-rose-500 text-white"
                : "bg-background/80 hover:bg-background text-muted-foreground hover:text-rose-500"
            }`}
            title={isWishlisted ? "რჩეულებიდან ამოშლა" : "რჩეულებში დამატება"}
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-current" : ""}`} />
          </button>

          {images?.length > 1 && (
            <div className="absolute bottom-2 right-2 z-10 rounded-[6px] bg-black/60 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-semibold text-white">
              📷 {images.length}
            </div>
          )}
        </Link>

        {/* Right Content */}
        <div className="flex flex-1 flex-col p-3.5 sm:p-4 justify-between">
          <div>
            {/* Top row: price and city */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-baseline gap-2">
                {transactionType === "GIFT" ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-[8px] bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-xs font-black">
                    {isKa ? "🎁 უფასო" : "🎁 Free"}
                  </span>
                ) : transactionType === "TRADE" ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-[8px] bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-black">
                    {isKa ? "🔄 გაცვლა" : "🔄 Trade"}
                  </span>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className={`text-lg sm:text-xl font-black tracking-tight ${
                      isVip ? "text-amber-600 dark:text-amber-400" : "text-primary dark:text-emerald-400"
                    }`}>
                      {formatPrice(price)}
                    </span>
                    {transactionType === "NEGOTIABLE" && (
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {isKa ? "(შეთანხმებით)" : "(Negotiable)"}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Location & Distance */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-surface-container/60 px-2 py-0.5 rounded-[6px] font-medium shrink-0">
                <MapPin className="w-3 h-3 text-primary" />
                <span>{city}</span>
                {distLabel && (
                  <span className="text-primary font-bold ml-1">📍 {distLabel}</span>
                )}
              </div>
            </div>

            {/* Title */}
            <Link href={`/listings/${id}`} className="block group-hover:text-primary transition-colors">
              <h3 className="text-sm sm:text-base font-bold text-foreground line-clamp-2 leading-snug mb-2">
                {displayTitle}
              </h3>
            </Link>

            {/* Delivery Methods */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {deliveryMethods?.includes("PICKUP") && (
                <span className="text-[11px] px-2 py-0.5 rounded-[6px] bg-surface-container text-muted-foreground font-medium">
                  {isKa ? "📍 ადგილზე" : "📍 Pickup"}
                </span>
              )}
              {deliveryMethods?.includes("COURIER") && (
                <span className="text-[11px] px-2 py-0.5 rounded-[6px] bg-secondary-container text-primary font-bold inline-flex items-center gap-1">
                  <Truck className="w-3 h-3" /> {isKa ? "კურიერი" : "Courier"}
                </span>
              )}
              {deliveryMethods?.includes("MARSHRUTKA") && (
                <span className="text-[11px] px-2 py-0.5 rounded-[6px] bg-surface-container text-muted-foreground font-medium">
                  {isKa ? "🚐 სამარშრუტო" : "🚐 Intercity"}
                </span>
              )}
            </div>
          </div>

          {/* Bottom Seller info & Action link */}
          <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2 mt-auto">
            <Link
              href={seller.customSlug ? `/shops/${seller.customSlug}` : `/users/${seller.id}`}
              className="flex items-center gap-2 group/seller overflow-hidden"
            >
              <div className="relative h-6 w-6 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                {seller.avatarUrl ? (
                  <Image src={seller.avatarUrl} alt={seller.fullName} fill className="rounded-full object-cover" />
                ) : (
                  seller.fullName.charAt(0).toUpperCase()
                )}
              </div>
              <span className="truncate text-xs font-semibold text-foreground group-hover/seller:text-primary transition-colors">
                {seller.fullName}
              </span>
              {seller.rating && (
                <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                  ★ {seller.rating.toFixed(1)}
                </span>
              )}
            </Link>

            <Link
              href={`/listings/${id}`}
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-container px-2.5 py-1 rounded-[8px] bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              <span>{isKa ? "ნახვა" : "View"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── COMPACT GRID VARIANT (2x sleeker & information-rich) ───────────────────
  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-[18px] bg-card transition-all duration-200 ${
      isVip 
        ? "border-2 border-amber-500/70 dark:border-amber-400/60 shadow-md shadow-amber-500/10 ring-2 ring-amber-500/15" 
        : "border border-border/70 hover:border-primary/40 shadow-2xs hover:shadow-ambient"
    }`}>
      {/* Top Image — Compact 4:3 */}
      <Link href={`/listings/${id}`} className="relative aspect-[4/3] w-full overflow-hidden bg-surface-container block">
        <Image
          src={primaryImage}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />

        {/* Floating Top Badges (Clean & Minimal) */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-10">
          {isVip && (
            <span className="backdrop-blur-md bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-[10px] px-2 py-0.5 rounded-[7px] shadow-sm flex items-center gap-0.5">
              ⭐ VIP
            </span>
          )}

          <span className="backdrop-blur-md bg-background/90 text-foreground border border-border/40 text-[10px] font-bold px-1.5 py-0.5 rounded-[7px]">
            {itemType === "PLANT" ? "🌱" : "🪴"}
          </span>
        </div>

        {/* Wishlist Heart Button Top Right */}
        <button
          type="button"
          onClick={handleWishlistClick}
          className={`absolute top-2 right-2 z-20 h-6.5 w-6.5 rounded-full backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-xs ${
            isWishlisted
              ? "bg-rose-500 text-white"
              : "bg-background/80 hover:bg-background text-muted-foreground hover:text-rose-500"
          }`}
          title={isWishlisted ? "რჩეულებიდან ამოშლა" : "რჩეულებში დამატება"}
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-current" : ""}`} />
        </button>

        {/* Distance Badge on bottom left of photo */}
        {distLabel && (
          <div className="absolute bottom-2 left-2 z-10 rounded-[6px] bg-black/70 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-bold text-white flex items-center gap-0.5">
            📍 {distLabel}
          </div>
        )}

        {/* Photo Count */}
        {images?.length > 1 && (
          <div className="absolute bottom-2 right-2 z-10 rounded-[6px] bg-black/60 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-semibold text-white">
            📷 {images.length}
          </div>
        )}
      </Link>

      {/* Content Section — Compact & Tight */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        {/* Price Row */}
        <div className="flex items-baseline justify-between gap-1 mb-1">
          {transactionType === "GIFT" ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-xs font-black">
              {isKa ? "🎁 უფასო" : "🎁 Free"}
            </span>
          ) : transactionType === "TRADE" ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-black">
              {isKa ? "🔄 გაცვლა" : "🔄 Trade"}
            </span>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className={`text-base sm:text-lg font-black tracking-tight ${
                isVip ? "text-amber-600 dark:text-amber-400" : "text-primary dark:text-emerald-400"
              }`}>
                {formatPrice(price)}
              </span>
              {transactionType === "NEGOTIABLE" && (
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {isKa ? "(შეთ.)" : "(Neg.)"}
                </span>
              )}
            </div>
          )}

          {/* City */}
          <span className="text-[11px] text-muted-foreground truncate max-w-[90px] font-medium text-right">
            {city}
          </span>
        </div>

        {/* Title */}
        <Link href={`/listings/${id}`} className="group-hover:text-primary transition-colors mb-2">
          <h3 className="line-clamp-2 text-xs sm:text-[13px] font-bold text-foreground leading-snug min-h-[32px]">
            {displayTitle}
          </h3>
        </Link>

        {/* Bottom Mini-Seller Row */}
        <div className="mt-auto border-t border-border/40 pt-2 flex items-center justify-between gap-1 text-[11px]">
          <Link
            href={seller.customSlug ? `/shops/${seller.customSlug}` : `/users/${seller.id}`}
            className="flex items-center gap-1.5 truncate text-muted-foreground hover:text-primary transition-colors font-medium"
          >
            <div className="relative h-4.5 w-4.5 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[9px]">
              {seller.avatarUrl ? (
                <Image src={seller.avatarUrl} alt={seller.fullName} fill className="rounded-full object-cover" />
              ) : (
                seller.fullName.charAt(0).toUpperCase()
              )}
            </div>
            <span className="truncate max-w-[100px]">{seller.fullName}</span>
          </Link>

          {seller.rating ? (
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold shrink-0">
              ★ {seller.rating.toFixed(1)}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
