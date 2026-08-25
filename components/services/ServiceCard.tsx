"use client";

import * as React from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { 
  MapPin, 
  Star, 
  ShieldCheck, 
  Wrench, 
  TreePine, 
  Sparkles, 
  Layers, 
  Building2, 
  Droplets, 
  Stethoscope, 
  Sprout,
  Phone, 
  MessageSquare, 
  Camera,
  ChevronRight
} from "lucide-react";
import { type GardeningServiceItem } from "@/lib/mock-services";
import { Button } from "@/components/ui/button";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  PRUNING: TreePine,
  LANDSCAPE: Sparkles,
  LAWN: Layers,
  GREENING: Building2,
  IRRIGATION: Droplets,
  DOCTOR_VISIT: Stethoscope,
  TRANSPLANT: Sprout,
};

const CATEGORY_LABELS: Record<string, { ka: string; en: string }> = {
  PRUNING: { ka: "გასხვლა", en: "Pruning" },
  LANDSCAPE: { ka: "ლანდშაფტი", en: "Landscape" },
  LAWN: { ka: "გაზონი", en: "Lawn" },
  GREENING: { ka: "გამწვანება", en: "Greening" },
  IRRIGATION: { ka: "სარწყავი", en: "Irrigation" },
  DOCTOR_VISIT: { ka: "AI ექიმი", en: "Doctor" },
  TRANSPLANT: { ka: "გადარგვა", en: "Transplant" },
};

export interface ServiceCardProps {
  service: GardeningServiceItem;
  variant?: "compact" | "list" | "normal";
}

const DEFAULT_SERVICE_IMG = "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=80";

