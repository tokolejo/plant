import React from "react";

export function ReviewsSkeleton() {
  return (
    <div className="bg-card rounded-[24px] border border-border/80 p-5 sm:p-6 shadow-ambient space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 w-44 bg-surface-container rounded-lg" />
        <div className="h-5 w-16 bg-surface-container rounded-lg" />
      </div>
      <div className="space-y-3 pt-2">
        {[1, 2].map((i) => (
          <div key={i} className="p-3.5 rounded-[16px] bg-secondary-container/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 bg-surface-container rounded-md" />
              <div className="h-3 w-16 bg-surface-container rounded-md" />
            </div>
            <div className="h-3 w-full bg-surface-container rounded-md" />
            <div className="h-3 w-2/3 bg-surface-container rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RecommendedInventorySkeleton() {
  return (
    <div className="bg-card rounded-[24px] border border-border/80 p-5 sm:p-6 shadow-ambient space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-5 w-56 bg-surface-container rounded-lg" />
          <div className="h-3 w-72 bg-surface-container rounded-md" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-[18px] border border-border/60 bg-card p-3 space-y-2">
            <div className="h-28 w-full bg-surface-container rounded-[14px]" />
            <div className="h-4 w-20 bg-surface-container rounded-md" />
            <div className="h-4 w-12 bg-surface-container rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RelatedPlantsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-48 bg-surface-container rounded-lg" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-64 rounded-[22px] bg-card border border-border/60 p-3 space-y-3">
            <div className="h-36 w-full bg-surface-container rounded-[16px]" />
            <div className="h-4 w-3/4 bg-surface-container rounded-md" />
            <div className="h-4 w-1/3 bg-surface-container rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
