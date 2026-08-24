"use client";

import * as React from "react";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { 
  MOCK_SERVICES, 
  SERVICE_CATEGORIES, 
  type GardeningServiceItem 
} from "@/lib/mock-services";
import { ServiceCard } from "@/components/services/ServiceCard";
import { 
  MapPin, 
  Star, 
  ShieldCheck, 
  Phone, 
  MessageSquare, 
  Share2, 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Sparkles, 
  Wrench, 
  Building2, 
  Layers, 
  TreePine, 
  Droplets, 
  Stethoscope, 
  Sprout, 
  Send, 
  Loader2, 
  Check, 
  X, 
  Award,
  HelpCircle,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function ServiceDetailPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const unwrappedParams = typeof (params as any)?.then === "function" ? React.use(params as Promise<{ id: string }>) : (params as { id: string });
  const serviceId = unwrappedParams?.id;

  const locale = useLocale();
  const isKa = locale !== "en";
  const supabase = createClient();
  const router = useRouter();

  const [service, setService] = React.useState<GardeningServiceItem | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [phoneRevealed, setPhoneRevealed] = React.useState(false);

  // Inquiry Booking Modal
  const [inquiryModalOpen, setInquiryModalOpen] = React.useState(false);
  const [clientName, setClientName] = React.useState("");
  const [clientPhone, setClientPhone] = React.useState("");
  const [inquiryMessage, setInquiryMessage] = React.useState("");
  const [submittingInquiry, setSubmittingInquiry] = React.useState(false);
  const [inquirySuccess, setInquirySuccess] = React.useState(false);

  // Reviews State
  const [reviews, setReviews] = React.useState([
    {
      id: "rev-1",
      authorName: "გიორგი მ.",
      rating: 5,
      comment: "საუკეთესო მომსახურება! დროულად მოვიდნენ, ხეები იდეალურად გასხლეს და ნარჩენებიც სრულად გაიტანეს. რეკომენდაციას ვუწევ!",
      createdAt: "3 დღის წინ",
    },
    {
      id: "rev-2",
      authorName: "ნინო ჩხეიძე",
      rating: 5,
      comment: "ძალიან კმაყოფილი ვარ. პროფესიონალური მიდგომა და ხარისხიანი შედეგი.",
      createdAt: "1 კვირის წინ",
    },
  ]);
  const [newRating, setNewRating] = React.useState(5);
  const [newComment, setNewComment] = React.useState("");
  const [reviewNotice, setReviewNotice] = React.useState("");

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?next=/services/${serviceId}`);
      return;
    }

    const newRev = {
      id: `rev-${Date.now()}`,
      authorName: user.user_metadata?.full_name || user.email?.split("@")[0] || "მომხმარებელი",
      rating: newRating,
      comment: newComment.trim(),
      createdAt: "ახლახანს",
    };

    setReviews((prev) => [newRev, ...prev]);
    setNewComment("");
    setReviewNotice("თქვენი შეფასება წარმატებით დაემატა!");
    setTimeout(() => setReviewNotice(""), 4000);
  };

  React.useEffect(() => {
    async function loadService() {
      try {
        // Try fetching from database
        const { data, error } = await supabase
          .from("gardening_services")
          .select("*")
          .eq("id", serviceId)
          .maybeSingle();

        if (!error && data) {
          setService({
            id: data.id,
            provider_id: data.provider_id,
            provider_name: data.provider_name,
            provider_avatar: data.provider_avatar,
            provider_bio: data.provider_bio || "პროფესიონალი სპეციალისტი გამწვანებისა და მცენარეთა მოვლის სფეროში.",
            provider_experience_years: data.provider_experience_years || 8,
            completed_jobs_count: data.completed_jobs_count || 45,
            is_verified: data.is_verified ?? true,
            category: data.category,
            title: data.title,
            description: data.description,
            price_from: Number(data.price_from) || 0,
            price_unit: data.price_unit || "ხეზე",
            city: data.city || "თბილისი",
            phone: data.phone,
            whatsapp: data.whatsapp,
            portfolio_images: data.portfolio_images && data.portfolio_images.length > 0 ? data.portfolio_images : [
              "https://images.unsplash.com/photo-1558904541-efa8c4a08931?w=1200&auto=format&fit=crop&q=80"
            ],
            rating: Number(data.rating) || 5.0,
            reviews_count: Number(data.reviews_count) || 1,
            included_features: data.included_features || [
              "ადგილზე ვიზიტი და კონსულტაცია",
              "პროფესიონალური ტექნიკით მომსახურება",
              "უსაფრთხოების ნორმების დაცვა",
              "შედეგის გარანტია",
            ],
            working_hours: data.working_hours || "ყოველდღე: 09:00 - 20:00",
            created_at: data.created_at,
          });
        } else {
          // Fallback to Mock Data
          const found = MOCK_SERVICES.find((s) => s.id === serviceId);
          if (found) {
            setService(found);
          }
        }
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    }
    loadService();
  }, [serviceId, supabase]);

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim() || !service) return;

    setSubmittingInquiry(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from("service_inquiries").insert({
        service_id: service.id,
        client_id: user?.id || null,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        message: inquiryMessage.trim() || "დაინტერესებული ვარ თქვენი მომსახურებით.",
        status: "NEW",
      });

      setInquirySuccess(true);
      setTimeout(() => {
        setInquiryModalOpen(false);
        setInquirySuccess(false);
        setInquiryMessage("");
      }, 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingInquiry(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <span className="font-bold">{isKa ? "იტვირთება სერვისის დეტალები..." : "Loading Service..."}</span>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-xl font-black text-foreground">
          {isKa ? "სერვისი ვერ მოიძებნა" : "Service Not Found"}
        </h2>
        <Link href="/services">
          <Button className="rounded-[14px] bg-primary text-white text-xs font-bold">
            {isKa ? "სერვისების კატალოგში დაბრუნება" : "Back to Services"}
          </Button>
        </Link>
      </div>
    );
  }

  const categoryMeta = SERVICE_CATEGORIES.find((c) => c.id === service.category);
  const images = service.portfolio_images && service.portfolio_images.length > 0
    ? service.portfolio_images
    : ["https://images.unsplash.com/photo-1558904541-efa8c4a08931?w=1200&auto=format&fit=crop&q=80"];

  const relatedServices = MOCK_SERVICES.filter(
    (s) => s.id !== service.id && (s.category === service.category || s.city === service.city)
  ).slice(0, 3);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-7xl space-y-8">
      {/* 1. Breadcrumb Navigation */}
      <div className="flex items-center justify-between gap-4 text-xs font-bold text-muted-foreground">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Link href="/" className="hover:text-foreground transition-colors">
            {isKa ? "მთავარი" : "Home"}
          </Link>
          <span>/</span>
          <Link href="/services" className="hover:text-foreground transition-colors">
            {isKa ? "სერვისები" : "Services"}
          </Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px] sm:max-w-md">
            {service.title}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert("ბმული დაკოპირდა.");
          }}
          className="p-2 rounded-[12px] bg-card border border-border/80 text-muted-foreground hover:text-foreground flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors shrink-0"
          title="გაზიარება"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isKa ? "გაზიარება" : "Share"}</span>
        </button>
      </div>

      {/* 2. Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Gallery & Service Details (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Photo Gallery */}
          <div className="space-y-3">
            <div className="relative h-[320px] sm:h-[460px] w-full rounded-[26px] overflow-hidden bg-surface-container border border-border/80 shadow-ambient">
              <Image
                src={images[activeImageIndex]}
                alt={service.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 66vw"
              />

              {/* Badges Over Image */}
              <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                <span className="px-3 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-xs font-black border border-white/20">
                  {categoryMeta ? (isKa ? categoryMeta.labelKa : categoryMeta.labelEn) : service.category}
                </span>
                <span className="px-3 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-xs font-bold border border-white/20 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>{service.city}</span>
                </span>
              </div>

              {/* Navigation Arrows (if multi-image) */}
              {images.length > 1 && (
                <div className="absolute inset-y-0 inset-x-3 flex items-center justify-between pointer-events-none z-10">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
                    }
                    className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center pointer-events-auto backdrop-blur-md border border-white/20 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
                    }
                    className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center pointer-events-auto backdrop-blur-md border border-white/20 transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative h-18 w-24 rounded-[14px] overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                      activeImageIndex === idx
                        ? "border-primary ring-2 ring-primary/20 scale-102"
                        : "border-border/80 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Service Title & Detailed Description */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-card border border-border/80 shadow-2xs space-y-6">
            <div className="space-y-2">
              <h1 className="text-xl sm:text-3xl font-black text-foreground leading-tight">
                {service.title}
              </h1>
              <div className="flex items-center gap-3 text-xs text-muted-foreground font-bold">
                <span className="flex items-center gap-1 text-amber-500">
                  <Star className="w-4 h-4 fill-amber-500" />
                  <span>{service.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({service.reviews_count} შეფასება)</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>{service.working_hours || "09:00 - 20:00"}</span>
                </span>
              </div>
            </div>

            {/* Description Body */}
            <div className="space-y-3 pt-4 border-t border-border/60">
              <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                {isKa ? "მომსახურების აღწერა" : "Service Overview"}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {service.description}
              </p>
            </div>

            {/* What's Included Checklist */}
            {service.included_features && service.included_features.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-border/60">
                <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                  {isKa ? "რა შედის სერვისში:" : "What's Included:"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {service.included_features.map((feat, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-[14px] bg-secondary-container/40 border border-border/60 flex items-center gap-2.5 text-xs font-bold text-foreground"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Customer Reviews & Feedback Section */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-card border border-border/80 shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div>
                <h3 className="text-base font-black text-foreground">
                  {isKa ? "კლიენტების შეფასებები" : "Customer Reviews"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {reviews.length} {isKa ? "გამოხმაურება" : "Reviews"}
                </p>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 font-black text-sm">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>{service.rating.toFixed(1)}</span>
              </div>
            </div>

            {/* Write a Review Form */}
            <form onSubmit={handleReviewSubmit} className="p-4 rounded-[20px] bg-secondary-container/30 border border-border/60 space-y-3">
              <span className="text-xs font-black uppercase text-foreground block">
                {isKa ? "დატოვეთ შეფასება ოსტატზე:" : "Leave a review:"}
              </span>

              {/* Star rating selector */}
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    className="p-1 text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= newRating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/40"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-muted-foreground ml-2">
                  {newRating} / 5
                </span>
              </div>

              <textarea
                rows={2}
                required
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={isKa ? "გაგვიზიარეთ თქვენი გამოცდილება (სამუშაოს ხარისხი, პუნქტუალურობა)..." : "Write your feedback..."}
                className="w-full rounded-[12px] border border-border/80 bg-background p-2.5 text-xs font-medium focus:ring-1 focus:ring-primary outline-hidden resize-none"
              />

              <div className="flex items-center justify-between">
                {reviewNotice ? (
                  <span className="text-xs font-bold text-emerald-600 animate-in fade-in">
                    {reviewNotice}
                  </span>
                ) : <span />}

                <Button
                  type="submit"
                  size="sm"
                  className="rounded-[10px] bg-primary hover:bg-primary/90 text-white text-xs font-bold px-4 cursor-pointer shadow-ambient"
                >
                  <span>{isKa ? "შეფასების გაგზავნა" : "Submit Review"}</span>
                </Button>
              </div>
            </form>

            {/* Reviews List */}
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-[18px] bg-surface-container/30 border border-border/50 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-foreground">
                        {rev.authorName}
                      </span>
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-500" />
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{rev.createdAt}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Pricing & Provider Sticky Box (4 Cols) */}
        <div className="lg:col-span-4 space-y-5 sticky top-24">
          {/* Price & Contact Card */}
          <div className="p-6 rounded-[28px] bg-card border-2 border-emerald-500/30 shadow-ambient space-y-6">
            <div>
              <span className="text-[10.5px] font-black uppercase tracking-wider text-muted-foreground block">
                {isKa ? "საწყისი ტარიფი" : "Pricing Rate"}
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-black text-emerald-700 dark:text-emerald-300">
                  {service.price_from} ₾
                </span>
                <span className="text-sm font-bold text-muted-foreground">/ {service.price_unit}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                საბოლოო ფასი დამოკიდებულია სამუშაოს სირთულესა და ობიექტის მოცულობაზე.
              </p>
            </div>

            {/* Direct Contact Actions */}
            <div className="space-y-2.5 pt-4 border-t border-border/60">
              {/* Call Button / Reveal */}
              {phoneRevealed ? (
                <a
                  href={`tel:${service.phone}`}
                  className="w-full h-12 rounded-[16px] bg-secondary-container hover:bg-secondary-container/80 text-foreground font-black text-sm flex items-center justify-center gap-2 border border-border/60 transition-colors"
                >
                  <Phone className="w-4 h-4 text-primary" />
                  <span>{service.phone}</span>
                </a>
              ) : (
                <Button
                  type="button"
                  onClick={() => setPhoneRevealed(true)}
                  className="w-full h-12 rounded-[16px] bg-secondary-container hover:bg-surface-container text-foreground font-black text-xs sm:text-sm gap-2 border border-border/60 cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-primary" />
                  <span>{isKa ? "ნომრის ჩვენება & დარეკვა" : "Show Phone & Call"}</span>
                </Button>
              )}

              {/* WhatsApp Button */}
              {service.whatsapp && (
                <a
                  href={`https://wa.me/${service.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`გამარჯობა, დავინტერესდი თქვენი სერვისით Plant.ge-ზე: „${service.title}“`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 rounded-[16px] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-ambient transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp-ით დაკავშირება</span>
                </a>
              )}

              {/* Inquiry Booking Button */}
              <Button
                type="button"
                onClick={() => setInquiryModalOpen(true)}
                className="w-full h-12 rounded-[16px] bg-primary hover:bg-primary/90 text-white font-black text-xs sm:text-sm gap-2 shadow-ambient cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isKa ? "შეკვეთის დატოვება (Inquiry)" : "Send Booking Inquiry"}</span>
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="p-3.5 rounded-[16px] bg-surface-container/40 border border-border/40 text-[11px] text-muted-foreground space-y-1.5 font-medium">
              <div className="flex items-center gap-1.5 text-foreground font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Plant.ge-ს უსაფრთხოების სტანდარტი</span>
              </div>
              <p>ოსტატის ვერიფიკაცია, პირდაპირი კონტაქტი და გამჭვირვალე ფასები.</p>
            </div>
          </div>

          {/* Provider Bio Profile Card */}
          <div className="p-5 rounded-[24px] bg-card border border-border/80 shadow-2xs space-y-4">
            <div className="flex items-center gap-3.5">
              {service.provider_avatar ? (
                <img
                  src={service.provider_avatar}
                  alt={service.provider_name}
                  className="h-12 w-12 rounded-full object-cover border border-border shrink-0 shadow-2xs"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-base shrink-0">
                  {service.provider_name.charAt(0)}
                </div>
              )}

              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-black text-foreground">
                    {service.provider_name}
                  </h4>
                  {service.is_verified && (
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {service.provider_experience_years || 8} წლიანი გამოცდილება
                </span>
              </div>
            </div>

            {service.provider_bio && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {service.provider_bio}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-center">
              <div className="p-2 rounded-[12px] bg-secondary-container/40 border border-border/40">
                <span className="text-xs font-black text-foreground block">
                  {service.completed_jobs_count || 120}+
                </span>
                <span className="text-[10px] text-muted-foreground">სამუშაო</span>
              </div>
              <div className="p-2 rounded-[12px] bg-secondary-container/40 border border-border/40">
                <span className="text-xs font-black text-emerald-600 block">
                  {service.rating.toFixed(1)} / 5.0
                </span>
                <span className="text-[10px] text-muted-foreground">შეფასება</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Related / Similar Services */}
      {relatedServices.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-foreground">
                {isKa ? "მსგავსი სერვისები" : "Similar Services"}
              </h3>
              <p className="text-xs text-muted-foreground">
                სხვა სპეციალისტები ამავე კატეგორიაში
              </p>
            </div>
            <Link href="/services">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-primary">
                <span>{isKa ? "ყველას ნახვა" : "View All"}</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {relatedServices.map((rel) => (
              <ServiceCard key={rel.id} service={rel} variant="compact" />
            ))}
          </div>
        </div>
      )}

      {/* 4. Inquiry Booking Modal */}
      {inquiryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border/80 rounded-[26px] max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-primary" />
                <h3 className="text-sm sm:text-base font-black text-foreground">
                  შეკვეთის / მოთხოვნის გაგზავნა
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInquiryModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inquirySuccess ? (
              <div className="py-8 text-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-foreground">
                  შეტყობინება წარმატებით გაიგზავნა!
                </h4>
                <p className="text-xs text-muted-foreground">
                  ოსტატი უმოკლეს დროში დაგიკავშირდებათ მითითებულ ნომერზე.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendInquiry} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    თქვენი სახელი *
                  </label>
                  <Input
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="გიორგი..."
                    className="h-10 rounded-[12px] text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    ტელეფონის ნომერი *
                  </label>
                  <Input
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+995 5..."
                    className="h-10 rounded-[12px] text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    მოკლე აღწერა / შეკითხვა
                  </label>
                  <textarea
                    rows={3}
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder="მაგ: მინდა 10 ხეხილის გასხვლა მცხეთაში შაბათს..."
                    className="w-full rounded-[12px] border border-input bg-background p-2.5 text-xs font-medium focus:ring-1 focus:ring-primary outline-hidden resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setInquiryModalOpen(false)}
                    className="rounded-[10px] text-xs"
                  >
                    გაუქმება
                  </Button>
                  <Button
                    type="submit"
                    disabled={submittingInquiry}
                    className="rounded-[10px] bg-primary hover:bg-primary/90 text-white text-xs font-bold gap-1.5 cursor-pointer shadow-ambient"
                  >
                    {submittingInquiry ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>გაგზავნა</span>
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
