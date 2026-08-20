"use client";

import * as React from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
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
  Eye
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice, getTierColor } from "@/lib/utils";

export interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  itemType: "PLANT" | "INVENTORY";
  plantCategory?: string;
  transactionType: "FIXED" | "NEGOTIABLE" | "TRADE";
  deliveryMethods: ("PICKUP" | "COURIER" | "MARSHRUTKA")[];
  images: string[];
  city: string;
  lat?: number;
  lng?: number;
  distanceKm?: number;
  isFeatured?: boolean;
  isPremium?: boolean;
  tradePreferences?: string[];
  viewsCount?: number;
  seller: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    rating: number;
    totalReviews: number;
    badges: string[];
    tier?: string;
    customSlug?: string;
  };
}

export function ListingCard({
  id,
  title,
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
  seller,
}: ListingCardProps) {
  const primaryImage = images?.[0] || "https://images.unsplash.com/photo-1545241047-6083a3684587?w=600&auto=format&fit=crop&q=80";
  const isVip = isFeatured || isPremium;

  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-[20px] bg-card transition-all duration-300 ${
      isVip 
        ? "border-2 border-amber-500/60 dark:border-amber-400/50 shadow-md ring-2 ring-amber-500/15" 
        : "border border-border/60 hover:border-primary/40 shadow-ambient hover:shadow-ambient-lg"
    }`}>
      {/* Image & Badges */}
      <Link href={`/listings/${id}`} className="relative aspect-[4/3] w-full overflow-hidden bg-surface-container block">
        <Image
          src={primaryImage}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Floating Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          {isVip && (
            <Badge
              className="backdrop-blur-md bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-[11px] px-2.5 py-0.5 shadow-sm rounded-[10px] flex items-center gap-1 border-0"
            >
              ⭐ VIP
            </Badge>
          )}

          <Badge
            className="backdrop-blur-md bg-background/90 text-foreground border border-border/50 shadow-sm font-semibold text-[11px] px-2.5 py-0.5 rounded-[10px]"
          >
            {itemType === "PLANT" ? "🌱 მცენარე" : "🪴 ინვენტარი"}
          </Badge>

          {transactionType === "TRADE" && (
            <Badge
              className="backdrop-blur-md bg-amber-500/90 text-white font-bold text-[11px] px-2.5 py-0.5 shadow-sm flex items-center gap-1 rounded-[10px]"
            >
              <RefreshCw className="w-3 h-3" />
              გაცვლა
            </Badge>
          )}

          {distanceKm !== undefined && (
            <Badge
              className="backdrop-blur-md bg-primary/90 text-white font-bold text-[11px] px-2.5 py-0.5 shadow-sm flex items-center gap-1 rounded-[10px]"
            >
              📍 {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} მ` : `${distanceKm} კმ`}
            </Badge>
          )}
        </div>

        {/* Photo Count Indicator */}
        <div className="absolute bottom-3 right-3 z-10 rounded-[10px] bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-medium text-white">
          📷 {images?.length || 1}
        </div>
      </Link>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Price & Location */}
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <div className="flex items-baseline gap-1.5">
            {transactionType === "TRADE" ? (
              <span className="inline-flex items-center px-3 py-1 rounded-[10px] bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-black">
                🔄 გაცვლა
              </span>
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-primary dark:text-primary-fixed">
                  {formatPrice(price)}
                </span>
                {transactionType === "NEGOTIABLE" && (
                  <span className="text-xs font-semibold text-muted-foreground">
                    (შეთანხმებით)
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 bg-surface-container px-2.5 py-1 rounded-[8px] font-semibold">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span>{city}</span>
            {distanceKm !== undefined && (
              <span className="text-primary font-bold ml-0.5">
                ({distanceKm < 1 ? `${Math.round(distanceKm * 1000)}მ` : `${distanceKm}კმ`})
              </span>
            )}
          </div>
        </div>

        {/* Listing Title */}
        <Link href={`/listings/${id}`} className="group-hover:text-primary transition-colors">
          <h3 className="line-clamp-2 text-sm sm:text-[15px] font-bold text-foreground leading-snug mb-3">
            {title}
          </h3>
        </Link>

        {/* Trade Preferences Tags if Trade */}
        {transactionType === "TRADE" && tradePreferences.length > 0 && (
          <div className="mb-3 rounded-[12px] bg-secondary-container/70 p-2.5 border border-border/40">
            <p className="text-xs font-bold text-on-secondary-container mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> იცვლება შემდეგში:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tradePreferences.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="rounded-[8px] bg-card px-2.5 py-1 text-xs font-bold text-foreground border border-border/60 shadow-2xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Delivery Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3.5">
          {deliveryMethods?.includes("PICKUP") && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-[8px] bg-surface-container text-muted-foreground font-semibold">
              📍 ადგილზე
            </span>
          )}
          {deliveryMethods?.includes("COURIER") && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-[8px] bg-secondary-container text-primary font-bold">
              <Truck className="w-3.5 h-3.5" /> კურიერი
            </span>
          )}
          {deliveryMethods?.includes("MARSHRUTKA") && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-[8px] bg-surface-container text-foreground font-semibold">
              🚐 სამარშრუტო
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="mt-auto border-t border-border/50 pt-3 flex items-center justify-between gap-2">
          {/* Seller Profile & Badges */}
          <Link
            href={seller.customSlug ? `/shops/${seller.customSlug}` : `/users/${seller.id}`}
            className="flex items-center gap-2.5 group/seller overflow-hidden"
          >
            <div className="relative h-7 w-7 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              {seller.avatarUrl ? (
                <Image
                  src={seller.avatarUrl}
                  alt={seller.fullName}
                  fill
                  className="rounded-full object-cover"
                />
              ) : (
                seller.fullName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-xs font-semibold group-hover/seller:text-primary transition-colors">
                {seller.fullName}
              </span>
              {seller.totalReviews > 0 ? (
                <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{seller.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({seller.totalReviews})</span>
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground">ახალი გამყიდველი</span>
              )}
            </div>
          </Link>

          {/* Gamified Badges */}
          {seller.badges && seller.badges.length > 0 && (
            <div className="flex items-center gap-1 shrink-0" title={seller.badges.join(", ")}>
              {seller.badges.includes("Trusted Seller") && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary-container text-primary text-[10px]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </span>
              )}
              {seller.badges.includes("Green Thumb") && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary-container text-primary text-[10px]">
                  <Sprout className="w-3.5 h-3.5" />
                </span>
              )}
              {seller.badges.includes("Swap Master") && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 text-[10px]">
                  <Award className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
