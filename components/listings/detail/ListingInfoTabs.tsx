"use client";

import * as React from "react";
import Image from "next/image";
import { 
  Layers, 
  Sprout, 
  Star, 
  ShoppingBag, 
  Sun, 
  Droplets, 
  Boxes, 
  Thermometer, 
  Sparkles, 
  ShieldCheck, 
  Send, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ReviewItem {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface CareMetric {
  key: string;
  icon: any;
  title: string;
  value: string;
  desc: string;
  color: string;
}

interface AffiliateItem {
  id: string;
  titleKa: string;
  titleEn: string;
  categoryKa: string;
  categoryEn: string;
  price: number | string;
  image: string;
  link: string;
  shopName: string;
  shopBadge: string;
  shopColor?: string;
  isExternal?: boolean;
  referralParam?: string;
}

interface ListingInfoTabsProps {
  description?: string;
  plantCareMetrics?: CareMetric[];
  itemType?: string;
  inventorySpecs?: Array<{ label: string; value: string }>;
  reviews: ReviewItem[];
  onReviewSubmit: (rating: number, comment: string) => Promise<void>;
  submittingReview?: boolean;
  affiliateOffers?: AffiliateItem[];
  isKa?: boolean;
  currentUser?: any;
  onRequireAuth?: () => void;
}

export function ListingInfoTabs({
  description,
  plantCareMetrics = [],
  itemType,
  inventorySpecs = [],
  reviews,
  onReviewSubmit,
  submittingReview = false,
  affiliateOffers = [],
  isKa = true,
  currentUser,
  onRequireAuth,
}: ListingInfoTabsProps) {
  // Default to Description tab for superior mental model alignment
  const [activeTab, setActiveTab] = React.useState<"description" | "care" | "reviews" | "inventory">("description");

  // Review Form State
  const [newRating, setNewRating] = React.useState(5);
  const [newComment, setNewComment] = React.useState("");

  const inventoryScrollRef = React.useRef<HTMLDivElement>(null);

  const scrollInventory = (dir: "left" | "right") => {
    if (inventoryScrollRef.current) {
      const scrollAmount = 300;
      inventoryScrollRef.current.scrollBy({
        left: dir === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser && onRequireAuth) {
      onRequireAuth();
      return;
    }
    if (!newComment.trim()) return;
    await onReviewSubmit(newRating, newComment);
    setNewComment("");
  };

  return (
    <div className="rounded-[22px] border border-border/80 bg-card p-4 sm:p-6 shadow-xs space-y-5">
      {/* ── Tab Switcher Strip ── */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-3 overflow-x-auto no-scrollbar">
        {/* Tab 1: Description */}
        <button
          type="button"
          onClick={() => setActiveTab("description")}
          className={`px-3.5 py-2 rounded-[12px] text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === "description"
              ? "bg-primary text-white shadow-2xs"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary-container"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{isKa ? "აღწერა და დეტალები" : "Description & Details"}</span>
        </button>

        {/* Tab 2: Care Guidelines or Specs */}
        <button
          type="button"
          onClick={() => setActiveTab("care")}
          className={`px-3.5 py-2 rounded-[12px] text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === "care"
              ? "bg-primary text-white shadow-2xs"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary-container"
          }`}
        >
          <Sprout className="w-3.5 h-3.5" />
          <span>
            {itemType === "INVENTORY"
              ? (isKa ? "სპეციფიკაციები" : "Specifications")
              : (isKa ? "მცენარის მოვლა" : "Care Guidelines")}
          </span>
        </button>

        {/* Tab 3: Reviews */}
        <button
          type="button"
          onClick={() => setActiveTab("reviews")}
          className={`px-3.5 py-2 rounded-[12px] text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === "reviews"
              ? "bg-primary text-white shadow-2xs"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary-container"
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          <span>{isKa ? `შეფასებები (${reviews.length})` : `Reviews (${reviews.length})`}</span>
        </button>

        {/* Tab 4: Supplies (if available) */}
        {affiliateOffers.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab("inventory")}
            className={`px-3.5 py-2 rounded-[12px] text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "inventory"
                ? "bg-primary text-white shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary-container"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{isKa ? `მოვლის ინვენტარი (${affiliateOffers.length})` : `Supplies (${affiliateOffers.length})`}</span>
          </button>
        )}
      </div>

      {/* ── TAB 1: DESCRIPTION & DETAILS ── */}
      {activeTab === "description" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 font-medium leading-relaxed whitespace-pre-wrap text-xs sm:text-sm">
            {description && description.trim().length > 0 ? (
              description
            ) : (
              <p className="text-muted-foreground italic">
                {isKa 
                  ? "მფლობელს დამატებითი აღწერა არ მიუთითებია. დამატებითი ინფორმაციისთვის დაუკავშირდით პირდაპირ." 
                  : "No additional description provided by the seller."}
              </p>
            )}
          </div>

          {/* Quick Specifications list if inventory */}
          {inventorySpecs.length > 0 && (
            <div className="pt-3 border-t border-border/50 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {inventorySpecs.map((spec, i) => (
                <div key={i} className="p-2.5 rounded-[12px] bg-secondary-container/50 border border-border/40">
                  <span className="text-[10px] text-muted-foreground font-bold block uppercase">{spec.label}</span>
                  <span className="text-xs font-extrabold text-foreground">{spec.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: CARE METRICS OR INVENTORY SPECS ── */}
      {activeTab === "care" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {plantCareMetrics.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {plantCareMetrics.map((m) => {
                const Icon = m.icon;
                return (
                  <div
                    key={m.key}
                    className="p-3.5 rounded-[16px] border border-border/60 bg-secondary-container/30 hover:border-primary/40 transition-colors space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${m.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-black text-foreground">{m.title}</span>
                    </div>
                    <p className="text-xs font-extrabold text-primary pt-0.5">{m.value}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">{m.desc}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center rounded-[16px] bg-secondary-container/30 border border-dashed border-border/60">
              <p className="text-xs text-muted-foreground">
                {isKa ? "სპეციფიკური მოვლის მონაცემები მალე დაემატება." : "Care metrics will be updated soon."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: REVIEWS & FEEDBACK ── */}
      {activeTab === "reviews" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Submit Review Form */}
          <form onSubmit={handleFormSubmit} className="p-4 rounded-[16px] bg-secondary-container/40 border border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-foreground">
                {isKa ? "დატოვეთ შეფასება" : "Leave a Review"}
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    className="p-1 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        star <= newRating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/40"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              value={newComment}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
              placeholder={
                isKa 
                  ? "გაუზიარეთ თქვენი შთაბეჭდილება მცენარესა და გამყიდველზე..." 
                  : "Share your experience about this plant and seller..."
              }
              rows={2}
              className="resize-none rounded-[12px] bg-background text-xs border-border/70 focus-visible:ring-1"
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={submittingReview || !newComment.trim()}
                className="h-8 px-4 rounded-[10px] text-xs font-bold bg-primary hover:bg-primary/90 text-white flex items-center gap-1.5 cursor-pointer"
              >
                {submittingReview ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{isKa ? "გაგზავნა" : "Submit"}</span>
              </Button>
            </div>
          </form>

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div className="text-center py-6 px-4 rounded-[14px] bg-secondary-container/20 border border-border/40">
              <p className="text-xs text-muted-foreground font-medium">
                {isKa ? "შეფასებები ჯერ არ არის. იყავით პირველი!" : "No reviews yet. Be the first!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-3 rounded-[14px] bg-secondary-container/30 border border-border/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{rev.reviewerName}</span>
                    <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{rev.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{rev.comment}</p>
                  <span className="text-[10px] text-muted-foreground/70 block">{rev.createdAt}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: RECOMMENDED INVENTORY (Calm, no auto-play) ── */}
      {activeTab === "inventory" && affiliateOffers.length > 0 && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">
              {isKa ? "რეკომენდებული ნიადაგი, სასუქი და ქოთნები" : "Recommended soil, fertilizer and pots"}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollInventory("left")}
                aria-label="Previous supplies"
                className="h-7 w-7 rounded-full border border-border/80 bg-background hover:bg-secondary-container flex items-center justify-center text-foreground transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scrollInventory("right")}
                aria-label="Next supplies"
                className="h-7 w-7 rounded-full border border-border/80 bg-background hover:bg-secondary-container flex items-center justify-center text-foreground transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div
            ref={inventoryScrollRef}
            className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar pb-2 pt-1"
          >
            {affiliateOffers.map((item) => (
              <div
                key={item.id}
                className="snap-start group relative flex flex-col justify-between w-[180px] sm:w-[200px] shrink-0 overflow-hidden rounded-[16px] border border-border/70 bg-background hover:border-primary/50 transition-all p-3 shadow-2xs"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[12px] bg-secondary-container mb-2">
                  <Image
                    src={item.image}
                    alt={isKa ? item.titleKa : item.titleEn}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div
                    className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded-[6px] text-[10px] font-black text-white shadow-xs"
                    style={{ backgroundColor: item.shopColor || "rgba(0,0,0,0.85)" }}
                  >
                    {item.shopBadge}
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-muted-foreground font-semibold block truncate">
                      {isKa ? item.categoryKa : item.categoryEn}
                    </span>
                    <h4 className="text-xs font-bold text-foreground line-clamp-2 my-1 leading-snug">
                      {isKa ? item.titleKa : item.titleEn}
                    </h4>
                  </div>

                  <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between gap-1">
                    <span className="text-xs font-black text-primary">
                      {typeof item.price === "number" ? item.price : item.price} ₾
                    </span>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-foreground hover:text-primary inline-flex items-center gap-0.5"
                    >
                      <span>{item.shopName}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
