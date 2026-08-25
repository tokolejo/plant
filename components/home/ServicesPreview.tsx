"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { 
  Wrench, 
  ArrowRight, 
  Sparkles,
  TreePine
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/services/ServiceCard";
import { MOCK_SERVICES, type GardeningServiceItem } from "@/lib/mock-services";

export function ServicesPreview() {
  const locale = useLocale();
  const isKa = locale !== "en";
  const supabase = createClient();

  const [services, setServices] = React.useState<GardeningServiceItem[]>(MOCK_SERVICES.slice(0, 4));
  const [totalCount, setTotalCount] = React.useState<number>(MOCK_SERVICES.length);

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
          setServices(combined.slice(0, 4));
          setTotalCount(count ? count + mockFiltered.length : combined.length);
        }
      } catch (err) {
        console.warn("Failed to load services on home preview:", err);
      }
    }

    loadServices();
  }, [supabase]);

  return (
    <section className="py-8 sm:py-12 bg-background border-b border-border/60">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl space-y-6">
        
        {/* 1. Header & CTA */}
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

          <Link href="/services" className="self-start sm:self-auto shrink-0">
            <Button 
              variant="outline"
              className="gap-1.5 rounded-[12px] sm:rounded-[14px] border-border/80 hover:border-primary/50 text-foreground hover:text-primary text-xs sm:text-sm font-bold h-9 sm:h-10 px-4 shadow-2xs hover:shadow-ambient cursor-pointer"
            >
              <span>{isKa ? `ყველა სერვისი (${totalCount})` : `All Services (${totalCount})`}</span>
              <ArrowRight className="w-3.5 h-3.5 text-primary" />
            </Button>
          </Link>
        </div>

        {/* 2. 4-Column Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} variant="compact" />
          ))}
        </div>

        {/* 3. Centered Bottom CTA Button */}
        <div className="flex justify-center pt-2">
          <Link href="/services">
            <Button
              className="h-11 px-7 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-ambient flex items-center gap-2 group transition-all"
            >
              <span>{isKa ? "ყველა სერვისის ნახვა" : "View All Services"}</span>
              <span className="h-5 px-2 rounded-full bg-white/20 text-white text-[11px] font-black flex items-center justify-center">
                {totalCount}
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}
