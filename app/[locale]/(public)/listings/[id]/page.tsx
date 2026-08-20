"use client";

import * as React from "react";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/routing";
import { createClient } from "@/utils/supabase/client";
import { SAMPLE_LISTINGS } from "@/lib/mock-data";
import { ListingCard } from "@/components/listings/ListingCard";
import { 
  MapPin, 
  Truck, 
  RefreshCw, 
  Star, 
  ShieldCheck, 
  Award, 
  Sprout, 
  Sparkles, 
  Phone, 
  MessageSquare, 
  Share2, 
  Heart,
  ChevronLeft,
  ChevronRight,
  Store,
  Lock,
  Send,
  AlertCircle,
  CheckCircle2,
  Gift,
  ExternalLink,
  ShoppingBag,
  Layers,
  Sun,
  Droplets,
  Thermometer,
  Boxes
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

// ─── Curated Partner Retailers & Agro Hypermarkets (Domino, Gorgia, Agrohub, Bricorama) ───
const RECOMMENDED_INVENTORY = [
  {
    id: "rec-inv-1",
    title: "აროიდების & ტროპიკული მცენარეების სუბსტრატი (5L)",
    category: "სუბსტრატი & გრუნტი",
    price: 19,
    image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&auto=format&fit=crop&q=80",
    shopName: "დომინო",
    shopBadge: "დომინო",
    shopLogo: "🏢",
    shopColor: "bg-[#0055a5] text-white border border-white/20",
    link: "https://domino.com.ge",
    isExternal: true,
  },
  {
    id: "rec-inv-2",
    title: "კერამიკული მქრქალი ქოთანი სადგამით (18 სმ)",
    category: "ქოთნები",
    price: 38,
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&auto=format&fit=crop&q=80",
    shopName: "გორგია",
    shopBadge: "გორგია",
    shopLogo: "🟠",
    shopColor: "bg-[#e35205] text-white border border-white/20",
    link: "https://gorgia.ge",
    isExternal: true,
  },
  {
    id: "rec-inv-3",
    title: "ორგანული სასუქი & ფესვის ზრდის ელექსირი (500 მლ)",
    category: "სასუქი & მოვლა",
    price: 24,
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&auto=format&fit=crop&q=80",
    shopName: "აგროჰაბი",
    shopBadge: "აგროჰაბი",
    shopLogo: "🌿",
    shopColor: "bg-[#0b8043] text-white border border-white/20",
    link: "https://agrohub.ge",
    isExternal: true,
  },
  {
    id: "rec-inv-4",
    title: "ფიტო-განათება მცენარეებისთვის (Full Spectrum LED)",
    category: "Grow Light",
    price: 59,
    image: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80",
    shopName: "ბრიკორამა",
    shopBadge: "ბრიკორამა",
    shopLogo: "🔴",
    shopColor: "bg-[#c8102e] text-white border border-white/20",
    link: "https://bricorama.ge",
    isExternal: true,
  },
  {
    id: "rec-inv-5",
    title: "ბოტანიკური უჟანგავი მოსავლელი მაკრატელი",
    category: "ხელსაწყოები",
    price: 18,
    image: "https://images.unsplash.com/photo-1592150621744-aca64f48394a?w=600&auto=format&fit=crop&q=80",
    shopName: "აგრო სექტორი",
    shopBadge: "აგრო სექტორი",
    shopLogo: "🌱",
    shopColor: "bg-[#0284c7] text-white border border-white/20",
    link: "/listings?type=INVENTORY",
    isExternal: false,
  },
  {
    id: "rec-inv-6",
    title: "ქოქოსის ბოჭკოს ხავსის საყრდენი ბოძი (Moss Pole 60 სმ)",
    category: "აქსესუარები",
    price: 14,
    image: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600&auto=format&fit=crop&q=80",
    shopName: "დომინო",
    shopBadge: "დომინო",
    shopLogo: "🏢",
    shopColor: "bg-[#0055a5] text-white border border-white/20",
    link: "https://domino.com.ge",
    isExternal: true,
  },
];

export default function ListingDetailPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const supabase = createClient();
  const listing = SAMPLE_LISTINGS.find((l) => l.id === id) || SAMPLE_LISTINGS[0];

  const [activeImageIdx, setActiveImageIdx] = React.useState(0);
  const [showPhone, setShowPhone] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = React.useState(false);

  // Carousel Refs for smooth arrow scrolling
  const inventoryScrollRef = React.useRef<HTMLDivElement>(null);
  const similarScrollRef = React.useRef<HTMLDivElement>(null);

  const scrollInventory = (direction: "left" | "right") => {
    if (inventoryScrollRef.current) {
      const container = inventoryScrollRef.current;
      const scrollAmount = container.clientWidth; // Exactly 1 full view width (3 items)
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const scrollSimilar = (direction: "left" | "right") => {
    if (similarScrollRef.current) {
      const container = similarScrollRef.current;
      const scrollAmount = container.clientWidth * 0.75;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Similar plant listings (excluding current listing)
  const similarListings = SAMPLE_LISTINGS.filter((l) => l.id !== listing.id);

  // Reviews state
  const [reviews, setReviews] = React.useState<any[]>([
    {
      id: "rev-1",
      reviewerName: "გიორგი მ.",
      rating: 5,
      comment: "ძალიან ჯანსაღი მცენარეა, შეფუთული იყო იდეალურად და კურიერმა სწრაფად მომიტანა!",
      createdAt: "3 დღის წინ",
    },
    {
      id: "rev-2",
      reviewerName: "ანა ბ.",
      rating: 5,
      comment: "სანდო გამყიდველია, მცენარე ზუსტად ისეთი იყო როგორც ფოტოებზე.",
      createdAt: "1 კვირის წინ",
    }
  ]);
  const [newRating, setNewRating] = React.useState(5);
  const [newComment, setNewComment] = React.useState("");
  const [reviewSubmitted, setReviewSubmitted] = React.useState(false);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, [supabase]);

  const handlePhoneClick = () => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    setShowPhone(!showPhone);
  };

  const handleChatClick = () => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    router.push(`/dashboard/messages?listing=${listing.id}&seller=${listing.seller.id}`);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    if (!newComment.trim()) return;

    const newRev = {
      id: `rev-${Date.now()}`,
      reviewerName: currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || "მომხმარებელი",
      rating: newRating,
      comment: newComment.trim(),
      createdAt: "ახლახანს",
    };

    setReviews([newRev, ...reviews]);
    setNewComment("");
    setReviewSubmitted(true);
    setTimeout(() => setReviewSubmitted(false), 4000);
  };

  const images = listing.images && listing.images.length > 0 ? listing.images : [
    "https://images.unsplash.com/photo-1545241047-6083a3684587?w=800&auto=format&fit=crop&q=80"
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 max-w-6xl">
      {/* Back to Catalog */}
      <Link
        href="/listings"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary mb-4 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        უკან კატალოგში
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-start">
        {/* ══════════════════════════════════════════════════════════════════════
            LEFT COLUMN: Gallery, Care Indicators, Description & Recommended Partner Retailer Products
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Photo Gallery */}
          <div className="space-y-2.5">
            {/* Active Large Image */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[22px] bg-surface-container border border-border/80 shadow-ambient">
              <Image
                src={images[activeImageIdx]}
                alt={listing.title}
                fill
                className="object-cover"
                priority
              />

              {/* Badges on Large Image */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                {(listing.isFeatured || listing.isPremium) && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-xs px-2.5 py-0.5 shadow-md border-0 rounded-[9px]">
                    ⭐ VIP TOP
                  </Badge>
                )}
                {listing.transactionType === "GIFT" && (
                  <Badge className="bg-emerald-600 text-white font-black text-xs px-2.5 py-0.5 shadow-md border-0 rounded-[9px] flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5" /> გაჩუქება (უფასოდ)
                  </Badge>
                )}
                {listing.transactionType === "TRADE" && (
                  <Badge className="bg-amber-500 text-white font-bold text-xs px-2.5 py-0.5 shadow-md border-0 rounded-[9px] flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5" /> გაცვლა
                  </Badge>
                )}
              </div>

              {/* Navigation Arrows if Multiple Images */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-md"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveImageIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-md"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative aspect-[4/3] w-18 sm:w-20 shrink-0 overflow-hidden rounded-[12px] border-2 transition-all ${
                      activeImageIdx === idx
                        ? "border-primary shadow-xs scale-105"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image src={img} alt={`thumbnail-${idx}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Plant Care Metrics Card */}
          <div className="rounded-[20px] border border-border/80 bg-card p-3.5 sm:p-4 shadow-ambient space-y-2.5">
            <h3 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
              <Sprout className="w-4 h-4 text-primary" />
              მცენარის მოვლის მაჩვენებლები
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="rounded-[12px] bg-secondary-container/50 p-2 text-center border border-border/40">
                <Sun className="w-3.5 h-3.5 text-amber-500 mx-auto mb-1" />
                <span className="text-[10px] text-muted-foreground block font-medium">განათება</span>
                <span className="text-[11px] font-bold text-foreground">გაფანტული შუქი</span>
              </div>

              <div className="rounded-[12px] bg-secondary-container/50 p-2 text-center border border-border/40">
                <Droplets className="w-3.5 h-3.5 text-teal-500 mx-auto mb-1" />
                <span className="text-[10px] text-muted-foreground block font-medium">მორწყვა</span>
                <span className="text-[11px] font-bold text-foreground">კვირაში 1-2 ჯერ</span>
              </div>

              <div className="rounded-[12px] bg-secondary-container/50 p-2 text-center border border-border/40">
                <Boxes className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
                <span className="text-[10px] text-muted-foreground block font-medium">ქოთანი</span>
                <span className="text-[11px] font-bold text-foreground">15-18 სმ ზომა</span>
              </div>

              <div className="rounded-[12px] bg-secondary-container/50 p-2 text-center border border-border/40">
                <Thermometer className="w-3.5 h-3.5 text-rose-500 mx-auto mb-1" />
                <span className="text-[10px] text-muted-foreground block font-medium">ტემპერატურა</span>
                <span className="text-[11px] font-bold text-foreground">18°C - 26°C</span>
              </div>
            </div>
          </div>

          {/* Description Card */}
          <div className="rounded-[20px] border border-border/80 bg-card p-3.5 sm:p-4 shadow-ambient space-y-2">
            <h3 className="text-xs sm:text-sm font-bold text-foreground">
              აღწერა და დეტალები
            </h3>
            <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed whitespace-pre-line">
              {listing.title} — ჯანსაღი მცენარე განვითარებული ფესვთა სისტემით. გაზრდილია იდეალურ პირობებში, სპეციალურ სუბსტრატში. არ საჭიროებს გადარგვას უახლოესი 6 თვე.
            </p>

            {/* Trade Preferences if Swap */}
            {listing.transactionType === "TRADE" && listing.tradePreferences && listing.tradePreferences.length > 0 && (
              <div className="mt-2.5 rounded-[12px] bg-amber-500/10 border border-amber-500/20 p-2.5">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> იცვლება შემდეგ მცენარეებში:
                </p>
                <div className="flex flex-wrap gap-1">
                  {listing.tradePreferences.map((tag, idx) => (
                    <span key={idx} className="rounded-[6px] bg-card px-2 py-0.5 text-xs font-bold text-foreground border border-border/60 shadow-2xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════════════
              🪴 RECOMMENDED PARTNER RETAILER INVENTORY (Domino, Gorgia, Agrohub, etc.)
              Crystal Clear Store Badges & Clean Readable Typography
          ══════════════════════════════════════════════════════════════════════ */}
          <div className="rounded-[22px] border border-border/80 bg-card p-4 sm:p-4.5 shadow-ambient space-y-3">
            {/* Header with Store Badges & Navigation Arrows */}
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                  რეკომენდებული ინვენტარი ამ მცენარისთვის
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  პარტნიორი აგრო და სამშენებლო ჰიპერმარკეტების შეთავაზებები
                </p>
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => scrollInventory("left")}
                  className="h-7 w-7 rounded-full border border-border/80 bg-background hover:bg-surface-container flex items-center justify-center text-foreground transition-colors shadow-2xs active:scale-95"
                  title="წინა 3 შეთავაზება"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollInventory("right")}
                  className="h-7 w-7 rounded-full border border-border/80 bg-background hover:bg-surface-container flex items-center justify-center text-foreground transition-colors shadow-2xs active:scale-95"
                  title="შემდეგი 3 შეთავაზება"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Track — Paginated 3 Items per Desktop View (No Partial Cutoff) */}
            <div
              ref={inventoryScrollRef}
              className="flex gap-2.5 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar pb-1 pt-0.5"
            >
              {RECOMMENDED_INVENTORY.map((item) => (
                <div
                  key={item.id}
                  className="snap-start group relative flex flex-col justify-between w-[calc(50%-5px)] sm:w-[calc(33.333%-6.7px)] shrink-0 overflow-hidden rounded-[14px] border border-border/70 bg-background/95 hover:border-primary/50 transition-all p-2.5 shadow-2xs hover:shadow-sm"
                >
                  {/* Photo & High-Contrast Store Badge */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[10px] bg-surface-container mb-2">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Clear, High-Contrast Store Pill */}
                    <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-[6px] shadow-md backdrop-blur-sm bg-black/80 border border-white/20">
                      <span className="text-[11px] leading-none">{item.shopLogo}</span>
                      <span className="text-[11px] font-black text-white tracking-tight">
                        {item.shopBadge}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-muted-foreground font-semibold block leading-tight">
                        {item.category}
                      </span>
                      <h4 className="text-xs font-bold text-foreground line-clamp-2 leading-snug my-1 min-h-[32px]">
                        {item.title}
                      </h4>
                    </div>

                    <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between gap-1.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-primary dark:text-emerald-400">
                          {item.price} ₾
                        </span>
                        <span className="text-[10px] font-extrabold text-foreground tracking-tight truncate max-w-[75px]">
                          {item.shopName}
                        </span>
                      </div>

                      {item.isExternal ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-extrabold text-primary hover:text-white hover:bg-primary px-2.5 py-1 rounded-[7px] bg-primary/10 transition-colors border border-primary/20"
                        >
                          <span>მაღაზია</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <Link
                          href={item.link}
                          className="inline-flex items-center text-[11px] font-extrabold text-primary hover:text-white hover:bg-primary px-2.5 py-1 rounded-[7px] bg-primary/10 transition-colors border border-primary/20"
                        >
                          ნახვა
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            RIGHT COLUMN: Pricing, Contacts, Seller Profile & Feedback/Reviews
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Info Card */}
          <div className="rounded-[22px] border border-border/80 bg-card p-4 sm:p-5 shadow-ambient space-y-3.5">
            {/* Title & Badges */}
            <div>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                <Badge className="rounded-[8px] bg-secondary-container text-primary border-none text-[10.5px]">
                  {listing.itemType === "PLANT" ? "🌱 მცენარე" : "🪴 ინვენტარი"}
                </Badge>
                {listing.transactionType === "GIFT" && (
                  <Badge className="rounded-[8px] bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-none font-bold text-[10.5px]">
                    🎁 გაჩუქება / უფასოდ
                  </Badge>
                )}
                {listing.transactionType === "TRADE" && (
                  <Badge className="rounded-[8px] bg-amber-500/15 text-amber-800 dark:text-amber-300 border-none font-bold text-[10.5px]">
                    🔄 გაცვლა / Swap
                  </Badge>
                )}
                {listing.transactionType === "NEGOTIABLE" && (
                  <Badge variant="secondary" className="rounded-[8px] text-[10.5px]">შეთანხმებით</Badge>
                )}
              </div>

              <h1 className="text-base sm:text-lg font-extrabold text-foreground leading-snug">
                {listing.title}
              </h1>

              <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground font-medium">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>{listing.city}</span>
                <span>•</span>
                <span>ნახვები: {listing.viewsCount || 100}+</span>
              </div>
            </div>

            {/* Price Display */}
            <div className="rounded-[16px] bg-secondary-container/70 border border-border/40 p-3.5 flex items-baseline justify-between">
              <div>
                <span className="text-[10.5px] text-muted-foreground block font-medium">გარიგება & ფასი</span>
                {listing.transactionType === "GIFT" ? (
                  <span className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-400">
                    🎁 უფასო საჩუქარი
                  </span>
                ) : listing.transactionType === "TRADE" ? (
                  <span className="text-lg font-bold text-amber-700 dark:text-amber-300">
                    მხოლოდ გაცვლა
                  </span>
                ) : (
                  <span className="text-xl sm:text-2xl font-black text-primary dark:text-emerald-400">
                    {formatPrice(listing.price)}
                  </span>
                )}
              </div>

              <span className="text-[11px] font-bold text-primary dark:text-emerald-400 bg-card px-2.5 py-1 rounded-[7px] shadow-2xs">
                აქტიური
              </span>
            </div>

            {/* Delivery Methods */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                მიწოდების ვარიანტები:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <div className={`flex items-center gap-1.5 p-2 rounded-[10px] border text-xs ${
                  listing.deliveryMethods.includes("PICKUP")
                    ? "border-primary/40 bg-secondary-container/50 text-foreground font-semibold"
                    : "border-border/40 text-muted-foreground opacity-50"
                }`}>
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>ადგილზე გატანა</span>
                </div>

                <div className={`flex items-center gap-1.5 p-2 rounded-[10px] border text-xs ${
                  listing.deliveryMethods.includes("COURIER")
                    ? "border-primary/40 bg-secondary-container/50 text-foreground font-semibold"
                    : "border-border/40 text-muted-foreground opacity-50"
                }`}>
                  <Truck className="w-3.5 h-3.5 text-primary" />
                  <span>საკურიერო მიწოდება</span>
                </div>

                <div className={`flex items-center gap-1.5 p-2 rounded-[10px] border text-xs sm:col-span-2 ${
                  listing.deliveryMethods.includes("MARSHRUTKA")
                    ? "border-primary/40 bg-secondary-container/50 text-foreground font-semibold"
                    : "border-border/40 text-muted-foreground opacity-50"
                }`}>
                  <Truck className="w-3.5 h-3.5 text-primary" />
                  <span>სამარშრუტო / რეგიონში გაგზავნა</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <Button
                size="lg"
                onClick={handlePhoneClick}
                className="w-full rounded-[14px] bg-primary hover:bg-primary-container text-white font-bold h-10.5 text-xs sm:text-sm gap-2 shadow-ambient"
              >
                {showPhone ? (
                  <>
                    <Phone className="w-4 h-4" />
                    <span>+995 599 12 34 56</span>
                  </>
                ) : (
                  <>
                    {currentUser ? <Phone className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    <span>ტელეფონის ნომრის ნახვა</span>
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={handleChatClick}
                className="w-full rounded-[14px] font-bold h-10.5 text-xs sm:text-sm gap-2 border-border/80 hover:bg-surface-container"
              >
                <MessageSquare className="w-4 h-4 text-primary" />
                მიწერა გამყიდველს (Live ჩატი)
              </Button>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════
              SELLER PROFILE CARD
          ══════════════════════════════════════════════════════════════════════ */}
          <div className="rounded-[22px] border border-border/80 bg-card p-4 sm:p-5 shadow-ambient">
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="relative h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                  {listing.seller.avatarUrl ? (
                    <Image
                      src={listing.seller.avatarUrl}
                      alt={listing.seller.fullName}
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    listing.seller.fullName.charAt(0)
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-foreground">
                    {listing.seller.fullName}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] text-amber-500 font-semibold">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{listing.seller.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({listing.seller.totalReviews || reviews.length} შეფასება)</span>
                  </div>
                </div>
              </div>

              {listing.seller.customSlug && (
                <Link href={`/shops/${listing.seller.customSlug}`}>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs font-semibold text-primary hover:bg-secondary-container rounded-[8px] h-8">
                    <Store className="w-3.5 h-3.5" />
                    მაღაზია
                  </Button>
                </Link>
              )}
            </div>

            {/* Badges Earned */}
            {listing.seller.badges && listing.seller.badges.length > 0 && (
              <div className="rounded-[12px] bg-secondary-container/60 p-2 flex flex-wrap gap-1">
                {listing.seller.badges.map((badge, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-[6px] bg-card px-2 py-0.5 text-[10.5px] font-bold text-primary shadow-2xs"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════════════
              ⭐⭐ SELLER REVIEWS & FEEDBACK (Right Column — Under Seller Card)
          ══════════════════════════════════════════════════════════════════════ */}
          <div className="rounded-[22px] border border-border/80 bg-card p-4 sm:p-5 shadow-ambient space-y-3">
            <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
              <h3 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                გამყიდველის შეფასებები & რევიუები
              </h3>
              <span className="text-[11px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                ★ 4.9 ({reviews.length})
              </span>
            </div>

            {/* Review Input Form */}
            <form onSubmit={handleReviewSubmit} className="space-y-2 bg-surface-container/50 p-2.5 rounded-[14px] border border-border/40">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-foreground">დაწერეთ შეფასება:</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-0.5 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          star <= newRating ? "fill-amber-400 text-amber-400" : "text-border"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={
                    currentUser
                      ? "გაუზიარეთ თქვენი შთაბეჭდილება მყიდველებს..."
                      : "შეფასების დასატოვებლად გაიარეთ ავტორიზაცია..."
                  }
                  className="w-full rounded-[8px] border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-[8px] bg-primary hover:bg-primary-container text-white text-xs font-bold shrink-0 gap-1 h-7 px-2.5"
                >
                  <Send className="w-3 h-3" />
                </Button>
              </div>

              {reviewSubmitted && (
                <p className="text-[10px] text-primary font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> შეფასება წარმატებით გამოქვეყნდა!
                </p>
              )}
            </form>

            {/* Reviews List */}
            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {reviews.map((rev) => (
                <div key={rev.id} className="border-b border-border/40 pb-2 last:border-b-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-4.5 w-4.5 rounded-full bg-secondary-container text-primary font-bold text-[9px] flex items-center justify-center">
                        {rev.reviewerName.charAt(0)}
                      </div>
                      <span className="text-[11px] font-bold text-foreground">{rev.reviewerName}</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-[9.5px] text-amber-500 font-bold">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{rev.rating}</span>
                      <span className="text-muted-foreground ml-1 font-normal">({rev.createdAt})</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground pl-6 leading-relaxed">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          🌿 COMPACT SIMILAR PLANT LISTINGS SLIDER (Bottom Section)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="mt-10 pt-6 border-t border-border/60 space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              მსგავსი შეთავაზებები & მცენარეები
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              შეიძლება დაგაინტერესოთ სხვა მემცენარეების განცხადებებიდან
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/listings" className="text-xs font-bold text-primary hover:underline hidden sm:inline-block">
              ყველა →
            </Link>

            {/* Navigation Arrows */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollSimilar("left")}
                className="h-7 w-7 rounded-full border border-border/80 bg-card hover:bg-surface-container flex items-center justify-center text-foreground transition-colors shadow-2xs active:scale-95"
                title="წინა"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollSimilar("right")}
                className="h-7 w-7 rounded-full border border-border/80 bg-card hover:bg-surface-container flex items-center justify-center text-foreground transition-colors shadow-2xs active:scale-95"
                title="შემდეგი"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Compact Similar Plant Listings Track */}
        <div
          ref={similarScrollRef}
          className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar pb-1 pt-0.5"
        >
          {similarListings.map((simItem) => (
            <div key={simItem.id} className="snap-start w-[180px] sm:w-[200px] shrink-0">
              <ListingCard {...simItem} variant="compact" />
            </div>
          ))}
        </div>
      </div>

      {/* Auth Modal Prompt when Unauthenticated */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="rounded-[24px] border border-border/80 bg-card p-6 max-w-sm w-full shadow-ambient-lg text-center space-y-4">
            <div className="h-12 w-12 rounded-[16px] bg-secondary-container text-primary flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base text-foreground">
                საჭიროა ავტორიზაცია
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                გამყიდველის ნომრის სანახავად, ჩატში მისაწერად ან რევიუს დასატოვებლად გთხოვთ გაიაროთ ავტორიზაცია.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Link href={`/auth/login?redirect=/listings/${listing.id}`} className="w-full block">
                <Button className="w-full rounded-[14px] bg-primary hover:bg-primary-container text-white text-xs font-bold h-10 shadow-ambient">
                  შესვლა სისტემაში
                </Button>
              </Link>

              <Link href={`/auth/register?redirect=/listings/${listing.id}`} className="w-full block">
                <Button variant="outline" className="w-full rounded-[14px] text-xs font-bold h-10 border-border/70">
                  რეგისტრაცია (უფასო)
                </Button>
              </Link>

              <button
                onClick={() => setAuthModalOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground pt-1"
              >
                დახურვა
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
