"use client";

import * as React from "react";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { SAMPLE_LISTINGS } from "@/lib/mock-data";
import { ListingCard } from "@/components/listings/ListingCard";
import { ShareModal } from "@/components/common/ShareModal";
import { EscrowCheckoutModal } from "@/components/checkout/EscrowCheckoutModal";
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
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Store,
  Lock,
  Send,
  AlertCircle,
  CheckCircle2,
  Gift,
  ExternalLink,
  Edit3,
  ShoppingBag,
  Layers,
  Sun,
  Droplets,
  Thermometer,
  Boxes,
  Copy,
  Check,
  Eye,
  Navigation,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { getBotanicalCareDetails } from "@/lib/botanical-care";
import { ReviewsSkeleton, RecommendedInventorySkeleton } from "@/components/common/DetailSkeletons";
import { submitReviewAction } from "@/app/actions/reviews";
import { toggleWishlistAction, addToGreenhouseAction } from "@/app/actions/listings";
import { usePlatformSettings } from "@/lib/platform-settings";
import { detectAffiliateTags, appendReferralParam } from "@/lib/affiliate-tagger";

// ─── Social Platform Icons ──────────────────────────────────────────────────
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-4 h-4 fill-current"} viewBox="0 0 24 24">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-4 h-4 fill-current"} viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-4 h-4 fill-current"} viewBox="0 0 24 24">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.87 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.941z"/>
    </svg>
  );
}

function getLocalizedBadge(badge: string, isKa: boolean) {
  const b = badge.toLowerCase();
  if (b.includes("trusted") || b.includes("trust") || b.includes("სანდო")) {
    return {
      label: isKa ? "სანდო გამყიდველი" : "Trusted Seller",
      icon: ShieldCheck,
      color: "text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/30",
    };
  }
  if (b.includes("verif") || b.includes("ვერიფიცირებული")) {
    return {
      label: isKa ? "ვერიფიცირებული" : "Verified",
      icon: CheckCircle2,
      color: "text-blue-800 dark:text-blue-300 bg-blue-500/15 border-blue-500/30",
    };
  }
  if (b.includes("green") || b.includes("thumb") || b.includes("მებაღე")) {
    return {
      label: isKa ? "გამოცდილი მებაღე" : "Experienced Grower",
      icon: Sprout,
      color: "text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/30",
    };
  }
  if (b.includes("top") || b.includes("ტოპ")) {
    return {
      label: isKa ? "ტოპ გამყიდველი" : "Top Seller",
      icon: Award,
      color: "text-amber-800 dark:text-amber-300 bg-amber-500/15 border-amber-500/30",
    };
  }
  return {
    label: badge,
    icon: ShieldCheck,
    color: "text-foreground bg-secondary-container/80 border-border/60",
  };
}

// ─── Curated Partner Retailers & Agro Hypermarkets (Domino, Gorgia, Agrohub, Bricorama) ───
const RECOMMENDED_INVENTORY = [
  {
    id: "rec-inv-1",
    titleKa: "აროიდების & ტროპიკული მცენარეების სუბსტრატი (5L)",
    titleEn: "Aroids & Tropical Plants Substrate (5L)",
    categoryKa: "სუბსტრატი & გრუნტი",
    categoryEn: "Soil & Substrate",
    price: 19,
    image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&auto=format&fit=crop&q=80",
    shopName: "დომინო",
    shopBadge: "დომინო",
    shopLogo: "",
    shopColor: "bg-[#0055a5] text-white border border-white/20",
    link: "https://domino.com.ge",
    isExternal: true,
  },
  {
    id: "rec-inv-2",
    titleKa: "კერამიკული მქრქალი ქოთანი სადგამით (18 სმ)",
    titleEn: "Matte Ceramic Pot with Saucer (18 cm)",
    categoryKa: "ქოთნები",
    categoryEn: "Planters & Pots",
    price: 38,
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&auto=format&fit=crop&q=80",
    shopName: "გორგია",
    shopBadge: "გორგია",
    shopLogo: "",
    shopColor: "bg-[#e35205] text-white border border-white/20",
    link: "https://gorgia.ge",
    isExternal: true,
  },
  {
    id: "rec-inv-3",
    titleKa: "ორგანული სასუქი & ფესვის ზრდის ელექსირი (500 მლ)",
    titleEn: "Organic Fertilizer & Root Growth Elixir (500 ml)",
    categoryKa: "სასუქი & მოვლა",
    categoryEn: "Fertilizer & Care",
    price: 24,
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&auto=format&fit=crop&q=80",
    shopName: "აგროჰაბი",
    shopBadge: "აგროჰაბი",
    shopLogo: "",
    shopColor: "bg-[#0b8043] text-white border border-white/20",
    link: "https://agrohub.ge",
    isExternal: true,
  },
  {
    id: "rec-inv-4",
    titleKa: "ფიტო-განათება მცენარეებისთვის (Full Spectrum LED)",
    titleEn: "Full Spectrum LED Grow Light for Indoor Plants",
    categoryKa: "Grow Light",
    categoryEn: "Grow Light",
    price: 59,
    image: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80",
    shopName: "ბრიკორამა",
    shopBadge: "ბრიკორამა",
    shopLogo: "",
    shopColor: "bg-[#c8102e] text-white border border-white/20",
    link: "https://bricorama.ge",
    isExternal: true,
  },
  {
    id: "rec-inv-5",
    titleKa: "ბოტანიკური უჟანგავი მოსავლელი მაკრატელი",
    titleEn: "Botanical Stainless Steel Pruning Shears",
    categoryKa: "ხელსაწყოები",
    categoryEn: "Care Tools",
    price: 18,
    image: "https://images.unsplash.com/photo-1592150621744-aca64f48394a?w=600&auto=format&fit=crop&q=80",
    shopName: "აგრო სექტორი",
    shopBadge: "აგრო სექტორი",
    shopLogo: "",
    shopColor: "bg-[#0284c7] text-white border border-white/20",
    link: "/listings?type=INVENTORY",
    isExternal: false,
  },
  {
    id: "rec-inv-6",
    titleKa: "ქოქოსის ბოჭკოს ხავსის საყრდენი ბოძი (Moss Pole 60 სმ)",
    titleEn: "Coco Coir Moss Pole Support (60 cm)",
    categoryKa: "აქსესუარები",
    categoryEn: "Accessories",
    price: 14,
    image: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600&auto=format&fit=crop&q=80",
    shopName: "დომინო",
    shopBadge: "დომინო",
    shopLogo: "",
    shopColor: "bg-[#0055a5] text-white border border-white/20",
    link: "https://domino.com.ge",
    isExternal: true,
  },
];

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

