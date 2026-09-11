"use client";

import * as React from "react";
import { 
  Sun, 
  Droplets, 
  Boxes, 
  Thermometer, 
  Sparkles, 
  ShieldCheck,
  Sprout
} from "lucide-react";
import { PlantCareInfo } from "@/lib/botanical-care";

interface PlantCareGuideCardProps {
  careInfo?: PlantCareInfo;
  listing?: any;
  categoryLabel?: string;
  isKa?: boolean;
  className?: string;
}

export function PlantCareGuideCard({
  careInfo,
  listing,
  categoryLabel,
  isKa = true,
  className = "",
}: PlantCareGuideCardProps) {
  const isInventory = listing?.itemType === "INVENTORY" || listing?.item_type === "INVENTORY";
  if (!careInfo || isInventory) {
    return null;
  }

  // Parse "value (hint)" patterns
  const parseMetric = (rawText?: string, defaultHint?: string) => {
    if (!rawText) return { value: isKa ? "ზომიერი" : "Moderate", hint: defaultHint || "" };
    const match = rawText.match(/^([^(]+)(?:\((.*)\))?$/);
    const value = match?.[1]?.trim() || rawText;
    const hint = match?.[2]?.trim() || defaultHint || "";
    return { value, hint };
  };

  const light = parseMetric(
    listing?.light_requirement || (isKa ? careInfo.lightKa : careInfo.lightEn),
    isKa ? "მოარიდეთ მწველ მზეს" : "Avoid direct midday sun"
  );
  const water = parseMetric(
    listing?.watering_schedule || (isKa ? careInfo.wateringKa : careInfo.wateringEn),
    isKa ? "ზედაპირის შეშრობისას" : "When topsoil dries"
  );
  const soil = parseMetric(
    isKa ? careInfo.soilKa : careInfo.soilEn,
    isKa ? "ფხვიერი & დრენირებადი" : "Airy & well-draining"
  );
  const temp = parseMetric(
    isKa ? careInfo.tempKa : careInfo.tempEn,
    isKa ? "მოარიდეთ ორპირ ქარს" : "Protect from cold drafts"
  );
  const humidity = parseMetric(
    isKa ? careInfo.humidityKa : careInfo.humidityEn,
    isKa ? "რეკომენდებულია დანამვა" : "Mist leaves occasionally"
  );
  const careLevel = parseMetric(
    listing?.care_difficulty || (isKa ? careInfo.careLevelKa : careInfo.careLevelEn),
    isKa ? "იდეალურია სახლისთვის" : "Great for indoors"
  );

  const rows = [
    {
      key: "light",
      icon: Sun,
      title: isKa ? "მზის განათება" : "Lighting",
      value: light.value,
      hint: light.hint,
      iconClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20",
      badgeClass: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/25",
    },
    {
      key: "water",
      icon: Droplets,
      title: isKa ? "მორწყვის გრაფიკი" : "Watering",
      value: water.value,
      hint: water.hint,
      iconClass: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20",
      badgeClass: "bg-sky-500/10 text-sky-800 dark:text-sky-300 border border-sky-500/25",
    },
    {
      key: "soil",
      icon: Boxes,
      title: isKa ? "სუბსტრატი & გრუნტი" : "Substrate & Soil",
      value: soil.value,
      hint: soil.hint,
      iconClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
      badgeClass: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25",
    },
    {
      key: "temp",
      icon: Thermometer,
      title: isKa ? "ტემპერატურა" : "Temperature",
      value: temp.value,
      hint: temp.hint,
      iconClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20",
      badgeClass: "bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/25",
    },
    {
      key: "humidity",
      icon: Sparkles,
      title: isKa ? "ჰაერის ტენიანობა" : "Air Humidity",
      value: humidity.value,
      hint: humidity.hint,
      iconClass: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
      badgeClass: "bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 border border-indigo-500/25",
    },
    {
      key: "careLevel",
      icon: ShieldCheck,
      title: isKa ? "მოვლის სირთულე" : "Care Level",
      value: careLevel.value,
      hint: careLevel.hint,
      iconClass: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20",
      badgeClass: "bg-teal-500/10 text-teal-800 dark:text-teal-300 border border-teal-500/25",
    },
  ];

  const familyName = careInfo.scientificFamily || listing?.botanical_name || listing?.botanicalName;

  return (
    <div className={`rounded-[22px] border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-3.5 ${className}`}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sprout className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-foreground">
              {isKa ? "მცენარის მოვლის გზამკვლევი" : "Botanical Care Guide"}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {isKa ? "ოპტიმალური პირობები ჯანსაღი ზრდისთვის" : "Optimal conditions for healthy growth"}
            </p>
          </div>
        </div>

        {/* Family Badge */}
        {(familyName || categoryLabel) && (
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-secondary-container text-foreground border border-border/60 shrink-0">
            {familyName ? (isKa ? `ოჯახი: ${familyName}` : `Family: ${familyName}`) : categoryLabel}
          </span>
        )}
      </div>

      {/* ── Compact 1-Per-Line Rows ("თითო ხაზზე თითო") ── */}
      <div className="space-y-1.5">
        {rows.map((r) => {
          const Icon = r.icon;
          return (
            <div
              key={r.key}
              className="flex items-center justify-between gap-2 py-2 px-3 rounded-[12px] bg-secondary-container/30 hover:bg-secondary-container/50 border border-border/40 transition-colors"
            >
              {/* Left: Icon & Title */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-7 h-7 rounded-[9px] flex items-center justify-center shrink-0 ${r.iconClass}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-foreground truncate">
                  {r.title}
                </span>
              </div>

              {/* Right: Hint (desktop) + High-Contrast Badge */}
              <div className="flex items-center gap-2 shrink-0">
                {r.hint && (
                  <span className="hidden md:inline-block text-[11px] font-medium text-muted-foreground truncate max-w-[200px]">
                    {r.hint}
                  </span>
                )}
                <span className={`px-2.5 py-0.5 rounded-[8px] text-xs font-extrabold shadow-2xs whitespace-nowrap ${r.badgeClass}`}>
                  {r.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
