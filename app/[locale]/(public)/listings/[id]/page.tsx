"use client";

import * as React from "react";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { ListingCard } from "@/components/listings/ListingCard";
import { ShareModal } from "@/components/common/ShareModal";
import { ListingHeroGallery } from "@/components/listings/detail/ListingHeroGallery";
import { ListingTradeBox } from "@/components/listings/detail/ListingTradeBox";
import { ListingActionCard } from "@/components/listings/detail/ListingActionCard";
import { UnifiedSellerCard } from "@/components/listings/detail/UnifiedSellerCard";
import { ListingInfoTabs } from "@/components/listings/detail/ListingInfoTabs";
import { 
  ChevronLeft, 
  ChevronRight, 
  Sprout, 
  Sun, 
  Droplets, 
  Boxes, 
  Thermometer, 
  Sparkles, 
  ShieldCheck,
  Phone
} from "lucide-react";

function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}
import { formatPrice } from "@/lib/utils";
import { getBotanicalCareDetails } from "@/lib/botanical-care";
import { submitReviewAction } from "@/app/actions/reviews";
import { toggleWishlistAction, addToGreenhouseAction } from "@/app/actions/listings";
import { usePlatformSettings } from "@/lib/platform-settings";
import { detectAffiliateTags, appendReferralParam } from "@/lib/affiliate-tagger";
import { formatDbListing } from "@/lib/listings-service";

const CATEGORIES_DATA: Record<string, { labelKa: string; labelEn: string }> = {
  monstera: { labelKa: "მონსტერა", labelEn: "Monstera" },
  philodendron: { labelKa: "ფილოდენდრონი", labelEn: "Philodendron" },
  anthurium: { labelKa: "ანთურიუმი", labelEn: "Anthurium" },
  alocasia: { labelKa: "ალოკაზია", labelEn: "Alocasia" },
  calathea: { labelKa: "კალათეა / მარანტა", labelEn: "Calathea / Maranta" },
  "pothos-scindapsus": { labelKa: "პოთოსი / სცინდაპსუსი", labelEn: "Pothos / Scindapsus" },
  orchid: { labelKa: "ორქიდეა", labelEn: "Orchid" },
  bromeliad: { labelKa: "ბრომელია", labelEn: "Bromeliad" },
  ficus: { labelKa: "ფიკუსი", labelEn: "Ficus" },
  palm: { labelKa: "პალმა", labelEn: "Palm" },
  fern: { labelKa: "გვიმრა", labelEn: "Fern" },
  "outdoor-garden": { labelKa: "ბაღის & ეზოს", labelEn: "Garden & Outdoor" },
  "cactus-succulent": { labelKa: "კაქტუსი & სუქულენტი", labelEn: "Cactus & Succulents" },
  "rare-variegated": { labelKa: "იშვიათი & ვარიეგატული", labelEn: "Rare & Variegated" },
  cutting: { labelKa: "კალმები & ნერგები", labelEn: "Cuttings & Seedlings" },
  bonsai: { labelKa: "ბონსაი", labelEn: "Bonsai" },
  sansevieria: { labelKa: "სანსევიერია", labelEn: "Sansevieria" },
  "zz-plant": { labelKa: "ზამიოკულკასი", labelEn: "ZZ Plant" },
  "pots-ceramic": { labelKa: "კერამიკული ქოთნები", labelEn: "Ceramic Pots" },
  "pots-plastic": { labelKa: "პლასტიკური ქოთნები", labelEn: "Plastic Pots" },
  "substrate-soil": { labelKa: "სუბსტრატი & გრუნტი", labelEn: "Soil & Substrates" },
  fertilizer: { labelKa: "სასუქები & მოვლა", labelEn: "Fertilizers & Care" },
  "tools-care": { labelKa: "მოვლის ხელსაწყოები", labelEn: "Care Tools" },
  "lighting-grow": { labelKa: "ფიტო-განათება", labelEn: "Grow Lighting" },
};

