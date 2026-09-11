"use client";

import * as React from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { 
  ShieldCheck, 
  CheckCircle2, 
  Star, 
  Clock, 
  Store, 
  ExternalLink,
  Award,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UnifiedSellerCardProps {
  id: string;
  name: string;
  avatar?: string;
  rating?: number;
  reviewsCount?: number;
  isVerified?: boolean;
  isPro?: boolean;
  responseTime?: string;
  badgeLabel?: string;
  shopUrl?: string;
  actionLabel?: string;
  experienceYears?: number;
  isOnVacation?: boolean;
  isKa?: boolean;
}

export function UnifiedSellerCard({
  id,
  name,
  avatar,
  rating = 5.0,
  reviewsCount = 0,
  isVerified = false,
  isPro = false,
  responseTime,
  badgeLabel,
  shopUrl,
  actionLabel,
  experienceYears,
  isOnVacation = false,
  isKa = true,
}: UnifiedSellerCardProps) {
  const safeAvatar = avatar && avatar.trim().length > 0 
    ? avatar 
    : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(id || name || "plantio")}`;

  return (
    <div className="rounded-[20px] border border-border/70 bg-card p-4 shadow-2xs space-y-3">
      {/* Vacation Notice */}
      {isOnVacation && (
        <div className="flex items-center gap-2 p-2.5 rounded-[12px] bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
          <span>
            {isKa 
              ? "ავტორი იმყოფება შვებულებაში — შეკვეთების დამუშავება დროებით შეჩერებულია."
              : "Seller is currently on vacation — inquiries may experience delays."}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        {/* Left: Avatar & Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border border-border/80 bg-secondary-container">
            <Image
              src={safeAvatar}
              alt={name}
              fill
              className="object-cover"
              sizes="48px"
            />
            {isVerified && (
              <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-700 text-white flex items-center justify-center ring-2 ring-card shadow-xs">
                <CheckCircle2 className="w-3 h-3 stroke-[3]" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-sm text-foreground truncate">
                {name}
              </span>
              {isPro && (
                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-black px-1.5 py-0 h-4">
                  PRO
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
              <span className="flex items-center gap-1 font-bold text-foreground">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{rating ? rating.toFixed(1) : "5.0"}</span>
                {reviewsCount > 0 && (
                  <span className="font-medium text-muted-foreground">({reviewsCount})</span>
                )}
              </span>

              {experienceYears && experienceYears > 0 && (
                <>
                  <span className="text-border">•</span>
                  <span className="font-medium">
                    {experienceYears} {isKa ? "წლიანი გამოცდილება" : "yrs exp"}
                  </span>
                </>
              )}

              {responseTime && (
                <>
                  <span className="text-border">•</span>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                    <span>{responseTime}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Profile / Shop Link */}
        {shopUrl && (
          <Link
            href={shopUrl}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-xs font-bold bg-secondary-container/80 hover:bg-secondary-container text-foreground transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Store className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">
              {actionLabel || (isKa ? "მაღაზია" : "Shop")}
            </span>
          </Link>
        )}
      </div>

      {/* Trust Badge Banner */}
      {badgeLabel && (
        <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
          <div className="inline-flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-[10px] border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>{badgeLabel}</span>
          </div>

          <span className="text-[11px] text-muted-foreground font-medium">
            {isKa ? "შემოწმებული პროფილი" : "Verified Profile"}
          </span>
        </div>
      )}
    </div>
  );
}
