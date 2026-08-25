"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { 
  Wrench, 
  ArrowRight, 
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/services/ServiceCard";
import { MOCK_SERVICES, type GardeningServiceItem } from "@/lib/mock-services";

export function ServicesPreview() {
  const locale = useLocale();
  const isKa = locale !== "en";
  const supabase = createClient();

  const [services, setServices] = React.useState<GardeningServiceItem[]>(MOCK_SERVICES);
  const [totalCount, setTotalCount] = React.useState<number>(MOCK_SERVICES.length);

  const sliderRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  // Update scroll navigation arrow states
  const updateScrollState = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  React.useEffect(() => {
    const slider = sliderRef.current;
    if (slider) {
      slider.addEventListener("scroll", updateScrollState, { passive: true });
      updateScrollState();
      return () => slider.removeEventListener("scroll", updateScrollState);
    }
  }, [services]);

  const scrollSlider = (direction: "left" | "right") => {
    if (!sliderRef.current) return;
    const containerWidth = sliderRef.current.clientWidth;
    const scrollAmount = direction === "left" ? -containerWidth * 0.75 : containerWidth * 0.75;
    sliderRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  React.useEffect(() => {
    async function loadServices() {
      try {
        const { data, count, error } = await supabase
          .from("gardening_services")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false });

        if (data && data.length > 0 && !error) {
          const dbItems: GardeningServiceItem[] = data.map((d: any) => ({
            id: d.id,
            provider_id: d.provider_id,
            provider_slug: d.provider_slug,
            provider_name: d.provider_name,
            provider_avatar: d.provider_avatar,
            provider_bio: d.provider_bio,
            provider_experience_years: d.provider_experience_years || 5,
            completed_jobs_count: d.completed_jobs_count || 10,
            is_verified: d.is_verified ?? true,
            category: d.category,
            title: d.title,
            description: d.description,
            price_from: Number(d.price_from) || 0,
            price_unit: d.price_unit || "ხეზე",
            city: d.city || "თბილისი",
            phone: d.phone,
            whatsapp: d.whatsapp,
            portfolio_images: d.portfolio_images && d.portfolio_images.length > 0 ? d.portfolio_images : [
              "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=80"
            ],
            rating: Number(d.rating) || 5.0,
            reviews_count: Number(d.reviews_count) || 1,
            included_features: d.included_features || [],
            created_at: d.created_at,
          }));

          const existingIds = new Set(dbItems.map((item) => item.id));
          const mockFiltered = MOCK_SERVICES.filter((item) => !existingIds.has(item.id));
          const combined = [...dbItems, ...mockFiltered];
          setServices(combined);
          setTotalCount(count ? count + mockFiltered.length : combined.length);
        }
      } catch (err) {
        console.warn("Failed to load services on home preview:", err);
      }
    }

    loadServices();
  }, [supabase]);

  return (
    <section className="pt-4 sm:pt-6 pb-8 sm:pb-10 bg-background border-b border-border/60">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl space-y-5">
        
        {/* 1. Header & Slider Navigation Arrows */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
              <Wrench className="w-3.5 h-3.5 text-primary" />
              <span>{isKa ? "ბაღისა & მცენარეების სერვისები" : "Gardening & Plant Care Services"}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              {isKa ? "პროფესიონალი მებაღეები & სერვისები" : "Professional Gardeners & Services"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              {isKa 
                ? "ხეების გასხვლა, ლანდშაფტის დიზაინი, სარწყავი სისტემები და მცენარის ექიმი."
                : "Tree pruning, landscaping, automated irrigation systems, and plant health care."}
            </p>
          </div>

          {/* Slider Navigation Arrows */}
          <div className="hidden sm:flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => scrollSlider("left")}
              disabled={!canScrollLeft}
              aria-label={isKa ? "წინა" : "Previous"}
              className="h-9 w-9 rounded-full border-2 border-border/80 bg-card hover:border-primary hover:bg-primary hover:text-white flex items-center justify-center text-foreground transition-all shadow-sm active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title={isKa ? "წინა" : "Previous"}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollSlider("right")}
              disabled={!canScrollRight}
              aria-label={isKa ? "შემდეგი" : "Next"}
              className="h-9 w-9 rounded-full border-2 border-border/80 bg-card hover:border-primary hover:bg-primary hover:text-white flex items-center justify-center text-foreground transition-all shadow-sm active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title={isKa ? "შემდეგი" : "Next"}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Horizontal Scroll Services Slider */}
        <div
          ref={sliderRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar pb-3 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {services.map((service) => (
            <div
              key={service.id}
              className="w-[240px] sm:w-[260px] md:w-[280px] lg:w-[calc(25%-12px)] shrink-0 snap-start"
            >
              <ServiceCard service={service} variant="compact" />
            </div>
          ))}
        </div>

        {/* 3. Centered Bottom CTA Button (Matching DiscoveryFeed & IsoBoardPreview) */}
        <div className="flex justify-center items-center mt-5">
          <Link href="/services">
            <Button
              className="rounded-[14px] sm:rounded-[18px] px-5 sm:px-6 h-9 sm:h-10 text-xs sm:text-sm font-bold bg-primary hover:bg-primary-container text-white shadow-ambient gap-1.5 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>{isKa ? "ყველა სერვისის ნახვა" : "View All Services"}</span>
              <span className="bg-white/20 text-white text-[11px] px-2 py-0.5 rounded-full font-black">
                {totalCount}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}
