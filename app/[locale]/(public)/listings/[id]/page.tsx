"use client";

import * as React from "react";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
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
  Navigation
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { getBotanicalCareDetails } from "@/lib/botanical-care";

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
    shopLogo: "🏢",
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
    shopLogo: "🟠",
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
    shopLogo: "🌿",
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
    shopLogo: "🔴",
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
    shopLogo: "🌱",
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
    shopLogo: "🏢",
    shopColor: "bg-[#0055a5] text-white border border-white/20",
    link: "https://domino.com.ge",
    isExternal: true,
  },
];

const CATEGORIES_DATA: Record<string, { labelKa: string; labelEn: string; emoji: string }> = {
  monstera: { labelKa: "მონსტერა", labelEn: "Monstera", emoji: "🌿" },
  philodendron: { labelKa: "ფილოდენდრონი", labelEn: "Philodendron", emoji: "🌱" },
  anthurium: { labelKa: "ანთურიუმი", labelEn: "Anthurium", emoji: "🌺" },
  alocasia: { labelKa: "ალოკაზია", labelEn: "Alocasia", emoji: "🍃" },
  calathea: { labelKa: "კალათეა / მარანტა", labelEn: "Calathea / Maranta", emoji: "🌿" },
  "pothos-scindapsus": { labelKa: "პოთოსი / სცინდაპსუსი", labelEn: "Pothos / Scindapsus", emoji: "🌾" },
  orchid: { labelKa: "ორქიდეა", labelEn: "Orchid", emoji: "🌸" },
  bromeliad: { labelKa: "ბრომელია", labelEn: "Bromeliad", emoji: "🌺" },
  ficus: { labelKa: "ფიკუსი", labelEn: "Ficus", emoji: "🌳" },
  palm: { labelKa: "პალმა", labelEn: "Palm", emoji: "🌴" },
  fern: { labelKa: "გვიმრა", labelEn: "Fern", emoji: "🌿" },
  "outdoor-garden": { labelKa: "ბაღის & ეზოს", labelEn: "Garden & Outdoor", emoji: "🌻" },
  "cactus-succulent": { labelKa: "კაქტუსი & სუქულენტი", labelEn: "Cactus & Succulents", emoji: "🌵" },
  "rare-variegated": { labelKa: "იშვიათი & ვარიეგატული", labelEn: "Rare & Variegated", emoji: "✨" },
  cutting: { labelKa: "კალმები & ნერგები", labelEn: "Cuttings & Seedlings", emoji: "✂️" },
  bonsai: { labelKa: "ბონსაი", labelEn: "Bonsai", emoji: "🎋" },
  sansevieria: { labelKa: "სანსევიერია", labelEn: "Sansevieria", emoji: "🪴" },
  "zz-plant": { labelKa: "ზამიოკულკასი", labelEn: "ZZ Plant", emoji: "🌿" },
  "pots-ceramic": { labelKa: "კერამიკული ქოთნები", labelEn: "Ceramic Pots", emoji: "🏺" },
  "pots-plastic": { labelKa: "პლასტიკური ქოთნები", labelEn: "Plastic Pots", emoji: "🪣" },
  "substrate-soil": { labelKa: "სუბსტრატი & გრუნტი", labelEn: "Soil & Substrates", emoji: "🌍" },
  fertilizer: { labelKa: "სასუქები & მოვლა", labelEn: "Fertilizers & Care", emoji: "🧪" },
  "tools-care": { labelKa: "მოვლის ხელსაწყოები", labelEn: "Care Tools", emoji: "🔧" },
  "lighting-grow": { labelKa: "ფიტო-განათება", labelEn: "Grow Lighting", emoji: "💡" },
};

import { formatDbListing } from "@/lib/listings-service";

