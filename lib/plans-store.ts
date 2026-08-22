"use client";

import * as React from "react";
import { createClient } from "@/utils/supabase/client";

export interface SubscriptionPlanItem {
  id: string;
  nameKa: string;
  nameEn: string;
  tier: string;
  monthlyPrice: number;
  yearlyPrice: number;
  discountPercent?: number; // e.g. 20 for 20% discount on yearly
  listingLimit: number;
  vipSlots: number;
  customSlug: boolean;
  autoStaleHideDays?: number;
  badge?: string;
  isActive: boolean;
  sortOrder: number;
  featuresKa: string[];
  featuresEn: string[];
}

export const DEFAULT_PLANS: SubscriptionPlanItem[] = [
  {
    id: "FREE",
    tier: "FREE",
    nameKa: "უფასო (Free)",
    nameEn: "Free Tier",
    monthlyPrice: 0,
    yearlyPrice: 0,
    discountPercent: 0,
    listingLimit: 5,
    vipSlots: 0,
    customSlug: false,
    autoStaleHideDays: 30,
    isActive: true,
    sortOrder: 1,
    featuresKa: [
      "5 აქტიური განცხადება",
      "მცენარეების გაცვლის დაფა",
      "Live ჩატი მყიდველებთან",
      "2-5 ფოტოს ატვირთვა",
      "სტანდარტული მხარდაჭერა",
    ],
    featuresEn: [
      "5 active listings",
      "Plant Exchange Board",
      "Live Chat with buyers",
      "2-5 photos per listing",
      "Standard support",
    ],
  },
  {
    id: "TIER_1",
    tier: "TIER_1",
    nameKa: "მოყვარული (Tier 1)",
    nameEn: "Enthusiast (Tier 1)",
    monthlyPrice: 15,
    yearlyPrice: 144,
    discountPercent: 20,
    listingLimit: 25,
    vipSlots: 2,
    customSlug: false,
    autoStaleHideDays: 30,
    badge: "პოპულარული",
    isActive: true,
    sortOrder: 2,
    featuresKa: [
      "25 აქტიური განცხადება",
      "პრიორიტეტი ძიების შედეგებში",
      "2 VIP ბუსტი / თვეში",
      "Trusted Enthusiast ბეიჯი",
      "გაფართოებული სტატისტიკა",
    ],
    featuresEn: [
      "25 active listings",
      "Priority search placement",
      "2 VIP Boosts / month",
      "Trusted Enthusiast badge",
      "Advanced stats",
    ],
  },
  {
    id: "TIER_2",
    tier: "TIER_2",
    nameKa: "ორანჟერეა (Tier 2)",
    nameEn: "Nursery / GreenHouse (Tier 2)",
    monthlyPrice: 39,
    yearlyPrice: 374,
    discountPercent: 20,
    listingLimit: 100,
    vipSlots: 5,
    customSlug: true,
    autoStaleHideDays: 30,
    badge: "საუკეთესო მაღაზიებისთვის",
    isActive: true,
    sortOrder: 3,
    featuresKa: [
      "100 აქტიური განცხადება",
      "Custom Shop URL (plant.ge/username)",
      "5 VIP ბუსტი / თვეში",
      "Verified მაღაზიის მწვანე ბეიჯი",
      "სრული ანალიტიკა და ბანერი",
    ],
    featuresEn: [
      "100 active listings",
      "Custom Shop URL (plant.ge/username)",
      "5 VIP Boosts / month",
      "Verified Nursery green badge",
      "Full analytics & shop banner",
    ],
  },
  {
    id: "TIER_3",
    tier: "TIER_3",
    nameKa: "პრო ბიზნესი (Tier 3)",
    nameEn: "Pro Business (Tier 3)",
    monthlyPrice: 89,
    yearlyPrice: 854,
    discountPercent: 20,
    listingLimit: 999999,
    vipSlots: 15,
    customSlug: true,
    autoStaleHideDays: 30,
    badge: "VIP ბიზნესი",
    isActive: true,
    sortOrder: 4,
    featuresKa: [
      "შეუზღუდავი განცხადებები",
      "VIP მხარდაჭერა 24/7",
      "B2B Storefront & SEO პრიორიტეტი",
      "15 VIP ბუსტი / თვეში",
      "ავტომატური ინვოისინგი & VIP მენეჯერი",
    ],
    featuresEn: [
      "Unlimited active listings",
      "VIP Support 24/7",
      "B2B Storefront & SEO priority",
      "15 VIP Boosts / month",
      "Automated invoicing & VIP manager",
    ],
  },
];

