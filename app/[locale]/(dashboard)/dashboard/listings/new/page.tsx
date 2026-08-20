"use client";

import * as React from "react";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/utils/supabase/client";
import { uploadListingImage } from "@/utils/supabase/storage";
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
  Leaf
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// ──────────────────────────────────────────────────────────────────────────────
// AI Plant Recognition Database (Client-side pattern matching)
// In production: connect to Google Vision API or Plant.id API
// ──────────────────────────────────────────────────────────────────────────────
const PLANT_DATABASE: Record<string, {
  titleKa: string; titleEn: string;
  descKa: string; price: string; category: "PLANT" | "INVENTORY";
}> = {
  monstera: {
    titleKa: "Monstera Deliciosa (ფოთლოვანი, ჯანსაღი)",
    titleEn: "Monstera Deliciosa (Healthy, leafy)",
    descKa: "ლამაზი ჯანსაღი Monstera Deliciosa. ფოთლები მჭიდრო, მსხვილი ნახვრეტებით. 20+ სმ ქოთანში, სუბსტრატი: კოკოს + პერლიტი. ბოლო 3 თვეა ჩემთან.",
    price: "65",
    category: "PLANT"
  },
  philodendron: {
    titleKa: "Philodendron (ჰიბრიდი, ვარდისფერი ტარი)",
    titleEn: "Philodendron (Hybrid, Pink Stem)",
    descKa: "იშვიათი Philodendron ჰიბრიდი. ახალი ფოთოლი ამოდის. კარგი ფესვთა სისტემა. ქოთანი 15 სმ, ბოლო გადარგვა: 2 თვის წინ.",
    price: "120",
    category: "PLANT"
  },
  ficus: {
    titleKa: "ფიკუსი Benjamina (ვარდი, ყავისფერი ღეღო)",
    titleEn: "Ficus Benjamina (Weeping Fig)",
    descKa: "კლასიკური Ficus Benjamina, სიმაღლე 80 სმ. კარგად ადაპტირებულია სახლის პირობებთან. ტოვებს ბევრ ფოთოლს გადაადგილებისას, მაგრამ სწრაფად ეგუება.",
    price: "80",
    category: "PLANT"
  },
  orchid: {
    titleKa: "ორქიდეა Phalaenopsis (ყვითელი ყვავილებით)",
    titleEn: "Phalaenopsis Orchid (Yellow flowers)",
    descKa: "Phalaenopsis ორქიდეა ყვითელი ყვავილებით. ყვავის 2 კვირაა. ქოთანი 12 სმ, გამჭვირვალე. სუბსტრატი სპეციალური ორქიდეისთვის.",
    price: "45",
    category: "PLANT"
  },
  pothos: {
    titleKa: "Pothos (Epipremnum) — ოქროსფერი ნაკადი",
    titleEn: "Golden Pothos (Epipremnum aureum)",
    descKa: "მარტივად მოვლის Pothos (Scindapsus). სწრაფად ხარობს, ნახევრად-ჩრდილშიც კარგად გრძნობს თავს. 5-6 ტოტი, ჰანგინგ ქოთნიდან.",
    price: "25",
    category: "PLANT"
  },
  cactus: {
    titleKa: "კაქტუსი — კოლექციის ნიმუში (ეჩინოკაქტუსი)",
    titleEn: "Cactus Collection Specimen (Echinocactus)",
    descKa: "Echinocactus Grusonii — \"ოქროს ბალიში\". 15 სმ დიამეტრი. ზედმეტი მოვლა არ სჭირდება. ქოთანი ტეხილი კაქტუსის სუბსტრატი.",
    price: "35",
    category: "PLANT"
  },
  pot: {
    titleKa: "კერამიკული ქოთანი — ხელნაკეთი (მინიმალისტი)",
    titleEn: "Handmade Ceramic Pot — Minimalist Style",
    descKa: "ქართული ოსტატის ხელნაკეთი კერამიკული ქოთანი. ზომა: 18 სმ, სადრენაჟო ხვრელით. ფერი: ნაცრისფერი-ბეჟი.",
    price: "40",
    category: "INVENTORY"
  },
};

function detectPlantFromFilename(filename: string): string | null {
  const lower = filename.toLowerCase();
  if (lower.includes("monstera")) return "monstera";
  if (lower.includes("philodendron") || lower.includes("philo")) return "philodendron";
  if (lower.includes("ficus") || lower.includes("fig")) return "ficus";
  if (lower.includes("orchid") || lower.includes("orqid") || lower.includes("orkid")) return "orchid";
  if (lower.includes("pothos") || lower.includes("scindapsus")) return "pothos";
  if (lower.includes("cactus") || lower.includes("kaktu") || lower.includes("kaktusi")) return "cactus";
  if (lower.includes("pot") || lower.includes("qotani") || lower.includes("ceramic")) return "pot";
  return null;
}