import { formatDbListing } from "@/lib/listings-service";

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

  const [activeImageIdx, setActiveImageIdx] = React.useState(0);
  const [showPhone, setShowPhone] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = React.useState(false);

  // ── Wishlist State ──
  const [inWishlist, setInWishlist] = React.useState(false);
  const [wishlistNotice, setWishlistNotice] = React.useState("");
  const [shareModalOpen, setShareModalOpen] = React.useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = React.useState(false);

  // ── Dynamic Affiliate Cross-Selling Offers ──
  const [affiliateOffers, setAffiliateOffers] = React.useState<any[]>(RECOMMENDED_INVENTORY);
  const [activeTab, setActiveTab] = React.useState<"care" | "description" | "reviews" | "inventory">("care");
  const [isInventoryHovered, setIsInventoryHovered] = React.useState(false);

  // Scroll to top immediately upon entering page
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as any });
    }
  }, [id]);

  // Fetch real listing & track view from Supabase
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
              average_rating,
              total_reviews,
              subscription_tier,
              custom_slug,
              is_on_vacation
            )
          `)
          .eq("id", id)
          .single();

        if (dbRow && !error) {
          const targetUser = dbRow.profiles;
          const formatted = formatDbListing(dbRow, targetUser);
          setListing(formatted);
          if (formatted.images && formatted.images.length > 0) {
            setActiveImageIdx(0);
          }
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
          const sample = SAMPLE_LISTINGS.find((l) => l.id === id);
          if (sample) setListing(sample);
          return sample;
        }
      } catch {
        const sample = SAMPLE_LISTINGS.find((l) => l.id === id);
        if (sample) setListing(sample);
        return sample;
      } finally {
        setLoadingListing(false);
      }
    }

    async function loadAffiliateOffers() {
      try {
        const targetListing = await loadRealListing();

        // 1. Fetch Partner configs (referral params, colors)
        const { data: partnerData } = await supabase
          .from("affiliate_partners")
          .select("name, referral_param_template, badge_color")
          .eq("is_active", true);

        const partnerMap: Record<string, { ref: string; color: string }> = {};
        if (partnerData) {
          for (const p of partnerData) {
            partnerMap[p.name.toLowerCase()] = {
              ref: p.referral_param_template || "?ref=plantge",
              color: p.badge_color || "#16a34a",
            };
          }
        }

        const { data: affData, error: affErr } = await supabase
          .from("affiliate_products")
          .select("*")
          .eq("is_active", true)
          .limit(120);

        if (!affErr && affData && affData.length > 0) {
          const lObj = targetListing as any;
          const lTitle = lObj?.title || lObj?.titleKa || "";
          const lDesc = lObj?.description || lObj?.descriptionKa || "";
          const lCategory = lObj?.category || lObj?.categoryKa || "";
          const listingTags = detectAffiliateTags(lTitle, `${lDesc} ${lCategory}`);

          // Score products: higher score for matching tags and categories
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

          // Group by category to ensure rich diversity (never 5 identical items in a row)
          const categoryBuckets: Record<string, typeof scored> = {};
          for (const entry of scored) {
            const catKey = entry.item.category || "სხვა";
            if (!categoryBuckets[catKey]) categoryBuckets[catKey] = [];
            categoryBuckets[catKey].push(entry);
          }

          const diverseScored: typeof scored = [];
          const bucketKeys = Object.keys(categoryBuckets);
          let round = 0;
          let added = true;

          while (added && diverseScored.length < 20) {
            added = false;
            for (const key of bucketKeys) {
              if (categoryBuckets[key][round]) {
                diverseScored.push(categoryBuckets[key][round]);
                added = true;
                if (diverseScored.length >= 20) break;
              }
            }
            round++;
          }

          const mapped = diverseScored.map(({ item: a }) => {
            const partnerBadge = a.partner_name || "პარტნიორი";
            const partnerInfo = partnerMap[a.partner_name?.toLowerCase()] || null;
            const refTemplate = partnerInfo?.ref || "?ref=plantge";
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
              rawLink: a.product_url,
              referralParam: refTemplate,
              isExternal: true,
            };
          });

          // Prioritize real products from database. Only backfill if fewer than 4 items exist
          const backfill = mapped.length < 4 ? RECOMMENDED_INVENTORY.slice(0, 4 - mapped.length) : [];
          setAffiliateOffers([...mapped, ...backfill]);
        }
      } catch {
        // fallback
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

  const handleToggleWishlist = async () => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    const nextState = !inWishlist;
    setInWishlist(nextState);
    setWishlistNotice(
      nextState
        ? isKa ? "დაემატა რჩეულებში" : "Added to wishlist"
        : isKa ? "მოიხსნა რჩეულებიდან" : "Removed from wishlist"
    );
    setTimeout(() => setWishlistNotice(""), 3000);
    try {
      const res = await toggleWishlistAction(id);
      if (!res.success && res.error) {
        setInWishlist(!nextState);
      }
    } catch {
      setInWishlist(!nextState);
    }
  };

  const rawCat = listing?.plantCategory || listing?.plant_category || listing?.inventory_category;
  const categoryInfo = rawCat && CATEGORIES_DATA[rawCat]
    ? {
        label: isKa ? CATEGORIES_DATA[rawCat].labelKa : CATEGORIES_DATA[rawCat].labelEn,
      }
    : rawCat
    ? { label: rawCat }
    : null;

  const rawTitle = isKa ? (listing?.titleKa || listing?.title || "") : (listing?.titleEn || listing?.title || "");
  const displayTitle = rawTitle.replace(/^(\s*\s*(საჩუქარი|gift):?\s*|\s*\s*|\s*(საჩუქარი|gift):?\s*)/i, "").trim();

  // Dynamic botanical care info matching species, plant category and tags
  const careInfo = React.useMemo(() => {
    return listing ? getBotanicalCareDetails(listing) : {} as any;
  }, [listing]);

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

  // Auto-play smooth carousel motion for recommended inventory
  React.useEffect(() => {
    if (activeTab !== "inventory" || isInventoryHovered) return;
    const interval = setInterval(() => {
      if (inventoryScrollRef.current) {
        const container = inventoryScrollRef.current;
        const maxScroll = container.scrollWidth - container.clientWidth;
        if (container.scrollLeft >= maxScroll - 15) {
          container.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          container.scrollBy({ left: 240, behavior: "smooth" });
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [activeTab, isInventoryHovered]);

  // Similar plant listings (excluding current listing)
  const similarListings = SAMPLE_LISTINGS.filter((l) => l.id !== listing?.id);

  // Reviews state
  const [reviews, setReviews] = React.useState<any[]>([
    {
      id: "rev-1",
      reviewerName: isKa ? "გიორგი მ." : "George M.",
      rating: 5,
      comment: isKa ? "ძალიან ჯანსაღი მცენარეა, შეფუთული იყო იდეალურად და კურიერმა სწრაფად მომიტანა!" : "Very healthy plant, packaged perfectly and delivered quickly by courier!",
      createdAt: isKa ? "3 დღის წინ" : "3 days ago",
    },
    {
      id: "rev-2",
      reviewerName: isKa ? "ანა ბ." : "Anna B.",
      rating: 5,
      comment: isKa ? "სანდო გამყიდველია, მცენარე ზუსტად ისეთი იყო როგორც ფოტოებზე." : "Trusted seller, plant was exactly as pictured.",
      createdAt: isKa ? "1 კვირის წინ" : "1 week ago",
    }
  ]);
  const [newRating, setNewRating] = React.useState(5);
  const [newComment, setNewComment] = React.useState("");
  const [reviewSubmitted, setReviewSubmitted] = React.useState(false);

  const [currentUserProfile, setCurrentUserProfile] = React.useState<any>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setCurrentUser(user);
      if (user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("is_admin, subscription_tier")
          .eq("id", user.id)
          .single();
        if (prof) setCurrentUserProfile(prof);
      }
    });
  }, [supabase]);

  const [copiedLink, setCopiedLink] = React.useState(false);

  // Seller phone formatting
  const rawSellerPhone = listing?.seller?.phone || "557 579 123";
  const cleanPhoneDigits = rawSellerPhone.replace(/\D/g, "") || "557579123";

  // Masked format: "557 579 ***"
  const maskedPhone = cleanPhoneDigits.length >= 6 
    ? `${cleanPhoneDigits.slice(0, 3)} ${cleanPhoneDigits.slice(3, 6)} ***`
    : "557 579 ***";

  // Full formatted phone: "557 579 123"
  const formattedFullPhone = cleanPhoneDigits.length >= 9
    ? `${cleanPhoneDigits.slice(0, 3)} ${cleanPhoneDigits.slice(3, 6)} ${cleanPhoneDigits.slice(6, 9)}`
    : rawSellerPhone;

  const handlePhoneAction = () => {
    if (!showPhone) {
      setShowPhone(true);
    } else {
      window.location.href = `tel:+995${cleanPhoneDigits}`;
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareFbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
  const shareWaUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${displayTitle} - Plant.ge\n${currentUrl}`)}`;
  const shareTgUrl = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(displayTitle)}`;
  const directWaChatUrl = `https://wa.me/995${cleanPhoneDigits}?text=${encodeURIComponent(
    isKa 
      ? `გამარჯობა, დავინტერესდი თქვენი მცენარით Plant.ge-ზე: "${displayTitle}"`
      : `Hello, I'm interested in your listing on Plant.ge: "${displayTitle}"`
  )}`;

  const fullAddressString = `${listing?.city || "თბილისი"}${listing?.address ? `, ${listing.address}` : ""}`;
  const targetLat = listing?.latitude ?? (listing as any)?.lat;
  const targetLng = listing?.longitude ?? (listing as any)?.lng;
  const googleMapsUrl = targetLat && targetLng
    ? `https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddressString)}`;

  const handleChatClick = () => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    if (!listing?.seller?.id) return;
    router.push(`/dashboard/messages?listing=${listing.id}&seller=${listing.seller.id}`);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    if (!newComment.trim()) return;

    const newRev = {
      id: `rev-${Date.now()}`,
      reviewerName: currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || (isKa ? "მომხმარებელი" : "User"),
      rating: newRating,
      comment: newComment.trim(),
      createdAt: isKa ? "ახლახანს" : "Just now",
    };

    setReviews([newRev, ...reviews]);
    const commentToSend = newComment.trim();
    setNewComment("");
    setReviewSubmitted(true);
    setTimeout(() => setReviewSubmitted(false), 4000);

    if (listing?.seller?.id) {
      try {
        await submitReviewAction({
          sellerId: listing.seller.id,
          listingId: listing.id,
          rating: newRating,
          comment: commentToSend,
        });
      } catch (err) {
        console.warn("Review action sync:", err);
      }
    }
  };

  const [greenhouseAdded, setGreenhouseAdded] = React.useState(false);
  const [addingToGreenhouse, setAddingToGreenhouse] = React.useState(false);

  const handleAddToGreenhouse = async () => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    if (!listing) return;

    setAddingToGreenhouse(true);
    try {
      const res = await addToGreenhouseAction({
        listingId: listing.id,
        name: displayTitle,
        speciesName: careInfo?.speciesName || careInfo?.latinName || null,
        roomLocation: "მისაღები",
        wateringFrequencyDays: 7,
        imageUrl: images[0] || null,
        notes: `დამატებულია Plant.ge-დან (${listing.seller?.fullName || "სელერი"})`,
      });

      setGreenhouseAdded(true);
      setWishlistNotice(isKa ? `მცენარე „${displayTitle}“ დაემატა თქვენს ორანჟერეაში!` : `Added "${displayTitle}" to your Greenhouse!`);
      setTimeout(() => setWishlistNotice(""), 4000);
    } catch (err) {
      console.error("Error adding plant to greenhouse:", err);
    } finally {
      setAddingToGreenhouse(false);
    }
  };

  if (loadingListing) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center space-y-3 min-h-[50vh]">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-muted-foreground">{isKa ? "განცხადება იტვირთება..." : "Loading listing..."}</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center space-y-4 min-h-[50vh]">
        <Sprout className="w-12 h-12 text-muted-foreground/50" />
        <h2 className="text-xl font-bold text-foreground">{isKa ? "განცხადება ვერ მოიძებნა" : "Listing not found"}</h2>
        <p className="text-xs text-muted-foreground max-w-sm">
          {isKa ? "შესაძლოა განცხადება წაიშალა ან ვადა გაუვიდა." : "This listing may have been removed or expired."}
        </p>
        <Link href="/listings">
          <Button className="rounded-[14px] bg-primary text-white text-xs font-bold h-10 px-5">
            {isKa ? "კატალოგში დაბრუნება" : "Back to Catalog"}
          </Button>
        </Link>
      </div>
    );
  }

  const images: string[] = Array.isArray(listing.images) && listing.images.length > 0 ? listing.images : [
    "https://images.unsplash.com/photo-1545241047-6083a3684587?w=800&auto=format&fit=crop&q=80"
  ];

  const isOwner = currentUser && (currentUser.id === listing.seller?.id || currentUser.id === (listing as any).userId || currentUser.id === (listing as any).user_id);
  const isAdmin = currentUser?.email === "tokolejo@gmail.com" || currentUserProfile?.is_admin === true;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-8 max-w-6xl">
      {/* Schema.org Structured Data for Google Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            name: displayTitle,
            image: images,
            description: listing?.description || displayTitle,
            sku: `PLANT-${listing?.id}`,
            offers: {
              "@type": "Offer",
              url: typeof window !== "undefined" ? window.location.href : `https://plantsale.ge/${locale}/listings/${listing?.id}`,
              priceCurrency: "GEL",
              price: listing?.price || 0,
              availability: listing?.status === "ACTIVE" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              seller: {
                "@type": "Person",
                name: listing?.seller?.name || listing?.seller?.fullName || "Plant Seller",
              },
            },
          }),
        }}
      />

      {/* Top Bar: Breadcrumb + Edit Button for Owner / Admin */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <Link
          href="/listings"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {isKa ? "უკან კატალოგში" : "Back to catalog"}
        </Link>

        {(isOwner || isAdmin) && (
          <Link href={`/dashboard/listings/${listing.id}/edit`}>
            <Button
              size="sm"
              className="rounded-[14px] bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs h-9 px-4 gap-1.5 shadow-ambient cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isKa ? "განცხადების რედაქტირება" : "Edit Listing"}</span>
              {isAdmin && !isOwner && <span className="text-[10px] opacity-90">(Admin)</span>}
            </Button>
          </Link>
        )}
      </div>

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
                alt={displayTitle}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 700px"
                priority
              />

              {/* Badges on Large Image */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                {(listing.isFeatured || listing.isPremium) && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-xs px-2.5 py-0.5 shadow-md border-0 rounded-[9px]">
                    VIP TOP
                  </Badge>
                )}
                {listing.transactionType === "GIFT" && (
                  <Badge className="bg-emerald-600 text-white font-black text-xs px-2.5 py-0.5 shadow-md border-0 rounded-[9px] flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5" /> {isKa ? "გაჩუქება (უფასოდ)" : "Giveaway (Free)"}
                  </Badge>
                )}
                {listing.transactionType === "TRADE" && (
                  <Badge className="bg-amber-500 text-white font-bold text-xs px-2.5 py-0.5 shadow-md border-0 rounded-[9px] flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5" /> {isKa ? "გაცვლა" : "Swap / Trade"}
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
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            RIGHT COLUMN: Pricing, Contacts, Seller Profile & Feedback/Reviews
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Info Card (Variant 1: Clean & Elevated) */}
          <div className="rounded-[22px] border border-border/80 bg-card p-4 sm:p-5 shadow-ambient space-y-3.5">
            {/* Top Row: Category Tags + Quick Top-Right Icon Actions (Wishlist & Share & Copy) */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                {/* 1. Item Type Tag (Clickable) */}
                <Link href={`/listings?type=${listing.itemType}`}>
                  <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/20 hover:scale-105 transition-all border border-primary/25 text-[11px] font-bold cursor-pointer gap-1 py-0.5 px-2.5 flex items-center">
                    {listing.itemType === "PLANT" ? (
                      <>
                        <Sprout className="w-3 h-3 text-primary" />
                        <span>{isKa ? "მცენარე" : "Plant"}</span>
                      </>
                    ) : (
                      <span>{isKa ? "ინვენტარი" : "Care & Pots"}</span>
                    )}
                  </Badge>
                </Link>

                {/* 2. Specific Plant / Inventory Category Tag (Clickable) */}
                {categoryInfo && (
                  <Link href={`/listings?category=${encodeURIComponent(rawCat || "")}`}>
                    <Badge variant="secondary" className="rounded-full bg-secondary-container/80 text-foreground hover:bg-secondary hover:scale-105 transition-all border border-border/50 text-[11px] font-semibold cursor-pointer py-0.5 px-2.5">
                      <span>{categoryInfo.label}</span>
                    </Badge>
                  </Link>
                )}

                {/* 3. Transaction Type Tag (Clickable) */}
                {listing.transactionType === "GIFT" && (
                  <Link href="/listings?trans=GIFT">
                    <Badge className="rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/25 transition-all border border-emerald-500/30 font-bold text-[11px] cursor-pointer py-0.5 px-2.5">
                      {isKa ? "უფასო" : "Free"}
                    </Badge>
                  </Link>
                )}
                {listing.transactionType === "TRADE" && (
                  <Link href="/listings?trans=TRADE">
                    <Badge className="rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25 transition-all border border-amber-500/30 font-bold text-[11px] cursor-pointer py-0.5 px-2.5">
                      {isKa ? "გაცვლა" : "Trade / Swap"}
                    </Badge>
                  </Link>
                )}
                {listing.transactionType === "NEGOTIABLE" && (
                  <Link href="/listings?trans=NEGOTIABLE">
                    <Badge variant="secondary" className="rounded-full text-[11px] font-bold hover:bg-secondary transition-all border border-border/50 cursor-pointer py-0.5 px-2.5">
                      {isKa ? "შეთანხმებით" : "Negotiable"}
                    </Badge>
                  </Link>
                )}
                {listing.transactionType === "FIXED" && (
                  <Link href="/listings?trans=FIXED">
                    <Badge variant="secondary" className="rounded-full text-[11px] font-bold hover:bg-secondary transition-all border border-border/50 cursor-pointer py-0.5 px-2.5">
                      {isKa ? "იყიდება" : "For Sale"}
                    </Badge>
                  </Link>
                )}
              </div>

              {/* Quick Actions (Wishlist & Share & Copy) - Clean & Compact in top right */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                    inWishlist
                      ? "bg-rose-500 text-white border-rose-500 shadow-xs"
                      : "bg-secondary-container hover:bg-secondary text-muted-foreground hover:text-rose-500 border-border/60"
                  }`}
                  title={inWishlist ? (isKa ? "შენახულია რჩეულებში" : "Saved in wishlist") : (isKa ? "სურვილების სიაში დამატება" : "Add to wishlist")}
                >
                  <Heart className={`w-3.5 h-3.5 ${inWishlist ? "fill-current" : ""}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setShareModalOpen(true)}
                  className="w-8 h-8 rounded-full border border-border/60 bg-secondary-container hover:bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer"
                  title={isKa ? "გაზიარება" : "Share"}
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  title={copiedLink ? (isKa ? "დაკოპირდა!" : "Copied!") : (isKa ? "ლინკის კოპირება" : "Copy Link")}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                    copiedLink
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-secondary-container hover:bg-secondary text-muted-foreground hover:text-foreground border-border/60"
                  }`}
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Title & Location */}
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight leading-snug">
                {displayTitle}
              </h1>

              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground font-medium flex-wrap">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <Link
                  href={`/listings?city=${encodeURIComponent(listing.city)}`}
                  className="hover:text-primary font-bold text-foreground transition-colors"
                >
                  {listing.city}
                </Link>
                {listing.address && (
                  <>
                    <span>•</span>
                    <span className="text-foreground font-semibold">{listing.address}</span>
                  </>
                )}
                <span>•</span>
                {/* Google Maps Directions Link */}
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 dark:text-emerald-400 hover:underline font-bold inline-flex items-center gap-0.5 text-[11px] shrink-0"
                  title={isKa ? "მარშრუტის გახსნა Google Maps-ში" : "Open directions in Google Maps"}
                >
                  <span>Maps ↗</span>
                </a>
              </div>
            </div>

            {/* Price & Status Row (Clean & Elevated - no bulky box) */}
            <div className="pt-3 pb-3 border-y border-border/50 flex items-center justify-between">
              {listing.transactionType === "GIFT" || listing.price === 0 || !listing.price ? (
                <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400">
                  {isKa ? "უფასო / გაჩუქება" : "FREE / Giveaway"}
                </span>
              ) : listing.transactionType === "TRADE" ? (
                <span className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <RefreshCw className="w-5 h-5" />
                  <span>{isKa ? "მხოლოდ გაცვლა" : "Trade Only"}</span>
                </span>
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                    {formatPrice(listing.price, "₾", isKa)}
                  </span>
                  {listing.transactionType === "NEGOTIABLE" && (
                    <span className="text-xs text-muted-foreground font-bold">
                      {isKa ? "(შეთანხმებით)" : "(Negotiable)"}
                    </span>
                  )}
                </div>
              )}

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {isKa ? "აქტიური" : "Active"}
              </span>
            </div>

            {/* Delivery Methods (Clean Horizontal Tags) */}
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="text-muted-foreground text-[11px] font-semibold">{isKa ? "მიწოდება:" : "Delivery:"}</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                  listing.deliveryMethods?.includes("PICKUP")
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                    : "text-muted-foreground/40 line-through opacity-50"
                }`}>
                  {listing.deliveryMethods?.includes("PICKUP") ? "✓ " : ""}{isKa ? "ადგილიდან" : "Pickup"}
                </span>

                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                  listing.deliveryMethods?.includes("COURIER")
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                    : "text-muted-foreground/40 line-through opacity-50"
                }`}>
                  {listing.deliveryMethods?.includes("COURIER") ? "✓ " : ""}{isKa ? "კურიერი" : "Courier"}
                </span>

                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                  listing.deliveryMethods?.includes("MARSHRUTKA")
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                    : "text-muted-foreground/40 line-through opacity-50"
                }`}>
                  {listing.deliveryMethods?.includes("MARSHRUTKA") ? "✓ " : ""}{isKa ? "სამარშრუტო" : "Intercity"}
                </span>
              </div>
            </div>

            {/* Primary Actions Group */}
            <div className="space-y-2.5 pt-1">
              {/* Primary Phone Reveal & Dial */}
              <button
                type="button"
                onClick={handlePhoneAction}
                className="w-full h-11 px-4 rounded-[14px] font-bold flex items-center justify-center gap-2.5 bg-emerald-700 hover:bg-emerald-800 text-white transition-all cursor-pointer shadow-xs"
              >
                <Phone className="w-4 h-4 shrink-0 text-emerald-200" />
                <span className="text-sm font-black tracking-wider">
                  {showPhone ? formattedFullPhone : maskedPhone}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-900/60 text-emerald-100 font-black ml-0.5">
                  {showPhone ? (isKa ? "დარეკვა" : "Call") : (isKa ? "ნახვა" : "Show")}
                </span>
              </button>

              {/* Direct WhatsApp Messaging Button */}
              <a
                href={directWaChatUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-10 px-4 rounded-[12px] font-bold text-xs flex items-center justify-center gap-2 border border-[#25D366]/40 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] dark:text-[#25D366] transition-colors cursor-pointer shadow-2xs"
              >
                <WhatsAppIcon className="w-4 h-4 fill-current" />
                <span className="font-extrabold">{isKa ? "WhatsApp-ში მიწერა" : "Chat on WhatsApp"}</span>
              </a>

              {/* 1-Click Greenhouse Bridge */}
              {greenhouseEnabled && (
                <button
                  type="button"
                  disabled={addingToGreenhouse || greenhouseAdded}
                  onClick={handleAddToGreenhouse}
                  className={`w-full h-9 px-3 rounded-[12px] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                    greenhouseAdded
                      ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 cursor-default"
                      : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
                  }`}
                >
                  {greenhouseAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isKa ? "ორანჟერეაშია" : "In Your Greenhouse"}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isKa ? "ჩემს ორანჟერეაში დამატება" : "Add to My Greenhouse"}</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Wishlist Notice */}
            {wishlistNotice && (
              <div className="rounded-[12px] bg-primary/10 border border-primary/30 p-2 text-center text-xs text-primary font-bold animate-in fade-in">
                {wishlistNotice}
              </div>
            )}

            {/* Bottom Metadata */}
            <div className="pt-2.5 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground font-medium">
              <span>ID: {listing.id.slice(0, 8)}...</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>{listing.viewsCount || 100}+ {isKa ? "ნახვა" : "views"}</span>
              </span>
            </div>
          </div>

          {/* Seller Vacation Warning Banner */}
          {(listing.seller?.isOnVacation || listing.seller?.is_on_vacation) && (
            <div className="rounded-[18px] bg-amber-500/15 border border-amber-500/30 p-3.5 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-2.5 shadow-2xs animate-in fade-in">
              <span className="text-sm font-black uppercase tracking-wider bg-amber-500/20 px-2 py-0.5 rounded-md">
                {isKa ? "შვებულება" : "Vacation"}
              </span>
              <div>
                <p className="leading-snug">
                  {isKa
                    ? "გამყიდველი იმყოფება შვებულებაში — შეტყობინებაზე ან ზარზე პასუხი შეიძლება დაგვიანდეს"
                    : "Seller is currently on vacation mode — replies may be delayed"}
                </p>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              SELLER PROFILE CARD (Modern, Compact & Trustworthy)
          ══════════════════════════════════════════════════════════════════════ */}
          <div className="rounded-[18px] border border-border/70 bg-card p-3.5 sm:p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-3">
              {/* Avatar & Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative h-11 w-11 rounded-full ring-2 ring-primary/20 bg-secondary-container text-primary flex items-center justify-center font-black text-sm shrink-0 overflow-hidden">
                  {listing.seller.avatarUrl ? (
                    <Image
                      src={listing.seller.avatarUrl}
                      alt={listing.seller.fullName}
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <span>{listing.seller.fullName.charAt(0)}</span>
                  )}
                  {/* Verified check badge on avatar */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-600 border-2 border-card flex items-center justify-center text-white text-[9px] font-black">
                    
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-extrabold text-sm text-foreground truncate">
                      {listing.seller.fullName}
                    </h4>
                    {listing.seller.tier && listing.seller.tier !== "FREE" && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        PRO
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{listing.seller.rating.toFixed(1)}</span>
                      <span className="text-muted-foreground font-normal">
                        ({listing.seller.totalReviews || reviews.length})
                      </span>
                    </div>
                    <span>•</span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      {isKa ? "სწრაფი პასუხი" : "Quick Response"}
                    </span>
                  </div>
                </div>
              </div>

              {/* View Shop / All listings Button */}
              {listing.seller.customSlug ? (
                <Link href={`/shops/${listing.seller.customSlug}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 rounded-[9px] gap-1 text-xs font-bold text-primary hover:bg-primary/10 border-primary/30 shrink-0 cursor-pointer"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>{isKa ? "მაღაზია" : "Shop"}</span>
                  </Button>
                </Link>
              ) : (
                <Link href={`/listings?seller=${listing.seller.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 rounded-[9px] gap-1 text-[11px] font-bold text-foreground hover:text-primary hover:bg-secondary-container border-border/60 shrink-0 cursor-pointer"
                  >
                    <span>{isKa ? "განცხადებები" : "Listings"}</span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </Link>
              )}
            </div>

            {/* Badges Earned (Bilingual & Styled) */}
            {listing.seller.badges && listing.seller.badges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/40">
                {listing.seller.badges.map((badge: string, idx: number) => {
                  const info = getLocalizedBadge(badge, isKa);
                  const IconComponent = info.icon;
                  return (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1 rounded-[7px] px-2 py-0.5 text-[11px] font-bold border transition-all ${info.color}`}
                    >
                      <IconComponent className="w-3 h-3 shrink-0" />
                      <span>{info.label}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          VERSION C: TABBED DETAILS MODULE (Care, Description, Reviews, Inventory)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="mt-8 rounded-[24px] border border-border/80 bg-card p-4 sm:p-6 shadow-ambient space-y-6">
        {/* Tab Navigation Buttons */}
        <div className="flex items-center gap-2 border-b border-border/60 pb-3.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("care")}
            className={`px-4 py-2.5 rounded-[14px] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "care"
                ? "bg-primary text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary-container"
            }`}
          >
            <Sprout className="w-4 h-4" />
            <span>
              {listing.itemType === "INVENTORY" || listing.item_type === "INVENTORY"
                ? (isKa ? "ინვენტარის მახასიათებლები" : "Specifications")
                : (isKa ? "მცენარის მოვლის მაჩვენებლები" : "Plant Care Guidelines")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("description")}
            className={`px-4 py-2.5 rounded-[14px] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "description"
                ? "bg-primary text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary-container"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{isKa ? "აღწერა და დეტალები" : "Description & Details"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("reviews")}
            className={`px-4 py-2.5 rounded-[14px] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "reviews"
                ? "bg-primary text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary-container"
            }`}
          >
            <Star className="w-4 h-4" />
            <span>{isKa ? `შეფასებები & რევიუები (${reviews.length})` : `Reviews (${reviews.length})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("inventory")}
            className={`px-4 py-2.5 rounded-[14px] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "inventory"
                ? "bg-primary text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary-container"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{isKa ? `რეკომენდებული ინვენტარი (${affiliateOffers.length})` : `Recommended Supplies (${affiliateOffers.length})`}</span>
          </button>
        </div>

        {/* TAB 1: PLANT CARE / INVENTORY SPECS */}
        {activeTab === "care" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {listing.itemType === "INVENTORY" || listing.item_type === "INVENTORY" ? (
              <div className="space-y-3">
                <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-primary" />
                  {isKa ? "ინვენტარის მახასიათებლები" : "Inventory Specifications"}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-[16px] bg-secondary-container/40 border border-border/50 flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">{isKa ? "ტიპი:" : "Type:"}</span>
                    <span className="text-xs font-bold text-foreground">{categoryInfo?.label || (isKa ? "პრემიუმ ინვენტარი" : "Equipment")}</span>
                  </div>
                  <div className="p-3.5 rounded-[16px] bg-secondary-container/40 border border-border/50 flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">{isKa ? "მდგომარეობა:" : "Condition:"}</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{isKa ? "ახალი / უხმარი" : "Brand New"}</span>
                  </div>
                  <div className="p-3.5 rounded-[16px] bg-secondary-container/40 border border-border/50 flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">{isKa ? "დანიშნულება:" : "Intended For:"}</span>
                    <span className="text-xs font-bold text-foreground">{isKa ? "ოთახის & ბაღის" : "Indoor & Garden"}</span>
                  </div>
                  <div className="p-3.5 rounded-[16px] bg-secondary-container/40 border border-border/50 flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">{isKa ? "მიწოდება:" : "Packaging:"}</span>
                    <span className="text-xs font-bold text-foreground">{isKa ? "დაცული შეფუთვა" : "Safe Package"}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                      🌱
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-foreground">
                        {isKa ? "მცენარის მოვლის მაჩვენებლები" : "Plant Care Guidelines"}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        {isKa ? "ოპტიმალური გარემო და ბოტანიკური რეკომენდაციები" : "Optimal conditions & botanical guidelines"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {careInfo.scientificFamily && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
                        <Sprout className="w-3.5 h-3.5" />
                        <span>{careInfo.scientificFamily}</span>
                      </span>
                    )}
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                      Garden Flora
                    </span>
                  </div>
                </div>

                {/* 6 Responsive Care Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {/* 1. განათება */}
                  <div className="p-4 rounded-[16px] bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 transition-colors flex items-start gap-3.5">
                    <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-muted-foreground block">{isKa ? "განათება" : "Lighting"}</span>
                      <span className="text-xs sm:text-sm font-bold text-foreground block mt-0.5">{isKa ? careInfo.lightKa : careInfo.lightEn}</span>
                    </div>
                  </div>

                  {/* 2. მორწყვა */}
                  <div className="p-4 rounded-[16px] bg-teal-500/5 hover:bg-teal-500/10 border border-teal-500/20 transition-colors flex items-start gap-3.5">
                    <div className="p-2 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 shrink-0">
                      <Droplets className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-muted-foreground block">{isKa ? "მორწყვა" : "Watering"}</span>
                      <span className="text-xs sm:text-sm font-bold text-foreground block mt-0.5">{isKa ? careInfo.wateringKa : careInfo.wateringEn}</span>
                    </div>
                  </div>

                  {/* 3. სუბსტრატი */}
                  <div className="p-4 rounded-[16px] bg-secondary-container/40 hover:bg-secondary-container/60 border border-border/60 transition-colors flex items-start gap-3.5">
                    <div className="p-2 rounded-xl bg-primary/15 text-primary shrink-0">
                      <Boxes className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-muted-foreground block">{isKa ? "სუბსტრატი / გრუნტი" : "Soil / Substrate"}</span>
                      <span className="text-xs sm:text-sm font-bold text-foreground block mt-0.5">{isKa ? careInfo.soilKa : careInfo.soilEn}</span>
                    </div>
                  </div>

                  {/* 4. ტემპერატურა */}
                  <div className="p-4 rounded-[16px] bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 transition-colors flex items-start gap-3.5">
                    <div className="p-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 shrink-0">
                      <Thermometer className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-muted-foreground block">{isKa ? "ტემპერატურა" : "Temperature"}</span>
                      <span className="text-xs sm:text-sm font-bold text-foreground block mt-0.5">{isKa ? careInfo.tempKa : careInfo.tempEn}</span>
                    </div>
                  </div>

                  {/* 5. ტენიანობა */}
                  <div className="p-4 rounded-[16px] bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 transition-colors flex items-start gap-3.5">
                    <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-muted-foreground block">{isKa ? "ტენიანობა" : "Humidity"}</span>
                      <span className="text-xs sm:text-sm font-bold text-foreground block mt-0.5">{isKa ? careInfo.humidityKa : careInfo.humidityEn}</span>
                    </div>
                  </div>

                  {/* 6. მოვლის სირთულე */}
                  <div className="p-4 rounded-[16px] bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 transition-colors flex items-start gap-3.5">
                    <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-muted-foreground block">{isKa ? "მოვლის სირთულე" : "Care Level"}</span>
                      <span className="text-xs sm:text-sm font-bold text-foreground block mt-0.5">{isKa ? careInfo.careLevelKa : careInfo.careLevelEn}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Description excerpt at bottom of Care tab */}
            <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
              <span className="line-clamp-1">{listing.descriptionKa || listing.description}</span>
              <button
                type="button"
                onClick={() => setActiveTab("description")}
                className="text-primary font-bold hover:underline shrink-0 ml-3 cursor-pointer"
              >
                {isKa ? "სრული აღწერა →" : "Full description →"}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: DESCRIPTION & DETAILS */}
        {activeTab === "description" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-sm sm:text-base font-bold text-foreground">
              {isKa ? "აღწერა და დეტალები" : "Description & Details"}
            </h3>
            <p className="text-xs sm:text-[13.5px] text-muted-foreground leading-relaxed whitespace-pre-line max-w-4xl">
              {(isKa ? (listing.descriptionKa || listing.description) : (listing.descriptionEn || listing.description)) || (
                isKa 
                  ? `${displayTitle} — ჯანსაღი მცენარე განვითარებული ფესვთა სისტემით. გაზრდილია იდეალურ პირობებში, სპეციალურ სუბსტრატში. არ საჭიროებს გადარგვას უახლოესი 6 თვე.`
                  : `${displayTitle} — Healthy botanical specimen with established root system. Grown in optimal conditions with premium substrate. No repotting needed for 6 months.`
              )}
            </p>

            {/* Trade Preferences if Swap */}
            {listing.transactionType === "TRADE" && listing.tradePreferences && listing.tradePreferences.length > 0 && (
              <div className="mt-4 rounded-[14px] bg-amber-500/10 border border-amber-500/20 p-3 max-w-xl">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> 
                  {isKa ? "იცვლება შემდეგ მცენარეებში:" : "Looking to trade for:"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {listing.tradePreferences.map((tag: string, idx: number) => (
                    <span key={idx} className="rounded-[8px] bg-card px-2.5 py-1 text-xs font-bold text-foreground border border-border/60 shadow-2xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REVIEWS & RATINGS */}
        {activeTab === "reviews" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  {isKa ? "გამყიდველის შეფასებები & რევიუები" : "Seller Ratings & Reviews"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isKa ? "მყიდველების რეალური შეფასებები და გამოცდილება" : "Real buyer reviews and feedback"}
                </p>
              </div>
              <span className="text-xs font-bold text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                ★ 4.9 ({reviews.length})
              </span>
            </div>

            {/* Review Input Form */}
            <form onSubmit={handleReviewSubmit} className="space-y-2.5 bg-surface-container/50 p-3.5 rounded-[16px] border border-border/40 max-w-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">
                  {isKa ? "დაწერეთ შეფასება:" : "Write a review:"}
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= newRating ? "fill-amber-400 text-amber-400" : "text-border"
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
                      ? (isKa ? "გაუზიარეთ თქვენი შთაბეჭდილება მყიდველებს..." : "Share your feedback with other buyers...")
                      : (isKa ? "შეფასების დასატოვებლად გაიარეთ ავტორიზაცია..." : "Sign in to leave a review...")
                  }
                  className="w-full rounded-[10px] border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-[10px] bg-primary hover:bg-primary-container text-white text-xs font-bold shrink-0 gap-1.5 h-9 px-4 cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>{isKa ? "გაგზავნა" : "Submit"}</span>
                </Button>
              </div>

              {reviewSubmitted && (
                <p className="text-xs text-primary font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {isKa ? "შეფასება წარმატებით გამოქვეყნდა!" : "Review submitted successfully!"}
                </p>
              )}
            </form>

            {/* Reviews Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-3.5 rounded-[14px] bg-surface-container/30 border border-border/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-secondary-container text-primary font-bold text-[10px] flex items-center justify-center">
                        {rev.reviewerName.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-foreground">{rev.reviewerName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{rev.rating}</span>
                      <span className="text-muted-foreground ml-1 text-[11px] font-normal">({rev.createdAt})</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground pl-8 leading-relaxed">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: RECOMMENDED INVENTORY */}
        {activeTab === "inventory" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                  {isKa ? "რეკომენდებული ინვენტარი ამ მცენარისთვის" : "Recommended Care & Supplies"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isKa 
                    ? "მცენარის სწორი მოვლისთვის შერჩეული ქოთნები, სუბსტრატი და აქსესუარები"
                    : "Curated pots, substrates, and accessories for optimal plant care"}
                </p>
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => scrollInventory("left")}
                  className="h-8 w-8 rounded-full border border-border/80 bg-background hover:bg-surface-container flex items-center justify-center text-foreground transition-colors shadow-2xs active:scale-95 cursor-pointer"
                  title={isKa ? "წინა" : "Previous"}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollInventory("right")}
                  className="h-8 w-8 rounded-full border border-border/80 bg-background hover:bg-surface-container flex items-center justify-center text-foreground transition-colors shadow-2xs active:scale-95 cursor-pointer"
                  title={isKa ? "შემდეგი" : "Next"}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Track */}
            <div
              ref={inventoryScrollRef}
              onMouseEnter={() => setIsInventoryHovered(true)}
              onMouseLeave={() => setIsInventoryHovered(false)}
              className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar pb-2 pt-1"
            >
              {affiliateOffers.map((item) => (
                <div
                  key={item.id}
                  className="snap-start group relative flex flex-col justify-between w-[200px] sm:w-[220px] shrink-0 overflow-hidden rounded-[16px] border border-border/70 bg-background hover:border-primary/50 transition-all p-3 shadow-2xs hover:shadow-sm"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[12px] bg-surface-container mb-2">
                    <Image
                      src={item.image}
                      alt={isKa ? item.titleKa : item.titleEn}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div 
                      className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-[6px] shadow-md backdrop-blur-sm border border-white/20"
                      style={{ backgroundColor: (item as any).shopColor || "rgba(0,0,0,0.85)" }}
                    >
                      <span className="text-[11px] font-black text-white tracking-tight">
                        {item.shopBadge}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-muted-foreground font-semibold block leading-tight">
                        {isKa ? item.categoryKa : item.categoryEn}
                      </span>
                      <h4 className="text-xs font-bold text-foreground line-clamp-2 leading-snug my-1 min-h-[32px]">
                        {isKa ? item.titleKa : item.titleEn}
                      </h4>
                    </div>

                    <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between gap-1.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-primary dark:text-emerald-400">
                          {typeof item.price === "number" ? (Number.isInteger(item.price) ? item.price : item.price.toFixed(2)) : item.price} ₾
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
                          onClick={() => {
                            if (item.id && !item.id.startsWith("rec-")) {
                              fetch("/api/affiliate/click", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  affiliateId: item.id,
                                  targetUrl: item.link,
                                  referralParam: item.referralParam || "?ref=plantge"
                                }),
                              }).catch(() => {});
                            }
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-extrabold text-primary hover:text-white hover:bg-primary px-2.5 py-1 rounded-[8px] bg-primary/10 transition-colors border border-primary/20"
                        >
                          <span>{isKa ? "მაღაზია" : "Store"}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <Link
                          href={item.link}
                          className="inline-flex items-center text-[11px] font-extrabold text-primary hover:text-white hover:bg-primary px-2.5 py-1 rounded-[8px] bg-primary/10 transition-colors border border-primary/20"
                        >
                          {isKa ? "ნახვა" : "View"}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
           COMPACT SIMILAR PLANT LISTINGS SLIDER (Bottom Section)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="mt-10 pt-6 border-t border-border/60 space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              {isKa ? "მსგავსი შეთავაზებები & მცენარეები" : "Similar Plant Listings"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isKa ? "შეიძლება დაგაინტერესოთ სხვა მემცენარეების განცხადებებიდან" : "You might also be interested in these botanical listings"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/listings" className="text-xs font-bold text-primary hover:underline hidden sm:inline-block">
              {isKa ? "ყველა →" : "View All →"}
            </Link>

            {/* Navigation Arrows */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollSimilar("left")}
                className="h-7 w-7 rounded-full border border-border/80 bg-card hover:bg-surface-container flex items-center justify-center text-foreground transition-colors shadow-2xs active:scale-95"
                title={isKa ? "წინა" : "Previous"}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollSimilar("right")}
                className="h-7 w-7 rounded-full border border-border/80 bg-card hover:bg-surface-container flex items-center justify-center text-foreground transition-colors shadow-2xs active:scale-95"
                title={isKa ? "შემდეგი" : "Next"}
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

      {/* ══════════════════════════════════════════════════════════════════════
          STICKY MOBILE DIRECT CONTACT BAR (Instant 1-Tap Phone & WhatsApp)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 block lg:hidden border-t border-border/80 bg-card/95 backdrop-blur-xl p-2.5 pb-safe shadow-ambient">
        <div className="flex items-center justify-between gap-2 max-w-lg mx-auto">
          <div className="flex flex-col min-w-0 pr-1">
            <span className="text-[10px] text-muted-foreground font-semibold truncate">
              {listing.seller?.fullName || "გამყიდველი"}
            </span>
            <span className="text-sm font-black text-primary truncate">
              {listing.price > 0 ? `${listing.price} ₾` : isKa ? "საჩუქარი" : "Free"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* WhatsApp */}
            <a
              href={directWaChatUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9.5 px-3 rounded-[11px] font-bold text-xs flex items-center justify-center gap-1 bg-[#25D366] text-white shadow-2xs active:scale-95 transition-transform"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>

            {/* Direct Phone Reveal & Dial */}
            <button
              type="button"
              onClick={handlePhoneAction}
              className="h-9.5 px-3.5 rounded-[11px] font-black text-xs flex items-center justify-center gap-1.5 bg-primary text-white shadow-ambient active:scale-95 transition-transform"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{showPhone ? cleanPhoneDigits : isKa ? "დარეკვა" : "Call"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Auth Modal Prompt when Unauthenticated */}
      {authModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="rounded-[24px] border border-border/80 bg-card p-6 max-w-sm w-full shadow-ambient-lg text-center space-y-4">
            <div className="h-12 w-12 rounded-[16px] bg-secondary-container text-primary flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base text-foreground">
                {isKa ? "საჭიროა ავტორიზაცია" : "Sign In Required"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {isKa 
                  ? "გამყიდველის ნომრის სანახავად ან რევიუს დასატოვებლად გთხოვთ გაიაროთ ავტორიზაცია."
                  : "To view phone number or post reviews, please sign in."}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Link href={`/auth/login?redirect=/listings/${listing.id}`} className="w-full block">
                <Button className="w-full rounded-[14px] bg-primary hover:bg-primary-container text-white text-xs font-bold h-10 shadow-ambient">
                  {isKa ? "შესვლა სისტემაში" : "Sign In"}
                </Button>
              </Link>

              <Link href={`/auth/register?redirect=/listings/${listing.id}`} className="w-full block">
                <Button variant="outline" className="w-full rounded-[14px] text-xs font-bold h-10 border-border/70">
                  {isKa ? "რეგისტრაცია (უფასო)" : "Register (Free)"}
                </Button>
              </Link>

              <button
                onClick={() => setAuthModalOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground pt-1 cursor-pointer"
              >
                {isKa ? "დახურვა" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Viral Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title={displayTitle}
        price={listing.price}
      />

      {/* Escrow Online Checkout Modal (Test Mode) */}
      <EscrowCheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        listing={listing}
        isKa={isKa}
      />
    </div>
  );
}
