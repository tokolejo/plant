"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { 
  Shuffle, 
  MapPin, 
  ArrowRight, 
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function IsoBoardPreview() {
  const locale = useLocale();
  const isKa = locale !== "en";

  const sliderRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  const sampleRequests = [
    {
      id: "iso-1",
      userName: isKa ? "ნინო (Tbilisi Plants)" : "Nino (Tbilisi Plants)",
      userRating: 4.9,
      wanted: isKa ? "Monstera Albo (დაფესვიანებული კალამი)" : "Monstera Albo (Rooted Cutting)",
      offering: isKa ? "Philodendron White Princess ან Anthurium Clarinervium" : "Philodendron White Princess or Anthurium Clarinervium",
      city: isKa ? "თბილისი" : "Tbilisi",
      createdAt: isKa ? "2 სთ წინ" : "2h ago",
    },
    {
      id: "iso-2",
      userName: isKa ? "გიორგი მებოსტნე" : "George Grower",
      userRating: 5.0,
      wanted: isKa ? "იშვიათი სუკულენტები & ასტროფიტუმები" : "Rare Succulents & Astrophytum",
      offering: isKa ? "იშვიათი ფიკუსები ან შეთანხმებით თანხა" : "Rare Ficus varieties or cash offer",
      city: isKa ? "ბათუმი" : "Batumi",
      createdAt: isKa ? "5 სთ წინ" : "5h ago",
    },
    {
      id: "iso-3",
      userName: isKa ? "თამარ ბოტანიკოსი" : "Tamar Botanist",
      userRating: 4.8,
      wanted: isKa ? "კერამიკული ხელნაკეთი ქოთნები (30სმ+)" : "Handmade Ceramic Pots (30cm+)",
      offering: isKa ? "გადახდა 250 ₾ (ან გაცვლა მცენარეებში)" : "Cash: 250 ₾ (or Plant Swap)",
      city: isKa ? "ქუთაისი" : "Kutaisi",
      createdAt: isKa ? "1 დღის წინ" : "1d ago",
    },
    {
      id: "iso-4",
      userName: isKa ? "ლევან კოლექციონერი" : "Levan Collector",
      userRating: 4.9,
      wanted: isKa ? "Ficus Lyrata Bambino ან Sansevieria Moonshine" : "Ficus Lyrata Bambino or Moonshine",
      offering: isKa ? "Syngonium Albo ან Zamioculcas Raven" : "Syngonium Albo or Zamioculcas Raven",
      city: isKa ? "თბილისი" : "Tbilisi",
      createdAt: isKa ? "1 დღის წინ" : "1d ago",
    },
  ];

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
  }, []);

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

        {/* 🌟 2. Action Buttons & High-Visibility Desktop Slider Navigation Arrows */}
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

          {/* Desktop Prominent Slider Navigation Arrows */}
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
        </div>

        {/* 📱 3. Horizontal Touch-Swipeable Slider (Readable Dual-Badge Cards) */}
        <div
          ref={sliderRef}
          className="flex lg:grid lg:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto lg:overflow-visible scroll-smooth snap-x snap-mandatory no-scrollbar pb-1 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
            {sampleRequests.map((iso) => (
              <div
                key={iso.id}
                className="w-[270px] sm:w-[285px] md:w-[300px] lg:w-full shrink-0 lg:shrink snap-start flex flex-col justify-between rounded-[20px] border border-border/80 bg-card p-3.5 sm:p-4 shadow-ambient hover:border-primary/40 hover:shadow-ambient-lg transition-all select-none"
              >
                <div>
                  {/* Header: User & City */}
                  <div className="flex items-center justify-between gap-1.5 mb-2.5 pb-2 border-b border-border/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-6.5 w-6.5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {iso.userName.charAt(0)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-foreground truncate">{iso.userName}</span>
                        <span className="text-[10px] text-muted-foreground">{iso.createdAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-semibold shrink-0">
                      <MapPin className="w-3 h-3 text-primary shrink-0" />
                      <span>{iso.city}</span>
                    </div>
                  </div>

                  {/* 🔍 Wanted & 🌿 Offered Blocks */}
                  <div className="space-y-2 mb-3">
                    {/* Wanted */}
                    <div className="rounded-[12px] bg-amber-500/10 dark:bg-amber-500/15 p-2.5 border border-amber-500/20">
                      <div className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1 mb-0.5">
                        <span>🔍 {isKa ? "ვეძებ:" : "Looking for:"}</span>
                      </div>
                      <p className="text-xs font-bold text-foreground leading-snug line-clamp-2">
                        {iso.wanted}
                      </p>
                    </div>

                    {/* Offered */}
                    <div className="rounded-[12px] bg-emerald-500/10 dark:bg-emerald-500/15 p-2.5 border border-emerald-500/20">
                      <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1 mb-0.5">
                        <span>🌿 {isKa ? "სანაცვლოდ მაქვს:" : "Offering:"}</span>
                      </div>
                      <p className="text-xs font-medium text-foreground leading-snug line-clamp-2">
                        {iso.offering}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Action Button */}
                <Link href="/iso" className="w-full mt-auto pt-1 block group">
                  <Button 
                    size="sm" 
                    className="w-full h-8.5 rounded-[12px] text-xs font-bold gap-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/25 hover:border-primary transition-all shadow-2xs group-hover:shadow-ambient cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>{isKa ? "გაცვლის შეთავაზება" : "Propose Swap"}</span>
                  </Button>
                </Link>
              </div>
            ))}
        </div>

      </div>
    </section>
  );
}
