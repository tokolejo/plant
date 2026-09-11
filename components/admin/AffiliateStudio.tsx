"use client";

import * as React from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  Globe, 
  Plus, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  Store, 
  Tag, 
  Filter, 
  Upload, 
  FileSpreadsheet, 
  Layers, 
  Search, 
  Eye, 
  AlertCircle, 
  BarChart3, 
  TrendingUp, 
  Check,
  MousePointerClick,
  SlidersHorizontal,
  PackageCheck,
  Edit2,
  Save,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AFFILIATE_CATEGORIES, appendReferralParam } from "@/lib/affiliate-tagger";

interface Partner {
  id: string;
  name: string;
  slug: string;
  website_url?: string;
  badge_color: string;
  logo_url?: string;
  referral_param_template: string;
  commission_rate: number;
  is_active: boolean;
  products_count?: number;
}

interface AffiliateProduct {
  id: string;
  partner_name: string;
  partner_id?: string;
  product_name: string;
  description?: string;
  image_url?: string;
  product_url: string;
  price?: number;
  currency?: string;
  commission_pct?: number;
  category?: string;
  matching_tags?: string[];
  is_active: boolean;
  clicks?: number;
  clicks_count?: number;
  created_at?: string;
}

export function AffiliateStudio({ showNotice }: { showNotice: (msg: string) => void }) {
  const supabase = createClient();

  // ─── Main State ───
  const [activeSubTab, setActiveSubTab] = React.useState<"bulk_category" | "csv_import" | "single_scraper" | "partners">("bulk_category");
  const [partners, setPartners] = React.useState<Partner[]>([]);
  const [products, setProducts] = React.useState<AffiliateProduct[]>([]);
  const [loading, setLoading] = React.useState(true);

  // ─── Filter & Search State ───
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedPartnerFilter, setSelectedPartnerFilter] = React.useState("ALL");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = React.useState("ALL");

  // ─── Bulk Category Scraper State ───
  const [catUrl, setCatUrl] = React.useState("");
  const [catPartner, setCatPartner] = React.useState("Domino");
  const [catLimit, setCatLimit] = React.useState(30);
  const [catCategoryOverride, setCatCategoryOverride] = React.useState("AUTO");
  const [scrapingCat, setScrapingCat] = React.useState(false);
  const [scrapedCatItems, setScrapedCatItems] = React.useState<any[]>([]);
  const [selectedCatIndices, setSelectedCatIndices] = React.useState<Set<number>>(new Set());
  const [savingCatItems, setSavingCatItems] = React.useState(false);

  // ─── CSV Import State ───
  const [csvText, setCsvText] = React.useState("");
  const [csvPartner, setCsvPartner] = React.useState("Domino");
  const [importingCsv, setImportingCsv] = React.useState(false);

  // ─── Single URL Scraper State ───
  const [singleUrl, setSingleUrl] = React.useState("");
  const [singlePartner, setSinglePartner] = React.useState("Domino");
  const [singleCommission, setSingleCommission] = React.useState("5");
  const [scrapingSingle, setScrapingSingle] = React.useState(false);
  const [singlePreview, setSinglePreview] = React.useState<any>(null);

  // ─── New Partner Form State ───
  const [newPartnerName, setNewPartnerName] = React.useState("");
  const [newPartnerUrl, setNewPartnerUrl] = React.useState("");
  const [newPartnerColor, setNewPartnerColor] = React.useState("#16a34a");
  const [newPartnerRef, setNewPartnerRef] = React.useState("?ref=plantge");
  const [newPartnerComm, setNewPartnerComm] = React.useState("5");
  const [creatingPartner, setCreatingPartner] = React.useState(false);
  const [showPartnerForm, setShowPartnerForm] = React.useState(false);

  // ─── Partner Edit State ───
  const [editingPartner, setEditingPartner] = React.useState<Partner | null>(null);
  const [editPartnerName, setEditPartnerName] = React.useState("");
  const [editPartnerUrl, setEditPartnerUrl] = React.useState("");
  const [editPartnerColor, setEditPartnerColor] = React.useState("#16a34a");
  const [editPartnerRef, setEditPartnerRef] = React.useState("?ref=plantge");
  const [editPartnerComm, setEditPartnerComm] = React.useState("5");
  const [updatingPartner, setUpdatingPartner] = React.useState(false);

  // ─── Catalog Multi-Select State ───
  const [selectedProductIds, setSelectedProductIds] = React.useState<Set<string>>(new Set());
  const [batchCategory, setBatchCategory] = React.useState(AFFILIATE_CATEGORIES[0]?.nameKa || "ქოთნები & კაშპო");
  const [batchOperating, setBatchOperating] = React.useState(false);

  // ─── Product Inline Edit State ───
  const [editingProductId, setEditingProductId] = React.useState<string | null>(null);
  const [editPrice, setEditPrice] = React.useState("");
  const [editTitle, setEditTitle] = React.useState("");

  // ─── Load Data ───
  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      // 1. Load Partners
      const pRes = await fetch("/api/affiliate/partners", { cache: "no-store" });
      if (pRes.ok) {
        const pJson = await pRes.json();
        if (pJson.success && pJson.partners) {
          setPartners(pJson.partners);
          if (pJson.partners.length > 0 && !catPartner) {
            setCatPartner(pJson.partners[0].name);
            setCsvPartner(pJson.partners[0].name);
            setSinglePartner(pJson.partners[0].name);
          }
        }
      }

      // 2. Load Products
      const { data: prodData } = await supabase
        .from("affiliate_products")
        .select("*")
        .order("created_at", { ascending: false });

      if (prodData) {
        setProducts(prodData);
      }
    } catch (err: any) {
      console.warn("Failed to load affiliate data:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, catPartner]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Analytics Computations ───
  const totalClicks = React.useMemo(() => {
    return products.reduce((acc, p) => acc + (p.clicks_count || p.clicks || 0), 0);
  }, [products]);

  const partnerStats = React.useMemo(() => {
    const stats: Record<string, { count: number; clicks: number; color: string }> = {};
    for (const p of products) {
      const pName = p.partner_name || "სხვა";
      if (!stats[pName]) {
        const matchedPartner = partners.find((m) => m.name.toLowerCase() === pName.toLowerCase());
        stats[pName] = {
          count: 0,
          clicks: 0,
          color: matchedPartner?.badge_color || "#16a34a",
        };
      }
      stats[pName].count += 1;
      stats[pName].clicks += p.clicks_count || p.clicks || 0;
    }
    return stats;
  }, [products, partners]);

  // ─── Filtered Products ───
  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.partner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPartner =
        selectedPartnerFilter === "ALL" ||
        p.partner_name.toLowerCase() === selectedPartnerFilter.toLowerCase();

      const matchesCategory =
        selectedCategoryFilter === "ALL" ||
        p.category === selectedCategoryFilter ||
        p.matching_tags?.includes(selectedCategoryFilter);

      return matchesSearch && matchesPartner && matchesCategory;
    });
  }, [products, searchQuery, selectedPartnerFilter, selectedCategoryFilter]);

  // ─── Handler: Category Bulk Scrape ───
  const handleScrapeCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catUrl.trim()) {
      showNotice(" შეიყვანეთ კატეგორიის URL");
      return;
    }

    setScrapingCat(true);
    setScrapedCatItems([]);
    setSelectedCatIndices(new Set());

    try {
      const res = await fetch("/api/affiliate/scrape-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryUrl: catUrl.trim(),
          partnerName: catPartner,
          limit: catLimit,
          categoryOverride: catCategoryOverride !== "AUTO" ? catCategoryOverride : undefined,
          autoSave: false,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "კატეგორიის სკრეიპინგი ვერ შესრულდა");

      if (json.items && json.items.length > 0) {
        setScrapedCatItems(json.items);
        setSelectedCatIndices(new Set(json.items.map((_: any, idx: number) => idx)));
        showNotice(` ამოღებულია ${json.items.length} პროდუქტი კატეგორიიდან!`);
      } else {
        showNotice(`⚠️ ${json.message || "პროდუქტები ვერ მოიძებნა"}`);
      }
    } catch (err: any) {
      showNotice(` შეცდომა: ${err.message}`);
    } finally {
      setScrapingCat(false);
    }
  };

  const handleUpdateItemCategoryInPreview = (index: number, newCategory: string) => {
    setScrapedCatItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, category: newCategory } : item))
    );
  };

  const handleUpdateProductCategory = async (id: string, newCategory: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, category: newCategory } : p))
    );
    await supabase.from("affiliate_products").update({ category: newCategory }).eq("id", id);
    showNotice(`კატეგორია განახლდა: "${newCategory}"`);
  };

  const handleBatchDeleteByStore = async (storeName: string) => {
    const count = partnerStats[storeName]?.count || 0;
    if (!confirm(`ნამდვილად გსურთ წაშალოთ "${storeName}"-ის ყველა (${count}) პროდუქტი?`)) return;
    setProducts((prev) => prev.filter((p) => p.partner_name.toLowerCase() !== storeName.toLowerCase()));
    await supabase.from("affiliate_products").delete().ilike("partner_name", storeName);
    showNotice(`"${storeName}"-ის ყველა პროდუქტი წაიშალა`);
  };

  // ─── Handler: Save Selected Category Items ───
  const handleSaveSelectedCategoryItems = async () => {
    if (selectedCatIndices.size === 0) {
      showNotice(" აირჩიეთ მინიმუმ ერთი პროდუქტი შესანახად");
      return;
    }

    setSavingCatItems(true);
    try {
      const itemsToSave = scrapedCatItems
        .filter((_, idx) => selectedCatIndices.has(idx))
        .map((item) => ({
          partner_name: catPartner,
          product_name: item.productName,
          description: item.description,
          image_url: item.imageUrl,
          product_url: item.productUrl,
          price: item.price || 0,
          currency: item.currency || "GEL",
          commission_pct: 5,
          category: item.category,
          matching_tags: item.matchingTags,
          is_active: true,
        }));

      const res = await fetch("/api/affiliate/import-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itemsToSave,
          partnerName: catPartner,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "შენახვა ვერ შესრულდა");

      showNotice(` ${json.insertedCount || itemsToSave.length} პროდუქტი წარმატებით შეინახა ბაზაში!`);
      setScrapedCatItems([]);
      setSelectedCatIndices(new Set());
      setCatUrl("");
      loadData();
    } catch (err: any) {
      showNotice(` შეცდომა: ${err.message}`);
    } finally {
      setSavingCatItems(false);
    }
  };

  // ─── Handler: CSV / File Bulk Import ───
  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) {
      showNotice(" ჩასვით CSV ტექსტი ან ატვირთეთ ფაილი");
      return;
    }

    setImportingCsv(true);
    try {
      const res = await fetch("/api/affiliate/import-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvText: csvText.trim(),
          partnerName: csvPartner,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "იმპორტი ვერ მოხერხდა");

      showNotice(` წარმატებით იმპორტირდა ${json.insertedCount} პროდუქტი!`);
      setCsvText("");
      loadData();
    } catch (err: any) {
      showNotice(` იმპორტის შეცდომა: ${err.message}`);
    } finally {
      setImportingCsv(false);
    }
  };

  // ─── Handler: File upload to CSV text ───
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        setCsvText(text);
        showNotice(` ფაილი ჩაიტვირთა (${file.name})`);
      }
    };
    reader.readAsText(file);
  };

  // ─── Handler: Single URL Scrape ───
  const handleScrapeSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleUrl.trim()) {
      showNotice(" შეიყვანეთ პროდუქტის URL");
      return;
    }

    setScrapingSingle(true);
    setSinglePreview(null);
    try {
      const res = await fetch("/api/affiliate/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: singleUrl.trim(),
          partnerName: singlePartner,
          commissionPct: parseFloat(singleCommission || "5"),
          autoSave: false,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "სკრეიპინგი ვერ შესრულდა");

      setSinglePreview(json.data);
      showNotice(" პროდუქტის მონაცემები ამოღებულია!");
    } catch (err: any) {
      showNotice(` შეცდომა: ${err.message}`);
    } finally {
      setScrapingSingle(false);
    }
  };

  const handleSaveSingle = async () => {
    if (!singlePreview) return;
    try {
      const { error } = await supabase.from("affiliate_products").insert({
        partner_name: singlePreview.partnerName,
        product_name: singlePreview.productName,
        description: singlePreview.description,
        image_url: singlePreview.imageUrl,
        product_url: singlePreview.productUrl,
        price: singlePreview.price,
        currency: singlePreview.currency || "GEL",
        commission_pct: singlePreview.commissionPct || 5,
        category: singlePreview.category,
        matching_tags: singlePreview.matchingTags || [],
        is_active: true,
      });

      if (error) throw error;
      showNotice(` პროდუქტი "${singlePreview.productName}" შენახულია!`);
      setSinglePreview(null);
      setSingleUrl("");
      loadData();
    } catch (err: any) {
      showNotice(` შენახვის შეცდომა: ${err.message}`);
    }
  };

  // ─── Handler: Add New Partner Store ───
  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerName.trim()) {
      showNotice(" მიუთითეთ მაღაზიის სახელი");
      return;
    }

    setCreatingPartner(true);
    try {
      const res = await fetch("/api/affiliate/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPartnerName.trim(),
          website_url: newPartnerUrl.trim(),
          badge_color: newPartnerColor,
          referral_param_template: newPartnerRef.trim(),
          commission_rate: parseFloat(newPartnerComm || "5"),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "პარტნიორი ვერ დაემატა");

      showNotice(` პარტნიორი მაღაზია "${newPartnerName}" წარმატებით დაემატა!`);
      setNewPartnerName("");
      setNewPartnerUrl("");
      setShowPartnerForm(false);
      loadData();
    } catch (err: any) {
      showNotice(` შეცდომა: ${err.message}`);
    } finally {
      setCreatingPartner(false);
    }
  };

  // ─── Handler: Delete Partner ───
  const handleDeletePartner = async (partner: Partner) => {
    if (!confirm(`ნამდვილად წაიშალოს პარტნიორი "${partner.name}"?`)) return;
    try {
      const res = await fetch(`/api/affiliate/partners?id=${partner.id}&slug=${partner.slug}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showNotice(`️ პარტნიორი "${partner.name}" წაიშალა`);
        loadData();
      }
    } catch (err: any) {
      showNotice(` შეცდომა: ${err.message}`);
    }
  };

  // ─── Handler: Toggle Product Active ───
  const handleToggleProductActive = async (id: string, current: boolean) => {
    const next = !current;
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, is_active: next } : p)));
    await supabase.from("affiliate_products").update({ is_active: next }).eq("id", id);
    showNotice(next ? " პროდუქტი გააქტიურდა" : "⏸️ პროდუქტი დაპაუზდა");
  };

  // ─── Handlers: Partner Editing ───
  const startEditingPartner = (p: Partner) => {
    setEditingPartner(p);
    setEditPartnerName(p.name);
    setEditPartnerUrl(p.website_url || "");
    setEditPartnerColor(p.badge_color || "#16a34a");
    setEditPartnerRef(p.referral_param_template || "?ref=plantge");
    setEditPartnerComm(String(p.commission_rate || 5));
  };

  const handleUpdatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;
    setUpdatingPartner(true);
    try {
      const res = await fetch("/api/affiliate/partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPartner.id,
          name: editPartnerName.trim(),
          website_url: editPartnerUrl.trim(),
          badge_color: editPartnerColor,
          referral_param_template: editPartnerRef.trim(),
          commission_rate: parseFloat(editPartnerComm || "5"),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "პარტნიორის განახლება ვერ შესრულდა");
      showNotice(`მაღაზიის "${editPartnerName}" მონაცემები განახლდა!`);
      setEditingPartner(null);
      loadData();
    } catch (err: any) {
      showNotice(`შეცდომა: ${err.message}`);
    } finally {
      setUpdatingPartner(false);
    }
  };

  // ─── Handlers: Catalog Multi-Select & Batch Actions ───
  const handleToggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllProducts = () => {
    if (selectedProductIds.size === filteredProducts.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const handleBatchDeleteSelected = async () => {
    if (selectedProductIds.size === 0) return;
    if (!confirm(`ნამდვილად გსურთ მონიშნული ${selectedProductIds.size} პროდუქტის წაშლა?`)) return;
    setBatchOperating(true);
    try {
      const ids = Array.from(selectedProductIds);
      setProducts((prev) => prev.filter((p) => !selectedProductIds.has(p.id)));
      await supabase.from("affiliate_products").delete().in("id", ids);
      showNotice(`${ids.length} პროდუქტი წაიშალა`);
      setSelectedProductIds(new Set());
    } catch (err: any) {
      showNotice(`შეცდომა: ${err.message}`);
    } finally {
      setBatchOperating(false);
    }
  };

  const handleBatchChangeCategorySelected = async () => {
    if (selectedProductIds.size === 0) return;
    setBatchOperating(true);
    try {
      const ids = Array.from(selectedProductIds);
      setProducts((prev) =>
        prev.map((p) => (selectedProductIds.has(p.id) ? { ...p, category: batchCategory } : p))
      );
      await supabase.from("affiliate_products").update({ category: batchCategory }).in("id", ids);
      showNotice(`მონიშნულ ${ids.length} პროდუქტს მიენიჭა: "${batchCategory}"`);
      setSelectedProductIds(new Set());
    } catch (err: any) {
      showNotice(`შეცდომა: ${err.message}`);
    } finally {
      setBatchOperating(false);
    }
  };

  const handleBatchToggleActiveSelected = async (activeState: boolean) => {
    if (selectedProductIds.size === 0) return;
    setBatchOperating(true);
    try {
      const ids = Array.from(selectedProductIds);
      setProducts((prev) =>
        prev.map((p) => (selectedProductIds.has(p.id) ? { ...p, is_active: activeState } : p))
      );
      await supabase.from("affiliate_products").update({ is_active: activeState }).in("id", ids);
      showNotice(`${ids.length} პროდუქტის სტატუსი შეიცვალა: ${activeState ? "აქტიური" : "პაუზა"}`);
      setSelectedProductIds(new Set());
    } catch (err: any) {
      showNotice(`შეცდომა: ${err.message}`);
    } finally {
      setBatchOperating(false);
    }
  };

  // ─── Handlers: Product Quick Edit ───
  const startInlineEditProduct = (p: AffiliateProduct) => {
    setEditingProductId(p.id);
    setEditPrice(String(p.price || ""));
    setEditTitle(p.product_name);
  };

  const handleSaveInlineEditProduct = async (id: string) => {
    const numPrice = parseFloat(editPrice) || 0;
    const cleanTitle = editTitle.trim();
    if (!cleanTitle) return;
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, product_name: cleanTitle, price: numPrice } : p))
    );
    await supabase
      .from("affiliate_products")
      .update({ product_name: cleanTitle, price: numPrice })
      .eq("id", id);
    setEditingProductId(null);
    showNotice("პროდუქტი განახლდა");
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`წაიშალოს პროდუქტი: "${name}"?`)) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    await supabase.from("affiliate_products").delete().eq("id", id);
    showNotice(`პროდუქტი "${name}" წაიშალა`);
  };

  return (
    <div className="rounded-[24px] border border-border/80 bg-card p-5 sm:p-7 shadow-ambient space-y-7">
      {/* ─── Header & Top Stats ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-[14px] bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black text-foreground">
                Affiliate & Partner Studio (მრავალმაღაზიური სისტემა)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                მართეთ ნებისმიერი მაღაზიის (Domino, Gorgia, Agrohub, Bricorama და სხვ.) პროდუქცია, მასიური იმპორტი და კლიკების მონეტიზაცია
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="rounded-[12px] text-xs font-bold gap-1.5 border-border/80 hover:bg-surface-container cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${loading ? "animate-spin" : ""}`} />
            განახლება
          </Button>
        </div>
      </div>

      {/* ─── Metric Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-[18px] bg-surface-container-lowest border border-border/70 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>აქტიური პროდუქტები</span>
            <PackageCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-foreground">{products.length}</div>
          <span className="text-[10px] text-muted-foreground">ბაზაში განთავსებული</span>
        </div>

        <div className="p-4 rounded-[18px] bg-surface-container-lowest border border-border/70 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>სულ გადასვლები (Clicks)</span>
            <MousePointerClick className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-primary">{totalClicks}</div>
          <span className="text-[10px] text-muted-foreground">გამავალი რეფერალური კლიკი</span>
        </div>

        <div className="p-4 rounded-[18px] bg-surface-container-lowest border border-border/70 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>პარტნიორი მაღაზიები</span>
            <Store className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-foreground">{partners.length}</div>
          <span className="text-[10px] text-muted-foreground">დაკავშირებული ქსელი</span>
        </div>

        <div className="p-4 rounded-[18px] bg-surface-container-lowest border border-border/70 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>ტოპ მაღაზია</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg font-black text-foreground truncate">
            {Object.entries(partnerStats).sort((a, b) => b[1].clicks - a[1].clicks)[0]?.[0] || "—"}
          </div>
          <span className="text-[10px] text-muted-foreground">ყველაზე მეტი გადასვლით</span>
        </div>
      </div>

      {/* ─── Subtabs Switcher ─── */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-surface-container rounded-[16px] border border-border/60">
        <button
          type="button"
          onClick={() => setActiveSubTab("bulk_category")}
          className={`px-3.5 py-2 rounded-[12px] text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === "bulk_category"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>🌐 კატეგორიის სკრეიპერი (Bulk)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("csv_import")}
          className={`px-3.5 py-2 rounded-[12px] text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === "csv_import"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-primary" />
          <span>📁 Excel / CSV იმპორტი</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("single_scraper")}
          className={`px-3.5 py-2 rounded-[12px] text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === "single_scraper"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>🔗 ერთეული URL</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("partners")}
          className={`px-3.5 py-2 rounded-[12px] text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === "partners"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Store className="w-4 h-4 text-purple-600" />
          <span>🏪 მაღაზიების მართვა ({partners.length})</span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* SUBTAB 1: BULK CATEGORY WEB CRAWLER                                   */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === "bulk_category" && (
        <div className="space-y-4">
          <form onSubmit={handleScrapeCategory} className="p-4 sm:p-5 rounded-[20px] bg-secondary-container/30 border border-border/70 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>კატეგორიის URL ნებისმიერი საიტიდან</span>
              </label>
              <span className="text-[11px] text-muted-foreground">
                მაგ. Domino-ს, Gorgia-ს ან სხვა მაღაზიის ქოთნების/მიწის კატეგორია
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
              <div className="md:col-span-4">
                <input
                  type="url"
                  required
                  value={catUrl}
                  onChange={(e) => setCatUrl(e.target.value)}
                  placeholder="https://gorgia.ge/... ან https://domino.com.ge/..."
                  className="w-full h-10 px-3.5 rounded-[12px] border border-border/80 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <select
                  value={catPartner}
                  onChange={(e) => setCatPartner(e.target.value)}
                  className="w-full h-10 px-3 rounded-[12px] border border-border/80 text-xs bg-background focus:outline-none font-bold text-foreground cursor-pointer"
                  title="პარტნიორი მაღაზია"
                >
                  {partners.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <select
                  value={catCategoryOverride}
                  onChange={(e) => setCatCategoryOverride(e.target.value)}
                  className="w-full h-10 px-2.5 rounded-[12px] border border-border/80 text-xs bg-background focus:outline-none font-bold text-foreground cursor-pointer"
                  title="კატეგორიის მინიჭება"
                >
                  <option value="AUTO">🎯 ავტომატური ამოცნობა</option>
                  {AFFILIATE_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.nameKa}>
                      {c.nameKa}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3 flex gap-2">
                <select
                  value={catLimit}
                  onChange={(e) => setCatLimit(Number(e.target.value))}
                  className="w-20 h-10 px-2 rounded-[12px] border border-border/80 text-xs bg-background focus:outline-none font-bold text-foreground cursor-pointer"
                  title="რაოდენობის ლიმიტი"
                >
                  <option value={15}>15 ც</option>
                  <option value={30}>30 ც</option>
                  <option value={50}>50 ც</option>
                  <option value={100}>100 ც</option>
                </select>

                <Button
                  type="submit"
                  disabled={scrapingCat}
                  className="flex-1 h-10 rounded-[12px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-ambient cursor-pointer"
                >
                  {scrapingCat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{scrapingCat ? "ამოღება..." : "ამოღება"}</span>
                </Button>
              </div>
            </div>
          </form>

          {/* Scraped Results Preview */}
          {scrapedCatItems.length > 0 && (
            <div className="rounded-[20px] border border-emerald-500/40 bg-emerald-500/5 p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-3">
                <div>
                  <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>ამოღებულია {scrapedCatItems.length} პროდუქტი ({catPartner})</span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    მონიშნულია {selectedCatIndices.size} პროდუქტი შესანახად
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedCatIndices.size === scrapedCatItems.length) {
                        setSelectedCatIndices(new Set());
                      } else {
                        setSelectedCatIndices(new Set(scrapedCatItems.map((_, i) => i)));
                      }
                    }}
                    className="rounded-[10px] text-xs font-bold"
                  >
                    {selectedCatIndices.size === scrapedCatItems.length ? "მონიშვნის მოხსნა" : "ყველას მონიშვნა"}
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    disabled={savingCatItems || selectedCatIndices.size === 0}
                    onClick={handleSaveSelectedCategoryItems}
                    className="rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5"
                  >
                    {savingCatItems ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PackageCheck className="w-3.5 h-3.5" />}
                    <span>შენახვა ბაზაში ({selectedCatIndices.size})</span>
                  </Button>
                </div>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
                {scrapedCatItems.map((item, idx) => {
                  const isChecked = selectedCatIndices.has(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        const next = new Set(selectedCatIndices);
                        if (next.has(idx)) next.delete(idx);
                        else next.add(idx);
                        setSelectedCatIndices(next);
                      }}
                      className={`p-3 rounded-[16px] border transition-all cursor-pointer flex gap-3 items-start ${
                        isChecked
                          ? "bg-background border-emerald-500/60 shadow-sm"
                          : "bg-surface-container/50 border-border/60 opacity-60"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-1 rounded cursor-pointer"
                      />

                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="h-14 w-14 rounded-[10px] object-cover bg-surface-container shrink-0 border border-border/50"
                        />
                      )}

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <select
                            value={item.category || "ქოთნები & კაშპო"}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleUpdateItemCategoryInPreview(idx, e.target.value);
                            }}
                            className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded px-1.5 py-0.5 cursor-pointer focus:outline-none"
                            title="კატეგორიის შეცვლა"
                          >
                            {AFFILIATE_CATEGORIES.map((c) => (
                              <option key={c.id} value={c.nameKa}>
                                {c.nameKa}
                              </option>
                            ))}
                          </select>
                          {item.price && (
                            <span className="text-xs font-black text-primary">
                              {item.price} ₾
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-foreground line-clamp-2 leading-tight">
                          {item.productName}
                        </h4>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* SUBTAB 2: EXCEL / CSV BULK IMPORT                                     */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === "csv_import" && (
        <div className="space-y-4">
          <form onSubmit={handleImportCsv} className="p-4 sm:p-5 rounded-[20px] bg-secondary-container/30 border border-border/70 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-primary" />
                  <span>CSV ან Excel პროდუქტების იმპორტი</span>
                </label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  ატვირთეთ ფაილი ან პირდაპირ ჩასვით ტექსტი. სვეტები: <code className="text-primary font-bold">title, price, image_url, product_url, category</code>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-background border border-border/80 text-xs font-bold text-foreground hover:bg-surface-container cursor-pointer shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-primary" />
                  <span>ფაილის არჩევა (.csv)</span>
                  <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                  პარტნიორი მაღაზია
                </label>
                <select
                  value={csvPartner}
                  onChange={(e) => setCsvPartner(e.target.value)}
                  className="w-full h-10 px-3 rounded-[12px] border border-border/80 text-xs bg-background focus:outline-none font-bold text-foreground cursor-pointer"
                >
                  {partners.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                  შაბლონის მაგალითი (შეგიძლიათ დააკოპიროთ):
                </label>
                <div className="text-[10px] font-mono bg-background p-2 rounded-[10px] border border-border/60 text-muted-foreground truncate">
                  title, price, image_url, product_url, category
                </div>
              </div>
            </div>

            <div>
              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={`title, price, image_url, product_url, category\nკერამიკული ქოთანი 25სმ, 24.50, https://..., https://..., ქოთნები\nტორფი და სუბსტრატი 10ლ, 15.00, https://..., https://..., სუბსტრატი`}
                className="w-full p-3.5 rounded-[14px] border border-border/80 text-xs font-mono bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={importingCsv || !csvText.trim()}
                className="h-10 px-6 rounded-[12px] bg-primary hover:bg-primary/90 text-white font-bold text-xs gap-1.5 cursor-pointer shadow-ambient"
              >
                {importingCsv ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                <span>{importingCsv ? "მიმდინარეობს იმპორტი..." : "ბაზაში იმპორტირება"}</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* SUBTAB 3: SINGLE URL SCRAPER                                          */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === "single_scraper" && (
        <div className="space-y-4">
          <form onSubmit={handleScrapeSingle} className="p-4 sm:p-5 rounded-[20px] bg-secondary-container/30 border border-border/70 space-y-3">
            <label className="text-xs font-extrabold text-foreground block">
              კონკრეტული 1 პროდუქტის URL
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-6">
                <input
                  type="url"
                  required
                  value={singleUrl}
                  onChange={(e) => setSingleUrl(e.target.value)}
                  placeholder="https://gorgia.ge/ka/product/ceramic-pot-25cm..."
                  className="w-full h-10 px-3 rounded-[12px] border border-border/80 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                />
              </div>
              <div className="sm:col-span-3">
                <select
                  value={singlePartner}
                  onChange={(e) => setSinglePartner(e.target.value)}
                  className="w-full h-10 px-3 rounded-[12px] border border-border/80 text-xs bg-background focus:outline-none font-bold text-foreground cursor-pointer"
                >
                  {partners.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-3">
                <Button
                  type="submit"
                  disabled={scrapingSingle}
                  className="w-full h-10 rounded-[12px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-ambient cursor-pointer"
                >
                  {scrapingSingle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{scrapingSingle ? "სკრეიპინგი..." : "ამოღება"}</span>
                </Button>
              </div>
            </div>
          </form>

          {/* Live Preview Card */}
          {singlePreview && (
            <div className="rounded-[20px] border border-emerald-500/40 bg-emerald-500/5 p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ამოღებული პროდუქტის მონაცემები
                </span>
                <Button
                  size="sm"
                  onClick={handleSaveSingle}
                  className="rounded-[12px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-ambient cursor-pointer"
                >
                  ბაზაში შენახვა
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-4">
                {singlePreview.imageUrl && (
                  <div className="h-20 w-20 rounded-[14px] overflow-hidden bg-surface-container shrink-0 border border-border/60">
                    <img
                      src={singlePreview.imageUrl}
                      alt={singlePreview.productName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {singlePreview.partnerName}
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      კატეგორია: {singlePreview.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground">
                    {singlePreview.productName}
                  </h3>
                  <div className="flex items-center gap-2 pt-1">
                    {singlePreview.price && (
                      <span className="text-sm font-black text-primary">
                        {singlePreview.price} {singlePreview.currency}
                      </span>
                    )}
                    {singlePreview.matchingTags?.map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-[9px]">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* SUBTAB 4: PARTNER STORES MANAGEMENT                                   */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === "partners" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div>
              <h3 className="text-sm font-black text-foreground">
                პარტნიორი ქსელები & საკომისიოები
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                დაამატეთ ნებისმიერი მაღაზია და მიუთითეთ მათი რეფერალური პარამეტრი
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => setShowPartnerForm(!showPartnerForm)}
              className="rounded-[12px] bg-primary text-white text-xs font-bold gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showPartnerForm ? "დახურვა" : "+ ახალი მაღაზია"}</span>
            </Button>
          </div>

          {/* New Partner Creation Form */}
          {showPartnerForm && (
            <form onSubmit={handleCreatePartner} className="p-4 sm:p-5 rounded-[20px] bg-surface-container border border-border/80 space-y-4 animate-in fade-in">
              <h4 className="text-xs font-black text-foreground uppercase tracking-wider">
                ახალი პარტნიორი მაღაზიის დამატება
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                    მაღაზიის სახელი *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPartnerName}
                    onChange={(e) => setNewPartnerName(e.target.value)}
                    placeholder="მაგ. Domino, Gorgia, Nova..."
                    className="w-full h-9 px-3 rounded-[10px] border border-border/80 text-xs bg-background focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                    ვებსაიტი
                  </label>
                  <input
                    type="url"
                    value={newPartnerUrl}
                    onChange={(e) => setNewPartnerUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full h-9 px-3 rounded-[10px] border border-border/80 text-xs bg-background focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                    რეფერალური პარამეტრი
                  </label>
                  <input
                    type="text"
                    value={newPartnerRef}
                    onChange={(e) => setNewPartnerRef(e.target.value)}
                    placeholder="?ref=plantge"
                    className="w-full h-9 px-3 rounded-[10px] border border-border/80 text-xs bg-background focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                    ბეიჯის ფერი
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newPartnerColor}
                      onChange={(e) => setNewPartnerColor(e.target.value)}
                      className="h-9 w-12 rounded-[10px] border border-border/80 cursor-pointer bg-background p-0.5"
                    />
                    <input
                      type="text"
                      value={newPartnerColor}
                      onChange={(e) => setNewPartnerColor(e.target.value)}
                      className="flex-1 h-9 px-2 rounded-[10px] border border-border/80 text-xs font-mono bg-background"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPartnerForm(false)}
                  className="rounded-[10px] text-xs font-bold"
                >
                  გაუქმება
                </Button>
                <Button
                  type="submit"
                  disabled={creatingPartner}
                  size="sm"
                  className="rounded-[10px] bg-primary text-white text-xs font-bold gap-1"
                >
                  {creatingPartner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>შენახვა</span>
                </Button>
              </div>
            </form>
          )}

          {/* Edit Partner Form */}
          {editingPartner && (
            <form onSubmit={handleUpdatePartner} className="p-4 sm:p-5 rounded-[20px] bg-primary/5 border border-primary/40 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
                  <Edit2 className="w-3.5 h-3.5 text-primary" />
                  <span>მაღაზიის რედაქტირება: {editingPartner.name}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setEditingPartner(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">სახელი</label>
                  <input
                    type="text"
                    required
                    value={editPartnerName}
                    onChange={(e) => setEditPartnerName(e.target.value)}
                    className="w-full h-9 px-3 rounded-[10px] border border-border/80 text-xs bg-background focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">ვებსაიტი</label>
                  <input
                    type="url"
                    value={editPartnerUrl}
                    onChange={(e) => setEditPartnerUrl(e.target.value)}
                    className="w-full h-9 px-3 rounded-[10px] border border-border/80 text-xs bg-background focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">რეფერალური პარამეტრი</label>
                  <input
                    type="text"
                    value={editPartnerRef}
                    onChange={(e) => setEditPartnerRef(e.target.value)}
                    placeholder="?ref=plantge"
                    className="w-full h-9 px-3 rounded-[10px] border border-border/80 text-xs bg-background focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">საკომისიო %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editPartnerComm}
                    onChange={(e) => setEditPartnerComm(e.target.value)}
                    className="w-full h-9 px-3 rounded-[10px] border border-border/80 text-xs bg-background focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">ფერი</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={editPartnerColor}
                      onChange={(e) => setEditPartnerColor(e.target.value)}
                      className="h-9 w-10 rounded-[8px] border border-border/80 cursor-pointer bg-background p-0.5"
                    />
                    <input
                      type="text"
                      value={editPartnerColor}
                      onChange={(e) => setEditPartnerColor(e.target.value)}
                      className="flex-1 h-9 px-2 rounded-[8px] border border-border/80 text-xs font-mono bg-background"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingPartner(null)}
                  className="rounded-[10px] text-xs font-bold"
                >
                  გაუქმება
                </Button>
                <Button
                  type="submit"
                  disabled={updatingPartner}
                  size="sm"
                  className="rounded-[10px] bg-primary text-white text-xs font-bold gap-1"
                >
                  {updatingPartner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>განახლება</span>
                </Button>
              </div>
            </form>
          )}

          {/* Partners Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {partners.map((p) => {
              const stat = partnerStats[p.name] || { count: 0, clicks: 0, color: p.badge_color };
              return (
                <div
                  key={p.id}
                  className="p-4 rounded-[18px] border border-border/70 bg-card space-y-3 shadow-2xs hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: p.badge_color }}
                      />
                      <h4 className="text-sm font-black text-foreground">{p.name}</h4>
                    </div>

                    <span className="text-[10px] font-bold text-muted-foreground bg-surface-container px-2 py-0.5 rounded-full">
                      {p.commission_rate}% საკომისიო
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-border/40">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">პროდუქტები</span>
                      <span className="font-extrabold text-foreground">{stat.count} ცალი</span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block text-[10px]">გადასვლები</span>
                      <span className="font-black text-primary">{stat.clicks} კლიკი</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {p.website_url && (
                        <a
                          href={p.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-muted-foreground hover:text-primary rounded-md"
                          title="საიტის გახსნა"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => startEditingPartner(p)}
                        className="p-1.5 text-muted-foreground hover:text-primary rounded-md cursor-pointer"
                        title="რედაქტირება"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePartner(p)}
                        className="p-1.5 text-muted-foreground hover:text-destructive rounded-md cursor-pointer"
                        title="წაშლა"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* PRODUCTS CATALOG & FILTERS                                            */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4 pt-4 border-t border-border/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-emerald-600" />
              <span>პროდუქტების კატალოგი ({filteredProducts.length})</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              საიტზე განთავსებული პარტნიორი პროდუქცია და მათი სტატისტიკა
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ძებნა სახელით..."
                className="h-9 pl-8 pr-3 rounded-[10px] border border-border/80 text-xs bg-background focus:outline-none w-36 sm:w-44"
              />
            </div>

            <select
              value={selectedPartnerFilter}
              onChange={(e) => setSelectedPartnerFilter(e.target.value)}
              className="h-9 px-2.5 rounded-[10px] border border-border/80 text-xs bg-background focus:outline-none font-bold text-foreground cursor-pointer"
            >
              <option value="ALL">ყველა მაღაზია</option>
              {partners.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="h-9 px-2.5 rounded-[10px] border border-border/80 text-xs bg-background focus:outline-none font-bold text-foreground cursor-pointer"
            >
              <option value="ALL">ყველა კატეგორია</option>
              {AFFILIATE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.nameKa}>
                  {c.nameKa}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Store Chips / Quick Filters */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setSelectedPartnerFilter("ALL")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedPartnerFilter === "ALL"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-surface-container text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>ყველა</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/20 font-black">
              {products.length}
            </span>
          </button>

          {partners.map((p) => {
            const count = partnerStats[p.name]?.count || 0;
            const isSelected = selectedPartnerFilter.toLowerCase() === p.name.toLowerCase();
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPartnerFilter(isSelected ? "ALL" : p.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "text-white shadow-sm"
                    : "bg-surface-container text-muted-foreground hover:text-foreground"
                }`}
                style={isSelected ? { backgroundColor: p.badge_color } : {}}
              >
                <span>{p.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/25 font-black">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Store Actions Banner */}
        {selectedPartnerFilter !== "ALL" && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-[14px] bg-secondary-container/30 border border-border/70 text-xs">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-primary" />
              <span className="font-bold text-foreground">
                მაღაზია: <span className="text-primary font-black">{selectedPartnerFilter}</span> (ნაპოვნია {filteredProducts.length} პროდუქტი)
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleBatchDeleteByStore(selectedPartnerFilter)}
              className="h-7 rounded-[8px] text-destructive hover:bg-destructive/10 border-destructive/30 text-xs font-bold gap-1 cursor-pointer self-start sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ამ მაღაზიის ყველა პროდუქტის წაშლა ({partnerStats[selectedPartnerFilter]?.count || 0})</span>
            </Button>
          </div>
        )}

        {/* Selection & Batch Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAllProducts}
              className="h-8 rounded-[10px] text-xs font-bold border-border/80 cursor-pointer"
            >
              {selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0
                ? "მონიშვნის მოხსნა"
                : `ყველას მონიშვნა (${filteredProducts.length})`}
            </Button>
            {selectedProductIds.size > 0 && (
              <span className="text-xs font-bold text-primary">
                მონიშნულია {selectedProductIds.size} პროდუქტი
              </span>
            )}
          </div>
        </div>

        {/* Highlighted Sticky Batch Actions */}
        {selectedProductIds.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-[16px] bg-emerald-500/10 border border-emerald-500/30 text-xs animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>მონიშნულია <strong className="text-primary">{selectedProductIds.size}</strong> პროდუქტი</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <select
                  value={batchCategory}
                  onChange={(e) => setBatchCategory(e.target.value)}
                  className="h-8 px-2 rounded-[8px] border border-border/80 text-xs bg-background focus:outline-none font-bold text-foreground cursor-pointer"
                >
                  {AFFILIATE_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.nameKa}>{c.nameKa}</option>
                  ))}
                </select>
                <Button
                  type="button"
                  size="sm"
                  disabled={batchOperating}
                  onClick={handleBatchChangeCategorySelected}
                  className="h-8 rounded-[8px] bg-primary text-white text-xs font-bold px-2.5 cursor-pointer"
                >
                  კატეგორიის მინიჭება
                </Button>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={batchOperating}
                onClick={() => handleBatchToggleActiveSelected(true)}
                className="h-8 rounded-[8px] text-xs font-bold px-2.5 cursor-pointer"
              >
                გააქტიურება
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={batchOperating}
                onClick={() => handleBatchToggleActiveSelected(false)}
                className="h-8 rounded-[8px] text-xs font-bold px-2.5 cursor-pointer"
              >
                დაპაუზება
              </Button>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={batchOperating}
                onClick={handleBatchDeleteSelected}
                className="h-8 rounded-[8px] text-xs font-bold px-2.5 gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>წაშლა ({selectedProductIds.size})</span>
              </Button>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-10 rounded-[20px] border border-dashed border-border/80 bg-surface-container/20">
            <PackageCheck className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-xs text-muted-foreground font-semibold">
              პროდუქტები ვერ მოიძებნა. დაამატეთ კატეგორიის სკრეიპერით ან CSV იმპორტით.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((p) => {
              const partner = partners.find((m) => m.name.toLowerCase() === p.partner_name.toLowerCase());
              const badgeColor = partner?.badge_color || "#16a34a";
              const clicks = p.clicks_count || p.clicks || 0;
              const isSelected = selectedProductIds.has(p.id);
              const isInlineEditing = editingProductId === p.id;

              return (
                <div
                  key={p.id}
                  className={`rounded-[18px] border bg-card p-3.5 shadow-2xs space-y-2.5 flex flex-col justify-between transition-all ${
                    isSelected ? "ring-2 ring-primary border-primary" : ""
                  } ${
                    p.is_active ? "border-border/80" : "border-border/50 opacity-60 bg-surface-container/40"
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectProduct(p.id)}
                        className="mt-1 rounded cursor-pointer shrink-0"
                      />

                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.product_name}
                          className="h-14 w-14 rounded-[12px] object-cover bg-surface-container shrink-0 border border-border/60"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-[12px] bg-surface-container flex items-center justify-center shrink-0 border border-border/60 text-muted-foreground">
                          <PackageCheck className="w-5 h-5 opacity-40" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className="text-[9px] font-black px-1.5 py-0.5 rounded text-white tracking-tight"
                            style={{ backgroundColor: badgeColor }}
                          >
                            {p.partner_name}
                          </span>
                          <select
                            value={p.category || "ქოთნები & კაშპო"}
                            onChange={(e) => handleUpdateProductCategory(p.id, e.target.value)}
                            className="text-[10px] font-bold bg-surface-container border border-border/70 rounded px-1.5 py-0.5 text-foreground cursor-pointer focus:outline-none max-w-[125px] truncate"
                            title="კატეგორიის შეცვლა"
                          >
                            {AFFILIATE_CATEGORIES.map((c) => (
                              <option key={c.id} value={c.nameKa}>
                                {c.nameKa}
                              </option>
                            ))}
                          </select>
                        </div>

                        {isInlineEditing ? (
                          <div className="space-y-1.5 mt-1.5">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full h-7 px-2 rounded-[6px] border border-border/80 text-xs bg-background focus:outline-none"
                              placeholder="სათაური"
                            />
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="0.01"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                className="w-20 h-7 px-2 rounded-[6px] border border-border/80 text-xs bg-background focus:outline-none font-bold"
                                placeholder="ფასი"
                              />
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleSaveInlineEditProduct(p.id)}
                                className="h-7 px-2 rounded-[6px] bg-primary text-white text-[10px] font-bold"
                              >
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingProductId(null)}
                                className="h-7 px-1.5 rounded-[6px] text-[10px]"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h4 className="text-xs font-bold text-foreground line-clamp-2 leading-tight mt-1" title={p.product_name}>
                              {p.product_name}
                            </h4>

                            {p.price !== undefined && p.price !== null && (
                              <span className="text-xs font-black text-primary block mt-0.5">
                                {p.price} {p.currency || "₾"}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Matching Tags */}
                    {p.matching_tags && p.matching_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.matching_tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] font-semibold text-muted-foreground bg-surface-container px-1.5 py-0.2 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer & Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <MousePointerClick className="w-3 h-3" />
                        <span>{clicks}</span>
                      </span>

                      <a
                        href={p.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                        title="მაღაზიაში ნახვა"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startInlineEditProduct(p)}
                        className="p-1 text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                        title="სწრაფი რედაქტირება"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleProductActive(p.id, p.is_active)}
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full cursor-pointer transition-all ${
                          p.is_active
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {p.is_active ? "აქტიური" : "პაუზა"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p.id, p.product_name)}
                        className="p-1 text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
                        title="წაშლა"
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
  );
}
