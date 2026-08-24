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
import { 
  MapPin, 
  Star, 
  ShieldCheck, 
  Phone, 
  MessageSquare, 
  Share2, 
  ChevronLeft, 
  ChevronRight, 
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
  FileText,
  Store,
  Navigation,
  ExternalLink,
  Copy,
  Heart,
  Camera,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Social SVG Icons
function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.062-2.18-.553-1.614-.668-2.67-2.316-2.75-2.423-.08-.108-.654-.871-.654-1.662 0-.792.414-1.18.561-1.341.144-.162.315-.203.42-.203.104 0 .209.002.3.007.098.005.228-.037.356.27.133.318.455 1.109.495 1.19.04.082.067.177.013.284-.053.107-.08.174-.16.269-.08.093-.168.209-.241.281-.08.08-.164.168-.07.33.094.162.418.69 1.002 1.21.75.668 1.383.874 1.579.972.196.098.312.083.428-.051.116-.134.495-.577.628-.775.133-.198.266-.165.449-.098.183.067 1.16.547 1.36.647.2.1.332.148.382.233.049.085.049.495-.095.9z" />
    </svg>
  );
}

function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  TreePine,
  Sparkles,
  Layers,
  Building2,
  Droplets,
  Stethoscope,
  Sprout,
  Wrench,
};

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
  const [showPhone, setShowPhone] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [inWishlist, setInWishlist] = React.useState(false);

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
            price_unit: data.price_unit || "ხეზე",
            city: data.city || "თბილისი",
            phone: data.phone || "557 57 90 20",
            whatsapp: data.whatsapp || "557 57 90 20",
            portfolio_images: data.portfolio_images && data.portfolio_images.length > 0 ? data.portfolio_images : [
              "https://images.unsplash.com/photo-1558904541-efa8c4a08931?w=1200&auto=format&fit=crop&q=80"
            ],
            rating: Number(data.rating) || 5.0,
            reviews_count: Number(data.reviews_count) || 2,
            included_features: data.included_features || [
              "ადგილზე ვიზიტი და კონსულტაცია",
              "პროფესიონალური ტექნიკით მომსახურება",
              "უსაფრთხოების ნორმების დაცვა",
              "შედეგის გარანტია",
            ],
            working_hours: data.working_hours || "ყოველდღე: 09:00 - 20:00",
            created_at: data.created_at || new Date().toISOString(),
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(typeof window !== "undefined" ? window.location.href : "");
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePhoneAction = () => {
    if (!showPhone) {
      setShowPhone(true);
    } else if (service?.phone) {
      window.location.href = `tel:${service.phone}`;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center space-y-3 min-h-[50vh]">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-muted-foreground">{isKa ? "სერვისის დეტალები იტვირთება..." : "Loading service..."}</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center space-y-4 min-h-[50vh]">
        <Wrench className="w-12 h-12 text-muted-foreground/50" />
        <h2 className="text-xl font-bold text-foreground">{isKa ? "სერვისი ვერ მოიძებნა" : "Service not found"}</h2>
        <p className="text-xs text-muted-foreground max-w-sm">
          {isKa ? "შესაძლოა განცხადება წაიშალა ან ვადა გაუვიდა." : "This service may have been removed or expired."}
        </p>
        <Link href="/services">
          <Button className="rounded-[14px] bg-primary text-white text-xs font-bold h-10 px-5">
            {isKa ? "სერვისებში დაბრუნება" : "Back to Services"}
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

  const cleanPhone = (service.phone || "").replace(/\D/g, "");
  const formattedFullPhone = service.phone || "557 57 90 20";
  const maskedPhone = `${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 6)} ***`;

  const directWaChatUrl = `https://wa.me/${(service.whatsapp || service.phone || "557579020").replace(/\D/g, "")}?text=${encodeURIComponent(
    `გამარჯობა, დავინტერესდი თქვენი სერვისით Plant.ge-ზე: „${service.title}“ (${typeof window !== "undefined" ? window.location.href : ""})`
  )}`;

  const pageUrl = typeof window !== "undefined" ? window.location.href : `https://plant.ge/${locale}/services/${service.id}`;
  const shareFbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
  const shareWaUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${service.title} - ${pageUrl}`)}`;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(service.city + " საქართველო")}`;
  const providerSlugUrl = service.provider_slug 
    ? `/shops/${service.provider_slug}` 
    : (service.provider_id ? `/shops/${service.provider_id}` : `/shops/${encodeURIComponent(service.provider_name.toLowerCase().replace(/\s+/g, "-"))}`);

  const CatIcon = categoryMeta ? (CATEGORY_ICON_MAP[categoryMeta.iconName] || Wrench) : Wrench;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 max-w-6xl">
      {/* Schema.org Structured Data for Google Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Service",
            name: service.title,
            image: images,
            description: service.description,
            serviceType: categoryMeta?.labelKa || "Gardening Service",
            provider: {
              "@type": "Person",
              name: service.provider_name,
            },
            areaServed: {
              "@type": "AdministrativeArea",
              name: service.city,
            },
            offers: {
              "@type": "Offer",
              priceCurrency: "GEL",
              price: service.price_from,
              priceUnit: service.price_unit,
            },
          }),
        }}
      />

      {/* Top Bar: Breadcrumb + Back Button */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <Link
          href="/services"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {isKa ? "უკან კატალოგში" : "Back to catalog"}
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-muted-foreground">
            #SRV-{service.id.slice(0, 8)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-start">
        {/* ══════════════════════════════════════════════════════════════════════
            LEFT COLUMN: Gallery, Service Highlights Grid, Description & Reviews
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Photo Gallery */}
          <div className="space-y-2.5">
            {/* Active Large Image */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[22px] bg-surface-container border border-border/80 shadow-ambient">
              <Image
                src={images[activeImageIndex]}
                alt={service.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 700px"
                priority
              />

              {/* Badges on Large Image */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                <Badge className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-xs px-2.5 py-0.5 shadow-md border-0 rounded-[9px] flex items-center gap-1">
                  <CatIcon className="w-3.5 h-3.5" />
                  <span>{categoryMeta ? (isKa ? categoryMeta.labelKa : categoryMeta.labelEn) : service.category}</span>
                </Badge>
                {service.is_verified && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-xs px-2.5 py-0.5 shadow-md border-0 rounded-[9px] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{isKa ? "ვერიფიცირებული" : "Verified"}</span>
                  </Badge>
                )}
              </div>

              <div className="absolute top-3 right-3 z-10">
                <span className="px-2.5 py-1 rounded-[8px] bg-black/65 backdrop-blur-md text-white text-xs font-bold border border-white/20 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{service.city}</span>
                </span>
              </div>

              {images.length > 1 && (
                <div className="absolute bottom-3 right-3 z-10">
                  <span className="px-2.5 py-1 rounded-[8px] bg-black/60 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{activeImageIndex + 1} / {images.length}</span>
                  </span>
                </div>
              )}

              {/* Prev / Next Image Navigation Arrows */}
              {images.length > 1 && (
                <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none z-10">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
                    }
                    className="h-9 w-9 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center pointer-events-auto backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-md"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
                    }
                    className="h-9 w-9 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center pointer-events-auto backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-md"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative h-16 w-20 rounded-[14px] overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
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

          {/* Dynamic Service Specifications / Guidelines Card (100% Identical to Marketplace Table Row List) */}
          <div className="rounded-[24px] border border-border/80 bg-card p-4 sm:p-5 shadow-ambient space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
                <Wrench className="w-4 h-4 text-primary" />
                <span>{isKa ? "სერვისის პარამეტრები & მახასიათებლები" : "Service Guidelines & Parameters"}</span>
              </h3>
              {categoryMeta && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
                  <CatIcon className="w-3.5 h-3.5" />
                  <span>{isKa ? categoryMeta.labelKa : categoryMeta.labelEn}</span>
                </span>
              )}
            </div>

            {/* Single unified sequential card rows */}
            <div className="divide-y divide-border/40 rounded-[16px] bg-secondary-container/30 border border-border/50 overflow-hidden">
              {/* 1. კატეგორია */}
              <div className="flex items-center justify-between gap-3 p-3 sm:px-4 hover:bg-secondary-container/50 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <CatIcon className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap">
                    {isKa ? "კატეგორია:" : "Category:"}
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-bold text-foreground text-right">
                  {categoryMeta ? (isKa ? categoryMeta.labelKa : categoryMeta.labelEn) : service.category}
                </span>
              </div>

              {/* 2. სამუშაო საათები */}
              <div className="flex items-center justify-between gap-3 p-3 sm:px-4 hover:bg-secondary-container/50 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Clock className="w-4 h-4 text-teal-500 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap">
                    {isKa ? "სამუშაო საათები:" : "Working Hours:"}
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-bold text-foreground text-right">
                  {service.working_hours || (isKa ? "ორშაბათი - შაბათი (09:00 - 20:00)" : "Mon - Sat (09:00 - 20:00)")}
                </span>
              </div>

              {/* 3. მომსახურების არეალი */}
              <div className="flex items-center justify-between gap-3 p-3 sm:px-4 hover:bg-secondary-container/50 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap">
                    {isKa ? "მომსახურების არეალი:" : "Service Area:"}
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-bold text-foreground text-right">
                  {service.city} {isKa ? "და მიმდებარე ტერიტორია" : "& surroundings"}
                </span>
              </div>

              {/* 4. გარანტია & უსაფრთხოება */}
              <div className="flex items-center justify-between gap-3 p-3 sm:px-4 hover:bg-secondary-container/50 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap">
                    {isKa ? "გარანტია & უსაფრთხოება:" : "Guarantee & Safety:"}
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right">
                  {isKa ? "შედეგის გარანტია / უსაფრთხოების ნორმები" : "Full Result Guarantee"}
                </span>
              </div>

              {/* 5. გამოცდილება */}
              <div className="flex items-center justify-between gap-3 p-3 sm:px-4 hover:bg-secondary-container/50 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Award className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap">
                    {isKa ? "გამოცდილება:" : "Experience:"}
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-bold text-foreground text-right">
                  {service.provider_experience_years || 8}+ {isKa ? "წლიანი პრაქტიკული სტაჟი" : "Years Experience"}
                </span>
              </div>

              {/* 6. ვიზიტი & შეფასება */}
              <div className="flex items-center justify-between gap-3 p-3 sm:px-4 hover:bg-secondary-container/50 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Navigation className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap">
                    {isKa ? "ვიზიტი & შეფასება:" : "Visit & Estimation:"}
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-bold text-foreground text-right">
                  {isKa ? "ადგილზე მისვლა და კონსულტაცია" : "On-site visit & consultation"}
                </span>
              </div>
            </div>
          </div>

          {/* Description & Included Features Card */}
          <div className="rounded-[22px] border border-border/80 bg-card p-4 sm:p-5 shadow-ambient space-y-4">
            <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-primary" />
              <span>{isKa ? "მომსახურების აღწერა & დეტალები" : "Service Overview & Details"}</span>
            </h2>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {service.description}
            </p>

            {/* What's Included Checklist */}
            {service.included_features && service.included_features.length > 0 && (
              <div className="space-y-2.5 pt-3 border-t border-border/50">
                <span className="text-xs font-bold text-foreground block">
                  {isKa ? "რა შედის სერვისში:" : "What's Included:"}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {service.included_features.map((feat, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-[12px] bg-secondary-container/40 border border-border/50 flex items-center gap-2 text-xs font-bold text-foreground"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Customer Reviews & Feedback Section (Identical to Marketplace Feedback) */}
          <div className="rounded-[22px] border border-border/80 bg-card p-4 sm:p-5 shadow-ambient space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-foreground">
                  {isKa ? "კლიენტების შეფასებები" : "Customer Reviews"}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {reviews.length} {isKa ? "გამოხმაურება" : "Reviews"}
                </p>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 font-black text-xs sm:text-sm">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{service.rating.toFixed(1)}</span>
              </div>
            </div>

            {/* Write a Review Form */}
            <form onSubmit={handleReviewSubmit} className="p-3.5 rounded-[16px] bg-secondary-container/30 border border-border/60 space-y-2.5">
              <span className="text-xs font-black uppercase text-foreground block">
                {isKa ? "დატოვეთ შეფასება ოსტატზე:" : "Leave a review:"}
              </span>

              {/* Star rating selector */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    className="p-1 text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-4 h-4 ${
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
                className="w-full rounded-[10px] border border-border/80 bg-background p-2.5 text-xs font-medium focus:ring-1 focus:ring-primary outline-hidden resize-none"
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
            <div className="space-y-2.5">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3.5 rounded-[14px] bg-surface-container/30 border border-border/50 space-y-1"
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

        {/* ══════════════════════════════════════════════════════════════════════
            RIGHT COLUMN: Pricing, Contacts, Specialist Profile & Safety Box
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-5 space-y-4 sticky top-24">
          {/* Main Info Card */}
          <div className="rounded-[22px] border border-border/80 bg-card p-4 sm:p-5 shadow-ambient space-y-3.5">
            {/* Title & Clickable Category / City Badges */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                {/* 1. Service Category Badge */}
                <Link href={`/services?category=${encodeURIComponent(service.category)}`}>
                  <Badge className="rounded-[8px] bg-primary/10 text-primary hover:bg-primary/20 hover:scale-105 transition-all border border-primary/30 text-[11px] font-bold cursor-pointer gap-1.5 py-1 px-2.5">
                    <CatIcon className="w-3.5 h-3.5" />
                    <span>{categoryMeta ? (isKa ? categoryMeta.labelKa : categoryMeta.labelEn) : service.category}</span>
                  </Badge>
                </Link>

                {/* 2. City Badge */}
                <Link href={`/services?city=${encodeURIComponent(service.city)}`}>
                  <Badge className="rounded-[8px] bg-secondary-container text-foreground hover:bg-surface-container hover:scale-105 transition-all border border-border/50 text-[11px] font-bold cursor-pointer gap-1 py-1 px-2.5">
                    <MapPin className="w-3 h-3 text-primary" />
                    <span>{service.city}</span>
                  </Badge>
                </Link>

                {/* 3. Verified Badge */}
                {service.is_verified && (
                  <Badge className="rounded-[8px] bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-bold py-1 px-2.5 gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{isKa ? "ვერიფიცირებული" : "Verified"}</span>
                  </Badge>
                )}
              </div>

              <h1 className="text-base sm:text-lg font-extrabold text-foreground leading-snug">
                {service.title}
              </h1>

              <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground font-medium flex-wrap">
                <Link
                  href={`/services?city=${encodeURIComponent(service.city)}`}
                  className="hover:text-primary font-bold text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{service.city}</span>
                </Link>
                <span>•</span>
                <span className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <span>{service.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground font-normal">({service.reviews_count})</span>
                </span>
                {/* Google Maps Directions Button */}
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-[7px] border border-emerald-500/30 transition-colors cursor-pointer shadow-2xs"
                  title={isKa ? "მარშრუტის გახსნა Google Maps-ში" : "Open directions in Google Maps"}
                >
                  <Navigation className="w-3 h-3 text-emerald-600" />
                  <span>{isKa ? "მარშრუტი (Google Maps)" : "Directions (Google Maps)"}</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                </a>
              </div>
            </div>

            {/* Price & Status Row */}
            <div className="rounded-[14px] bg-secondary-container/60 border border-border/50 px-3.5 py-2.5 flex items-center justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-bold text-muted-foreground uppercase block">
                  {isKa ? "საწყისი ფასი:" : "From:"}
                </span>
                <span className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  {service.price_from} ₾
                </span>
                <span className="text-xs text-muted-foreground font-medium">/ {service.price_unit}</span>
              </div>

              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-card border border-border/50 px-2.5 py-1 rounded-[7px] shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {isKa ? "აქტიური" : "Active"}
              </span>
            </div>

            {/* Actions & Contacts */}
            <div className="space-y-2 pt-1 border-t border-border/40">
              {/* Primary Phone Reveal & Dial (Centered, Compact & Non-Stretched) */}
              <button
                type="button"
                onClick={handlePhoneAction}
                className={`w-full h-11 px-4 rounded-[12px] font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs ${
                  showPhone
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                    : "bg-primary hover:bg-primary/90 text-white shadow-primary/20"
                }`}
              >
                <Phone className="w-4 h-4 shrink-0" />
                <span className="text-sm font-black tracking-wider">
                  {showPhone ? formattedFullPhone : maskedPhone}
                </span>
                <span className="text-[10.5px] px-2 py-0.5 rounded-[6px] bg-white/20 font-black ml-0.5">
                  {showPhone ? (isKa ? "დარეკვა" : "Call") : (isKa ? "ნახვა" : "Show")}
                </span>
              </button>

              {/* Chat & WhatsApp Row */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={directWaChatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9.5 px-3 rounded-[11px] font-bold text-xs flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white shadow-2xs transition-all cursor-pointer"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => setInquiryModalOpen(true)}
                  className="h-9.5 px-3 rounded-[11px] font-bold text-xs flex items-center justify-center gap-1.5 bg-secondary-container hover:bg-secondary text-foreground border border-border/50 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4 text-primary" />
                  <span>{isKa ? "შეკვეთა" : "Inquiry"}</span>
                </button>
              </div>

              {/* Direct Booking Inquiry Button */}
              <button
                type="button"
                onClick={() => setInquiryModalOpen(true)}
                className="w-full h-10 px-3 rounded-[12px] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 shadow-2xs"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span>{isKa ? "📝 შეკვეთის / ვიზიტის დატოვება" : "Send Booking Request"}</span>
              </button>

              {/* Icon-Only Share & Action Strip */}
              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setInWishlist(!inWishlist)}
                  className={`h-8 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    inWishlist
                      ? "bg-rose-500 text-white border-rose-500 shadow-xs"
                      : "bg-secondary-container hover:bg-secondary text-foreground border-border/60 hover:text-rose-500"
                  }`}
                  title={inWishlist ? "შენახულია რჩეულებში" : "სურვილების სიაში დამატება"}
                >
                  <Heart className={`w-3.5 h-3.5 ${inWishlist ? "fill-current" : ""}`} />
                  <span>{inWishlist ? (isKa ? "შენახულია" : "Saved") : (isKa ? "შენახვა" : "Wishlist")}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <a
                    href={shareFbUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={isKa ? "Facebook-ზე გაზიარება" : "Share on Facebook"}
                    className="w-8 h-8 rounded-full bg-[#1877F2]/10 hover:bg-[#1877F2] text-[#1877F2] hover:text-white border border-[#1877F2]/20 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <FacebookIcon className="w-3.5 h-3.5" />
                  </a>

                  <a
                    href={shareWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={isKa ? "WhatsApp-ში გაზიარება" : "Share on WhatsApp"}
                    className="w-8 h-8 rounded-full bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-[#25D366]/20 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    title={copiedLink ? (isKa ? "დაკოპირდა!" : "Copied!") : (isKa ? "ლინკის კოპირება" : "Copy Link")}
                    className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                      copiedLink
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-secondary-container hover:bg-secondary text-foreground border-border/60"
                    }`}
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Specialist / Storefront Profile Card */}
          <div className="rounded-[22px] border border-border/80 bg-card p-4 sm:p-5 shadow-ambient space-y-3">
            <Link
              href={providerSlugUrl}
              className="flex items-center gap-3 group/p hover:opacity-90 transition-opacity"
            >
              {service.provider_avatar ? (
                <img
                  src={service.provider_avatar}
                  alt={service.provider_name}
                  className="h-11 w-11 rounded-full object-cover border border-border shrink-0 shadow-2xs group-hover/p:ring-2 group-hover/p:ring-primary/40 transition-all"
                />
              ) : (
                <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0 group-hover/p:bg-primary group-hover/p:text-white transition-all">
                  {service.provider_name.charAt(0)}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs sm:text-sm font-black text-foreground group-hover/p:text-primary transition-colors truncate">
                    {service.provider_name}
                  </h4>
                  {service.is_verified && (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {service.provider_experience_years || 8} {isKa ? "წლიანი გამოცდილება" : "years experience"}
                </span>
              </div>
            </Link>

            {service.provider_bio && (
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                {service.provider_bio}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-center">
              <div className="p-2 rounded-[12px] bg-secondary-container/40 border border-border/40">
                <span className="text-xs font-black text-foreground block">
                  {service.completed_jobs_count || 120}+
                </span>
                <span className="text-[10px] text-muted-foreground">{isKa ? "სამუშაო" : "Jobs"}</span>
              </div>
              <div className="p-2 rounded-[12px] bg-secondary-container/40 border border-border/40">
                <span className="text-xs font-black text-emerald-600 block">
                  {service.rating.toFixed(1)} / 5.0
                </span>
                <span className="text-[10px] text-muted-foreground">{isKa ? "შეფასება" : "Rating"}</span>
              </div>
            </div>

            {/* View Full Specialist Storefront / Profile Button */}
            <Link
              href={providerSlugUrl}
              className="w-full h-9.5 rounded-[12px] bg-secondary-container hover:bg-secondary text-foreground text-xs font-black flex items-center justify-center gap-1.5 border border-border/60 transition-colors shadow-2xs cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-primary" />
              <span>{isKa ? "ოსტატის პროფილის & სერვისების ნახვა" : "View Specialist Profile & Services"}</span>
            </Link>
          </div>

          {/* Safety & Trust Notice Box (Identical to Marketplace Safety) */}
          <div className="rounded-[18px] border border-emerald-500/30 bg-emerald-500/5 p-3.5 sm:p-4 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{isKa ? "Plant.ge-ს უსაფრთხოების სტანდარტი" : "Safety Standard"}</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {isKa
                ? "ვერიფიცირებული სპეციალისტები, პირდაპირი კონტაქტი შუამავლების გარეშე და გამჭვირვალე ფასები."
                : "Verified specialists, direct communication with zero intermediaries, and transparent pricing."}
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          3. Related / Similar Services Slider
      ══════════════════════════════════════════════════════════════════════ */}
      {relatedServices.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-border/60 mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-foreground">
                {isKa ? "მსგავსი სერვისები" : "Similar Services"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isKa ? "სხვა სპეციალისტები ამავე კატეგორიაში" : "Other specialists in this category"}
              </p>
            </div>
            <Link href="/services">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-primary">
                <span>{isKa ? "ყველას ნახვა" : "View All"}</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {relatedServices.map((rel) => (
              <ServiceCard key={rel.id} service={rel} variant="compact" />
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          4. Mobile Sticky Floating Action Bar (lg:hidden)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border/80 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="container mx-auto flex items-center justify-between gap-3 max-w-lg">
          {/* Price & Unit */}
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              {isKa ? "ფასი" : "Price"}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-foreground">{service.price_from} ₾</span>
              <span className="text-[10px] text-muted-foreground">/ {service.price_unit}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <a
              href={`tel:${cleanPhone}`}
              className="w-10 h-10 rounded-xl bg-secondary-container hover:bg-secondary text-foreground flex items-center justify-center border border-border/80 transition-colors shrink-0 shadow-xs"
              title={isKa ? "დარეკვა" : "Call"}
            >
              <Phone className="w-4 h-4 text-emerald-600" />
            </a>

            <a
              href={directWaChatUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] flex items-center justify-center border border-[#25D366]/30 transition-colors shrink-0 shadow-xs"
              title={isKa ? "WhatsApp-ში მიწერა" : "Chat on WhatsApp"}
            >
              <WhatsAppIcon className="w-4 h-4" />
            </a>

            <Button
              onClick={() => setInquiryModalOpen(true)}
              className="rounded-xl bg-primary hover:bg-primary/90 text-white font-extrabold text-xs h-10 px-4 gap-1.5 shadow-md shrink-0 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{isKa ? "დაჯავშნა" : "Book"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          5. Rich Online Booking & Live Cost Estimator Modal
      ══════════════════════════════════════════════════════════════════════ */}
      <ServiceBookingModal
        isOpen={inquiryModalOpen}
        onClose={() => setInquiryModalOpen(false)}
        service={service}
        isKa={isKa}
      />
    </div>
  );
}
