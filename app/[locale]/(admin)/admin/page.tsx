"use client";

import * as React from "react";
import { Link, useRouter } from "@/i18n/routing";
import { createClient } from "@/utils/supabase/client";
import { SAMPLE_LISTINGS } from "@/lib/mock-data";
import { formatDbListing } from "@/lib/listings-service";
import { getStoredPlans, saveStoredPlans } from "@/lib/plans-store";
import { 
  ShieldCheck, 
  Users, 
  Layers, 
  Sparkles, 
  Eye, 
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
  X,
  Download,
  Globe,
  FileText,
  Activity,
  UserX,
  CalendarPlus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

type SortField = "title" | "itemType" | "price" | "seller" | "status" | "date";
type SortOrder = "asc" | "desc";
type DateFilter = "all" | "1day" | "1week" | "1month" | "custom";

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null);
  const [activeTab, setActiveTab] = React.useState<"overview" | "listings" | "users" | "affiliate" | "audit" | "plans" | "analytics">("overview");

  // Admin Listings State
  const [listings, setListings] = React.useState<any[]>(SAMPLE_LISTINGS);
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
        showNotice(`🗑️ ${ids.length} განცხადება წარმატებით წაიშალა!`);
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
        const label = action === "ACTIVE" ? "🟢 გამოჩენილი" : "🟡 დამალული";
        showNotice(`✅ ${ids.length} განცხადება — ${label}!`);
      }
      setSelectedIds(new Set());
    } catch (err: any) {
      showNotice(`❌ შეცდომა: ${err.message}`);
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
  const [plans, setPlans] = React.useState<any[]>([]);
  const [plansSaved, setPlansSaved] = React.useState(false);

  React.useEffect(() => {
    setPlans(getStoredPlans());
  }, []);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(""), 3500);
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
      const existingIds = new Set(formattedDb.map((l: any) => l.id));
      const uniqueSamples = SAMPLE_LISTINGS.filter((l) => !existingIds.has(l.id)).map((s) => ({
        ...s,
        status: s.status || "ACTIVE",
        rawCreatedAt: s.createdAt || "2026-08-15T12:00:00Z",
      }));
      setListings([...formattedDb, ...uniqueSamples]);
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
        tier: p.subscription_tier || "FREE",
        customSlug: p.custom_slug,
        activeListings: dbListings?.filter((l: any) => l.user_id === p.id).length || 0,
        isAdmin: p.is_admin || (p.email === "tokolejo@gmail.com"),
        createdAt: p.created_at ? new Date(p.created_at).toISOString().split("T")[0] : "2026-08-20",
      })));
    }
  }, [supabase, currentUser]);

  // Auth & Admin Verification
  React.useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setCurrentUser(user);
      const isSuperAdmin = user?.email === "tokolejo@gmail.com";

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();

        if (isSuperAdmin || profile?.is_admin) {
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
        showNotice(`❌ შეცდომა სტატუსის განახლებისას: ${error.message}`);
        return;
      }
    }

    const labelMap: Record<string, string> = {
      ACTIVE: "🟢 აქტიური (გამოჩენილი)",
      HIDDEN: "🟡 დამალული (საიტზე არ ჩანს)",
      REJECTED: "🔴 დაბლოკილი",
    };
    showNotice(`✅ განცხადების სტატუსი შეიცვალა: ${labelMap[newStatus] || newStatus}`);
  };

  const deleteListing = async (id: string, title: string) => {
    if (!confirm(`ნამდვილად გსურთ განცხადების წაშლა: "${title}"?`)) return;

    setListings((prev) => prev.filter((l) => l.id !== id));

    if (!id.startsWith("lst-")) {
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) {
        showNotice(`❌ წაშლის შეცდომა: ${error.message}`);
        return;
      }
    }
    showNotice(`🗑️ განცხადება წარმატებით წაიშალა: "${title}"`);
  };

  const updateUserTier = async (id: string, newTier: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, tier: newTier } : u))
    );
    if (!id.startsWith("usr-")) {
      const { error } = await supabase.from("profiles").update({ subscription_tier: newTier }).eq("id", id);
      if (error) {
        showNotice(`❌ შეცდომა: ${error.message}`);
        return;
      }
    }
    showNotice(`✅ მომხმარებლის ტარიფი წარმატებით განახლდა: ${newTier}`);
  };

  const updateUserSlug = async (id: string, newSlug: string) => {
    const cleanSlug = newSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "") || null;
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, customSlug: cleanSlug } : u))
    );
    if (!id.startsWith("usr-")) {
      const { error } = await supabase
        .from("profiles")
        .update({ custom_slug: cleanSlug })
        .eq("id", id);
      if (error) {
        showNotice(`❌ შეცდომა სლაგის განახლებისას: ${error.message}`);
        return;
      }
    }
    showNotice(cleanSlug ? `✅ Custom Slug განახლდა: /${cleanSlug}` : `✅ Custom Slug გასუფთავდა (არ არის)`);
  };

  const handlePlanChange = (planId: string, field: string, value: any) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;
        if (field === "features") {
          const splitFeatures = typeof value === "string" ? value.split(",").map((s) => s.trim()).filter(Boolean) : value;
          return { ...p, featuresKa: splitFeatures, [field]: value };
        }
        return { ...p, [field]: value };
      })
    );
    setPlansSaved(false);
  };

  const handleSavePlans = () => {
    saveStoredPlans(plans);
    setPlansSaved(true);
    showNotice("💎 ტარიფების პარამეტრები წარმატებით შეინახა!");
    setTimeout(() => setPlansSaved(false), 3000);
  };

  const handleSeedListingsToAdmin = async () => {
    if (!currentUser) {
      showNotice("❌ ჯერ გაიარეთ ავტორიზაცია");
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
        address: s.address || "თბილისი",
        lat: s.lat || 41.7116,
        lng: s.lng || 44.7554,
        is_featured: s.isPremium || false,
        is_boosted: s.isPremium || false,
        status: "ACTIVE",
        views_count: s.viewsCount || 50,
        trade_preferences: s.tradePreferences || [],
      }));

      const { data, error } = await supabase.from("listings").insert(seedsToInsert).select();
      if (error) {
        throw error;
      }
      showNotice(`🎉 ${data.length} მცენარე წარმატებით ჩაიწერა თქვენს პროფილზე!`);
      loadAdminData(currentUser);
    } catch (e: any) {
      console.error("Seed error:", e);
      showNotice(`❌ შეცდომა: ${e.message}`);
    }
  };

  // ──────────────────────────────────────────────
  // Bulk Users State & Actions
  // ──────────────────────────────────────────────
  const [selectedUserIds, setSelectedUserIds] = React.useState<Set<string>>(new Set());
  const [bulkUserLoading, setBulkUserLoading] = React.useState(false);

  const toggleSelectAllUsers = () => {
    if (selectedUserIds.size === users.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(users.map((u: any) => u.id)));
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
    const ids = Array.from(selectedUserIds).filter((id) => !id.startsWith("usr-"));
    if (!confirm(`ნამდვილად გსურთ ${selectedUserIds.size} მომხმარებლის დაბლოკვა/გაყინვა?`)) return;

    setBulkUserLoading(true);
    try {
      if (ids.length > 0) {
        const { error } = await supabase.rpc("bulk_suspend_users", {
          user_ids: ids,
          reason: "Admin manual moderation",
        });
        if (error) throw error;
      }
      showNotice(`🚫 ${selectedUserIds.size} მომხმარებელი გაიყინა!`);
      setSelectedUserIds(new Set());
      loadAdminData();
    } catch (err: any) {
      showNotice(`❌ შეცდომა: ${err.message}`);
    } finally {
      setBulkUserLoading(false);
    }
  };

  const bulkExtendUsers = async (extraDays: number = 30) => {
    if (selectedUserIds.size === 0) return;
    const ids = Array.from(selectedUserIds).filter((id) => !id.startsWith("usr-"));
    setBulkUserLoading(true);
    try {
      if (ids.length > 0) {
        const { error } = await supabase.rpc("bulk_extend_subscription", {
          user_ids: ids,
          extra_days: extraDays,
        });
        if (error) throw error;
      }
      showNotice(`💎 ${selectedUserIds.size} მომხმარებელს გაუგრძელდა ტარიფი +${extraDays} დღით!`);
      setSelectedUserIds(new Set());
      loadAdminData();
    } catch (err: any) {
      showNotice(`❌ შეცდომა: ${err.message}`);
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
      showNotice("❌ შეიყვანეთ პროდუქტის URL");
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
      showNotice("✅ პროდუქტის მონაცემები წარმატებით ამოღებულია!");
    } catch (err: any) {
      showNotice(`❌ შეცდომა: ${err.message}`);
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
      showNotice(`🎉 პარტნიორი პროდუქტი "${scrapedPreview.productName}" შენახულია!`);
      setScrapedPreview(null);
      setAffiliateUrl("");
      loadAffiliates();
    } catch (err: any) {
      showNotice(`❌ შენახვის შეცდომა: ${err.message}`);
    }
  };

  const handleDeleteAffiliate = async (id: string, name: string) => {
    if (!confirm(`წაიშალოს პარტნიორი პროდუქტი: "${name}"?`)) return;
    setAffiliateProducts((prev) => prev.filter((p) => p.id !== id));
    await supabase.from("affiliate_products").delete().eq("id", id);
    showNotice(`🗑️ პროდუქტი "${name}" წაიშალა.`);
  };

  // ──────────────────────────────────────────────
  // Audit Logs State
  // ──────────────────────────────────────────────
  const [auditLogs, setAuditLogs] = React.useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = React.useState(false);

  const loadAuditLogs = React.useCallback(async () => {
    setLoadingAudit(true);
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (!error && data) {
        setAuditLogs(data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingAudit(false);
    }
  }, [supabase]);

  // Trigger loading when tab switches
  React.useEffect(() => {
    if (activeTab === "affiliate") loadAffiliates();
    if (activeTab === "audit") loadAuditLogs();
  }, [activeTab, loadAffiliates, loadAuditLogs]);

  // CSV Export helper
  const handleExport = (type: "listings" | "users" | "audit") => {
    window.open(`/api/admin/export?type=${type}`, "_blank");
    showNotice(`📥 ${type} ექსპორტის ფაილის გადმოწერა დაიწყო...`);
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

  // If not admin
  if (isAdmin === false && currentUser?.email !== "tokolejo@gmail.com") {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8 space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-foreground">წვდომა შეზღუდულია</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            ეს გვერდი განკუთვნილია მხოლოდ პლატფორმის ადმინისტრატორისთვის (tokolejo@gmail.com).
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
      {/* Action Notice Banner */}
      {actionNotice && (
        <div className="mb-5 rounded-[18px] bg-primary/10 border border-primary/30 p-3.5 text-xs text-primary font-bold flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice("")} className="text-primary hover:underline text-xs cursor-pointer">
            დახურვა
          </button>
        </div>
      )}

      {/* Clean Top Bar: Simple Title & Streamlined Horizontal Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-purple-600/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
            ადმინ პანელი
          </h1>
        </div>

        {/* Compact Single-Row Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar bg-surface-container/70 dark:bg-slate-900/70 p-1.5 rounded-[16px] border border-border/70">
          {[
            { id: "overview", label: "📊 მიმოხილვა" },
            { id: "listings", label: "📦 განცხადებები", count: listings.length },
            { id: "users", label: "👥 მომხმარებლები", count: users.length },
            { id: "plans", label: "💎 ტარიფები" },
            { id: "analytics", label: "📈 სტატისტიკა" },
            { id: "audit", label: "📜 აუდიტი" },
            { id: "affiliate", label: "🔗 Affiliate", count: affiliateProducts.length },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-[11px] text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? "bg-primary text-white shadow-ambient scale-[1.02]"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/70"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? "bg-white/20 text-white" : "bg-secondary-container text-foreground"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Stats — Ultra-Compact & Sleek Micro-Stat Badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-5">
        {/* Card 1: Total Listings -> Navigates to Listings tab */}
        <div
          onClick={() => {
            setActiveTab("listings");
            setStatusFilter("all");
          }}
          className="flex items-center justify-between gap-2 px-3 py-2 rounded-[13px] border border-border/70 bg-card hover:border-primary/50 hover:bg-surface-container/60 shadow-2xs transition-all duration-150 cursor-pointer group"
          title="დააჭირეთ განცხადებების სანახავად"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-6 w-6 rounded-[7px] bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
              <Layers className="w-3 h-3" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-semibold text-muted-foreground block truncate leading-tight">განცხადება</span>
              <span className="text-sm font-black text-foreground leading-none">{listings.length}</span>
            </div>
          </div>
          <span className="text-[10px] text-primary font-bold flex items-center gap-0.5 shrink-0 bg-primary/10 px-1.5 py-0.5 rounded-[6px] group-hover:bg-primary group-hover:text-white transition-colors">
            {listings.filter((l) => (l.status || "ACTIVE") === "ACTIVE").length} <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>

        {/* Card 2: Registered Users -> Navigates to Users tab */}
        <div
          onClick={() => setActiveTab("users")}
          className="flex items-center justify-between gap-2 px-3 py-2 rounded-[13px] border border-border/70 bg-card hover:border-teal-500/50 hover:bg-surface-container/60 shadow-2xs transition-all duration-150 cursor-pointer group"
          title="დააჭირეთ მომხმარებლების სანახავად"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-6 w-6 rounded-[7px] bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Users className="w-3 h-3" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-semibold text-muted-foreground block truncate leading-tight">უზერები</span>
              <span className="text-sm font-black text-foreground leading-none">{users.length}</span>
            </div>
          </div>
          <span className="text-[10px] text-teal-600 font-bold flex items-center gap-0.5 shrink-0 bg-teal-500/10 px-1.5 py-0.5 rounded-[6px] group-hover:bg-teal-600 group-hover:text-white transition-colors">
            მართვა <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>

        {/* Card 3: Hidden/Review -> Navigates to Listings filtered by HIDDEN */}
        <div
          onClick={() => {
            setActiveTab("listings");
            setStatusFilter("HIDDEN");
          }}
          className="flex items-center justify-between gap-2 px-3 py-2 rounded-[13px] border border-border/70 bg-card hover:border-amber-500/50 hover:bg-surface-container/60 shadow-2xs transition-all duration-150 cursor-pointer group"
          title="დააჭირეთ დამალული განცხადებების გასაფილტრად"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-6 w-6 rounded-[7px] bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <EyeOff className="w-3 h-3" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-semibold text-muted-foreground block truncate leading-tight">დამალული</span>
              <span className="text-sm font-black text-foreground leading-none">
                {listings.filter((l) => l.status === "HIDDEN" || l.status === "REJECTED").length}
              </span>
            </div>
          </div>
          <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5 shrink-0 bg-amber-500/10 px-1.5 py-0.5 rounded-[6px] group-hover:bg-amber-600 group-hover:text-white transition-colors">
            განხილვა <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>

        {/* Card 4: System Status -> Navigates to Analytics */}
        <div
          onClick={() => setActiveTab("analytics")}
          className="flex items-center justify-between gap-2 px-3 py-2 rounded-[13px] border border-border/70 bg-card hover:border-purple-500/50 hover:bg-surface-container/60 shadow-2xs transition-all duration-150 cursor-pointer group"
          title="დააჭირეთ სტატისტიკის სანახავად"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-6 w-6 rounded-[7px] bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Sparkles className="w-3 h-3" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-semibold text-muted-foreground block truncate leading-tight">სისტემა</span>
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 leading-none">100% OK</span>
            </div>
          </div>
          <span className="text-[10px] text-purple-600 font-bold flex items-center gap-0.5 shrink-0 bg-purple-500/10 px-1.5 py-0.5 rounded-[6px] group-hover:bg-purple-600 group-hover:text-white transition-colors">
            ანალიტიკა <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: ADVANCED LISTINGS MODERATION & MULTI-FILTER                   */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "listings" && (
        <div className="rounded-[24px] border border-border/80 bg-card p-5 sm:p-7 shadow-ambient space-y-6">
          
          {/* Header & Reload */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                <span>განცხადებების სრული მოდერაცია & ფილტრაცია</span>
                <Badge className="bg-secondary-container text-primary text-xs font-bold border-none">
                  {filteredListings.length} / {listings.length}
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                დაალაგეთ სვეტების მიხედვით, გაფილტრეთ თარიღით, სტატუსით და მომხმარებლით
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleExport("listings")}
                className="rounded-[12px] text-xs font-bold gap-1.5 border-border/80 hover:bg-surface-container cursor-pointer"
                title="განცხადებების CSV ექსპორტი (Excel UTF-8)"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                CSV ექსპორტი
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { loadAdminData(); showNotice("🔄 მონაცემები გადამოწმდა და განახლდა!"); }}
                className="rounded-[12px] text-xs font-bold gap-1.5 border-border/80 hover:bg-surface-container cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-primary" />
                ბაზის გადატვირთვა
              </Button>
            </div>
          </div>

          {/* 🔍 Search & Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-secondary-container/40 p-4 rounded-[20px] border border-border/60">
            
            {/* Text Search */}
            <div className="relative">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                საძიებო სიტყვა
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
                <option value="ACTIVE">🟢 აქტიური (საიტზე ჩანს)</option>
                <option value="HIDDEN">🟡 დამალული (არ ჩანს)</option>
                <option value="REJECTED">🔴 დაბლოკილი</option>
              </select>
            </div>

            {/* 👤 Searchable Seller / User Combobox */}
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
                  <option value="PLANT">🌿 მცენარე</option>
                  <option value="INVENTORY">🪴 ინვენტარი</option>
                </select>
                <select
                  value={transactionFilter}
                  onChange={(e) => setTransactionFilter(e.target.value)}
                  className="w-full py-2 px-2 rounded-[12px] border border-border/80 text-xs bg-background font-semibold focus:outline-none"
                >
                  <option value="all">გარიგება</option>
                  <option value="FIXED">💰 ფასი</option>
                  <option value="TRADE">🔄 გაცვლა</option>
                  <option value="GIFT">🎁 საჩუქარი</option>
                </select>
              </div>
            </div>
          </div>

          {/* 📅 Date Filter Presets & Custom Range */}
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
                { id: "custom", label: "დიაპაზონი 📅" },
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
                ✅ {selectedIds.size} განცხადება მონიშნული
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

          {/* 📋 Data Table with Interactive Sorting Headers */}
          <div className="overflow-x-auto rounded-[18px] border border-border/80">
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
                                📍 {item.city || "თბილისი"} {item.address ? `· ${item.address}` : ""}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Type & Plant Category */}
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-foreground">
                            {item.itemType === "PLANT" ? "🌿 მცენარე" : "🪴 ინვენტარი"}
                          </span>
                          <span className="text-[10px] text-muted-foreground block capitalize">
                            {item.plantCategory || "monstera"}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-3 px-3">
                          {item.transactionType === "GIFT" || item.price === 0 ? (
                            <Badge variant="outline" className="text-[10px] font-black border-emerald-500/40 text-emerald-600 bg-emerald-500/5">
                              🎁 საჩუქარი
                            </Badge>
                          ) : item.transactionType === "TRADE" ? (
                            <Badge variant="outline" className="text-[10px] font-bold border-amber-500/40 text-amber-600 bg-amber-500/5">
                              🔄 გაცვლა
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
                              🟡 დამალული
                            </span>
                          ) : isRejected ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/15 text-destructive text-[10px] font-black">
                              🔴 დაბლოკილი
                            </span>
                          ) : isDeleted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
                              🗑️ წაშლილი
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              🟢 აქტიური
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
                onClick={() => { loadAdminData(); showNotice("🔄 მომხმარებლების სია განახლდა!"); }}
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
                👥 {selectedUserIds.size} მომხმარებელი მონიშნულია
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

          <div className="overflow-x-auto rounded-[18px] border border-border/80">
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
                  <th className="py-3 px-3">მიმდინარე ტარიფი</th>
                  <th className="py-3 px-3">სტატუსი</th>
                  <th className="py-3 px-3 text-right">ტარიფის შეცვლა</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {users.map((user) => {
                  const isSelected = selectedUserIds.has(user.id);
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
                      <td className="py-3 px-3 font-bold text-foreground">
                        {user.fullName}
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
                      <td className="py-3 px-3">
                        <Badge variant="outline" className="text-[10px] font-bold">
                          {user.tier}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        {user.isAdmin ? (
                          <span className="text-[10px] font-extrabold text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-full">
                            ⭐ SUPER ADMIN
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-bold">🟢 აქტიური</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <select
                          value={user.tier}
                          onChange={(e) => updateUserTier(user.id, e.target.value)}
                          className="py-1 px-2 rounded-lg border border-input text-[11px] bg-background font-semibold focus:outline-none"
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
      {/* TAB 4: AFFILIATE CROSS-SELLING & LIVE URL SCRAPER                    */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "affiliate" && (
        <div className="rounded-[24px] border border-border/80 bg-card p-5 sm:p-7 shadow-ambient space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-600" />
                <span>Affiliate Cross-Selling & ჭკვიანი URL სკრეიპერი</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                შეიყვანეთ პარტნიორის პროდუქტის ბმული (Gorgia, Domini, Amazon) და სისტემა ავტომატურად ამოიღებს სათაურს, ფოტოს, ფასს და ტეგებს
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadAffiliates}
              className="rounded-[12px] text-xs font-bold gap-1.5 border-border/80 hover:bg-surface-container cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-primary" />
              სიის განახლება
            </Button>
          </div>

          {/* Scraper Input Form */}
          <form onSubmit={handleScrapeAffiliate} className="p-4 rounded-[20px] bg-secondary-container/40 border border-border/60 space-y-3">
            <label className="text-xs font-bold text-foreground block">
              🔗 პროდუქტის URL სკრეიპინგისთვის
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="url"
                  required
                  value={affiliateUrl}
                  onChange={(e) => setAffiliateUrl(e.target.value)}
                  placeholder="https://gorgia.ge/ka/product/ceramic-pot-25cm..."
                  className="w-full h-10 px-3 rounded-[12px] border border-border/80 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={affiliatePartner}
                  onChange={(e) => setAffiliatePartner(e.target.value)}
                  placeholder="პარტნიორი (optional)"
                  className="w-1/2 h-10 px-3 rounded-[12px] border border-border/80 text-xs bg-background focus:outline-none font-medium"
                />
                <Button
                  type="submit"
                  disabled={scrapingAffiliate}
                  className="flex-1 h-10 rounded-[12px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-ambient cursor-pointer"
                >
                  {scrapingAffiliate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{scrapingAffiliate ? "სკრეიპინგი..." : "ამოღება"}</span>
                </Button>
              </div>
            </div>
          </form>

          {/* Scraped Live Preview Card */}
          {scrapedPreview && (
            <div className="rounded-[20px] border border-emerald-500/40 bg-emerald-500/5 p-5 animate-in fade-in space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ამოღებული პროდუქტის მონაცემები
                </span>
                <Button
                  size="sm"
                  onClick={handleSaveAffiliate}
                  className="rounded-[12px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-ambient cursor-pointer"
                >
                  💾 ბაზაში შენახვა
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-4">
                {scrapedPreview.imageUrl && (
                  <div className="h-24 w-24 rounded-[14px] overflow-hidden bg-surface-container shrink-0 border border-border/60">
                    <img
                      src={scrapedPreview.imageUrl}
                      alt={scrapedPreview.productName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 space-y-1.5">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {scrapedPreview.partnerName}
                  </span>
                  <h3 className="text-sm font-bold text-foreground">
                    {scrapedPreview.productName}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {scrapedPreview.description}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    {scrapedPreview.price && (
                      <span className="text-sm font-black text-primary">
                        {scrapedPreview.price} {scrapedPreview.currency}
                      </span>
                    )}
                    {scrapedPreview.matchingTags?.map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-[9px]">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Affiliate Products List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              აქტიური პარტნიორი პროდუქტები ({affiliateProducts.length})
            </h3>
            {loadingAffiliates ? (
              <p className="text-xs text-muted-foreground text-center py-6">იტვირთება...</p>
            ) : affiliateProducts.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                პარტნიორი პროდუქტები ჯერ არ არის დამატებული.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {affiliateProducts.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-[18px] border border-border/80 bg-card p-3.5 shadow-2xs space-y-2.5 flex flex-col justify-between"
                  >
                    <div className="flex items-start gap-3">
                      {p.image_url && (
                        <img
                          src={p.image_url}
                          alt={p.product_name}
                          className="h-14 w-14 rounded-[10px] object-cover bg-surface-container shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold text-muted-foreground block">{p.partner_name}</span>
                        <h4 className="text-xs font-bold text-foreground truncate">{p.product_name}</h4>
                        {p.price && (
                          <span className="text-xs font-black text-primary">{p.price} {p.currency}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                      <a
                        href={p.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        <span>ბმული</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteAffiliate(p.id, p.product_name)}
                        className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                        title="წაშლა"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 5: SYSTEM AUDIT LOGS                                             */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "audit" && (
        <div className="rounded-[24px] border border-border/80 bg-card p-5 sm:p-7 shadow-ambient space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                <span>სისტემური აუდიტი & ადმინისტრაციული ლოგები</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                ადმინისტრატორებისა და სისტემის მიერ შესრულებული ყველა კრიტიკული მოქმედების ჟურნალი
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleExport("audit")}
                className="rounded-[12px] text-xs font-bold gap-1.5 border-border/80 hover:bg-surface-container cursor-pointer"
                title="ლოგების CSV ექსპორტი"
              >
                <Download className="w-3.5 h-3.5 text-purple-600" />
                CSV ექსპორტი
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadAuditLogs}
                className="rounded-[12px] text-xs font-bold gap-1.5 border-border/80 hover:bg-surface-container cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-primary" />
                განახლება
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-[18px] border border-border/80">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/80 bg-secondary-container/60 text-muted-foreground uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-3.5">დრო</th>
                  <th className="py-3 px-3">მოქმედება</th>
                  <th className="py-3 px-3">ობიექტი</th>
                  <th className="py-3 px-3">დეტალები</th>
                  <th className="py-3 px-3">შემსრულებელი</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                {loadingAudit ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground text-xs font-sans">
                      ლოგები იტვირთება...
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground text-xs font-sans">
                      ლოგების ჩანაწერები არ მოიძებნა.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3.5 whitespace-nowrap text-muted-foreground font-sans">
                        {log.created_at ? new Date(log.created_at).toLocaleString("ka-GE") : ""}
                      </td>
                      <td className="py-3 px-3 font-bold text-primary">
                        {log.action}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-secondary-container text-foreground text-[10px] font-bold uppercase">
                          {log.target_type}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-xs truncate text-muted-foreground">
                        {JSON.stringify(log.new_data || {})}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground truncate max-w-[120px]">
                        {log.actor_id || "სისტემა"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-[22px] border border-border/80 bg-card p-6 shadow-ambient space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Store className="w-4 h-4 text-primary" />
                Custom URL შოპები
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tier 2/3 მაღაზიებს აქვთ <strong className="text-foreground">plant.ge/username</strong> ტიპის მისამართი.
              </p>
              <Link href="/shops/collin" className="text-xs text-primary hover:underline flex items-center gap-1 font-bold">
                plant.ge/collin <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            <div className="rounded-[22px] border border-border/80 bg-card p-6 shadow-ambient space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-600" />
                ტარიფები & ფასები
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                შეცვალეთ ნებისმიერი ტარიფის ფასი, ლიმიტი — ცვლილება სასწრაფოდ ასახავს /pricing გვერდზე.
              </p>
              <Button size="sm" onClick={() => setActiveTab("plans")} className="rounded-xl text-xs font-bold gap-1 bg-primary text-white cursor-pointer">
                ტარიფების რედაქტირება <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="rounded-[22px] border border-border/80 bg-card p-6 shadow-ambient space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Sprout className="w-4 h-4 text-emerald-600" />
                მცენარეები ჩემს პროფილზე
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ჩაწერეთ ყველა სატესტო მცენარე (Monstera, Pink Princess, Ficus და ა.შ.) რეალურ Supabase ბაზაში თქვენს პროფილზე.
              </p>
              <Button size="sm" onClick={handleSeedListingsToAdmin} className="rounded-xl text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-ambient">
                <Sparkles className="w-3.5 h-3.5" /> ჩაწერა ჩემს პროფილზე
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Analytics */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="rounded-[22px] border border-border/80 bg-card p-5 shadow-ambient">
              <span className="text-xs font-bold text-muted-foreground uppercase block mb-1">ჯამური ნახვები</span>
              <p className="text-3xl font-black text-foreground">12,847</p>
              <span className="text-[10px] text-primary font-bold mt-1 block">+18.5% ამ კვირაში</span>
            </div>
            <div className="rounded-[22px] border border-border/80 bg-card p-5 shadow-ambient">
              <span className="text-xs font-bold text-muted-foreground uppercase block mb-1">ახალი რეგისტრაციები</span>
              <p className="text-3xl font-black text-foreground">{users.length}</p>
              <span className="text-[10px] text-muted-foreground mt-1 block">აქტიური მომხმარებლები</span>
            </div>
            <div className="rounded-[22px] border border-border/80 bg-card p-5 shadow-ambient">
              <span className="text-xs font-bold text-muted-foreground uppercase block mb-1">ყველაზე პოპ. ქალაქი</span>
              <p className="text-2xl font-black text-foreground">თბილისი</p>
              <span className="text-[10px] text-muted-foreground mt-1 block">განცხადებების 68%</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Plans */}
      {activeTab === "plans" && (
        <div className="rounded-[24px] border border-border/80 bg-card p-6 shadow-ambient space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-foreground">💎 ტარიფების მართვა</h2>
              <p className="text-xs text-muted-foreground">შეცვალეთ ტარიფის პარამეტრები და შეინახეთ</p>
            </div>
            <Button onClick={handleSavePlans} className="rounded-xl text-xs font-bold bg-primary text-white gap-1.5">
              <Save className="w-4 h-4" /> შენახვა
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((p) => (
              <div key={p.id} className="rounded-[20px] border border-border/80 p-5 bg-background space-y-3">
                <h3 className="font-bold text-sm text-foreground">{p.nameKa}</h3>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground block mb-1">ფასი (₾)</label>
                  <input
                    type="number"
                    value={p.priceMonthly}
                    onChange={(e) => handlePlanChange(p.id, "priceMonthly", parseFloat(e.target.value))}
                    className="w-full py-1.5 px-3 rounded-lg border border-input text-xs bg-card font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground block mb-1">ლიმიტი (განცხადება)</label>
                  <input
                    type="number"
                    value={p.maxListings}
                    onChange={(e) => handlePlanChange(p.id, "maxListings", parseInt(e.target.value))}
                    className="w-full py-1.5 px-3 rounded-lg border border-input text-xs bg-card font-bold"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
