"use client";

import * as React from "react";
import { usePlatformSettings } from "@/lib/platform-settings";
import { SubscriptionPlansCard } from "@/components/home/SubscriptionPlansCard";
import { PricingComingSoon } from "@/components/home/PricingComingSoon";
import { Button } from "@/components/ui/button";
import { EyeOff, ArrowLeft } from "lucide-react";
import { useLocale } from "next-intl";

export default function PricingPage() {
  const locale = useLocale();
  const isKa = locale !== "en";
  const { subscriptionsMode, loading } = usePlatformSettings();
  const [adminPreviewActive, setAdminPreviewActive] = React.useState(false);

  const showComingSoon = subscriptionsMode === "COMING_SOON" && !adminPreviewActive;

  return (
    <div className="py-4">
      {adminPreviewActive && (
        <div className="container mx-auto px-4 sm:px-6 mb-4">
          <div className="p-3 rounded-[16px] bg-purple-500/10 border border-purple-500/30 flex items-center justify-between gap-3 text-xs text-purple-800 dark:text-purple-200">
            <span className="font-bold">
              {isKa
                ? "🔍 ადმინ გადახედვა: თქვენ ათვალიერებთ აქტიურ პაკეტებს. საჯაროდ ჩანს „Coming Soon“."
                : "🔍 Admin Preview: You are previewing active pricing plans. Public sees 'Coming Soon'."}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAdminPreviewActive(false)}
              className="rounded-[10px] h-7 text-xs font-bold gap-1.5 border-purple-400/50 hover:bg-purple-500/20 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isKa ? "Coming Soon-ზე დაბრუნება" : "Back to Coming Soon"}</span>
            </Button>
          </div>
        </div>
      )}

      {showComingSoon ? (
        <PricingComingSoon onPreviewActivePlans={() => setAdminPreviewActive(true)} />
      ) : (
        <SubscriptionPlansCard />
      )}
    </div>
  );
}
