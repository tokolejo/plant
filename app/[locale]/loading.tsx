import React from "react";
import { Sprout } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 space-y-4">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sprout className="w-6 h-6 text-primary animate-pulse" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-xs font-bold text-foreground tracking-wide">Plantio.ge</p>
        <p className="text-[11px] text-muted-foreground animate-pulse">იტვირთება...</p>
      </div>
    </div>
  );
}