export default function ListingDetailPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const locale = useLocale();
  const isKa = locale !== "en";
  const router = useRouter();
  const supabase = createClient();
  const [listing, setListing] = React.useState<any>(() => {
    return SAMPLE_LISTINGS.find((l) => l.id === id) || SAMPLE_LISTINGS[0];
  });

  const [activeImageIdx, setActiveImageIdx] = React.useState(0);
  const [showPhone, setShowPhone] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = React.useState(false);

  // ── Wishlist State ──
  const [inWishlist, setInWishlist] = React.useState(false);
  const [wishlistNotice, setWishlistNotice] = React.useState("");

  // ── Dynamic Affiliate Cross-Selling Offers ──
  const [affiliateOffers, setAffiliateOffers] = React.useState<any[]>(RECOMMENDED_INVENTORY);

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
          setListing(formatDbListing(dbRow, dbRow.profiles));
        }

        // Fire background view tracking
        if (!id.startsWith("lst-")) {
          fetch("/api/listings/track-view", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ listingId: id }),
          }).catch(() => {});
        }
      } catch (err) {
        console.warn("Could not load listing from Supabase, using mock fallback:", err);
      }
    }
    loadRealListing();

    // Check wishlist status
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data: wish } = await supabase
          .from("wishlists")
          .select("id")
          .eq("user_id", user.id)
          .eq("listing_id", id)
          .maybeSingle();
        if (wish) setInWishlist(true);
      }
    });

    // Load active affiliate products from DB matching plant category/supplies
    async function loadAffiliateOffers() {
      try {
        const { data: affData, error: affErr } = await supabase
          .from("affiliate_products")
          .select("*")
          .eq("is_active", true)
          .limit(10);

        if (!affErr && affData && affData.length > 0) {
          const mapped = affData.map((a) => ({
            id: a.id,
            titleKa: a.product_name,
            titleEn: a.product_name,
            categoryKa: a.matching_tags?.[0] || "ინვენტარი",
            categoryEn: a.matching_tags?.[0] || "Supplies",
            price: a.price || 25,
            image: a.image_url || "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600",
            shopName: a.partner_name || "პარტნიორი",
            shopBadge: a.partner_name || "პარტნიორი",
            shopLogo: "🪴",
            link: a.product_url,
            isExternal: true,
          }));
          setAffiliateOffers([...mapped, ...RECOMMENDED_INVENTORY]);
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
    setWishlistNotice(nextState ? "❤️ დაემატა რჩეულებში!" : "💔 ამოიშალა რჩეულებიდან");
    setTimeout(() => setWishlistNotice(""), 3000);
    try {
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id }),
      });
    } catch {
      setInWishlist(!nextState);
    }
  };

  const rawCat = listing.plantCategory || listing.plant_category || listing.inventory_category;
  const categoryInfo = rawCat && CATEGORIES_DATA[rawCat]
    ? {
        label: isKa ? CATEGORIES_DATA[rawCat].labelKa : CATEGORIES_DATA[rawCat].labelEn,
        emoji: CATEGORIES_DATA[rawCat].emoji,
      }
    : rawCat
    ? { label: rawCat, emoji: listing.itemType === "INVENTORY" ? "📦" : "🌿" }
    : null;

  const rawTitle = isKa ? (listing.titleKa || listing.title || "") : (listing.titleEn || listing.title || "");
  const displayTitle = rawTitle.replace(/^(\s*🎁\s*(საჩუქარი|gift):?\s*|\s*🎁\s*|\s*(საჩუქარი|gift):?\s*)/i, "").trim();

  // Dynamic botanical care info matching species, plant category and tags
  const careInfo = React.useMemo(() => {
    return getBotanicalCareDetails(listing);
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

  // Similar plant listings (excluding current listing)
  const similarListings = SAMPLE_LISTINGS.filter((l) => l.id !== listing.id);

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
  const rawSellerPhone = listing.seller?.phone || "557 579 123";
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

  const fullAddressString = `${listing.city || "თბილისი"}${listing.address ? `, ${listing.address}` : ""}`;
  const targetLat = listing.latitude ?? (listing as any).lat;
  const targetLng = listing.longitude ?? (listing as any).lng;
  const googleMapsUrl = targetLat && targetLng
    ? `https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddressString)}`;

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
      reviewerName: currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || (isKa ? "მომხმარებელი" : "User"),
      rating: newRating,
      comment: newComment.trim(),
      createdAt: isKa ? "ახლახანს" : "Just now",
    };

    setReviews([newRev, ...reviews]);
    setNewComment("");
    setReviewSubmitted(true);
    setTimeout(() => setReviewSubmitted(false), 4000);
  };

  const images: string[] = Array.isArray(listing.images) && listing.images.length > 0 ? listing.images : [
    "https://images.unsplash.com/photo-1545241047-6083a3684587?w=800&auto=format&fit=crop&q=80"
  ];

  const isOwner = currentUser && (currentUser.id === listing.seller?.id || currentUser.id === (listing as any).userId || currentUser.id === (listing as any).user_id);
  const isAdmin = currentUser?.email === "tokolejo@gmail.com" || currentUserProfile?.is_admin === true;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 max-w-6xl">
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

          {/* Dynamic Plant Care / Inventory Specifications Card */}
          {listing.itemType === "INVENTORY" || listing.item_type === "INVENTORY" ? (
            <div className="rounded-[24px] border border-border/80 bg-card p-4 sm:p-5 shadow-ambient space-y-3">
              <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
                <Boxes className="w-4 h-4 text-primary" />
                {isKa ? "ინვენტარის მახასიათებლები" : "Inventory Specifications"}
              </h3>

              <div className="divide-y divide-border/40 rounded-[16px] bg-secondary-container/30 border border-border/50 overflow-hidden">
                {/* 1. ტიპი */}
                <div className="flex items-center justify-between gap-3 p-3 sm:px-4 hover:bg-secondary-container/50 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Boxes className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap">
                      {isKa ? "ტიპი:" : "Type:"}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-foreground text-right">
                    {categoryInfo?.label || (isKa ? "პრემიუმ ინვენტარი" : "Equipment")}
                  </span>
                </div>

                {/* 2. მდგომარეობა */}
                <div className="flex items-center justify-between gap-3 p-3 sm:px-4 hover:bg-secondary-container/50 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap">
                      {isKa ? "მდგომარეობა:" : "Condition:"}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right">
                    {isKa ? "ახალი / უხმარი" : "Brand New"}
                  </span>
                </div>

                {/* 3. დანიშნულება */}
                <div className="flex items-center justify-between gap-3 p-3 sm:px-4 hover:bg-secondary-container/50 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Sprout className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap">
                      {isKa ? "დანიშნულება:" : "Intended For:"}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-foreground text-right">
                    {isKa ? "ოთახის & ბაღის" : "Indoor & Garden"}
                  </span>
                </div>

                {/* 4. მიწოდება */}
                <div className="flex items-center justify-between gap-3 p-3 sm:px-4 hover:bg-secondary-container/50 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Truck className="w-4 h-4 text-purple-500 shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap">
                      {isKa ? "მიწოდება:" : "Packaging:"}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-foreground text-right">
                    {isKa ? "დაცული შეფუთვა" : "Safe Package"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[24px] border border-border/80 bg-card p-4 sm:p-5 shadow-ambient space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-primary" />
                  {isKa ? "მცენარის მოვლის მაჩვენებლები" : "Plant Care Guidelines"}
                </h3>
                {careInfo.scientificFamily && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
                    <Sprout className="w-3.5 h-3.5" />
                    <span>{careInfo.scientificFamily}</span>
                  </span>
                )}
              </div>

              {/* Single unified sequential card rows */}
              <div className="divide-y divide-border/40 rounded-[16px] bg-secondary-container/30 border border-border/50 overflow-hidden">
                {/* 1. განათება */}
                <div className="flex items-center justify-between gap-3 p-3 sm:px-4 hover:bg-secondary-container/50 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap">
                      {isKa ? "განათება:" : "Lighting:"}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-foreground text-right">
                    {isKa ? careInfo.lightKa : careInfo.lightEn}
                  </span>
                </div>

                {/* 2. მორწყვა */}
                <div className="flex items-center justify-between gap-3 p-3 sm:px-4 hover:bg-secondary-container/50 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Droplets className="w-4 h-4 text-teal-500 shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap">
                      {isKa ? "მორწყვა:" : "Watering:"}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-foreground text-right">
                    {isKa ? careInfo.wateringKa : careInfo.wateringEn}
                  </span>
                </div>

                {/* 3. სუბსტრატი / გრუნტი */}
                <div className="flex items-center justify-between gap-3 p-3 sm:px-4 hover:bg-secondary-container/50 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Boxes className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap">
                      {isKa ? "სუბსტრატი / გრუნტი:" : "Soil / Substrate:"}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-foreground text-right">
                    {isKa ? careInfo.soilKa : careInfo.soilEn}
                  </span>
                </div>

                {/* 4. ტემპერატურა */}
                <div className="flex items-center justify-between gap-3 p-3 sm:px-4 hover:bg-secondary-container/50 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Thermometer className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap">
                      {isKa ? "ტემპერატურა:" : "Temperature:"}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-foreground text-right">
                    {isKa ? careInfo.tempKa : careInfo.tempEn}
                  </span>
                </div>

                {/* 5. ტენიანობა */}
                <div className="flex items-center justify-between gap-3 p-3 sm:px-4 hover:bg-secondary-container/50 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap">
                      {isKa ? "ტენიანობა:" : "Humidity:"}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-foreground text-right">
                    {isKa ? careInfo.humidityKa : careInfo.humidityEn}
                  </span>
                </div>

                {/* 6. მოვლის სირთულე */}
                <div className="flex items-center justify-between gap-3 p-3 sm:px-4 hover:bg-secondary-container/50 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap">
                      {isKa ? "მოვლის სირთულე:" : "Care Level:"}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-foreground text-right">
                    {isKa ? careInfo.careLevelKa : careInfo.careLevelEn}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Description Card */}
          <div className="rounded-[20px] border border-border/80 bg-card p-3.5 sm:p-4 shadow-ambient space-y-2">
            <h3 className="text-xs sm:text-sm font-bold text-foreground">
              {isKa ? "აღწერა და დეტალები" : "Description & Details"}
            </h3>
            <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed whitespace-pre-line">
              {(isKa ? (listing.descriptionKa || listing.description) : (listing.descriptionEn || listing.description)) || (
                isKa 
                  ? `${displayTitle} — ჯანსაღი მცენარე განვითარებული ფესვთა სისტემით. გაზრდილია იდეალურ პირობებში, სპეციალურ სუბსტრატში. არ საჭიროებს გადარგვას უახლოესი 6 თვე.`
                  : `${displayTitle} — Healthy botanical specimen with established root system. Grown in optimal conditions with premium substrate. No repotting needed for 6 months.`
              )}
            </p>

            {/* Trade Preferences if Swap */}
            {listing.transactionType === "TRADE" && listing.tradePreferences && listing.tradePreferences.length > 0 && (
              <div className="mt-2.5 rounded-[12px] bg-amber-500/10 border border-amber-500/20 p-2.5">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> 
                  {isKa ? "იცვლება შემდეგ მცენარეებში:" : "Looking to trade for:"}
                </p>
                <div className="flex flex-wrap gap-1">
                  {listing.tradePreferences.map((tag: string, idx: number) => (
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
                  {isKa ? "რეკომენდებული ინვენტარი ამ მცენარისთვის" : "Recommended Care & Supplies"}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {isKa 
                    ? "პარტნიორი აგრო და სამშენებლო ჰიპერმარკეტების შეთავაზებები"
                    : "Curated offers from partner garden centers & retailers"}
                </p>
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => scrollInventory("left")}
                  className="h-7 w-7 rounded-full border border-border/80 bg-background hover:bg-surface-container flex items-center justify-center text-foreground transition-colors shadow-2xs active:scale-95"
                  title={isKa ? "წინა შეთავაზებები" : "Previous offers"}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollInventory("right")}
                  className="h-7 w-7 rounded-full border border-border/80 bg-background hover:bg-surface-container flex items-center justify-center text-foreground transition-colors shadow-2xs active:scale-95"
                  title={isKa ? "შემდეგი შეთავაზებები" : "Next offers"}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Track — Dynamic Affiliate Offers with Click Tracking */}
            <div
              ref={inventoryScrollRef}
              className="flex gap-2.5 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar pb-1 pt-0.5"
            >
              {affiliateOffers.map((item) => (
                <div
                  key={item.id}
                  className="snap-start group relative flex flex-col justify-between w-[calc(50%-5px)] sm:w-[calc(33.333%-6.7px)] shrink-0 overflow-hidden rounded-[14px] border border-border/70 bg-background/95 hover:border-primary/50 transition-all p-2.5 shadow-2xs hover:shadow-sm"
                >
                  {/* Photo & High-Contrast Store Badge */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[10px] bg-surface-container mb-2">
                    <Image
                      src={item.image}
                      alt={isKa ? item.titleKa : item.titleEn}
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
                        {isKa ? item.categoryKa : item.categoryEn}
                      </span>
                      <h4 className="text-xs font-bold text-foreground line-clamp-2 leading-snug my-1 min-h-[32px]">
                        {isKa ? item.titleKa : item.titleEn}
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
                          onClick={() => {
                            if (item.id && !item.id.startsWith("rec-")) {
                              fetch("/api/affiliate/click", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ affiliateId: item.id, targetUrl: item.link }),
                              }).catch(() => {});
                            }
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-extrabold text-primary hover:text-white hover:bg-primary px-2.5 py-1 rounded-[7px] bg-primary/10 transition-colors border border-primary/20"
                        >
                          <span>{isKa ? "მაღაზია" : "Store"}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <Link
                          href={item.link}
                          className="inline-flex items-center text-[11px] font-extrabold text-primary hover:text-white hover:bg-primary px-2.5 py-1 rounded-[7px] bg-primary/10 transition-colors border border-primary/20"
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
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            RIGHT COLUMN: Pricing, Contacts, Seller Profile & Feedback/Reviews
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Info Card */}
          <div className="rounded-[22px] border border-border/80 bg-card p-4 sm:p-5 shadow-ambient space-y-3.5">
            {/* Title & Clickable Category / Type Badges */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                {/* 1. Item Type Tag (Clickable) */}
                <Link href={`/listings?type=${listing.itemType}`}>
                  <Badge className="rounded-[8px] bg-secondary-container text-primary hover:bg-primary/20 hover:scale-105 transition-all border border-border/50 text-[11px] font-bold cursor-pointer gap-1.5 py-1 px-2.5">
                    {listing.itemType === "PLANT" ? (isKa ? "🌱 მცენარე" : "🌱 Plant") : (isKa ? "🪴 ინვენტარი" : "🪴 Care & Pots")}
                  </Badge>
                </Link>

                {/* 2. Specific Plant / Inventory Category Tag (Clickable) */}
                {categoryInfo && (
                  <Link href={`/listings?category=${encodeURIComponent(rawCat || "")}`}>
                    <Badge className="rounded-[8px] bg-primary/10 text-primary hover:bg-primary/20 hover:scale-105 transition-all border border-primary/30 text-[11px] font-bold cursor-pointer gap-1.5 py-1 px-2.5">
                      <span>{categoryInfo.emoji}</span>
                      <span>{categoryInfo.label}</span>
                    </Badge>
                  </Link>
                )}

                {/* 3. Transaction Type Tag (Clickable) */}
                {listing.transactionType === "GIFT" && (
                  <Link href="/listings?trans=GIFT">
                    <Badge className="rounded-[8px] bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/25 hover:scale-105 transition-all border border-emerald-500/30 font-bold text-[11px] cursor-pointer py-1 px-2.5">
                      {isKa ? "უფასო" : "Free"}
                    </Badge>
                  </Link>
                )}
                {listing.transactionType === "TRADE" && (
                  <Link href="/listings?trans=TRADE">
                    <Badge className="rounded-[8px] bg-amber-500/15 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25 hover:scale-105 transition-all border border-amber-500/30 font-bold text-[11px] cursor-pointer py-1 px-2.5">
                      {isKa ? "გაცვლა" : "Trade / Swap"}
                    </Badge>
                  </Link>
                )}
                {listing.transactionType === "NEGOTIABLE" && (
                  <Link href="/listings?trans=NEGOTIABLE">
                    <Badge variant="secondary" className="rounded-[8px] text-[11px] font-bold hover:bg-secondary hover:scale-105 transition-all border border-border/50 cursor-pointer py-1 px-2.5">
                      {isKa ? "შეთანხმებით" : "Negotiable"}
                    </Badge>
                  </Link>
                )}
                {listing.transactionType === "FIXED" && (
                  <Link href="/listings?trans=FIXED">
                    <Badge variant="secondary" className="rounded-[8px] text-[11px] font-bold hover:bg-secondary hover:scale-105 transition-all border border-border/50 cursor-pointer py-1 px-2.5">
                      {isKa ? "იყიდება" : "For Sale"}
                    </Badge>
                  </Link>
                )}
              </div>

              <h1 className="text-base sm:text-lg font-extrabold text-foreground leading-snug">
                {displayTitle}
              </h1>

              <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground font-medium flex-wrap">
                <Link
                  href={`/listings?city=${encodeURIComponent(listing.city)}`}
                  className="hover:text-primary font-bold text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{listing.city}</span>
                </Link>
                {listing.address && (
                  <>
                    <span>•</span>
                    <span className="text-foreground font-bold">{listing.address}</span>
                  </>
                )}
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
              {listing.transactionType === "GIFT" || listing.price === 0 || !listing.price ? (
                <span className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <span>{isKa ? "უფასო / გაჩუქება" : "FREE / Giveaway"}</span>
                </span>
              ) : listing.transactionType === "TRADE" ? (
                <span className="text-base sm:text-lg font-black text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4" />
                  <span>{isKa ? "მხოლოდ გაცვლა" : "Trade Only"}</span>
                </span>
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                    {formatPrice(listing.price, "₾", isKa)}
                  </span>
                  {listing.transactionType === "NEGOTIABLE" && (
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">
                      {isKa ? "(შეთანხმებით)" : "(Negotiable)"}
                    </span>
                  )}
                </div>
              )}

              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-card border border-border/50 px-2.5 py-1 rounded-[7px] shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {isKa ? "აქტიური" : "Active"}
              </span>
            </div>

            {/* Delivery Methods (All 3 on single compact line with dimmed inactives) */}
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-[8px] border text-[11px] transition-all ${
                listing.deliveryMethods?.includes("PICKUP")
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold shadow-2xs"
                  : "border-border/30 bg-muted/20 text-muted-foreground/40 opacity-40"
              }`}>
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{isKa ? "ადგილიდან" : "Pickup"}</span>
              </div>

              <div className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-[8px] border text-[11px] transition-all ${
                listing.deliveryMethods?.includes("COURIER")
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold shadow-2xs"
                  : "border-border/30 bg-muted/20 text-muted-foreground/40 opacity-40"
              }`}>
                <Truck className="w-3 h-3 shrink-0" />
                <span className="truncate">{isKa ? "კურიერი" : "Courier"}</span>
              </div>

              <div className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-[8px] border text-[11px] transition-all ${
                listing.deliveryMethods?.includes("MARSHRUTKA")
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold shadow-2xs"
                  : "border-border/30 bg-muted/20 text-muted-foreground/40 opacity-40"
              }`}>
                <Truck className="w-3 h-3 shrink-0" />
                <span className="truncate">{isKa ? "სამარშრუტო" : "Intercity"}</span>
              </div>
            </div>

            {/* Actions & Share */}
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
                  onClick={handleChatClick}
                  className="h-9.5 px-3 rounded-[11px] font-bold text-xs flex items-center justify-center gap-1.5 bg-secondary-container hover:bg-secondary text-foreground border border-border/50 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span>{isKa ? "Live ჩატი" : "Live Chat"}</span>
                </button>
              </div>

              {/* Wishlist Notice */}
              {wishlistNotice && (
                <div className="rounded-[12px] bg-primary/10 border border-primary/30 p-2 text-center text-xs text-primary font-bold animate-in fade-in">
                  {wishlistNotice}
                </div>
              )}

              {/* Icon-Only Share & Wishlist Strip */}
              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleToggleWishlist}
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

                  <a
                    href={shareTgUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={isKa ? "Telegram-ში გაზიარება" : "Share on Telegram"}
                    className="w-8 h-8 rounded-full bg-[#229ED9]/10 hover:bg-[#229ED9] text-[#229ED9] hover:text-white border border-[#229ED9]/20 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <TelegramIcon className="w-3.5 h-3.5" />
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

              {/* Bottom Metadata */}
              <div className="pt-2 flex items-center justify-between text-[10.5px] text-muted-foreground font-medium border-t border-border/30">
                <span>ID: {listing.id.slice(0, 8)}...</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{listing.viewsCount || 100}+ {isKa ? "ნახვა" : "views"}</span>
                </span>
              </div>
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
                    ✓
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

          {/* ══════════════════════════════════════════════════════════════════════
              ⭐⭐ SELLER REVIEWS & FEEDBACK (Right Column — Under Seller Card)
          ══════════════════════════════════════════════════════════════════════ */}
          <div className="rounded-[22px] border border-border/80 bg-card p-4 sm:p-5 shadow-ambient space-y-3">
            <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
              <h3 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                {isKa ? "გამყიდველის შეფასებები & რევიუები" : "Seller Ratings & Reviews"}
              </h3>
              <span className="text-[11px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                ★ 4.9 ({reviews.length})
              </span>
            </div>

            {/* Review Input Form */}
            <form onSubmit={handleReviewSubmit} className="space-y-2 bg-surface-container/50 p-2.5 rounded-[14px] border border-border/40">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-foreground">
                  {isKa ? "დაწერეთ შეფასება:" : "Write a review:"}
                </span>
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
                      ? (isKa ? "გაუზიარეთ თქვენი შთაბეჭდილება მყიდველებს..." : "Share your feedback with other buyers...")
                      : (isKa ? "შეფასების დასატოვებლად გაიარეთ ავტორიზაცია..." : "Sign in to leave a review...")
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
                  <CheckCircle2 className="w-3 h-3" /> {isKa ? "შეფასება წარმატებით გამოქვეყნდა!" : "Review submitted successfully!"}
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

      {/* Auth Modal Prompt when Unauthenticated */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
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
                  ? "გამყიდველის ნომრის სანახავად, ჩატში მისაწერად ან რევიუს დასატოვებლად გთხოვთ გაიაროთ ავტორიზაცია."
                  : "To view phone number, send live messages, or post reviews, please sign in."}
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
    </div>
  );
}
