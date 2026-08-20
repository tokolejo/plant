"use client";

import * as React from "react";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/routing";
import { createClient } from "@/utils/supabase/client";
import { SAMPLE_LISTINGS } from "@/lib/mock-data";
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
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column: Image Gallery & Description & Care Guide */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Image */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[24px] border border-border/80 bg-surface-container shadow-ambient">
            <Image
              src={listing.images[activeImageIdx]}
              alt={listing.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />

            {/* Navigation Arrows */}
            {listing.images.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setActiveImageIdx((prev) =>
                      prev === 0 ? listing.images.length - 1 : prev - 1
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 backdrop-blur-md p-2 text-white hover:bg-black/75 transition-all"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() =>
                    setActiveImageIdx((prev) =>
                      prev === listing.images.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 backdrop-blur-md p-2 text-white hover:bg-black/75 transition-all"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Image Counter */}
            <div className="absolute bottom-3 right-3 rounded-[12px] bg-black/60 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white">
              {activeImageIdx + 1} / {listing.images.length}
            </div>
          </div>

          {/* Thumbnails Row */}
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {listing.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIdx(idx)}
                className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-[14px] border-2 transition-all ${
                  activeImageIdx === idx
                    ? "border-primary scale-105 shadow-ambient"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>

          {/* Care Guidelines Bento Box (From Stitch) */}
          <div className="rounded-[20px] border border-border/80 bg-card p-5 sm:p-6 shadow-ambient">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Sprout className="w-4 h-4 text-primary" />
              <span>მცენარის მოვლის მაჩვენებლები</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="rounded-[14px] bg-secondary-container/70 p-3 text-center">
                <span className="text-base block mb-1">☀️</span>
                <span className="text-[10px] text-muted-foreground block">განათება</span>
                <span className="text-xs font-bold text-foreground">გაფანტული შუქი</span>
              </div>
              <div className="rounded-[14px] bg-secondary-container/70 p-3 text-center">
                <span className="text-base block mb-1">💧</span>
                <span className="text-[10px] text-muted-foreground block">მორწყვა</span>
                <span className="text-xs font-bold text-foreground">კვირაში 1-2 ჯერ</span>
              </div>
              <div className="rounded-[14px] bg-secondary-container/70 p-3 text-center">
                <span className="text-base block mb-1">🪴</span>
                <span className="text-[10px] text-muted-foreground block">ქოთანი</span>
                <span className="text-xs font-bold text-foreground">15 სმ დიამეტრი</span>
              </div>
              <div className="rounded-[14px] bg-secondary-container/70 p-3 text-center">
                <span className="text-base block mb-1">🌡️</span>
                <span className="text-[10px] text-muted-foreground block">ტემპერატურა</span>
                <span className="text-xs font-bold text-foreground">18°C - 26°C</span>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="rounded-[20px] border border-border/80 bg-card p-5 sm:p-6 shadow-ambient">
            <h3 className="text-base font-bold text-foreground mb-2">
              აღწერა და დეტალები
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              ჯანსაღი მცენარე, განვითარებული ფესვთა სისტემით. გაზრდილია იდეალურ პირობებში, სპეციალურ აროიდების სუბსტრატში. არ საჭიროებს გადარგვას უახლოესი 6 თვე.
            </p>

            {/* Trade Exchange Box if Transaction is Trade */}
            {listing.transactionType === "TRADE" && listing.tradePreferences && (
              <div className="mt-4 rounded-[14px] bg-amber-500/10 border border-amber-500/20 p-3.5">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs mb-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>გამყიდველი მცენარეს ცვლის შემდეგში:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {listing.tradePreferences.map((tag, idx) => (
                    <Badge key={idx} variant="amber" className="text-xs px-2.5 py-0.5 rounded-[8px]">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reviews & Feedback Section */}
          <div className="rounded-[20px] border border-border/80 bg-card p-5 sm:p-6 shadow-ambient">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  გამყიდველის შეფასებები & რევიუები
                </h3>
                <p className="text-xs text-muted-foreground">
                  შეაფასეთ გამყიდველი შეძენის ან გაცვლის შემდეგ
                </p>
              </div>
              <div className="flex items-center gap-1 text-sm font-bold text-amber-500">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{listing.seller.rating.toFixed(1)}</span>
                <span className="text-xs font-normal text-muted-foreground">({reviews.length})</span>
              </div>
            </div>

            {/* Write Review Form */}
            <form onSubmit={handleReviewSubmit} className="rounded-[16px] bg-surface-container/60 border border-border/60 p-4 mb-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-foreground">დაწერეთ შეფასება:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-0.5"
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

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={
                    currentUser
                      ? "გაუზიარეთ თქვენი გამოცდილება სხვა მყიდველებს..."
                      : "შეფასების დასატოვებლად გაიარეთ ავტორიზაცია..."
                  }
                  className="w-full rounded-[12px] border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button
                  type="submit"
                  className="rounded-[12px] bg-primary hover:bg-primary-container text-white text-xs font-bold shrink-0 gap-1"
                >
                  <Send className="w-3.5 h-3.5" /> გაგზავნა
                </Button>
              </div>

              {reviewSubmitted && (
                <p className="text-xs text-primary font-semibold mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> თქვენი შეფასება წარმატებით გამოქვეყნდა!
                </p>
              )}
            </form>

            {/* Reviews List */}
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div key={rev.id} className="border-b border-border/40 pb-3 last:border-b-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-secondary-container text-primary font-bold text-xs flex items-center justify-center">
                        {rev.reviewerName.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-foreground">{rev.reviewerName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-amber-500">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="font-bold">{rev.rating}</span>
                      <span className="text-muted-foreground ml-1">({rev.createdAt})</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground pl-8 leading-relaxed">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Pricing, Delivery & Contacts */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main Info Card */}
          <div className="rounded-[24px] border border-border/80 bg-card p-5 sm:p-6 shadow-ambient space-y-4">
            {/* Title & Badges */}
            <div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <Badge className="rounded-[8px] bg-secondary-container text-primary border-none">
                  {listing.itemType === "PLANT" ? "🌱 მცენარე" : "🪴 ინვენტარი"}
                </Badge>
                {listing.transactionType === "TRADE" && (
                  <Badge className="rounded-[8px] bg-amber-500/15 text-amber-800 dark:text-amber-300 border-none">
                    🔄 გაცვლა / Trade
                  </Badge>
                )}
                {listing.transactionType === "NEGOTIABLE" && (
                  <Badge variant="secondary" className="rounded-[8px]">შეთანხმებით</Badge>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
                {listing.title}
              </h1>

              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>{listing.city}</span>
                <span>•</span>
                <span>ნახვები: {listing.viewsCount || 100}+</span>
              </div>
            </div>

            {/* Price Display */}
            <div className="rounded-[18px] bg-secondary-container/70 border border-border/40 p-4 flex items-baseline justify-between">
              <div>
                <span className="text-[11px] text-muted-foreground block font-medium">ფასი</span>
                {listing.transactionType === "TRADE" ? (
                  <span className="text-xl font-bold text-amber-700 dark:text-amber-300">
                    მხოლოდ გაცვლა
                  </span>
                ) : (
                  <span className="text-2xl sm:text-3xl font-bold text-primary dark:text-primary-fixed">
                    {formatPrice(listing.price)}
                  </span>
                )}
              </div>

              <span className="text-xs font-bold text-primary dark:text-primary-fixed bg-card px-2.5 py-1 rounded-[8px] shadow-xs">
                აქტიური
              </span>
            </div>

            {/* Delivery Methods */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                მიწოდების ვარიანტები:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className={`flex items-center gap-2 p-2.5 rounded-[12px] border text-xs ${
                  listing.deliveryMethods.includes("PICKUP")
                    ? "border-primary/40 bg-secondary-container/50 text-foreground font-semibold"
                    : "border-border/40 text-muted-foreground opacity-50"
                }`}>
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>ადგილზე გატანა</span>
                </div>

                <div className={`flex items-center gap-2 p-2.5 rounded-[12px] border text-xs ${
                  listing.deliveryMethods.includes("COURIER")
                    ? "border-primary/40 bg-secondary-container/50 text-foreground font-semibold"
                    : "border-border/40 text-muted-foreground opacity-50"
                }`}>
                  <Truck className="w-3.5 h-3.5 text-primary" />
                  <span>საკურიერო მიწოდება</span>
                </div>

                <div className={`flex items-center gap-2 p-2.5 rounded-[12px] border text-xs sm:col-span-2 ${
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
            <div className="space-y-2.5 pt-2">
              <Button
                size="lg"
                onClick={handlePhoneClick}
                className="w-full rounded-[16px] bg-primary hover:bg-primary-container text-white font-bold h-12 text-xs sm:text-sm gap-2 shadow-ambient"
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
                className="w-full rounded-[16px] font-bold h-12 text-xs sm:text-sm gap-2 border-border/80 hover:bg-surface-container"
              >
                <MessageSquare className="w-4 h-4 text-primary" />
                მიწერა გამყიდველს (Live ჩატი)
              </Button>
            </div>
          </div>

          {/* Seller Trust & Badges Card */}
          <div className="rounded-[24px] border border-border/80 bg-card p-5 sm:p-6 shadow-ambient">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
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
                    <span className="text-muted-foreground">({listing.seller.totalReviews} შეფასება)</span>
                  </div>
                </div>
              </div>

              {listing.seller.customSlug && (
                <Link href={`/shops/${listing.seller.customSlug}`}>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs font-semibold text-primary hover:bg-secondary-container rounded-[10px]">
                    <Store className="w-3.5 h-3.5" />
                    მაღაზია
                  </Button>
                </Link>
              )}
            </div>

            {/* Badges Earned */}
            {listing.seller.badges && listing.seller.badges.length > 0 && (
              <div className="rounded-[14px] bg-secondary-container/60 p-2.5 flex flex-wrap gap-1.5">
                {listing.seller.badges.map((badge, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-[8px] bg-card px-2.5 py-1 text-[11px] font-bold text-primary shadow-xs"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>
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