export default function CreateListingPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Form State
  const [itemType, setItemType] = React.useState<"PLANT" | "INVENTORY">("PLANT");
  const [transactionType, setTransactionType] = React.useState<"FIXED" | "NEGOTIABLE" | "TRADE">("FIXED");
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

  // AI Plant Recognition State
  const [aiDetecting, setAiDetecting] = React.useState(false);
  const [aiDetected, setAiDetected] = React.useState<string | null>(null);
  const [aiApplied, setAiApplied] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);

    if (selectedFiles.length + newFiles.length > 5) {
      setErrorMsg("მაქსიმუმ 5 ფოტოს ატვირთვაა შესაძლებელი!");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }

    const updatedFiles = [...selectedFiles, ...newFiles].slice(0, 5);
    setSelectedFiles(updatedFiles);
    const newPreviews = updatedFiles.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviews);
    setErrorMsg("");
    
    // Reset AI state when new photos are uploaded
    setAiDetected(null);
    setAiApplied(false);
  };

  const removeImage = (idx: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== idx);
    setSelectedFiles(updatedFiles);
    setPreviews(updatedFiles.map((file) => URL.createObjectURL(file)));
    if (updatedFiles.length === 0) {
      setAiDetected(null);
      setAiApplied(false);
    }
  };

  // ──────────────────────────────────────────────
  // AI Auto-Fill: Triggered MANUALLY by the user
  // ──────────────────────────────────────────────
  const handleAiAutoFill = async () => {
    if (selectedFiles.length === 0) {
      setErrorMsg("გთხოვთ ჯერ ატვირთოთ მინიმუმ 1 ფოტო AI ამოცნობისთვის!");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }

    setAiDetecting(true);
    setAiDetected(null);

    // Simulate AI processing delay (replace with real Plant.id API call)
    await new Promise((resolve) => setTimeout(resolve, 1800));

    // Try to detect from filename (mock AI; replace with Vision API)
    const firstFile = selectedFiles[0];
    let detectedKey = detectPlantFromFilename(firstFile.name);
    
    // If no filename match, pick based on itemType as fallback
    if (!detectedKey) {
      detectedKey = itemType === "PLANT" ? "pothos" : "pot";
    }

    setAiDetected(detectedKey);
    setAiDetecting(false);
  };

  const handleApplyAiData = () => {
    if (!aiDetected || !PLANT_DATABASE[aiDetected]) return;
    const data = PLANT_DATABASE[aiDetected];
    
    setTitleKa(data.titleKa);
    setTitleEn(data.titleEn);
    setDescKa(data.descKa);
    setPrice(data.price);
    setItemType(data.category);
    setAiApplied(true);
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
    if (!titleKa.trim()) {
      setErrorMsg("გთხოვთ შეიყვანოთ სათაური ქართულად.");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress("სურათები იტვირთება Supabase Storage-ში...");

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        setUploadProgress(`იტვირთება ფოტო ${i + 1} / ${selectedFiles.length}...`);
        const { url, error } = await uploadListingImage(selectedFiles[i], user.id);
        if (error || !url) throw new Error(error || "ფოტოს ატვირთვისას დაფიქსირდა შეცდომა");
        uploadedUrls.push(url);
      }

      setUploadProgress("განცხადება ინახება მონაცემთა ბაზაში...");

      const { data, error: insertError } = await supabase.from("listings").insert({
        user_id: user.id,
        title_ka: titleKa.trim(),
        title_en: titleEn.trim() || titleKa.trim(),
        description_ka: descKa.trim(),
        description_en: descEn.trim(),
        item_type: itemType,
        status: "ACTIVE",
        price: transactionType === "TRADE" ? 0 : parseFloat(price || "0"),
        transaction_type: transactionType,
        delivery_methods: deliveryMethods,
        images: uploadedUrls,
        city,
        address: address.trim(),
        trade_preferences: tradeTags,
      }).select().single();

      if (insertError) throw insertError;

      router.push(`/listings/${data.id}`);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "განცხადების შენახვისას დაფიქსირდა შეცდომა.");
      setIsSubmitting(false);
      setUploadProgress("");
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          ახალი განცხადების დამატება
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          შეავსეთ ინფორმაცია მცენარის ან ინვენტარის შესახებ.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 rounded-2xl bg-destructive/10 border border-destructive/30 p-4 text-xs font-semibold text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Item Type Selection */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-3">
            1. აირჩიეთ კატეგორია
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setItemType("PLANT")}
              className={`flex items-center justify-center gap-2 p-4 rounded-2xl border text-sm font-bold transition-all ${
                itemType === "PLANT"
                  ? "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-sm"
                  : "border-border/70 text-muted-foreground hover:bg-muted"
              }`}
            >
              <Sprout className="w-5 h-5" />
              <span>🌱 მცენარე</span>
            </button>

            <button
              type="button"
              onClick={() => setItemType("INVENTORY")}
              className={`flex items-center justify-center gap-2 p-4 rounded-2xl border text-sm font-bold transition-all ${
                itemType === "INVENTORY"
                  ? "border-teal-600 bg-teal-500/10 text-teal-700 dark:text-teal-300 shadow-sm"
                  : "border-border/70 text-muted-foreground hover:bg-muted"
              }`}
            >
              <Layers className="w-5 h-5" />
              <span>🪴 ინვენტარი & მოვლა</span>
            </button>
          </div>
        </div>

        {/* 2. Photo Upload */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              2. ფოტოები (მინ. 2, მაქს. 5) *
            </label>
            <span className="text-xs font-bold text-emerald-600">
              {selectedFiles.length} / 5
            </span>
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
              <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-border group">
                <img src={preview} alt="preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1.5 right-1.5 rounded-full bg-black/60 text-white p-1 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {idx === 0 && (
                  <div className="absolute bottom-1.5 left-1.5 rounded px-1.5 py-0.5 bg-black/60 text-[9px] text-white font-bold">
                    მთავარი
                  </div>
                )}
              </div>
            ))}

            {selectedFiles.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-2xl border-2 border-dashed border-border/80 hover:border-emerald-500 flex flex-col items-center justify-center text-muted-foreground hover:text-emerald-600 transition-colors p-2 text-center bg-muted/20"
              >
                <Upload className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-semibold">+ ფოტო</span>
              </button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            JPG, PNG, WebP · მაქს. 5MB თითო ფოტოზე
          </p>
        </div>

        {/* ✨ AI PLANT RECOGNITION PANEL */}
        {selectedFiles.length > 0 && (
          <div className={`rounded-3xl border p-5 transition-all ${
            aiApplied 
              ? "border-emerald-500/50 bg-emerald-500/5" 
              : "border-violet-500/30 bg-violet-500/5"
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  aiApplied ? "bg-emerald-500 text-white" : "bg-violet-600 text-white"
                }`}>
                  {aiApplied ? <Check className="w-5 h-5" /> : <Wand2 className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                    AI მცენარის ამოცნობა
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-violet-500/40 text-violet-600 dark:text-violet-400">
                      BETA
                    </Badge>
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {aiApplied 
                      ? "✅ ველები ავტომატურად შევსებულია — შეგიძლიათ დაარედაქტიროთ"
                      : "დაჭირეთ ღილაკს — AI ამოიცნობს მცენარეს და შეავსებს ველებს"}
                  </p>
                </div>
              </div>

              {!aiApplied && (
                <Button
                  type="button"
                  onClick={handleAiAutoFill}
                  disabled={aiDetecting}
                  size="sm"
                  className="shrink-0 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs gap-2 shadow-md shadow-violet-600/20"
                >
                  {aiDetecting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ამოიცნობს...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5" />
                      AI ამოცნობა
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* AI Detection Result */}
            {aiDetected && !aiApplied && PLANT_DATABASE[aiDetected] && (
              <div className="mt-4 rounded-2xl bg-card border border-violet-500/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Leaf className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-foreground">
                    ამოიცნო: <span className="text-violet-600 dark:text-violet-400">{PLANT_DATABASE[aiDetected].titleKa}</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground mb-3">
                  <div><span className="font-semibold text-foreground">ფასი:</span> {PLANT_DATABASE[aiDetected].price} ₾</div>
                  <div><span className="font-semibold text-foreground">კატეგორია:</span> {PLANT_DATABASE[aiDetected].category === "PLANT" ? "🌱 მცენარე" : "🪴 ინვენტარი"}</div>
                </div>
                <p className="text-[10px] text-muted-foreground mb-3 line-clamp-2">{PLANT_DATABASE[aiDetected].descKa}</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleApplyAiData}
                    size="sm"
                    className="flex-1 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    გამოიყენე ეს მონაცემები
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setAiDetected(null)}
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-xs"
                  >
                    გაუქმება
                  </Button>
                </div>
              </div>
            )}

            {aiApplied && (
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  ველები შევსებულია — შეამოწმეთ და დაარედაქტირეთ საჭიროების შემთხვევაში
                </span>
                <button
                  type="button"
                  onClick={() => { setAiApplied(false); setAiDetected(null); }}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline"
                >
                  გასუფთავება
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. Bilingual Titles & Descriptions */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            3. სათაური & აღწერა (ორენოვანი)
          </label>

          <div>
            <span className="text-xs font-bold text-foreground mb-1 block">სათაური ქართულად *</span>
            <Input
              required
              value={titleKa}
              onChange={(e) => setTitleKa(e.target.value)}
              placeholder="მაგ: Monstera Deliciosa (დიდი ზომა, ფესვიანი)"
            />
          </div>

          <div>
            <span className="text-xs font-bold text-muted-foreground mb-1 block">Title in English (სურვილისამებრ)</span>
            <Input
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="e.g. Monstera Deliciosa (Large size, rooted)"
            />
          </div>

          <div>
            <span className="text-xs font-bold text-foreground mb-1 block">აღწერა და მოვლის დეტალები</span>
            <textarea
              rows={3}
              value={descKa}
              onChange={(e) => setDescKa(e.target.value)}
              placeholder="მიუთითეთ მცენარის მდგომარეობა, ასაკი, ქოთნის ზომა, სუბსტრატი..."
              className="w-full rounded-xl border border-input bg-background/80 px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>
        </div>

        {/* 4. Transaction Type & Price */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            4. გარიგების ტიპი & ფასი
          </label>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "FIXED", label: "ფიქსირებული", emoji: "💰" },
              { id: "NEGOTIABLE", label: "შეთანხმებით", emoji: "🤝" },
              { id: "TRADE", label: "გაცვლა", emoji: "🔄" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTransactionType(t.id as any)}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  transactionType === t.id
                    ? "bg-emerald-600 text-white shadow-md"
                    : "border border-border/80 text-muted-foreground hover:bg-muted"
                }`}
              >
                <span>{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {transactionType !== "TRADE" ? (
            <div>
              <span className="text-xs font-bold text-foreground mb-1 block">ფასი (₾ ლარი)</span>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="მაგ: 75"
              />
            </div>
          ) : (
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block mb-2">
                🔄 რაში გსურთ გაცვლა? (Trade Tags)
              </span>
              <div className="flex gap-2 mb-3">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTradeTag())}
                  placeholder="მაგ: Monstera Albo, Philodendron..."
                  className="text-xs"
                />
                <Button type="button" onClick={addTradeTag} size="sm" variant="botanical">
                  + დამატება
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {tradeTags.map((tag) => (
                  <Badge key={tag} variant="amber" className="gap-1 text-xs">
                    #{tag}
                    <button type="button" onClick={() => removeTradeTag(tag)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. Delivery & Location */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            5. მიწოდება & მდებარეობა
          </label>

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
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                    isChecked
                      ? "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-border/70 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span>{d.label}</span>
                  {isChecked && <Check className="w-3.5 h-3.5 text-emerald-600" />}
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
                className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="თბილისი">თბილისი</option>
                <option value="ბათუმი">ბათუმი</option>
                <option value="ქუთაისი">ქუთაისი</option>
                <option value="რუსთავი">რუსთავი</option>
                <option value="გორი">გორი</option>
                <option value="ზუგდიდი">ზუგდიდი</option>
                <option value="თელავი">თელავი</option>
                <option value="ბორჯომი">ბორჯომი</option>
              </select>
            </div>

            <div>
              <span className="text-xs font-bold text-foreground mb-1 block">რაიონი / უბანი</span>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="მაგ: საბურთალო, ვაჟა-ფშაველა"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-1">
          {uploadProgress && (
            <p className="text-xs text-center text-emerald-600 dark:text-emerald-400 font-semibold mb-3 flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{uploadProgress}</span>
            </p>
          )}

          <Button
            type="submit"
            variant="botanical"
            size="lg"
            disabled={isSubmitting}
            className="w-full rounded-2xl font-bold h-12 text-sm shadow-lg shadow-emerald-600/20"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                მუშავდება...
              </span>
            ) : (
              "🌿 განცხადების გამოქვეყნება (0 ₾)"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
