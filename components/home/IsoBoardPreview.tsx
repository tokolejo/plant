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
      title: isKa ? "ვეძებ Monstera Albo-ს დაფესვიანებულ კალამს" : "Looking for rooted Monstera Albo cutting",
      description: isKa ? "მაქვს გასაცვლელად Philodendron White Princess და Anthurium Clarinervium." : "Have Philodendron White Princess and Anthurium Clarinervium available for trade.",
      desiredTags: ["Monstera Albo", "Variegated", "Rare Aroids"],
      budget: isKa ? "100 ₾ (ან გაცვლა)" : "100 ₾ (or Swap)",
      city: isKa ? "თბილისი" : "Tbilisi",
      createdAt: isKa ? "2 სთ წინ" : "2h ago",
    },
    {
      id: "iso-2",
      userName: isKa ? "გიორგი მებოსტნე" : "George Grower",
      userRating: 5.0,
      title: isKa ? "ვეძებ იშვიათი სუკულენტებისა და კაქტუსების კოლექციას" : "ISO Rare Succulents & Cacti Collection",
      description: isKa ? "განვიხილავ როგორც ყიდვას, ასევე გაცვლას იშვიათ ფიკუსებში." : "Open to buying or trading for rare ficus varieties.",
      desiredTags: ["Echeveria", "Astrophytum", "Succulents"],
      budget: isKa ? "შეთანხმებით" : "Negotiable",
      city: isKa ? "ბათუმი" : "Batumi",
      createdAt: isKa ? "5 სთ წინ" : "5h ago",
    },
    {
      id: "iso-3",
      userName: isKa ? "თამარ ბოტანიკოსი" : "Tamar Botanist",
      userRating: 4.8,
      title: isKa ? "ვეძებ კერამიკულ ხელნაკეთ ქოთნებს (დიდი ზომა)" : "ISO Handmade Ceramic Pots (Large)",
      description: isKa ? "მჭირდება 5 ცალი 30სმ+ დიამეტრის ქოთანი დრენაჟით." : "Need 5 pots with 30cm+ diameter and drainage holes.",
      desiredTags: [isKa ? "კერამიკა" : "Ceramics", isKa ? "დიდი ქოთანი" : "Large Pot"],
      budget: "250 ₾",
      city: isKa ? "ქუთაისი" : "Kutaisi",
      createdAt: isKa ? "1 დღის წინ" : "1d ago",
    },
    {
      id: "iso-4",
      userName: isKa ? "ლევან კოლექციონერი" : "Levan Collector",
      userRating: 4.9,
      title: isKa ? "ვეძებ Ficus Lyrata (Bambino) ან Sansevieria Moonshine-ს" : "ISO Ficus Lyrata (Bambino) or Moonshine",
      description: isKa ? "სანაცვლოდ გთავაზობთ Syngonium Albo-ს ან Zamioculcas Raven-ს." : "Trading Syngonium Albo or Zamioculcas Raven in exchange.",
      desiredTags: ["Ficus Bambino", "Sansevieria", "Raven"],
      budget: isKa ? "გაცვლა" : "Swap Only",
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
    <section className="pt-6 sm:pt-8 pb-4 sm:pb-6 bg-surface-cream/40 border-y border-border/60">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        
        {/* 🌟 1. Centered Header (Matches DiscoveryFeed & User Request) */}
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
            <Shuffle className="w-3.5 h-3.5" />
            <span>{isKa ? "მცენარეების გაცვლის დაფა" : "Plant ISO Match Board"}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            {isKa ? "ეძებ იშვიათ მცენარეს ან გსურს გაცვლა?" : "Looking for rare plants or plant swap?"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
            {isKa 
              ? "განათავსე მოთხოვნა და იპოვე სხვა კოლექციონერები გაცვლისთვის."
              : "Post your wishlist and connect with fellow collectors for trades."}
          </p>
        </div>

        {/* 🌟 2. Action Buttons & High-Visibility Desktop Slider Navigation Arrows */}
        <div className="flex items-center justify-between gap-2 mb-5">
          {/* Centered Actions */}
          <div className="flex-1 flex items-center justify-center gap-3">
            <Link href="/iso">
              <Button variant="outline" className="gap-1.5 rounded-[12px] sm:rounded-[14px] text-xs sm:text-sm font-bold h-9 sm:h-10 px-4 border-border/80 hover:bg-surface-container shadow-2xs cursor-pointer">
                <span>{isKa ? "სრული დაფა" : "View All"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Link href="/dashboard/iso/new">
              <Button className="gap-1.5 rounded-[12px] sm:rounded-[14px] bg-primary hover:bg-primary-container text-white text-xs sm:text-sm font-black h-9 sm:h-10 px-4 shadow-ambient cursor-pointer">
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{isKa ? "+ მოთხოვნა" : "+ Post Request"}</span>
              </Button>
            </Link>
          </div>

          {/* Desktop Prominent Slider Navigation Arrows (In header row, not covering cards) */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => scrollSlider("left")}
              disabled={!canScrollLeft}
              aria-label={isKa ? "წინა" : "Previous"}
              className="h-10 w-10 rounded-full border-2 border-border/80 bg-card hover:border-primary hover:bg-primary hover:text-white flex items-center justify-center text-foreground transition-all shadow-sm active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title={isKa ? "წინა" : "Previous"}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollSlider("right")}
              disabled={!canScrollRight}
              aria-label={isKa ? "შემდეგი" : "Next"}
              className="h-10 w-10 rounded-full border-2 border-border/80 bg-card hover:border-primary hover:bg-primary hover:text-white flex items-center justify-center text-foreground transition-all shadow-sm active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title={isKa ? "შემდეგი" : "Next"}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 📱 3. Horizontal Touch-Swipeable Slider */}
        <div
          ref={sliderRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
            {sampleRequests.map((iso) => (
              <div
                key={iso.id}
                className="w-[260px] sm:w-[280px] md:w-[300px] lg:w-[calc(25%-12px)] shrink-0 snap-start flex flex-col justify-between rounded-[18px] border border-border/70 bg-card p-4 shadow-ambient hover:border-primary/40 hover:shadow-ambient-lg transition-all select-none"
              >
                <div>
                  {/* Header */}
                  <div className="flex items-center justify-between gap-1.5 mb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-secondary-container text-primary flex items-center justify-center font-black text-xs shrink-0">
                        {iso.userName.charAt(0)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{iso.userName}</span>
                        <span className="text-[10px] text-slate-700 dark:text-slate-300 font-bold">{iso.createdAt}</span>
                      </div>
                    </div>
                    <Badge className="text-[10px] px-2 py-0.5 rounded-[7px] bg-amber-500/15 text-amber-800 dark:text-amber-300 font-black shrink-0 border border-amber-500/25">
                      {isKa ? "გაცვლა" : "Swap"}
                    </Badge>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-xs sm:text-[13px] text-foreground mb-1.5 line-clamp-2 leading-snug">
                    {iso.title}
                  </h3>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 line-clamp-2 mb-3 leading-relaxed font-medium">
                    {iso.description}
                  </p>

                  {/* Desired Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {iso.desiredTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="rounded-[6px] bg-secondary-container/80 px-1.5 py-0.5 text-[10px] font-bold text-slate-800 dark:text-slate-200 border border-border/40"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-border/50 pt-2.5 flex items-center justify-between gap-2 mt-auto">
                  <div className="flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-200 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate max-w-[100px]">{iso.city}</span>
                  </div>

                  <Link href={`/iso/${iso.id}`}>
                    <Button size="sm" variant="ghost" className="h-7 text-xs font-bold gap-1 text-primary hover:bg-secondary-container rounded-[8px] px-2.5 cursor-pointer">
                      <MessageSquare className="w-3 h-3" />
                      <span>{isKa ? "შეთავაზება" : "Offer"}</span>
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
        </div>

      </div>
    </section>
  );
}
