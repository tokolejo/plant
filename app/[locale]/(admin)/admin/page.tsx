"use client";

import * as React from "react";
import { Link, useRouter } from "@/i18n/routing";
import { createClient } from "@/utils/supabase/client";
import { SAMPLE_LISTINGS } from "@/lib/mock-data";
import { getStoredPlans, saveStoredPlans } from "@/lib/plans-store";
import { 
  ShieldCheck, 
  Users, 
  Layers, 
  Sparkles, 
  Eye, 
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
  ExternalLink,
  Store
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null);
  const [activeTab, setActiveTab] = React.useState<"overview" | "listings" | "users" | "plans" | "analytics">("overview");

  // Admin Listings State
  const [listings, setListings] = React.useState<any[]>(SAMPLE_LISTINGS);
  const [listingSearch, setListingSearch] = React.useState("");

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
    {
      id: "usr-2",
      email: "giorgi@plants.ge",
      fullName: "გიორგი მცენარეები",
      tier: "TIER_1",
      customSlug: null,
      activeListings: 4,
      isAdmin: false,
      createdAt: "2026-08-18",
    },
    {
      id: "usr-3",
      email: "free_user@gmail.com",
      fullName: "სალომე მწვანე",
      tier: "FREE",
      customSlug: null,
      activeListings: 1,
      isAdmin: false,
      createdAt: "2026-08-19",
    },
  ]);

  // Subscription Plans Dynamic Management State
  const [plans, setPlans] = React.useState<any[]>([]);

  React.useEffect(() => {
    setPlans(getStoredPlans());
  }, []);

  const [plansSaved, setPlansSaved] = React.useState(false);

  // Auth & Admin Verification
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
      if (user) {
        const isSuperAdmin = user.email === "tokolejo@gmail.com";
        supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            if (isSuperAdmin || data?.is_admin) {
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
            }
          });
      } else {
        setIsAdmin(false);
      }
    });
  }, [supabase]);

  const updateListingStatus = (id: string, newStatus: string) => {
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
    );
  };

  const updateUserTier = (id: string, newTier: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, tier: newTier } : u))
    );
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
    setTimeout(() => setPlansSaved(false), 3000);
  };

  // If not admin in dev
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
            <Button variant="botanical" className="rounded-xl text-xs font-bold w-full">
              ადმინისტრატორით შესვლა
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const filteredListings = listings.filter((l) =>
    l.title.toLowerCase().includes(listingSearch.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>PlantSale.Ge • სრული ადმინ პანელი</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            პლატფორმის მართვის ცენტრი
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            ადმინისტრატორი: <strong className="text-foreground">tokolejo@gmail.com</strong> (სრული უფლებები)
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-1 bg-muted/60 p-1 rounded-2xl border border-border/80">
          {[
            { id: "overview", label: "📊 მიმოხილვა" },
            { id: "analytics", label: "📈 სტატისტიკა" },
            { id: "listings", label: `📦 განცხადებები (${listings.length})` },
            { id: "users", label: `👥 მომხმარებლები (${users.length})` },
            { id: "plans", label: "💎 ტარიფები" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? tab.id === "plans" ? "bg-purple-600 text-white shadow-sm" : "bg-card text-foreground shadow-sm"
                  : tab.id === "plans" ? "text-purple-700 dark:text-purple-300 hover:bg-purple-500/15" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-muted-foreground uppercase">აქტიური განცხადებები</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-foreground">{listings.length}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">+6 დღეს</span>
        </div>

        <div className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-muted-foreground uppercase">რეგისტრირებული უზერები</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-foreground">{users.length}</p>
          <span className="text-[10px] text-teal-600 font-semibold">1 სუპერ ადმინი</span>
        </div>

        <div className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-muted-foreground uppercase">პრემიუმ შოპები</span>
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-foreground">3 აქტიური</p>
          <span className="text-[10px] text-amber-600 font-semibold">Custom URL-ით</span>
        </div>

        <div className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-muted-foreground uppercase">სისტემის მდგომარეობა</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600">100% გამართული</p>
          <span className="text-[10px] text-muted-foreground">Supabase PostGIS + RLS</span>
        </div>
      </div>

      {/* Tab 1: Overview & Quick Actions */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Platform Status */}
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-600" />
                Custom URL შოპები
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tier 2/3 მაღაზიებს აქვთ <strong className="text-foreground">plantsale.ge/username</strong> ტიპის მისამართი.
              </p>
              <Link href="/shops/tamarbustan" className="text-xs text-emerald-600 hover:underline flex items-center gap-1 font-bold">
                plantsale.ge/tamarbustan <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-600" />
                ტარიფები & ფასები
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                შეცვალეთ ნებისმიერი ტარიფის ფასი, ლიმიტი — ცვლილება სასწრაფოდ ასახავს /pricing გვერდზე.
              </p>
              <Button variant="botanical" size="sm" onClick={() => setActiveTab("plans")} className="rounded-xl text-xs font-bold gap-1">
                ტარიფების რედაქტირება <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Quick Stats Breakdown */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-teal-600" />
              სწრაფი სტატისტიკა
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-2xl bg-muted/40">
                <p className="text-xl font-black text-emerald-600">{listings.filter(l => l.status === "ACTIVE").length}</p>
                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">✅ ACTIVE</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-muted/40">
                <p className="text-xl font-black text-amber-600">{listings.filter(l => l.status === "PENDING").length}</p>
                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">⏳ PENDING</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-muted/40">
                <p className="text-xl font-black text-slate-500">{listings.filter(l => l.status === "HIDDEN").length}</p>
                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">🔒 HIDDEN</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-muted/40">
                <p className="text-xl font-black text-teal-600">{users.filter(u => u.tier !== "FREE").length}</p>
                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">💎 Premium</p>
              </div>
            </div>

            {/* Tier Distribution */}
            <div className="mt-5 pt-5 border-t border-border/50">
              <p className="text-xs font-bold text-muted-foreground mb-3">ტარიფების განაწილება</p>
              <div className="space-y-2">
                {["FREE", "TIER_1", "TIER_2", "TIER_3"].map(tier => {
                  const count = users.filter(u => u.tier === tier).length;
                  const pct = users.length > 0 ? Math.round((count / users.length) * 100) : 0;
                  const colors: Record<string, string> = { FREE: "bg-slate-400", TIER_1: "bg-emerald-500", TIER_2: "bg-teal-500", TIER_3: "bg-amber-500" };
                  return (
                    <div key={tier} className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-muted-foreground w-14 shrink-0">{tier}</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${colors[tier]} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-foreground w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Analytics */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* Analytics Integration Banner */}
          <div className="rounded-3xl border border-blue-500/30 bg-blue-500/5 p-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1">Analytics პლატფორმის ინტეგრაცია</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  სისტემა მზადაა შემდეგი Analytics პლატფორმების ინტეგრაციისთვის. ინტეგრაცია მოხდება <strong>app/[locale]/layout.tsx</strong> ფაილში Script კომპონენტის საშუალებით.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { name: "Google Analytics 4", code: "GA4", desc: "Universal tracking + eCommerce events", status: "ready" },
                    { name: "Plausible Analytics", code: "PA", desc: "GDPR-friendly, self-hosted option", status: "ready" },
                    { name: "Mixpanel", code: "MP", desc: "User journey & funnel analytics", status: "ready" },
                  ].map(platform => (
                    <div key={platform.code} className="rounded-2xl border border-border/60 bg-card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-foreground">{platform.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold">მზადაა</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{platform.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Platform Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-muted-foreground uppercase">ჯამური ნახვები</span>
                <Eye className="w-4 h-4 text-teal-600" />
              </div>
              <p className="text-3xl font-black text-foreground">12,847</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] text-emerald-600 font-bold">+18.5% ამ კვირაში</span>
              </div>
            </div>

            <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-muted-foreground uppercase">ახალი რეგისტრაციები</span>
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-3xl font-black text-foreground">{users.length}</p>
              <div className="mt-2 text-[10px] text-muted-foreground">ბოლო 30 დღეში: <strong className="text-foreground">3 ახალი</strong></div>
            </div>

            <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-muted-foreground uppercase">საშ. ნახვა/განცხადება</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-3xl font-black text-foreground">342</p>
              <div className="mt-2 text-[10px] text-muted-foreground">საუკეთესო: <strong className="text-foreground">Monstera Thai (1,204)</strong></div>
            </div>

            <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-muted-foreground uppercase">ყველაზე პოპ. ქალაქი</span>
                <Store className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-black text-foreground">თბილისი</p>
              <div className="mt-2 text-[10px] text-muted-foreground">განცხადებების <strong className="text-foreground">68%</strong></div>
            </div>

            <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-muted-foreground uppercase">ჩატის შეტყობინებები</span>
                <CheckCircle className="w-4 h-4 text-teal-600" />
              </div>
              <p className="text-3xl font-black text-foreground">289</p>
              <div className="mt-2 text-[10px] text-muted-foreground">ბოლო 7 დღეში</div>
            </div>

            <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-muted-foreground uppercase">SEO ქულა</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-3xl font-black text-emerald-600">94/100</p>
              <div className="mt-2 text-[10px] text-muted-foreground">Open Graph + Structured Data</div>
            </div>
          </div>

          {/* Top Listings Table */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              ყველაზე ნახვადი განცხადებები
            </h3>
            <div className="space-y-2">
              {[
                { title: "Monstera Thai Constellation", views: 1204, city: "თბილისი", type: "PLANT" },
                { title: "Philodendron Pink Princess", views: 847, city: "ბათუმი", type: "PLANT" },
                { title: "კერამიკული ქოთნები (Set 3)", views: 621, city: "თბილისი", type: "INVENTORY" },
                { title: "Ficus Benjamina (დიდი)", views: 412, city: "ქუთაისი", type: "PLANT" },
                { title: "სუბსტრატი + პერლიტი 10L", views: 389, city: "თბილისი", type: "INVENTORY" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-muted-foreground w-4">{i + 1}</span>
                    <div>
                      <p className="text-xs font-bold text-foreground">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground">{item.city} · {item.type === "PLANT" ? "🌱" : "🪴"}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-teal-600">{item.views.toLocaleString()} ნახვა</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Listings Moderation */}
      {activeTab === "listings" && (
        <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-base font-bold text-foreground">
              განცხადებების მოდერაცია
            </h2>
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={listingSearch}
                onChange={(e) => setListingSearch(e.target.value)}
                placeholder="ძიება სათაურით..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-input text-xs bg-background"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/60 text-muted-foreground uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-3">განცხადება</th>
                  <th className="py-3 px-3">ტიპი</th>
                  <th className="py-3 px-3">ფასი</th>
                  <th className="py-3 px-3">გამყიდველი</th>
                  <th className="py-3 px-3">სტატუსი</th>
                  <th className="py-3 px-3 text-right">მოქმედება</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredListings.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-3 max-w-[220px]">
                      <Link href={`/listings/${item.id}`} className="font-bold text-foreground hover:text-emerald-600 truncate block">
                        {item.title}
                      </Link>
                      <span className="text-[10px] text-muted-foreground">{item.city}</span>
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={item.itemType === "PLANT" ? "emerald" : "teal"} className="text-[10px]">
                        {item.itemType}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 font-bold">
                      {item.transactionType === "TRADE" ? "🔄 გაცვლა" : formatPrice(item.price)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium text-foreground">{item.seller?.fullName}</span>
                      <span className="text-[10px] text-muted-foreground block">{item.seller?.tier || "FREE"}</span>
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        variant={item.status === "HIDDEN" ? "secondary" : "emerald"}
                        className="text-[10px]"
                      >
                        {item.status || "ACTIVE"}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          updateListingStatus(
                            item.id,
                            item.status === "HIDDEN" ? "ACTIVE" : "HIDDEN"
                          )
                        }
                        className="h-7 text-[10px] px-2 text-amber-600 hover:bg-amber-500/10"
                      >
                        {item.status === "HIDDEN" ? "გამოჩენა" : "დამალვა"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateListingStatus(item.id, "DELETED")}
                        className="h-7 text-[10px] px-2 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Users & Subscription Tiers */}
      {activeTab === "users" && (
        <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm">
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
                    <td className="py-3 px-3 text-muted-foreground font-mono text-[11px]">
                      {user.email}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      {user.customSlug ? (
                        <Link href={`/shops/${user.customSlug}`} className="text-emerald-600 hover:underline font-bold flex items-center gap-1">
                          <span>/{user.customSlug}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        variant={user.tier === "TIER_3" ? "amber" : user.tier === "TIER_2" ? "emerald" : "secondary"}
                        className="text-[10px] font-bold"
                      >
                        {user.tier}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      {user.isAdmin ? (
                        <span className="text-[10px] font-bold text-purple-600 bg-purple-500/15 px-2 py-0.5 rounded-md">
                          ⭐ Administrator
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">User</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <select
                        value={user.tier}
                        onChange={(e) => updateUserTier(user.id, e.target.value)}
                        aria-label="მომხმარებლის ტარიფი"
                        className="h-7 text-[11px] rounded-lg border border-input bg-background px-2 font-semibold"
                      >
                        <option value="FREE">FREE (5 ლიმიტი)</option>
                        <option value="TIER_1">TIER_1 (20 ლიმიტი)</option>
                        <option value="TIER_2">TIER_2 (50 + Custom URL)</option>
                        <option value="TIER_3">TIER_3 (150 Pro)</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Dynamic Subscription Plans & Pricing Manager */}
      {activeTab === "plans" && (
        <div className="rounded-3xl border border-purple-500/25 bg-card p-6 sm:p-7 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 uppercase mb-1">
                <Crown className="w-4 h-4" />
                <span>ტარიფების კონფიგურაცია & ფასები</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-foreground">
                პაკეტების ფასებისა და ლიმიტების მართვა
              </h2>
              <p className="text-xs text-muted-foreground">
                აქ შეტანილი ცვლილებები ავტომატურად აისახება ტარიფების გვერდზე და განცხადებების ლიმიტებზე.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {plansSaved && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-4 h-4" /> შენახულია!
                </span>
              )}
              <Button
                variant="botanical"
                onClick={handleSavePlans}
                className="rounded-2xl text-xs font-bold h-10 px-6 gap-2 shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>ფასების შენახვა</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-3xl border border-border/80 bg-background/70 p-5 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                  <Badge variant={plan.id === "TIER_3" ? "amber" : plan.id === "TIER_2" ? "emerald" : "secondary"} className="font-bold text-xs">
                    {plan.id}
                  </Badge>
                  <span className="text-xs font-bold text-muted-foreground font-mono">
                    {plan.id === "FREE" ? "0 ₾" : `${plan.monthlyPrice} ₾ / თვე`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      პაკეტის სახელი (KA)
                    </label>
                    <input
                      type="text"
                      value={plan.nameKa}
                      onChange={(e) => handlePlanChange(plan.id, "nameKa", e.target.value)}
                      className="w-full rounded-xl border border-input bg-card px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      აქტიური განცხადებების ლიმიტი
                    </label>
                    <input
                      type="number"
                      value={plan.listingLimit}
                      onChange={(e) => handlePlanChange(plan.id, "listingLimit", Number(e.target.value))}
                      className="w-full rounded-xl border border-input bg-card px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      ყოველთვიური ფასი (₾)
                    </label>
                    <input
                      type="number"
                      value={plan.monthlyPrice}
                      onChange={(e) => handlePlanChange(plan.id, "monthlyPrice", Number(e.target.value))}
                      className="w-full rounded-xl border border-input bg-card px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      წლიური ფასი (₾)
                    </label>
                    <input
                      type="number"
                      value={plan.yearlyPrice}
                      onChange={(e) => handlePlanChange(plan.id, "yearlyPrice", Number(e.target.value))}
                      className="w-full rounded-xl border border-input bg-card px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      პაკეტის აღწერა და ფუნქციები
                    </label>
                    <input
                      type="text"
                      value={plan.features}
                      onChange={(e) => handlePlanChange(plan.id, "features", e.target.value)}
                      className="w-full rounded-xl border border-input bg-card px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
