"use client";

import * as React from "react";

export interface SubscriptionPlanItem {
  id: "FREE" | "TIER_1" | "TIER_2" | "TIER_3";
  nameKa: string;
  nameEn: string;
  monthlyPrice: number;
  yearlyPrice: number;
  listingLimit: number;
  customSlug: boolean;
  autoStaleHideDays: number;
  badge?: string;
  featuresKa: string[];
  featuresEn: string[];
}

export const DEFAULT_PLANS: SubscriptionPlanItem[] = [
  {
    id: "FREE",
    nameKa: "უფასო (Free)",
    nameEn: "Free Tier",
    monthlyPrice: 0,
    yearlyPrice: 0,
    listingLimit: 5,
    customSlug: false,
    autoStaleHideDays: 30,
    featuresKa: [
      "5 აქტიური განცხადება",
      "მცენარეების გაცვლის დაფა",
      "Live ჩატი მყიდველებთან",
      "2-5 ფოტოს ატვირთვა",
      "30-დღიანი ავტო-დამალვა",
    ],
    featuresEn: [
      "5 active listings",
      "Plant Exchange Board",
      "Live Chat with buyers",
      "2-5 photos per listing",
      "30-day auto-hide",
    ],
  },
  {
    id: "TIER_1",
    nameKa: "მოყვარული (Tier 1)",
    nameEn: "Enthusiast (Tier 1)",
    monthlyPrice: 15,
    yearlyPrice: 150,
    listingLimit: 20,
    customSlug: false,
    autoStaleHideDays: 30,
    badge: "პოპულარული",
    featuresKa: [
      "20 აქტიური განცხადება",
      "პრიორიტეტი ძიების შედეგებში",
      "Trusted Enthusiast ბეიჯი",
      "გაფართოებული სტატისტიკა",
      "ყველა უფასო ფუნქცია",
    ],
    featuresEn: [
      "20 active listings",
      "Priority search placement",
      "Trusted Enthusiast badge",
      "Advanced stats",
      "All free features",
    ],
  },
  {
    id: "TIER_2",
    nameKa: "ორანჟერეა (Tier 2)",
    nameEn: "Nursery / GreenHouse (Tier 2)",
    monthlyPrice: 55,
    yearlyPrice: 550,
    listingLimit: 50,
    customSlug: true,
    autoStaleHideDays: 30,
    badge: "საუკეთესო მაღაზიებისთვის",
    featuresKa: [
      "50 აქტიური განცხადება",
      "Custom Shop URL (plantsale.ge/username)",
      "WhatsApp პირდაპირი ინტეგრაცია",
      "მაღაზიის ბანერი და ლოგო",
      "ვერიფიცირებული მაღაზიის ბეიჯი",
    ],
    featuresEn: [
      "50 active listings",
      "Custom Shop URL (plantsale.ge/username)",
      "Direct WhatsApp integration",
      "Shop banner & logo",
      "Verified Nursery badge",
    ],
  },
  {
    id: "TIER_3",
    nameKa: "პრო ბიზნესი (Tier 3)",
    nameEn: "Pro Business (Tier 3)",
    monthlyPrice: 99,
    yearlyPrice: 990,
    listingLimit: 150,
    customSlug: true,
    autoStaleHideDays: 30,
    badge: "VIP ბიზნესი",
    featuresKa: [
      "150 აქტიური განცხადება",
      "Custom Shop URL & SEO პრიორიტეტი",
      "ავტომატური განცხადებების განახლება",
      "პერსონალური მენეჯერი",
      "ყველა პრემიუმ ფუნქცია შეუზღუდავად",
    ],
    featuresEn: [
      "150 active listings",
      "Custom Shop URL & SEO priority",
      "Automated listing bumps",
      "Personal manager",
      "All premium features",
    ],
  },
];

const STORAGE_KEY = "plantsale_subscription_plans_v1";
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
    console.error("Failed to save plans", e);
  }
}

export function useSubscriptionPlans() {
  const [plans, setPlans] = React.useState<SubscriptionPlanItem[]>(DEFAULT_PLANS);

  React.useEffect(() => {
    // Initial load
    setPlans(getStoredPlans());

    // Listen for live updates across components
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
