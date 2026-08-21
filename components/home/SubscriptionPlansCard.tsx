"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { useSubscriptionPlans } from "@/lib/plans-store";
import { 
  Check, 
  Sparkles, 
  Store, 
  Zap, 
  ShieldCheck, 
  Crown, 
  ArrowRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function SubscriptionPlansCard() {
  const locale = useLocale();
  const isKa = locale !== "en";
  const [billingCycle, setBillingCycle] = React.useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const dynamicPlans = useSubscriptionPlans();

  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="emerald" className="mb-3 px-3 py-1 font-semibold">
            {isKa ? "გამჭვირვალე ფასები & პაკეტები" : "Transparent Pricing & Plans"}
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
            {isKa ? "აირჩიე შენზე მორგებული ტარიფი" : "Choose the Plan That Fits You"}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {isKa 
              ? "დაიწყე სრულიად უფასოდ (5 განცხადება) ან გაზარდე შენი მცენარეების ბიზნესი Custom URL-ით და პრემიუმ ხელსაწყოებით."
              : "Start completely free (5 listings) or grow your botanical business with a Custom URL and pro tools."}
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-2 p-1.5 rounded-2xl bg-muted/60 border border-border/80 mt-6">
            <button
              onClick={() => setBillingCycle("MONTHLY")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                billingCycle === "MONTHLY"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isKa ? "თვიური გადახდა" : "Monthly Billing"}
            </button>
            <button
              onClick={() => setBillingCycle("YEARLY")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                billingCycle === "YEARLY"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isKa ? "წლიური (დაზოგე 20%)" : "Annual (Save 20%)"}
              <span className="rounded-md bg-amber-400 text-amber-950 px-1 py-0.2 text-[9px] font-black">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid (Dynamic from Store) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {dynamicPlans.map((plan) => {
            const isPopular = plan.id === "TIER_1";
            const price = billingCycle === "MONTHLY" 
              ? plan.monthlyPrice 
              : Math.round((plan.yearlyPrice || plan.monthlyPrice * 10) / 12);

            const displayYearlyTotal = plan.yearlyPrice || plan.monthlyPrice * 10;
            const planName = isKa ? plan.nameKa : (plan.nameEn || plan.nameKa);
            const features = isKa ? plan.featuresKa : (plan.featuresEn || plan.featuresKa);

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-3xl border bg-card p-6 shadow-sm transition-all duration-300 ${
                  isPopular
                    ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-xl shadow-emerald-500/5 -translate-y-1"
                    : "border-border/80 hover:border-emerald-500/40"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-0.5 text-[11px] font-bold text-white shadow-md">
                    {isKa ? "ყველაზე პოპულარული" : "Most Popular"}
                  </div>
                )}

                <div>
                  {/* Plan Name & Limit */}
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-1">
                    {planName}
                  </h3>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-4">
                    {plan.listingLimit} {isKa ? "აქტიური განცხადება" : "Active Listings"}
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl sm:text-4xl font-extrabold text-foreground">
                      {price} ₾
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {isKa 
                        ? `/ თვე ${billingCycle === "YEARLY" && plan.monthlyPrice > 0 ? `(ჯამში ${displayYearlyTotal} ₾/წელი)` : ""}`
                        : `/ mo ${billingCycle === "YEARLY" && plan.monthlyPrice > 0 ? `(total ${displayYearlyTotal} ₾/yr)` : ""}`}
                    </span>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-2.5 mb-6 text-xs border-t border-border/50 pt-4">
                    {features?.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-foreground/90">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link href={plan.id === "FREE" ? "/auth/register" : "/dashboard/shop"} className="w-full">
                  <Button
                    variant={isPopular ? "botanical" : plan.id === "FREE" ? "outline" : "default"}
                    className="w-full rounded-2xl font-bold text-xs h-11 shadow-sm cursor-pointer"
                  >
                    {plan.id === "FREE"
                      ? (isKa ? "უფასო რეგისტრაცია" : "Free Sign Up")
                      : (isKa ? `არჩევა (${price} ₾ / თვე)` : `Select (${price} ₾ / mo)`)}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
