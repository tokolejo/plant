import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | null | undefined, currency: string = "₾", isKa: boolean = true) {
  if (price === 0 || price === null || price === undefined) {
    return isKa ? "🎁 უფასო" : "🎁 Free";
  }
  return `${Number(price).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}\u00A0${currency}`;
}

export function getTierColor(tier: string) {
  switch (tier) {
    case "TIER_3":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    case "TIER_2":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    case "TIER_1":
      return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
    default:
      return "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30";
  }
}

/**
 * Calculates geodesic distance between two GPS coordinates in Kilometers using Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}
