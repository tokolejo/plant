"use client";

import * as React from "react";
import { RefreshCw, ArrowRightLeft, Sparkles, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ListingTradeBoxProps {
  tradePreferences?: string[];
  onProposeTrade?: () => void;
  isKa?: boolean;
}

export function ListingTradeBox({
  tradePreferences = [],
  onProposeTrade,
  isKa = true,
}: ListingTradeBoxProps) {
  return (
    <div className="rounded-[20px] border border-indigo-500/25 bg-indigo-500/[0.04] dark:bg-indigo-950/20 p-4 sm:p-5 space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-500/15 text-indigo-800 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground">
              {isKa ? "გაცვლის პირობები (ISO)" : "Trade Preferences (ISO)"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isKa 
                ? "მფლობელს სურს ამ მცენარის გაცვლა შემდეგ ვარიანტებში:"
                : "The owner is seeking to swap for the following plants:"}
            </p>
          </div>
        </div>
      </div>

      {/* Seeking Chips */}
      {tradePreferences.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-0.5">
          {tradePreferences.map((pref, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 shadow-2xs"
            >
              <Sprout className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              {pref}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic bg-secondary-container/50 px-3 py-2 rounded-[12px]">
          {isKa 
            ? "მფლობელს კონკრეტული სია არ მიუთითებია — განიხილავს ნებისმიერ საინტერესო შემოთავაზებას."
            : "No specific plants listed — open to any fair swap proposals."}
        </p>
      )}

      {/* Propose Action */}
      {onProposeTrade && (
        <div className="pt-1">
          <Button
            type="button"
            onClick={onProposeTrade}
            className="w-full h-10 rounded-[12px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>{isKa ? "გაცვლის შეთავაზება (ონლაინ)" : "Propose a Plant Swap"}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
