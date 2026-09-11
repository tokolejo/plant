"use client";

import * as React from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  Store, 
  Link as LinkIcon, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Search, 
  SlidersHorizontal, 
  Filter, 
  Edit2, 
  RefreshCw, 
  Palmtree, 
  MapPin, 
  Phone, 
  MessageCircle, 
  Eye, 
  Layers, 
  Crown, 
  Clock, 
  Truck, 
  AlertCircle, 
  X,
  ArrowRight,
  Globe,
  Save,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { logAuditEvent } from "@/lib/audit-logger";

const RESERVED_SLUGS = new Set([
  "admin", "api", "auth", "login", "register", "shops", "shop", "store", 
  "listings", "listing", "pricing", "plans", "contact", "about", "faq", 
  "terms", "privacy", "iso", "services", "service", "map", "plant-doctor", 
  "dashboard", "greenhouse", "profile", "settings", "feedback", "search"
]);

export interface ShopManagementUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  tier: string;
  role: string;
  customSlug?: string | null;
  activeListings?: number;
  isAdmin?: boolean;
  isVerified?: boolean;
  phone?: string | null;
  city?: string | null;
  address?: string | null;
  bio?: string | null;
  shopBannerUrl?: string | null;
  shopWorkingHours?: string | null;
  shopDeliveryTerms?: string | null;
  isOnVacation?: boolean;
  createdAt?: string;
}

interface ShopManagementStudioProps {
  users: any[];
  listings: any[];
  currentUserId?: string;
  onRefreshData?: () => void;
  showNotice: (msg: string) => void;
}