export default function ListingDetailPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const locale = useLocale();
  const isKa = locale !== "en";
  const { greenhouseEnabled } = usePlatformSettings();
  const router = useRouter();
  const supabase = createClient();

  const [listing, setListing] = React.useState<any>(null);
  const [loadingListing, setLoadingListing] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = React.useState<any>(null);

  // Modals
  const [shareModalOpen, setShareModalOpen] = React.useState(false);

  // Wishlist & Greenhouse
  const [inWishlist, setInWishlist] = React.useState(false);
  const [greenhouseAdded, setGreenhouseAdded] = React.useState(false);
  const [submittingReview, setSubmittingReview] = React.useState(false);

  // Affiliate & Similar
  const [affiliateOffers, setAffiliateOffers] = React.useState<any[]>([]);
  const [similarListings, setSimilarListings] = React.useState<any[]>([]);
  const [reviews, setReviews] = React.useState<any[]>([]);

  // Scroll to top immediately on page enter
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as any });
    }
  }, [id]);

  // Fetch current auth user
  React.useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setCurrentUser(user);
      if (user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("id, is_admin, subscription_tier, full_name, avatar_url")
          .eq("id", user.id)
          .single();
        if (prof) setCurrentUserProfile(prof);
      }
    });
  }, [supabase]);

  // Fetch Real Listing from Supabase
  React.useEffect(() => {
    async function loadRealListing() {
      try {
        const { data: dbRow, error } = await supabase
          .from("listings")
          .select(`
            *,
            profiles:user_id (
              id,
              full_name,
              avatar_url,
              phone,
              average_rating,
              total_reviews,
              subscription_tier,
              custom_slug,
              is_on_vacation,
              role,
              is_admin,
              is_verified
            )
          `)
          .eq("id", id)
          .single();

        if (dbRow && !error) {
          const targetUser = dbRow.profiles;
          const formatted = formatDbListing(dbRow, targetUser);
          setListing(formatted);

          // Track view
          try {
            await supabase.rpc("increment_listing_views", { listing_id: id });
          } catch {
            try {
              await supabase
                .from("listings")
                .update({ views_count: (dbRow.views_count || 0) + 1 })
                .eq("id", id);
            } catch {}
          }
          return formatted;
        } else {
          setListing(null);
          return null;
        }
      } catch {
        setListing(null);
        return null;
      } finally {
        setLoadingListing(false);
      }
    }

    // Load dynamic partner offers
    async function loadAffiliateOffers() {
      try {
        const targetListing = await loadRealListing();
        const { data: partnerData } = await supabase
          .from("affiliate_partners")
          .select("name, referral_param_template, badge_color")
          .eq("is_active", true);

        const partnerMap: Record<string, { ref: string; color: string }> = {};
        if (partnerData) {
          for (const p of partnerData) {
            partnerMap[p.name.toLowerCase()] = {
              ref: p.referral_param_template || "?ref=plantio",
              color: p.badge_color || "#16a34a",
            };
          }
        }

        const { data: affData, error: affErr } = await supabase
          .from("affiliate_products")
          .select("*")
          .eq("is_active", true)
          .limit(80);

        if (!affErr && affData && affData.length > 0) {
          const lObj = targetListing as any;
          const lTitle = lObj?.title || lObj?.titleKa || "";
          const lDesc = lObj?.description || lObj?.descriptionKa || "";
          const lCategory = lObj?.category || lObj?.categoryKa || "";
          const listingTags = detectAffiliateTags(lTitle, `${lDesc} ${lCategory}`);

          const scored = affData.map((a: any) => {
            let score = 1;
            const aTags = Array.isArray(a.matching_tags) ? a.matching_tags : [];
            for (const t of aTags) {
              if (listingTags.some((lt) => lt.toLowerCase() === String(t).toLowerCase())) {
                score += 8;
              }
            }
            if (lTitle.toLowerCase().includes(a.category?.toLowerCase() || "___")) {
              score += 5;
            }
            return { item: a, score };
          });

          scored.sort((x, y) => y.score - x.score);

          const mapped = scored.slice(0, 10).map(({ item: a }) => {
            const partnerBadge = a.partner_name || "პარტნიორი";
            const partnerInfo = partnerMap[a.partner_name?.toLowerCase()] || null;
            const refTemplate = partnerInfo?.ref || "?ref=plantio";
            const badgeColor = partnerInfo?.color || "#16a34a";
            const finalLink = appendReferralParam(a.product_url, refTemplate);

            return {
              id: a.id,
              titleKa: a.product_name,
              titleEn: a.product_name,
              categoryKa: a.category || a.matching_tags?.[0] || "ინვენტარი",
              categoryEn: a.category || a.matching_tags?.[0] || "Supplies",
              price: a.price || 25,
              image: a.image_url || "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600",
              shopName: a.partner_name || "პარტნიორი",
              shopBadge: partnerBadge,
              shopColor: badgeColor,
              link: finalLink,
              isExternal: true,
            };
          });
          setAffiliateOffers(mapped);
        }
      } catch {
        setAffiliateOffers([]);
      }
    }

    loadAffiliateOffers();

    // Supabase Realtime Subscription
    const channel = supabase
      .channel(`listing-detail-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listings", filter: `id=eq.${id}` },
        (payload) => {
          if (payload.new && (payload.new as any).id) {
            setListing((prev: any) => ({
              ...prev,
              ...formatDbListing(payload.new, prev?.seller),
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, supabase]);

  // Load Similar Listings
  React.useEffect(() => {
    async function loadSimilar() {
      try {
        const { data: dbSimilar } = await supabase
          .from("listings")
          .select(`
            *,
            profiles:user_id (
              id,
              full_name,
              avatar_url,
              phone,
              average_rating,
              total_reviews,
              subscription_tier,
              custom_slug,
              role,
              is_admin,
              is_verified
            )
          `)
          .eq("status", "ACTIVE")
          .neq("id", id)
          .limit(8);

        if (dbSimilar && dbSimilar.length > 0) {
          setSimilarListings(dbSimilar.map((row: any) => formatDbListing(row, row.profiles)));
        } else {
          setSimilarListings([]);
        }
      } catch {
        setSimilarListings([]);
      }
    }
    loadSimilar();
  }, [id, supabase]);

  // Load Reviews for this listing / seller
  React.useEffect(() => {
    async function loadReviews() {
      if (!id) return;
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
          .eq("listing_id", id)
          .order("created_at", { ascending: false });

        if (dbReviews && dbReviews.length > 0) {
          setReviews(
            dbReviews.map((r: any) => ({
              id: r.id,
              reviewerName: r.reviewer?.full_name || (isKa ? "მომხმარებელი" : "User"),
              rating: r.rating || 5,
              comment: r.comment || "",
              createdAt: new Date(r.created_at).toLocaleDateString(isKa ? "ka-GE" : "en-US"),
            }))
          );
        }
      } catch {
        // reviews table may be empty
      }
    }
    loadReviews();
  }, [id, supabase, isKa]);

  // Wishlist Toggle
  const handleToggleWishlist = async () => {
    if (!currentUser) {
      router.push(`/login?next=/listings/${id}`);
      return;
    }
    const nextState = !inWishlist;
    setInWishlist(nextState);
    try {
      const res = await toggleWishlistAction(id);
      if (!res.success && res.error) {
        setInWishlist(!nextState);
      }
    } catch {
      setInWishlist(!nextState);
    }
  };

  // Add to Greenhouse
  const handleAddToGreenhouse = async () => {
    if (!currentUser) {
      router.push(`/login?next=/listings/${id}`);
      return;
    }
    if (!listing) return;

    try {
      await addToGreenhouseAction({
        listingId: listing.id,
        name: displayTitle,
        speciesName: careInfo?.speciesName || careInfo?.latinName || null,
        roomLocation: "მისაღები",
        wateringFrequencyDays: 7,
        imageUrl: images[0] || null,
        notes: `დამატებულია Plantio.ge-დან (${listing.seller?.name || "სელერი"})`,
      });
      setGreenhouseAdded(true);
    } catch (err) {
      console.error("Error adding to greenhouse:", err);
    }
  };

  // Submit Review
  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!currentUser) {
      router.push(`/login?next=/listings/${id}`);
      return;
    }
    setSubmittingReview(true);
    try {
      const newRev = {
        id: `rev-${Date.now()}`,
        reviewerName: currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || (isKa ? "მომხმარებელი" : "User"),
        rating,
        comment,
        createdAt: isKa ? "ახლახანს" : "Just now",
      };
      setReviews([newRev, ...reviews]);

      if (listing?.seller?.id) {
        await submitReviewAction({
          sellerId: listing.seller.id,
          listingId: listing.id,
          rating,
          comment,
        });
      }
    } catch (err) {
      console.warn("Review error:", err);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Similar items horizontal scroll ref
  const similarScrollRef = React.useRef<HTMLDivElement>(null);
  const scrollSimilar = (direction: "left" | "right") => {
    if (similarScrollRef.current) {
      const scrollAmount = 320;
      similarScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Category & Title formatting
  const rawCat = listing?.plantCategory || listing?.plant_category || listing?.inventory_category;
  const categoryLabel = rawCat && CATEGORIES_DATA[rawCat]
    ? (isKa ? CATEGORIES_DATA[rawCat].labelKa : CATEGORIES_DATA[rawCat].labelEn)
    : rawCat || undefined;

  const rawTitle = isKa ? (listing?.titleKa || listing?.title || "") : (listing?.titleEn || listing?.title || "");
  const displayTitle = rawTitle.replace(/^(\s*\s*(საჩუქარი|gift):?\s*|\s*\s*|\s*(საჩუქარი|gift):?\s*)/i, "").trim() || (isKa ? "მცენარე" : "Plant");

  const images: string[] = React.useMemo(() => {
    if (Array.isArray(listing?.images) && listing.images.length > 0) {
      return listing.images;
    }
    if (listing?.image) {
      return [listing.image];
    }
    return ["/images/placeholder-plant.jpg"];
  }, [listing]);

  // Botanical Care Metrics
  const careInfo = React.useMemo(() => {
    return listing ? getBotanicalCareDetails(listing) : {} as any;
  }, [listing]);

  const plantCareMetrics = React.useMemo(() => {
    if (!careInfo || !listing || listing.itemType === "INVENTORY") return [];
    return [
      {
        key: "light",
        icon: Sun,
        title: isKa ? "მზის განათება" : "Lighting",
        value: isKa ? careInfo.lightRequirementKa : careInfo.lightRequirementEn,
        desc: isKa ? careInfo.lightDescKa : careInfo.lightDescEn,
        color: "bg-amber-500/15 text-amber-600",
      },
      {
        key: "water",
        icon: Droplets,
        title: isKa ? "მორწყვის გრაფიკი" : "Watering",
        value: isKa ? careInfo.wateringScheduleKa : careInfo.wateringScheduleEn,
        desc: isKa ? careInfo.wateringDescKa : careInfo.wateringDescEn,
        color: "bg-blue-500/15 text-blue-600",
      },
      {
        key: "substrate",
        icon: Boxes,
        title: isKa ? "სუბსტრატი & გრუნტი" : "Substrate & Soil",
        value: isKa ? careInfo.soilTypeKa : careInfo.soilTypeEn,
        desc: isKa ? careInfo.soilDescKa : careInfo.soilDescEn,
        color: "bg-emerald-500/15 text-emerald-600",
      },
      {
        key: "temperature",
        icon: Thermometer,
        title: isKa ? "ტემპერატურა" : "Temperature",
        value: careInfo.tempRange || "18°C - 26°C",
        desc: isKa ? "მოარიდეთ ორპირ ქარს" : "Protect from cold drafts",
        color: "bg-rose-500/15 text-rose-600",
      },
      {
        key: "humidity",
        icon: Sparkles,
        title: isKa ? "ჰაერის ტენიანობა" : "Air Humidity",
        value: isKa ? careInfo.humidityKa : careInfo.humidityEn,
        desc: isKa ? careInfo.humidityDescKa : careInfo.humidityDescEn,
        color: "bg-indigo-500/15 text-indigo-600",
      },
      {
        key: "careLevel",
        icon: ShieldCheck,
        title: isKa ? "მოვლის სირთულე" : "Care Level",
        value: isKa ? careInfo.careLevelKa : careInfo.careLevelEn,
        desc: isKa ? careInfo.careLevelDescKa : careInfo.careLevelDescEn,
        color: "bg-teal-500/15 text-teal-600",
      },
    ];
  }, [careInfo, listing, isKa]);

  const inventorySpecs = React.useMemo(() => {
    if (!listing) return [];
    const specs: Array<{ label: string; value: string }> = [];
    if (listing.material) specs.push({ label: isKa ? "მასალა" : "Material", value: listing.material });
    if (listing.potDiameter) specs.push({ label: isKa ? "ქოთნის დიამეტრი" : "Pot Diameter", value: `${listing.potDiameter} სმ` });
    if (listing.heightCm) specs.push({ label: isKa ? "სიმაღლე" : "Height", value: `${listing.heightCm} სმ` });
    if (listing.brand) specs.push({ label: isKa ? "ბრენდი" : "Brand", value: listing.brand });
    return specs;
  }, [listing, isKa]);

  const tradePreferences = React.useMemo(() => {
    if (!listing) return [];
    return Array.isArray(listing.tradePreferences)
      ? listing.tradePreferences
      : Array.isArray(listing.trade_preferences)
      ? listing.trade_preferences
      : [];
  }, [listing]);

  // Google Maps directions url
  const fullAddressString = `${listing?.city || "თბილისი"}${listing?.address ? `, ${listing.address}` : ""}`;
  const targetLat = listing?.latitude ?? listing?.lat;
  const targetLng = listing?.longitude ?? listing?.lng;
  const googleMapsUrl = targetLat && targetLng
    ? `https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddressString)}`;

  const rawPhone = listing?.seller?.phone || listing?.phone || "557 57 90 20";
  const cleanPhoneDigits = rawPhone.replace(/\D/g, "") || "557579020";
  const waUrl = cleanPhoneDigits
    ? `https://wa.me/${cleanPhoneDigits.startsWith("995") ? cleanPhoneDigits : `995${cleanPhoneDigits}`}?text=${encodeURIComponent(
        listing?.transactionType === "TRADE"
          ? (isKa 
              ? `გამარჯობა! Plantio.ge-ზე ვნახე თქვენი განცხადება: "${displayTitle}". მსურს მცენარის გაცვლა.`
              : `Hello! I saw your listing on Plantio.ge: "${displayTitle}". I'd like to propose a plant swap.`)
          : (isKa
              ? `გამარჯობა! Plantio.ge-ზე ვნახე თქვენი განცხადება: "${displayTitle}". დავინტერესდი.`
              : `Hello! I saw your listing on Plantio.ge: "${displayTitle}". I'm interested.`)
      )}`
    : null;

  // Determine active badge for hero image
  const activeHeroBadge = listing?.isFeatured || listing?.isPremium
    ? ("VIP" as const)
    : listing?.transactionType === "GIFT"
    ? ("GIFT" as const)
    : listing?.transactionType === "TRADE"
    ? ("TRADE" as const)
    : null;

  const isOwnerOrAdmin = Boolean(
    currentUser && (currentUser.id === listing?.user_id || currentUserProfile?.is_admin)
  );

  if (loadingListing) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center space-y-3 min-h-[50vh]">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-muted-foreground">
          {isKa ? "განცხადება იტვირთება..." : "Loading listing..."}
        </p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold">{isKa ? "განცხადება ვერ მოიძებნა" : "Listing not found"}</h2>
        <Link href="/listings" className="inline-block px-4 py-2 rounded-[12px] bg-primary text-white text-sm font-bold">
          {isKa ? "მარკეტში დაბრუნება" : "Back to Marketplace"}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Main Container (pb-24 ensures sticky mobile bar never occludes content) ── */}
      <div className="container mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-8 max-w-6xl space-y-6">
        
        {/* ── Breadcrumb Navigation ── */}
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <Link
            href={listing.transactionType === "TRADE" ? "/iso" : "/listings"}
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>
              {listing.transactionType === "TRADE" 
                ? (isKa ? "გაცვლის კატალოგში დაბრუნება" : "Back to Exchange")
                : (isKa ? "მარკეტში დაბრუნება" : "Back to Marketplace")}
            </span>
          </Link>

          {isOwnerOrAdmin && (
            <Link
              href={`/dashboard/listings/edit/${listing.id}`}
              className="text-xs font-bold text-primary hover:underline"
            >
              {isKa ? "განცხადების რედაქტირება" : "Edit Listing"}
            </Link>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            BALANCED 2-COLUMN HERO ARCHITECTURE
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-start">
          
          {/* ── LEFT COLUMN: Gallery + (If Trade) ISO Box + Progressive Tabs ── */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Clean 4:3 Hero Gallery */}
            <ListingHeroGallery
              images={images}
              title={displayTitle}
              activeBadge={activeHeroBadge}
              isKa={isKa}
            />

            {/* 2. Trade ISO Preferences (If Trade listing) */}
            {listing.transactionType === "TRADE" && (
              <ListingTradeBox
                tradePreferences={tradePreferences}
                whatsappUrl={waUrl || undefined}
                isKa={isKa}
              />
            )}

            {/* 3. Progressive Disclosure Tabs (Description, Care, Reviews, Supplies) */}
            <ListingInfoTabs
              description={listing.description}
              plantCareMetrics={plantCareMetrics}
              itemType={listing.itemType || listing.item_type}
              inventorySpecs={inventorySpecs}
              reviews={reviews}
              onReviewSubmit={handleReviewSubmit}
              submittingReview={submittingReview}
              affiliateOffers={affiliateOffers}
              isKa={isKa}
              currentUser={currentUser}
              onRequireAuth={() => router.push(`/login?next=/listings/${id}`)}
            />
          </div>

          {/* ── RIGHT COLUMN: Sticky Action Card + Unified Seller Card ── */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4 self-start">
            {/* Action Box */}
            <ListingActionCard
              title={displayTitle}
              categoryLabel={categoryLabel}
              city={listing.city}
              address={listing.address}
              googleMapsUrl={googleMapsUrl}
              price={listing.price}
              transactionType={listing.transactionType}
              deliveryOptions={{
                pickup: listing.deliveryPickup ?? listing.delivery_pickup,
                courier: listing.deliveryCourier ?? listing.delivery_courier,
                post: listing.deliveryPost ?? listing.delivery_post,
              }}
              phone={listing.seller?.phone || listing.phone}
              whatsapp={listing.seller?.phone || listing.phone}
              inWishlist={inWishlist}
              onToggleWishlist={handleToggleWishlist}
              onOpenShare={() => setShareModalOpen(true)}
              onAddToGreenhouse={handleAddToGreenhouse}
              greenhouseAdded={greenhouseAdded}
              greenhouseEnabled={greenhouseEnabled}
              isOwnerOrAdmin={isOwnerOrAdmin}
              onEditListing={() => router.push(`/dashboard/listings/edit/${listing.id}`)}
              isKa={isKa}
            />

            {/* Seller Credibility Card */}
            {listing.seller && (
              <UnifiedSellerCard
                id={listing.seller.id}
                name={listing.seller.name || listing.seller.fullName || (isKa ? "გამყიდველი" : "Seller")}
                avatar={listing.seller.avatar || listing.seller.avatarUrl}
                rating={listing.seller.rating || 5.0}
                reviewsCount={listing.seller.reviewsCount || reviews.length}
                isVerified={listing.seller.isVerified}
                isPro={listing.seller.isPro}
                responseTime={listing.seller.responseTime || (isKa ? "პასუხობს 1 სთ-ში" : "Replies in 1h")}
                shopUrl={listing.seller.customSlug ? `/shops/${listing.seller.customSlug}` : undefined}
                badgeLabel={isKa ? "ვერიფიცირებული გამყიდველი" : "Verified Seller"}
                isOnVacation={listing.seller.isOnVacation}
                isKa={isKa}
              />
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            SIMILAR LISTINGS (Horizontal Snap Slider)
        ══════════════════════════════════════════════════════════════════════ */}
        {similarListings.length > 0 && (
          <div className="pt-6 border-t border-border/60 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-foreground">
                  {isKa ? "მსგავსი განცხადებები" : "Similar Listings"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isKa ? "სხვა მცენარეები და შეთავაზებები მარკეტიდან" : "More plants and offers you might like"}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollSimilar("left")}
                  aria-label="Previous listings"
                  className="h-8 w-8 rounded-full border border-border/80 bg-background hover:bg-secondary-container flex items-center justify-center text-foreground transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollSimilar("right")}
                  aria-label="Next listings"
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
              {similarListings.map((sim) => (
                <div key={sim.id} className="snap-start w-[220px] sm:w-[240px] shrink-0">
                  <ListingCard {...sim} />
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
          {/* Left: Price or Trade */}
          <div className="min-w-0">
            <span className="text-[10px] text-muted-foreground font-semibold block truncate">
              {listing.seller?.name || (isKa ? "ავტორი" : "Author")}
            </span>
            <span className="text-base font-black text-foreground tracking-tight">
              {listing.transactionType === "TRADE" 
                ? (isKa ? "გაცვლა" : "Trade") 
                : listing.transactionType === "GIFT" 
                ? (isKa ? "უფასო" : "Free") 
                : formatPrice(listing.price)}
            </span>
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
        title={displayTitle}
      />
    </div>
  );
}
