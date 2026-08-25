"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import {
  BarChart3,
  TrendingUp,
  Eye,
  Heart,
  Star,
  Layers,
  Store,
  Palmtree,
  Sparkles,
  ExternalLink,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Smartphone,
  Monitor,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

export default function SellerDashboardPage() {
  const locale = useLocale();
  const isKa = locale !== "en";
  const supabase = createClient();

  const [loading, setLoading] = React.useState(true);
  const [analytics, setAnalytics] = React.useState<any>(null);
  const [vacationLoading, setVacationLoading] = React.useState(false);
  const [isOnVacation, setIsOnVacation] = React.useState(false);
  const [notice, setNotice] = React.useState("");

  const loadAnalytics = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/seller/analytics");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setAnalytics(json);
          setIsOnVacation(json.profile?.isOnVacation || false);
        }
      }
    } catch (e) {
      console.error("Seller analytics load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const toggleVacationMode = async () => {
    const nextState = !isOnVacation;
    setIsOnVacation(nextState);
    setVacationLoading(true);
    try {
      const res = await fetch("/api/stores/vacation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnVacation: nextState }),
      });
      const data = await res.json();
      if (data.success) {
        setNotice(data.message);
        setTimeout(() => setNotice(""), 4000);
      }
    } catch (e: any) {
      setIsOnVacation(!nextState); // rollback
      setNotice(` შეცდომა: ${e.message}`);
    } finally {
      setVacationLoading(false);
    }
  };

  const kpis = analytics?.kpis || {
    totalListings: 0,
    activeListings: 0,
    periodViews: 0,
    totalViewsAllTime: 0,
    wishlistSaves: 0,
    avgRating: "0.00",
    totalReviews: 0,
  };

  const timeline = analytics?.viewsTimeline || [];
  const maxViewsInDay = Math.max(...timeline.map((t: any) => t.views || 0), 1);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* ═══ Header & Vacation Banner ═══ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1.5">
            <BarChart3 className="w-4 h-4" />
            <span>{isKa ? "სელერის მართვის პორტალი & ანალიტიკა" : "Seller Portal & Analytics"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            {isKa ? "სელერის კაბინეტი" : "Vendor / Seller Dashboard"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isKa
              ? "აკონტროლეთ მცენარეების ნახვები, შეფასებები და გაყიდვების დინამიკა რეალურ დროში"
              : "Track listing views, customer reviews and plant marketplace sales analytics"}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Vacation Mode Toggle */}
          <button
            type="button"
            disabled={vacationLoading}
            onClick={toggleVacationMode}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-[16px] text-xs font-bold border transition-all cursor-pointer ${
              isOnVacation
                ? "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 shadow-2xs"
                : "bg-card border-border/80 text-muted-foreground hover:bg-surface-container"
            }`}
            title={isKa ? "შვებულების რეჟიმი (მყიდველები ხედავენ რომ დროებით მიუწვდომელი ხართ)" : "Vacation mode"}
          >
            <Palmtree className="w-4 h-4 text-amber-500" />
            <span>{isOnVacation ? "️ შვებულებაშია (ჩართულია)" : "️ შვებულების რეჟიმი"}</span>
          </button>

          <Link href="/dashboard/listings/new">
            <Button className="rounded-[16px] bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-ambient gap-1.5">
              <Plus className="w-4 h-4" />
              <span>{isKa ? "განცხადების დამატება" : "New Listing"}</span>
            </Button>
          </Link>
        </div>
      </div>

      {notice && (
        <div className="rounded-[18px] bg-primary/10 border border-primary/30 p-3.5 text-xs text-primary font-bold flex items-center justify-between animate-in fade-in">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} className="text-primary hover:underline text-xs cursor-pointer">
            
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-xs text-muted-foreground font-semibold">
            {isKa ? "ანალიტიკის მონაცემები იტვირთება..." : "Loading seller analytics..."}
          </p>
        </div>
      ) : (
        <>
          {/* ═══ KPI Cards ═══ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Active Listings */}
            <div className="rounded-[22px] border border-border/80 bg-card p-5 shadow-ambient flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">
                  {isKa ? "აქტიური მცენარეები" : "Active Plants"}
                </span>
                <Layers className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-foreground">{kpis.activeListings}</p>
                <span className="text-[10px] text-primary font-bold">
                  სულ: {kpis.totalListings} განცხადება
                </span>
              </div>
            </div>

            {/* KPI 2: Period Views */}
            <div className="rounded-[22px] border border-border/80 bg-card p-5 shadow-ambient flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">
                  {isKa ? "ნახვები (30 დღე)" : "30-Day Views"}
                </span>
                <Eye className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-foreground">{kpis.periodViews}</p>
                <span className="text-[10px] text-teal-600 font-bold">
                  სულ ისტორიულად: {kpis.totalViewsAllTime}
                </span>
              </div>
            </div>

            {/* KPI 3: Wishlist Saves */}
            <div className="rounded-[22px] border border-border/80 bg-card p-5 shadow-ambient flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">
                  {isKa ? "შენახვები (Wishlists)" : "Wishlist Saves"}
                </span>
                <Heart className="w-4 h-4 text-rose-500" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-foreground">{kpis.wishlistSaves}</p>
                <span className="text-[10px] text-rose-600 font-bold">
                  მყიდველთა რჩეულებში
                </span>
              </div>
            </div>

            {/* KPI 4: Rating */}
            <div className="rounded-[22px] border border-border/80 bg-card p-5 shadow-ambient flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">
                  {isKa ? "სელერის რეიტინგი" : "Seller Rating"}
                </span>
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-1.5">
                  <span>{kpis.avgRating}</span>
                  <span className="text-xs text-muted-foreground font-semibold">/ 5.0</span>
                </p>
                <span className="text-[10px] text-amber-600 font-bold">
                  {kpis.totalReviews} შეფასება
                </span>
              </div>
            </div>
          </div>

          {/* ═══ Views Timeline Graph (Interactive SVG Bar Chart) ═══ */}
          <div className="rounded-[24px] border border-border/80 bg-card p-5 sm:p-7 shadow-ambient space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-border/50 pb-3">
              <div>
                <h2 className="text-base font-black text-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span>{isKa ? "ნახვების დინამიკა (ბოლო 30 დღე)" : "Listing Views Dynamics"}</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  თქვენი განცხადებების ყოველდღიური ნახვების სტატისტიკა
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-primary" />
                  მობილური: {analytics?.deviceBreakdown?.mobile || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Monitor className="w-3.5 h-3.5 text-teal-600" />
                  დესკტოპი: {analytics?.deviceBreakdown?.desktop || 0}
                </span>
              </div>
            </div>

            {/* SVG Visual Bars */}
            <div className="pt-4">
              <div className="h-44 w-full flex items-end gap-1 sm:gap-1.5 overflow-x-auto pb-2">
                {timeline.map((item: any, idx: number) => {
                  const heightPct = Math.max(8, Math.round(((item.views || 0) / maxViewsInDay) * 100));
                  const shortDate = item.day ? item.day.split("-").slice(1).join("/") : "";
                  return (
                    <div
                      key={item.day || idx}
                      className="flex-1 min-w-[12px] flex flex-col items-center gap-1 group relative cursor-pointer"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-8 bg-foreground text-background text-[10px] font-bold px-2 py-0.5 rounded-[8px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-xs">
                        {item.day}: {item.views} ნახვა
                      </div>

                      {/* Bar */}
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full rounded-t-[6px] bg-gradient-to-t from-primary/80 to-emerald-500 group-hover:from-primary group-hover:to-teal-400 transition-all shadow-2xs"
                      />

                      {/* Day Label (every 3rd or 4th item) */}
                      {idx % 4 === 0 && (
                        <span className="text-[9px] text-muted-foreground font-semibold truncate">
                          {shortDate}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ═══ Two Column Section: Top Listings & Store Profile ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Listings Table (2 cols) */}
            <div className="lg:col-span-2 rounded-[24px] border border-border/80 bg-card p-5 sm:p-6 shadow-ambient space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <h2 className="text-sm sm:text-base font-black text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{isKa ? "პოპულარული მცენარეები (Top Views)" : "Top Performing Listings"}</span>
                </h2>
                <Link
                  href="/dashboard/listings"
                  className="text-xs font-bold text-primary hover:underline"
                >
                  {isKa ? "ყველა განცხადება" : "View All"}
                </Link>
              </div>

              {analytics?.topListings?.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  განცხადებები ჯერ არ არის დამატებული.
                </p>
              ) : (
                <div className="divide-y divide-border/40">
                  {analytics.topListings.map((listing: any) => (
                    <div
                      key={listing.id}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors rounded-[12px] px-2"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-11 w-11 rounded-[12px] bg-surface-container overflow-hidden shrink-0 border border-border/60">
                          <img
                            src={listing.image || "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=200"}
                            alt={listing.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/listings/${listing.id}`}
                            className="font-bold text-xs sm:text-sm text-foreground hover:text-primary transition-colors truncate block"
                          >
                            {listing.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-bold text-primary">
                              {formatPrice(listing.price)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              · ️ {listing.viewsCount} ნახვა
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {listing.isVip && (
                          <Badge className="bg-amber-500 text-white text-[9px] font-black">
                            VIP
                          </Badge>
                        )}
                        <Link href={`/dashboard/listings/${listing.id}/edit`}>
                          <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold rounded-[8px]">
                            რედაქტირება
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Storefront & B2B Shop Quick Panel (1 col) */}
            <div className="rounded-[24px] border border-border/80 bg-card p-5 sm:p-6 shadow-ambient space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Store className="w-5 h-5 text-primary" />
                  <h2 className="text-base font-black text-foreground">
                    {isKa ? "მაღაზიის ვიტრინა (B2B)" : "Storefront Portal"}
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isKa
                    ? "გაააქტიურეთ თქვენი ბრენდირებული მაღაზიის გვერდი და მიიღეთ უნიკალური მოკლე ბმული."
                    : "Manage your customized storefront URL, branding, tax ID and store banner."}
                </p>

                {analytics?.profile?.customSlug && (
                  <div className="mt-4 p-3 rounded-[16px] bg-secondary-container/60 border border-border/60">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                      მაღაზიის ბმული:
                    </span>
                    <a
                      href={`/store/${analytics.profile.customSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1 truncate"
                    >
                      <span>plantsale.ge/store/{analytics.profile.customSlug}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border/50">
                <Link href="/dashboard/shop">
                  <Button className="w-full rounded-[16px] bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-ambient gap-1.5">
                    <Store className="w-4 h-4" />
                    <span>{isKa ? "მაღაზიის მართვა" : "Manage Storefront"}</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