export function ServiceCard({ service, variant = "compact" }: ServiceCardProps) {
  const locale = useLocale();
  const isKa = locale !== "en";

  const CatIcon = CATEGORY_ICONS[service.category] || Wrench;
  const catLabel = CATEGORY_LABELS[service.category]?.[isKa ? "ka" : "en"] || service.category;
  const primaryImage = service.portfolio_images?.[0] || DEFAULT_SERVICE_IMG;
  const [imgSrc, setImgSrc] = React.useState(primaryImage);

  React.useEffect(() => {
    setImgSrc(service.portfolio_images?.[0] || DEFAULT_SERVICE_IMG);
  }, [service.portfolio_images]);

  // Clean concise city name matching ListingCard format
  const cleanCity = (service.city || (isKa ? "თბილისი" : "Tbilisi"))
    .replace(/\s*\(.*\)/, "")
    .split("&")[0]
    .split(",")[0]
    .trim();

  // ─── LIST VIEW LAYOUT ──────────────────────────────────────────────────────
  if (variant === "list") {
    return (
      <div className="relative flex flex-col sm:flex-row items-stretch overflow-hidden rounded-[20px] bg-card border border-border shadow-2xs hover:border-primary/50 transition-all">
        {/* Left Image */}
        <Link
          href={`/services/${service.id}`}
          className="relative w-full sm:w-48 md:w-56 shrink-0 aspect-[4/3] sm:aspect-auto overflow-hidden bg-surface-container block"
        >
          <Image
            src={imgSrc}
            alt=""
            fill
            onError={() => setImgSrc(DEFAULT_SERVICE_IMG)}
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 240px"
          />

          {/* Badge on Image */}
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1 z-10">
            <span className="backdrop-blur-md bg-background/90 text-primary text-[10px] font-bold px-2 py-0.5 rounded-[8px] border border-border/40 flex items-center gap-1">
              <CatIcon className="w-3 h-3 text-primary" />
              <span>{catLabel}</span>
            </span>
          </div>

          {service.portfolio_images && service.portfolio_images.length > 1 && (
            <div className="absolute bottom-2 right-2 z-10 rounded-[6px] bg-black/60 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-semibold text-white flex items-center gap-1">
              <Camera className="w-2.5 h-2.5" />
              <span>{service.portfolio_images.length}</span>
            </div>
          )}
        </Link>

        {/* Right Content */}
        <div className="flex flex-1 flex-col p-3.5 sm:p-4 justify-between">
          <div>
            {/* Top row: price and city */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-xl font-black tracking-tight text-primary dark:text-emerald-400">
                  {service.price_from} ₾
                </span>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  / {service.price_unit}
                </span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-1 text-xs text-slate-700 dark:text-slate-200 bg-surface-container px-2 py-0.5 rounded-[6px] font-bold border border-border/50 shrink-0">
                <MapPin className="w-3 h-3 text-primary" />
                <span>{cleanCity}</span>
              </div>
            </div>

            {/* Title */}
            <Link href={`/services/${service.id}`} className="block">
              <h3 className="text-sm sm:text-base font-bold text-foreground line-clamp-2 leading-snug mb-2 hover:text-primary transition-colors">
                {service.title}
              </h3>
            </Link>

            {/* Description Snippet */}
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {service.description}
            </p>
          </div>

          {/* Bottom Provider Info */}
          <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2.5 text-xs">
            <Link
              href={service.provider_slug ? `/shops/${service.provider_slug}` : (service.provider_id ? `/shops/${service.provider_id}` : `/shops/${encodeURIComponent(service.provider_name.toLowerCase().replace(/\s+/g, "-"))}`)}
              className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 hover:text-primary transition-colors truncate max-w-[140px]"
            >
              <div className="relative h-5 w-5 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-[10px]">
                {service.provider_avatar ? (
                  <Image src={service.provider_avatar} alt={service.provider_name} fill className="rounded-full object-cover" />
                ) : (
                  service.provider_name.charAt(0).toUpperCase()
                )}
              </div>
              <span className="truncate">{service.provider_name}</span>
              {service.is_verified && (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
            </Link>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-black flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                <span>{service.rating.toFixed(1)}</span>
                <span className="text-muted-foreground font-normal">({service.reviews_count})</span>
              </span>

              <Link
                href={`/services/${service.id}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-container px-2.5 py-1 rounded-[8px] bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <span>{isKa ? "ნახვა" : "View"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── COMPACT GRID VIEW (100% UNIFIED WITH LISTINGCARD & MARKET) ───────────
  return (
    <div className="relative flex flex-col overflow-hidden rounded-[18px] bg-card border border-border shadow-2xs hover:border-primary/40 hover:shadow-ambient transition-all duration-300">
      {/* Top Image — Edge-to-Edge 4:3 Ratio */}
      <Link href={`/services/${service.id}`} className="relative aspect-[4/3] w-full overflow-hidden bg-surface-container block">
        <Image
          src={imgSrc}
          alt=""
          fill
          onError={() => setImgSrc(DEFAULT_SERVICE_IMG)}
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Category Badge Top Left */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-10">
          <span className="backdrop-blur-md bg-background/90 text-primary border border-border/40 text-[10px] font-bold px-2 py-0.5 rounded-[7px] flex items-center gap-1 shadow-2xs">
            <CatIcon className="w-3 h-3 text-primary" />
            <span>{catLabel}</span>
          </span>
        </div>

        {/* Photo Count Bottom Right */}
        {service.portfolio_images && service.portfolio_images.length > 1 && (
          <div className="absolute bottom-2 right-2 z-10 rounded-[6px] bg-black/60 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-semibold text-white flex items-center gap-1">
            <Camera className="w-2.5 h-2.5" />
            <span>{service.portfolio_images.length}</span>
          </div>
        )}
      </Link>

      {/* Content Section — Compact & Tight Matching ListingCard */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        {/* Price & Location Row — No-wrap Layout */}
        <div className="flex items-center justify-between gap-1 mb-1.5 min-w-0">
          <div className="shrink-0 flex items-center gap-1 whitespace-nowrap">
            <div className="inline-flex items-baseline gap-1 whitespace-nowrap">
              <span className="text-base sm:text-lg font-black tracking-tight text-primary dark:text-emerald-400 whitespace-nowrap">
                {service.price_from} ₾
              </span>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                / {service.price_unit}
              </span>
            </div>
          </div>

          {/* Clean City with High Contrast */}
          <span 
            className="text-[11px] text-slate-700 dark:text-slate-200 font-bold truncate shrink-0 max-w-[85px] text-right"
            title={service.city}
          >
            {cleanCity}
          </span>
        </div>

        {/* Title — Strict 2 lines clamp */}
        <Link href={`/services/${service.id}`} className="mb-2 block">
          <h3 className="line-clamp-2 text-xs sm:text-[13px] font-bold text-foreground leading-snug min-h-[32px] hover:text-primary transition-colors">
            {service.title}
          </h3>
        </Link>

        {/* Bottom Specialist / Provider Row */}
        <div className="mt-auto border-t border-border/40 pt-2 flex items-center justify-between gap-1 text-[11px]">
          <Link
            href={service.provider_slug ? `/shops/${service.provider_slug}` : (service.provider_id ? `/shops/${service.provider_id}` : `/shops/${encodeURIComponent(service.provider_name.toLowerCase().replace(/\s+/g, "-"))}`)}
            className="flex items-center gap-1.5 truncate text-slate-700 dark:text-slate-300 hover:text-primary transition-colors font-bold"
          >
            <div className="relative h-4.5 w-4.5 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-[9px]">
              {service.provider_avatar ? (
                <Image src={service.provider_avatar} alt={service.provider_name} fill className="rounded-full object-cover" />
              ) : (
                service.provider_name.charAt(0).toUpperCase()
              )}
            </div>
            <span className="truncate max-w-[90px]">{service.provider_name}</span>
            {service.is_verified && (
              <span title={isKa ? "ვერიფიცირებული ოსტატი" : "Verified Specialist"} className="text-emerald-600 dark:text-emerald-400 shrink-0">
                <ShieldCheck className="w-3 h-3" />
              </span>
            )}
          </Link>

          {service.rating ? (
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-black shrink-0 flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
              <span>{service.rating.toFixed(1)}</span>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
