import { Link } from "@/i18n/routing";
import { HeroSection } from "@/components/home/HeroSection";
import { DiscoveryFeed } from "@/components/home/DiscoveryFeed";
import { IsoBoardPreview } from "@/components/home/IsoBoardPreview";
import { SubscriptionPlansCard } from "@/components/home/SubscriptionPlansCard";
import { SAMPLE_LISTINGS } from "@/lib/mock-data";
import { ArrowRight, Sprout, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-col" style={{ overflow: "visible" }}>
      {/* 1. Hero + Search */}
      <HeroSection />

      {/* 2. Discovery Feed (Uniform Grid with Filter Tabs & Centered View All) */}
      <DiscoveryFeed listings={SAMPLE_LISTINGS} />

      {/* 3. Post Promo Banner */}
      <div className="container mx-auto px-4 sm:px-6 pb-10">
        <div className="rounded-[24px] bg-primary p-6 sm:p-10 text-white shadow-ambient-lg relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
            <Sprout className="w-48 h-48 sm:w-64 sm:h-64 text-white" />
          </div>
          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold mb-3.5 text-primary-fixed">
              <Sparkles className="w-3.5 h-3.5" /> 5 განცხადება სრულიად უფასოდ
            </span>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2.5 leading-tight text-white">
              გაქვთ გასაყიდი ან გასაცვლელი მცენარეები?
            </h3>
            <p className="text-primary-fixed/80 text-xs sm:text-sm mb-6 leading-relaxed">
              განათავსეთ განცხადება 1 წუთში — სრულიად უფასოდ.
            </p>
            <Link href="/dashboard/listings/new">
              <Button className="bg-surface-cream text-primary hover:bg-white font-bold rounded-[16px] shadow-ambient px-6 h-11 text-xs">
                + განცხადების დამატება
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4. ISO Match Board */}
      <IsoBoardPreview />

      {/* 5. Subscription Plans */}
      <SubscriptionPlansCard />
    </div>
  );
}
