"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const BotanicalMap = dynamic(() => import("@/components/map/BotanicalMap"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center w-full h-[calc(100vh-5rem)] bg-background text-muted-foreground gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm font-bold text-foreground">იტვირთება ბოტანიკური რუკა...</p>
    </div>
  ),
});

export default function MapMarketplacePage() {
  return (
    <div className="w-full h-[calc(100vh-5rem)] overflow-hidden">
      <BotanicalMap />
    </div>
  );
}
