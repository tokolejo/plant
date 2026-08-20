"use client";

import * as React from "react";
import { useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { uploadListingImage } from "@/utils/supabase/storage";
import { compressImagesBatch } from "@/utils/image-compression";
import { 
  Sprout, 
  Layers, 
  Upload, 
  X, 
  Truck, 
  RefreshCw, 
  AlertCircle, 
  Check, 
  Sparkles, 
  Loader2, 
  Wand2, 
  Leaf,
  MapPin,
  Navigation,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface GeminiPlantRecognitionResult {
  latinName?: string;
  nameKa: string;
  nameEn: string;
  titleKa: string;
  titleEn: string;
  descKa: string;
  descEn: string;
  category: "PLANT" | "INVENTORY";
  careLevel?: string;
  light?: string;
  watering?: string;
  tags?: string[];
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export default function CreateListingPage() {
  const router = useRouter();
  const locale = useLocale();
  const isEn = locale === "en";
  const supabase = createClient();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Form State
  const [itemType, setItemType] = React.useState<"PLANT" | "INVENTORY">("PLANT");
  const [transactionType, setTransactionType] = React.useState<"FIXED" | "NEGOTIABLE" | "TRADE" | "GIFT">("FIXED");
  const [titleKa, setTitleKa] = React.useState("");
  const [titleEn, setTitleEn] = React.useState("");
  const [descKa, setDescKa] = React.useState("");
  const [descEn, setDescEn] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [city, setCity] = React.useState("თბილისი");
  const [address, setAddress] = React.useState("");
  
  const [deliveryMethods, setDeliveryMethods] = React.useState<string[]>(["PICKUP"]);
  const [tagInput, setTagInput] = React.useState("");
  const [tradeTags, setTradeTags] = React.useState<string[]>([]);
  
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [previews, setPreviews] = React.useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<string>("");
  const [errorMsg, setErrorMsg] = React.useState("");

  // Gemini AI Plant Recognition State
  const [aiDetecting, setAiDetecting] = React.useState(false);
  const [aiResult, setAiResult] = React.useState<GeminiPlantRecognitionResult | null>(null);
  const [aiApplied, setAiApplied] = React.useState(false);

  // GPS Location auto-fill State
  const [gpsLoading, setGpsLoading] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);

    if (selectedFiles.length + newFiles.length > 5) {
      setErrorMsg("მაქსიმუმ 5 ფოტოს ატვირთვაა შესაძლებელი!");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }

    // Support high-resolution mobile camera uploads up to 15MB per file
    const MAX_ALLOWED_MB = 15;
    for (const file of newFiles) {
      if (file.size > MAX_ALLOWED_MB * 1024 * 1024) {
        setErrorMsg(`ფაილი "${file.name}" აღემატება ${MAX_ALLOWED_MB}MB-ს.`);
        setTimeout(() => setErrorMsg(""), 4000);
        return;
      }
    }

    const updatedFiles = [...selectedFiles, ...newFiles].slice(0, 5);
    setSelectedFiles(updatedFiles);
    const newPreviews = updatedFiles.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviews);
    setErrorMsg("");
    
    // Reset AI state on new files
    setAiResult(null);
    setAiApplied(false);
  };

  const removeImage = (idx: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== idx);
    setSelectedFiles(updatedFiles);
    setPreviews(updatedFiles.map((file) => URL.createObjectURL(file)));
    if (updatedFiles.length === 0) {
      setAiResult(null);
      setAiApplied(false);
    }
  };

  // ──────────────────────────────────────────────
  // Real Google Gemini AI Vision: INSTANT AUTO-FILL
  // ──────────────────────────────────────────────
  const handleAiAutoFill = async () => {
    if (selectedFiles.length === 0) {
      setErrorMsg("გთხოვთ ჯერ ატვირთოთ მინიმუმ 1 ფოტო AI ამოცნობისთვის!");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }

    setAiDetecting(true);
    setErrorMsg("");

    try {
      const firstFile = selectedFiles[0];
      const base64 = await fileToBase64(firstFile);

      const res = await fetch("/api/ai/recognize-plant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: firstFile.type || "image/jpeg",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "მცენარის ამოცნობა ვერ მოხერხდა");
      }

      const result: GeminiPlantRecognitionResult = data.data;
      setAiResult(result);

      // DIRECT INSTANT AUTO-FILL: Titles, Descriptions, ItemType, Tags (WITHOUT modifying price)
      if (result.titleKa) setTitleKa(result.titleKa);
      if (result.titleEn) setTitleEn(result.titleEn);
      if (result.descKa) setDescKa(result.descKa);
      if (result.descEn) setDescEn(result.descEn);
      if (result.category) setItemType(result.category);
      if (result.tags && Array.isArray(result.tags)) {
        setTradeTags((prev) => Array.from(new Set([...prev, ...result.tags!])));
      }

      setAiApplied(true);
    } catch (err: any) {
      console.error("AI Plant Recognition Error:", err);
      setErrorMsg(`AI ამოცნობა: ${err.message || "სცადეთ ხელახლა"}`);
      setTimeout(() => setErrorMsg(""), 5000);
    } finally {
      setAiDetecting(false);
    }
  };

  // ──────────────────────────────────────────────
  // GPS Location & Address Reverse Geocoding
  // ──────────────────────────────────────────────
  const handleAutoFillAddressWithGPS = () => {
    if (!navigator.geolocation) {
      setErrorMsg("თქვენს ბრაუზერში GPS მხარდაჭერილი არ არის.");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }
    setGpsLoading(true);
    setErrorMsg("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ka`,
            { headers: { "User-Agent": "PlantApp/1.0" } }
          );
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            const detectedCity = addr.city || addr.town || addr.village || addr.county || "თბილისი";
            const districtParts = [
              addr.neighbourhood || addr.suburb || addr.quarter || addr.city_district,
              addr.road ? `${addr.road} ${addr.house_number || ""}`.trim() : null,
            ].filter(Boolean);

            const detectedAddress = districtParts.join(", ");

            if (detectedCity) setCity(detectedCity);
            if (detectedAddress) setAddress(detectedAddress);
          }
        } catch (e) {
          console.warn("GPS reverse geocode error:", e);
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === 1) {
          setErrorMsg("GPS წვდომა უარყოფილია. გთხოვთ ბრაუზერში დაუშვათ ლოკაცია.");
        } else {
          setErrorMsg("GPS სიგნალი ვერ მოიძებნა.");
        }
        setTimeout(() => setErrorMsg(""), 4000);
      },
      { timeout: 8000, maximumAge: 60000, enableHighAccuracy: true }
    );
  };

  const toggleDelivery = (method: string) => {
    if (deliveryMethods.includes(method)) {
      if (deliveryMethods.length > 1) {
        setDeliveryMethods(deliveryMethods.filter((m) => m !== method));
      }
    } else {
      setDeliveryMethods([...deliveryMethods, method]);
    }
  };

  const addTradeTag = () => {
    if (tagInput.trim() && !tradeTags.includes(tagInput.trim())) {
      setTradeTags([...tradeTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTradeTag = (tag: string) => {
    setTradeTags(tradeTags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (selectedFiles.length < 2) {
      setErrorMsg("სავალდებულოა მინიმუმ 2 ფოტოს ატვირთვა!");
      return;
    }
    if (!titleKa.trim() && !titleEn.trim()) {
      setErrorMsg("გთხოვთ შეიყვანოთ სათაური.");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress("სურათების ოპტიმიზაცია და კომპრესია (WebP)...");

    try {
      // 1. Client-side Image Compression (max 1600px, WebP, < 600KB)
      const compressedFiles = await compressImagesBatch(selectedFiles, {
        maxDimension: 1600,
        quality: 0.82,
        mimeType: "image/webp",
      });

      const uploadedUrls: string[] = [];
      for (let i = 0; i < compressedFiles.length; i++) {
        setUploadProgress(`იტვირთება ფოტო ${i + 1} / ${compressedFiles.length}...`);
        const { url, error } = await uploadListingImage(compressedFiles[i], user.id);
        if (error || !url) throw new Error(error || "ფოტოს ატვირთვისას დაფიქსირდა შეცდომა");
        uploadedUrls.push(url);
      }

      setUploadProgress("განცხადება ინახება მონაცემთა ბაზაში...");

      const { data, error: insertError } = await supabase.from("listings").insert({
        user_id: user.id,
        title_ka: titleKa.trim() || titleEn.trim(),
        title_en: titleEn.trim() || titleKa.trim(),
        description_ka: descKa.trim(),
        description_en: descEn.trim(),
        item_type: itemType,
        status: "ACTIVE",
        price: (transactionType === "TRADE" || transactionType === "GIFT") ? 0 : parseFloat(price || "0"),
        transaction_type: transactionType,
        delivery_methods: deliveryMethods,
        images: uploadedUrls,
        city,
        address: address.trim(),
        trade_preferences: tradeTags,
      }).select().single();

      if (insertError) throw insertError;

      router.push(`/listings/${data.id}`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "განცხადების შენახვისას დაფიქსირდა შეცდომა");
      setIsSubmitting(false);
      setUploadProgress("");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-black text-foreground">
          განცხადების განთავსება
        </h1>
        <p className="text-xs text-muted-foreground mt-1 font-medium">
          გაყიდეთ, გაცვალეთ ან გააჩუქეთ მცენარეები და ინვენტარი
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 rounded-[18px] bg-destructive/10 border border-destructive/20 p-3.5 text-xs text-destructive flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Item Type */}
        <div className="rounded-[24px] border border-border/80 bg-card p-5 shadow-sm">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-3">
            1. კატეგორია
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setItemType("PLANT")}
              className={`p-3.5 rounded-[18px] border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                itemType === "PLANT"
                  ? "border-primary bg-primary/10 text-primary shadow-xs"
                  : "border-border/70 text-muted-foreground hover:bg-surface-container"
              }`}
            >
              <Sprout className="w-4 h-4" />
              <span>🌿 მცენარე / ნერგი</span>
            </button>
            <button
              type="button"
              onClick={() => setItemType("INVENTORY")}
              className={`p-3.5 rounded-[18px] border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                itemType === "INVENTORY"
                  ? "border-primary bg-primary/10 text-primary shadow-xs"
                  : "border-border/70 text-muted-foreground hover:bg-surface-container"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>🪴 ინვენტარი / ქოთანი</span>
            </button>
          </div>
        </div>

        {/* 2. Photo Upload & Compact Mobile-Friendly AI Recognition */}
        <div className="rounded-[24px] border border-border/80 bg-card p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              2. ფოტოები (მინ. 2, მაქს. 5) *
            </label>
            
            <div className="flex items-center gap-2">
              {/* Compact Sleek AI Trigger Button */}
              {selectedFiles.length > 0 && (
                <button
                  type="button"
                  onClick={handleAiAutoFill}
                  disabled={aiDetecting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[11px] font-bold shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-60"
                  title="Google Gemini AI-ით მცენარის ამოცნობა და ფორმის ავტო-შევსება"
                >
                  {aiDetecting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                  )}
                  <span>{aiDetecting ? "ამოიცნობს..." : "✨ AI ამოცნობა"}</span>
                </button>
              )}
              
              <span className="text-xs font-bold text-primary px-2 py-0.5 rounded-full bg-secondary-container">
                {selectedFiles.length} / 5
              </span>
            </div>
          </div>

          <input
            type="file"
            multiple
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {previews.map((preview, idx) => (
              <div key={idx} className="relative aspect-square rounded-[16px] overflow-hidden border border-border/80 group">
                <img src={preview} alt="preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1.5 right-1.5 rounded-full bg-black/70 text-white p-1 hover:bg-destructive transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {idx === 0 && (
                  <div className="absolute bottom-1.5 left-1.5 rounded-md px-1.5 py-0.5 bg-black/70 text-[9px] text-white font-bold backdrop-blur-xs">
                    მთავარი
                  </div>
                )}
              </div>
            ))}

            {selectedFiles.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-[16px] border-2 border-dashed border-border/80 hover:border-primary flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors p-2 text-center bg-surface-container/30 cursor-pointer"
              >
                <Upload className="w-5 h-5 mb-1 text-primary/70" />
                <span className="text-[10px] font-bold">+ ფოტო</span>
              </button>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground">
            📸 მხარდაჭერილია ტელეფონით გადაღებული მაღალი ხარისხის ფოტოები (15MB-მდე). სისტემა ავტომატურად მოახდენს მათ WebP კომპრესიას.
          </p>

          {/* AI Recognition Notification Banner */}
          {aiApplied && aiResult && (
            <div className="rounded-[16px] bg-emerald-500/10 border border-emerald-500/30 p-3 flex items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold truncate">
                  ✨ Gemini-მ ამოიცნო: <strong>{aiResult.nameKa || aiResult.latinName}</strong> — ველები ავტომატურად შეივსო!
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAiApplied(false)}
                className="text-[11px] text-muted-foreground hover:text-foreground shrink-0 underline cursor-pointer"
              >
                გასუფთავება
              </button>
            </div>
          )}
        </div>

        {/* 3. Bilingual Titles & Descriptions (Free to Edit) */}
        <div className="rounded-[24px] border border-border/80 bg-card p-5 shadow-sm space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            3. სათაური & აღწერა (ორენოვანი)
          </label>

          <div>
            <span className="text-xs font-bold text-foreground mb-1 block">
              სათაური ქართულად & ლათინური სახელი *
            </span>
            <Input
              required
              value={titleKa}
              onChange={(e) => setTitleKa(e.target.value)}
              placeholder="მაგ: მონსტერა დელიციოზა (Monstera deliciosa)"
              className="rounded-[14px] h-10 text-xs sm:text-sm font-medium"
            />
          </div>

          <div>
            <span className="text-xs font-bold text-muted-foreground mb-1 block">
              Title in English (სურვილისამებრ)
            </span>
            <Input
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="e.g. Monstera Deliciosa (Monstera deliciosa)"
              className="rounded-[14px] h-10 text-xs sm:text-sm font-medium"
            />
          </div>

          <div>
            <span className="text-xs font-bold text-foreground mb-1 block">
              აღწერა და მოვლის დეტალები
            </span>
            <textarea
              rows={3}
              value={descKa}
              onChange={(e) => setDescKa(e.target.value)}
              placeholder="მიუთითეთ მცენარის მდგომარეობა, ასაკი, ქოთნის ზომა, სუბსტრატი..."
              className="w-full rounded-[14px] border border-border/80 bg-background/90 px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none font-medium leading-relaxed"
            />
          </div>
        </div>

        {/* 4. Transaction Type & Price (Set by user) */}
        <div className="rounded-[24px] border border-border/80 bg-card p-5 shadow-sm space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            4. გარიგების ტიპი & ფასი
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "FIXED", label: "ფიქსირებული", emoji: "💰" },
              { id: "NEGOTIABLE", label: "შეთანხმებით", emoji: "🤝" },
              { id: "TRADE", label: "გაცვლა", emoji: "🔄" },
              { id: "GIFT", label: "გაჩუქება", emoji: "🎁" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTransactionType(t.id as any)}
                className={`py-2.5 px-2 rounded-[16px] text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  transactionType === t.id
                    ? "bg-primary text-white shadow-ambient"
                    : "border border-border/70 text-muted-foreground hover:bg-surface-container"
                }`}
              >
                <span className="text-base">{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {transactionType === "GIFT" ? (
            <div className="rounded-[18px] bg-emerald-500/10 border border-emerald-500/30 p-3.5 flex items-center gap-2.5">
              <span className="text-xl">🎁</span>
              <div>
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">უფასო საჩუქარი (Giveaway)</p>
                <p className="text-[11px] text-muted-foreground">მცენარე გაჩუქდება უფასოდ, რუკაზე გამოჩნდება საჩუქრის ნიშნით.</p>
              </div>
            </div>
          ) : transactionType !== "TRADE" ? (
            <div>
              <span className="text-xs font-bold text-foreground mb-1 block">ფასი (₾ ლარი)</span>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="ჩაწერეთ თქვენთვის სასურველი ფასი"
                className="rounded-[14px] h-10 text-xs sm:text-sm font-medium"
              />
            </div>
          ) : (
            <div className="rounded-[18px] bg-amber-500/10 border border-amber-500/20 p-4">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block mb-2">
                🔄 რაში გსურთ გაცვლა? (Trade Tags)
              </span>
              <div className="flex gap-2 mb-3">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTradeTag())}
                  placeholder="მაგ: Monstera Albo, Philodendron..."
                  className="text-xs rounded-[14px] h-9"
                />
                <Button type="button" onClick={addTradeTag} size="sm" className="rounded-[14px] bg-primary text-white text-xs font-bold">
                  + დამატება
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {tradeTags.map((tag) => (
                  <Badge key={tag} variant="amber" className="gap-1 text-xs rounded-full">
                    #{tag}
                    <button type="button" onClick={() => removeTradeTag(tag)} className="cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. Delivery & Location (with GPS auto-fill) */}
        <div className="rounded-[24px] border border-border/80 bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              5. მიწოდება & მდებარეობა
            </label>

            {/* GPS Location Auto-fill Button */}
            <button
              type="button"
              onClick={handleAutoFillAddressWithGPS}
              disabled={gpsLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-secondary-container hover:bg-secondary-container/80 text-primary text-xs font-bold border border-border/50 transition-all cursor-pointer disabled:opacity-60"
            >
              {gpsLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              ) : (
                <Navigation className="w-3.5 h-3.5 text-primary" />
              )}
              <span>{gpsLoading ? "ლოკაციის ძებნა..." : "📍 ჩემი ლოკაცია (GPS)"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: "PICKUP", label: "📍 ადგილზე გატანა" },
              { id: "COURIER", label: "🚚 კურიერი" },
              { id: "MARSHRUTKA", label: "🚐 სამარშრუტო" },
            ].map((d) => {
              const isChecked = deliveryMethods.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDelivery(d.id)}
                  className={`p-3 rounded-[16px] border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    isChecked
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                      : "border-border/70 text-muted-foreground hover:bg-surface-container"
                  }`}
                >
                  <span>{d.label}</span>
                  {isChecked && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-xs font-bold text-foreground mb-1 block">ქალაქი / რეგიონი</span>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                aria-label="ქალაქი"
                className="w-full h-10 rounded-[14px] border border-border/80 bg-background px-3 py-2 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="თბილისი">თბილისი</option>
                <option value="ბათუმი">ბათუმი</option>
                <option value="ქუთაისი">ქუთაისი</option>
                <option value="რუსთავი">რუსთავი</option>
                <option value="გორი">გორი</option>
                <option value="ზუგდიდი">ზუგდიდი</option>
                <option value="თელავი">თელავი</option>
                <option value="ბორჯომი">ბორჯომი</option>
                <option value="მცხეთა">მცხეთა</option>
                <option value="ფოთი">ფოთი</option>
                <option value="ქობულეთი">ქობულეთი</option>
                <option value="ახალციხე">ახალციხე</option>
              </select>
            </div>

            <div>
              <span className="text-xs font-bold text-foreground mb-1 block">რაიონი / უბანი / მისამართი</span>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="მაგ: ვაკე, ჭავჭავაძის გამზ. 25"
                className="rounded-[14px] h-10 text-xs sm:text-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          {uploadProgress && (
            <p className="text-xs text-center text-primary font-semibold mb-3 flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{uploadProgress}</span>
            </p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-[18px] bg-primary hover:bg-primary-container text-white font-bold text-sm shadow-ambient cursor-pointer active:scale-[0.99] transition-all"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                განცხადება იტვირთება...
              </span>
            ) : (
              "🌱 განცხადების განთავსება"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
