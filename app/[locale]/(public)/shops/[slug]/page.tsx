"use client";

import * as React from "react";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/routing";
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
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

import { formatDbListing } from "@/lib/listings-service";

export default function ShopStorefrontPage({
  params: { slug },
}: {
  params: { slug: string };
}) {
  const router = useRouter();
  const supabase = createClient();

  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [activeTab, setActiveTab] = React.useState<"all" | "PLANT" | "INVENTORY">("all");
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
        // Query profiles by custom_slug or ID
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
          });

          // Fetch listings belonging to this seller
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

  const filteredListings = shopListings.filter((l) =>
    activeTab === "all" ? true : l.itemType === activeTab
  );

  const copyShopLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      <div className="container mx-auto px-4 sm:px-6 -mt-16 relative z-10">
        <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
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
                    <span className="text-muted-foreground font-normal">({shop.totalReviews} შეფასება)</span>
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
                  {shop.badges.map((b: string) => (
                    <span
                      key={b}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300"
                    >
                      <Sparkles className="w-3 h-3" />
                      {b}
                    </span>
                  ))}
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
                  <span>WhatsApp-ში მიწერა</span>
                </Button>
              </a>

              <Button
                variant="ghost"
                onClick={copyShopLink}
                className="w-full rounded-2xl text-xs font-bold h-10 gap-1.5 text-muted-foreground"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                <span>{copied ? "ლინკი დაკოპირდა!" : "მაღაზიის გაზიარება"}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 3. Shop Catalog & Inventory Feed */}
        <div className="mt-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
                მაღაზიის ასორტიმენტი
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                სულ {shopListings.length} აქტიური განცხადება
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-muted/60 border border-border/80">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "all"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ყველა ({shopListings.length})
              </button>
              <button
                onClick={() => setActiveTab("PLANT")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "PLANT"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🌱 მცენარეები
              </button>
              <button
                onClick={() => setActiveTab("INVENTORY")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "INVENTORY"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🪴 ინვენტარი
              </button>
            </div>
          </div>

          {/* Listings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <ListingCard key={listing.id} {...listing} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
