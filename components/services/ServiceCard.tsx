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

export function ServiceCard({ service, variant = "compact" }: ServiceCardProps) {
  const locale = useLocale();
  const isKa = locale !== "en";

  const CatIcon = CATEGORY_ICONS[service.category] || Wrench;
  const catLabel = CATEGORY_LABELS[service.category]?.[isKa ? "ka" : "en"] || service.category;
  const primaryImage = service.portfolio_images?.[0] || "https://images.unsplash.com/photo-1558904541-efa8c4a08931?w=600&auto=format&fit=crop&q=80";

  // LIST VIEW LAYOUT
  if (variant === "list") {
    return (
      <div className="group relative flex flex-col sm:flex-row bg-card border border-border/80 hover:border-primary/50 rounded-[22px] overflow-hidden shadow-2xs hover:shadow-ambient transition-all duration-300">
        {/* Left: Image Container */}
        <Link
          href={`/services/${service.id}`}
          className="relative sm:w-64 h-48 sm:h-auto shrink-0 overflow-hidden bg-surface-container block"
        >
          <Image
            src={primaryImage}
            alt={service.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, 256px"
          />
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
            <span className="px-2.5 py-0.5 rounded-full bg-black/65 backdrop-blur-md text-white text-[10px] font-black border border-white/20 flex items-center gap-1">
              <CatIcon className="w-3 h-3 text-emerald-400" />
              <span>{catLabel}</span>
            </span>
          </div>

          {service.portfolio_images && service.portfolio_images.length > 1 && (
            <div className="absolute bottom-2.5 right-2.5 z-10">
              <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1">
                <Camera className="w-3 h-3" />
                <span>{service.portfolio_images.length}</span>
              </span>
            </div>
          )}
        </Link>

        {/* Right: Content */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            {/* Provider & City Row */}
            <div className="flex items-center justify-between gap-2">
              <Link 
                href={service.provider_slug ? `/shops/${service.provider_slug}` : (service.provider_id ? `/shops/${service.provider_id}` : `/shops/${encodeURIComponent(service.provider_name.toLowerCase().replace(/\s+/g, "-"))}`)}
                className="flex items-center gap-2 min-w-0 hover:text-primary transition-colors group/prov"
              >
                {service.provider_avatar ? (
                  <img
                    src={service.provider_avatar}
                    alt={service.provider_name}
                    className="h-7 w-7 rounded-full object-cover border border-border shrink-0 group-hover/prov:ring-2 group-hover/prov:ring-primary/40 transition-all"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-[11px] shrink-0 group-hover/prov:bg-primary group-hover/prov:text-white transition-all">
                    {service.provider_name.charAt(0)}
                  </div>
                )}
                <span className="text-xs font-black text-foreground group-hover/prov:text-primary truncate">
                  {service.provider_name}
                </span>
                {service.is_verified && (
                  <span title={isKa ? "ვერიფიცირებული ოსტატი" : "Verified Specialist"}>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  </span>
                )}
              </Link>

              <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold shrink-0">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
                <span>{service.rating.toFixed(1)}</span>
                <span className="text-muted-foreground font-normal">({service.reviews_count})</span>
              </div>
            </div>

            {/* Title & Description */}
            <Link href={`/services/${service.id}`} className="block group-hover:text-primary transition-colors">
              <h3 className="text-sm sm:text-base font-black text-foreground leading-snug line-clamp-1">
                {service.title}
              </h3>
            </Link>

            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {service.description}
            </p>
          </div>

          {/* Bottom Pricing & Actions */}
          <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                  {isKa ? "საწყისი ფასი" : "Price From"}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                    {service.price_from} ₾
                  </span>
                  <span className="text-xs text-muted-foreground">/ {service.price_unit}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-bold">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{service.city}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${service.phone}`}
                className="h-9 px-3 rounded-[12px] bg-secondary-container/80 hover:bg-secondary-container text-foreground text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-border/40"
              >
                <Phone className="w-3.5 h-3.5 text-primary" />
                <span>{isKa ? "დარეკვა" : "Call"}</span>
              </a>

              {service.whatsapp ? (
                <a
                  href={`https://wa.me/${service.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`გამარჯობა, დავინტერესდი თქვენი სერვისით Plant.ge-ზე: „${service.title}“`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 px-3 rounded-[12px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              ) : (
                <Link href={`/services/${service.id}`}>
                  <Button size="sm" className="h-9 rounded-[12px] text-xs font-bold bg-primary text-white">
                    {isKa ? "დეტალები" : "Details"}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // COMPACT & NORMAL GRID VIEW LAYOUT
  return (
    <div className="group relative flex flex-col justify-between bg-card border border-border/80 hover:border-primary/50 rounded-[24px] overflow-hidden shadow-2xs hover:shadow-ambient transition-all duration-300">
      {/* Top Media & Badges */}
      <div className="space-y-3 p-4 sm:p-5">
        <Link
          href={`/services/${service.id}`}
          className="relative w-full h-48 rounded-[18px] overflow-hidden bg-surface-container block border border-border/60"
        >
          <Image
            src={primaryImage}
            alt={service.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          {/* Top Badges */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
            <span className="px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-[10px] font-black border border-white/20 flex items-center gap-1">
              <CatIcon className="w-3 h-3 text-emerald-400" />
              <span>{catLabel}</span>
            </span>
          </div>

          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-[10px] font-bold border border-white/20 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-400" />
              <span>{service.city}</span>
            </span>
          </div>

          {service.portfolio_images && service.portfolio_images.length > 1 && (
            <div className="absolute bottom-2.5 right-2.5 z-10">
              <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1">
                <Camera className="w-3 h-3" />
                <span>{service.portfolio_images.length}</span>
              </span>
            </div>
          )}
        </Link>

        {/* Provider Profile Header */}
        <div className="flex items-center justify-between gap-2">
          <Link
            href={service.provider_slug ? `/shops/${service.provider_slug}` : (service.provider_id ? `/shops/${service.provider_id}` : `/shops/${encodeURIComponent(service.provider_name.toLowerCase().replace(/\s+/g, "-"))}`)}
            className="flex items-center gap-2.5 min-w-0 hover:text-primary transition-colors group/prov"
          >
            {service.provider_avatar ? (
              <img
                src={service.provider_avatar}
                alt={service.provider_name}
                className="h-8 w-8 rounded-full object-cover border border-border shrink-0 shadow-2xs group-hover/prov:ring-2 group-hover/prov:ring-primary/40 transition-all"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0 group-hover/prov:bg-primary group-hover/prov:text-white transition-all">
                {service.provider_name.charAt(0)}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-black text-foreground group-hover/prov:text-primary truncate">
                  {service.provider_name}
                </span>
                {service.is_verified && (
                  <span title={isKa ? "ვერიფიცირებული ოსტატი" : "Verified Specialist"}>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  </span>
                )}
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold shrink-0">
            <Star className="w-3.5 h-3.5 fill-amber-500" />
            <span>{service.rating.toFixed(1)}</span>
            <span className="text-muted-foreground font-normal">({service.reviews_count})</span>
          </div>
        </div>

        {/* Service Title & Desc */}
        <div>
          <Link href={`/services/${service.id}`} className="block group-hover:text-primary transition-colors">
            <h3 className="text-sm font-black text-foreground leading-snug line-clamp-2">
              {service.title}
            </h3>
          </Link>
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
            {service.description}
          </p>
        </div>
      </div>

      {/* Bottom: Pricing & Direct Actions */}
      <div className="p-4 sm:p-5 pt-0 space-y-3">
        <div className="pt-3 border-t border-border/50 flex items-baseline justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {isKa ? "საწყისი ფასი" : "Starting Price"}
          </span>
          <div className="text-right">
            <span className="text-base font-black text-emerald-700 dark:text-emerald-300">
              {service.price_from} ₾
            </span>
            <span className="text-xs text-muted-foreground ml-1">/ {service.price_unit}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`tel:${service.phone}`}
            className="h-9 px-3 rounded-[12px] bg-secondary-container/70 hover:bg-secondary-container text-foreground text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-border/40"
          >
            <Phone className="w-3.5 h-3.5 text-primary" />
            <span>{isKa ? "დარეკვა" : "Call"}</span>
          </a>

          {service.whatsapp ? (
            <a
              href={`https://wa.me/${service.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`გამარჯობა, დავინტერესდი თქვენი სერვისით Plant.ge-ზე: „${service.title}“`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-3 rounded-[12px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          ) : (
            <Link
              href={`/services/${service.id}`}
              className="h-9 px-3 rounded-[12px] bg-primary hover:bg-primary/90 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <span>{isKa ? "დეტალები" : "Details"}</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
