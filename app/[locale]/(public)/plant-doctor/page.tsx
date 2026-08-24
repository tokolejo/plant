"use client";

import * as React from "react";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { compressImage } from "@/utils/image-compression";
import { 
  Stethoscope, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Droplets, 
  Sun, 
  ArrowRight, 
  RefreshCw, 
  Store, 
  Sprout, 
  ExternalLink, 
  Loader2, 
  Camera, 
  Check, 
  X, 
  HeartHandshake,
  HelpCircle,
  ShieldCheck,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface DiagnosisData {
  isHealthy: boolean;
  plantName: string;
  speciesName?: string;
  diseaseName: string;
  probability: number;
  severity: "low" | "medium" | "high";
  causes: string[];
  symptoms: string[];
  treatmentPlan: string[];
  prevention: string[];
  recommendedProducts: { name: string; query: string; category: string }[];
}

export default function PlantDoctorPage() {
  const locale = useLocale();
  const isKa = locale !== "en";
  const supabase = createClient();
  const router = useRouter();

  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string>("");
  const [plantHint, setPlantHint] = React.useState<string>("");
  const [diagnosing, setDiagnosing] = React.useState(false);
  const [result, setResult] = React.useState<DiagnosisData | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string>("");
  const [addedToGreenhouse, setAddedToGreenhouse] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const name = params.get("plantName");
      const img = params.get("imageUrl");
      if (name) setPlantHint(name);
      if (img) setImagePreview(img);
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setResult(null);
    setErrorMsg("");
  };

  const handleStartDiagnosis = async () => {
    if (!imageFile && !imagePreview) {
      setErrorMsg(isKa ? "გთხოვთ ატვირთოთ მცენარის ან ფოთლის ფოტო" : "Please upload a plant photo");
      return;
    }

    setDiagnosing(true);
    setErrorMsg("");
    setResult(null);
    setAddedToGreenhouse(false);

    try {
      let base64 = "";

      if (imageFile) {
        const compressed = await compressImage(imageFile, {
          maxDimension: 800,
          quality: 0.85,
          mimeType: "image/jpeg",
        });
        const reader = new FileReader();
        base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const res = reader.result as string;
            resolve(res.split(",")[1] || "");
          };
          reader.readAsDataURL(compressed);
        });
      }

      const res = await fetch("/api/ai/diagnose-plant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64,
          plantName: plantHint,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "დიაგნოსტირება ვერ შესრულდა");
      }

      setResult(data.diagnosis);
    } catch (err: any) {
      setErrorMsg(err.message || "შეცდომა ანალიზისას. სცადეთ თავიდან.");
    } finally {
      setDiagnosing(false);
    }
  };

  const handleAddToGreenhouse = async () => {
    if (!result) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?next=/plant-doctor");
        return;
      }

      const now = new Date();
      const nextWaterDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      await supabase.from("user_plants").insert({
        user_id: user.id,
        name: result.plantName || "მკურნალობაში მყოფი მცენარე",
        species_name: result.speciesName || null,
        room_location: "კარანტინი",
        watering_frequency_days: 7,
        last_watered_at: now.toISOString(),
        next_watering_at: nextWaterDate.toISOString(),
        notes: `დიაგნოზი: ${result.diseaseName}. მკურნალობის რეჟიმში.`,
        image_url: imagePreview || null,
      });

      setAddedToGreenhouse(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl space-y-8">
      {/* 1. Header Banner */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 text-xs font-black">
          <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
          <span>{isKa ? "ბოტანიკური დიაგნოსტიკა" : "AI Botanical Diagnosis"}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
          {isKa ? "AI მცენარის ექიმი" : "AI Plant Doctor"}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {isKa
            ? "გადაუღეთ ფოტო დაზიანებულ ფოთოლს ან მცენარეს. სისტემა მომენტალურად ამოიცნობს დაავადებას, მავნებელს და მოგცემთ მკურნალობის ზუსტ გეგმას."
            : "Upload a photo of your plant or sick leaf. AI will diagnose diseases, pests, and provide step-by-step treatment plans."}
        </p>
      </div>

      {/* 2. Upload & Input Card */}
      <div className="rounded-[28px] border border-border/80 bg-card p-5 sm:p-8 shadow-ambient space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative border-2 border-dashed border-primary/40 hover:border-primary rounded-[22px] p-6 text-center bg-primary/[0.02] hover:bg-primary/[0.05] transition-all cursor-pointer flex flex-col items-center justify-center min-h-[220px] group"
          >
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />

            {imagePreview ? (
              <div className="relative w-full h-44 rounded-[16px] overflow-hidden">
                <img
                  src={imagePreview}
                  alt="uploaded plant"
                  className="w-full h-full object-cover rounded-[16px]"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-black gap-1.5">
                  <Camera className="w-4 h-4" />
                  <span>ფოტოს შეცვლა</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-black text-foreground block">
                    {isKa ? "დააჭირეთ ფოტოს ასატვირთად" : "Click to upload plant photo"}
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    ან ჩააგდეთ სურათი აქ (JPG, PNG, WebP)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Plant Name & Start Action */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-black text-foreground block mb-1">
                {isKa ? "მცენარის სახელი (არასავალდებულო)" : "Plant Name / Species (Optional)"}
              </label>
              <Input
                value={plantHint}
                onChange={(e) => setPlantHint(e.target.value)}
                placeholder="მაგ: მონსტერა, ფიკუსი, ორქიდეა..."
                className="h-11 rounded-[14px] text-xs font-bold bg-background"
              />
              <span className="text-[10.5px] text-muted-foreground mt-1 block">
                დაგვეხმარება კიდევ უფრო ზუსტი დიაგნოზის დასმაში.
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-[14px] bg-destructive/10 border border-destructive/20 text-xs font-bold text-destructive flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button
              type="button"
              disabled={diagnosing || (!imageFile && !imagePreview)}
              onClick={handleStartDiagnosis}
              className="w-full h-12 rounded-[16px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black gap-2 cursor-pointer shadow-ambient disabled:opacity-50 transition-all"
            >
              {diagnosing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isKa ? "მიმდინარეობს ანალიზი..." : "Diagnosing..."}</span>
                </>
              ) : (
                <>
                  <Stethoscope className="w-5 h-5" />
                  <span>{isKa ? "დიაგნოსტირების დაწყება" : "Start Diagnosis"}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Diagnosis Result Card */}
      {result && (
        <div className="rounded-[28px] border-2 border-emerald-500/30 bg-card p-6 sm:p-8 shadow-ambient space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  className={`text-xs font-black px-3 py-1 rounded-full ${
                    result.isHealthy
                      ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
                      : result.severity === "high"
                      ? "bg-destructive/15 text-destructive border-destructive/30"
                      : "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30"
                  }`}
                >
                  {result.isHealthy
                    ? "ჯანმრთელი"
                    : result.severity === "high"
                    ? "კრიტიკული ყურადღება"
                    : "საშუალო სიმძიმე"}
                </Badge>
                <span className="text-xs font-bold text-muted-foreground">
                  სიზუსტე: {result.probability}%
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-foreground">
                {result.diseaseName}
              </h2>
              {result.speciesName && (
                <p className="text-xs font-serif italic text-muted-foreground">
                  ამოცნობილი სახეობა: {result.speciesName}
                </p>
              )}
            </div>

            <Button
              type="button"
              disabled={addedToGreenhouse}
              onClick={handleAddToGreenhouse}
              className={`rounded-[14px] text-xs font-black gap-2 h-10 px-4 cursor-pointer shadow-xs transition-all ${
                addedToGreenhouse
                  ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 cursor-default"
                  : "bg-primary hover:bg-primary/90 text-white"
              }`}
            >
              {addedToGreenhouse ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>ორანჟერეაშია</span>
                </>
              ) : (
                <>
                  <Sprout className="w-4 h-4" />
                  <span>ორანჟერეაში დამატება</span>
                </>
              )}
            </Button>
          </div>

          {/* Causes & Symptoms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Symptoms */}
            <div className="p-4 rounded-[20px] bg-secondary-container/40 border border-border/60 space-y-2">
              <span className="text-xs font-black uppercase text-foreground flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>სიმპტომები</span>
              </span>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {result.symptoms.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Causes */}
            <div className="p-4 rounded-[20px] bg-secondary-container/40 border border-border/60 space-y-2">
              <span className="text-xs font-black uppercase text-foreground flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-primary" />
                <span>გამომწვევი მიზეზები</span>
              </span>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {result.causes.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Step-by-Step Treatment Protocol */}
          <div className="p-5 rounded-[22px] bg-emerald-500/5 border border-emerald-500/20 space-y-3">
            <span className="text-sm font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-emerald-600" />
              <span>მკურნალობის გეგმა</span>
            </span>
            <div className="space-y-2.5">
              {result.treatmentPlan.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs text-foreground font-medium">
                  <span className="h-6 w-6 rounded-full bg-emerald-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <p className="pt-0.5 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Prevention */}
          {result.prevention && result.prevention.length > 0 && (
            <div className="p-4 rounded-[20px] bg-card border border-border/80 text-xs text-muted-foreground space-y-1.5">
              <span className="font-black text-foreground block">მომავალი პრევენცია:</span>
              <ul className="space-y-1">
                {result.prevention.map((p, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Marketplace Up-sell Recommendations */}
          {result.recommendedProducts && result.recommendedProducts.length > 0 && (
            <div className="p-5 rounded-[22px] bg-gradient-to-r from-primary/10 to-teal-500/10 border border-primary/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Store className="w-4 h-4 text-primary" />
                  <span>სამკურნალო საშუალებები Plant.ge-ზე:</span>
                </span>
                <span className="text-[10.5px] text-muted-foreground font-bold">ძიება კატალოგში</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {result.recommendedProducts.map((prod, i) => (
                  <Link
                    key={i}
                    href={`/listings?q=${encodeURIComponent(prod.query)}`}
                    className="p-3 rounded-[14px] bg-card hover:bg-surface-container border border-border/70 hover:border-primary/50 shadow-2xs transition-all flex items-center justify-between gap-2 group cursor-pointer"
                  >
                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {prod.name}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
