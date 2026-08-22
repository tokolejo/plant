"use client";

import * as React from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { MapPin, RefreshCw, Star, ShieldCheck, Sprout, Layers } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { ListingCardProps } from "./ListingCard";

/** Compact card for homepage grid — click goes to full listing page */
export function CompactListingCard({
  id,
  title,
  price,
  itemType,
  transactionType,
  images,
  city,
  seller,
}: ListingCardProps) {
  const primaryImage =
    images?.[0] ||
    "https://images.unsplash.com/photo-1545241047-6083a3684587?w=400&auto=format&fit=crop&q=80";

  return (
    <Link
      href={`/listings/${id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-200"
    >
      {/* Image — compact 1:1 square */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted/30">
        <Image
          src={primaryImage}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
        />

        {/* Type badge */}
        <div className="absolute top-1.5 left-1.5">
          <span className="inline-flex items-center gap-0.5 rounded-md bg-white/90 dark:bg-card/90 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-bold text-foreground shadow-sm border border-border/30">
            {itemType === "PLANT" ? (
              <Sprout className="w-2.5 h-2.5 text-emerald-600" />
            ) : (
              <Layers className="w-2.5 h-2.5 text-amber-600" />
            )}
          </span>
        </div>

        {/* Trade badge */}
        {transactionType === "TRADE" && (
          <div className="absolute top-1.5 right-1.5">
            <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
              <RefreshCw className="w-2.5 h-2.5" /> Trade
            </span>
          </div>
        )}

        {/* Price pill */}
        <div className="absolute bottom-1.5 right-1.5 rounded-md bg-black/75 backdrop-blur-sm px-2 py-0.5 text-[11px] font-black text-white shadow-sm">
          {transactionType === "TRADE" ? "Trade" : transactionType === "GIFT" || price === 0 || !price ? "უფასო" : formatPrice(price)}
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5 flex flex-col gap-1 flex-1">
        <h3 className="line-clamp-2 text-[11px] font-bold text-foreground leading-snug group-hover:text-emerald-600 transition-colors">
          {title}
        </h3>

        <div className="flex items-center justify-between mt-auto pt-1">
          {/* Seller */}
          <div className="flex items-center gap-1 min-w-0">
            <div className="h-4 w-4 shrink-0 rounded-full bg-emerald-600/15 text-emerald-700 flex items-center justify-center text-[8px] font-black overflow-hidden">
              {seller.avatarUrl ? (
                <img src={seller.avatarUrl} alt={seller.fullName} className="w-full h-full object-cover" />
              ) : (
                seller.fullName.charAt(0).toUpperCase()
              )}
            </div>
            <span className="text-[10px] text-slate-700 dark:text-slate-300 font-bold truncate max-w-[60px]">
              {seller.fullName.split(" ")[0]}
            </span>
          </div>

          {/* Location + rating */}
          <div className="flex items-center gap-1.5 shrink-0">
            {seller.totalReviews > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-black">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                {seller.rating.toFixed(1)}
              </span>
            )}
            <span className="flex items-center gap-0.5 text-[10px] text-slate-700 dark:text-slate-300 font-bold">
              <MapPin className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
              {city.split(" ")[0]}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
