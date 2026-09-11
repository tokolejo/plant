"use client";

import * as React from "react";
import { 
  Activity, 
  Shield, 
  Search, 
  Filter, 
  Calendar, 
  RefreshCw, 
  Download, 
  FileText, 
  Code, 
  Eye, 
  Check, 
  Copy, 
  ChevronDown, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  Sparkles, 
  Clock, 
  ArrowUpRight, 
  Tag, 
  X, 
  ExternalLink, 
  Layers, 
  Settings, 
  AlertCircle, 
  Terminal, 
  Hash, 
  Globe, 
  Laptop, 
  Radio, 
  FileJson,
  Crown,
  CreditCard,
  Sprout,
  HelpCircle,
  Maximize2,
  Minimize2,
  Trash2,
  SlidersHorizontal,
  Flame,
  ArrowRight,
  UserCheck,
  ShieldAlert,
  ArrowUpDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";
import { logTestAuditEvent, AUDIT_EVENT_NAME } from "@/lib/audit-logger";

export interface AuditStudioProps {
  showNotice?: (msg: string) => void;
  standalone?: boolean;
  locale?: string;
}

export type ViewMode = "simple" | "json";
export type DateFilter = "all" | "today" | "24h" | "7d" | "30d" | "custom";
export type ModalTab = "visualDiff" | "sideBySideJson" | "fullJson" | "meta";

// Human-friendly Action translations and icons
export const ACTION_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  CREATE_PLAN: { label: "ტარიფის შექმნა", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-100 dark:bg-emerald-950/70", border: "border-emerald-300 dark:border-emerald-800", icon: PlusIconFallback },
  UPDATE_PLAN: { label: "ტარიფის რედაქტირება", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-950/70", border: "border-amber-300 dark:border-amber-800", icon: CreditCard },
  DELETE_PLAN: { label: "ტარიფის წაშლა", color: "text-rose-700 dark:text-rose-300", bg: "bg-rose-100 dark:bg-rose-950/70", border: "border-rose-300 dark:border-rose-800", icon: Trash2 },
  DUPLICATE_PLAN: { label: "ტარიფის დუბლირება", color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-100 dark:bg-blue-950/70", border: "border-blue-300 dark:border-blue-800", icon: Layers },
  
  CHANGE_USER_ROLE: { label: "როლის შეცვლა", color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-100 dark:bg-purple-950/70", border: "border-purple-300 dark:border-purple-800", icon: Shield },
  SUSPEND_USER: { label: "მომხმარებლის დაბლოკვა", color: "text-rose-700 dark:text-rose-300", bg: "bg-rose-100 dark:bg-rose-950/70", border: "border-rose-300 dark:border-rose-800", icon: AlertTriangle },
  EXTEND_SUBSCRIPTION: { label: "გამოწერის გახანგრძლივება", color: "text-indigo-700 dark:text-indigo-300", bg: "bg-indigo-100 dark:bg-indigo-950/70", border: "border-indigo-300 dark:border-indigo-800", icon: Clock },
  UPDATE_SUBSCRIPTION_TIER: { label: "ტარიფის შეცვლა (Tier)", color: "text-indigo-700 dark:text-indigo-300", bg: "bg-indigo-100 dark:bg-indigo-950/70", border: "border-indigo-300 dark:border-indigo-800", icon: Crown },
  
  UPDATE_LISTING_STATUS: { label: "განცხადების სტატუსი", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-100 dark:bg-emerald-950/70", border: "border-emerald-300 dark:border-emerald-800", icon: Sprout },
  DELETE_LISTING: { label: "განცხადების წაშლა", color: "text-rose-700 dark:text-rose-300", bg: "bg-rose-100 dark:bg-rose-950/70", border: "border-rose-300 dark:border-rose-800", icon: Trash2 },
  UPDATE_CUSTOM_SLUG: { label: "Slug-ის განახლება", color: "text-sky-700 dark:text-sky-300", bg: "bg-sky-100 dark:bg-sky-950/70", border: "border-sky-300 dark:border-sky-800", icon: Hash },
  
  SCRAPE_AFFILIATE: { label: "Affiliate სკრაპინგი", color: "text-violet-700 dark:text-violet-300", bg: "bg-violet-100 dark:bg-violet-950/70", border: "border-violet-300 dark:border-violet-800", icon: Sparkles },
  SCRAPE_CATEGORY: { label: "კატეგორიის სკრაპინგი", color: "text-violet-700 dark:text-violet-300", bg: "bg-violet-100 dark:bg-violet-950/70", border: "border-violet-300 dark:border-violet-800", icon: Sparkles },
  SAVE_AFFILIATE: { label: "Affiliate შენახვა", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-100 dark:bg-emerald-950/70", border: "border-emerald-300 dark:border-emerald-800", icon: Sparkles },
  UPDATE_AFFILIATE: { label: "Affiliate რედაქტირება", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-950/70", border: "border-amber-300 dark:border-amber-800", icon: Sparkles },
  DELETE_AFFILIATE: { label: "Affiliate წაშლა", color: "text-rose-700 dark:text-rose-300", bg: "bg-rose-100 dark:bg-rose-950/70", border: "border-rose-300 dark:border-rose-800", icon: Trash2 },
  DELETE_AFFILIATE_PARTNER: { label: "პარტნიორის წაშლა", color: "text-rose-700 dark:text-rose-300", bg: "bg-rose-100 dark:bg-rose-950/70", border: "border-rose-300 dark:border-rose-800", icon: Trash2 },
  
  UPDATE_SITE_SETTINGS: { label: "საიტის პარამეტრები", color: "text-cyan-700 dark:text-cyan-300", bg: "bg-cyan-100 dark:bg-cyan-950/70", border: "border-cyan-300 dark:border-cyan-800", icon: Settings },
  FEEDBACK_STATUS_CHANGE: { label: "ფიდბექის სტატუსი", color: "text-teal-700 dark:text-teal-300", bg: "bg-teal-100 dark:bg-teal-950/70", border: "border-teal-300 dark:border-teal-800", icon: HelpCircle },
  FEEDBACK_REPLY: { label: "ფიდბექზე პასუხი", color: "text-teal-700 dark:text-teal-300", bg: "bg-teal-100 dark:bg-teal-950/70", border: "border-teal-300 dark:border-teal-800", icon: HelpCircle },
  DATA_EXPORT: { label: "მონაცემთა ექსპორტი", color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-100 dark:bg-blue-950/70", border: "border-blue-300 dark:border-blue-800", icon: Download },
  TEST_AUDIT_LOG: { label: "სატესტო აუდიტი", color: "text-fuchsia-700 dark:text-fuchsia-300", bg: "bg-fuchsia-100 dark:bg-fuchsia-950/70", border: "border-fuchsia-300 dark:border-fuchsia-800", icon: Terminal },
  
  SYSTEM_ERROR: { label: "სისტემური შეცდომა", color: "text-red-700 dark:text-red-300", bg: "bg-red-100 dark:bg-red-950/70", border: "border-red-300 dark:border-red-800", icon: AlertCircle },
  API_ERROR: { label: "API შეცდომა", color: "text-red-700 dark:text-red-300", bg: "bg-red-100 dark:bg-red-950/70", border: "border-red-300 dark:border-red-800", icon: AlertCircle },
  VALIDATION_ERROR: { label: "ვალიდაციის შეცდომა", color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-100 dark:bg-orange-950/70", border: "border-orange-300 dark:border-orange-800", icon: AlertCircle },
  SYSTEM_MIGRATION: { label: "სისტემის მიგრაცია", color: "text-slate-700 dark:text-slate-300", bg: "bg-slate-100 dark:bg-slate-800", border: "border-slate-300 dark:border-slate-700", icon: Activity },
};

function PlusIconFallback(props: any) {
  return <Sparkles {...props} />;
}

// Category configuration
export const CATEGORIES = [
  { id: "ALL", label: "ყველა" },
  { id: "PLAN", label: "ტარიფები" },
  { id: "USER", label: "მომხმარებლები" },
  { id: "LISTING", label: "განცხადებები" },
  { id: "SUBSCRIPTION", label: "გამოწერა" },
  { id: "AFFILIATE", label: "Affiliate" },
  { id: "FEEDBACK", label: "ფიდბექი" },
  { id: "SITE_SETTINGS", label: "პარამეტრები" },
  { id: "SECURITY", label: "უსაფრთხოება" },
  { id: "SYSTEM", label: "სისტემა" },
  { id: "ERROR", label: "შეცდომები" },
];

export const VERB_FILTERS = [
  { id: "ALL", label: "ყველა ქმედება" },
  { id: "CREATE", label: "შექმნა" },
  { id: "UPDATE", label: "განახლება" },
  { id: "DELETE", label: "წაშლა" },
  { id: "ROLE", label: "როლები & უფლებები" },
  { id: "ERROR", label: "შეცდომები" },
];

export function AuditStudio({ showNotice, standalone = false, locale = "ka" }: AuditStudioProps) {
  const supabase = createClient();

  // Core Data State
  const [logs, setLogs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [lastRefreshed, setLastRefreshed] = React.useState<Date>(new Date());

  // View Mode: Simple vs JSON
  const [viewMode, setViewMode] = React.useState<ViewMode>("simple");

  // Filters State
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("ALL");
  const [verbFilter, setVerbFilter] = React.useState<string>("ALL");
  const [dateFilter, setDateFilter] = React.useState<DateFilter>("all");
  const [customDateFrom, setCustomDateFrom] = React.useState("");
  const [customDateTo, setCustomDateTo] = React.useState("");
  const [actorFilter, setActorFilter] = React.useState<string>("ALL");

  // Sorting State
  const [sortField, setSortField] = React.useState<"date" | "action" | "category" | "actor">("date");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");

  // Auto Refresh
  const [autoRefreshInterval, setAutoRefreshInterval] = React.useState<number | null>(null);

  // Accordion Expand in Simple Mode
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  // Modal / Drawer Detail View
  const [selectedLog, setSelectedLog] = React.useState<any | null>(null);
  const [modalTab, setModalTab] = React.useState<ModalTab>("visualDiff");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Test Log State
  const [generatingTest, setGeneratingTest] = React.useState(false);

  const toggleRowExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyToClipboard = async (text: string, idForFeedback?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (idForFeedback) {
        setCopiedId(idForFeedback);
        setTimeout(() => setCopiedId(null), 2000);
      }
      if (showNotice) showNotice("📋 მონაცემი დაკოპირდა ბუფერში!");
    } catch {
      // Fallback
    }
  };

  // Fetch Audit Logs
  const fetchLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/audit?limit=400");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setLogs(json.data);
          setLastRefreshed(new Date());
          return;
        }
      }

      // Direct Supabase Fallback
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
          ip_address,
          user_agent,
          created_at,
          actor:actor_id (
            id,
            full_name,
            avatar_url,
            role
          )
        `)
        .order("created_at", { ascending: false })
        .limit(300);

      if (!error && data) {
        setLogs(data);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.warn("Audit logs fetch warning:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Initial Load
  React.useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Real-time Event Listener
  React.useEffect(() => {
    const handleAdded = () => {
      fetchLogs();
    };
    window.addEventListener(AUDIT_EVENT_NAME, handleAdded);
    return () => window.removeEventListener(AUDIT_EVENT_NAME, handleAdded);
  }, [fetchLogs]);

  // Auto-refresh interval handler
  React.useEffect(() => {
    if (!autoRefreshInterval) return;
    const timer = setInterval(() => {
      fetchLogs();
    }, autoRefreshInterval * 1000);
    return () => clearInterval(timer);
  }, [autoRefreshInterval, fetchLogs]);

  // Unique Actors list for filter dropdown
  const uniqueActors = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    logs.forEach((log) => {
      const actorId = log.actor_id || "system";
      const name = log.actor?.full_name || (actorId === "system" ? "სისტემა / Cron" : `ადმინი (${actorId.slice(0, 6)})`);
      if (!map.has(actorId)) {
        map.set(actorId, { id: actorId, name });
      }
    });
    return Array.from(map.values());
  }, [logs]);

  // KPI Calculations
  const stats = React.useMemo(() => {
    const total = logs.length;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    let todayCount = 0;
    let errorCount = 0;
    const actorSet = new Set<string>();
    const categoryCounts: Record<string, number> = {};

    logs.forEach((l) => {
      const t = new Date(l.created_at || 0).getTime();
      if (t >= todayStart) todayCount++;
      if (l.target_type === "ERROR" || (l.action && l.action.includes("ERROR"))) errorCount++;
      if (l.actor_id) actorSet.add(l.actor_id);
      const cat = l.target_type || "UNKNOWN";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    let topCategory = "არ არის";
    let maxCatCount = 0;
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      if (count > maxCatCount) {
        maxCatCount = count;
        topCategory = cat;
      }
    });

    return {
      total,
      todayCount,
      errorCount,
      uniqueActorsCount: actorSet.size,
      topCategory,
    };
  }, [logs]);

  // Filtered & Sorted Logs
  const filteredLogs = React.useMemo(() => {
    const list = logs.filter((log) => {
      // Category filter
      if (categoryFilter !== "ALL") {
        const cat = (log.target_type || "").toUpperCase();
        if (cat !== categoryFilter.toUpperCase()) {
          // Special fallback for settings
          if (categoryFilter === "SITE_SETTINGS" && cat === "SETTINGS") {
            // match
          } else {
            return false;
          }
        }
      }

      // Verb filter
      if (verbFilter !== "ALL") {
        const action = log.action || "";
        if (verbFilter === "CREATE" && !action.startsWith("CREATE") && !action.startsWith("SAVE")) return false;
        if (verbFilter === "UPDATE" && !action.startsWith("UPDATE") && !action.startsWith("EDIT") && !action.startsWith("EXTEND")) return false;
        if (verbFilter === "DELETE" && !action.startsWith("DELETE") && !action.startsWith("SUSPEND")) return false;
        if (verbFilter === "ROLE" && !action.includes("ROLE") && !action.includes("SUBSCRIPTION_TIER")) return false;
        if (verbFilter === "ERROR" && !action.includes("ERROR") && log.target_type !== "ERROR") return false;
      }

      // Actor filter
      if (actorFilter !== "ALL") {
        if (actorFilter === "system") {
          if (log.actor_id) return false;
        } else {
          if (log.actor_id !== actorFilter) return false;
        }
      }

      // Date range filter
      if (log.created_at) {
        const logTime = new Date(log.created_at).getTime();
        const now = new Date().getTime();

        if (dateFilter === "today") {
          const midnight = new Date().setHours(0, 0, 0, 0);
          if (logTime < midnight) return false;
        } else if (dateFilter === "24h") {
          if (logTime < now - 24 * 60 * 60 * 1000) return false;
        } else if (dateFilter === "7d") {
          if (logTime < now - 7 * 24 * 60 * 60 * 1000) return false;
        } else if (dateFilter === "30d") {
          if (logTime < now - 30 * 24 * 60 * 60 * 1000) return false;
        } else if (dateFilter === "custom") {
          if (customDateFrom) {
            const f = new Date(customDateFrom).setHours(0, 0, 0, 0);
            if (logTime < f) return false;
          }
          if (customDateTo) {
            const to = new Date(customDateTo).setHours(23, 59, 59, 999);
            if (logTime > to) return false;
          }
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchAction = (log.action || "").toLowerCase().includes(q);
        const matchTargetType = (log.target_type || "").toLowerCase().includes(q);
        const matchTargetId = (log.target_id || "").toLowerCase().includes(q);
        const matchActorName = (log.actor?.full_name || "").toLowerCase().includes(q);
        const matchActorRole = (log.actor?.role || "").toLowerCase().includes(q);
        const matchIp = (log.ip_address || "").toLowerCase().includes(q);
        const matchPayload = (
          JSON.stringify(log.old_data || {}) + 
          JSON.stringify(log.new_data || {})
        ).toLowerCase().includes(q);

        if (!matchAction && !matchTargetType && !matchTargetId && !matchActorName && !matchActorRole && !matchIp && !matchPayload) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    return [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "action":
          cmp = (a.action || "").localeCompare(b.action || "");
          break;
        case "category":
          cmp = (a.target_type || "").localeCompare(b.target_type || "");
          break;
        case "actor":
          const nameA = a.actor?.full_name || a.actor_id || "სისტემა";
          const nameB = b.actor?.full_name || b.actor_id || "სისტემა";
          cmp = nameA.localeCompare(nameB);
          break;
        case "date":
        default:
          cmp = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
          break;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [logs, categoryFilter, verbFilter, actorFilter, dateFilter, customDateFrom, customDateTo, searchQuery, sortField, sortOrder]);

  // Export handlers
  const handleExportCsv = async () => {
    try {
      window.open("/api/admin/export?type=audit", "_blank");
      if (showNotice) showNotice("📥 CSV ფაილის ჩამოტვირთვა დაიწყო");
    } catch {
      if (showNotice) showNotice("⚠️ ექსპორტის შეცდომა");
    }
  };

  const handleExportJson = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `audit-logs-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      if (showNotice) showNotice(`📦 ${filteredLogs.length} ლოგი ჩამოიტვირთა JSON ფაილად`);
    } catch {
      if (showNotice) showNotice("⚠️ JSON ექსპორტის შეცდომა");
    }
  };

  const handleGenerateTestLog = async () => {
    setGeneratingTest(true);
    try {
      await logTestAuditEvent("სატესტო მოქმედება ადმინ პანელიდან");
      await fetchLogs();
      if (showNotice) showNotice("⚡ სატესტო ლოგი წარმატებით გენერირდა და ჩაიწერა!");
    } catch (err: any) {
      if (showNotice) showNotice(`⚠️ შეცდომა: ${err.message}`);
    } finally {
      setGeneratingTest(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── TOP HERO & CONTROLS HEADER ── */}
      <div className="rounded-[24px] border border-border/80 bg-card p-5 sm:p-7 shadow-ambient space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/50 pb-5">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 flex items-center justify-center border border-purple-500/20">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                    სისტემური აუდიტის ჟურნალი
                  </h1>
                  {/* Live sync badge */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Live Sync
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ყველა ადმინისტრაციული ქმედების, როლების, ტარიფების, განცხადებებისა და შეცდომების დეტალური ჩანაწერი
                </p>
              </div>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle Switcher */}
            <div className="flex items-center bg-secondary-container/60 p-1 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => setViewMode("simple")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "simple"
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="მარტივი ადამიანური ხედი შედარების ბეიჯებით"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>მარტივი</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("json")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "json"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="JSON კოდის რეჟიმი"
              >
                <Code className="w-3.5 h-3.5" />
                <span>JSON კოდი</span>
              </button>
            </div>

            {/* Auto Refresh Dropdown */}
            <select
              aria-label="ავტო-განახლების ინტერვალი"
              value={autoRefreshInterval || 0}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value) || null)}
              className="h-9 px-2.5 rounded-xl border border-border/80 text-xs bg-background font-bold text-muted-foreground cursor-pointer focus:outline-none"
            >
              <option value={0}>ავტო: გამორთული</option>
              <option value={10}>ავტო: ყოველ 10წმ</option>
              <option value={30}>ავტო: ყოველ 30წმ</option>
            </select>

            {/* Manual Refresh */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              disabled={loading}
              className="rounded-xl text-xs font-bold gap-1.5 border-border/80 hover:bg-surface-container cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-primary ${loading ? "animate-spin" : ""}`} />
              განახლება
            </Button>

            {/* Test Log Trigger */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateTestLog}
              disabled={generatingTest}
              className="rounded-xl text-xs font-bold gap-1.5 border-purple-300 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 cursor-pointer"
              title="სატესტო ლოგის დამატება რეალურ დროში შესამოწმებლად"
            >
              <Terminal className="w-3.5 h-3.5" />
              {generatingTest ? "იწერება..." : "სატესტო ლოგი"}
            </Button>

            {/* Export Menu */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="rounded-xl text-xs font-bold gap-1.5 border-border/80 hover:bg-surface-container cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportJson}
              className="rounded-xl text-xs font-bold gap-1.5 border-border/80 hover:bg-surface-container cursor-pointer"
            >
              <FileJson className="w-3.5 h-3.5 text-purple-600" />
              JSON
            </Button>
          </div>
        </div>

        {/* ── KPI METRIC SUMMARY CARDS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-[18px] bg-secondary-container/40 border border-border/60 space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
              <FileText className="w-3 h-3 text-primary" /> სულ ჩანაწერი
            </span>
            <div className="text-xl font-black text-foreground">
              {stats.total.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground">
              ჟურნალში არსებული
            </div>
          </div>

          <div className="p-3.5 rounded-[18px] bg-secondary-container/40 border border-border/60 space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-600" /> დღეს შესრულებული
            </span>
            <div className="text-xl font-black text-emerald-600">
              {stats.todayCount}
            </div>
            <div className="text-[10px] text-muted-foreground">
              ბოლო 24 საათში
            </div>
          </div>

          <div className="p-3.5 rounded-[18px] bg-secondary-container/40 border border-border/60 space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-600" /> შეცდომები
            </span>
            <div className="text-xl font-black text-rose-600">
              {stats.errorCount}
            </div>
            <div className="text-[10px] text-muted-foreground">
              სისტემური შეტყობინება
            </div>
          </div>

          <div className="p-3.5 rounded-[18px] bg-secondary-container/40 border border-border/60 space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
              <User className="w-3 h-3 text-blue-600" /> აქტიური ადმინები
            </span>
            <div className="text-xl font-black text-blue-600">
              {stats.uniqueActorsCount}
            </div>
            <div className="text-[10px] text-muted-foreground">
              უნიკალური შემსრულებელი
            </div>
          </div>

          <div className="p-3.5 rounded-[18px] bg-secondary-container/40 border border-border/60 space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
              <Layers className="w-3 h-3 text-purple-600" /> აქტიური კატეგორია
            </span>
            <div className="text-sm font-black text-foreground truncate mt-1">
              {stats.topCategory}
            </div>
            <div className="text-[10px] text-muted-foreground">
              ყველაზე ხშირი ობიექტი
            </div>
          </div>
        </div>

        {/* ── MULTI-DIMENSIONAL FILTER TOOLBAR ── */}
        <div className="space-y-3 bg-secondary-container/30 p-4 rounded-[20px] border border-border/70">
          {/* Row 1: Live Search & Actor Selector */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ძიება მოქმედებით, მომხმარებლით, ID-ით ან JSON პარამეტრებით..."
                className="w-full h-10 pl-10 pr-10 rounded-[12px] border border-border/80 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter by Actor */}
            <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider shrink-0">
                ადმინი:
              </span>
              <select
                aria-label="ადმინისტრატორის ფილტრი"
                value={actorFilter}
                onChange={(e) => setActorFilter(e.target.value)}
                className="h-10 px-3 rounded-[12px] border border-border/80 text-xs bg-background font-bold text-foreground focus:outline-none w-full sm:w-48 cursor-pointer"
              >
                <option value="ALL">ყველა ადმინისტრატორი</option>
                <option value="system">სისტემა / ავტომატური</option>
                {uniqueActors.filter(a => a.id !== "system").map((act) => (
                  <option key={act.id} value={act.id}>
                    {act.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider shrink-0 mr-1">
              ობიექტი:
            </span>
            {CATEGORIES.map((cat) => {
              const isSelected = categoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1 rounded-[10px] text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-background/90 text-muted-foreground hover:text-foreground hover:bg-background border border-border/60"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Row 3: Action Verb Filter & Date Filter & Sorting */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40">
            {/* Verb Filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider shrink-0 mr-1">
                მოქმედება:
              </span>
              {VERB_FILTERS.map((verb) => {
                const isSelected = verbFilter === verb.id;
                return (
                  <button
                    key={verb.id}
                    type="button"
                    onClick={() => setVerbFilter(verb.id)}
                    className={`px-2.5 py-1 rounded-[8px] text-[11px] font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary text-white shadow-xs"
                        : "bg-background/80 text-muted-foreground hover:text-foreground border border-border/50"
                    }`}
                  >
                    {verb.label}
                  </button>
                );
              })}
            </div>

            {/* Date Filters & Calendar */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider shrink-0 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-purple-600" /> დრო:
              </span>
              {[
                { id: "all", label: "ყველა" },
                { id: "today", label: "დღეს" },
                { id: "24h", label: "24სთ" },
                { id: "7d", label: "7 დღე" },
                { id: "30d", label: "30 დღე" },
                { id: "custom", label: "კალენდარი" },
              ].map((p) => {
                const isSelected = dateFilter === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setDateFilter(p.id as DateFilter)}
                    className={`px-2.5 py-1 rounded-[8px] text-[11px] font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-foreground text-background shadow-xs"
                        : "bg-background/80 text-muted-foreground hover:text-foreground border border-border/50"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}

              {dateFilter === "custom" && (
                <div className="flex items-center gap-1.5 bg-background p-1 rounded-lg border border-border text-xs">
                  <input
                    aria-label="საწყისი თარიღი"
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="text-[11px] bg-transparent border-0 font-mono focus:outline-none"
                  />
                  <span className="text-muted-foreground">-</span>
                  <input
                    aria-label="საბოლოო თარიღი"
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="text-[11px] bg-transparent border-0 font-mono focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Counter & Active filter feedback */}
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <div>
            ნაჩვენებია: <strong className="text-foreground">{filteredLogs.length}</strong> / {logs.length} ჩანაწერი
            {searchQuery && <span> • ძიება: „{searchQuery}“</span>}
          </div>
          <div className="text-[11px] flex items-center gap-1">
            <span>ბოლო განახლება:</span>
            <span className="font-mono font-bold text-foreground">
              {lastRefreshed.toLocaleTimeString("ka-GE")}
            </span>
          </div>
        </div>
      </div>

      {/* ── LOGS DISPLAY: SIMPLE VIEW VS JSON VIEW ── */}
      {viewMode === "simple" ? (
        <SimpleTableView
          logs={filteredLogs}
          loading={loading}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={(field) => {
            if (sortField === field) {
              setSortOrder(sortOrder === "asc" ? "desc" : "asc");
            } else {
              setSortField(field);
              setSortOrder("desc");
            }
          }}
          expandedRows={expandedRows}
          onToggleExpand={toggleRowExpand}
          onOpenModal={(log, tab) => {
            setSelectedLog(log);
            setModalTab(tab || "visualDiff");
          }}
          onCopyJson={(log) => copyToClipboard(JSON.stringify(log, null, 2), log.id)}
          copiedId={copiedId}
          onResetFilters={() => {
            setSearchQuery("");
            setCategoryFilter("ALL");
            setVerbFilter("ALL");
            setDateFilter("all");
            setActorFilter("ALL");
          }}
        />
      ) : (
        <JsonCodeListView
          logs={filteredLogs}
          loading={loading}
          onOpenModal={(log) => {
            setSelectedLog(log);
            setModalTab("fullJson");
          }}
          onCopyJson={(log) => copyToClipboard(JSON.stringify(log, null, 2), log.id)}
          copiedId={copiedId}
        />
      )}

      {/* ── COMPREHENSIVE DIFF & JSON MODAL ── */}
      {selectedLog && (
        <AuditDetailModal
          log={selectedLog}
          activeTab={modalTab}
          setActiveTab={setModalTab}
          onClose={() => setSelectedLog(null)}
          onCopy={copyToClipboard}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIMPLE TABLE VIEW COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
interface SimpleTableViewProps {
  logs: any[];
  loading: boolean;
  sortField: "date" | "action" | "category" | "actor";
  sortOrder: "asc" | "desc";
  onSort: (field: "date" | "action" | "category" | "actor") => void;
  expandedRows: Set<string>;
  onToggleExpand: (id: string) => void;
  onOpenModal: (log: any, tab?: ModalTab) => void;
  onCopyJson: (log: any) => void;
  copiedId: string | null;
  onResetFilters: () => void;
}

function SimpleTableView({
  logs,
  loading,
  sortField,
  sortOrder,
  onSort,
  expandedRows,
  onToggleExpand,
  onOpenModal,
  onCopyJson,
  copiedId,
  onResetFilters,
}: SimpleTableViewProps) {
  if (loading) {
    return (
      <div className="rounded-[24px] border border-border/80 bg-card p-12 text-center text-muted-foreground text-xs space-y-3 shadow-ambient">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
        <p className="font-bold">აუდიტის ლოგები იტვირთება...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-[24px] border border-border/80 bg-card p-12 text-center text-muted-foreground text-xs space-y-3 shadow-ambient">
        <div className="w-12 h-12 rounded-2xl bg-secondary-container flex items-center justify-center mx-auto text-muted-foreground">
          <Search className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-foreground">ჩანაწერები ვერ მოიძებნა</p>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          შერჩეული ფილტრებით ან საძიებო სიტყვით ლოგები არ მოიძებნა. სცადეთ ფილტრების გასუფთავება.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onResetFilters}
          className="rounded-xl text-xs font-bold"
        >
          ფილტრების გასუფთავება
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-border/80 bg-card overflow-hidden shadow-ambient">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border/80 bg-secondary-container/60 text-muted-foreground uppercase text-[10px] font-bold select-none">
            <tr>
              <th className="py-3 px-3 w-10 text-center">#</th>
              
              {/* Sortable Date */}
              <th
                onClick={() => onSort("date")}
                className="py-3 px-3 cursor-pointer hover:bg-muted/40 transition-colors w-40"
              >
                <div className="flex items-center gap-1.5">
                  <span>დრო / თარიღი</span>
                  {sortField === "date" && (
                    <span className="text-primary font-black">{sortOrder === "asc" ? "▲" : "▼"}</span>
                  )}
                </div>
              </th>

              {/* Sortable Action */}
              <th
                onClick={() => onSort("action")}
                className="py-3 px-3 cursor-pointer hover:bg-muted/40 transition-colors w-48"
              >
                <div className="flex items-center gap-1.5">
                  <span>მოქმედება</span>
                  {sortField === "action" && (
                    <span className="text-primary font-black">{sortOrder === "asc" ? "▲" : "▼"}</span>
                  )}
                </div>
              </th>

              {/* Sortable Category */}
              <th
                onClick={() => onSort("category")}
                className="py-3 px-3 cursor-pointer hover:bg-muted/40 transition-colors w-28"
              >
                <div className="flex items-center gap-1.5">
                  <span>ობიექტი</span>
                  {sortField === "category" && (
                    <span className="text-primary font-black">{sortOrder === "asc" ? "▲" : "▼"}</span>
                  )}
                </div>
              </th>

              {/* Sortable Actor */}
              <th
                onClick={() => onSort("actor")}
                className="py-3 px-3 cursor-pointer hover:bg-muted/40 transition-colors w-44"
              >
                <div className="flex items-center gap-1.5">
                  <span>შემსრულებელი</span>
                  {sortField === "actor" && (
                    <span className="text-primary font-black">{sortOrder === "asc" ? "▲" : "▼"}</span>
                  )}
                </div>
              </th>

              {/* Human change summary */}
              <th className="py-3 px-3">ცვლილების შინაარსი</th>

              {/* Actions */}
              <th className="py-3 px-3 text-right w-44">ქმედება</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/40 text-[11px]">
            {logs.map((log, index) => {
              const logDate = log.created_at ? new Date(log.created_at) : new Date();
              const relativeTime = getRelativeTime(logDate);
              const formattedDateTime = logDate.toLocaleString("ka-GE", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });

              const isExpanded = expandedRows.has(log.id);
              const cfg = ACTION_CONFIG[log.action] || {
                label: log.action,
                color: "text-foreground",
                bg: "bg-secondary-container",
                border: "border-border",
                icon: Activity,
              };
              const ActionIcon = cfg.icon;

              const actorName = log.actor?.full_name || (log.actor_id ? "ადმინი" : "სისტემა / Cron");
              const actorRole = log.actor?.role;

              // Diff fields extraction
              const diffDetails = extractDiffFields(log.old_data, log.new_data);

              return (
                <React.Fragment key={log.id}>
                  <tr className={`hover:bg-muted/30 transition-colors ${isExpanded ? "bg-muted/20" : ""}`}>
                    {/* Expand Toggle */}
                    <td className="py-3 px-3 text-center text-muted-foreground">
                      <button
                        type="button"
                        onClick={() => onToggleExpand(log.id)}
                        className="p-1 rounded hover:bg-background cursor-pointer text-muted-foreground hover:text-foreground"
                        title={isExpanded ? "ჩაკეცვა" : "ველების გაშლა"}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>

                    {/* Time */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-bold text-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span>{relativeTime}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {formattedDateTime}
                      </div>
                    </td>

                    {/* Action Badge */}
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                          <ActionIcon className="w-3 h-3 shrink-0" />
                          <span>{cfg.label}</span>
                        </span>
                        <span className="text-[9px] font-mono text-muted-foreground tracking-tight">
                          {log.action}
                        </span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3">
                      <Badge variant="outline" className="text-[10px] font-bold font-mono uppercase">
                        {log.target_type}
                      </Badge>
                      {log.target_id && (
                        <span className="text-[9px] font-mono text-muted-foreground block truncate max-w-[90px]" title={log.target_id}>
                          #{log.target_id.slice(0, 8)}
                        </span>
                      )}
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        {log.actor?.avatar_url ? (
                          <img src={log.actor.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                            {actorName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-foreground truncate max-w-[130px]" title={actorName}>
                            {actorName}
                          </div>
                          {actorRole && (
                            <span className="text-[9px] font-black text-purple-600 dark:text-purple-400 block uppercase">
                              {actorRole}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Human Change Summary & Diff preview */}
                    <td className="py-3 px-3">
                      <HumanReadableSummary log={log} diffDetails={diffDetails} />
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Visual Diff Modal */}
                        <button
                          type="button"
                          onClick={() => onOpenModal(log, "visualDiff")}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary-container hover:bg-primary/10 text-primary font-bold text-[10px] transition-colors cursor-pointer"
                          title="შედარების გახსნა"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Diff</span>
                        </button>

                        {/* Raw JSON Modal */}
                        <button
                          type="button"
                          onClick={() => onOpenModal(log, "fullJson")}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold text-[10px] transition-colors cursor-pointer"
                          title="JSON კოდის ნახვა"
                        >
                          <Code className="w-3 h-3" />
                          <span>JSON</span>
                        </button>

                        {/* Fast Copy JSON */}
                        <button
                          type="button"
                          onClick={() => onCopyJson(log)}
                          className="p-1.5 rounded-lg border border-border/70 hover:bg-surface-container text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="JSON-ის კოპირება"
                        >
                          {copiedId === log.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Accordion Inline Expansion Row */}
                  {isExpanded && (
                    <tr className="bg-secondary-container/20 border-b border-border/50">
                      <td colSpan={7} className="p-4 pl-12">
                        <div className="p-4 rounded-xl bg-background/80 border border-border/70 space-y-3 text-xs">
                          <div className="flex items-center justify-between border-b border-border/50 pb-2">
                            <span className="font-bold text-foreground flex items-center gap-1.5">
                              <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                              დეტალური ცვლილებები (შედარება)
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              Log ID: {log.id}
                            </span>
                          </div>

                          {diffDetails.changed.length > 0 || diffDetails.added.length > 0 || diffDetails.removed.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                              {diffDetails.changed.map((c, i) => (
                                <div key={i} className="p-2 rounded-lg bg-secondary-container/50 border border-border/50 text-[11px] space-y-1">
                                  <span className="font-bold font-mono text-foreground block">{c.key}:</span>
                                  <div className="flex items-center gap-1.5 text-[10px]">
                                    <span className="line-through text-rose-600 bg-rose-500/10 px-1 rounded truncate max-w-[100px]">
                                      {formatVal(c.oldVal)}
                                    </span>
                                    <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                                    <span className="font-bold text-emerald-600 bg-emerald-500/10 px-1 rounded truncate max-w-[100px]">
                                      {formatVal(c.newVal)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {diffDetails.added.map((a, i) => (
                                <div key={i} className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-[11px] space-y-1">
                                  <span className="font-bold font-mono text-emerald-700 dark:text-emerald-300 block">+{a.key}:</span>
                                  <span className="font-bold text-emerald-600 text-[10px] bg-emerald-500/10 px-1 rounded truncate block">
                                    {formatVal(a.newVal)}
                                  </span>
                                </div>
                              ))}
                              {diffDetails.removed.map((r, i) => (
                                <div key={i} className="p-2 rounded-lg bg-rose-500/5 border border-rose-500/20 text-[11px] space-y-1">
                                  <span className="font-bold font-mono text-rose-700 dark:text-rose-300 block">-{r.key}:</span>
                                  <span className="line-through text-rose-600 text-[10px] bg-rose-500/10 px-1 rounded truncate block">
                                    {formatVal(r.oldVal)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-muted-foreground text-xs italic">
                              ველების პირდაპირი სხვაობა არ ფიქსირდება (ერთეული ოპერაცია).
                            </div>
                          )}

                          {/* IP and User Agent pill */}
                          <div className="flex items-center gap-3 pt-2 text-[10px] text-muted-foreground font-mono">
                            {log.ip_address && (
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3 text-sky-500" /> IP: {log.ip_address}
                              </span>
                            )}
                            {log.user_agent && (
                              <span className="flex items-center gap-1 truncate max-w-sm" title={log.user_agent}>
                                <Laptop className="w-3 h-3 text-purple-500" /> {log.user_agent}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON CODE LIST VIEW COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
interface JsonCodeListViewProps {
  logs: any[];
  loading: boolean;
  onOpenModal: (log: any) => void;
  onCopyJson: (log: any) => void;
  copiedId: string | null;
}

function JsonCodeListView({ logs, loading, onOpenModal, onCopyJson, copiedId }: JsonCodeListViewProps) {
  if (loading) {
    return (
      <div className="rounded-[24px] border border-border/80 bg-card p-12 text-center text-muted-foreground text-xs space-y-3 shadow-ambient">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
        <p className="font-bold">JSON მონაცემები იტვირთება...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-[24px] border border-border/80 bg-card p-12 text-center text-muted-foreground text-xs shadow-ambient">
        ჩანაწერები არ არის
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => {
        const jsonString = JSON.stringify(log, null, 2);
        return (
          <div
            key={log.id}
            className="rounded-[20px] border border-border/80 bg-[#0d1117] text-slate-100 overflow-hidden shadow-ambient"
          >
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-400" />
                <span className="font-mono font-bold text-emerald-400">{log.action}</span>
                <span className="text-slate-500">|</span>
                <span className="text-[10px] font-mono text-slate-400">{log.target_type}</span>
                <span className="text-slate-500">|</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {new Date(log.created_at).toLocaleString("ka-GE")}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onCopyJson(log)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono transition-colors cursor-pointer"
                >
                  {copiedId === log.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>დაკოპირდა</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenModal(log)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-950/80 hover:bg-purple-900 text-purple-300 text-[10px] font-mono transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>გაშლა</span>
                </button>
              </div>
            </div>

            {/* Code Body */}
            <div className="p-4 overflow-x-auto max-h-[300px] text-[11px] font-mono leading-relaxed">
              <HighlightedJson json={jsonString} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPREHENSIVE AUDIT DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────
interface AuditDetailModalProps {
  log: any;
  activeTab: ModalTab;
  setActiveTab: (tab: ModalTab) => void;
  onClose: () => void;
  onCopy: (text: string, id?: string) => void;
}

function AuditDetailModal({ log, activeTab, setActiveTab, onClose, onCopy }: AuditDetailModalProps) {
  const diffDetails = extractDiffFields(log.old_data, log.new_data);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-card border border-border/80 rounded-[28px] max-w-4xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/60 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-purple-500/10 text-purple-600 border border-purple-500/20">
                {log.action}
              </span>
              <Badge variant="outline" className="font-mono text-xs">
                {log.target_type}
              </Badge>
              {log.target_id && (
                <span className="text-xs font-mono text-muted-foreground">
                  ID: {log.target_id}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              ჩაწერილია: {new Date(log.created_at).toLocaleString("ka-GE")} • შემსრულებელი: {log.actor?.full_name || "სისტემა"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary-container cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs Bar */}
        <div className="flex items-center gap-1.5 bg-secondary-container/50 p-1.5 rounded-2xl border border-border/60">
          <button
            type="button"
            onClick={() => setActiveTab("visualDiff")}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
              activeTab === "visualDiff"
                ? "bg-primary text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            ვიზუალური შედარება
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sideBySideJson")}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
              activeTab === "sideBySideJson"
                ? "bg-primary text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Side-by-Side JSON
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("fullJson")}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
              activeTab === "fullJson"
                ? "bg-primary text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            სრული JSON
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("meta")}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
              activeTab === "meta"
                ? "bg-primary text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            მეტამონაცემები
          </button>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto flex-1 p-1 space-y-4">
          {/* TAB 1: VISUAL DIFF */}
          {activeTab === "visualDiff" && (
            <div className="space-y-4">
              {diffDetails.changed.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase text-muted-foreground">
                    შეცვლილი ველები ({diffDetails.changed.length})
                  </h4>
                  <div className="rounded-xl border border-border/70 overflow-hidden divide-y divide-border/50">
                    {diffDetails.changed.map((ch, idx) => (
                      <div key={idx} className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center bg-card">
                        <span className="font-mono font-bold text-xs text-foreground">{ch.key}</span>
                        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 font-mono text-xs line-through break-all">
                          {formatVal(ch.oldVal)}
                        </div>
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold break-all">
                          {formatVal(ch.newVal)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {diffDetails.added.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase text-emerald-600">
                    ახალი ველები ({diffDetails.added.length})
                  </h4>
                  <div className="rounded-xl border border-emerald-500/30 overflow-hidden divide-y divide-emerald-500/20">
                    {diffDetails.added.map((ad, idx) => (
                      <div key={idx} className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center bg-emerald-500/5">
                        <span className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-300">{ad.key}</span>
                        <span className="text-xs text-muted-foreground italic sm:col-span-1">არ არსებობდა (NULL)</span>
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold break-all">
                          {formatVal(ad.newVal)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {diffDetails.removed.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase text-rose-600">
                    წაშლილი ველები ({diffDetails.removed.length})
                  </h4>
                  <div className="rounded-xl border border-rose-500/30 overflow-hidden divide-y divide-rose-500/20">
                    {diffDetails.removed.map((rm, idx) => (
                      <div key={idx} className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center bg-rose-500/5">
                        <span className="font-mono font-bold text-xs text-rose-700 dark:text-rose-300">{rm.key}</span>
                        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 font-mono text-xs line-through break-all">
                          {formatVal(rm.oldVal)}
                        </div>
                        <span className="text-xs text-muted-foreground italic sm:col-span-1">წაიშალა (NULL)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {diffDetails.changed.length === 0 && diffDetails.added.length === 0 && diffDetails.removed.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-xs space-y-2 bg-secondary-container/20 rounded-2xl border border-border/60">
                  <p className="font-bold text-foreground">ველების პირდაპირი შედარება ვერ მოხერხდა</p>
                  <p>შესაძლოა მოქმედება შეიცავდეს მხოლოდ ერთეულ მონაცემს. იხილეთ „Side-by-Side JSON“ ან „სრული JSON“.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SIDE-BY-SIDE JSON */}
          {activeTab === "sideBySideJson" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Old Data */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-rose-600 flex items-center gap-1">
                    ძველი მონაცემი (Old Data)
                  </span>
                  <button
                    type="button"
                    onClick={() => onCopy(JSON.stringify(log.old_data || {}, null, 2))}
                    className="text-[10px] text-muted-foreground hover:text-foreground font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" /> კოპირება
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-[#0d1117] text-rose-300 border border-rose-500/30 text-xs font-mono overflow-x-auto max-h-[350px]">
                  {JSON.stringify(log.old_data || "არ არის (NULL)", null, 2)}
                </pre>
              </div>

              {/* New Data */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-emerald-600 flex items-center gap-1">
                    ახალი მონაცემი (New Data)
                  </span>
                  <button
                    type="button"
                    onClick={() => onCopy(JSON.stringify(log.new_data || {}, null, 2))}
                    className="text-[10px] text-muted-foreground hover:text-foreground font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" /> კოპირება
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-[#0d1117] text-emerald-300 border border-emerald-500/30 text-xs font-mono overflow-x-auto max-h-[350px]">
                  {JSON.stringify(log.new_data || "არ არის (NULL)", null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: FULL RAW JSON */}
          {activeTab === "fullJson" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-muted-foreground">
                  სრული Audit Log ჩანაწერი
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onCopy(JSON.stringify(log, null, 2))}
                  className="rounded-xl text-xs gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> სრული JSON-ის კოპირება
                </Button>
              </div>
              <div className="p-4 rounded-2xl bg-[#0d1117] text-slate-100 border border-slate-800 overflow-x-auto text-xs font-mono leading-relaxed max-h-[380px]">
                <HighlightedJson json={JSON.stringify(log, null, 2)} />
              </div>
            </div>
          )}

          {/* TAB 4: METADATA */}
          {activeTab === "meta" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-secondary-container/40 border border-border/70 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">ლოგის უნიკალური ID</span>
                  <div className="font-mono font-bold text-foreground break-all">{log.id}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-secondary-container/40 border border-border/70 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">შემსრულებლის ID (Actor ID)</span>
                  <div className="font-mono font-bold text-foreground break-all">{log.actor_id || "სისტემა / Cron"}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-secondary-container/40 border border-border/70 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">IP მისამართი</span>
                  <div className="font-mono font-bold text-foreground">{log.ip_address || "არ არის ჩაწერილი"}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-secondary-container/40 border border-border/70 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">მოქმედების დრო</span>
                  <div className="font-mono font-bold text-foreground">{new Date(log.created_at).toISOString()}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-secondary-container/40 border border-border/70 space-y-1 sm:col-span-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">User Agent (ბრაუზერი / მოწყობილობა)</span>
                  <div className="font-mono text-[11px] text-foreground break-all">{log.user_agent || "არ არის ჩაწერილი"}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-border/60">
          <Button
            type="button"
            size="sm"
            onClick={onClose}
            className="rounded-xl text-xs font-bold px-5 cursor-pointer"
          >
            დახურვა
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HUMAN READABLE SUMMARY COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function HumanReadableSummary({ log, diffDetails }: { log: any; diffDetails: any }) {
  const targetName = log.new_data?.targetName || log.old_data?.targetName || log.new_data?.userName || log.old_data?.userName;
  const targetEmail = log.new_data?.targetEmail || log.old_data?.targetEmail || log.new_data?.userEmail || log.old_data?.userEmail;
  const targetTitle = log.new_data?.listingTitle || log.old_data?.listingTitle || log.new_data?.title || log.old_data?.title;
  const changeSummary = log.new_data?.changeSummary || log.old_data?.changeSummary;

  return (
    <div className="space-y-1.5 max-w-sm">
      {/* Target item title if available */}
      {targetName || targetEmail ? (
        <div className="flex items-center gap-1 font-bold text-foreground text-[11px]">
          <User className="w-3 h-3 text-blue-600 shrink-0" />
          <span className="truncate max-w-[150px]">{targetName || "მომხმარებელი"}</span>
          {targetEmail && <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">({targetEmail})</span>}
        </div>
      ) : targetTitle ? (
        <div className="flex items-center gap-1 font-bold text-foreground text-[11px]">
          <Sprout className="w-3 h-3 text-emerald-600 shrink-0" />
          <span className="truncate max-w-[200px]">„{targetTitle}“</span>
        </div>
      ) : null}

      {/* Human Change Pills */}
      <div>
        {changeSummary ? (
          <span className="inline-block px-2 py-0.5 rounded-md bg-secondary-container text-foreground font-bold text-[10px]">
            {changeSummary}
          </span>
        ) : log.action === "UPDATE_SUBSCRIPTION_TIER" ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 font-bold text-[10px]">
            ტარიფი: {log.old_data?.tier || "FREE"} → {log.new_data?.tier || log.new_data?.newTier}
          </span>
        ) : log.action === "CHANGE_USER_ROLE" ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 font-bold text-[10px]">
            როლი: {log.old_data?.role || "USER"} → {log.new_data?.role || log.new_data?.newRole}
          </span>
        ) : log.action === "UPDATE_LISTING_STATUS" ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-bold text-[10px]">
            სტატუსი: {log.new_data?.status}
          </span>
        ) : diffDetails.changed.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {diffDetails.changed.slice(0, 2).map((c: any, idx: number) => (
              <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary-container text-[9px] font-mono">
                <strong>{c.key}:</strong> {formatVal(c.oldVal)} → {formatVal(c.newVal)}
              </span>
            ))}
            {diffDetails.changed.length > 2 && (
              <span className="text-[9px] text-muted-foreground font-bold">+{diffDetails.changed.length - 2} ველი</span>
            )}
          </div>
        ) : (
          <span className="text-[10px] text-muted-foreground">
            {log.target_type} განახლდა
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HIGHLIGHTED JSON COMPONENT (Developer-grade syntax coloring)
// ─────────────────────────────────────────────────────────────────────────────
function HighlightedJson({ json }: { json: string }) {
  // Regex token replacement for JSON syntax highlighting
  const formatted = React.useMemo(() => {
    const escaped = json
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    return escaped.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = "text-amber-300"; // number
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = "text-sky-400 font-bold"; // key
          } else {
            cls = "text-emerald-300"; // string
          }
        } else if (/true|false/.test(match)) {
          cls = "text-purple-400 font-bold"; // boolean
        } else if (/null/.test(match)) {
          cls = "text-slate-400 italic"; // null
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  }, [json]);

  return (
    <pre
      dangerouslySetInnerHTML={{ __html: formatted }}
      className="font-mono text-[11px] leading-relaxed select-text"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
function extractDiffFields(oldData: any, newData: any) {
  const changed: Array<{ key: string; oldVal: any; newVal: any }> = [];
  const added: Array<{ key: string; newVal: any }> = [];
  const removed: Array<{ key: string; oldVal: any }> = [];
  const unchanged: Array<{ key: string; val: any }> = [];

  const oldObj = (typeof oldData === "object" && oldData !== null) ? oldData : {};
  const newObj = (typeof newData === "object" && newData !== null) ? newData : {};

  const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]));

  allKeys.forEach((key) => {
    // Ignore internal metadata keys
    if (key.startsWith("_") || key === "timestamp" || key === "changeSummary") return;

    const hasOld = key in oldObj;
    const hasNew = key in newObj;
    const oldVal = oldObj[key];
    const newVal = newObj[key];

    if (hasOld && hasNew) {
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changed.push({ key, oldVal, newVal });
      } else {
        unchanged.push({ key, val: oldVal });
      }
    } else if (hasNew) {
      added.push({ key, newVal });
    } else if (hasOld) {
      removed.push({ key, oldVal });
    }
  });

  return { changed, added, removed, unchanged };
}

function formatVal(val: any): string {
  if (val === undefined || val === null) return "NULL";
  if (typeof val === "boolean") return val ? "true" : "false";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function getRelativeTime(date: Date): string {
  const diffSec = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (diffSec < 45) return "ახლახანს";
  if (diffSec < 90) return "1 წუთის წინ";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} წუთის წინ`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} საათის წინ`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} დღის წინ`;
  return date.toLocaleDateString("ka-GE", { day: "2-digit", month: "short" });
}
