"use client";

import * as React from "react";
import { useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { uploadListingImage } from "@/utils/supabase/storage";
import { compressImagesBatch, compressImage } from "@/utils/image-compression";
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
  CheckCircle2,
  Search,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { STRUCTURED_CATEGORIES, type TaxonomyCategory } from "@/lib/categories-data";

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

const TRADE_TAG_AUTOCOMPLETE_LIST = [
  "კაქტუსი (Cactus)",
  "სუქულენტი (Succulent)",
  "კაქტუსები / სუქულენტები",
  "მონსტერა (Monstera)",
  "მონსტერა ალბო (Monstera Albo)",
  "მონსტერა ტაი (Thai Constellation)",
  "მონსტერა ადონსონი (Adansonii)",
  "ფილოდენდრონი (Philodendron)",
  "ფილოდენდრონი ვარდისფერი (Pink Princess)",
  "ფილოდენდრონი თეთრი რაინდი (White Knight)",
  "ალოკაზია (Alocasia)",
  "ალოკაზია პოლი (Polly)",
  "ანთურიუმი (Anthurium)",
  "ანთურიუმ კლარინერვიუმი (Clarinervium)",
  "ორქიდეა (Orchid)",
  "ფალენოპსისი (Phalaenopsis)",
  "ფიკუსი (Ficus)",
  "ფიკუს ლირატა (Ficus Lyrata)",
  "ფიკუს ბენჯამინა (Ficus Benjamina)",
  "ფიკუს ელასტიკა (Ficus Elastica)",
  "კალათეა (Calathea)",
  "მარანტა (Maranta)",
  "პოთოსი (Pothos)",
  "სცინდაპსუსი (Scindapsus)",
  "პალმა (Palm)",
  "გვიმრა (Fern)",
  "ბეგონია (Begonia)",
  "სანსევიერია (Sansevieria)",
  "ზამიოკულკასი (ZZ Plant)",
  "ხოია (Hoya)",
  "სინგონიუმი (Syngonium)",
  "ეპიპრემნუმი (Epipremnum)",
  "ბონსაი (Bonsai)",
  "ქოთნები (Pots)",
  "კერამიკული ქოთანი",
  "თიხის ქოთანი",
  "სუბსტრატი / გრუნტი",
  "პერლიტი / ვერმიკულიტი",
  "ორგანული სასუქი",
  "ფიტოლამპა / განათება",
];

const TRADE_PRESETS = [
  "ნებისმიერი მცენარე",
  "შემომთავაზეთ",
  "იშვიათი მცენარეები",
  "ქოთნები & ინვენტარი",
];

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
  const [plantCategory, setPlantCategory] = React.useState("");
  const [categorySearchQuery, setCategorySearchQuery] = React.useState("");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = React.useState(false);
  const categoryWrapperRef = React.useRef<HTMLDivElement>(null);

  const [transactionType, setTransactionType] = React.useState<"FIXED" | "NEGOTIABLE" | "TRADE" | "GIFT">("FIXED");
  const [titleKa, setTitleKa] = React.useState("");
  const [titleEn, setTitleEn] = React.useState("");
  const [descKa, setDescKa] = React.useState("");
  const [descEn, setDescEn] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [city, setCity] = React.useState("თბილისი");
  const [address, setAddress] = React.useState("");
  const [contactPhone, setContactPhone] = React.useState("");
  const [syncPhoneWithProfile, setSyncPhoneWithProfile] = React.useState(true);
  
  const [deliveryMethods, setDeliveryMethods] = React.useState<string[]>(["PICKUP"]);
  const [tagInput, setTagInput] = React.useState("");
  const [tradeTags, setTradeTags] = React.useState<string[]>([]);
  const [showTagAutocomplete, setShowTagAutocomplete] = React.useState(false);
  const tagInputWrapperRef = React.useRef<HTMLDivElement>(null);
  
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [previews, setPreviews] = React.useState<string[]>([]);

  const [checkingAuth, setCheckingAuth] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<string>("");
  const [errorMsg, setErrorMsg] = React.useState("");

  // Check authentication and pre-fill contact phone/city from user profile
  React.useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace(`/auth/login?redirect=${encodeURIComponent("/dashboard/listings/new")}`);
        return;
      }

      setCheckingAuth(false);

      const { data: prof } = await supabase
        .from("profiles")
        .select("phone, city, location")
        .eq("id", user.id)
        .maybeSingle();

      if (prof) {
        if (prof.phone) setContactPhone(prof.phone);
        if (prof.city) setCity(prof.city);
        if (prof.location) setAddress(prof.location);
      }
    });
  }, [supabase, router]);

  // Close category & tag autocomplete on outside click
  React.useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (tagInputWrapperRef.current && !tagInputWrapperRef.current.contains(e.target as Node)) {
        setShowTagAutocomplete(false);
      }
      if (categoryWrapperRef.current && !categoryWrapperRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const filteredCategories = React.useMemo(() => {
    const list = STRUCTURED_CATEGORIES.filter((c) => c.itemType === itemType);
    if (!categorySearchQuery.trim()) return list;
    const q = categorySearchQuery.toLowerCase().trim();
    return list.filter(
      (c) =>
        c.nameKa.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [itemType, categorySearchQuery]);

  const selectedCategoryObj = React.useMemo(() => {
    return STRUCTURED_CATEGORIES.find((c) => c.id === plantCategory) || null;
  }, [plantCategory]);

  const matchedSuggestions = React.useMemo(() => {
    if (!tagInput.trim()) return [];
    const q = tagInput.toLowerCase().trim();
    return TRADE_TAG_AUTOCOMPLETE_LIST.filter(
      (s) => s.toLowerCase().includes(q) && !tradeTags.includes(s)
    ).slice(0, 6);
  }, [tagInput, tradeTags]);

  const addSpecificTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (trimmed && !tradeTags.includes(trimmed)) {
      setTradeTags([...tradeTags, trimmed]);
      setTagInput("");
      setShowTagAutocomplete(false);
    }
  };

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
  const [activeProvider, setActiveProvider] = React.useState<"gemini" | "plantnet" | null>(null);

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
      // Compress image client-side to max 1000px and under 150KB for fast mobile transmission
      const compressedForAi = await compressImage(firstFile, {
        maxDimension: 1000,
        quality: 0.82,
        mimeType: "image/jpeg",
      });
      const base64 = await fileToBase64(compressedForAi);

      const res = await fetch("/api/ai/recognize-plant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: "image/jpeg",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "მცენარის ამოცნობა ვერ მოხერხდა");
      }

      const result: GeminiPlantRecognitionResult = data.data;
      setAiResult(result);
      setActiveProvider("gemini");

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

  // Botanical Care & Pl@ntNet State
  const [botanicalName, setBotanicalName] = React.useState("");
  const [wateringSchedule, setWateringSchedule] = React.useState("Weekly (კვირაში 1-ხელ)");
  const [lightRequirement, setLightRequirement] = React.useState("Bright Indirect (კაშკაშა გაფანტული)");
  const [careDifficulty, setCareDifficulty] = React.useState<"Easy" | "Medium" | "Expert">("Easy");
  const [toxicity, setToxicity] = React.useState("");
  const [plantnetId, setPlantnetId] = React.useState("");
  const [confidenceScore, setConfidenceScore] = React.useState<number | null>(null);

  // ──────────────────────────────────────────────
  // Plant.id v3 Botanical AI Identification
  // ──────────────────────────────────────────────
  const [plantIdDetecting, setPlantIdDetecting] = React.useState(false);

  const handlePlantIdAutoFill = async () => {
    if (selectedFiles.length === 0) {
      setErrorMsg("გთხოვთ ჯერ ატვირთოთ მინიმუმ 1 ფოტო Plant.id ამოცნობისთვის!");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }

    setPlantIdDetecting(true);
    setErrorMsg("");

    try {
      const firstFile = selectedFiles[0];
      const formData = new FormData();
      formData.append("image", firstFile);

      const res = await fetch("/api/ai/recognize-plantid", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Plant.id-ით ამოცნობა ვერ მოხერხდა");
      }

      const result = data.data;
      setAiResult(result);
      setActiveProvider("plantnet"); // or Plant.id

      // Auto-fill form fields (EXCEPT category - category selection is strictly manual!)
      if (result.title_ka) setTitleKa(result.title_ka);
      if (result.title_en) setTitleEn(result.title_en);
      if (result.botanical_name) setBotanicalName(result.botanical_name);
      if (result.watering_schedule) setWateringSchedule(result.watering_schedule);
      if (result.light_requirement) setLightRequirement(result.light_requirement);
      if (result.care_difficulty) setCareDifficulty(result.care_difficulty);
      if (result.toxicity) setToxicity(result.toxicity);
      if (result.plantnet_id) setPlantnetId(result.plantnet_id);
      if (result.confidence_score) setConfidenceScore(result.confidence_score);
      if (result.tags && Array.isArray(result.tags)) {
        setTradeTags((prev) => Array.from(new Set([...prev, ...result.tags])));
      }

      setAiApplied(true);
    } catch (err: any) {
      console.error("Plant.id Recognition Error:", err);
      setErrorMsg(`Plant.id ამოცნობა: ${err.message || "სცადეთ ხელახლა"}`);
      setTimeout(() => setErrorMsg(""), 5000);
    } finally {
      setPlantIdDetecting(false);
    }
  };

  // ──────────────────────────────────────────────
  // Pl@ntNet Botanical AI Identification (OpenAPI)
  // ──────────────────────────────────────────────
  const [plantnetDetecting, setPlantnetDetecting] = React.useState(false);

  const handlePlantNetAutoFill = async () => {
    if (selectedFiles.length === 0) {
      setErrorMsg("გთხოვთ ჯერ ატვირთოთ მინიმუმ 1 ფოტო Pl@ntNet ამოცნობისთვის!");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }

    setPlantnetDetecting(true);
    setErrorMsg("");

    try {
      const firstFile = selectedFiles[0];
      const formData = new FormData();
      formData.append("image", firstFile);

      const res = await fetch("/api/ai/identify-plant", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Pl@ntNet-ით ამოცნობა ვერ მოხერხდა");
      }

      const result = data.data;
      setAiResult(result);
      setActiveProvider("plantnet");

      // Auto-fill form fields (EXCEPT category - category selection is strictly manual!)
      if (result.title_ka) setTitleKa(result.title_ka);
      if (result.title_en) setTitleEn(result.title_en);
      if (result.botanical_name) setBotanicalName(result.botanical_name);
      if (result.watering_schedule) setWateringSchedule(result.watering_schedule);
      if (result.light_requirement) setLightRequirement(result.light_requirement);
      if (result.care_difficulty) setCareDifficulty(result.care_difficulty);
      if (result.toxicity) setToxicity(result.toxicity);
      if (result.plantnet_id) setPlantnetId(result.plantnet_id);
      if (result.confidence_score) setConfidenceScore(result.confidence_score);
      if (result.tags && Array.isArray(result.tags)) {
        setTradeTags((prev) => Array.from(new Set([...prev, ...result.tags])));
      }

      setAiApplied(true);
    } catch (err: any) {
      console.error("Pl@ntNet Recognition Error:", err);
      setErrorMsg(`Pl@ntNet ამოცნობა: ${err.message || "სცადეთ ხელახლა"}`);
      setTimeout(() => setErrorMsg(""), 5000);
    } finally {
      setPlantnetDetecting(false);
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
      router.push(`/auth/login?redirect=${encodeURIComponent("/dashboard/listings/new")}`);
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
    if (!plantCategory) {
      setErrorMsg("გთხოვთ აირჩიოთ მცენარის ან ინვენტარის კატეგორია!");
      return;
    }
    if (!descKa.trim()) {
      setErrorMsg("გთხოვთ შეიყვანოთ განცხადების აღწერა.");
      return;
    }
    if (!contactPhone.trim()) {
      setErrorMsg("გთხოვთ შეიყვანოთ საკონტაქტო მობილურის ნომერი.");
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
        plant_category: plantCategory,
        inventory_category: itemType === "INVENTORY" ? plantCategory : null,
        status: "ACTIVE",
        price: (transactionType === "TRADE" || transactionType === "GIFT") ? 0 : parseFloat(price || "0"),
        transaction_type: transactionType,
        delivery_methods: deliveryMethods,
        images: uploadedUrls,
        city,
        address: address.trim(),
        contact_phone: contactPhone.trim() || null,
        trade_preferences: tradeTags,
        botanical_name: botanicalName.trim() || null,
        common_name: titleKa.trim() || null,
        watering_schedule: wateringSchedule || null,
        light_requirement: lightRequirement || null,
        care_difficulty: careDifficulty || null,
        toxicity: toxicity.trim() || null,
        plantnet_id: plantnetId || null,
      }).select().single();

      if (insertError) throw insertError;

      // Sync phone and location to permanent profile if enabled
      if (syncPhoneWithProfile && contactPhone.trim()) {
        await supabase.from("profiles").update({ 
          phone: contactPhone.trim(),
          city: city || undefined,
          location: address.trim() || undefined,
          updated_at: new Date().toISOString()
        }).eq("id", user.id);
      }

      router.push(`/listings/${data.id}`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "განცხადების შენახვისას დაფიქსირდა შეცდომა");
      setIsSubmitting(false);
      setUploadProgress("");
    }
  };

  if (checkingAuth) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center space-y-3 min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-medium">
          {isEn ? "Checking authentication..." : "ავტორიზაციის შემოწმება..."}
        </p>
      </div>
    );
  }

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
        {/* 1. Item Type & Dynamic Category Selection */}
        <div className="rounded-[24px] border border-border/80 bg-card p-5 shadow-sm space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            1. კატეგორია & ტიპი
          </label>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setItemType("PLANT");
                setPlantCategory("");
                setCategorySearchQuery("");
              }}
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
              onClick={() => {
                setItemType("INVENTORY");
                setPlantCategory("");
                setCategorySearchQuery("");
              }}
              className={`p-3.5 rounded-[18px] border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                itemType === "INVENTORY"
                  ? "border-primary bg-primary/10 text-primary shadow-xs"
                  : "border-border/70 text-muted-foreground hover:bg-surface-container"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>🪴 ინვენტარი / მოვლა</span>
            </button>
          </div>

          {/* Searchable Sub-Category Combobox */}
          <div className="relative" ref={categoryWrapperRef}>
            <label className="text-xs font-bold text-foreground block mb-1.5">
              {itemType === "PLANT" ? "მცენარის სახეობა / ჯგუფი *" : "ინვენტარის კატეგორია *"}
            </label>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={categorySearchQuery}
                onFocus={() => setCategoryDropdownOpen(true)}
                onChange={(e) => {
                  setCategorySearchQuery(e.target.value);
                  setCategoryDropdownOpen(true);
                }}
                placeholder={
                  selectedCategoryObj
                    ? `${selectedCategoryObj.emoji} ${selectedCategoryObj.nameKa}`
                    : "მოძებნეთ კატეგორია (მაგ: სუკულენტი, მონსტერა, ქოთანი...)"
                }
                className="w-full pl-10 pr-10 h-11 rounded-[14px] border border-border/80 bg-background text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-foreground placeholder:font-bold"
              />
              {categorySearchQuery ? (
                <button
                  type="button"
                  onClick={() => setCategorySearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              )}
            </div>

            {/* Selected Category Pill */}
            {selectedCategoryObj && !categoryDropdownOpen && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] text-muted-foreground font-medium">არჩეულია:</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] bg-primary/10 text-primary border border-primary/20 text-xs font-bold">
                  <span>{selectedCategoryObj.emoji}</span>
                  <span>{selectedCategoryObj.nameKa}</span>
                </span>
              </div>
            )}

            {/* Dropdown Suggestions */}
            {categoryDropdownOpen && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1.5 max-h-64 overflow-y-auto rounded-[16px] border border-border/80 bg-card p-1.5 shadow-xl shadow-black/10">
                {filteredCategories.length > 0 ? (
                  <div className="space-y-1">
                    {filteredCategories.map((cat) => {
                      const isSelected = cat.id === plantCategory;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setPlantCategory(cat.id);
                            setItemType(cat.itemType);
                            setCategorySearchQuery("");
                            setCategoryDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-[12px] text-left text-xs transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary text-white font-bold"
                              : "hover:bg-surface-container text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base">{cat.emoji}</span>
                            <div>
                              <p className="font-bold">{cat.nameKa}</p>
                              <p className={`text-[10px] ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>
                                {cat.nameEn}
                              </p>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 shrink-0 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    მსგავსი კატეგორია ვერ მოიძებნა.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2. Photo Upload & Compact Mobile-Friendly AI Recognition */}
        <div className="rounded-[24px] border border-border/80 bg-card p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              2. ფოტოები (მინ. 2, მაქს. 5) *
            </label>
            
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Plant.id Recognition Button */}
              {selectedFiles.length > 0 && (
                <button
                  type="button"
                  onClick={handlePlantIdAutoFill}
                  disabled={plantIdDetecting || plantnetDetecting}
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-[12px] bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-[11px] font-bold shadow-xs active:scale-95 transition-all cursor-pointer border border-emerald-400/30 disabled:opacity-60"
                  title="Plant.id v3 AI ამოცნობა და მოვლის პარამეტრები"
                >
                  {plantIdDetecting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  )}
                  <span>{plantIdDetecting ? "ამოიცნობს..." : "🌱 Plant.id"}</span>
                </button>
              )}

              {/* Pl@ntNet Recognition Button */}
              {selectedFiles.length > 0 && (
                <button
                  type="button"
                  onClick={handlePlantNetAutoFill}
                  disabled={plantnetDetecting || plantIdDetecting}
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-[12px] bg-gradient-to-r from-teal-700 to-emerald-800 hover:from-teal-800 hover:to-emerald-900 text-white text-[11px] font-bold shadow-xs active:scale-95 transition-all cursor-pointer border border-emerald-400/30 disabled:opacity-60"
                  title="Pl@ntNet-ის სამეცნიერო ბოტანიკური ამოცნობა (OpenAPI)"
                >
                  {plantnetDetecting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Leaf className="w-3.5 h-3.5 text-emerald-300" />
                  )}
                  <span>{plantnetDetecting ? "ამოიცნობს..." : "🌿 Pl@ntNet"}</span>
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
                  {activeProvider === "plantnet" ? "🌿 Pl@ntNet-მა" : "✨ Gemini-მ"} ამოიცნო: <strong>{aiResult.nameKa || aiResult.latinName}</strong> — ველები ავტომატურად შეივსო!
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

        {/* 3. Title & Description */}
        <div className="rounded-[24px] border border-border/80 bg-card p-5 shadow-sm space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            3. სათაური & აღწერა
          </label>

          <div>
            <span className="text-xs font-bold text-foreground mb-1 block">
              სათაური / მცენარის დასახელება *
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
            <span className="text-xs font-bold text-foreground mb-1 block">
              აღწერა და მოვლის დეტალები *
            </span>
            <textarea
              rows={4}
              required
              value={descKa}
              onChange={(e) => setDescKa(e.target.value)}
              placeholder="მიუთითეთ მცენარის მდგომარეობა, ასაკი, ქოთნის ზომა, სუბსტრატი, ნებისმიერი სხვა დეტალი..."
              className="w-full rounded-[14px] border border-border/80 bg-background/90 px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none font-medium leading-relaxed"
            />
          </div>
        </div>

        {/* 3.1 Botanical Care & Characteristics (Auto-filled by Pl@ntNet) */}
        {itemType === "PLANT" && (
          <div className="rounded-[24px] border border-border/80 bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Leaf className="w-4 h-4 text-primary" />
                ბოტანიკური მახასიათებლები & მოვლა (Pl@ntNet)
              </label>
              {confidenceScore && (
                <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-full">
                  🌿 {confidenceScore}% სიზუსტე
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">
                  ლათინური ბოტანიკური სახელი
                </label>
                <Input
                  value={botanicalName}
                  onChange={(e) => setBotanicalName(e.target.value)}
                  placeholder="მაგ: Monstera deliciosa"
                  className="rounded-[14px] h-10 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">
                  💧 მორწყვის გრაფიკი
                </label>
                <Input
                  value={wateringSchedule}
                  onChange={(e) => setWateringSchedule(e.target.value)}
                  placeholder="მაგ: Weekly (კვირაში 1-ხელ)"
                  className="rounded-[14px] h-10 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">
                  ☀️ განათების მოთხოვნა
                </label>
                <Input
                  value={lightRequirement}
                  onChange={(e) => setLightRequirement(e.target.value)}
                  placeholder="მაგ: Bright Indirect (კაშკაშა გაფანტული)"
                  className="rounded-[14px] h-10 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">
                  🌱 მოვლის სირთულე
                </label>
                <div className="grid grid-cols-3 gap-1.5 h-10">
                  {(["Easy", "Medium", "Expert"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setCareDifficulty(lvl)}
                      className={`rounded-[10px] text-xs font-bold transition-all cursor-pointer ${
                        careDifficulty === lvl
                          ? "bg-primary text-white shadow-2xs"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {lvl === "Easy" ? "მარტივი" : lvl === "Medium" ? "საშუალო" : "რთული"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-foreground mb-1 block">
                  🐾 ტოქსიკურობა (შინაური ცხოველების უსაფრთხოება)
                </label>
                <Input
                  value={toxicity}
                  onChange={(e) => setToxicity(e.target.value)}
                  placeholder="მაგ: არატოქსიკურია / ტოქსიკურია კატებისთვის"
                  className="rounded-[14px] h-10 text-xs font-medium"
                />
              </div>
            </div>
          </div>
        )}

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
            <div className="rounded-[18px] bg-amber-500/10 border border-amber-500/20 p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <span>🔄</span> რაში გსურთ გაცვლა? (არჩევითი)
                </span>
                <span className="text-[10px] text-amber-700/80 dark:text-amber-400 font-medium">
                  შეგიძლიათ დატოვოთ ცარიელი
                </span>
              </div>

              {/* Quick Preset Badges — Strictly 4 Presets */}
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  სწრაფი არჩევანი (დააკლიკეთ):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {TRADE_PRESETS.map((preset) => {
                    const isSelected = tradeTags.includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            removeTradeTag(preset);
                          } else {
                            addSpecificTag(preset);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-[12px] text-xs font-bold transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                            : "bg-card hover:bg-amber-500/15 text-foreground border-border/70 shadow-2xs"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {preset}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Tag Input with Live Autocomplete */}
              <div className="relative" ref={tagInputWrapperRef}>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={tagInput}
                      onChange={(e) => {
                        setTagInput(e.target.value);
                        setShowTagAutocomplete(true);
                      }}
                      onFocus={() => setShowTagAutocomplete(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (matchedSuggestions.length > 0 && tagInput.trim()) {
                            addSpecificTag(matchedSuggestions[0]);
                          } else {
                            addTradeTag();
                          }
                        }
                      }}
                      placeholder="ჩაწერე მცენარე: მაგ. კაქტუსი, სუკულენტი, Monstera..."
                      className="text-xs rounded-[14px] h-9 bg-card font-medium"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={addTradeTag}
                    size="sm"
                    className="rounded-[14px] bg-primary text-white text-xs font-bold shrink-0 cursor-pointer h-9 px-4"
                  >
                    + დამატება
                  </Button>
                </div>

                {/* 🔍 Live Autocomplete Suggestions Popup */}
                {showTagAutocomplete && matchedSuggestions.length > 0 && (
                  <div className="absolute left-0 right-16 top-full mt-1.5 max-h-48 overflow-y-auto rounded-[14px] border border-border/80 bg-card shadow-ambient-lg z-50 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                    <span className="text-[10px] font-bold text-muted-foreground px-2.5 py-1 block uppercase tracking-wider">
                      შემოთავაზებული მცენარეები & ინვენტარი:
                    </span>
                    {matchedSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => addSpecificTag(suggestion)}
                        className="w-full text-left px-3 py-1.5 rounded-[10px] text-xs font-semibold hover:bg-amber-500/15 text-foreground transition-colors cursor-pointer flex items-center justify-between"
                      >
                        <span>🌿 {suggestion}</span>
                        <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold">+ დამატება</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Selected Tags */}
              {tradeTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tradeTags.map((tag) => (
                    <Badge key={tag} variant="amber" className="gap-1 text-xs rounded-full py-0.5 px-2.5">
                      #{tag}
                      <button type="button" onClick={() => removeTradeTag(tag)} className="cursor-pointer hover:opacity-75">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
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

          {/* Contact Phone */}
          <div>
            <span className="text-xs font-bold text-foreground mb-1 block">
              📱 საკონტაქტო ნომერი *
            </span>
            <Input
              type="tel"
              required
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="მაგ: +995 555 123 456"
              className="rounded-[14px] h-10 text-xs sm:text-sm font-medium"
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mt-2">
              <p className="text-[10px] text-muted-foreground">
                გამოჩნდება განცხადებაზე — დაინტერესებულები ამ ნომრით დაგიკავშირდებიან.
              </p>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-primary cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={syncPhoneWithProfile}
                  onChange={(e) => setSyncPhoneWithProfile(e.target.checked)}
                  className="rounded-[4px] text-primary focus:ring-primary h-3.5 w-3.5 accent-emerald-600"
                />
                <span>შენახვა ჩემს ძირითად პროფილშიც</span>
              </label>
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
