"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
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
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function UserDashboardPage() {
  const [copied, setCopied] = React.useState(false);
  const affiliateCode = "GEO-PLANT-77A9";
  const affiliateUrl = `https://plantsale.ge/r/${affiliateCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(affiliateUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Mock User Data
  const user = {
    fullName: "თამარ ბოტანიკა",
    tier: "TIER_1", // 20 max listings
    activeListingsCount: 2,
    maxListingsAllowed: 20,
    totalViews: 842,
    rating: 4.9,
    totalReviews: 28,
    badges: ["Trusted Seller", "Green Thumb"],
    customSlug: "tamarbustan",
    affiliateEarnings: 45, // 45 GEL
    referralCount: 3,
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              გამარჯობა, {user.fullName}
            </h1>
            <Badge className="rounded-[8px] bg-secondary-container text-primary font-semibold text-xs border-none">
              {user.tier === "FREE" ? "Free Tier" : "კოლექციონერი (Tier 1)"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            მართეთ თქვენი განცხადებები, აფილიეიტ ბმული და შეფასებები.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/pricing">
            <Button variant="outline" size="sm" className="rounded-[14px] text-xs font-semibold h-10 px-4 gap-1.5 border-border/80 hover:bg-surface-container">
              <Crown className="w-4 h-4 text-amber-500" />
              ტარიფის შეცვლა
            </Button>
          </Link>
          <Link href="/dashboard/listings/new">
            <Button size="sm" className="rounded-[14px] bg-primary hover:bg-primary-container text-white text-xs font-bold h-10 px-4 gap-1.5 shadow-ambient">
              <PlusCircle className="w-4 h-4" />
              + ახალი განცხადება
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Tier Limit Progress */}
        <div className="rounded-[20px] border border-border/80 bg-card p-5 shadow-ambient">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              აქტიური ლიმიტი
            </span>
            <Sprout className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-2xl font-bold text-foreground">
              {user.activeListingsCount} / {user.maxListingsAllowed}
            </span>
            <span className="text-xs text-muted-foreground">განცხადება</span>
          </div>
          <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{
                width: `${(user.activeListingsCount / user.maxListingsAllowed) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Views */}
        <div className="rounded-[20px] border border-border/80 bg-card p-5 shadow-ambient">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              ჯამური ნახვები
            </span>
            <Eye className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground mb-1">{user.totalViews}</p>
          <span className="text-[11px] text-primary font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +24% ამ კვირაში
          </span>
        </div>

        {/* Rating & Reviews */}
        <div className="rounded-[20px] border border-border/80 bg-card p-5 shadow-ambient">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              რეიტინგი
            </span>
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-foreground mb-1">
            {user.rating.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">/ 5.0</span>
          </p>
          <span className="text-[11px] text-muted-foreground">
            {user.totalReviews} შეფასების საფუძველზე
          </span>
        </div>

        {/* Affiliate Revenue */}
        <div className="rounded-[20px] border border-border/80 bg-card p-5 shadow-ambient">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              აფილიეიტ ბონუსი
            </span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-foreground mb-1">
            {user.affiliateEarnings} ₾
          </p>
          <span className="text-[11px] text-muted-foreground">
            {user.referralCount} მოწვეული გამყიდველი
          </span>
        </div>
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
              className="w-full rounded-[12px] bg-surface-cream text-primary hover:bg-white font-bold text-xs gap-2"
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
      <div className="rounded-[24px] border border-border/80 bg-card p-6 shadow-ambient mb-8">
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
