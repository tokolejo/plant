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
  X
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
  const [activeTab, setActiveTab] = React.useState<"overview" | "listings" | "users" | "plans" | "analytics">("overview");

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
  const [users, setUsers] = React.useState<any[]>([
    {
      id: "usr-admin",
      email: "tokolejo@gmail.com",
      fullName: "Tokolejo (Creator & Super Admin)",
      tier: "TIER_3",
      customSlug: "tokolejo",
      activeListings: 5,
      isAdmin: true,
      createdAt: "2026-08-20",
    },
    {
      id: "usr-1",
      email: "tamar@bustan.ge",
      fullName: "თამარ ბოტანიკა",
      tier: "TIER_2",
      customSlug: "tamarbustan",
      activeListings: 12,
      isAdmin: false,
      createdAt: "2026-08-15",
    },
  ]);

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

      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Plant • სრული ადმინ პანელი & მოდერაცია</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            პლატფორმის მართვის ცენტრი
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            ადმინისტრატორი: <strong className="text-foreground">tokolejo@gmail.com</strong> (სრული მოდერაციის უფლება)
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-1 bg-secondary-container/80 p-1.5 rounded-[18px] border border-border/80">
          {[
            { id: "overview", label: "📊 მიმოხილვა" },
            { id: "listings", label: `📦 განცხადებები (${listings.length})` },
            { id: "users", label: `👥 მომხმარებლები (${users.length})` },
            { id: "analytics", label: "📈 სტატისტიკა" },
            { id: "plans", label: "💎 ტარიფები" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-[12px] text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? tab.id === "plans" ? "bg-purple-600 text-white shadow-ambient" : "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-[22px] border border-border/80 bg-card p-5 shadow-ambient">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-muted-foreground uppercase">სულ განცხადება</span>
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-foreground">{listings.length}</p>
          <span className="text-[10px] text-primary font-bold">
            {listings.filter((l) => (l.status || "ACTIVE") === "ACTIVE").length} აქტიური საიტზე
          </span>
        </div>

        <div className="rounded-[22px] border border-border/80 bg-card p-5 shadow-ambient">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-muted-foreground uppercase">რეგისტრირებული უზერები</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-foreground">{users.length}</p>
          <span className="text-[10px] text-teal-600 font-bold">1 სუპერ ადმინი</span>
        </div>

        <div className="rounded-[22px] border border-border/80 bg-card p-5 shadow-ambient">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-muted-foreground uppercase">დამალული / განსახილველი</span>
            <EyeOff className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-foreground">
            {listings.filter((l) => l.status === "HIDDEN" || l.status === "REJECTED").length}
          </p>
          <span className="text-[10px] text-amber-600 font-bold">მოდერაციის რეჟიმში</span>
        </div>

        <div className="rounded-[22px] border border-border/80 bg-card p-5 shadow-ambient">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-muted-foreground uppercase">სისტემის მდგომარეობა</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600">100% გამართული</p>
          <span className="text-[10px] text-muted-foreground">Supabase Live DB + PostGIS</span>
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

          {/* 📋 Data Table with Interactive Sorting Headers */}
          <div className="overflow-x-auto rounded-[18px] border border-border/80">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/80 bg-secondary-container/60 text-muted-foreground uppercase text-[11px] font-bold select-none">
                <tr>
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
                    <td colSpan={7} className="py-12 text-center text-muted-foreground text-xs font-semibold">
                      განცხადებები არჩეული ფილტრებით არ მოიძებნა.
                    </td>
                  </tr>
                ) : (
                  filteredListings.map((item) => {
                    const isHidden = item.status === "HIDDEN";
                    const isRejected = item.status === "REJECTED";
                    const isDeleted = item.status === "DELETED";
                    const formattedDate = item.rawCreatedAt ? new Date(item.rawCreatedAt).toLocaleDateString("ka-GE") : "15 აგვ";

                    return (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
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

      {/* Tab 3: Users & Subscription Tiers */}
      {activeTab === "users" && (
        <div className="rounded-[24px] border border-border/80 bg-card p-5 sm:p-6 shadow-ambient">
          <h2 className="text-base font-bold text-foreground mb-4">
            მომხმარებლების, შოპებისა და ტარიფების მართვა
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/60 text-muted-foreground uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-3">მომხმარებელი</th>
                  <th className="py-3 px-3">ელ-ფოსტა</th>
                  <th className="py-3 px-3">Custom Slug</th>
                  <th className="py-3 px-3">მიმდინარე ტარიფი</th>
                  <th className="py-3 px-3">სტატუსი</th>
                  <th className="py-3 px-3 text-right">ტარიფის შეცვლა</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-3 font-bold text-foreground">
                      {user.fullName}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">{user.email}</td>
                    <td className="py-3 px-3">
                      {user.customSlug ? (
                        <Link href={`/shops/${user.customSlug}`} className="text-emerald-600 hover:underline font-mono text-[11px] font-bold">
                          /{user.customSlug}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-[10px]">არ არის</span>
                      )}
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
                        <span className="text-[10px] text-emerald-600">🟢 აქტიური</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <select
                        value={user.tier}
                        onChange={(e) => updateUserTier(user.id, e.target.value)}
                        className="py-1 px-2 rounded-lg border border-input text-[11px] bg-background font-semibold focus:outline-none"
                      >
                        <option value="FREE">Free (5 განცხადება)</option>
                        <option value="TIER_1">Tier 1 - Collector (20 განცხადება)</option>
                        <option value="TIER_2">Tier 2 - Pro Shop (50 განცხადება)</option>
                        <option value="TIER_3">Tier 3 - Premium (უსაზღვრო)</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
              <Button size="sm" onClick={() => setActiveTab("plans")} className="rounded-xl text-xs font-bold gap-1 bg-primary text-white">
                ტარიფების რედაქტირება <ArrowRight className="w-3.5 h-3.5" />
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
