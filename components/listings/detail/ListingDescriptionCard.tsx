"use client";

import * as React from "react";
import { FileText } from "lucide-react";

interface ListingDescriptionCardProps {
  description?: string;
  inventorySpecs?: Array<{ label: string; value: string }>;
  isKa?: boolean;
}

export function ListingDescriptionCard({
  description,
  inventorySpecs = [],
  isKa = true,
}: ListingDescriptionCardProps) {
  return (
    <div className="rounded-[22px] border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4">
      {/* ── Card Header ── */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-[10px] bg-primary/10 text-primary">
            <FileText className="w-4 h-4" />
          </div>
          <h3 className="text-xs sm:text-sm font-black text-foreground uppercase tracking-wider">
            {isKa ? "აღწერა და დეტალები" : "Description & Details"}
          </h3>
        </div>
      </div>

      {/* ── Description Content ── */}
      <div className="text-foreground/90 font-medium leading-relaxed whitespace-pre-wrap text-xs sm:text-sm">
        {description && description.trim().length > 0 ? (
          description
        ) : (
          <p className="text-muted-foreground italic text-xs">
            {isKa 
              ? "მფლობელს დამატებითი აღწერა არ მიუთითებია. დამატებითი ინფორმაციისთვის დაუკავშირდით პირდაპირ." 
              : "No additional description provided by the seller."}
          </p>
        )}
      </div>

      {/* ── Quick Specifications (For Inventory items) ── */}
      {inventorySpecs.length > 0 && (
        <div className="pt-3 border-t border-border/50 space-y-2">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            {isKa ? "სპეციფიკაციები:" : "Specifications:"}
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {inventorySpecs.map((spec, i) => (
              <div key={i} className="p-2.5 rounded-[12px] bg-secondary-container/50 border border-border/40">
                <span className="text-[10px] text-muted-foreground font-bold block uppercase">{spec.label}</span>
                <span className="text-xs font-extrabold text-foreground">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