export function ShopManagementStudio({
  users,
  listings,
  currentUserId,
  onRefreshData,
  showNotice,
}: ShopManagementStudioProps) {
  const supabase = createClient();

  // Local state & filters
  const [searchQuery, setSearchQuery] = React.useState("");
  const [tierFilter, setTierFilter] = React.useState<string>("all");
  const [slugFilter, setSlugFilter] = React.useState<"all" | "has_slug" | "no_slug">("all");
  const [verifiedFilter, setVerifiedFilter] = React.useState<"all" | "verified" | "unverified">("all");
  const [vacationFilter, setVacationFilter] = React.useState<"all" | "active" | "vacation">("all");
  const [copiedSlug, setCopiedSlug] = React.useState<string | null>(null);

  // Edit Modal State
  const [editingUser, setEditingUser] = React.useState<any | null>(null);
  const [slugInput, setSlugInput] = React.useState("");
  const [slugStatus, setSlugStatus] = React.useState<"idle" | "checking" | "valid" | "invalid" | "reserved">("idle");
  const [slugErrorMessage, setSlugErrorMessage] = React.useState("");
  const [nameInput, setNameInput] = React.useState("");
  const [bioInput, setBioInput] = React.useState("");
  const [cityInput, setCityInput] = React.useState("თბილისი");
  const [addressInput, setAddressInput] = React.useState("");
  const [phoneInput, setPhoneInput] = React.useState("");
  const [bannerInput, setBannerInput] = React.useState("");
  const [workingHoursInput, setWorkingHoursInput] = React.useState("");
  const [deliveryTermsInput, setDeliveryTermsInput] = React.useState("");
  const [tierInput, setTierInput] = React.useState("FREE");
  const [isVerifiedInput, setIsVerifiedInput] = React.useState(false);
  const [isVacationInput, setIsVacationInput] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Quick Action in progress ID
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);

  // Prepare Shop entities from users + listings
  const shopProfiles = React.useMemo(() => {
    return users.map((u) => {
      const userListings = listings.filter((l) => l.seller?.id === u.id || l.user_id === u.id);
      const activeCount = userListings.filter((l) => (l.status || "ACTIVE") === "ACTIVE").length;
      return {
        ...u,
        activeListings: activeCount,
        hasCustomSlug: Boolean(u.customSlug && u.customSlug.trim().length > 0),
        isVerified: Boolean(u.isVerified || u.is_verified || u.is_verified_shop),
        isOnVacation: Boolean(u.isOnVacation || u.is_on_vacation),
        city: u.city || "თბილისი",
      };
    });
  }, [users, listings]);

  // Key KPI Metrics
  const metrics = React.useMemo(() => {
    const totalUsers = shopProfiles.length;
    const withSlug = shopProfiles.filter((p) => p.hasCustomSlug).length;
    const verified = shopProfiles.filter((p) => p.isVerified).length;
    const proOrBusiness = shopProfiles.filter(
      (p) => p.tier === "TIER_2" || p.tier === "TIER_3" || p.tier === "PRO" || p.tier === "BUSINESS"
    ).length;
    const activeShopListings = shopProfiles.reduce((acc, p) => acc + (p.activeListings || 0), 0);

    return {
      totalUsers,
      withSlug,
      verified,
      proOrBusiness,
      activeShopListings,
    };
  }, [shopProfiles]);

  // Filter computation
  const filteredShops = React.useMemo(() => {
    return shopProfiles.filter((shop) => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (shop.fullName || "").toLowerCase().includes(q);
        const matchEmail = (shop.email || "").toLowerCase().includes(q);
        const matchSlug = (shop.customSlug || "").toLowerCase().includes(q);
        const matchPhone = (shop.phone || "").toLowerCase().includes(q);
        const matchCity = (shop.city || "").toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchSlug && !matchPhone && !matchCity) {
          return false;
        }
      }

      // 2. Tier filter
      if (tierFilter !== "all") {
        if (tierFilter === "PRO_PLUS") {
          if (!["TIER_2", "TIER_3", "PRO", "BUSINESS"].includes(shop.tier)) return false;
        } else if (shop.tier !== tierFilter) {
          return false;
        }
      }

      // 3. Slug filter
      if (slugFilter === "has_slug" && !shop.hasCustomSlug) return false;
      if (slugFilter === "no_slug" && shop.hasCustomSlug) return false;

      // 4. Verified filter
      if (verifiedFilter === "verified" && !shop.isVerified) return false;
      if (verifiedFilter === "unverified" && shop.isVerified) return false;

      // 5. Vacation filter
      if (vacationFilter === "active" && shop.isOnVacation) return false;
      if (vacationFilter === "vacation" && !shop.isOnVacation) return false;

      return true;
    }).sort((a, b) => {
      // Prioritize shops with custom slugs, then verified, then active listings
      if (a.hasCustomSlug !== b.hasCustomSlug) return a.hasCustomSlug ? -1 : 1;
      if (a.isVerified !== b.isVerified) return a.isVerified ? -1 : 1;
      return (b.activeListings || 0) - (a.activeListings || 0);
    });
  }, [shopProfiles, searchQuery, tierFilter, slugFilter, verifiedFilter, vacationFilter]);

  // Copy full Custom URL to clipboard
  const handleCopyUrl = (slug: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://plant.ge";
    const fullUrl = `${origin}/ka/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    showNotice(` ბმული დაკოპირდა: ${fullUrl}`);
    setTimeout(() => {
      setCopiedSlug((prev) => (prev === slug ? null : prev));
    }, 3000);
  };

  // Open Edit Modal
  const openEditModal = (user: any) => {
    setEditingUser(user);
    const initialSlug = user.customSlug || "";
    setSlugInput(initialSlug);
    setSlugStatus(initialSlug ? "valid" : "idle");
    setSlugErrorMessage("");
    setNameInput(user.fullName || "");
    setBioInput(user.bio || "");
    setCityInput(user.city || "თბილისი");
    setAddressInput(user.address || "");
    setPhoneInput(user.phone || "");
    setBannerInput(user.shopBannerUrl || "");
    setWorkingHoursInput(user.shopWorkingHours || "10:00 - 20:00");
    setDeliveryTermsInput(user.shopDeliveryTerms || "");
    setTierInput(user.tier || "FREE");
    setIsVerifiedInput(Boolean(user.isVerified));
    setIsVacationInput(Boolean(user.isOnVacation));
  };

  // Validate slug as user types
  const handleSlugInputChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    setSlugInput(clean);

    if (!clean) {
      setSlugStatus("idle");
      setSlugErrorMessage("");
      return;
    }

    if (clean.length < 3) {
      setSlugStatus("invalid");
      setSlugErrorMessage("მინიმუმ 3 სიმბოლო (მხოლოდ a-z, 0-9, - ან _)");
      return;
    }

    if (RESERVED_SLUGS.has(clean)) {
      setSlugStatus("reserved");
      setSlugErrorMessage("ეს მისამართი რეზერვირებულია სისტემის მიერ");
      return;
    }

    // Check if slug is unchanged from current user
    if (editingUser && editingUser.customSlug === clean) {
      setSlugStatus("valid");
      setSlugErrorMessage("");
      return;
    }

    // Live Supabase Check
    setSlugStatus("checking");
    supabase
      .from("profiles")
      .select("id, custom_slug")
      .eq("custom_slug", clean)
      .maybeSingle()
      .then(
        ({ data }) => {
          if (data && data.id !== editingUser?.id) {
            setSlugStatus("invalid");
            setSlugErrorMessage("ეს URL უკვე დაკავებულია სხვა მომხმარებლის მიერ");
          } else {
            setSlugStatus("valid");
            setSlugErrorMessage("");
          }
        },
        () => {
          setSlugStatus("valid");
          setSlugErrorMessage("");
        }
      );
  };

  // Save Modal Changes
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (slugStatus === "invalid" || slugStatus === "reserved") {
      showNotice("⚠️ გთხოვთ მიუთითოთ ვალიდური Custom URL სლაგი!");
      return;
    }

    setIsSaving(true);
    const targetId = editingUser.id;
    const finalSlug = slugInput.trim() ? slugInput.trim().toLowerCase() : null;

    try {
      const payload: any = {
        full_name: nameInput.trim(),
        custom_slug: finalSlug,
        city: cityInput.trim() || "თბილისი",
        address: addressInput.trim() || null,
        phone: phoneInput.trim() || null,
        bio: bioInput.trim() || null,
        shop_banner_url: bannerInput.trim() || null,
        shop_working_hours: workingHoursInput.trim() || null,
        shop_delivery_terms: deliveryTermsInput.trim() || null,
        subscription_tier: tierInput,
        is_verified: isVerifiedInput,
        is_verified_shop: isVerifiedInput,
        is_on_vacation: isVacationInput,
        updated_at: new Date().toISOString(),
      };

      if (!targetId.startsWith("usr-")) {
        const { error } = await supabase
          .from("profiles")
          .update(payload)
          .eq("id", targetId);

        if (error) throw error;
      }

      // Log Audit Event
      logAuditEvent({
        actorId: currentUserId,
        action: "UPDATE_CUSTOM_SLUG",
        targetType: "USER",
        targetId: targetId,
        oldData: {
          slug: editingUser.customSlug,
          tier: editingUser.tier,
          verified: editingUser.isVerified,
        },
        newData: {
          slug: finalSlug,
          tier: tierInput,
          verified: isVerifiedInput,
          name: nameInput,
        },
      });

      showNotice(` მაღაზიის პროფილი წარმატებით განახლდა!`);
      setEditingUser(null);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showNotice(`❌ შეცდომა შენახვისას: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Quick 1-Click Toggle Verification
  const handleToggleVerified = async (user: any) => {
    const nextState = !user.isVerified;
    setActionLoadingId(user.id);
    try {
      if (!user.id.startsWith("usr-")) {
        const { error } = await supabase
          .from("profiles")
          .update({ is_verified: nextState, is_verified_shop: nextState })
          .eq("id", user.id);
        if (error) throw error;
      }

      logAuditEvent({
        actorId: currentUserId,
        action: "UPDATE_ROLE",
        targetType: "USER",
        targetId: user.id,
        oldData: { verified: user.isVerified },
        newData: { verified: nextState },
      });

      showNotice(
        nextState 
          ? ` ${user.fullName}-ს მიენიჭა ვერიფიცირებული მაღაზიის სტატუსი!`
          : ` ${user.fullName}-ს ვერიფიკაცია გაუქმდა`
      );
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showNotice(`❌ შეცდომა: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick Tier Change
  const handleQuickTierChange = async (user: any, newTier: string) => {
    setActionLoadingId(user.id);
    try {
      if (!user.id.startsWith("usr-")) {
        const { error } = await supabase
          .from("profiles")
          .update({ subscription_tier: newTier })
          .eq("id", user.id);
        if (error) throw error;
      }

      logAuditEvent({
        actorId: currentUserId,
        action: "UPDATE_PLAN",
        targetType: "USER",
        targetId: user.id,
        oldData: { tier: user.tier },
        newData: { tier: newTier },
      });

      showNotice(` ${user.fullName}-ს ტარიფი განახლდა: ${newTier}!`);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showNotice(`❌ შეცდომა: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ═══ Top High-Density KPI Strip (2x2 on mobile, 4-col desktop) ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* KPI 1: Active Custom Slugs */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-card via-card to-indigo-500/[0.06] border border-indigo-500/20 shadow-2xs">
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Custom URL შოპები
            </span>
            <div className="h-7 w-7 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <LinkIcon className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-foreground">{metrics.withSlug}</p>
          <p className="text-[10.5px] font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
            აქტიური პერსონალური URL
          </p>
        </div>

        {/* KPI 2: Verified Nurseries */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-card via-card to-emerald-500/[0.06] border border-emerald-500/20 shadow-2xs">
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              ვერიფიცირებული
            </span>
            <div className="h-7 w-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-foreground">{metrics.verified}</p>
          <p className="text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
            სანდო მაღაზიის ბეიჯით
          </p>
        </div>

        {/* KPI 3: Pro & Business Tiers */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-card via-card to-purple-500/[0.06] border border-purple-500/20 shadow-2xs">
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Pro & Business
            </span>
            <div className="h-7 w-7 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Crown className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-foreground">{metrics.proOrBusiness}</p>
          <p className="text-[10.5px] font-semibold text-purple-600 dark:text-purple-400 mt-0.5">
            Tier 2 / Tier 3 გამომწერები
          </p>
        </div>

        {/* KPI 4: Shop Inventory */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-card via-card to-amber-500/[0.06] border border-amber-500/20 shadow-2xs">
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              მარაგი შოპებში
            </span>
            <div className="h-7 w-7 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-foreground">{metrics.activeShopListings}</p>
          <p className="text-[10.5px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
            აქტიური განცხადება
          </p>
        </div>
      </div>

      {/* ═══ Multi-Filter & Search Bar ═══ */}
      <div className="p-3 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ძებნა მაღაზიის სახელით, სლაგით (/slug), ტელეფონით, ქალაქით..."
              className="pl-9 h-9 text-xs rounded-xl border-border/80 bg-surface-container/50 focus:bg-background"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Direct Link to Public Directory */}
            <a
              href="/ka/shops"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border/80 hover:bg-surface-container text-foreground text-xs font-bold transition-colors shrink-0"
            >
              <span>ვიტრინის კატალოგი</span>
              <ExternalLink className="w-3.5 h-3.5 text-primary" />
            </a>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (onRefreshData) onRefreshData();
                showNotice(" მონაცემები განახლდა!");
              }}
              className="h-9 rounded-xl px-2.5 text-xs font-bold gap-1.5 border-border/80 hover:bg-surface-container shrink-0"
              title="მონაცემების განახლება"
            >
              <RefreshCw className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">განახლება</span>
            </Button>
          </div>
        </div>

        {/* Filter Pills Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          {/* Slug Filter */}
          <div className="flex items-center gap-1 bg-surface-container/70 p-1 rounded-xl shrink-0">
            {[
              { id: "all", label: "ყველა" },
              { id: "has_slug", label: " Custom URL-ით" },
              { id: "no_slug", label: "სლაგის გარეშე" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSlugFilter(opt.id as any)}
                className={`px-2.5 py-1 rounded-[8px] text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  slugFilter === opt.id
                    ? "bg-primary text-white shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Tier Filter */}
          <div className="flex items-center gap-1 bg-surface-container/70 p-1 rounded-xl shrink-0">
            {[
              { id: "all", label: "ყველა ტარიფი" },
              { id: "TIER_3", label: "Tier 3 (Business)" },
              { id: "TIER_2", label: "Tier 2 (Pro)" },
              { id: "TIER_1", label: "Tier 1" },
              { id: "FREE", label: "Free" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTierFilter(t.id)}
                className={`px-2.5 py-1 rounded-[8px] text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  tierFilter === t.id
                    ? "bg-purple-600 text-white shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Verified Filter */}
          <div className="flex items-center gap-1 bg-surface-container/70 p-1 rounded-xl shrink-0">
            {[
              { id: "all", label: "სტატუსი" },
              { id: "verified", label: " ვერიფიცირებული" },
              { id: "unverified", label: "ჩვეულებრივი" },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVerifiedFilter(v.id as any)}
                className={`px-2.5 py-1 rounded-[8px] text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  verifiedFilter === v.id
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Shop Cards: Mobile-First High Density Layout ═══ */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>ნაპოვნია <strong className="text-foreground font-black">{filteredShops.length}</strong> მაღაზია / სელერი</span>
          <span className="text-[11px]">სორტირება: პრიორიტეტული სლაგები</span>
        </div>

        {filteredShops.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-card p-10 text-center space-y-2">
            <Store className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
            <p className="text-sm font-bold text-foreground">მაღაზია ვერ მოიძებნა</p>
            <p className="text-xs text-muted-foreground">სცადეთ საძიებო სიტყვის ან ფილტრების შეცვლა</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-3">
            {filteredShops.map((shop) => {
              const hasSlug = shop.hasCustomSlug;
              const hostOrigin = typeof window !== "undefined" ? window.location.origin : "https://plant.ge";
              const storefrontUrl = hasSlug ? `/ka/${shop.customSlug}` : `/ka/shops/${shop.id}`;
              const isCopied = copiedSlug === shop.customSlug;
              const isLoading = actionLoadingId === shop.id;

              return (
                <div
                  key={shop.id}
                  className={`rounded-2xl border transition-all duration-200 bg-card p-3 sm:p-3.5 flex flex-col justify-between gap-3 shadow-2xs hover:shadow-xs group ${
                    shop.isVerified ? "border-emerald-500/30 dark:border-emerald-500/20" : "border-border/80"
                  }`}
                >
                  {/* Card Top: Avatar, Name, Badges */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-surface-container shrink-0 border border-border/60">
                          {shop.avatarUrl ? (
                            <img
                              src={shop.avatarUrl}
                              alt={shop.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-black text-primary text-sm bg-primary/10">
                              {shop.fullName?.charAt(0) || "P"}
                            </div>
                          )}
                          {shop.isVerified && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-600 rounded-full text-white flex items-center justify-center ring-2 ring-background">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-black text-foreground truncate max-w-[140px] sm:max-w-[180px]">
                              {shop.fullName || "უსახელო მაღაზია"}
                            </h4>
                            {shop.isVerified && (
                              <Badge className="h-4 px-1.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[9.5px] font-bold border border-emerald-500/30">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                            {shop.email}
                          </p>
                        </div>
                      </div>

                      {/* Tier Select Pill */}
                      <select
                        value={shop.tier || "FREE"}
                        disabled={isLoading}
                        onChange={(e) => handleQuickTierChange(shop, e.target.value)}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-surface-container border border-border/80 text-foreground cursor-pointer focus:ring-1 focus:ring-primary shrink-0"
                        title="ტარიფის შეცვლა"
                      >
                        <option value="FREE">FREE</option>
                        <option value="TIER_1">TIER 1 (ენთუზიასტი)</option>
                        <option value="TIER_2">TIER 2 (სათბური)</option>
                        <option value="TIER_3">TIER 3 (Pro Shop)</option>
                      </select>
                    </div>

                    {/* Custom URL Pill Block */}
                    <div className="mt-2.5 p-2 rounded-xl bg-surface-container/60 border border-border/60 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Globe className={`w-3.5 h-3.5 shrink-0 ${hasSlug ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground"}`} />
                        {hasSlug ? (
                          <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300 truncate">
                            /{shop.customSlug}
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic truncate">
                            სლაგი არ არის მითითებული
                          </span>
                        )}
                      </div>

                      {/* Copy & External Link buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {hasSlug && (
                          <button
                            type="button"
                            onClick={() => handleCopyUrl(shop.customSlug)}
                            className={`p-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-colors ${
                              isCopied
                                ? "bg-emerald-600 text-white"
                                : "bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-surface-container"
                            }`}
                            title="URL ბმულის დაკოპირება"
                          >
                            {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span className="hidden sm:inline">{isCopied ? "კოპირებულია" : "Copy"}</span>
                          </button>
                        )}
                        <a
                          href={storefrontUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-md bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-surface-container transition-colors"
                          title="ვიტრინის გახსნა"
                        >
                          <ExternalLink className="w-3 h-3 text-primary" />
                        </a>
                      </div>
                    </div>

                    {/* Metadata strip: City, Inventory, Vacation */}
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span>{shop.city}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-semibold text-foreground">
                        <Layers className="w-3 h-3 text-emerald-600" />
                        <span>{shop.activeListings} განცხადება</span>
                      </span>
                      {shop.isOnVacation && (
                        <>
                          <span>•</span>
                          <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5 text-[10px]">
                            <Palmtree className="w-3 h-3" /> შვებულებაში
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom: Quick Actions */}
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                    {/* Toggle Verified Button */}
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleToggleVerified(shop)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                        shop.isVerified
                          ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20"
                          : "border-border/80 text-muted-foreground hover:text-foreground hover:bg-surface-container"
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>{shop.isVerified ? "ვერიფიცირებული" : "+ ვერიფიკაცია"}</span>
                    </button>

                    {/* Edit Profile & Slug Modal Trigger */}
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => openEditModal(shop)}
                      className="h-7 text-xs font-bold rounded-lg gap-1 bg-primary hover:bg-primary/90 text-white cursor-pointer px-2.5"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>მართვა</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ Edit Shop Profile & Custom Slug Modal ═══ */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-card border border-border/80 rounded-2xl sm:rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-foreground">
                    მაღაზიისა და Custom URL-ის რედაქტირება
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {editingUser.fullName} ({editingUser.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-lg hover:bg-surface-container text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3.5">
              {/* Custom Slug Input with Live Validation */}
              <div className="space-y-1.5 p-3 rounded-xl bg-indigo-500/[0.04] border border-indigo-500/20">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-foreground flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Custom URL სლაგი</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    მაგ: monstera-shop → plant.ge/ka/monstera-shop
                  </span>
                </div>

                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-muted-foreground pointer-events-none">
                    /ka/
                  </div>
                  <Input
                    value={slugInput}
                    onChange={(e) => handleSlugInputChange(e.target.value)}
                    placeholder="tamar-bustan"
                    className="pl-11 pr-8 text-xs font-mono font-bold rounded-xl h-9 border-indigo-500/30 focus:border-indigo-500"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    {slugStatus === "checking" && (
                      <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                    )}
                    {slugStatus === "valid" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    {(slugStatus === "invalid" || slugStatus === "reserved") && (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                </div>

                {slugErrorMessage && (
                  <p className="text-[10.5px] font-bold text-destructive">
                    {slugErrorMessage}
                  </p>
                )}
              </div>

              {/* Grid 2-col: Name & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground">მაღაზიის სახელი</label>
                  <Input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="text-xs rounded-xl h-8.5"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground">ქალაქი</label>
                  <Input
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    className="text-xs rounded-xl h-8.5"
                  />
                </div>
              </div>

              {/* Grid 2-col: Phone & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground">ტელეფონი / WhatsApp</label>
                  <Input
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="599123456"
                    className="text-xs rounded-xl h-8.5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground">მისამართი</label>
                  <Input
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    placeholder="მაგ: ვაჟა-ფშაველას 25"
                    className="text-xs rounded-xl h-8.5"
                  />
                </div>
              </div>

              {/* Grid 2-col: Working Hours & Delivery */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground">სამუშაო საათები</label>
                  <Input
                    value={workingHoursInput}
                    onChange={(e) => setWorkingHoursInput(e.target.value)}
                    placeholder="10:00 - 20:00"
                    className="text-xs rounded-xl h-8.5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground">მიწოდების პირობები</label>
                  <Input
                    value={deliveryTermsInput}
                    onChange={(e) => setDeliveryTermsInput(e.target.value)}
                    placeholder="მიწოდება თბილისში 1 დღეში (5 ₾)"
                    className="text-xs rounded-xl h-8.5"
                  />
                </div>
              </div>

              {/* Shop Bio */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground">მაღაზიის აღწერა / Bio</label>
                <textarea
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  rows={2}
                  className="w-full text-xs rounded-xl border border-border/80 bg-background p-2 focus:ring-1 focus:ring-primary focus:outline-none"
                  placeholder="მოკლე აღწერა..."
                />
              </div>

              {/* Cover Banner URL */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground">ქავერ ბანერის URL (1200x350)</label>
                <Input
                  value={bannerInput}
                  onChange={(e) => setBannerInput(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="text-xs rounded-xl h-8.5"
                />
              </div>

              {/* Toggles & Tier Configuration */}
              <div className="p-3 rounded-xl bg-surface-container/60 border border-border/80 flex items-center justify-between gap-3 flex-wrap">
                {/* Tier Select */}
                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-muted-foreground block">საბონენტო ტარიფი</label>
                  <select
                    value={tierInput}
                    onChange={(e) => setTierInput(e.target.value)}
                    className="text-xs font-bold px-2.5 py-1 rounded-lg bg-background border border-border text-foreground cursor-pointer"
                  >
                    <option value="FREE">FREE (5 განცხადება)</option>
                    <option value="TIER_1">TIER 1 (25 განცხადება)</option>
                    <option value="TIER_2">TIER 2 (100 განცხადება + Custom URL)</option>
                    <option value="TIER_3">TIER 3 (Unlimited + B2B Storefront)</option>
                  </select>
                </div>

                {/* Verification Toggle */}
                <label className="flex items-center gap-2 cursor-pointer pt-3 sm:pt-0">
                  <input
                    type="checkbox"
                    checked={isVerifiedInput}
                    onChange={(e) => setIsVerifiedInput(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-foreground flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ვერიფიცირებული მაღაზია</span>
                  </span>
                </label>

                {/* Vacation Toggle */}
                <label className="flex items-center gap-2 cursor-pointer pt-3 sm:pt-0">
                  <input
                    type="checkbox"
                    checked={isVacationInput}
                    onChange={(e) => setIsVacationInput(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-foreground flex items-center gap-1">
                    <Palmtree className="w-3.5 h-3.5 text-amber-600" />
                    <span>შვებულების რეჟიმი</span>
                  </span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingUser(null)}
                  className="rounded-xl text-xs font-bold"
                >
                  გაუქმება
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving}
                  className="rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white gap-1.5 shadow-sm"
                >
                  {isSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>შენახვა</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
