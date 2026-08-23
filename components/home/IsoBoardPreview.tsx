"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { 
  Shuffle, 
  MapPin, 
  ArrowRight, 
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
        
        {/* 🌟 1. Compact Header */}
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

        {/* 🌟 2. Action Buttons & Navigation */}
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

        {/* 📱 3. Real Supabase Listings Grid */}
        {tradeListings.length > 0 ? (
          <div
            ref={sliderRef}
            className="flex lg:grid lg:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto lg:overflow-visible scroll-smooth snap-x snap-mandatory no-scrollbar pb-1 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0"
          >
            {tradeListings.map((iso) => {
              const userName = iso.profiles?.full_name || (isKa ? "მებაღე" : "Grower");
              const userAvatar = iso.profiles?.avatar_url;
              const wantedTags = Array.isArray(iso.trade_preferences) && iso.trade_preferences.length > 0
                ? iso.trade_preferences.join(", ")
                : (isKa ? "მცენარის გაცვლა / შეთანხმებით" : "Plant swap / negotiable");

              const offeringTitle = isKa ? (iso.title_ka || iso.title) : (iso.title_en || iso.title);

              return (
                <div
                  key={iso.id}
                  className="w-[270px] sm:w-[285px] md:w-[300px] lg:w-full shrink-0 lg:shrink snap-start flex flex-col justify-between rounded-[20px] border border-border/80 bg-card p-3.5 sm:p-4 shadow-ambient hover:border-primary/40 hover:shadow-ambient-lg transition-all select-none"
                >
                  <div>
                    {/* Header: User & City */}
                    <div className="flex items-center justify-between gap-1.5 mb-2.5 pb-2 border-b border-border/50">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-6.5 w-6.5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                          {userAvatar ? (
                            <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                          ) : (
                            userName.charAt(0)
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-foreground truncate">{userName}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {iso.transaction_type === "GIFT" ? (isKa ? "🎁 საჩუქარი" : "🎁 Giveaway") : (isKa ? "🔄 გაცვლა" : "🔄 Swap")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-semibold shrink-0">
                        <MapPin className="w-3 h-3 text-primary shrink-0" />
                        <span>{iso.city || (isKa ? "თბილისი" : "Tbilisi")}</span>
                      </div>
                    </div>

                    {/* 🔍 Wanted & 🌿 Offered Blocks */}
                    <div className="space-y-2 mb-3">
                      {/* Offered */}
                      <div className="rounded-[12px] bg-emerald-500/10 dark:bg-emerald-500/15 p-2.5 border border-emerald-500/20">
                        <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1 mb-0.5">
                          <span>🌿 {isKa ? "გასაცვლელად აქვს:" : "Offering:"}</span>
                        </div>
                        <p className="text-xs font-bold text-foreground leading-snug line-clamp-2">
                          {offeringTitle}
                        </p>
                      </div>

                      {/* Wanted */}
                      <div className="rounded-[12px] bg-amber-500/10 dark:bg-amber-500/15 p-2.5 border border-amber-500/20">
                        <div className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1 mb-0.5">
                          <span>🔍 {isKa ? "სანაცვლოდ ეძებს:" : "Looking for in return:"}</span>
                        </div>
                        <p className="text-xs font-medium text-foreground leading-snug line-clamp-2">
                          {wantedTags}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer Action Button */}
                  <Link href={`/listings/${iso.id}`} className="w-full mt-auto pt-1 block group">
                    <Button 
                      size="sm" 
                      className="w-full h-8.5 rounded-[12px] text-xs font-bold gap-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/25 hover:border-primary transition-all shadow-2xs group-hover:shadow-ambient cursor-pointer"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      <span>{isKa ? "გაცვლის შეთავაზება" : "Propose Swap"}</span>
                    </Button>
                  </Link>
                </div>
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
