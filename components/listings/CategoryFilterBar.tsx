"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePathname } from "@/i18n/routing";
import { 
  Sprout, 
  Layers, 
  Sparkles, 
  RefreshCw, 
  Truck, 
  SlidersHorizontal,
  Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
  { id: "all", labelKa: "ყველა", labelEn: "All", icon: Sparkles },
  { id: "plants-indoor", labelKa: "ოთახის მცენარეები", labelEn: "Indoor Plants", icon: Sprout, type: "PLANT" },
  { id: "plants-rare", labelKa: "იშვიათი & აროიდები", labelEn: "Rare & Aroids", icon: Flame, type: "PLANT" },
  { id: "plants-cuttings", labelKa: "კალმები & ფესვიანები", labelEn: "Cuttings", icon: Sprout, type: "PLANT" },
  { id: "inv-pots", labelKa: "ქოთნები & დეკორი", labelEn: "Pots & Planters", icon: Layers, type: "INVENTORY" },
  { id: "inv-soil", labelKa: "გრუნტი & სუბსტრატები", labelEn: "Soil & Substrates", icon: Layers, type: "INVENTORY" },
  { id: "inv-care", labelKa: "სასუქები & მოვლა", labelEn: "Fertilizers & Care", icon: Layers, type: "INVENTORY" },
  { id: "trade", labelKa: "მხოლოდ გაცვლა 🔄", labelEn: "Trade Only 🔄", icon: RefreshCw, isTrade: true },
];

function CategoryFilterBarContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "all";

  const handleSelect = (id: string, type?: string, isTrade?: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id === "all") {
      params.delete("category");
      params.delete("type");
      params.delete("transaction");
    } else if (isTrade) {
      params.set("transaction", "TRADE");
      params.delete("category");
    } else {
      params.set("category", id);
      if (type) params.set("type", type);
      params.delete("transaction");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2">
      <div className="flex items-center gap-2 min-w-max">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected =
            (cat.id === "all" && !searchParams.get("category") && !searchParams.get("transaction")) ||
            searchParams.get("category") === cat.id ||
            (cat.isTrade && searchParams.get("transaction") === "TRADE");

          return (
            <button
              key={cat.id}
              onClick={() => handleSelect(cat.id, cat.type, cat.isTrade)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-[20px] text-xs sm:text-sm font-bold transition-all duration-200 ${
                isSelected
                  ? "bg-primary text-white shadow-ambient scale-[1.02]"
                  : "bg-secondary-container/70 hover:bg-secondary-container text-foreground border border-border/50 hover:border-primary/40"
              }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? "text-primary-fixed" : "text-primary"}`} />
              <span>{cat.labelKa}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CategoryFilterBar() {
  return (
    <React.Suspense fallback={<div className="h-10 w-full" />}>
      <CategoryFilterBarContent />
    </React.Suspense>
  );
}
