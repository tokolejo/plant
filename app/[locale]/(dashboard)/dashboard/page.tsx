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
  Edit3,
  Tag,
  Package,
  Gift,
  Search,
  X,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SAMPLE_LISTINGS } from "@/lib/mock-data";

export default function UserDashboardPage() {
  const supabase = createClient();
  const [copied, setCopied] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"ALL" | "ACTIVE" | "GIFT" | "TRADE">("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");
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

  const currentTier = profile?.subscription_tier || profile?.tier || "FREE";

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case "TIER_1":
        return "🌱 კოლექციონერი (Tier 1)";
      case "TIER_2":
        return "🌿 პრო ბოტანიკოსი (Tier 2)";
      case "TIER_3":
        return "🪴 ორანჟერეა & შოპი (Tier 3)";
      default:
        return "✨ უფასო ტარიფი (Free)";
    }
  };

  const getMaxListings = (tier: string) => {
    switch (tier) {
      case "TIER_1":
        return 20;
      case "TIER_2":
        return 50;
      case "TIER_3":
        return 999;
      default:
        return 5;
    }
  };

  // User Stats & Limits
  const userStats = {
    fullName: profile?.full_name || currentUser?.email?.split("@")[0] || "მომხმარებელი",
    tier: currentTier,
    tierLabel: getTierLabel(currentTier),
    activeListingsCount: userListings.length,
    maxListingsAllowed: getMaxListings(currentTier),
    totalViews: 842,
    rating: profile?.average_rating || 4.9,
    totalReviews: profile?.total_reviews || 28,
    badges: ["Trusted Seller", "Green Thumb"],
    affiliateEarnings: 45,
    referralCount: 3,
  };

  const filteredListings = React.useMemo(() => {
    return userListings.filter((l) => {
      if (activeTab === "ACTIVE" && l.status === "HIDDEN") return false;
      if (activeTab === "GIFT" && !(l.transaction_type === "GIFT" || l.transactionType === "GIFT" || l.price === 0)) return false;
      if (activeTab === "TRADE" && !(l.transaction_type === "TRADE" || l.transactionType === "TRADE")) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = (l.title_ka || l.title || "").toLowerCase();
        const city = (l.city || "").toLowerCase();
        if (!title.includes(q) && !city.includes(q)) return false;
      }
      return true;
    });
  }, [userListings, activeTab, searchQuery]);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              გამარჯობა, {userStats.fullName}
            </h1>
            <Badge className="rounded-[8px] bg-secondary-container text-primary font-bold text-xs border-none">
              {userStats.tierLabel}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            მართეთ თქვენი განცხადებები, ლიმიტები და აფილიეიტ ბმული.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link href="/dashboard/profile">
            <Button variant="outline" size="sm" className="rounded-[14px] text-xs font-bold h-10 px-3.5 gap-1.5 border-border/80 hover:bg-surface-container cursor-pointer">
              <User className="w-4 h-4 text-primary" />
              პროფილი
            </Button>
          </Link>
          <Link href="/pricing">
            <Button variant="outline" size="sm" className="rounded-[14px] text-xs font-semibold h-10 px-3.5 gap-1.5 border-border/80 hover:bg-surface-container cursor-pointer">
              <Crown className="w-4 h-4 text-amber-500" />
              ტარიფი
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

        {/* 2. Rating & Badges */}
        <div className="rounded-[22px] border border-border/80 bg-card p-5 shadow-ambient">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              რეიტინგი & შეფასებები
            </span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-black text-foreground">{userStats.rating}</span>
            <span className="text-xs text-muted-foreground">({userStats.totalReviews} შეფასება)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary bg-primary/5 rounded-[6px]">
              <ShieldCheck className="w-3 h-3 mr-1" /> Trusted Seller
            </Badge>
          </div>
        </div>

        {/* 3. Total Views */}
        <div className="rounded-[22px] border border-border/80 bg-card p-5 shadow-ambient">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              ნახვები
            </span>
            <Eye className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-foreground mb-1">
            {userStats.totalViews}
          </p>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> +14% ბოლო 7 დღეში
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
      {/* 🌿 MY LISTINGS SECTION (ჩემი განცხადებები - კომპაქტური & სია/გრიდი)      */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div id="my-listings" className="rounded-[24px] border border-border/80 bg-card p-5 sm:p-6 shadow-ambient mb-8 scroll-mt-24">
        {/* Header Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 border-b border-border/50 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
              <Sprout className="w-5 h-5 text-primary shrink-0" />
              <span>ჩემი დამატებული განცხადებები</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-secondary-container text-primary">
                {filteredListings.length}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              კომპაქტური მართვა, სწრაფი ძიება და რედაქტირება
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Search */}
            <div className="relative min-w-[170px] sm:min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="მოძებნე განცხადება..."
                className="w-full pl-8 pr-7 py-1.5 rounded-[12px] border border-border/80 bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-secondary-container/70 p-1 rounded-[12px]">
              <button
                type="button"
                onClick={() => setActiveTab("ALL")}
                className={`px-2.5 py-1 rounded-[8px] text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "ALL" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ყველა ({userListings.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("GIFT")}
                className={`px-2.5 py-1 rounded-[8px] text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "GIFT" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🎁 საჩუქარი
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("TRADE")}
                className={`px-2.5 py-1 rounded-[8px] text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "TRADE" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🔄 გაცვლა
              </button>
            </div>
          </div>
        </div>

        {/* Listings Content */}
        {loadingListings ? (
          <div className="text-center py-12 text-muted-foreground text-xs font-bold">
            იტვირთება განცხადებები...
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <Package className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <h3 className="text-sm font-bold text-foreground">განცხადება არ მოიძებნა</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery ? "საძიებო სიტყვით განცხადება ვერ მოიძებნა." : "თქვენ ჯერ არ გაქვთ დამატებული განცხადება ამ კატეგორიაში."}
            </p>
            <Link href="/dashboard/listings/new" className="inline-block pt-1">
              <Button size="sm" className="rounded-[12px] bg-primary text-white text-xs font-bold shadow-ambient">
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                + ახალი განცხადების დამატება
              </Button>
            </Link>
          </div>
        ) : (
          /* ═══════════════════════════════════════════════════════════════════
             ☰ COMPACT LIST VIEW (სია - მინიმალური სივრცის დანაკარგი)
             ═══════════════════════════════════════════════════════════════════ */
          <div className="overflow-x-auto">
            <div className="divide-y divide-border/40 min-w-[550px]">
              {filteredListings.map((item) => {
                const imageSrc = item.images?.[0] || item.image || "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600";
                const title = item.title_ka || item.title || "მცენარე";
                const priceVal = item.price;
                const isGift = item.transaction_type === "GIFT" || item.transactionType === "GIFT" || priceVal === 0;
                const isTrade = item.transaction_type === "TRADE" || item.transactionType === "TRADE";
                const isHidden = item.status === "HIDDEN";

                return (
                  <div
                    key={item.id}
                    className="py-2.5 px-2.5 rounded-[14px] hover:bg-surface-container/50 transition-colors flex items-center justify-between gap-3 group"
                  >
                    {/* Left: Thumbnail & Details */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative w-12 h-12 rounded-[10px] overflow-hidden bg-surface-container shrink-0 border border-border/60">
                        <img
                          src={imageSrc}
                          alt={title}
                          className="w-full h-full object-cover"
                        />
                        <span className={`absolute top-1 left-1 w-2 h-2 rounded-full ring-2 ring-background ${
                          isHidden ? "bg-amber-500" : "bg-emerald-500"
                        }`} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                          <span>📍 {item.city || "თბილისი"}</span>
                          <span>•</span>
                          <span className="capitalize">{item.plant_category || item.plantCategory || "მცენარე"}</span>
                          {isHidden && (
                            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                              დამალული
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Price Tag */}
                    <div className="shrink-0 text-right min-w-[80px]">
                      {isGift ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-black">
                          🎁 უფასო
                        </span>
                      ) : isTrade ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-bold">
                          🔄 გაცვლა
                        </span>
                      ) : (
                        <span className="text-sm font-black text-foreground">
                          {priceVal} ₾
                        </span>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Link href={`/dashboard/listings/${item.id}/edit`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px] font-bold rounded-[8px] border-primary/30 text-primary hover:bg-primary/10 gap-1 cursor-pointer"
                          title="განცხადების რედაქტირება"
                        >
                          <Edit3 className="w-3 h-3" />
                          ედითი
                        </Button>
                      </Link>

                      <Link href={`/listings/${item.id}`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 rounded-[8px] text-muted-foreground hover:text-foreground cursor-pointer"
                          title="ნახვა"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDeleteListing(item.id)}
                        className="p-1.5 rounded-[8px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        title="განცხადების წაშლა"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
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
