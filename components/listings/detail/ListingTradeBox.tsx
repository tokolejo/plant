"use client";

import * as React from "react";
import { RefreshCw, Sprout } from "lucide-react";

function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

interface ListingTradeBoxProps {
  tradePreferences?: string[];
  whatsappUrl?: string;
  onProposeTrade?: () => void;
  isKa?: boolean;
}

export function ListingTradeBox({
  tradePreferences = [],
  whatsappUrl,
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

      {/* Quick WhatsApp Swap Proposal Link */}
      {whatsappUrl ? (
        <div className="pt-1">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-10 rounded-[12px] bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
          >
            <WhatsAppIcon className="w-4 h-4 fill-current" />
            <span>{isKa ? "გაცვლის შეთავაზება WhatsApp-ში" : "Propose Swap on WhatsApp"}</span>
          </a>
        </div>
      ) : onProposeTrade ? (
        <div className="pt-1">
          <button
            type="button"
            onClick={onProposeTrade}
            className="w-full h-10 rounded-[12px] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{isKa ? "გაცვლის შეთავაზება" : "Propose Swap"}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
