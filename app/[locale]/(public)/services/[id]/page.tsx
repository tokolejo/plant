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
import { ServiceBookingModal } from "@/components/services/ServiceBookingModal";
import { ShareModal } from "@/components/common/ShareModal";
import { ListingHeroGallery } from "@/components/listings/detail/ListingHeroGallery";
import { UnifiedSellerCard } from "@/components/listings/detail/UnifiedSellerCard";
import { 
  MapPin, 
  Star, 
  ShieldCheck, 
  Phone, 
  Share2, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Sparkles, 
  Wrench, 
  Layers, 
  Send, 
  Loader2, 
  Check, 
  Award,
  Heart,
  Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// WhatsApp Icon
function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

export default function ServiceDetailPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const unwrappedParams = typeof (params as any)?.then === "function" 
    ? React.use(params as Promise<{ id: string }>) 
    : (params as { id: string });
  const serviceId = unwrappedParams?.id;

  const locale = useLocale();
  const isKa = locale !== "en";
  const supabase = createClient();
  const router = useRouter();

  const [service, setService] = React.useState<GardeningServiceItem | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showPhone, setShowPhone] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [inWishlist, setInWishlist] = React.useState(false);

  // Modals
  const [bookingModalOpen, setBookingModalOpen] = React.useState(false);
  const [shareModalOpen, setShareModalOpen] = React.useState(false);

  // Tabs
  const [activeTab, setActiveTab] = React.useState<"specs" | "description" | "reviews">("specs");

  // Reviews
  const [reviews, setReviews] = React.useState<any[]>([]);
  const [newRating, setNewRating] = React.useState(5);
  const [newComment, setNewComment] = React.useState("");
  const [submittingReview, setSubmittingReview] = React.useState(false);

  // Scroll to top
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as any });
    }
  }, [serviceId]);

  // Load Service
  React.useEffect(() => {
    async function loadService() {
      try {
        const { data, error } = await supabase
          .from("gardening_services")
          .select("*")
          .eq("id", serviceId)
          .maybeSingle();

        if (!error && data) {
          setService({
            id: data.id,
            provider_id: data.provider_id,
            provider_slug: data.provider_slug,
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
            price_unit: data.price_unit || "საათში",
            city: data.city || "თბილისი",
            phone: data.phone || "557 57 90 20",
            whatsapp: data.whatsapp || "557 57 90 20",
            portfolio_images: data.portfolio_images && data.portfolio_images.length > 0 
              ? data.portfolio_images 
              : ["https://images.unsplash.com/photo-1558904541-efa8c4a08931?w=1200&auto=format&fit=crop&q=80"],
            rating: Number(data.rating) || 5.0,
            reviews_count: Number(data.reviews_count) || 2,
            included_features: data.included_features || [
              "ადგილზე ვიზიტი და დეტალური კონსულტაცია",
              "პროფესიონალური ტექნიკით მომსახურება",
              "უსაფრთხოების სტანდარტების სრული დაცვა",
              "შესრულებული სამუშაოს ხარისხის გარანტია",
            ],
            working_hours: data.working_hours || "ყოველდღე: 09:00 - 20:00",
            created_at: data.created_at || new Date().toISOString(),
          });
        } else {
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

  // Load Reviews
  React.useEffect(() => {
    async function loadReviews() {
      if (!serviceId) return;
      try {
        const { data: dbReviews } = await supabase
          .from("reviews")
          .select(`
            id,
            rating,
            comment,
            created_at,
            reviewer:reviewer_id (
              full_name
            )
          `)
          .eq("service_id", serviceId)
          .order("created_at", { ascending: false });

        if (dbReviews && dbReviews.length > 0) {
          setReviews(
            dbReviews.map((r: any) => ({
              id: r.id,
              authorName: r.reviewer?.full_name || (isKa ? "მომხმარებელი" : "User"),
              rating: r.rating || 5,
              comment: r.comment || "",
              createdAt: new Date(r.created_at).toLocaleDateString(isKa ? "ka-GE" : "en-US"),
            }))
          );
        } else {
          // Default initial reviews from mock
          setReviews([
            {
              id: "rev-1",
              authorName: "გიორგი მ.",
              rating: 5,
              comment: "შესანიშნავად შეასრულეს სამუშაო! ხეები ძალიან ლამაზად და აკურატულად გაისხლა. რეკომენდაციას ვუწევ!",
              createdAt: "2 დღის წინ",
            },
            {
              id: "rev-2",
              authorName: "ნინო ჩ.",
              rating: 5,
              comment: "დროულად მოვიდნენ, ყველა საჭირო ხელსაწყო ჰქონდათ და ეზოც იდეალურად დაასუფთავეს.",
              createdAt: "1 კვირის წინ",
            }
          ]);
        }
      } catch {
        // use fallback
      }
    }
    loadReviews();
  }, [serviceId, supabase, isKa]);

  // Handle Review Submit
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?next=/services/${serviceId}`);
      return;
    }

    setSubmittingReview(true);
    const newRev = {
      id: `rev-${Date.now()}`,
      authorName: user.user_metadata?.full_name || user.email?.split("@")[0] || (isKa ? "მომხმარებელი" : "User"),
      rating: newRating,
      comment: newComment.trim(),
      createdAt: isKa ? "ახლახანს" : "Just now",
    };

    setReviews((prev) => [newRev, ...prev]);
    const commentToSend = newComment.trim();
    setNewComment("");

    try {
      await supabase.from("reviews").insert({
        service_id: serviceId,
        reviewer_id: user.id,
        rating: newRating,
        comment: commentToSend,
      });
    } catch {
      // ignore
    } finally {
      setSubmittingReview(false);
    }
  };

  // Copy link
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Similar services horizontal slider
  const similarScrollRef = React.useRef<HTMLDivElement>(null);
  const scrollSimilar = (direction: "left" | "right") => {
    if (similarScrollRef.current) {
      const scrollAmount = 300;
      similarScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const relatedServices = React.useMemo(() => {
    if (!service) return [];
    return MOCK_SERVICES.filter((s) => s.id !== service.id && s.category === service.category).slice(0, 6);
  }, [service]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center space-y-3 min-h-[50vh]">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-muted-foreground">{isKa ? "სერვისი იტვირთება..." : "Loading service..."}</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold">{isKa ? "სერვისი ვერ მოიძებნა" : "Service not found"}</h2>
        <Link href="/services" className="inline-block px-4 py-2 rounded-[12px] bg-primary text-white text-sm font-bold">
          {isKa ? "სერვისებში დაბრუნება" : "Back to Services"}
        </Link>
      </div>
    );
  }

  const categoryMeta = SERVICE_CATEGORIES.find((c) => c.id === service.category);
  const categoryLabel = isKa ? categoryMeta?.labelKa : categoryMeta?.labelEn;

  const rawPhone = service.phone || "557 57 90 20";
  const cleanPhoneDigits = rawPhone.replace(/\D/g, "");
  const maskedPhone = showPhone ? rawPhone : (rawPhone.slice(0, 7) + " ***");

  const waNumber = (service.whatsapp || service.phone || "").replace(/\D/g, "");
  const waUrl = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(
        isKa 
          ? `გამარჯობა, დავინტერესდი თქვენი სერვისით: "${service.title}" (Plantio.ge-დან)`
          : `Hello, I'm interested in your service: "${service.title}" from Plantio.ge`
      )}`
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Main Container with pb-24 for mobile sticky bar ── */}
      <div className="container mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-8 max-w-6xl space-y-6">
        
        {/* ── Breadcrumb Navigation ── */}
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <Link
            href="/services"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{isKa ? "სერვისების კატალოგში დაბრუნება" : "Back to Services"}</span>
          </Link>

          <span className="text-[11px] font-mono opacity-60">
            #SRV-{service.id.slice(0, 8)}
          </span>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            BALANCED 2-COLUMN HERO ARCHITECTURE (100% Aligned with Listings)
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-start">
          
          {/* ── LEFT COLUMN: Gallery + Progressive Tabs ── */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. 4:3 Portfolio Gallery */}
            <ListingHeroGallery
              images={service.portfolio_images}
              title={service.title}
              isKa={isKa}
            />

            {/* 2. Unified Progressive Disclosure Tabs */}
            <div className="rounded-[22px] border border-border/80 bg-card p-4 sm:p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3 overflow-x-auto no-scrollbar">
                {/* Tab 1: Specs & Checklist */}
                <button
                  type="button"
                  onClick={() => setActiveTab("specs")}
                  className={`px-3.5 py-2 rounded-[12px] text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    activeTab === "specs"
                      ? "bg-primary text-white shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary-container"
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>{isKa ? "პარამეტრები & რა შედის" : "Specs & Inclusions"}</span>
                </button>

                {/* Tab 2: Description */}
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
                  <span>{isKa ? "დეტალური აღწერა" : "Description & Terms"}</span>
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
              </div>

              {/* TAB 1: SPECS & INCLUSIONS */}
              {activeTab === "specs" && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* 6 Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-[16px] border border-border/60 bg-secondary-container/30 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-black text-foreground">{isKa ? "სამუშაო საათები" : "Working Hours"}</span>
                      </div>
                      <p className="text-xs font-extrabold text-primary pt-0.5">{service.working_hours || "09:00 - 20:00"}</p>
                      <p className="text-[11px] text-muted-foreground">{isKa ? "ყოველდღიური მომსახურება" : "Daily availability"}</p>
                    </div>

                    <div className="p-3.5 rounded-[16px] border border-border/60 bg-secondary-container/30 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-black text-foreground">{isKa ? "მომსახურების არეალი" : "Coverage Area"}</span>
                      </div>
                      <p className="text-xs font-extrabold text-primary pt-0.5">{service.city}</p>
                      <p className="text-[11px] text-muted-foreground">{isKa ? "ქალაქი და შემოგარენი" : "City & surrounding areas"}</p>
                    </div>

                    <div className="p-3.5 rounded-[16px] border border-border/60 bg-secondary-container/30 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-black text-foreground">{isKa ? "გარანტია & ხარისხი" : "Quality & Safety"}</span>
                      </div>
                      <p className="text-xs font-extrabold text-primary pt-0.5">{isKa ? "100% გარანტია" : "100% Guaranteed"}</p>
                      <p className="text-[11px] text-muted-foreground">{isKa ? "სტანდარტების სრული დაცვით" : "Full compliance"}</p>
                    </div>

                    <div className="p-3.5 rounded-[16px] border border-border/60 bg-secondary-container/30 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Award className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-black text-foreground">{isKa ? "გამოცდილება" : "Experience"}</span>
                      </div>
                      <p className="text-xs font-extrabold text-primary pt-0.5">
                        {service.provider_experience_years || 8} {isKa ? "წელი პრაქტიკა" : "Years active"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {service.completed_jobs_count || 45}+ {isKa ? "შესრულებული პროექტი" : "completed jobs"}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-[16px] border border-border/60 bg-secondary-container/30 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-black text-foreground">{isKa ? "პირველადი შეფასება" : "Consultation"}</span>
                      </div>
                      <p className="text-xs font-extrabold text-primary pt-0.5">{isKa ? "უფასო ონლაინ ხარჯთაღრიცხვა" : "Free estimate"}</p>
                      <p className="text-[11px] text-muted-foreground">{isKa ? "ადგილზე ვიზიტით ან ფოტოთი" : "On-site or via photos"}</p>
                    </div>

                    <div className="p-3.5 rounded-[16px] border border-border/60 bg-secondary-container/30 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Wrench className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-black text-foreground">{isKa ? "აღჭურვილობა" : "Equipment"}</span>
                      </div>
                      <p className="text-xs font-extrabold text-primary pt-0.5">{isKa ? "სრული პროფესიონალური" : "Full professional"}</p>
                      <p className="text-[11px] text-muted-foreground">{isKa ? "ყველა საჭირო ხელსაწყო" : "All tools provided"}</p>
                    </div>
                  </div>

                  {/* Included features checklist */}
                  {service.included_features && service.included_features.length > 0 && (
                    <div className="pt-3 border-t border-border/50 space-y-2.5">
                      <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                        {isKa ? "რა შედის მომსახურებაში:" : "What's included in this service:"}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {service.included_features.map((feature, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2.5 rounded-[12px] bg-secondary-container/40 border border-border/40 text-xs font-semibold text-foreground"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DESCRIPTION */}
              {activeTab === "description" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 font-medium leading-relaxed whitespace-pre-wrap text-xs sm:text-sm">
                    {service.description}
                  </div>

                  <div className="p-3.5 rounded-[14px] bg-secondary-container/40 border border-border/50 space-y-1">
                    <span className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      {isKa ? "უსაფრთხოების & ხარისხის გარანტია" : "Quality & Safety Guarantee"}
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {isKa 
                        ? "სამუშაოები სრულდება პროფესიონალური ხელსაწყოებით და აგროტექნიკური სტანდარტების დაცვით. საჭიროების შემთხვევაში ხდება ნარჩენების გატანაც."
                        : "All work is carried out using professional tools and agro-technical standards with full cleanup available."}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: REVIEWS */}
              {activeTab === "reviews" && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <form onSubmit={handleReviewSubmit} className="p-4 rounded-[16px] bg-secondary-container/40 border border-border/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-foreground">
                        {isKa ? "დატოვეთ შეფასება ოსტატზე" : "Leave feedback for specialist"}
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
                          ? "გაგვიზიარეთ თქვენი გამოცდილება (სამუშაოს ხარისხი, სისწრაფე, პუნქტუალურობა)..." 
                          : "Share your experience about service quality and punctuality..."
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
                        {submittingReview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
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
                            <span className="text-xs font-bold text-foreground">{rev.authorName}</span>
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
            </div>
          </div>

          {/* ── RIGHT COLUMN: Sticky Info Box + Specialist Profile Card ── */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4 self-start">
            
            {/* Service Action Card */}
            <div className="rounded-[22px] border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-4">
              
              {/* Top Meta & Icons */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {categoryLabel && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-[10px] bg-secondary-container text-foreground">
                      {categoryLabel}
                    </span>
                  )}
                  {service.city && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-[8px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-primary" />
                      {service.city}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setInWishlist(!inWishlist)}
                    aria-label={isKa ? "სურვილების სია" : "Wishlist"}
                    className={`h-8 w-8 rounded-full transition-colors ${
                      inWishlist 
                        ? "text-rose-500 bg-rose-500/10 hover:bg-rose-500/20" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${inWishlist ? "fill-rose-500" : ""}`} />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShareModalOpen(true)}
                    aria-label={isKa ? "გაზიარება" : "Share"}
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyLink}
                    aria-label={isKa ? "ბმულის კოპირება" : "Copy link"}
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Title & Specialist Info */}
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-snug">
                  {service.title}
                </h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span className="font-semibold text-foreground">{service.provider_name}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{service.rating.toFixed(1)}</span>
                    <span className="font-normal text-muted-foreground">({service.reviews_count || reviews.length})</span>
                  </span>
                </div>
              </div>

              {/* Price Row */}
              <div className="pt-3 pb-3 border-y border-border/60 flex items-center justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                    {service.price_from} ₾
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">
                    / {service.price_unit} {isKa ? "(დან)" : "(from)"}
                  </span>
                </div>

                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{isKa ? "ვერიფიცირებული" : "Verified"}</span>
                </div>
              </div>

              {/* DIRECT CONTACT BLOCK: PHONE & WHATSAPP */}
              <div className="pt-1 space-y-2.5">
                {/* Contact buttons visible only on desktop (mobile uses fixed bottom sticky bar) */}
                <div className="hidden lg:block lg:space-y-2.5">
                  {/* 1. Direct Phone Call (Large, High-Contrast) */}
                  <Button
                    type="button"
                    onClick={() => {
                      if (!showPhone) {
                        setShowPhone(true);
                      } else {
                        window.location.href = `tel:${cleanPhoneDigits}`;
                      }
                    }}
                    className="w-full h-12 rounded-[14px] bg-primary hover:bg-primary/90 text-white font-black text-sm shadow-xs flex items-center justify-center gap-2.5 cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>{showPhone ? rawPhone : (isKa ? `დარეკვა: ${maskedPhone}` : `Call: ${maskedPhone}`)}</span>
                  </Button>

                  {/* 2. Direct WhatsApp (Official Green) */}
                  {waUrl ? (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full h-12 rounded-[14px] bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-sm shadow-xs flex items-center justify-center gap-2.5 cursor-pointer transition-all active:scale-[0.99]"
                    >
                      <WhatsAppIcon className="w-5 h-5 fill-current shrink-0" />
                      <span>{isKa ? "WhatsApp-ში მიწერა & შეთანხმება" : "Chat on WhatsApp"}</span>
                    </a>
                  ) : (
                    <Button
                      type="button"
                      disabled
                      className="w-full h-12 rounded-[14px] bg-[#25D366]/60 text-white font-black text-sm opacity-60 flex items-center justify-center gap-2.5"
                    >
                      <WhatsAppIcon className="w-5 h-5 fill-current shrink-0" />
                      <span>WhatsApp</span>
                    </Button>
                  )}
                </div>

                {/* Optional Online Estimator (Visible across all breakpoints) */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBookingModalOpen(true)}
                  className="w-full h-10 rounded-[12px] border-border/80 hover:bg-secondary-container text-foreground font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>{isKa ? "ონლაინ კალკულატორი & ხარჯთაღრიცხვა" : "Online Cost Estimator"}</span>
                </Button>
              </div>
            </div>

            {/* Specialist Profile Card */}
            <UnifiedSellerCard
              id={service.provider_id || service.id}
              name={service.provider_name}
              avatar={service.provider_avatar}
              rating={service.rating}
              reviewsCount={service.reviews_count || reviews.length}
              isVerified={service.is_verified}
              experienceYears={service.provider_experience_years}
              responseTime={isKa ? "პასუხობს 30 წთ-ში" : "Replies in 30m"}
              shopUrl={service.provider_slug ? `/services?provider=${service.provider_slug}` : undefined}
              actionLabel={isKa ? "ოსტატის პროფილი" : "Specialist"}
              badgeLabel={isKa ? "გამოცდილი სპეციალისტი" : "Certified Specialist"}
              isKa={isKa}
            />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            SIMILAR SERVICES (Horizontal Snap Slider)
        ══════════════════════════════════════════════════════════════════════ */}
        {relatedServices.length > 0 && (
          <div className="pt-6 border-t border-border/60 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-foreground">
                  {isKa ? "მსგავსი სერვისები" : "Similar Services"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isKa ? "სხვა სპეციალისტები ამავე კატეგორიაში" : "Other specialists in this category"}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollSimilar("left")}
                  aria-label="Previous services"
                  className="h-8 w-8 rounded-full border border-border/80 bg-background hover:bg-secondary-container flex items-center justify-center text-foreground transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollSimilar("right")}
                  aria-label="Next services"
                  className="h-8 w-8 rounded-full border border-border/80 bg-background hover:bg-secondary-container flex items-center justify-center text-foreground transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              ref={similarScrollRef}
              className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar pb-2"
            >
              {relatedServices.map((rel) => (
                <div key={rel.id} className="snap-start w-[260px] sm:w-[280px] shrink-0">
                  <ServiceCard service={rel} variant="compact" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MOBILE STICKY BOTTOM ACTION BAR (Direct Phone & WhatsApp)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 block lg:hidden border-t border-border/80 bg-background/95 backdrop-blur-md p-3 px-4 shadow-lg safe-area-bottom">
        <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
          {/* Left: Specialist & Price */}
          <div className="min-w-0 flex flex-col justify-center pr-1">
            <div className="flex items-center gap-1.5 min-w-0">
              {service.provider_avatar ? (
                <div className="relative w-4 h-4 rounded-full overflow-hidden shrink-0 ring-1 ring-border/50">
                  <Image
                    src={service.provider_avatar}
                    alt={service.provider_name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : null}
              <span className="text-[11px] font-semibold text-muted-foreground truncate max-w-[110px] sm:max-w-[140px]">
                {service.provider_name || (isKa ? "სპეციალისტი" : "Specialist")}
              </span>
              {service.is_verified && (
                <ShieldCheck className="w-3 h-3 text-emerald-700 shrink-0" />
              )}
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base sm:text-lg font-black text-foreground tracking-tight leading-none">
                {service.price_from > 0 ? `${Number(service.price_from).toLocaleString("en-US")} ₾` : (isKa ? "შეთანხმებით" : "Negotiable")}
              </span>
              {service.price_from > 0 && service.price_unit && (
                <span className="text-[10px] font-semibold text-muted-foreground leading-none">
                  / {service.price_unit} {isKa ? "(დან)" : "(from)"}
                </span>
              )}
            </div>
          </div>

          {/* Right: Direct 1-Tap Contacts */}
          <div className="flex items-center gap-2 shrink-0">
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-3.5 rounded-[12px] bg-[#25D366] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                <WhatsAppIcon className="w-4 h-4 fill-current" />
                <span>WhatsApp</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => {
                window.location.href = `tel:${cleanPhoneDigits}`;
              }}
              className="h-10 px-3.5 rounded-[12px] bg-primary text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{isKa ? "დარეკვა" : "Call"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════════════════════ */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        url={typeof window !== "undefined" ? window.location.href : ""}
        title={service.title}
      />

      <ServiceBookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        service={service}
        isKa={isKa}
      />
    </div>
  );
}
