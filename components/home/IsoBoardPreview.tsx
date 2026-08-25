"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { 
  Shuffle, 
  MapPin, 
  ArrowRight, 
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Sprout,
  Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function IsoBoardPreview() {
  const locale = useLocale();
  const isKa = locale !== "en";
  const supabase = createClient();

  const [tradeListings, setTradeListings] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const sliderRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  React.useEffect(() => {
    async function loadTradeListings() {
      try {
        const { data, error } = await supabase
          .from("listings")
          .select(`
            *,
            profiles:user_id (
              id,
              full_name,
              avatar_url,
              average_rating,
              phone
            )
          `)
          .eq("status", "ACTIVE")
          .or("transaction_type.in.(TRADE,GIFT),trade_preferences.neq.{}")
          .order("created_at", { ascending: false })
          .limit(8);

        if (data && data.length > 0 && !error) {
          setTradeListings(data);
        } else {
          setTradeListings([]);
        }
      } catch (err) {
        console.error("Error loading real swap listings:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTradeListings();
  }, [supabase]);

  const checkScroll = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  React.useEffect(() => {
    checkScroll();
    const el = sliderRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true });
      return () => el.removeEventListener("scroll", checkScroll);
    }
  }, [tradeListings]);

  const scrollSlider = (direction: "left" | "right") => {
    if (!sliderRef.current) return;
    const offset = direction === "left" ? -sliderRef.current.clientWidth * 0.85 : sliderRef.current.clientWidth * 0.85;
    sliderRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <section className="pt-4 sm:pt-6 pb-5 sm:pb-7 bg-surface-cream/40 border-y border-border/60">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        
        {/*  1. Compact Header */}
        <div className="text-center max-w-2xl mx-auto space-y-1 mb-3.5 sm:mb-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
            <Shuffle className="w-3.5 h-3.5" />
            <span>{isKa ? "მცენარეების გაცვლის დაფა" : "Plant ISO Match Board"}</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-foreground">
            {isKa ? "გსურს გაცვლა ან ეძებ იშვიათ მცენარეს?" : "Looking for rare plants or plant swap?"}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            {isKa 
              ? "განათავსე მოთხოვნა და იპოვე სხვა კოლექციონერები გაცვლისთვის."
              : "Post your wishlist and connect with fellow collectors for trades."}
          </p>
        </div>

        {/*  2. Action Buttons & Navigation */}
        <div className="flex items-center justify-between gap-2 mb-4">
          {/* Centered Actions */}
          <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3">
            <Link href="/iso">
              <Button variant="outline" className="gap-1 rounded-[10px] sm:rounded-[12px] text-xs sm:text-sm font-bold h-8.5 sm:h-9 px-3.5 sm:px-4 border-border/80 hover:bg-surface-container shadow-2xs cursor-pointer">
                <span>{isKa ? "სრული დაფა" : "View All"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Link href="/dashboard/listings/new?trans=TRADE">
              <Button className="gap-1 rounded-[10px] sm:rounded-[12px] bg-primary hover:bg-primary-container text-white text-xs sm:text-sm font-black h-8.5 sm:h-9 px-3.5 sm:px-4 shadow-ambient cursor-pointer">
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{isKa ? "+ მოთხოვნა" : "+ Post Request"}</span>
              </Button>
            </Link>
          </div>

          {/* Desktop Slider Navigation Arrows */}
          {tradeListings.length > 4 && (
            <div className="hidden sm:flex items-center gap-2 shrink-0">
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
          )}
        </div>

        {/*  3. Modern Botanical Plant Swap Cards */}
        {tradeListings.length > 0 ? (
          <div
            ref={sliderRef}
            className="flex lg:grid lg:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto lg:overflow-visible scroll-smooth snap-x snap-mandatory no-scrollbar pb-1 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0"
          >
            {tradeListings.map((iso) => {
              const userName = iso.profiles?.full_name || (isKa ? "მებაღე" : "Grower");
              const offeringTitle = isKa ? (iso.title_ka || iso.title) : (iso.title_en || iso.title);
              
              // Plant image
              const plantImage = Array.isArray(iso.images) && iso.images.length > 0
                ? iso.images[0]
                : typeof iso.image === "string" && iso.image
                ? iso.image
                : null;

              // Trade wishlist tags
              const wantedTags = Array.isArray(iso.trade_preferences) && iso.trade_preferences.length > 0
                ? iso.trade_preferences.join(", ")
                : (isKa ? "მცენარეში გაცვლა / შეთანხმებით" : "Plant swap / negotiable");

              const isGift = iso.transaction_type === "GIFT";

              return (
                <Link
                  key={iso.id}
                  href={`/listings/${iso.id}`}
                  className="w-[250px] sm:w-[270px] md:w-[285px] lg:w-full shrink-0 lg:shrink snap-start flex flex-col justify-between rounded-[20px] border border-border/80 bg-card overflow-hidden shadow-ambient hover:border-primary/50 hover:shadow-ambient-lg transition-all group select-none cursor-pointer"
                >
                  {/*  1. Clean, 100% Unobstructed Plant Image */}
                  <div className="relative aspect-[4/3] w-full bg-surface-container overflow-hidden">
                    {plantImage ? (
                      <img
                        src={plantImage}
                        alt={offeringTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-900/10 via-emerald-800/5 to-teal-900/10 flex flex-col items-center justify-center text-primary/40">
                        <Sprout className="w-10 h-10 mb-1" />
                        <span className="text-[11px] font-bold">{isKa ? "მცენარე" : "Plant"}</span>
                      </div>
                    )}
                  </div>

                  {/*  2. Card Body — All Details Clearly Below Image */}
                  <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-3">
                    <div className="space-y-2">
                      {/* Status & City Badges Row (Crystal-Clear & Readable) */}
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        {isGift ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-extrabold shadow-2xs">
                            <Gift className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                            <span>{isKa ? "საჩუქარი" : "Giveaway"}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-900 dark:text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-extrabold shadow-2xs">
                            <Shuffle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>{isKa ? "გაცვლა" : "Swap"}</span>
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary-container/90 text-slate-700 dark:text-slate-200 border border-border/50 px-2 py-0.5 text-[10.5px] font-bold">
                          <MapPin className="w-2.5 h-2.5 text-primary shrink-0" />
                          <span className="truncate max-w-[120px]">{iso.city || (isKa ? "თბილისი" : "Tbilisi")}</span>
                        </span>
                      </div>

                      {/* Plant Title */}
                      <h3 className="font-extrabold text-xs sm:text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors pt-0.5">
                        {offeringTitle}
                      </h3>

                      {/* Trade Wishlist Box */}
                      <div className="rounded-[12px] bg-surface-container/60 dark:bg-card/90 p-2.5 border border-border/50">
                        <div className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1 mb-0.5">
                          <Shuffle className="w-2.5 h-2.5 text-amber-700 dark:text-amber-400" />
                          <span>{isKa ? "სანაცვლოდ ეძებს:" : "Trading for:"}</span>
                        </div>
                        <p className="text-[11.5px] text-foreground font-semibold line-clamp-2 leading-snug">
                          {wantedTags}
                        </p>
                      </div>
                    </div>

                    {/* Footer: Subtle Seller Info & CTA Button */}
                    <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-1.5 mt-auto">
                      <span className="text-[11px] font-semibold text-muted-foreground truncate max-w-[110px]">
                        {userName}
                      </span>

                      <Button
                        size="sm"
                        className="h-8 rounded-[11px] text-xs font-bold gap-1 bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 hover:border-primary transition-all cursor-pointer shadow-2xs"
                      >
                        <span>{isKa ? "შეთავაზება" : "Offer"}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[22px] border border-border/70 bg-card p-6 sm:p-8 text-center space-y-3 max-w-md mx-auto my-2 shadow-ambient">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto">
              <Shuffle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">
                {isKa ? "გასაცვლელი მცენარეები მალე დაემატება" : "Plant Swaps & Trades"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
                {isKa 
                  ? "განათავსეთ თქვენი პირველი მოთხოვნა ან გაცვლის შეთავაზება სრულიად უფასოდ." 
                  : "Post your wishlist or trade offer for free and connect with fellow collectors."}
              </p>
            </div>
            <Link href="/dashboard/listings/new?trans=TRADE" className="inline-block pt-1">
              <Button className="rounded-[14px] bg-primary hover:bg-primary/90 text-white text-xs font-bold h-9 px-5 shadow-ambient">
                <PlusCircle className="w-4 h-4 mr-1.5" />
                <span>{isKa ? "+ პირველი შეთავაზების დამატება" : "+ Post First Trade"}</span>
              </Button>
            </Link>
          </div>
        )}

      </div>
    </section>
  );
}