const STORAGE_KEY = "plantsale_subscription_plans_v2";
const EVENT_NAME = "plantsale_plans_updated";

export function getStoredPlans(): SubscriptionPlanItem[] {
  if (typeof window === "undefined") return DEFAULT_PLANS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PLANS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PLANS;
  } catch (e) {
    return DEFAULT_PLANS;
  }
}

export function saveStoredPlans(plans: SubscriptionPlanItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: plans }));
  } catch (e) {
    console.error("Failed to save plans locally", e);
  }
}

/**
 * Fetch plans from Supabase and sync to local store
 */
export async function fetchAndSyncDbPlans(): Promise<SubscriptionPlanItem[]> {
  try {
    const supabase = createClient();
    const { data: dbPlans, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error || !dbPlans || dbPlans.length === 0) {
      return getStoredPlans();
    }

    const mapped: SubscriptionPlanItem[] = dbPlans.map((p: any) => {
      const rawFeatures = Array.isArray(p.features) ? p.features : [];
      const mPrice = parseFloat(p.price_monthly || "0");
      const yPrice = parseFloat(p.price_yearly || "0");
      
      // Calculate or read discount
      let discount = 20;
      if (mPrice > 0 && yPrice > 0) {
        discount = Math.max(0, Math.round((1 - (yPrice / (mPrice * 12))) * 100));
      }

      return {
        id: p.id || p.tier,
        tier: p.tier || "FREE",
        nameKa: p.name_ka || p.name || "ტარიფი",
        nameEn: p.name_en || "Plan",
        monthlyPrice: mPrice,
        yearlyPrice: yPrice,
        discountPercent: mPrice > 0 ? discount : 0,
        listingLimit: parseInt(p.listing_limit || "5"),
        vipSlots: parseInt(p.vip_slots || "0"),
        customSlug: p.listing_limit >= 50,
        badge: p.tier === "TIER_1" ? "პოპულარული" : p.tier === "TIER_2" ? "საუკეთესო მაღაზიებისთვის" : p.tier === "TIER_3" ? "VIP ბიზნესი" : undefined,
        isActive: p.is_active !== false,
        sortOrder: p.sort_order || 1,
        featuresKa: rawFeatures.length > 0 ? rawFeatures : [`${p.listing_limit} აქტიური განცხადება`],
        featuresEn: rawFeatures.length > 0 ? rawFeatures : [`${p.listing_limit} active listings`],
      };
    });

    saveStoredPlans(mapped);
    return mapped;
  } catch (e) {
    console.error("Error fetching DB plans:", e);
    return getStoredPlans();
  }
}

export function useSubscriptionPlans() {
  const [plans, setPlans] = React.useState<SubscriptionPlanItem[]>(DEFAULT_PLANS);

  React.useEffect(() => {
    // 1. Load cached/default immediately
    setPlans(getStoredPlans());

    // 2. Fetch live from Supabase
    fetchAndSyncDbPlans().then((livePlans) => {
      if (livePlans && livePlans.length > 0) {
        setPlans(livePlans);
      }
    });

    // 3. Listen for live updates across components
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setPlans(e.detail);
      } else {
        setPlans(getStoredPlans());
      }
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return plans;
}
