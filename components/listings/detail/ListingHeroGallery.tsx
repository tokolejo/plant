"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, X, Gift, RefreshCw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ListingHeroGalleryProps {
  images: string[];
  title: string;
  activeBadge?: "VIP" | "GIFT" | "TRADE" | null;
  isKa?: boolean;
}

export function ListingHeroGallery({
  images,
  title,
  activeBadge,
  isKa = true,
}: ListingHeroGalleryProps) {
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);

  const safeImages = images && images.length > 0 
    ? images 
    : ["/images/placeholder-plant.jpg"];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev > 0 ? prev - 1 : safeImages.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev < safeImages.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="space-y-3">
      {/* Main 4:3 Image Stage */}
      <div 
        onClick={() => setLightboxOpen(true)}
        className="group relative aspect-[4/3] w-full overflow-hidden rounded-[22px] bg-secondary-container/40 border border-border/70 shadow-xs cursor-zoom-in"
      >
        <Image
          src={safeImages[activeIdx]}
          alt={`${title} - photo ${activeIdx + 1}`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 58vw, 700px"
          priority
        />

        {/* Minimalist Status Badge (Top-Left) */}
        {activeBadge && (
          <div className="absolute top-3 left-3 z-10">
            {activeBadge === "VIP" && (
              <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-xs px-2.5 py-1 rounded-[10px] shadow-sm border-0 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> VIP TOP
              </Badge>
            )}
            {activeBadge === "GIFT" && (
              <Badge className="bg-emerald-600 text-white font-black text-xs px-2.5 py-1 rounded-[10px] shadow-sm border-0 flex items-center gap-1">
                <Gift className="w-3.5 h-3.5" /> {isKa ? "გაჩუქება" : "Giveaway"}
              </Badge>
            )}
            {activeBadge === "TRADE" && (
              <Badge className="bg-indigo-600 text-white font-black text-xs px-2.5 py-1 rounded-[10px] shadow-sm border-0 flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5" /> {isKa ? "გაცვლა" : "Trade"}
              </Badge>
            )}
          </div>
        )}

        {/* Photo Counter + Zoom Pill (Bottom-Right) */}
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold shadow-xs">
          <span>{activeIdx + 1} / {safeImages.length}</span>
          <Maximize2 className="w-3 h-3 opacity-75 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Previous / Next Arrows */}
        {safeImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Track */}
      {safeImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar pt-0.5">
          {safeImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIdx(idx)}
              aria-label={`View photo ${idx + 1}`}
              className={`relative aspect-[4/3] w-16 sm:w-20 shrink-0 overflow-hidden rounded-[12px] border-2 transition-all cursor-pointer ${
                activeIdx === idx
                  ? "border-primary shadow-xs scale-105"
                  : "border-transparent opacity-65 hover:opacity-100"
              }`}
            >
              <Image 
                src={img} 
                alt="" 
                fill 
                className="object-cover" 
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div 
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md z-50 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[85vh] aspect-[4/3] sm:aspect-[16/10]"
          >
            <Image
              src={safeImages[activeIdx]}
              alt={title}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          {safeImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-lg cursor-pointer"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-lg cursor-pointer"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            </>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm font-semibold bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
            {activeIdx + 1} / {safeImages.length}
          </div>
        </div>
      )}
    </div>
  );
}
