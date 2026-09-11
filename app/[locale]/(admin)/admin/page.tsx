"use client";

import * as React from "react";
import { Link, useRouter } from "@/i18n/routing";
import { createClient } from "@/utils/supabase/client";
import { SAMPLE_LISTINGS } from "@/lib/mock-data";
import { formatDbListing } from "@/lib/listings-service";
import { getStoredPlans, saveStoredPlans, fetchAndSyncDbPlans, SubscriptionPlanItem, DEFAULT_PLANS } from "@/lib/plans-store";
import { 
  usePlatformSettings, 
  updatePlatformSettingsViaApi, 
  PlatformSettings, 
  DEFAULT_PLATFORM_SETTINGS,
  fetchAndSyncPlatformSettings
} from "@/lib/platform-settings";
import { logAuditEvent } from "@/lib/audit-logger";
import { 
  ShieldCheck, 
  Users, 
  Layers, 
  Sparkles, 
  Eye, 
  Rocket, 
  EyeOff,
  Trash2, 
  CheckCircle, 
  Ban, 
  AlertCircle, 
  Search, 
  SlidersHorizontal,
  Crown,
  Lock,
  ArrowRight,
  CreditCard,
  Plus,
  Save,
  Check,
  Edit2,
  Edit3,
  ExternalLink,
  Store,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Filter,
  RefreshCw,
  Tag,
  User,
  Clock,
  Sprout,
  MapPin,
  X,
  Download,
  Globe,
  FileText,
  Activity,
  UserX,
  CalendarPlus,
  Loader2,
  MessageSquare,
  Mail,
  Phone,
  Reply,
  Inbox,
  CheckCheck,
  CheckSquare,
  LayoutDashboard,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { AffiliateStudio } from "@/components/admin/AffiliateStudio";
import { AuditStudio } from "@/components/admin/AuditStudio";
import { ShopManagementStudio } from "@/components/admin/ShopManagementStudio";
import { 
  UserRole, 
  canAccessAdmin, 
  canModerate, 
  canManageUsers, 
  canManagePlans, 
  hasPermission,
  ROLES_CONFIG 
} from "@/lib/rbac";

type SortField = "title" | "itemType" | "price" | "seller" | "status" | "date";
type SortOrder = "asc" | "desc";
type DateFilter = "all" | "1day" | "1week" | "1month" | "custom";

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [currentUserRole, setCurrentUserRole] = React.useState<UserRole>("USER");
  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null);
  const [activeTab, setActiveTab] = React.useState<"overview" | "listings" | "users" | "feedback" | "affiliate" | "audit" | "plans" | "analytics" | "shops">("overview");

  // Admin Listings State
  const [listings, setListings] = React.useState<any[]>([]);
  const [listingSearch, setListingSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [transactionFilter, setTransactionFilter] = React.useState<string>("all");
  
  // Searchable Seller Combobox State
  const [sellerQuery, setSellerQuery] = React.useState("");
  const [sellerDropdownOpen, setSellerDropdownOpen] = React.useState(false);
  const [selectedSeller, setSelectedSeller] = React.useState<{ id: string; name: string } | null>(null);
  const sellerDropdownRef = React.useRef<HTMLDivElement>(null);
  
  // Date Filters
  const [dateFilter, setDateFilter] = React.useState<DateFilter>("all");
  const [customDateFrom, setCustomDateFrom] = React.useState("");
  const [customDateTo, setCustomDateTo] = React.useState("");

  // Column Header Sorting
  const [sortField, setSortField] = React.useState<SortField>("date");
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("desc");

  // Feedback Notification
  const [actionNotice, setActionNotice] = React.useState<string>("");

  // ── Bulk Selection State ──────────────────────────────────────
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = React.useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredListings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredListings.map((l: any) => l.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkAction = async (action: "ACTIVE" | "HIDDEN" | "DELETE") => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const realIds = ids.filter((id) => !id.startsWith("lst-"));
    setBulkLoading(true);
    try {
      if (action === "DELETE") {
        if (!confirm(`ნამდვილად გსურთ ${ids.length} განცხადების წაშლა?`)) return;
        // Optimistic UI
        setListings((prev) => prev.filter((l) => !selectedIds.has(l.id)));
        if (realIds.length > 0) {
          const { error } = await supabase.rpc("bulk_delete_listings", { listing_ids: realIds });
          if (error) throw error;
        }
        showNotice(`️ ${ids.length} განცხადება წარმატებით წაიშალა!`);
      } else {
        setListings((prev) =>
          prev.map((l) => selectedIds.has(l.id) ? { ...l, status: action } : l)
        );
        if (realIds.length > 0) {
          const { error } = await supabase.rpc("bulk_update_listing_status", {
            listing_ids: realIds,
            new_status: action,
          });
          if (error) throw error;
        }
        const label = action === "ACTIVE" ? " გამოჩენილი" : " დამალული";
        showNotice(` ${ids.length} განცხადება — ${label}!`);
      }
      setSelectedIds(new Set());
    } catch (err: any) {
      showNotice(` შეცდომა: ${err.message}`);
    } finally {
      setBulkLoading(false);
    }
  };

  // Close seller dropdown on outside click
  React.useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (sellerDropdownRef.current && !sellerDropdownRef.current.contains(e.target as Node)) {
        setSellerDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Admin Users State
  const [users, setUsers] = React.useState<any[]>([]);

  // Subscription Plans Dynamic Management State
  const [plans, setPlans] = React.useState<SubscriptionPlanItem[]>(DEFAULT_PLANS);
  const [plansSaved, setPlansSaved] = React.useState(false);
  const [newFeatureText, setNewFeatureText] = React.useState<Record<string, string>>({});
  const [showNewPlanModal, setShowNewPlanModal] = React.useState(false);
  const [newPlanForm, setNewPlanForm] = React.useState<Partial<SubscriptionPlanItem>>({
    tier: "TIER_4",
    nameKa: "ახალი ტარიფი",
    nameEn: "New Tier",
    monthlyPrice: 49,
    yearlyPrice: 470,
    listingLimit: 75,
    vipSlots: 4,
    badge: "ახალი",
    customSlug: true,
    isActive: true,
    featuresKa: ["75 აქტიური განცხადება", "4 VIP ბუსტი / თვეში", "Custom Shop URL"],
    featuresEn: ["75 active listings", "4 VIP Boosts / month", "Custom Shop URL"],
  });

  React.useEffect(() => {
    setPlans(getStoredPlans());
    fetchAndSyncDbPlans().then((livePlans) => {
      if (livePlans && livePlans.length > 0) {
        setPlans(livePlans);
      }
    });
  }, []);

  // Platform Launch Settings & Feature Flags State
  const [platformSettings, setPlatformSettings] = React.useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);
  const [savingPlatformSettings, setSavingPlatformSettings] = React.useState(false);

  React.useEffect(() => {
    fetchAndSyncPlatformSettings().then((s) => {
      if (s) setPlatformSettings(s);
    });
  }, []);

  const handleSavePlatformSettings = async (override?: Partial<PlatformSettings>) => {
    const toSave: PlatformSettings = { ...platformSettings, ...override };
    setSavingPlatformSettings(true);
    try {
      const ok = await updatePlatformSettingsViaApi(toSave);
      setPlatformSettings(toSave);
      if (ok) {
        showNotice("🚀 პლატფორმის პარამეტრები წარმატებით შეინახა და აისახა საიტზე!");
      } else {
        showNotice("⚠️ პარამეტრები ლოკალურად შეინახა, მაგრამ სერვერზე გაწერა ვერ მოხერხდა.", "error");
      }
    } catch (err: any) {
      showNotice(`⚠️ შეცდომა: ${err?.message || "ვერ მოხერხდა შენახვა"}`, "error");
    } finally {
      setSavingPlatformSettings(false);
    }
  };

  // Floating Glassmorphic Feedback Toast Notification
  const [toast, setToast] = React.useState<{ id: string; type: "success" | "error" | "info"; message: string } | null>(null);

  const showNotice = (msg: string, type?: "success" | "error" | "info") => {
    const isErr = msg.startsWith("") || msg.startsWith("") || type === "error";
    const finalType = isErr ? "error" : (type || "success");
    setToast({
      id: Math.random().toString(),
      type: finalType,
      message: msg,
    });
    setTimeout(() => {
      setToast((prev) => (prev?.message === msg ? null : prev));
    }, 4500);
  };

  // ──────────────────────────────────────────────
  // Real Data Fetching & Sync
  // ──────────────────────────────────────────────
  const loadAdminData = React.useCallback(async (userObj?: any) => {
    const activeUser = userObj || currentUser;
    const isSuperAdmin = activeUser?.email === "tokolejo@gmail.com";

    // 1. Fetch Real Listings
    const { data: dbListings } = await supabase
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
          custom_slug
        )
      `)
      .order("created_at", { ascending: false });

    if (dbListings && dbListings.length > 0) {
      const formattedDb = dbListings.map((r: any) => ({
        ...formatDbListing(r, r.profiles),
        status: r.status || "ACTIVE",
        rawCreatedAt: r.created_at || new Date().toISOString(),
      }));
      setListings(formattedDb);
    } else {
      setListings([]);
    }

    // 2. Fetch Real Profiles
    const { data: dbProfiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (dbProfiles && dbProfiles.length > 0) {
      setUsers(dbProfiles.map((p: any) => ({
        id: p.id,
        email: p.email || p.full_name || "მომხმარებელი",
        fullName: p.full_name || "მომხმარებელი",
        avatarUrl: p.avatar_url,
        tier: p.subscription_tier || "FREE",
        role: p.role || (p.is_admin ? "ADMIN" : "USER"),
        customSlug: p.custom_slug,
        isVerified: Boolean(p.is_verified || p.is_verified_shop),
        phone: p.phone,
        city: p.city || "თბილისი",
        address: p.address,
        bio: p.bio,
        shopBannerUrl: p.shop_banner_url || p.banner_url,
        shopWorkingHours: p.shop_working_hours,
        shopDeliveryTerms: p.shop_delivery_terms,
        isOnVacation: Boolean(p.is_on_vacation),
        activeListings: dbListings?.filter((l: any) => l.user_id === p.id).length || 0,
        isAdmin: p.is_admin || p.role === "SUPER_ADMIN" || p.role === "ADMIN" || p.email === "tokolejo@gmail.com",
        createdAt: p.created_at ? new Date(p.created_at).toISOString().split("T")[0] : "2026-08-20",
      })));
    }

  }, [supabase, currentUser]);

  // Auth & Admin Verification with Granular RBAC
  React.useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setCurrentUser(user);
      const isSuperAdmin = user?.email === "tokolejo@gmail.com";

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin, role")
          .eq("id", user.id)
          .single();

        const role: UserRole = isSuperAdmin 
          ? "SUPER_ADMIN" 
          : (profile?.role as UserRole) || (profile?.is_admin ? "ADMIN" : "USER");

        setCurrentUserRole(role);

        if (canAccessAdmin(role, user.email)) {
          setIsAdmin(true);
          loadAdminData(user);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });
  }, [supabase, loadAdminData]);

  // ──────────────────────────────────────────────
  // Status Moderation & Actions
  // ──────────────────────────────────────────────
  const updateListingStatus = async (id: string, newStatus: string) => {
    const targetListing = listings.find((l) => l.id === id);
    const oldStatus = targetListing?.status || "ACTIVE";
    const listingTitle = targetListing?.title || "მცენარე";
    const sellerName = targetListing?.seller?.fullName || "უცნობი";

    // Instant local update
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
    );

    // Sync with Supabase
    if (!id.startsWith("lst-")) {
      const { error } = await supabase
        .from("listings")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) {
        console.error("Supabase status update error:", error);
        showNotice(` შეცდომა სტატუსის განახლებისას: ${error.message}`);
        return;
      }

      logAuditEvent({
        actorId: currentUser?.id,
        action: "UPDATE_LISTING_STATUS",
        targetType: "LISTING",
        targetId: id,
        oldData: {
          listingTitle,
          sellerName,
          status: oldStatus,
          changeSummary: `სტატუსი: ${oldStatus} → ${newStatus}`,
        },
        newData: {
          listingTitle,
          sellerName,
          status: newStatus,
          changeSummary: `სტატუსი: ${oldStatus} → ${newStatus}`,
        },
      });
    }

    const labelMap: Record<string, string> = {
      ACTIVE: " აქტიური (გამოჩენილი)",
      HIDDEN: " დამალული (საიტზე არ ჩანს)",
      REJECTED: " დაბლოკილი",
    };
    showNotice(` განცხადების (${listingTitle}) სტატუსი შეიცვალა: ${labelMap[newStatus] || newStatus}`);
  };

  const deleteListing = async (id: string, title: string) => {
    if (!confirm(`ნამდვილად გსურთ განცხადების წაშლა: "${title}"?`)) return;

    const targetListing = listings.find((l) => l.id === id);
    const sellerName = targetListing?.seller?.fullName || "";

    setListings((prev) => prev.filter((l) => l.id !== id));

    if (!id.startsWith("lst-")) {
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) {
        showNotice(` წაშლის შეცდომა: ${error.message}`);
        return;
      }

      logAuditEvent({
        actorId: currentUser?.id,
        action: "DELETE_LISTING",
        targetType: "LISTING",
        targetId: id,
        oldData: {
          listingTitle: title,
          sellerName,
          changeSummary: `განცხადების წაშლა: "${title}" (გამყიდველი: ${sellerName})`,
        },
      });
    }
    showNotice(`️ განცხადება წარმატებით წაიშალა: "${title}"`);
  };

  const updateUserTier = async (id: string, newTier: string) => {
    const targetUser = users.find((u) => u.id === id);
    const oldTier = targetUser?.tier || "FREE";
    const userName = targetUser?.fullName || "მომხმარებელი";
    const userEmail = targetUser?.email || "";

    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, tier: newTier } : u))
    );

    if (!id.startsWith("usr-")) {
      const { error } = await supabase.from("profiles").update({ subscription_tier: newTier }).eq("id", id);
      if (error) {
        showNotice(` შეცდომა: ${error.message}`);
        return;
      }
      logAuditEvent({
        actorId: currentUser?.id,
        action: "UPDATE_SUBSCRIPTION_TIER",
        targetType: "USER",
        targetId: id,
        oldData: {
          targetName: userName,
          targetEmail: userEmail,
          targetId: id,
          tier: oldTier,
          changeSummary: `ტარიფი: ${oldTier} → ${newTier}`,
        },
        newData: {
          targetName: userName,
          targetEmail: userEmail,
          targetId: id,
          tier: newTier,
          changeSummary: `ტარიფი: ${oldTier} → ${newTier}`,
        },
      });
    }
    showNotice(` ${userName}-ს (${userEmail}) ტარიფი განახლდა: ${oldTier} → ${newTier}`);
  };

  const updateUserRole = async (id: string, newRole: string) => {
    // Permission check: only Super Admin can assign ADMIN or SUPER_ADMIN
    if (
      (newRole === "SUPER_ADMIN" || newRole === "ADMIN") &&
      currentUserRole !== "SUPER_ADMIN" &&
      currentUser?.email !== "tokolejo@gmail.com"
    ) {
      showNotice(" მხოლოდ Super Admin-ს შეუძლია ადმინისტრატორის ან სუპერ ადმინის როლის მინიჭება!");
      return;
    }

    const isNowAdmin = newRole === "SUPER_ADMIN" || newRole === "FINANCE_ADMIN" || newRole === "CONTENT_MANAGER" || newRole === "ADMIN";
    const targetUser = users.find((u) => u.id === id);
    const oldRole = targetUser?.role || "USER";
    const userName = targetUser?.fullName || "მომხმარებელი";
    const userEmail = targetUser?.email || "";

    // Instant local state update
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, role: newRole, isAdmin: isNowAdmin } : u
      )
    );

    if (!id.startsWith("usr-")) {
      const { error } = await supabase
        .from("profiles")
        .update({
          role: newRole,
          is_admin: isNowAdmin,
        })
        .eq("id", id);

      if (error) {
        showNotice(` შეცდომა როლის მინიჭებისას: ${error.message}`);
        return;
      }

      logAuditEvent({
        actorId: currentUser?.id,
        action: "CHANGE_USER_ROLE",
        targetType: "USER",
        targetId: id,
        oldData: {
          targetName: userName,
          targetEmail: userEmail,
          targetId: id,
          role: oldRole,
          changeSummary: `როლი: ${oldRole} → ${newRole}`,
        },
        newData: {
          targetName: userName,
          targetEmail: userEmail,
          targetId: id,
          role: newRole,
          isAdmin: isNowAdmin,
          changeSummary: `როლი: ${oldRole} → ${newRole}`,
        },
      });
    }

    const roleNameKa: Record<string, string> = {
      SUPER_ADMIN: "SUPER ADMIN (სუპერ ადმინი)",
      FINANCE_ADMIN: "FINANCE ADMIN (ფინანსური ადმინი)",
      CONTENT_MANAGER: "CONTENT MANAGER (კონტენტ მენეჯერი)",
      MODERATOR: "MODERATOR (მოდერატორი)",
      SUPPORT: "SUPPORT (მხარდაჭერა)",
      PARTNER: "PARTNER (B2B პარტნიორი)",
      USER: "USER (მომხმარებელი)",
    };

    showNotice(` ${userName}-ს (${userEmail}) როლი განახლდა: ${oldRole} → ${roleNameKa[newRole] || newRole}`);
  };

  const updateUserSlug = async (id: string, newSlug: string) => {
    const cleanSlug = newSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "") || null;
    const targetUser = users.find((u) => u.id === id);
    const oldSlug = targetUser?.customSlug || "არ არის";
    const userName = targetUser?.fullName || "მომხმარებელი";
    const userEmail = targetUser?.email || "";

    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, customSlug: cleanSlug } : u))
    );
    if (!id.startsWith("usr-")) {
      const { error } = await supabase
        .from("profiles")
        .update({ custom_slug: cleanSlug })
        .eq("id", id);
      if (error) {
        showNotice(` შეცდომა სლაგის განახლებისას: ${error.message}`);
        return;
      }

      logAuditEvent({
        actorId: currentUser?.id,
        action: "UPDATE_CUSTOM_SLUG",
        targetType: "USER",
        targetId: id,
        oldData: {
          targetName: userName,
          targetEmail: userEmail,
          customSlug: oldSlug,
          changeSummary: `Slug: /${oldSlug} → /${cleanSlug || "none"}`,
        },
        newData: {
          targetName: userName,
          targetEmail: userEmail,
          customSlug: cleanSlug,
          changeSummary: `Slug: /${oldSlug} → /${cleanSlug || "none"}`,
        },
      });
    }
    showNotice(cleanSlug ? ` ${userName}-ს Custom Slug განახლდა: /${cleanSlug}` : ` ${userName}-ს Custom Slug გასუფთავდა`);
  };

  const handlePlanChange = (planId: string, field: keyof SubscriptionPlanItem, value: any) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;
        
        const updated = { ...p, [field]: value };

        // Auto-calculate yearly price when monthly price changes
        if (field === "monthlyPrice") {
          const mPrice = Math.max(0, parseFloat(value) || 0);
          const discount = p.discountPercent !== undefined ? p.discountPercent : 20;
          if (mPrice === 0) {
            updated.yearlyPrice = 0;
          } else {
            updated.yearlyPrice = Math.round(mPrice * 12 * (1 - discount / 100));
          }
        }

        // Auto-calculate yearly price when discount % changes
        if (field === "discountPercent") {
          const discount = Math.max(0, Math.min(99, parseFloat(value) || 0));
          const mPrice = p.monthlyPrice || 0;
          if (mPrice === 0) {
            updated.yearlyPrice = 0;
          } else {
            updated.yearlyPrice = Math.round(mPrice * 12 * (1 - discount / 100));
          }
        }

        return updated;
      })
    );
    setPlansSaved(false);
  };

  const handleDuplicatePlan = (planId: string) => {
    const original = plans.find((p) => p.id === planId);
    if (!original) return;

    const uniqueSuffix = Date.now().toString().slice(-4);
    const newTier = `${original.tier}_COPY_${uniqueSuffix}`;
    const duplicatedPlan: SubscriptionPlanItem = {
      ...original,
      id: newTier,
      tier: newTier,
      nameKa: `${original.nameKa} (ასლი)`,
      nameEn: `${original.nameEn || original.nameKa} (Copy)`,
      sortOrder: plans.length + 1,
      badge: original.badge ? `${original.badge} (Copy)` : undefined,
    };

    const updated = [...plans, duplicatedPlan];
    setPlans(updated);
    saveStoredPlans(updated);

    logAuditEvent({
      actorId: currentUser?.id,
      action: "DUPLICATE_PLAN",
      targetType: "PLAN",
      newData: duplicatedPlan,
    });

    showNotice(` ტარიფი "${original.nameKa}" დადუბლირდა! შეგიძლიათ შეცვალოთ და შეინახოთ.`);
  };

  const handleAddFeature = (planId: string, featureText: string) => {
    const trimmed = featureText.trim();
    if (!trimmed) return;
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;
        const currentKa = Array.isArray(p.featuresKa) ? p.featuresKa : [];
        const currentEn = Array.isArray(p.featuresEn) ? p.featuresEn : currentKa;
        return {
          ...p,
          featuresKa: [...currentKa, trimmed],
          featuresEn: [...currentEn, trimmed],
        };
      })
    );
    setPlansSaved(false);
  };

  const handleRemoveFeature = (planId: string, index: number) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;
        const currentKa = Array.isArray(p.featuresKa) ? p.featuresKa : [];
        const currentEn = Array.isArray(p.featuresEn) ? p.featuresEn : currentKa;
        return {
          ...p,
          featuresKa: currentKa.filter((_, i) => i !== index),
          featuresEn: currentEn.filter((_, i) => i !== index),
        };
      })
    );
    setPlansSaved(false);
  };

  const handleSavePlans = async () => {
    try {
      saveStoredPlans(plans);

      // Save/Upsert to Supabase subscription_plans table
      const upserts = plans.map((p, idx) => ({
        name_ka: p.nameKa,
        name_en: p.nameEn || p.nameKa,
        tier: p.tier || p.id,
        price_monthly: p.monthlyPrice,
        price_yearly: p.yearlyPrice,
        listing_limit: p.listingLimit,
        vip_slots: p.vipSlots || 0,
        features: p.featuresKa,
        is_active: p.isActive !== false,
        sort_order: p.sortOrder || idx + 1,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("subscription_plans")
        .upsert(upserts, { onConflict: "tier" });

      if (error) {
        console.warn("Supabase plan upsert note:", error.message);
      }

      setPlansSaved(true);
      logAuditEvent({
        actorId: currentUser?.id,
        action: "UPDATE_PLAN",
        targetType: "PLAN",
        newData: { totalPlans: plans.length, tiers: plans.map((p) => p.tier) },
      });
      showNotice(" ტარიფების პარამეტრები წარმატებით შეინახა და აისახა საიტზე!");
      setTimeout(() => setPlansSaved(false), 3500);
    } catch (err: any) {
      showNotice(` შეცდომა ტარიფების შენახვისას: ${err.message}`);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    const planToDelete = plans.find((p) => p.id === planId);
    if (!planToDelete) return;
    if (!confirm(`ნამდვილად გსურთ ტარიფის "${planToDelete.nameKa}" წაშლა?`)) return;

    const updated = plans.filter((p) => p.id !== planId);
    setPlans(updated);
    saveStoredPlans(updated);

    if (planToDelete.tier) {
      await supabase.from("subscription_plans").delete().eq("tier", planToDelete.tier);
    }

    logAuditEvent({
      actorId: currentUser?.id,
      action: "DELETE_PLAN",
      targetType: "PLAN",
      oldData: planToDelete,
    });

    showNotice(`️ ტარიფი "${planToDelete.nameKa}" წაიშალა!`);
  };

  const handleCreateNewPlan = async () => {
    if (!newPlanForm.nameKa || !newPlanForm.tier) {
      showNotice(" გთხოვთ შეიყვანოთ ტარიფის ქართული სახელი და უნიკალური კოდი (Tier)!");
      return;
    }

    const newPlan: SubscriptionPlanItem = {
      id: newPlanForm.tier.toUpperCase(),
      tier: newPlanForm.tier.toUpperCase(),
      nameKa: newPlanForm.nameKa.trim(),
      nameEn: newPlanForm.nameEn?.trim() || newPlanForm.nameKa.trim(),
      monthlyPrice: Number(newPlanForm.monthlyPrice) || 0,
      yearlyPrice: Number(newPlanForm.yearlyPrice) || (Number(newPlanForm.monthlyPrice) || 0) * 10,
      listingLimit: Number(newPlanForm.listingLimit) || 10,
      vipSlots: Number(newPlanForm.vipSlots) || 0,
      customSlug: Boolean(newPlanForm.customSlug),
      badge: newPlanForm.badge?.trim() || undefined,
      isActive: true,
      sortOrder: plans.length + 1,
      featuresKa: newPlanForm.featuresKa && newPlanForm.featuresKa.length > 0 
        ? newPlanForm.featuresKa 
        : [`${newPlanForm.listingLimit || 10} აქტიური განცხადება`],
      featuresEn: newPlanForm.featuresEn && newPlanForm.featuresEn.length > 0 
        ? newPlanForm.featuresEn 
        : [`${newPlanForm.listingLimit || 10} active listings`],
    };

    const updated = [...plans, newPlan];
    setPlans(updated);
    saveStoredPlans(updated);

    try {
      await supabase.from("subscription_plans").upsert({
        name_ka: newPlan.nameKa,
        name_en: newPlan.nameEn,
        tier: newPlan.tier,
        price_monthly: newPlan.monthlyPrice,
        price_yearly: newPlan.yearlyPrice,
        listing_limit: newPlan.listingLimit,
        vip_slots: newPlan.vipSlots,
        features: newPlan.featuresKa,
        is_active: true,
        sort_order: updated.length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "tier" });
    } catch (e) {
      console.warn("DB save note:", e);
    }

    logAuditEvent({
      actorId: currentUser?.id,
      action: "CREATE_PLAN",
      targetType: "PLAN",
      newData: newPlan,
    });

    showNotice(` ახალი ტარიფი "${newPlan.nameKa}" წარმატებით შეიქმნა!`);
    setShowNewPlanModal(false);
  };

  const handleSeedListingsToAdmin = async () => {
    if (!currentUser) {
      showNotice(" ჯერ გაიარეთ ავტორიზაცია");
      return;
    }

    try {
      showNotice("⏳ იწერება სატესტო მცენარეები თქვენს პროფილზე...");
      const seedsToInsert = SAMPLE_LISTINGS.map((s) => ({
        user_id: currentUser.id,
        item_type: s.itemType || "PLANT",
        plant_category: s.plantCategory || "monstera",
        title_ka: s.titleKa || s.title || "მცენარე",
        title_en: s.titleEn || s.title || "Plant",
        description_ka: s.descriptionKa || "ჯანსაღი ოთახის მცენარე.",
        description_en: s.descriptionEn || "Healthy indoor houseplant.",
        price: s.price || 0,
        transaction_type: s.transactionType || "FIXED",
        delivery_methods: s.deliveryMethods || ["PICKUP"],
        images: s.images || ["https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800"],
        city: s.city || "თბილისი",
        address: s.address || "ცენტრი",
        status: "ACTIVE",
        views_count: s.viewsCount || 10,
        is_featured: s.isFeatured || false,
      }));

      const { data, error } = await supabase
        .from("listings")
        .insert(seedsToInsert)
        .select();

      if (error) throw error;

      showNotice(` წარმატებით ჩაიწერა ${data.length} სატესტო განცხადება!`);
      loadAdminData();
    } catch (err: any) {
      console.error("Seed error:", err);
      showNotice(` შეცდომა ჩაწერისას: ${err.message}`);
    }
  };

  // Bulk Selection & Moderation for Users
  const [selectedUserIds, setSelectedUserIds] = React.useState<Set<string>>(new Set());
  const [bulkUserLoading, setBulkUserLoading] = React.useState(false);

  const toggleSelectAllUsers = () => {
    if (selectedUserIds.size === users.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(users.map((u) => u.id)));
    }
  };

  const toggleSelectOneUser = (id: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkSuspendUsers = async () => {
    if (selectedUserIds.size === 0) return;
    if (!confirm(`ნამდვილად გსურთ ${selectedUserIds.size} მომხმარებლის დაბლოკვა/გაყინვა?`)) return;
    const ids = Array.from(selectedUserIds).filter((id) => !id.startsWith("usr-"));
    const affectedUsers = users.filter((u) => selectedUserIds.has(u.id));
    const userNames = affectedUsers.map((u) => `${u.fullName} (${u.email})`).join(", ");

    setBulkUserLoading(true);
    try {
      if (ids.length > 0) {
        const { error } = await supabase.rpc("bulk_suspend_users", {
          user_ids: ids,
          reason: "Admin panel moderation action",
        });
        if (error) throw error;
      }

      logAuditEvent({
        actorId: currentUser?.id,
        action: "SUSPEND_USER",
        targetType: "USER",
        newData: {
          totalUsers: affectedUsers.length,
          affectedUsers: affectedUsers.map((u) => ({ id: u.id, name: u.fullName, email: u.email })),
          changeSummary: `დაიბლოკა ${affectedUsers.length} მომხმარებელი: ${userNames}`,
        },
      });

      showNotice(` ${selectedUserIds.size} მომხმარებელი გაიყინა!`);
      setSelectedUserIds(new Set());
      loadAdminData();
    } catch (err: any) {
      showNotice(` შეცდომა: ${err.message}`);
    } finally {
      setBulkUserLoading(false);
    }
  };

  const bulkExtendUsers = async (extraDays: number = 30) => {
    if (selectedUserIds.size === 0) return;
    const ids = Array.from(selectedUserIds).filter((id) => !id.startsWith("usr-"));
    const affectedUsers = users.filter((u) => selectedUserIds.has(u.id));
    const userNames = affectedUsers.map((u) => `${u.fullName} (${u.email})`).join(", ");

    setBulkUserLoading(true);
    try {
      if (ids.length > 0) {
        const { error } = await supabase.rpc("bulk_extend_subscription", {
          user_ids: ids,
          extra_days: extraDays,
        });
        if (error) throw error;
      }

      logAuditEvent({
        actorId: currentUser?.id,
        action: "EXTEND_SUBSCRIPTION",
        targetType: "USER",
        newData: {
          extraDays,
          totalUsers: affectedUsers.length,
          affectedUsers: affectedUsers.map((u) => ({ id: u.id, name: u.fullName, email: u.email })),
          changeSummary: `გაუგრძელდა გამოწერა +${extraDays} დღით (${affectedUsers.length} მომხმარებელი): ${userNames}`,
        },
      });

      showNotice(` ${selectedUserIds.size} მომხმარებელს გაუგრძელდა ტარიფი +${extraDays} დღით!`);
      setSelectedUserIds(new Set());
      loadAdminData();
    } catch (err: any) {
      showNotice(` შეცდომა: ${err.message}`);
    } finally {
      setBulkUserLoading(false);
    }
  };

  // ──────────────────────────────────────────────
  // Affiliate Cross-Selling & Live Scraper State
  // ──────────────────────────────────────────────
  const [affiliateUrl, setAffiliateUrl] = React.useState("");
  const [affiliatePartner, setAffiliatePartner] = React.useState("");
  const [affiliateCommission, setAffiliateCommission] = React.useState("5");
  const [scrapingAffiliate, setScrapingAffiliate] = React.useState(false);
  const [scrapedPreview, setScrapedPreview] = React.useState<any>(null);
  const [affiliateProducts, setAffiliateProducts] = React.useState<any[]>([]);
  const [loadingAffiliates, setLoadingAffiliates] = React.useState(false);

  const loadAffiliates = React.useCallback(async () => {
    setLoadingAffiliates(true);
    try {
      const { data, error } = await supabase
        .from("affiliate_products")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        setAffiliateProducts(data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingAffiliates(false);
    }
  }, [supabase]);

  const handleScrapeAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!affiliateUrl.trim()) {
      showNotice(" შეიყვანეთ პროდუქტის URL");
      return;
    }
    setScrapingAffiliate(true);
    setScrapedPreview(null);
    try {
      const res = await fetch("/api/affiliate/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: affiliateUrl.trim(),
          partnerName: affiliatePartner.trim() || undefined,
          commissionPct: parseFloat(affiliateCommission || "0"),
          autoSave: false,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "სკრეიპინგი ვერ შესრულდა");
      setScrapedPreview(json.data);
      showNotice(" პროდუქტის მონაცემები წარმატებით ამოღებულია!");
    } catch (err: any) {
      showNotice(` შეცდომა: ${err.message}`);
    } finally {
      setScrapingAffiliate(false);
    }
  };

  const handleSaveAffiliate = async () => {
    if (!scrapedPreview) return;
    try {
      const { data, error } = await supabase.from("affiliate_products").insert({
        partner_name: scrapedPreview.partnerName,
        product_name: scrapedPreview.productName,
        description: scrapedPreview.description,
        image_url: scrapedPreview.imageUrl,
        product_url: scrapedPreview.productUrl,
        price: scrapedPreview.price,
        currency: scrapedPreview.currency || "GEL",
        commission_pct: scrapedPreview.commissionPct || 0,
        matching_tags: scrapedPreview.matchingTags || [],
        is_active: true,
      }).select().single();

      if (error) throw error;
      showNotice(` პარტნიორი პროდუქტი "${scrapedPreview.productName}" შენახულია!`);
      setScrapedPreview(null);
      setAffiliateUrl("");
      loadAffiliates();
    } catch (err: any) {
      showNotice(` შენახვის შეცდომა: ${err.message}`);
    }
  };

  const handleDeleteAffiliate = async (id: string, name: string) => {
    if (!confirm(`წაიშალოს პარტნიორი პროდუქტი: "${name}"?`)) return;
    setAffiliateProducts((prev) => prev.filter((p) => p.id !== id));
    await supabase.from("affiliate_products").delete().eq("id", id);
    showNotice(`️ პარტნიორი პროდუქტი "${name}" წაიშალა`);
  };

  const handleToggleAffiliateActive = async (id: string, currentActive: boolean) => {
    const next = !currentActive;
    setAffiliateProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: next } : p))
    );
    await supabase.from("affiliate_products").update({ is_active: next }).eq("id", id);
    showNotice(next ? " პროდუქტი გააქტიურდა" : " პროდუქტი დაპაუზდა");
  };

  // ──────────────────────────────────────────────
  // Audit Logs State, Date Filters & Sorting
  // ──────────────────────────────────────────────
  const [auditLogs, setAuditLogs] = React.useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = React.useState(false);
  const [auditCategoryFilter, setAuditCategoryFilter] = React.useState<string>("ALL");
  const [auditSearchQuery, setAuditSearchQuery] = React.useState<string>("");
  const [auditDateFilter, setAuditDateFilter] = React.useState<"all" | "today" | "7days" | "30days" | "custom">("all");
  const [auditDateFrom, setAuditDateFrom] = React.useState<string>("");
  const [auditDateTo, setAuditDateTo] = React.useState<string>("");
  const [auditSortField, setAuditSortField] = React.useState<"date" | "action" | "category" | "actor">("date");
  const [auditSortOrder, setAuditSortOrder] = React.useState<"asc" | "desc">("desc");
  const [selectedAuditLogForDiff, setSelectedAuditLogForDiff] = React.useState<any | null>(null);

  const toggleAuditSort = (field: "date" | "action" | "category" | "actor") => {
    if (auditSortField === field) {
      setAuditSortOrder(auditSortOrder === "asc" ? "desc" : "asc");
    } else {
      setAuditSortField(field);
      setAuditSortOrder("desc");
    }
  };

  const loadAuditLogs = React.useCallback(async () => {
    setLoadingAudit(true);
    try {
      // 1. Fetch from secure Server API route (uses admin client with full service permissions)
      const res = await fetch("/api/admin/audit?limit=300");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setAuditLogs(json.data);
          return;
        }
      }
      // 2. Direct fallback
      const { data, error } = await supabase
        .from("audit_logs")
        .select(`
          id,
          actor_id,
          action,
          target_type,
          target_id,
          old_data,
          new_data,
          created_at,
          actor:actor_id (
            id,
            full_name,
            avatar_url,
            role
          )
        `)
        .order("created_at", { ascending: false })
        .limit(200);
      if (!error && data) {
        setAuditLogs(data);
      }
    } catch (e) {
      console.warn("Audit logs fetch notice:", e);
    } finally {
      setLoadingAudit(false);
    }
  }, [supabase]);

  // Live Auto-Refresh Listener when any action adds an audit log
  React.useEffect(() => {
    const handleAuditAdded = () => {
      loadAuditLogs();
    };
    window.addEventListener("plantsale_audit_log_added", handleAuditAdded);
    return () => window.removeEventListener("plantsale_audit_log_added", handleAuditAdded);
  }, [loadAuditLogs]);

  const filteredAuditLogs = React.useMemo(() => {
    const list = auditLogs.filter((log) => {
      // 1. Category Filter
      if (auditCategoryFilter !== "ALL") {
        if ((log.target_type || "").toUpperCase() !== auditCategoryFilter.toUpperCase()) {
          return false;
        }
      }

      // 2. Date Range Filter
      if (log.created_at) {
        const logTime = new Date(log.created_at).getTime();
        const now = new Date();

        if (auditDateFilter === "today") {
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          if (logTime < startOfToday) return false;
        } else if (auditDateFilter === "7days") {
          const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
          if (logTime < sevenDaysAgo) return false;
        } else if (auditDateFilter === "30days") {
          const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
          if (logTime < thirtyDaysAgo) return false;
        } else if (auditDateFilter === "custom") {
          if (auditDateFrom) {
            const fromTime = new Date(auditDateFrom).setHours(0, 0, 0, 0);
            if (logTime < fromTime) return false;
          }
          if (auditDateTo) {
            const toTime = new Date(auditDateTo).setHours(23, 59, 59, 999);
            if (logTime > toTime) return false;
          }
        }
      }

      // 3. Search Query
      if (auditSearchQuery.trim()) {
        const q = auditSearchQuery.toLowerCase();
        const matchAction = (log.action || "").toLowerCase().includes(q);
        const matchTarget = (log.target_type || "").toLowerCase().includes(q);
        const matchActor = (log.actor?.full_name || log.actor_id || "").toLowerCase().includes(q);
        const matchDetails = (JSON.stringify(log.new_data || {}) + JSON.stringify(log.old_data || {})).toLowerCase().includes(q);
        if (!matchAction && !matchTarget && !matchActor && !matchDetails) return false;
      }
      return true;
    });

    // 4. Clickable Column Header Sorting
    return [...list].sort((a, b) => {
      let comparison = 0;
      switch (auditSortField) {
        case "action":
          comparison = (a.action || "").localeCompare(b.action || "");
          break;
        case "category":
          comparison = (a.target_type || "").localeCompare(b.target_type || "");
          break;
        case "actor":
          const nameA = a.actor?.full_name || a.actor_id || "სისტემა";
          const nameB = b.actor?.full_name || b.actor_id || "სისტემა";
          comparison = nameA.localeCompare(nameB);
          break;
        case "date":
        default:
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          comparison = dateA - dateB;
          break;
      }
      return auditSortOrder === "asc" ? comparison : -comparison;
    });
  }, [auditLogs, auditCategoryFilter, auditSearchQuery, auditDateFilter, auditDateFrom, auditDateTo, auditSortField, auditSortOrder]);

  // ──────────────────────────────────────────────
  // Feedback & Contact Messages State & Handlers
  // ──────────────────────────────────────────────
  const [feedbackList, setFeedbackList] = React.useState<any[]>([]);
  const [loadingFeedback, setLoadingFeedback] = React.useState(false);
  const [feedbackStatusFilter, setFeedbackStatusFilter] = React.useState<string>("ALL");
  const [feedbackTypeFilter, setFeedbackTypeFilter] = React.useState<string>("ALL");
  const [feedbackSearchQuery, setFeedbackSearchQuery] = React.useState<string>("");
  const [selectedFeedbackModal, setSelectedFeedbackModal] = React.useState<any | null>(null);
  const [feedbackAdminNotesInput, setFeedbackAdminNotesInput] = React.useState<string>("");

  const loadFeedback = React.useCallback(async () => {
    setLoadingFeedback(true);
    try {
      const res = await fetch("/api/admin/feedback");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setFeedbackList(json.data);
        }
      }
    } catch (e) {
      console.warn("Feedback load error:", e);
    } finally {
      setLoadingFeedback(false);
    }
  }, []);

  const updateFeedbackStatus = async (id: string, newStatus: string, notes?: string) => {
    setFeedbackList((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: newStatus,
              admin_notes: notes !== undefined ? notes : item.admin_notes,
            }
          : item
      )
    );
    if (selectedFeedbackModal?.id === id) {
      setSelectedFeedbackModal((prev: any) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              admin_notes: notes !== undefined ? notes : prev.admin_notes,
            }
          : null
      );
    }
    try {
      await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus, adminNotes: notes }),
      });
      logAuditEvent({
        action: "FEEDBACK_STATUS_CHANGE",
        targetType: "FEEDBACK",
        targetId: id,
        newData: { status: newStatus, adminNotes: notes, changeSummary: `ფიდბექის სტატუსი: ${newStatus}` },
      });
      showNotice(` შეტყობინების სტატუსი განახლდა: ${newStatus}`);
    } catch (err: any) {
      showNotice(` შეცდომა: ${err.message}`);
    }
  };

  const deleteFeedback = async (id: string, senderName: string) => {
    if (!confirm(`ნამდვილად გსურთ შეტყობინების წაშლა (${senderName})?`)) return;
    setFeedbackList((prev) => prev.filter((item) => item.id !== id));
    if (selectedFeedbackModal?.id === id) setSelectedFeedbackModal(null);
    try {
      await fetch(`/api/admin/feedback?id=${id}`, { method: "DELETE" });
      logAuditEvent({
        action: "FEEDBACK_STATUS_CHANGE",
        targetType: "FEEDBACK",
        targetId: id,
        oldData: { senderName },
        newData: { changeSummary: `ფიდბექი წაიშალა (${senderName})` },
      });
      showNotice(`️ შეტყობინება წაიშალა`);
    } catch (err: any) {
      showNotice(` შეცდომა წაშლისას: ${err.message}`);
    }
  };

  const unreadFeedbackCount = React.useMemo(() => {
    return feedbackList.filter((f) => f.status === "NEW").length;
  }, [feedbackList]);

  const filteredFeedbackList = React.useMemo(() => {
    return feedbackList.filter((item) => {
      if (feedbackStatusFilter !== "ALL" && item.status !== feedbackStatusFilter) return false;
      if (feedbackTypeFilter !== "ALL" && item.type !== feedbackTypeFilter) return false;
      if (feedbackSearchQuery.trim()) {
        const q = feedbackSearchQuery.toLowerCase().trim();
        const matchName = (item.name || "").toLowerCase().includes(q);
        const matchEmail = (item.email || "").toLowerCase().includes(q);
        const matchPhone = (item.phone || "").toLowerCase().includes(q);
        const matchSubject = (item.subject || "").toLowerCase().includes(q);
        const matchMessage = (item.message || "").toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchSubject && !matchMessage) return false;
      }
      return true;
    });
  }, [feedbackList, feedbackStatusFilter, feedbackTypeFilter, feedbackSearchQuery]);

  React.useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  React.useEffect(() => {
    if (activeTab === "affiliate") loadAffiliates();
    if (activeTab === "audit") loadAuditLogs();
    if (activeTab === "feedback") loadFeedback();
  }, [activeTab, loadAffiliates, loadAuditLogs, loadFeedback]);

  // CSV Export helper
  const handleExport = (type: "listings" | "users" | "audit" | "feedback") => {
    if (type === "feedback") {
      // Direct CSV generation for feedback
      const headers = ["ID,Name,Email,Phone,Type,Subject,Message,Status,Created At"];
      const rows = feedbackList.map((f) =>
        `"${f.id}","${(f.name || "").replace(/"/g, '""')}","${f.email || ""}","${f.phone || ""}","${f.type || ""}","${(f.subject || "").replace(/"/g, '""')}","${(f.message || "").replace(/"/g, '""')}","${f.status || ""}","${f.created_at || ""}"`
      );
      const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `plantsale_feedback_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      showNotice(" ფიდბექის CSV ექსპორტი ჩამოიტვირთა!");
      return;
    }
    window.open(`/api/admin/export?type=${type}`, "_blank");
    showNotice(` ${type} ექსპორტის ფაილის გადმოწერა დაიწყო...`);
  };

  // ──────────────────────────────────────────────
  // Sorting Handler
  // ──────────────────────────────────────────────
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle order
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // ──────────────────────────────────────────────
  // Multi-Filter & Search Computation
  // ──────────────────────────────────────────────
  const filteredListings = React.useMemo(() => {
    return listings.filter((item) => {
      // 1. Text Search (title, city, seller, address)
      if (listingSearch.trim()) {
        const q = listingSearch.toLowerCase();
        const matchTitle = (item.title || "").toLowerCase().includes(q);
        const matchCity = (item.city || "").toLowerCase().includes(q);
        const matchAddress = (item.address || "").toLowerCase().includes(q);
        const matchSeller = (item.seller?.fullName || "").toLowerCase().includes(q);
        if (!matchTitle && !matchCity && !matchAddress && !matchSeller) return false;
      }

      // 2. Status Filter
      if (statusFilter !== "all") {
        if ((item.status || "ACTIVE") !== statusFilter) return false;
      }

      // 3. Item Type Filter
      if (typeFilter !== "all") {
        if (item.itemType !== typeFilter) return false;
      }

      // 4. Transaction Type Filter
      if (transactionFilter !== "all") {
        if (item.transactionType !== transactionFilter) return false;
      }

      // 5. Searchable Seller Filter
      if (selectedSeller) {
        if (item.seller?.id !== selectedSeller.id && item.seller?.fullName !== selectedSeller.name) return false;
      }

      // 6. Date Filter
      if (dateFilter !== "all") {
        const itemTime = new Date(item.rawCreatedAt || item.createdAt || "2026-08-01").getTime();
        const now = Date.now();

        if (dateFilter === "1day") {
          const oneDayAgo = now - 24 * 60 * 60 * 1000;
          if (itemTime < oneDayAgo) return false;
        } else if (dateFilter === "1week") {
          const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
          if (itemTime < oneWeekAgo) return false;
        } else if (dateFilter === "1month") {
          const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
          if (itemTime < oneMonthAgo) return false;
        } else if (dateFilter === "custom") {
          if (customDateFrom) {
            const fromTime = new Date(customDateFrom).getTime();
            if (itemTime < fromTime) return false;
          }
          if (customDateTo) {
            const toTime = new Date(customDateTo).getTime() + 24 * 60 * 60 * 1000;
            if (itemTime > toTime) return false;
          }
        }
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "title":
          comparison = (a.title || "").localeCompare(b.title || "", "ka");
          break;
        case "itemType":
          comparison = (a.itemType || "").localeCompare(b.itemType || "");
          break;
        case "price":
          comparison = (Number(a.price) || 0) - (Number(b.price) || 0);
          break;
        case "seller":
          comparison = (a.seller?.fullName || "").localeCompare(b.seller?.fullName || "", "ka");
          break;
        case "status":
          comparison = (a.status || "ACTIVE").localeCompare(b.status || "ACTIVE");
          break;
        case "date":
        default:
          const dateA = new Date(a.rawCreatedAt || a.createdAt || "2026-08-01").getTime();
          const dateB = new Date(b.rawCreatedAt || b.createdAt || "2026-08-01").getTime();
          comparison = dateA - dateB;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [
    listings,
    listingSearch,
    statusFilter,
    typeFilter,
    transactionFilter,
    selectedSeller,
    dateFilter,
    customDateFrom,
    customDateTo,
    sortField,
    sortOrder,
  ]);

  // Unique Sellers for searchable combobox
  const uniqueSellers = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; email?: string }>();
    
    // Add sellers from listings
    listings.forEach((l) => {
      if (l.seller && l.seller.id && !map.has(l.seller.id)) {
        map.set(l.seller.id, {
          id: l.seller.id,
          name: l.seller.fullName || "უცნობი",
          email: l.seller.customSlug || "",
        });
      }
    });

    // Add registered users
    users.forEach((u) => {
      if (u.id && !map.has(u.id)) {
        map.set(u.id, {
          id: u.id,
          name: u.fullName || u.email,
          email: u.email,
        });
      }
    });

    return Array.from(map.values());
  }, [listings, users]);

  // Searched sellers matching query
  const searchedSellers = React.useMemo(() => {
    if (!sellerQuery.trim()) return uniqueSellers;
    const q = sellerQuery.toLowerCase();
    return uniqueSellers.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.email && s.email.toLowerCase().includes(q))
    );
  }, [uniqueSellers, sellerQuery]);

  // Shops & Verified Counts
  const shopsWithSlugCount = React.useMemo(() => users.filter((u) => u.customSlug && u.customSlug.trim()).length, [users]);
  const verifiedShopsCount = React.useMemo(() => users.filter((u) => u.isVerified).length, [users]);

  // Comprehensive Real Analytics Calculations
  const analyticsMetrics = React.useMemo(() => {
    const totalViews = listings.reduce((sum, l) => sum + (Number(l.viewsCount) || Number(l.views) || 0), 0);
    const totalPhoneClicks = listings.reduce((sum, l) => sum + (Number(l.phoneClicksCount) || 0), 0);
    const activeListings = listings.filter((l) => (l.status || "ACTIVE") === "ACTIVE");
    const pricedListings = activeListings.filter((l) => l.price && Number(l.price) > 0);
    const avgPrice = pricedListings.length 
      ? Math.round(pricedListings.reduce((sum, l) => sum + Number(l.price), 0) / pricedListings.length) 
      : 0;

    // City breakdown
    const cityMap: Record<string, number> = {};
    listings.forEach((l) => {
      const c = l.city || "თბილისი";
      cityMap[c] = (cityMap[c] || 0) + 1;
    });
    const topCities = Object.entries(cityMap)
      .map(([name, count]) => ({ name, count, pct: Math.round((count / (listings.length || 1)) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Category breakdown
    const catMap: Record<string, number> = {};
    listings.forEach((l) => {
      const cat = l.plantCategory || l.category || "სხვა";
      catMap[cat] = (catMap[cat] || 0) + 1;
    });
    const topCategories = Object.entries(catMap)
      .map(([name, count]) => ({ name, count, pct: Math.round((count / (listings.length || 1)) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Transactions breakdown
    const saleCount = listings.filter((l) => l.transactionType === "FIXED" || l.transactionType === "NEGOTIABLE").length;
    const tradeCount = listings.filter((l) => l.transactionType === "TRADE").length;
    const giftCount = listings.filter((l) => l.transactionType === "GIFT" || (l.transactionType !== "TRADE" && l.price === 0)).length;

    // Tiers
    const freeUsers = users.filter((u) => !u.tier || u.tier === "FREE").length;
    const tier1Users = users.filter((u) => u.tier === "TIER_1").length;
    const tier2Users = users.filter((u) => u.tier === "TIER_2" || u.tier === "PRO").length;
    const tier3Users = users.filter((u) => u.tier === "TIER_3" || u.tier === "BUSINESS").length;

    return {
      totalViews,
      totalPhoneClicks,
      activeCount: activeListings.length,
      avgPrice,
      topCities,
      topCategories,
      transactions: { sale: saleCount, trade: tradeCount, gift: giftCount },
      tiers: { free: freeUsers, tier1: tier1Users, tier2: tier2Users, tier3: tier3Users },
    };
  }, [listings, users]);

  // If not admin/moderator
  if (isAdmin === false && !canAccessAdmin(currentUserRole, currentUser?.email)) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8 space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-foreground">წვდომა შეზღუდულია</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            ეს გვერდი განკუთვნილია მხოლოდ პლატფორმის ადმინისტრატორებისა და მოდერატორებისთვის.
          </p>
          <Link href="/auth/login" className="block pt-2">
            <Button className="rounded-xl text-xs font-bold w-full bg-primary text-white">
              ადმინისტრატორით შესვლა
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">


      {/* Modern Admin Header & Sleek Segmented Navigation */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-card via-card to-emerald-500/[0.04] border border-border/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
                  ადმინ პანელი
                </h1>
                {(() => {
                  const config = ROLES_CONFIG[currentUserRole as UserRole] || ROLES_CONFIG.SUPER_ADMIN;
                  return (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black border shadow-2xs whitespace-nowrap ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}>
                      <span>{config.badgeEmoji}</span>
                      <span>{currentUserRole === "SUPER_ADMIN" ? "SUPER ADMIN" : config.nameKa.toUpperCase()}</span>
                    </span>
                  );
                })()}
              </div>
              <p className="text-[11px] text-muted-foreground">
                პლატფორმის კონტროლი, მოდერაცია და სტატისტიკა
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto pt-1 sm:pt-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              სისტემა აქტიურია
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => { loadAdminData(); showNotice(" მონაცემები გადამოწმდა და განახლდა!"); }}
              className="h-8 rounded-xl px-2.5 text-xs font-bold gap-1 border-border/80 hover:bg-surface-container cursor-pointer"
              title="მონაცემების განახლება"
            >
              <RefreshCw className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">განახლება</span>
            </Button>
          </div>
        </div>

        {/* Sleek Horizontal Scrollable Tab Bar (Mobile-first, No-Wrap Clutter) */}
        <div className="relative">
          <div className="flex items-center gap-1.5 p-1.5 bg-surface-container/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-border/70 overflow-x-auto no-scrollbar scroll-smooth">
            {[
              { id: "overview", label: "მიმოხილვა", icon: LayoutDashboard, visible: true },
              { id: "listings", label: "განცხადებები", icon: Layers, count: listings.length, visible: canModerate(currentUserRole, currentUser?.email) },
              { id: "shops", label: "შოპები & URL", icon: Store, count: shopsWithSlugCount, visible: canManageUsers(currentUserRole, currentUser?.email) },
              { id: "users", label: "მომხმარებლები", icon: Users, count: users.length, visible: canManageUsers(currentUserRole, currentUser?.email) },
              { 
                id: "feedback", 
                label: "ფიდბექი & მესიჯები", 
                icon: MessageSquare,
                count: unreadFeedbackCount > 0 ? `${unreadFeedbackCount} ახალი` : feedbackList.length,
                isHighlight: unreadFeedbackCount > 0,
                visible: true 
              },
              { id: "plans", label: "ტარიფები", icon: CreditCard, count: plans.length, visible: canManagePlans(currentUserRole, currentUser?.email) },
              { id: "analytics", label: "სტატისტიკა", icon: TrendingUp, visible: canManageUsers(currentUserRole, currentUser?.email) },
              { id: "audit", label: "აუდიტი", icon: FileText, count: auditLogs.length, visible: canManageUsers(currentUserRole, currentUser?.email) },
              { id: "affiliate", label: "Affiliate", icon: Sparkles, count: affiliateProducts.length, visible: canManageUsers(currentUserRole, currentUser?.email) },
            ]
              .filter((tab) => tab.visible)
              .map((tab) => {
                const isActive = activeTab === tab.id;
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer flex items-center gap-1.5 shrink-0 select-none ${
                      isActive
                        ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.01]"
                        : "text-muted-foreground hover:text-foreground hover:bg-card/80"
                    }`}
                  >
                    <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : "text-muted-foreground"}`} />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                        isActive 
                          ? "bg-white/20 text-white" 
                          : tab.isHighlight
                          ? "bg-amber-500 text-white animate-pulse"
                          : "bg-secondary-container text-foreground"
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      </div>



      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: ADVANCED LISTINGS MODERATION & MULTI-FILTER                   */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "listings" && (
        <div className="rounded-[24px] border border-border/80 bg-card p-5 sm:p-7 shadow-ambient space-y-6">
          
          {/* Header & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-foreground">
                    განცხადებების მოდერაცია
                  </h2>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-primary/10 text-primary border border-primary/20">
                  {filteredListings.length} / {listings.length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                დაალაგეთ სვეტების მიხედვით, გაფილტრეთ თარიღით, სტატუსით და მომხმარებლით
              </p>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleExport("listings")}
                className="flex-1 sm:flex-none rounded-xl text-xs font-bold gap-1.5 border-border/80 hover:bg-surface-container cursor-pointer h-9 px-3"
                title="განცხადებების CSV ექსპორტი (Excel UTF-8)"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                CSV ექსპორტი
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { loadAdminData(); showNotice(" მონაცემები გადამოწმდა და განახლდა!"); }}
                className="flex-1 sm:flex-none rounded-xl text-xs font-bold gap-1.5 border-border/80 hover:bg-surface-container cursor-pointer h-9 px-3"
              >
                <RefreshCw className="w-3.5 h-3.5 text-primary" />
                ბაზის განახლება
              </Button>
            </div>
          </div>

          {/*  Search & Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-secondary-container/40 p-4 rounded-[20px] border border-border/60">
            
            {/* Text Search */}
            <div className="relative">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                ძებნა
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={listingSearch}
                  onChange={(e) => setListingSearch(e.target.value)}
                  placeholder="სათაური, ქალაქი, უზერი..."
                  className="w-full pl-9 pr-3 py-2 rounded-[12px] border border-border/80 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                სტატუსი
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full py-2 px-3 rounded-[12px] border border-border/80 text-xs bg-background font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">ყველა სტატუსი</option>
                <option value="ACTIVE"> აქტიური (საიტზე ჩანს)</option>
                <option value="HIDDEN"> დამალული (არ ჩანს)</option>
                <option value="REJECTED"> დაბლოკილი</option>
              </select>
            </div>

            {/*  Searchable Seller / User Combobox */}
            <div className="relative" ref={sellerDropdownRef}>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                გამყიდველი / უზერი
              </label>

              {selectedSeller ? (
                <div className="flex items-center justify-between gap-1.5 py-1.5 px-3 rounded-[12px] bg-primary/10 border border-primary/30 text-primary text-xs font-bold">
                  <span className="truncate flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary shrink-0" />
                    {selectedSeller.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSeller(null);
                      setSellerQuery("");
                    }}
                    className="p-0.5 hover:bg-primary/20 rounded-full text-primary cursor-pointer transition-colors"
                    title="გასუფთავება"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={sellerQuery}
                    onChange={(e) => {
                      setSellerQuery(e.target.value);
                      setSellerDropdownOpen(true);
                    }}
                    onFocus={() => setSellerDropdownOpen(true)}
                    placeholder="ჩაწერე უზერის სახელი..."
                    className="w-full pl-9 pr-7 py-2 rounded-[12px] border border-border/80 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                  />
                  {sellerQuery && (
                    <button
                      type="button"
                      onClick={() => setSellerQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Autocomplete Dropdown List */}
                  {sellerDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 max-h-60 overflow-y-auto rounded-[16px] border border-border/80 bg-card shadow-ambient-lg z-50 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSeller(null);
                          setSellerDropdownOpen(false);
                          setSellerQuery("");
                        }}
                        className="w-full text-left px-3 py-2 rounded-[10px] text-xs font-bold text-muted-foreground hover:bg-surface-container hover:text-foreground transition-colors cursor-pointer flex items-center justify-between"
                      >
                        <span>ყველა გამყიდველი ({listings.length})</span>
                        {!selectedSeller && <Check className="w-3.5 h-3.5 text-primary" />}
                      </button>

                      {searchedSellers.length === 0 ? (
                        <div className="px-3 py-3 text-center text-muted-foreground text-[11px]">
                          მომხმარებელი &quot;{sellerQuery}&quot; ვერ მოიძებნა
                        </div>
                      ) : (
                        searchedSellers.map((s) => {
                          const sellerListingsCount = listings.filter(
                            (l) => l.seller?.id === s.id || l.seller?.fullName === s.name
                          ).length;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                setSelectedSeller({ id: s.id, name: s.name });
                                setSellerDropdownOpen(false);
                                setSellerQuery("");
                              }}
                              className="w-full text-left px-3 py-2 rounded-[10px] text-xs font-semibold hover:bg-primary/10 text-foreground transition-colors cursor-pointer flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="h-6 w-6 rounded-full bg-secondary-container text-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                                  {s.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <span className="truncate font-bold text-xs block">{s.name}</span>
                                  {s.email && <span className="text-[10px] text-muted-foreground truncate block">{s.email}</span>}
                                </div>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-container text-primary font-bold shrink-0">
                                {sellerListingsCount} განცხადება
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Item Type & Transaction Filter */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                კატეგორია / გარიგება
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full py-2 px-2 rounded-[12px] border border-border/80 text-xs bg-background font-semibold focus:outline-none"
                >
                  <option value="all">ყველა ტიპი</option>
                  <option value="PLANT"> მცენარე</option>
                  <option value="INVENTORY"> ინვენტარი</option>
                </select>
                <select
                  value={transactionFilter}
                  onChange={(e) => setTransactionFilter(e.target.value)}
                  className="w-full py-2 px-2 rounded-[12px] border border-border/80 text-xs bg-background font-semibold focus:outline-none"
                >
                  <option value="all">გარიგება</option>
                  <option value="FIXED"> ფასი</option>
                  <option value="TRADE"> გაცვლა</option>
                  <option value="GIFT"> საჩუქარი</option>
                </select>
              </div>
            </div>
          </div>

          {/*  Date Filter Presets & Custom Range */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-[16px] border border-border/60">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 mr-1">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                თარიღი:
              </span>
              {[
                { id: "all", label: "ყველა დრო" },
                { id: "1day", label: "დღეს (1 დღე)" },
                { id: "1week", label: "ამ კვირაში (7 დღე)" },
                { id: "1month", label: "ამ თვეში (30 დღე)" },
                { id: "custom", label: "დიაპაზონი " },
              ].map((df) => (
                <button
                  key={df.id}
                  type="button"
                  onClick={() => setDateFilter(df.id as DateFilter)}
                  className={`px-3 py-1 rounded-[10px] text-xs font-bold transition-all cursor-pointer ${
                    dateFilter === df.id
                      ? "bg-primary text-white shadow-2xs"
                      : "bg-surface-container/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {df.label}
                </button>
              ))}
            </div>

            {/* Custom Range Inputs */}
            {dateFilter === "custom" && (
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="date"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  className="px-2.5 py-1 rounded-[10px] border border-border/80 text-xs bg-background"
                />
                <span className="text-xs text-muted-foreground">-დან</span>
                <input
                  type="date"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  className="px-2.5 py-1 rounded-[10px] border border-border/80 text-xs bg-background"
                />
                <span className="text-xs text-muted-foreground">-მდე</span>
              </div>
            )}
          </div>

          {/* ── Bulk Action Toolbar ── */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between gap-3 bg-primary/10 border border-primary/30 rounded-[16px] px-4 py-2.5 animate-in fade-in slide-in-from-top-1">
              <span className="text-xs font-bold text-primary">
                 {selectedIds.size} განცხადება მონიშნული
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={bulkLoading}
                  onClick={() => bulkAction("ACTIVE")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all cursor-pointer disabled:opacity-60"
                >
                  <Eye className="w-3.5 h-3.5" />
                  გამოჩენა
                </button>
                <button
                  type="button"
                  disabled={bulkLoading}
                  onClick={() => bulkAction("HIDDEN")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold transition-all cursor-pointer disabled:opacity-60"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  დამალვა
                </button>
                <button
                  type="button"
                  disabled={bulkLoading}
                  onClick={() => bulkAction("DELETE")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-destructive hover:bg-destructive/80 text-white text-[11px] font-bold transition-all cursor-pointer disabled:opacity-60"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  წაშლა
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="p-1.5 rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  title="მონიშვნის გასუფთავება"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/*  Mobile Listing Cards (< md screens) */}
          <div className="block md:hidden space-y-3">
            {filteredListings.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-xs font-semibold bg-secondary-container/20 rounded-2xl border border-dashed border-border/80">
                განცხადებები არჩეული ფილტრებით არ მოიძებნა.
              </div>
            ) : (
              filteredListings.map((item: any) => {
                const isHidden = item.status === "HIDDEN";
                const isRejected = item.status === "REJECTED";
                const isDeleted = item.status === "DELETED";
                const isSelected = selectedIds.has(item.id);
                const formattedDate = item.rawCreatedAt ? new Date(item.rawCreatedAt).toLocaleDateString("ka-GE") : "15 აგვ";

                return (
                  <div
                    key={`mob-${item.id}`}
                    className={`p-4 rounded-2xl border transition-all ${
                      isSelected 
                        ? "bg-primary/5 border-primary shadow-xs" 
                        : "bg-card border-border/80 shadow-xs"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(item.id)}
                        className="mt-1 w-4 h-4 rounded accent-primary cursor-pointer shrink-0"
                      />

                      {/* Thumbnail */}
                      <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-surface-container shrink-0 border border-border/60">
                        <img
                          src={item.images?.[0] || item.image || "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=200"}
                          alt="plant"
                          className="h-full w-full object-cover"
                        />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-1">
                          <Link
                            href={`/listings/${item.id}`}
                            className="font-bold text-foreground hover:text-primary text-xs line-clamp-1"
                            title={item.title}
                          >
                            {item.title}
                          </Link>
                          {/* Status Badge */}
                          {isHidden ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-black shrink-0">
                               დამალული
                            </span>
                          ) : isRejected ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-destructive/15 text-destructive text-[10px] font-black shrink-0">
                               დაბლოკილი
                            </span>
                          ) : isDeleted ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold shrink-0">
                              ️ წაშლილი
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-black shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                               აქტიური
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span> {item.city || "თბილისი"}</span>
                          <span>•</span>
                          <span className="font-semibold truncate">{item.seller?.fullName || "გამყიდველი"}</span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div>
                            {item.transactionType === "TRADE" ? (
                              <Badge variant="outline" className="text-[10px] font-bold border-indigo-500/40 text-indigo-600 bg-indigo-500/5">
                                 გაცვლა
                              </Badge>
                            ) : item.transactionType === "GIFT" || item.price === 0 ? (
                              <Badge variant="outline" className="text-[10px] font-black border-emerald-500/40 text-emerald-600 bg-emerald-500/5">
                                 საჩუქარი
                              </Badge>
                            ) : (
                              <span className="font-black text-foreground text-xs">
                                {formatPrice(item.price)}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">{formattedDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex items-center justify-end gap-1.5 pt-3 mt-3 border-t border-border/50">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateListingStatus(item.id, isHidden ? "ACTIVE" : "HIDDEN")}
                        className={`h-8 px-3 text-[11px] font-bold rounded-xl cursor-pointer ${
                          isHidden
                            ? "border-emerald-500 text-emerald-600 hover:bg-emerald-500/10"
                            : "border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                        }`}
                      >
                        {isHidden ? "გამოჩენა" : "დამალვა"}
                      </Button>

                      <Link href={`/dashboard/listings/${item.id}/edit`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2.5 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer text-[11px] font-bold gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>ჩასწორება</span>
                        </Button>
                      </Link>

                      <Link href={`/listings/${item.id}`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
                          title="ნახვა"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </Link>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteListing(item.id, item.title)}
                        className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        title="წაშლა"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/*  Desktop Data Table (>= md screens) */}
          <div className="hidden md:block overflow-x-auto rounded-[18px] border border-border/80">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/80 bg-secondary-container/60 text-muted-foreground uppercase text-[11px] font-bold select-none">
                <tr>
                  {/* Checkbox — Select All */}
                  <th className="py-3 px-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={filteredListings.length > 0 && selectedIds.size === filteredListings.length}
                      ref={(el) => { if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < filteredListings.length; }}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded accent-primary cursor-pointer"
                      title="ყველას მონიშვნა"
                    />
                  </th>
                  {/* Title Header */}
                  <th
                    onClick={() => handleSort("title")}
                    className="py-3 px-3.5 cursor-pointer hover:text-primary transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>განცხადება</span>
                      {sortField === "title" ? (
                        sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-primary" /> : <ArrowDown className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-40" />
                      )}
                    </div>
                  </th>

                  {/* Type Header */}
                  <th
                    onClick={() => handleSort("itemType")}
                    className="py-3 px-3 cursor-pointer hover:text-primary transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>ტიპი</span>
                      {sortField === "itemType" ? (
                        sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-primary" /> : <ArrowDown className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-40" />
                      )}
                    </div>
                  </th>

                  {/* Price Header */}
                  <th
                    onClick={() => handleSort("price")}
                    className="py-3 px-3 cursor-pointer hover:text-primary transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>ფასი</span>
                      {sortField === "price" ? (
                        sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-primary" /> : <ArrowDown className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-40" />
                      )}
                    </div>
                  </th>

                  {/* Seller Header */}
                  <th
                    onClick={() => handleSort("seller")}
                    className="py-3 px-3 cursor-pointer hover:text-primary transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>გამყიდველი</span>
                      {sortField === "seller" ? (
                        sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-primary" /> : <ArrowDown className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-40" />
                      )}
                    </div>
                  </th>

                  {/* Status Header */}
                  <th
                    onClick={() => handleSort("status")}
                    className="py-3 px-3 cursor-pointer hover:text-primary transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>სტატუსი</span>
                      {sortField === "status" ? (
                        sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-primary" /> : <ArrowDown className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-40" />
                      )}
                    </div>
                  </th>

                  {/* Date Header */}
                  <th
                    onClick={() => handleSort("date")}
                    className="py-3 px-3 cursor-pointer hover:text-primary transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>თარიღი</span>
                      {sortField === "date" ? (
                        sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-primary" /> : <ArrowDown className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-40" />
                      )}
                    </div>
                  </th>

                  {/* Actions Header */}
                  <th className="py-3 px-3.5 text-right">მოქმედება</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/40">
                {filteredListings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground text-xs font-semibold">
                      განცხადებები არჩეული ფილტრებით არ მოიძებნა.
                    </td>
                  </tr>
                ) : (
                  filteredListings.map((item: any) => {
                    const isHidden = item.status === "HIDDEN";
                    const isRejected = item.status === "REJECTED";
                    const isDeleted = item.status === "DELETED";
                    const isSelected = selectedIds.has(item.id);
                    const formattedDate = item.rawCreatedAt ? new Date(item.rawCreatedAt).toLocaleDateString("ka-GE") : "15 აგვ";

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-muted/30 transition-colors ${
                          isSelected ? "bg-primary/5 border-l-2 border-l-primary" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(item.id)}
                            className="w-4 h-4 rounded accent-primary cursor-pointer"
                          />
                        </td>
                        {/* Title & Image */}
                        <td className="py-3 px-3.5 max-w-[240px]">
                          <div className="flex items-center gap-2.5">
                            <div className="relative h-10 w-10 rounded-[10px] overflow-hidden bg-surface-container shrink-0 border border-border/60">
                              <img
                                src={item.images?.[0] || item.image || "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=200"}
                                alt="plant"
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/listings/${item.id}`}
                                className="font-bold text-foreground hover:text-primary truncate block text-xs"
                                title={item.title}
                              >
                                {item.title}
                              </Link>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                                 {item.city || "თბილისი"} {item.address ? `· ${item.address}` : ""}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Type & Plant Category */}
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-foreground">
                            {item.itemType === "PLANT" ? " მცენარე" : " ინვენტარი"}
                          </span>
                          <span className="text-[10px] text-muted-foreground block capitalize">
                            {item.plantCategory || "monstera"}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-3 px-3">
                          {item.transactionType === "TRADE" ? (
                            <Badge variant="outline" className="text-[10px] font-bold border-indigo-500/40 text-indigo-600 bg-indigo-500/5">
                               გაცვლა
                            </Badge>
                          ) : item.transactionType === "GIFT" || item.price === 0 ? (
                            <Badge variant="outline" className="text-[10px] font-black border-emerald-500/40 text-emerald-600 bg-emerald-500/5">
                               საჩუქარი
                            </Badge>
                          ) : (
                            <span className="font-black text-foreground text-xs">
                              {formatPrice(item.price)}
                            </span>
                          )}
                        </td>

                        {/* Seller */}
                        <td className="py-3 px-3">
                          <span className="font-bold text-foreground block text-xs truncate max-w-[130px]">
                            {item.seller?.fullName || "გამყიდველი"}
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            {item.seller?.tier || "FREE"}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-3">
                          {isHidden ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-black">
                               დამალული
                            </span>
                          ) : isRejected ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/15 text-destructive text-[10px] font-black">
                               დაბლოკილი
                            </span>
                          ) : isDeleted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
                              ️ წაშლილი
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                               აქტიური
                            </span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-3 px-3 text-[11px] text-muted-foreground whitespace-nowrap">
                          {formattedDate}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle Show / Hide */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateListingStatus(
                                  item.id,
                                  isHidden ? "ACTIVE" : "HIDDEN"
                                )
                              }
                              className={`h-7 px-2 text-[10px] font-bold rounded-[8px] cursor-pointer ${
                                isHidden
                                  ? "border-emerald-500 text-emerald-600 hover:bg-emerald-500/10"
                                  : "border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                              }`}
                              title={isHidden ? "საიტზე გამოჩენა" : "საიტიდან დამალვა"}
                            >
                              {isHidden ? "გამოჩენა" : "დამალვა"}
                            </Button>

                            {/* Edit Listing Link */}
                            <Link href={`/dashboard/listings/${item.id}/edit`}>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 rounded-[8px] text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"
                                title="განცხადების რედაქტირება"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </Button>
                            </Link>

                            {/* View Listing Link */}
                            <Link href={`/listings/${item.id}`}>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 rounded-[8px] text-muted-foreground hover:text-foreground cursor-pointer"
                                title="განცხადების ნახვა"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                            </Link>

                            {/* Delete Listing */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteListing(item.id, item.title)}
                              className="h-7 w-7 p-0 rounded-[8px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                              title="სამუდამოდ წაშლა"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: USERS & BULK MODERATION                                      */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "users" && (
        <div className="rounded-[24px] border border-border/80 bg-card p-5 sm:p-7 shadow-ambient space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                <span>მომხმარებლების, შოპებისა და ტარიფების მართვა</span>
                <Badge className="bg-secondary-container text-primary text-xs font-bold border-none">
                  {users.length} მომხმარებელი
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                მართეთ ტარიფები, Custom URL-ები, განახორციელეთ ჯგუფური დაბლოკვა ან ვადის გაგრძელება
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleExport("users")}
                className="rounded-[12px] text-xs font-bold gap-1.5 border-border/80 hover:bg-surface-container cursor-pointer"
                title="მომხმარებლების CSV ექსპორტი"
              >
                <Download className="w-3.5 h-3.5 text-teal-600" />
                CSV ექსპორტი
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { loadAdminData(); showNotice(" მომხმარებლების სია განახლდა!"); }}
                className="rounded-[12px] text-xs font-bold gap-1.5 border-border/80 hover:bg-surface-container cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-primary" />
                განახლება
              </Button>
            </div>
          </div>

          {/* Bulk User Actions Toolbar */}
          {selectedUserIds.size > 0 && (
            <div className="flex items-center justify-between gap-3 bg-teal-500/10 border border-teal-500/30 rounded-[16px] px-4 py-2.5 animate-in fade-in">
              <span className="text-xs font-bold text-teal-800 dark:text-teal-300">
                 {selectedUserIds.size} მომხმარებელი მონიშნულია
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={bulkUserLoading}
                  onClick={() => bulkExtendUsers(30)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-[10px] bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold transition-all cursor-pointer disabled:opacity-60"
                  title="30 დღის დამატება"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  +30 დღე
                </button>
                <button
                  type="button"
                  disabled={bulkUserLoading}
                  onClick={bulkSuspendUsers}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-[10px] bg-destructive hover:bg-destructive/80 text-white text-[11px] font-bold transition-all cursor-pointer disabled:opacity-60"
                  title="დაბლოკვა / გაყინვა"
                >
                  <UserX className="w-3.5 h-3.5" />
                  დაბლოკვა
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUserIds(new Set())}
                  className="p-1 rounded-[8px] text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/*  Mobile Users Card List (< md screens) */}
          <div className="grid grid-cols-1 gap-3.5 block md:hidden">
            {users.map((user) => {
              const isSelected = selectedUserIds.has(user.id);
              const currentRole = user.role || (user.isAdmin ? "SUPER_ADMIN" : "USER");
              const config = ROLES_CONFIG[currentRole as UserRole] || ROLES_CONFIG.USER;

              return (
                <div
                  key={user.id}
                  className={`p-4 rounded-[20px] border bg-card shadow-2xs space-y-3.5 transition-all ${
                    isSelected ? "border-primary ring-1 ring-primary/20 bg-primary/[0.02]" : "border-border/80"
                  }`}
                >
                  {/* Top: Avatar, Name, Email, Checkbox */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOneUser(user.id)}
                        className="w-4 h-4 rounded accent-primary cursor-pointer shrink-0 mt-0.5"
                      />
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.fullName}
                          className="h-10 w-10 rounded-[12px] object-cover border border-border shrink-0 shadow-2xs"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-[12px] bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0 border border-primary/20 shadow-2xs">
                          {(user.fullName || "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-black text-foreground truncate">
                          {user.fullName || "მომხმარებელი"}
                        </h4>
                        <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full ${config.badgeBg} ${config.badgeText} ${config.badgeBorder} text-[10px] font-black border shadow-2xs shrink-0`}>
                      {config.badgeEmoji} {config.nameKa}
                    </span>
                  </div>

                  {/* Slug & Tier Strip */}
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-[12px] bg-surface-container/50 border border-border/50 text-xs flex-wrap">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10.5px] font-bold text-muted-foreground">Slug:</span>
                      {user.customSlug ? (
                        <Link href={`/shops/${user.customSlug}`} className="text-emerald-600 hover:underline font-mono text-[11px] font-bold truncate">
                          /{user.customSlug}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-[10px]">არ არის</span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const newSlug = window.prompt(`შეიყვანეთ ახალი Custom Slug "${user.fullName}":`, user.customSlug || "");
                          if (newSlug !== null) updateUserSlug(user.id, newSlug);
                        }}
                        className="p-0.5 text-muted-foreground hover:text-primary rounded cursor-pointer"
                        title="Slug-ის შეცვლა"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    </div>

                    <Badge variant="outline" className="text-[10px] font-black bg-card">
                      {user.tier}
                    </Badge>
                  </div>

                  {/* Role & Tier Selectors */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground block mb-0.5">როლის შეცვლა</label>
                      <select
                        value={currentRole}
                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                        className="w-full h-8.5 px-2 rounded-[10px] border border-border/80 bg-background text-foreground text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
                      >
                        <option value="USER"> USER</option>
                        <option value="PARTNER"> PARTNER</option>
                        <option value="SUPPORT"> SUPPORT</option>
                        <option value="MODERATOR">️ MODERATOR</option>
                        <option value="CONTENT_MANAGER"> CONTENT</option>
                        <option value="FINANCE_ADMIN" disabled={currentUserRole !== "SUPER_ADMIN" && currentUser?.email !== "tokolejo@gmail.com"}> FINANCE</option>
                        <option value="SUPER_ADMIN" disabled={currentUserRole !== "SUPER_ADMIN" && currentUser?.email !== "tokolejo@gmail.com"}> SUPER ADMIN</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground block mb-0.5">ტარიფის შეცვლა</label>
                      <select
                        value={user.tier}
                        onChange={(e) => updateUserTier(user.id, e.target.value)}
                        className="w-full h-8.5 px-2 rounded-[10px] border border-border/80 bg-background text-foreground text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
                      >
                        <option value="FREE">Free (5)</option>
                        <option value="TIER_1">Tier 1 (25)</option>
                        <option value="TIER_2">Tier 2 (100)</option>
                        <option value="TIER_3">Tier 3 (∞)</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/*  Desktop Users Data Table (>= md screens) */}
          <div className="hidden md:block overflow-x-auto rounded-[18px] border border-border/80">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/80 bg-secondary-container/60 text-muted-foreground uppercase text-[10px] font-bold select-none">
                <tr>
                  <th className="py-3 px-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={users.length > 0 && selectedUserIds.size === users.length}
                      ref={(el) => { if (el) el.indeterminate = selectedUserIds.size > 0 && selectedUserIds.size < users.length; }}
                      onChange={toggleSelectAllUsers}
                      className="w-4 h-4 rounded accent-primary cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3">მომხმარებელი</th>
                  <th className="py-3 px-3">ელ-ფოსტა</th>
                  <th className="py-3 px-3">Custom Slug</th>
                  <th className="py-3 px-3">როლი & უფლებები</th>
                  <th className="py-3 px-3">ტარიფი</th>
                  <th className="py-3 px-3">როლის მინიჭება</th>
                  <th className="py-3 px-3 text-right">ტარიფის შეცვლა</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {users.map((user) => {
                  const isSelected = selectedUserIds.has(user.id);
                  const currentRole = user.role || (user.isAdmin ? "SUPER_ADMIN" : "USER");

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        isSelected ? "bg-primary/5 border-l-2 border-l-primary" : ""
                      }`}
                    >
                      <td className="py-3 px-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOneUser(user.id)}
                          className="w-4 h-4 rounded accent-primary cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.fullName}
                              className="h-7 w-7 rounded-full object-cover border border-border"
                            />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                              {(user.fullName || "U").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-bold text-foreground truncate max-w-[140px]">
                            {user.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">{user.email}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          {user.customSlug ? (
                            <Link href={`/shops/${user.customSlug}`} className="text-emerald-600 hover:underline font-mono text-[11px] font-bold">
                              /{user.customSlug}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground text-[10px]">არ არის</span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const newSlug = window.prompt(`შეიყვანეთ ახალი Custom Slug მომხმარებლისთვის "${user.fullName}":`, user.customSlug || "");
                              if (newSlug !== null) {
                                updateUserSlug(user.id, newSlug);
                              }
                            }}
                            className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                            title="Custom Slug-ის შეცვლა"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      
                      {/* Role & Status Badge — High-Contrast & Legible */}
                      <td className="py-3 px-3">
                        {(() => {
                          const config = ROLES_CONFIG[currentRole as UserRole] || ROLES_CONFIG.USER;
                          return (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${config.badgeBg} ${config.badgeText} ${config.badgeBorder} text-[10px] font-black border shadow-2xs`}>
                              {config.badgeEmoji} {config.nameKa.toUpperCase()}
                            </span>
                          );
                        })()}
                      </td>

                      {/* Subscription Tier Badge */}
                      <td className="py-3 px-3">
                        <Badge variant="outline" className="text-[10px] font-bold bg-background">
                          {user.tier}
                        </Badge>
                      </td>

                      {/* Change Role Dropdown (All 7 Roles) */}
                      <td className="py-3 px-3">
                        <select
                          value={currentRole}
                          onChange={(e) => updateUserRole(user.id, e.target.value)}
                          className="py-1 px-2.5 rounded-[9px] border border-border/80 bg-background text-foreground text-[11px] font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer hover:border-primary/50 shadow-2xs transition-colors"
                        >
                          <option value="USER"> USER (მომხმარებელი)</option>
                          <option value="PARTNER"> PARTNER (B2B პარტნიორი)</option>
                          <option value="SUPPORT"> SUPPORT (მხარდაჭერა)</option>
                          <option value="MODERATOR">️ MODERATOR (მოდერატორი)</option>
                          <option value="CONTENT_MANAGER"> CONTENT MANAGER (კონტენტ მენეჯერი)</option>
                          <option 
                            value="FINANCE_ADMIN" 
                            disabled={currentUserRole !== "SUPER_ADMIN" && currentUser?.email !== "tokolejo@gmail.com"}
                          >
                             FINANCE ADMIN (ფინანსური ადმინი)
                          </option>
                          <option 
                            value="SUPER_ADMIN" 
                            disabled={currentUserRole !== "SUPER_ADMIN" && currentUser?.email !== "tokolejo@gmail.com"}
                          >
                             SUPER ADMIN (სუპერ ადმინი)
                          </option>
                        </select>
                      </td>

                      {/* Change Tier Dropdown */}
                      <td className="py-3 px-3 text-right">
                        <select
                          value={user.tier}
                          onChange={(e) => updateUserTier(user.id, e.target.value)}
                          className="py-1 px-2.5 rounded-[9px] border border-border/80 bg-background text-foreground text-[11px] font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer hover:border-primary/50 shadow-2xs transition-colors"
                        >
                          <option value="FREE">Free (5 განცხადება)</option>
                          <option value="TIER_1">Tier 1 - Collector (25 განცხადება)</option>
                          <option value="TIER_2">Tier 2 - Pro Shop (100 განცხადება)</option>
                          <option value="TIER_3">Tier 3 - Enterprise (უსაზღვრო)</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: FEEDBACK & INQUIRIES MANAGEMENT                                 */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
{activeTab === "feedback" && (
        <div className="rounded-[24px] border border-border/80 bg-card p-4 sm:p-7 shadow-ambient space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <span>შეტყობინებები & მომხმარებელთა ფიდბექი</span>
                </h2>
                {unreadFeedbackCount > 0 && (
                  <Badge className="bg-emerald-600 text-white text-xs font-black border-none animate-pulse">
                    {unreadFeedbackCount} ახალი შეტყობინება
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                მომხმარებლების მიერ საკონტაქტო ფორმიდან გამოგზავნილი კითხვები, იდეები, ხარვეზების რეპორტები და B2B შეთავაზებები
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleExport("feedback")}
                className="rounded-[12px] text-xs font-bold gap-1.5 border-border/80 hover:bg-surface-container cursor-pointer"
                title="CSV ექსპორტი"
              >
                <Download className="w-3.5 h-3.5 text-primary" />
                CSV ექსპორტი
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { loadFeedback(); showNotice(" შეტყობინებები განახლდა!"); }}
                className="rounded-[12px] text-xs font-bold gap-1.5 border-border/80 hover:bg-surface-container cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-primary ${loadingFeedback ? "animate-spin" : ""}`} />
                განახლება
              </Button>
            </div>
          </div>

          {/* Modern Filter Toolbar */}
          <div className="space-y-3 bg-secondary-container/30 p-3.5 sm:p-4.5 rounded-[22px] border border-border/60">
            {/* 1. Search Bar */}
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={feedbackSearchQuery}
                onChange={(e) => setFeedbackSearchQuery(e.target.value)}
                placeholder="ძიება სახელით, მეილით, ტელეფონით, ტექსტით..."
                className="w-full h-10 pl-9.5 pr-8 rounded-[14px] border border-border/80 text-xs sm:text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary font-medium transition-all shadow-2xs"
              />
              {feedbackSearchQuery && (
                <button
                  type="button"
                  onClick={() => setFeedbackSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 2. Category Filter Pill Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
              {[
                { id: "ALL", label: "ყველა კატეგორია" },
                { id: "general", label: " ზოგადი" },
                { id: "suggestion", label: " იდეა / წინადადება" },
                { id: "bug", label: "️ ხარვეზის რეპორტი" },
                { id: "partnership", label: " პარტნიორობა / B2B" },
              ].map((cat) => {
                const isSelected = feedbackTypeFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFeedbackTypeFilter(cat.id)}
                    className={`shrink-0 px-3 py-1.5 rounded-[12px] text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary text-white shadow-xs"
                        : "bg-card text-muted-foreground hover:text-foreground hover:bg-surface-container border border-border/60"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* 3. Status Filter Pill Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-border/40 pb-0.5 no-scrollbar">
              {[
                { id: "ALL", label: "ყველა სტატუსი" },
                { id: "NEW", label: " ახალი" },
                { id: "READ", label: " წაკითხული" },
                { id: "REPLIED", label: " პასუხგაცემული" },
              ].map((st) => {
                const isSelected = feedbackStatusFilter === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setFeedbackStatusFilter(st.id)}
                    className={`shrink-0 px-2.5 py-1.5 rounded-[10px] text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? "bg-foreground text-background shadow-xs"
                        : "bg-card text-muted-foreground hover:text-foreground hover:bg-surface-container border border-border/50"
                    }`}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback Messages List */}
          <div className="space-y-3.5">
            {loadingFeedback ? (
              <div className="py-16 text-center text-muted-foreground text-xs">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                შეტყობინებები იტვირთება...
              </div>
            ) : filteredFeedbackList.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-xs space-y-2 border border-dashed border-border/80 rounded-[22px] bg-card/50">
                <Inbox className="w-9 h-9 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm font-bold text-foreground">შეტყობინებები არ მოიძებნა</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {feedbackSearchQuery || feedbackStatusFilter !== "ALL" || feedbackTypeFilter !== "ALL"
                    ? "შერჩეული ფილტრებით შედეგი ცარიელია. სცადეთ ძიების გასუფთავება."
                    : "საკონტაქტო ფორმიდან ჯერჯერობით არცერთი შეტყობინება არ შემოსულა."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {filteredFeedbackList.map((item) => {
                  const dateObj = item.created_at ? new Date(item.created_at) : new Date();
                  const dateFormatted = dateObj.toLocaleDateString("ka-GE", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });
                  const timeFormatted = dateObj.toLocaleTimeString("ka-GE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  const isNew = item.status === "NEW";

                  const typeLabelMap: Record<string, { label: string; color: string }> = {
                    general: { label: " ზოგადი კითხვა", color: "bg-blue-500/10 text-blue-800 dark:text-blue-200 border-blue-500/20" },
                    suggestion: { label: " იდეა / წინადადება", color: "bg-purple-500/10 text-purple-800 dark:text-purple-200 border-purple-500/20" },
                    bug: { label: "️ ხარვეზის რეპორტი", color: "bg-rose-500/10 text-rose-800 dark:text-rose-200 border-rose-500/20" },
                    partnership: { label: " პარტნიორობა / B2B", color: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-emerald-500/20" },
                  };

                  const typeInfo = typeLabelMap[item.type] || { label: item.type || "შეტყობინება", color: "bg-secondary-container text-foreground border-border/60" };

                  return (
                    <div
                      key={item.id}
                      className={`p-4 sm:p-5 rounded-[22px] border bg-card transition-all duration-200 shadow-2xs hover:shadow-sm ${
                        isNew
                          ? "border-emerald-500/40 ring-1 ring-emerald-500/10"
                          : "border-border/80 hover:border-border"
                      }`}
                    >
                      {/* Top Row: Sender Info, Category, Timestamp */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar */}
                          <div className="relative h-10 w-10 rounded-[14px] bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 text-primary flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                            {(item.name || "U").charAt(0).toUpperCase()}
                            {isNew && (
                              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-card" />
                            )}
                          </div>

                          {/* Name & Type Badge */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-black text-foreground truncate">
                                {item.name}
                              </h4>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${typeInfo.color}`}>
                                {typeInfo.label}
                              </span>
                              {isNew && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-2xs">
                                  NEW
                                </span>
                              )}
                            </div>

                            {/* Contact Badges Strip */}
                            <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
                              <a
                                href={`mailto:${item.email}`}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[8px] bg-surface-container/70 hover:bg-surface-container text-foreground border border-border/60 transition-colors font-medium text-[11px]"
                                title="გაგზავნეთ მეილი"
                              >
                                <Mail className="w-3 h-3 text-primary" />
                                <span>{item.email}</span>
                              </a>
                              {item.phone && (
                                <a
                                  href={`tel:${item.phone}`}
                                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[8px] bg-surface-container/70 hover:bg-surface-container text-foreground border border-border/60 transition-colors font-medium text-[11px]"
                                  title="დარეკეთ"
                                >
                                  <Phone className="w-3 h-3 text-emerald-600" />
                                  <span>{item.phone}</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Timestamp */}
                        <div className="text-right text-[11px] text-muted-foreground self-start sm:self-center font-medium bg-surface-container/50 px-2.5 py-1 rounded-[8px] border border-border/40 shrink-0">
                          <span>{dateFormatted}</span> <span className="text-muted-foreground/60">•</span> <span>{timeFormatted}</span>
                        </div>
                      </div>

                      {/* Middle: Subject & Message Body */}
                      <div className="py-3.5 space-y-2">
                        {item.subject && (
                          <h5 className="text-xs sm:text-sm font-black text-foreground flex items-center gap-1.5">
                            <span className="text-primary font-bold">თემა:</span>
                            <span>{item.subject}</span>
                          </h5>
                        )}
                        <div className="rounded-[14px] bg-surface-container/40 border border-border/50 p-3.5">
                          <p className="text-xs sm:text-[13px] text-foreground/90 leading-relaxed whitespace-pre-wrap font-medium">
                            {item.message}
                          </p>
                        </div>
                      </div>

                      {/* Admin Notes if present */}
                      {item.admin_notes && (
                        <div className="mb-3 p-2.5 rounded-[12px] bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                          <span className="font-bold shrink-0"> შენიშვნა:</span>
                          <span className="font-medium">{item.admin_notes}</span>
                        </div>
                      )}

                      {/* Bottom: Action Toolbar (Status Select, Reply, Notes, Delete) */}
                      <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/40 flex-wrap">
                        {/* Status Switcher */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-muted-foreground hidden sm:inline">სტატუსი:</span>
                          <select
                            value={item.status || "NEW"}
                            onChange={(e) => updateFeedbackStatus(item.id, e.target.value)}
                            className="h-8.5 px-2.5 rounded-[10px] border border-border/80 bg-background text-foreground text-xs font-bold focus:outline-none focus:ring-1.5 focus:ring-primary cursor-pointer shadow-2xs"
                          >
                            <option value="NEW"> ახალი</option>
                            <option value="READ"> წაკითხული</option>
                            <option value="REPLIED"> პასუხგაცემული</option>
                          </select>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`mailto:${item.email}?subject=Re: ${encodeURIComponent(item.subject || "Plantio.ge")}&body=${encodeURIComponent(`\n\n--- თქვენი წერილი ---\n${item.message}`)}`}
                            className="h-8.5 px-3 rounded-[10px] bg-primary text-white hover:bg-primary-container text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                            title="მეილით პასუხის გაცემა"
                          >
                            <Reply className="w-3.5 h-3.5" />
                            <span>პასუხი</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFeedbackModal(item);
                              setFeedbackAdminNotesInput(item.admin_notes || "");
                            }}
                            className="h-8.5 px-2.5 rounded-[10px] bg-card hover:bg-surface-container border border-border/80 text-foreground text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                            title="სრული დეტალები & შენიშვნა"
                          >
                            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="hidden sm:inline">შენიშვნა</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteFeedback(item.id, item.name)}
                            className="h-8.5 w-8.5 rounded-[10px] hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-destructive/20"
                            title="შეტყობინების წაშლა"
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
        </div>
      )}

      {/* ── STICKY FLOATING BULK ACTION DOCK ───────────────────────────────── */}
      {((activeTab === "listings" && selectedIds.size > 0) || (activeTab === "users" && selectedUserIds.size > 0)) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground/95 text-background backdrop-blur-md py-2.5 px-4 sm:px-5 rounded-[22px] shadow-2xl flex items-center gap-2.5 sm:gap-4 animate-in slide-in-from-bottom-5 duration-200 border border-background/20 max-w-[95vw]">
          <div className="flex items-center gap-2 font-black text-xs sm:text-sm whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {activeTab === "listings" ? `${selectedIds.size} განცხადება` : `${selectedUserIds.size} მომხმარებელი`}
            </span>
          </div>

          <div className="h-4 w-px bg-background/20 hidden sm:block" />

          {/* Bulk Actions for Listings */}
          {activeTab === "listings" && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={bulkLoading}
                onClick={() => bulkAction("ACTIVE")}
                className="px-2.5 sm:px-3 py-1.5 rounded-[12px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                title="გამოჩენა საიტზე"
              >
                გამოჩენა
              </button>
              <button
                type="button"
                disabled={bulkLoading}
                onClick={() => bulkAction("HIDDEN")}
                className="px-2.5 sm:px-3 py-1.5 rounded-[12px] bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                title="დამალვა"
              >
                დამალვა
              </button>
              <button
                type="button"
                disabled={bulkLoading}
                onClick={() => bulkAction("DELETE")}
                className="px-2.5 sm:px-3 py-1.5 rounded-[12px] bg-destructive hover:bg-destructive/80 text-white font-bold text-[11px] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                title="წაშლა"
              >
                წაშლა
              </button>
            </div>
          )}

          {/* Bulk Actions for Users */}
          {activeTab === "users" && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={bulkUserLoading}
                onClick={() => bulkExtendUsers(30)}
                className="px-2.5 sm:px-3 py-1.5 rounded-[12px] bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                title="30 დღის დამატება"
              >
                +30 დღე
              </button>
              <button
                type="button"
                disabled={bulkUserLoading}
                onClick={bulkSuspendUsers}
                className="px-2.5 sm:px-3 py-1.5 rounded-[12px] bg-destructive hover:bg-destructive/80 text-white font-bold text-[11px] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                title="დაბლოკვა"
              >
                დაბლოკვა
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              if (activeTab === "listings") setSelectedIds(new Set());
              if (activeTab === "users") setSelectedUserIds(new Set());
            }}
            className="p-1 rounded-[8px] bg-background/10 hover:bg-background/20 text-background transition-colors cursor-pointer ml-1"
            title="მონიშვნის გაუქმება"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Feedback Details & Notes Modal */}
      {selectedFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border/80 rounded-[24px] max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-sm font-black text-foreground">
                    შეტყობინების დეტალები
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    გამომგზავნი: {selectedFeedbackModal.name} ({selectedFeedbackModal.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFeedbackModal(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 p-1 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-surface-container/40 p-3 rounded-[12px] border border-border/60">
                <div>
                  <span className="text-[10px] text-muted-foreground font-bold block">კატეგორია</span>
                  <span className="font-bold text-foreground capitalize">{selectedFeedbackModal.type}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-bold block">სტატუსი</span>
                  <span className="font-bold text-foreground">{selectedFeedbackModal.status}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-bold block">ტელეფონი</span>
                  <span className="font-bold text-foreground">{selectedFeedbackModal.phone || "არ არის"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-bold block">გაგზავნის დრო</span>
                  <span className="font-bold text-foreground">
                    {new Date(selectedFeedbackModal.created_at).toLocaleString("ka-GE")}
                  </span>
                </div>
              </div>

              {selectedFeedbackModal.subject && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">სათაური / თემა</span>
                  <p className="font-bold text-foreground p-2.5 rounded-[10px] bg-secondary-container/30 border border-border/50">
                    {selectedFeedbackModal.subject}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">შეტყობინების ტექსტი</span>
                <p className="text-foreground p-3 rounded-[12px] bg-secondary-container/30 border border-border/50 leading-relaxed whitespace-pre-wrap">
                  {selectedFeedbackModal.message}
                </p>
              </div>

              {/* Admin Internal Notes Input */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-bold text-foreground uppercase flex items-center gap-1">
                  <span> შიდა ადმინ ჩანაწერი</span>
                  <span className="text-muted-foreground font-normal">(მხოლოდ ადმინებისთვის)</span>
                </span>
                <textarea
                  rows={3}
                  value={feedbackAdminNotesInput}
                  onChange={(e) => setFeedbackAdminNotesInput(e.target.value)}
                  placeholder="მაგ: დავუკავშირდით ტელეფონით, შევთავაზეთ Pro Shop პაკეტი..."
                  className="w-full p-2.5 rounded-[12px] border border-border/80 bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/60">
              <a
                href={`mailto:${selectedFeedbackModal.email}?subject=Re: ${encodeURIComponent(selectedFeedbackModal.subject || "Plantio.ge")}&body=${encodeURIComponent(`\n\n--- თქვენი წერილი ---\n${selectedFeedbackModal.message}`)}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
              >
                <Reply className="w-3.5 h-3.5" />
                <span>მეილით პასუხი</span>
              </a>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFeedbackModal(null)}
                  className="rounded-[10px] text-xs"
                >
                  დახურვა
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    updateFeedbackStatus(selectedFeedbackModal.id, selectedFeedbackModal.status, feedbackAdminNotesInput);
                    setSelectedFeedbackModal(null);
                  }}
                  className="rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  შენახვა
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: AFFILIATE CROSS-SELLING & MULTI-STORE STUDIO                   */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "affiliate" && (
        <AffiliateStudio showNotice={showNotice} />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 5: SYSTEM AUDIT LOGS & DIFF VIEWER                                */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-muted-foreground">სისტემური აუდიტი & დეტალური ლოგირება</span>
            </div>
            <Link
              href="/admin/audit"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline group"
            >
              <span>სრულ გვერდზე გახსნა</span>
              <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <AuditStudio showNotice={showNotice} />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: SHOPS & CUSTOM URL STUDIO                                        */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "shops" && (
        <ShopManagementStudio
          users={users}
          listings={listings}
          currentUserId={currentUser?.id}
          onRefreshData={loadAdminData}
          showNotice={showNotice}
        />
      )}



      {/* Tab 1: Overview Dashboard */}
      {activeTab === "overview" && (
        <div className="space-y-4 sm:space-y-5">
          {/* KPI Metrics Summary Grid - Compact & Responsive */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            {/* KPI 1: Listings */}
            <div 
              onClick={() => setActiveTab("listings")}
              className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-card via-card to-emerald-500/[0.05] border border-border/80 shadow-2xs hover:border-emerald-500/40 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  განცხადებები
                </span>
                <div className="h-7 w-7 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Layers className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black text-foreground">{listings.length}</p>
              <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-bold flex-wrap">
                <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-1.5 py-0.5 rounded-md">
                  {listings.filter((l) => (l.status || "ACTIVE") === "ACTIVE").length} აქტიური
                </span>
                <span className="text-muted-foreground">
                  {listings.filter((l) => l.status === "HIDDEN").length} დამალული
                </span>
              </div>
            </div>

            {/* KPI 2: Custom URL Shops */}
            <div 
              onClick={() => setActiveTab("shops")}
              className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-card via-card to-indigo-500/[0.05] border border-border/80 shadow-2xs hover:border-indigo-500/40 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Custom URL შოპები
                </span>
                <div className="h-7 w-7 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Store className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black text-foreground">{shopsWithSlugCount}</p>
              <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                <span className="bg-indigo-500/10 px-1.5 py-0.5 rounded-md">
                  {verifiedShopsCount} ვერიფიცირებული
                </span>
                <span>მართვა →</span>
              </div>
            </div>

            {/* KPI 3: Users */}
            <div 
              onClick={() => setActiveTab("users")}
              className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-card via-card to-teal-500/[0.05] border border-border/80 shadow-2xs hover:border-teal-500/40 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  მომხმარებლები
                </span>
                <div className="h-7 w-7 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Users className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black text-foreground">{users.length}</p>
              <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-bold text-muted-foreground flex-wrap">
                <span>{users.filter((u) => u.isAdmin).length} ადმინი</span>
                <span>•</span>
                <span className="text-teal-600 dark:text-teal-400">{users.filter((u) => u.tier && u.tier !== "FREE").length} Pro შოპი</span>
              </div>
            </div>

            {/* KPI 4: Plans & Pricing */}
            <div 
              onClick={() => setActiveTab("plans")}
              className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-card via-card to-purple-500/[0.05] border border-border/80 shadow-2xs hover:border-purple-500/40 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  ტარიფები & ფასები
                </span>
                <div className="h-7 w-7 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black text-foreground">{plans.length}</p>
              <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                <span>კონფიგურაცია →</span>
              </div>
            </div>
          </div>

          {/* Quick Real Insights Strip */}
          <div className="p-3 rounded-2xl bg-surface-container/60 border border-border/70 flex items-center justify-between gap-3 text-xs flex-wrap">
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
              <span className="flex items-center gap-1.5 font-bold text-foreground">
                <Eye className="w-3.5 h-3.5 text-primary" />
                <span>{analyticsMetrics.totalViews.toLocaleString()} ნახვა</span>
              </span>
              <span className="flex items-center gap-1.5 font-bold text-foreground">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>{analyticsMetrics.totalPhoneClicks.toLocaleString()} ზარი</span>
              </span>
              <span className="flex items-center gap-1.5 font-bold text-foreground">
                <Tag className="w-3.5 h-3.5 text-amber-600" />
                <span>საშუალო ფასი: ~{analyticsMetrics.avgPrice} ₾</span>
              </span>
              <span className="flex items-center gap-1.5 font-bold text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>ტოპ ქალაქი: {analyticsMetrics.topCities[0]?.name || "თბილისი"} ({analyticsMetrics.topCities[0]?.pct || 65}%)</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("analytics")}
              className="text-xs font-black text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>სრული ანალიტიკა</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Quick Action Command Hub - Compact, Functional & High-Density */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>სწრაფი მართვის ცენტრი</span>
              </h3>
              <span className="text-[10.5px] text-muted-foreground font-semibold">
                1-კლიკით გადასვლა & მართვა
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              {/* Tile 1: Custom URL Shops Studio */}
              <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-2xs hover:border-indigo-500/40 transition-all flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Store className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-black text-foreground truncate">Custom URL შოპები</h4>
                    <p className="text-[10.5px] text-muted-foreground truncate">
                      {shopsWithSlugCount} აქტიური სლაგი • {verifiedShopsCount} ვერიფიცირებული
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setActiveTab("shops")}
                  className="h-7.5 px-2.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 gap-1 cursor-pointer shadow-2xs"
                >
                  <span>მართვა</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>

              {/* Tile 2: Plans & Pricing */}
              <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-2xs hover:border-purple-500/40 transition-all flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-black text-foreground truncate">ტარიფები & ფასები</h4>
                    <p className="text-[10.5px] text-muted-foreground truncate">
                      {plans.length} ტარიფი • ფასების კონფიგურაცია
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setActiveTab("plans")}
                  className="h-7.5 px-2.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shrink-0 gap-1 cursor-pointer shadow-2xs"
                >
                  <span>ტარიფები</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>

              {/* Tile 3: Seed Real Test Plants */}
              <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-2xs hover:border-emerald-500/40 transition-all flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Sprout className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-black text-foreground truncate">სატესტო მცენარეები</h4>
                    <p className="text-[10.5px] text-muted-foreground truncate">
                      მონსტერა, ფიკუსი, კალათეა ბაზაში
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={handleSeedListingsToAdmin}
                  className="h-7.5 px-2.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 gap-1 cursor-pointer shadow-2xs"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>ჩაწერა</span>
                </Button>
              </div>

              {/* Tile 4: System Audit Studio */}
              <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-2xs hover:border-sky-500/40 transition-all flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-black text-foreground truncate">სისტემური აუდიტი</h4>
                    <p className="text-[10.5px] text-muted-foreground truncate">
                      {auditLogs.length} მოვლენა • ცვლილებების ისტორია
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setActiveTab("audit")}
                  className="h-7.5 px-2.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shrink-0 gap-1 cursor-pointer shadow-2xs"
                >
                  <span>ლოგები</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>

              {/* Tile 5: Live Analytics */}
              <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-2xs hover:border-amber-500/40 transition-all flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-black text-foreground truncate">ცოცხალი სტატისტიკა</h4>
                    <p className="text-[10.5px] text-muted-foreground truncate">
                      {analyticsMetrics.totalViews.toLocaleString()} ნახვა • ქალაქები
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setActiveTab("analytics")}
                  className="h-7.5 px-2.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shrink-0 gap-1 cursor-pointer shadow-2xs"
                >
                  <span>ანალიტიკა</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>

              {/* Tile 6: Public Store Directory Preview */}
              <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-2xs hover:border-primary/40 transition-all flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-black text-foreground truncate">მაღაზიების ვიტრინა</h4>
                    <p className="text-[10.5px] text-muted-foreground truncate">
                      გახსენით /shops კატალოგი
                    </p>
                  </div>
                </div>
                <a 
                  href="/ka/shops" 
                  target="_blank" 
                  rel="noreferrer"
                  className="h-7.5 px-2.5 rounded-lg text-xs font-bold bg-primary hover:bg-primary/90 text-white inline-flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                >
                  <span>ვიტრინა</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Analytics - Full Live Calculations */}
      {activeTab === "analytics" && (
        <div className="space-y-4 sm:space-y-5">
          {/* Top Real Metrics Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-2xs">
              <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                ჯამური ნახვები
              </span>
              <p className="text-xl sm:text-2xl font-black text-foreground">
                {analyticsMetrics.totalViews.toLocaleString()}
              </p>
              <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 block">
                განცხადებების რეალური ნახვები
              </span>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-2xs">
              <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                ზარები / კონტაქტი
              </span>
              <p className="text-xl sm:text-2xl font-black text-foreground">
                {analyticsMetrics.totalPhoneClicks.toLocaleString()}
              </p>
              <span className="text-[10.5px] text-indigo-600 dark:text-indigo-400 font-bold mt-0.5 block">
                ტელეფონზე დაკლიკება
              </span>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-2xs">
              <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                საშუალო ფასი
              </span>
              <p className="text-xl sm:text-2xl font-black text-foreground">
                {analyticsMetrics.avgPrice} ₾
              </p>
              <span className="text-[10.5px] text-amber-600 dark:text-amber-400 font-bold mt-0.5 block">
                ფასიანი განცხადებების მიხედვით
              </span>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-2xs">
              <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                აქტიური მარაგი
              </span>
              <p className="text-xl sm:text-2xl font-black text-foreground">
                {analyticsMetrics.activeCount}
              </p>
              <span className="text-[10.5px] text-teal-600 dark:text-teal-400 font-bold mt-0.5 block">
                გამოქვეყნებული მცენარე
              </span>
            </div>
          </div>

          {/* Detailed Distribution Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* Top Categories */}
            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <h4 className="text-xs sm:text-sm font-black text-foreground flex items-center gap-1.5">
                  <Sprout className="w-4 h-4 text-emerald-600" />
                  <span>ტოპ კატეგორიები ბაზარზე</span>
                </h4>
                <span className="text-[11px] text-muted-foreground font-bold">რაოდენობა</span>
              </div>
              <div className="space-y-2">
                {analyticsMetrics.topCategories.map((cat) => (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="capitalize text-foreground">{cat.name}</span>
                      <span className="text-muted-foreground">{cat.count} ({cat.pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(cat.pct * 1.5, 100)}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* City Distribution */}
            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <h4 className="text-xs sm:text-sm font-black text-foreground flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-600" />
                  <span>გეოგრაფიული განაწილება</span>
                </h4>
                <span className="text-[11px] text-muted-foreground font-bold">წილი</span>
              </div>
              <div className="space-y-2">
                {analyticsMetrics.topCities.map((city) => (
                  <div key={city.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-foreground">{city.name}</span>
                      <span className="text-muted-foreground">{city.count} განცხადება ({city.pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                      <div 
                        className="h-full bg-rose-500 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(city.pct * 1.3, 100)}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transaction Types Breakdown */}
            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <h4 className="text-xs sm:text-sm font-black text-foreground flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>გარიგების ფორმა</span>
                </h4>
                <span className="text-[11px] text-muted-foreground font-bold">განცხადებები</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-surface-container/60 border border-border/60">
                  <span className="text-[10px] font-bold text-muted-foreground block">გაყიდვა</span>
                  <p className="text-base sm:text-lg font-black text-foreground mt-0.5">
                    {analyticsMetrics.transactions.sale}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 block">გაცვლა</span>
                  <p className="text-base sm:text-lg font-black text-indigo-700 dark:text-indigo-300 mt-0.5">
                    {analyticsMetrics.transactions.trade}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block">საჩუქარი/უფასო</span>
                  <p className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {analyticsMetrics.transactions.gift}
                  </p>
                </div>
              </div>
            </div>

            {/* Subscription Tiers Breakdown */}
            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <h4 className="text-xs sm:text-sm font-black text-foreground flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-purple-600" />
                  <span>საბონენტო ტარიფები</span>
                </h4>
                <span className="text-[11px] text-muted-foreground font-bold">მომხმარებლები</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div className="p-2 rounded-xl bg-surface-container/60 border border-border/60">
                  <span className="text-[9.5px] font-bold text-muted-foreground block">Free</span>
                  <p className="text-sm font-black text-foreground mt-0.5">{analyticsMetrics.tiers.free}</p>
                </div>
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <span className="text-[9.5px] font-bold text-purple-700 dark:text-purple-300 block">Tier 1</span>
                  <p className="text-sm font-black text-purple-700 dark:text-purple-300 mt-0.5">{analyticsMetrics.tiers.tier1}</p>
                </div>
                <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30">
                  <span className="text-[9.5px] font-bold text-purple-700 dark:text-purple-300 block">Tier 2</span>
                  <p className="text-sm font-black text-purple-700 dark:text-purple-300 mt-0.5">{analyticsMetrics.tiers.tier2}</p>
                </div>
                <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/40">
                  <span className="text-[9.5px] font-bold text-purple-700 dark:text-purple-300 block">Tier 3</span>
                  <p className="text-sm font-black text-purple-700 dark:text-purple-300 mt-0.5">{analyticsMetrics.tiers.tier3}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Plans: Complete Subscription & Pricing Management Studio */}
      {activeTab === "plans" && (
        <div className="rounded-[24px] border border-border/80 bg-card p-6 shadow-ambient space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <span> ტარიფების & პაკეტების სრული მართვა</span>
                </h2>
                <Badge className="bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 text-xs font-bold border-purple-300">
                  {plans.length} აქტიური ტარიფი
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                მართეთ ფასები, განცხადებების ლიმიტები, VIP ბუსტები და პირობები — ცვლილებები მომენტალურად აისახება /pricing გვერდზე და მთელ საიტზე.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchAndSyncDbPlans().then((live) => {
                    if (live && live.length > 0) setPlans(live);
                    showNotice(" ტარიფები განახლდა მონაცემთა ბაზიდან!");
                  });
                }}
                className="rounded-xl text-xs font-bold gap-1.5 border-border/80 hover:bg-surface-container cursor-pointer"
                title="ბაზიდან განახლება"
              >
                <RefreshCw className="w-3.5 h-3.5 text-primary" />
                განახლება
              </Button>

              <Button
                type="button"
                onClick={() => setShowNewPlanModal(!showNewPlanModal)}
                className="rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" /> ახალი ტარიფი
              </Button>

              <Button
                type="button"
                onClick={handleSavePlans}
                className="rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white gap-1.5 cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4" /> შენახვა
              </Button>
            </div>
          </div>

          {/* ═══ Platform Launch Controls: Subscriptions Mode & Greenhouse Toggles ═══ */}
          <div className="rounded-[22px] border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-card to-purple-500/5 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-foreground">
                    პლატფორმის გაშვების რეჟიმები & ფუნქციების მართვა
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    მართეთ /pricing გვერდის საჯარო ხედი და ორანჟერეის სტატუსი 1 კლიკით
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/pricing"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 text-xs font-bold hover:bg-surface-container transition-colors"
                >
                  <span>/pricing შემოწმება</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <Button
                  type="button"
                  disabled={savingPlatformSettings}
                  onClick={() => handleSavePlatformSettings()}
                  className="rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white gap-1.5 h-8.5 px-4 shadow-sm cursor-pointer"
                >
                  {savingPlatformSettings ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>ინახება...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>შენახვა</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              
              {/* Setting 1: Subscriptions / Pricing Mode */}
              <div className="p-4 rounded-[18px] border border-border/70 bg-card/60 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    <span>საბსქრიფშენების გვერდი (/pricing)</span>
                  </label>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-black ${
                      platformSettings.subscriptionsMode === "COMING_SOON"
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                        : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    }`}
                  >
                    {platformSettings.subscriptionsMode === "COMING_SOON" ? "Coming Soon (მალე)" : "Active Plans (პაკეტები)"}
                  </Badge>
                </div>
                
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {platformSettings.subscriptionsMode === "COMING_SOON"
                    ? "მომხმარებლები ხედავენ „მალე დაემატება“ გვერდს და განმარტებას, რომ გაშვების საწყის ეტაპზე საიტი სრულიად უფასოა."
                    : "მომხმარებლები ხედავენ ყველა ტარიფს (ფასებითა და ლიმიტებით) და შეუძლიათ გამოწერა."}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const next = { ...platformSettings, subscriptionsMode: "COMING_SOON" as const };
                      setPlatformSettings(next);
                      handleSavePlatformSettings(next);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                      platformSettings.subscriptionsMode === "COMING_SOON"
                        ? "bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-200 shadow-xs"
                        : "bg-muted/40 border-border/70 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Coming Soon</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const next = { ...platformSettings, subscriptionsMode: "ACTIVE" as const };
                      setPlatformSettings(next);
                      handleSavePlatformSettings(next);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                      platformSettings.subscriptionsMode === "ACTIVE"
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 shadow-xs"
                        : "bg-muted/40 border-border/70 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Rocket className="w-3.5 h-3.5" />
                    <span>Active (ჩვენება)</span>
                  </button>
                </div>
              </div>

              {/* Setting 2: Virtual Greenhouse Public Visibility */}
              <div className="p-4 rounded-[18px] border border-border/70 bg-card/60 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <Sprout className="w-4 h-4 text-emerald-600" />
                    <span>ვირტუალური ორანჟერეა</span>
                  </label>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-black ${
                      !platformSettings.greenhouseEnabled
                        ? "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-400/30"
                        : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    }`}
                  >
                    {!platformSettings.greenhouseEnabled ? "გათიშული (დამალული)" : "ჩართული (ხილული)"}
                  </Badge>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {!platformSettings.greenhouseEnabled
                    ? "ორანჟერეის ბმულები და ღილაკები დამალულია ჰედერში, ფუტერში, განცხადებებში და კაბინეტში."
                    : "ორანჟერეა სრულად ხილულია და ხელმისაწვდომია საიტის ყველა მომხმარებლისთვის."}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const next = { ...platformSettings, greenhouseEnabled: false };
                      setPlatformSettings(next);
                      handleSavePlatformSettings(next);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                      !platformSettings.greenhouseEnabled
                        ? "bg-slate-500/15 border-slate-500/40 text-slate-900 dark:text-slate-200 shadow-xs"
                        : "bg-muted/40 border-border/70 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>გათიშული</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const next = { ...platformSettings, greenhouseEnabled: true };
                      setPlatformSettings(next);
                      handleSavePlatformSettings(next);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                      platformSettings.greenhouseEnabled
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 shadow-xs"
                        : "bg-muted/40 border-border/70 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Sprout className="w-3.5 h-3.5" />
                    <span>ჩართული</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* New Plan Creator Drawer/Card */}
          {showNewPlanModal && (
            <div className="rounded-[20px] border-2 border-purple-500/30 bg-purple-500/5 p-5 sm:p-6 space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-black text-foreground">ახალი ტარიფის შექმნა</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewPlanModal(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted/40"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Fields: Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">ტარიფის სახელი (KA) *</label>
                  <input
                    type="text"
                    placeholder="მაგ: VIP პლატინა"
                    value={newPlanForm.nameKa || ""}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, nameKa: e.target.value })}
                    className="w-full py-1.5 px-3 rounded-lg border border-input text-xs bg-card font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">ტარიფის სახელი (EN)</label>
                  <input
                    type="text"
                    placeholder="e.g. VIP Platinum"
                    value={newPlanForm.nameEn || ""}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, nameEn: e.target.value })}
                    className="w-full py-1.5 px-3 rounded-lg border border-input text-xs bg-card font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">უნიკალური კოდი (Tier) *</label>
                  <input
                    type="text"
                    placeholder="მაგ: TIER_4 ან VIP_SHOP"
                    value={newPlanForm.tier || ""}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, tier: e.target.value.toUpperCase().replace(/\s+/g, "_") })}
                    className="w-full py-1.5 px-3 rounded-lg border border-input text-xs bg-card font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">ბეიჯის ტექსტი (Badge)</label>
                  <input
                    type="text"
                    placeholder="მაგ: ექსკლუზივი"
                    value={newPlanForm.badge || ""}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, badge: e.target.value })}
                    className="w-full py-1.5 px-3 rounded-lg border border-input text-xs bg-card font-bold"
                  />
                </div>
              </div>

              {/* Form Fields: Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">თვიური ფასი (₾)</label>
                  <input
                    type="number"
                    min="0"
                    value={newPlanForm.monthlyPrice || 0}
                    onChange={(e) => {
                      const m = parseFloat(e.target.value) || 0;
                      const disc = newPlanForm.discountPercent !== undefined ? newPlanForm.discountPercent : 20;
                      const y = m === 0 ? 0 : Math.round(m * 12 * (1 - disc / 100));
                      setNewPlanForm({ ...newPlanForm, monthlyPrice: m, yearlyPrice: y });
                    }}
                    className="w-full py-1.5 px-3 rounded-lg border border-input text-xs bg-card font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">ფასდაკლება (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={newPlanForm.discountPercent !== undefined ? newPlanForm.discountPercent : 20}
                    onChange={(e) => {
                      const disc = Math.max(0, Math.min(99, parseFloat(e.target.value) || 0));
                      const m = newPlanForm.monthlyPrice || 0;
                      const y = m === 0 ? 0 : Math.round(m * 12 * (1 - disc / 100));
                      setNewPlanForm({ ...newPlanForm, discountPercent: disc, yearlyPrice: y });
                    }}
                    className="w-full py-1.5 px-3 rounded-lg border border-input text-xs bg-card font-bold text-amber-600 dark:text-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">წლიური ფასი (₾)</label>
                  <input
                    type="number"
                    min="0"
                    value={newPlanForm.yearlyPrice || 0}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, yearlyPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full py-1.5 px-3 rounded-lg border border-input text-xs bg-card font-bold text-emerald-600 dark:text-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">განცხადებების ლიმიტი</label>
                  <input
                    type="number"
                    min="1"
                    value={newPlanForm.listingLimit || 10}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, listingLimit: parseInt(e.target.value) || 5 })}
                    className="w-full py-1.5 px-3 rounded-lg border border-input text-xs bg-card font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-500/20">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewPlanModal(false)}
                  className="rounded-xl text-xs cursor-pointer"
                >
                  გაუქმება
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateNewPlan}
                  className="rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white gap-1.5 cursor-pointer shadow-sm"
                >
                  <Check className="w-4 h-4" /> შექმნა და დამატება
                </Button>
              </div>
            </div>
          )}

          {/* Grid of Dynamic Plan Cards — 2 Wide studio cards per row on desktop, 1 on mobile */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {plans.map((p) => {
              const features = p.featuresKa || [];
              const isFree = p.monthlyPrice === 0;
              const discount = p.discountPercent !== undefined ? p.discountPercent : 20;
              const yearlySavings = Math.max(0, (p.monthlyPrice * 12) - p.yearlyPrice);
              const effectiveMonthlyPrice = p.yearlyPrice > 0 ? Math.round(p.yearlyPrice / 12) : 0;

              return (
                <div
                  key={p.id}
                  className="rounded-[24px] border border-border/80 bg-card p-6 shadow-ambient hover:shadow-xl transition-all flex flex-col justify-between space-y-5 relative overflow-hidden"
                >
                  {/* Top Header: Tier identifier + Badge editor */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-black text-primary dark:text-emerald-400 bg-secondary-container border border-border/70 px-3 py-1 rounded-xl shadow-2xs shrink-0">
                        {p.tier || p.id}
                      </span>
                      <span className="text-xs text-muted-foreground font-semibold">
                        რიგითობა: #{p.sortOrder || 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-muted-foreground">ბეიჯი:</span>
                      <input
                        type="text"
                        placeholder="მაგ: პოპულარული"
                        value={p.badge || ""}
                        onChange={(e) => handlePlanChange(p.id, "badge", e.target.value || undefined)}
                        className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/50 px-3 py-1 rounded-xl border border-amber-300/70 w-44 text-right focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                      />
                    </div>
                  </div>

                  {/* 2-Column Responsive Body: Left = Identity & Pricing, Right = Quotas & Features */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Left Column: Titles & Pricing Studio */}
                    <div className="space-y-4">
                      {/* Title Inputs */}
                      <div className="space-y-2">
                        <div>
                          <label className="text-[10px] font-black uppercase text-muted-foreground block mb-1">
                            სათაური (ქართულად)
                          </label>
                          <input
                            type="text"
                            value={p.nameKa}
                            onChange={(e) => handlePlanChange(p.id, "nameKa", e.target.value)}
                            className="w-full py-2 px-3 rounded-xl border border-border/80 text-sm bg-background font-extrabold text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                            სათაური (ინგლისურად)
                          </label>
                          <input
                            type="text"
                            value={p.nameEn || ""}
                            onChange={(e) => handlePlanChange(p.id, "nameEn", e.target.value)}
                            className="w-full py-1.5 px-3 rounded-xl border border-border/80 text-xs bg-background text-muted-foreground font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Pricing Studio Card */}
                      <div className="rounded-2xl border border-border/80 bg-secondary-container/40 p-4 space-y-3">
                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">
                          ფასწარმოქმნა & ფასდაკლება
                        </span>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                              თვიური (₾)
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                value={p.monthlyPrice}
                                onChange={(e) => handlePlanChange(p.id, "monthlyPrice", parseFloat(e.target.value) || 0)}
                                className="w-full py-1.5 pl-3 pr-7 rounded-xl border border-border/80 text-sm bg-background font-black text-foreground"
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₾</span>
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                              ფასდაკლება (%)
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                max="99"
                                value={discount}
                                onChange={(e) => handlePlanChange(p.id, "discountPercent", parseFloat(e.target.value) || 0)}
                                className="w-full py-1.5 pl-3 pr-7 rounded-xl border border-border/80 text-sm bg-background font-black text-amber-600 dark:text-amber-400"
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-600">%</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-muted-foreground">
                              წლიური ჯამი (₾)
                            </label>
                            {!isFree && (
                              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                ავტო-გამოთვლილი
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              value={p.yearlyPrice}
                              onChange={(e) => handlePlanChange(p.id, "yearlyPrice", parseFloat(e.target.value) || 0)}
                              className="w-full py-2 pl-3 pr-8 rounded-xl border border-emerald-500/30 text-base bg-emerald-500/5 font-black text-emerald-600 dark:text-emerald-400"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-black text-emerald-600">₾</span>
                          </div>
                        </div>

                        {!isFree && (
                          <div className="pt-2 border-t border-border/50 text-[11px] font-medium text-muted-foreground flex items-center justify-between">
                            <span>თვეში: <strong className="text-foreground">{effectiveMonthlyPrice} ₾</strong></span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                              დაზოგვა: {yearlySavings} ₾/წელში
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Quotas, VIP slots & Features Editor */}
                    <div className="space-y-4">
                      {/* Quotas */}
                      <div className="rounded-2xl border border-border/80 bg-secondary-container/30 p-3.5 space-y-3">
                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">
                          ლიმიტები & VIP პრივილეგიები
                        </span>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                              განცხადებები
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={p.listingLimit}
                              onChange={(e) => handlePlanChange(p.id, "listingLimit", parseInt(e.target.value) || 5)}
                              className="w-full py-1.5 px-3 rounded-xl border border-border/80 text-xs bg-background font-bold text-foreground"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                              VIP ბუსტები
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={p.vipSlots || 0}
                              onChange={(e) => handlePlanChange(p.id, "vipSlots", parseInt(e.target.value) || 0)}
                              className="w-full py-1.5 px-3 rounded-xl border border-border/80 text-xs bg-background font-bold text-foreground"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Features Bullet Points */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                            მახასიათებლები ({features.length})
                          </label>
                          {features.length > 0 && (
                            <span className="text-[10px] text-muted-foreground">დააწკაპუნეთ ტექსტზე რედაქტირებისთვის</span>
                          )}
                        </div>

                        {features.length === 0 ? (
                          <div className="text-center py-3.5 px-3 rounded-xl bg-muted/20 border border-dashed border-border/80 text-xs text-muted-foreground">
                            მახასიათებლები ცარიელია. ჩაწერეთ ქვემოთ და დააჭირეთ „+“-ს
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-[170px] overflow-y-auto pr-1">
                            {features.map((feat, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-background border border-border/70 rounded-xl px-3 py-1.5 text-xs shadow-2xs group">
                                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                <input
                                  type="text"
                                  value={feat}
                                  onChange={(e) => {
                                    const current = Array.isArray(p.featuresKa) ? [...p.featuresKa] : [];
                                    current[idx] = e.target.value;
                                    handlePlanChange(p.id, "featuresKa", current);
                                  }}
                                  className="w-full bg-transparent text-xs font-semibold focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFeature(p.id, idx)}
                                  className="text-muted-foreground hover:text-destructive opacity-70 group-hover:opacity-100 transition-opacity cursor-pointer p-0.5"
                                  title="პუნქტის წაშლა"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add feature input with clean + button */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="ახალი პუნქტი..."
                            value={newFeatureText[p.id] || ""}
                            onChange={(e) => setNewFeatureText((prev) => ({ ...prev, [p.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const val = newFeatureText[p.id] || "";
                                if (val.trim()) {
                                  handleAddFeature(p.id, val);
                                  setNewFeatureText((prev) => ({ ...prev, [p.id]: "" }));
                                }
                              }
                            }}
                            className="flex-1 min-w-0 py-2 px-3 rounded-xl border border-input text-xs bg-background font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              const val = newFeatureText[p.id] || "";
                              if (val.trim()) {
                                handleAddFeature(p.id, val);
                                setNewFeatureText((prev) => ({ ...prev, [p.id]: "" }));
                              }
                            }}
                            className="w-9 h-9 p-0 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white cursor-pointer shrink-0 shadow-xs flex items-center justify-center"
                            title="დამატება"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions: Sleek spacious bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePlan(p.id)}
                        className="rounded-xl text-xs font-bold border-destructive/30 text-destructive hover:bg-destructive/10 cursor-pointer h-9 px-3 gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> წაშლა
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicatePlan(p.id)}
                        className="rounded-xl text-xs font-bold border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 cursor-pointer h-9 px-3 gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> დუბლირება
                      </Button>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSavePlans}
                      className="rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white cursor-pointer h-9 px-4 gap-1.5 shadow-sm"
                    >
                      <Save className="w-3.5 h-3.5" /> შენახვა
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Glassmorphic Toast Notification — Always visible anywhere on screen */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-md w-full px-4 sm:px-0 pointer-events-auto">
          <div className={`p-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center justify-between gap-3 text-xs font-bold transition-all ${
            toast.type === "error"
              ? "bg-rose-950/95 text-rose-100 border-rose-500/50 shadow-rose-950/60 ring-1 ring-rose-500/20"
              : "bg-emerald-950/95 text-emerald-100 border-emerald-500/50 shadow-emerald-950/60 ring-1 ring-emerald-500/20"
          }`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                toast.type === "error" ? "bg-rose-500/25 text-rose-400" : "bg-emerald-500/25 text-emerald-400"
              }`}>
                {toast.type === "error" ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              </div>
              <span className="truncate leading-relaxed text-[12px]">{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
