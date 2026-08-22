"use client";

import * as React from "react";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { SAMPLE_LISTINGS } from "@/lib/mock-data";
import { ListingCard } from "@/components/listings/ListingCard";
import { 
  Store, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Star, 
  ShieldCheck, 
  Award, 
  Sprout, 
  Share2, 
  Check, 
  ExternalLink,
  ChevronLeft,
  Lock,
  Layers,
  Sparkles,
  ArrowUpDown,
  Search,
  Flame,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

import { formatDbListing } from "@/lib/listings-service";

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
      label: isKa ? "ვერიფიცირებული მაღაზია" : "Verified Shop",
      icon: ShieldCheck,
      color: "text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/30",
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
    icon: Sparkles,
    color: "text-foreground bg-secondary-container/80 border-border/60",
  };
}

export default function ShopStorefrontPage({
  params: { slug },
}: {
  params: { slug: string };
}) {
  const locale = useLocale();
  const isKa = locale !== "en";
  const router = useRouter();
  const supabase = createClient();

  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [activeCategory, setActiveCategory] = React.useState<string>("all");
  const [sortBy, setSortBy] = React.useState<"newest" | "price-asc" | "price-desc" | "views">("newest");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [visibleCount, setVisibleCount] = React.useState<number>(16);
  const [copied, setCopied] = React.useState(false);

  // Shop Profile State
  const [shop, setShop] = React.useState<any>({
    id: "usr-1",
    customSlug: slug,
    shopName: slug === "tamarbustan" ? "თამარ ბოტანიკა (Tamar Botanica)" : `მცენარეთა მაღაზია @${slug}`,
    bio: "იშვიათი ოთახის მცენარეების, აროიდების, მონსტერების და პრემიუმ სუბსტრატების ორანჟერეა.",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1545241047-6083a3684587?w=1200&auto=format&fit=crop&q=80",
    city: "თბილისი",
    address: "",
    phone: "+995 599 12 34 56",
    whatsapp: "+995599123456",
    rating: 5.0,
    totalReviews: 1,
    badges: ["Trusted Seller", "Green Thumb", "Verified Shop"],
    tier: "TIER_1",
  });

  const [shopListings, setShopListings] = React.useState<any[]>(() =>
    SAMPLE_LISTINGS.filter((l) => l.seller.customSlug === slug || l.seller.id === "usr-1")
  );

  React.useEffect(() => {
    async function loadShopData() {
      try {
        let { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("custom_slug", slug)
          .maybeSingle();

        if (!profile && slug.length === 36) {
          const { data: pById } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", slug)
            .maybeSingle();
          profile = pById;
        }

        if (profile) {
          setShop({
            id: profile.id,
            customSlug: profile.custom_slug || slug,
            shopName: profile.full_name || `მაღაზია @${slug}`,
            bio: profile.bio || "ჯანსაღი და ხარისხიანი მცენარეები.",
            avatarUrl: profile.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
            bannerUrl: "https://images.unsplash.com/photo-1545241047-6083a3684587?w=1200&auto=format&fit=crop&q=80",
            city: profile.city || "თბილისი",
            address: profile.address || "",
            phone: profile.phone || "+995 599 12 34 56",
            whatsapp: profile.whatsapp || "+995599123456",
            rating: Number(profile.average_rating) || 5.0,
            totalReviews: Number(profile.total_reviews) || 0,
            badges: ["Verified Shop", "Community Member"],
            tier: profile.subscription_tier || "FREE",
            isOnVacation: profile.is_on_vacation || false,
          });

          const { data: dbListings } = await supabase
            .from("listings")
            .select("*")
            .eq("user_id", profile.id)
            .eq("status", "ACTIVE")
            .order("created_at", { ascending: false });

          if (dbListings && dbListings.length > 0) {
            setShopListings(dbListings.map((row) => formatDbListing(row, profile)));
          }
        }
      } catch (e) {
        console.warn("Shop profile loading error:", e);
      }
    }
    loadShopData();
  }, [slug, supabase]);

  const filteredAndSortedListings = React.useMemo(() => {
    let result = shopListings.filter((l) => {
      if (activeCategory === "trade") {
        if (l.transactionType !== "TRADE") return false;
      } else if (activeCategory === "plants-indoor" || activeCategory === "plants-rare" || activeCategory === "plants-cuttings") {
        if (l.itemType !== "PLANT") return false;
      } else if (activeCategory.startsWith("inv-")) {
        if (l.itemType !== "INVENTORY") return false;
      } else if (activeCategory === "PLANT" && l.itemType !== "PLANT") {
        return false;
      } else if (activeCategory === "INVENTORY" && l.itemType !== "INVENTORY") {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (l.title || "").toLowerCase().includes(q);
        const matchDesc = (l.descriptionKa || "").toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }
      return true;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "price-asc") return (a.price || 0) - (b.price || 0);
      if (sortBy === "price-desc") return (b.price || 0) - (a.price || 0);
      if (sortBy === "views") return (b.viewsCount || 0) - (a.viewsCount || 0);
      return 0;
    });
  }, [shopListings, activeCategory, searchQuery, sortBy]);

  const copyShopLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const SHOP_CATEGORIES = [
    { id: "all", labelKa: "ყველა", labelEn: "All" },
    { id: "plants-indoor", labelKa: "ოთახის მცენარეები", labelEn: "Indoor Plants", icon: Sprout },
    { id: "plants-rare", labelKa: "იშვიათი & აროიდები", labelEn: "Rare & Aroids", icon: Flame },
    { id: "plants-cuttings", labelKa: "კალმები & ფესვიანები", labelEn: "Cuttings", icon: Sprout },
    { id: "inv-pots", labelKa: "ქოთნები & დეკორი", labelEn: "Pots & Planters", icon: Layers },
    { id: "inv-soil", labelKa: "გრუნტი & სუბსტრატები", labelEn: "Soil & Substrates", icon: Layers },
    { id: "inv-care", labelKa: "სასუქები & მოვლა", labelEn: "Fertilizers & Care", icon: Layers },
    { id: "trade", labelKa: "მხოლოდ გაცვლა", labelEn: "Trade Only", icon: RefreshCw },
  ];

  return (
    <div className="min-h-screen pb-16">
      {/* 1. Shop Header Banner */}
      <div className="relative h-48 sm:h-64 w-full overflow-hidden bg-muted">
        <Image
          src={shop.bannerUrl}
          alt={shop.shopName}
          fill
          priority
          className="object-cover brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

        <div className="container mx-auto px-4 sm:px-6 relative h-full flex items-end pb-4">
          <Link
            href="/listings"
            className="inline-flex items-center gap-1.5 rounded-xl bg-card/80 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-foreground hover:bg-card shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" /> უკან კატალოგში
          </Link>
        </div>
      </div>

      {/* 2. Shop Identity & Info Container */}
      <div className="container mx-auto px-4 sm:px-6 -mt-16 relative z-10 space-y-4">
        {/* Vacation Mode Banner */}
        {shop.isOnVacation && (
          <div className="rounded-2xl bg-amber-500/15 border border-amber-500/30 p-4 text-amber-800 dark:text-amber-300 text-xs sm:text-sm font-bold flex items-center gap-3 shadow-md backdrop-blur-md animate-in fade-in">
            <span className="text-2xl">🏖️</span>
            <div>
              <p className="font-extrabold text-foreground">
                {isKa ? "მაღაზია დროებით იმყოფება შვებულებაში" : "Store is currently on vacation mode"}
              </p>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                {isKa
                  ? "მომხმარებელს დროებით შეჩერებული აქვს შეკვეთების მიღება. შეგიძლიათ დაათვალიეროთ ასორტიმენტი ან შეინახოთ რჩეულებში."
                  : "The seller is temporarily not taking new orders. You can still browse the inventory or save items to your wishlist."}
              </p>
            </div>
          </div>
        )}

        <div className="rounded-[28px] border border-border/80 bg-card p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            {/* Left: Avatar & Bio */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-3xl overflow-hidden border-4 border-card bg-emerald-600/10 shadow-lg shrink-0">
                <Image
                  src={shop.avatarUrl}
                  alt={shop.shopName}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="space-y-1.5 max-w-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-foreground">
                    {shop.shopName}
                  </h1>
                  <Badge variant="emerald" className="font-bold text-xs gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> ვერიფიცირებული მაღაზია
                  </Badge>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1 font-semibold text-emerald-600">
                    <MapPin className="w-3.5 h-3.5" /> {shop.city}, {shop.address}
                  </span>
                  <span>•</span>
                  <div className="flex items-center gap-1 font-bold text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{shop.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground font-normal">({shop.totalReviews} {isKa ? "შეფასება" : "reviews"})</span>
                  </div>
                  <span>•</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    plantsale.ge/{slug}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                  {shop.bio}
                </p>

                {/* Badges Earned */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {shop.badges.map((b: string) => {
                    const info = getLocalizedBadge(b, isKa);
                    const IconComponent = info.icon;
                    return (
                      <span
                        key={b}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-[11px] font-bold border transition-all ${info.color}`}
                      >
                        <IconComponent className="w-3 h-3" />
                        <span>{info.label}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Direct Contact Actions */}
            <div className="flex flex-wrap sm:flex-nowrap lg:flex-col gap-2 min-w-[200px] shrink-0">
              <a href={`tel:${shop.phone}`} className="w-full">
                <Button variant="botanical" className="w-full rounded-2xl text-xs font-bold h-11 gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{shop.phone}</span>
                </Button>
              </a>

              <a
                href={`https://wa.me/${shop.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="w-full"
              >
                <Button variant="outline" className="w-full rounded-2xl text-xs font-bold h-11 gap-2 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>{isKa ? "WhatsApp-ში მიწერა" : "Chat on WhatsApp"}</span>
                </Button>
              </a>

              <Button
                variant="ghost"
                onClick={copyShopLink}
                className="w-full rounded-2xl text-xs font-bold h-10 gap-1.5 text-muted-foreground"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                <span>{copied ? (isKa ? "ლინკი დაკოპირდა!" : "Link Copied!") : (isKa ? "მაღაზიის გაზიარება" : "Share Shop")}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 3. Shop Catalog & Inventory Feed */}
        <div className="mt-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-foreground flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" />
                {isKa ? "მაღაზიის ასორტიმენტი" : "Shop Assortment"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isKa 
                  ? `სულ ${filteredAndSortedListings.length} აქტიური განცხადება`
                  : `${filteredAndSortedListings.length} Active Listings`}
              </p>
            </div>

            {/* Sorting Control Pills */}
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-secondary-container/60 border border-border/60 shrink-0">
              <button
                type="button"
                onClick={() => setSortBy("newest")}
                className={`px-3 py-1.5 rounded-[8px] text-xs font-bold transition-all cursor-pointer ${
                  sortBy === "newest"
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isKa ? "უახლესი" : "Newest"}
              </button>
              <button
                type="button"
                onClick={() => setSortBy("views")}
                className={`px-3 py-1.5 rounded-[8px] text-xs font-bold transition-all cursor-pointer ${
                  sortBy === "views"
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isKa ? "პოპულარული" : "Popular"}
              </button>
              <button
                type="button"
                onClick={() => setSortBy(sortBy === "price-asc" ? "price-desc" : "price-asc")}
                className={`px-3 py-1.5 rounded-[8px] text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  sortBy.startsWith("price")
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={isKa ? "ფასით სორტირება (დაკლიკეთ მიმართულების შესაცვლელად)" : "Sort by price"}
              >
                <span>{isKa ? "ფასი" : "Price"}</span>
                <ArrowUpDown className="w-3 h-3" />
                {sortBy === "price-asc" && <span className="text-[10px] font-black">↑</span>}
                {sortBy === "price-desc" && <span className="text-[10px] font-black">↓</span>}
              </button>
            </div>
          </div>

          {/* Full Marketplace Category Filter Bar */}
          <div className="w-full overflow-x-auto no-scrollbar py-1">
            <div className="flex items-center gap-2 min-w-max">
              {SHOP_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setVisibleCount(16);
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-primary text-white shadow-lg scale-[1.02]"
                        : "bg-secondary-container/70 hover:bg-secondary-container text-foreground border border-border/40 hover:border-primary/30"
                    }`}
                  >
                    {Icon && <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-primary"}`} />}
                    <span>{isKa ? cat.labelKa : cat.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4-Column Grid: 4 columns x 4 rows = 16 items per view */}
          {filteredAndSortedListings.length > 0 ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {filteredAndSortedListings.slice(0, visibleCount).map((listing) => (
                  <ListingCard key={listing.id} {...listing} variant="compact" />
                ))}
              </div>

              {/* Load More Button */}
              {visibleCount < filteredAndSortedListings.length && (
                <div className="flex justify-center pt-4">
                  <Button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 16)}
                    className="px-8 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-primary hover:bg-primary/90 text-white cursor-pointer shadow-ambient"
                  >
                    {isKa 
                      ? `მეტის ნახვა (დარჩენილია ${filteredAndSortedListings.length - visibleCount})` 
                      : `Load More (${filteredAndSortedListings.length - visibleCount} remaining)`}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 bg-card rounded-3xl border border-dashed border-border/80">
              <Sprout className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <h3 className="text-base font-bold text-foreground">
                {isKa ? "განცხადებები არ მოიძებნა" : "No listings found"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {isKa ? "სცადეთ სხვა კატეგორია ან ფილტრი" : "Try selecting another category or filter"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
