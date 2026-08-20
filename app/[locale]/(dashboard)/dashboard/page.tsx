"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { createClient } from "@/utils/supabase/client";
import { 
  Sprout, 
  PlusCircle, 
  Sparkles, 
  Share2, 
  Copy, 
  Check, 
  Star, 
  ShieldCheck, 
  Award, 
  TrendingUp, 
  Eye, 
  Store, 
  Crown,
  Layers,
  ArrowRight,
  Trash2,
  ExternalLink,
  Tag,
  Package,
  Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SAMPLE_LISTINGS } from "@/lib/mock-data";

export default function UserDashboardPage() {
  const supabase = createClient();
  const [copied, setCopied] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"ALL" | "ACTIVE" | "GIFT" | "TRADE">("ALL");
  const [userListings, setUserListings] = React.useState<any[]>([]);
  const [loadingListings, setLoadingListings] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [profile, setProfile] = React.useState<any>(null);

  const affiliateCode = "GEO-PLANT-77A9";
  const affiliateUrl = `https://plant-pearl-seven.vercel.app/r/${affiliateCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(affiliateUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  React.useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setCurrentUser(user);
      if (user) {
        // Fetch profile
        const { data: profData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (profData) setProfile(profData);

        // Fetch user's listings from Supabase
        const { data: dbListings } = await supabase
          .from("listings")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (dbListings && dbListings.length > 0) {
          setUserListings(dbListings);
        } else {
          // Fallback to sample listings for visual demonstration
          setUserListings(SAMPLE_LISTINGS.slice(0, 3));
        }
      } else {
        setUserListings(SAMPLE_LISTINGS.slice(0, 3));
      }
      setLoadingListings(false);
    });
  }, []);

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm("დარწმუნებული ხართ რომ გსურთ განცხადების წაშლა?")) return;
    
    // Delete from Supabase if real ID
    if (!listingId.startsWith("lst-")) {
      await supabase.from("listings").delete().eq("id", listingId);
    }
    setUserListings((prev) => prev.filter((l) => l.id !== listingId));
  };

  // User Stats & Limits
  const userStats = {
    fullName: profile?.full_name || currentUser?.email?.split("@")[0] || "თამარ ბოტანიკა",
    tier: profile?.tier || "TIER_1",
    activeListingsCount: userListings.length,
    maxListingsAllowed: profile?.tier === "TIER_2" ? 50 : 20,
    totalViews: 842,
    rating: 4.9,
    totalReviews: 28,
    badges: ["Trusted Seller", "Green Thumb"],
    affiliateEarnings: 45,
    referralCount: 3,
  };

  const filteredListings = userListings.filter((l) => {
    if (activeTab === "ACTIVE") return l.status === "ACTIVE" || !l.status;
    if (activeTab === "GIFT") return l.transaction_type === "GIFT" || l.transactionType === "GIFT" || l.price === 0;
    if (activeTab === "TRADE") return l.transaction_type === "TRADE" || l.transactionType === "TRADE";
    return true;
  });

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              გამარჯობა, {userStats.fullName}
            </h1>
            <Badge className="rounded-[8px] bg-secondary-container text-primary font-semibold text-xs border-none">
              {userStats.tier === "FREE" ? "Free Tier" : "კოლექციონერი (Tier 1)"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            მართეთ თქვენი განცხადებები, ლიმიტები და აფილიეიტ ბმული.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/pricing">
            <Button variant="outline" size="sm" className="rounded-[14px] text-xs font-semibold h-10 px-4 gap-1.5 border-border/80 hover:bg-surface-container cursor-pointer">
              <Crown className="w-4 h-4 text-amber-500" />
              ტარიფის შეცვლა
            </Button>
          </Link>
          <Link href="/dashboard/listings/new">
            <Button size="sm" className="rounded-[14px] bg-primary hover:bg-primary-container text-white text-xs font-bold h-10 px-4 gap-1.5 shadow-ambient cursor-pointer">
              <PlusCircle className="w-4 h-4" />
              + ახალი განცხადება
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        
        {/* 1. Interactive Tier Limit Progress Card -> Click to Scroll to My Listings */}
        <a
          href="#my-listings"
          className="rounded-[22px] border border-border/80 bg-card p-5 shadow-ambient hover:border-primary/60 hover:shadow-md transition-all group block cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">
              აქტიური ლიმიტი
            </span>
            <Sprout className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-2xl font-black text-foreground">
              {userStats.activeListingsCount} / {userStats.maxListingsAllowed}
            </span>
            <span className="text-xs text-muted-foreground">განცხადება</span>
          </div>
          <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden mb-2.5">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{
                width: `${Math.min(100, (userStats.activeListingsCount / userStats.maxListingsAllowed) * 100)}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold text-primary">
            <span>ჩემი განცხადებები</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </a>

        {/* 2. Views */}
        <div className="rounded-[22px] border border-border/80 bg-card p-5 shadow-ambient">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              ჯამური ნახვები
            </span>
            <Eye className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-foreground mb-1">{userStats.totalViews}</p>
          <span className="text-[11px] text-primary font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +24% ამ კვირაში
          </span>
        </div>

        {/* 3. Rating & Reviews */}
        <div className="rounded-[22px] border border-border/80 bg-card p-5 shadow-ambient">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              რეიტინგი
            </span>
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-foreground mb-1">
            {userStats.rating.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">/ 5.0</span>
          </p>
          <span className="text-[11px] text-muted-foreground">
            {userStats.totalReviews} შეფასების საფუძველზე
          </span>
        </div>

        {/* 4. Affiliate Revenue */}
        <div className="rounded-[22px] border border-border/80 bg-card p-5 shadow-ambient">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              აფილიეიტ ბონუსი
            </span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-foreground mb-1">
            {userStats.affiliateEarnings} ₾
          </p>
          <span className="text-[11px] text-muted-foreground">
            {userStats.referralCount} მოწვეული გამყიდველი
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 🌿 MY LISTINGS SECTION (ჩემი განცხადებები)                            */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div id="my-listings" className="rounded-[24px] border border-border/80 bg-card p-6 shadow-ambient mb-8 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-border/50 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
              <Sprout className="w-5 h-5 text-primary" />
              <span>ჩემი დამატებული განცხადებები</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-secondary-container text-primary">
                {userListings.length}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              მართეთ, დაათვალიერეთ ან წაშალეთ თქვენი აქტიური განცხადებები
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-secondary-container/70 p-1 rounded-[14px]">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all cursor-pointer ${
                activeTab === "ALL" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ყველა ({userListings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("GIFT")}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all cursor-pointer ${
                activeTab === "GIFT" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🎁 საჩუქრები
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("TRADE")}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all cursor-pointer ${
                activeTab === "TRADE" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🔄 გაცვლა
            </button>
          </div>
        </div>

        {/* Listings Grid */}
        {loadingListings ? (
          <div className="text-center py-12 text-muted-foreground text-xs">
            იტვირთება განცხადებები...
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Package className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <h3 className="text-sm font-bold text-foreground">განცხადება არ მოიძებნა</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              თქვენ ჯერ არ გაქვთ დამატებული განცხადება ამ კატეგორიაში.
            </p>
            <Link href="/dashboard/listings/new" className="inline-block pt-1">
              <Button size="sm" className="rounded-[14px] bg-primary text-white text-xs font-bold shadow-ambient">
                <PlusCircle className="w-4 h-4 mr-1.5" />
                + ახალი განცხადების დამატება
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredListings.map((item) => {
              const imageSrc = item.images?.[0] || item.image || "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600";
              const title = item.title_ka || item.title || "მცენარე";
              const priceVal = item.price;
              const isGift = item.transaction_type === "GIFT" || item.transactionType === "GIFT" || priceVal === 0;
              const isTrade = item.transaction_type === "TRADE" || item.transactionType === "TRADE";

              return (
                <div
                  key={item.id}
                  className="rounded-[20px] border border-border/80 bg-background/60 p-4 shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Image & Badges */}
                    <div className="relative aspect-4/3 rounded-[14px] overflow-hidden mb-3 bg-surface-container">
                      <img
                        src={imageSrc}
                        alt={title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 flex gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-extrabold flex items-center gap-1 shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          აქტიური
                        </span>
                        {isGift ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-700/90 text-white text-[10px] font-bold backdrop-blur-xs">
                            🎁 საჩუქარი
                          </span>
                        ) : isTrade ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-600/90 text-white text-[10px] font-bold backdrop-blur-xs">
                            🔄 გაცვლა
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Title & City */}
                    <h3 className="font-bold text-xs sm:text-sm text-foreground line-clamp-2 mb-1 leading-snug">
                      {title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1">
                      <span>📍 {item.city || "თბილისი"}</span>
                      {item.address && <span className="truncate">· {item.address}</span>}
                    </p>
                  </div>

                  {/* Price & Actions */}
                  <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                    <div>
                      {isGift ? (
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          უფასო
                        </span>
                      ) : isTrade ? (
                        <span className="text-xs font-bold text-amber-600">
                          გაცვლა
                        </span>
                      ) : (
                        <span className="text-sm font-black text-foreground">
                          {priceVal} ₾
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link href={`/listings/${item.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2.5 rounded-[10px] text-xs font-semibold border-border/70 hover:bg-surface-container gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          ნახვა
                        </Button>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDeleteListing(item.id)}
                        className="p-2 rounded-[10px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        title="განცხადების წაშლა"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Referral & Promo Section */}
      <div className="rounded-[24px] bg-primary border border-border/40 p-6 sm:p-8 text-white mb-8 shadow-ambient-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold text-primary-fixed mb-3">
              <Sparkles className="w-3.5 h-3.5 text-primary-fixed" /> აფილიეიტ & რეფერალ პროგრამა
            </span>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">
              მოიწვიე მცენარეთა მოყვარულები და მიიღე ბონუსები
            </h2>
            <p className="text-xs sm:text-sm text-primary-fixed/80 leading-relaxed">
              გააზიარე შენი უნიკალური პრომო კოდი. ყოველ დარეგისტრირებულ გამყიდველზე მიიღებ ბონუს ქულებს და ფასდაკლებას პაკეტებზე.
            </p>
          </div>

          <div className="rounded-[18px] bg-black/30 backdrop-blur-md p-4 border border-white/15 flex flex-col gap-3 min-w-[280px]">
            <span className="text-xs font-bold text-primary-fixed">შენი რეფერალ ბმული:</span>
            <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-[10px] text-xs font-mono">
              <span className="truncate">{affiliateUrl}</span>
            </div>
            <Button
              onClick={copyToClipboard}
              size="sm"
              className="w-full rounded-[12px] bg-surface-cream text-primary hover:bg-white font-bold text-xs gap-2 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" /> დაკოპირდა!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> ლინკის კოპირება
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Gamification Badges Earned */}
      <div className="rounded-[24px] border border-border/80 bg-card p-6 shadow-ambient">
        <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <span>თქვენი ბეიჯები და სტატუსი</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-[18px] bg-secondary-container/60 border border-border/40 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-[12px] bg-primary text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-foreground">Trusted Seller</h3>
              <p className="text-[10px] text-muted-foreground">10+ შეფასება & 4.8+ რეიტინგი</p>
            </div>
          </div>

          <div className="rounded-[18px] bg-secondary-container/60 border border-border/40 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-[12px] bg-primary text-white flex items-center justify-center">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-foreground">Green Thumb</h3>
              <p className="text-[10px] text-muted-foreground">აქტიური ბოტანიკოსი & გამყიდველი</p>
            </div>
          </div>

          <div className="rounded-[18px] bg-surface-container/50 border border-border/60 p-4 flex items-center gap-3 opacity-60">
            <div className="h-10 w-10 rounded-[12px] bg-surface-container text-muted-foreground flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-foreground">Swap Master</h3>
              <p className="text-[10px] text-muted-foreground">შეასრულეთ 3+ წარმატებული გაცვლა</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
