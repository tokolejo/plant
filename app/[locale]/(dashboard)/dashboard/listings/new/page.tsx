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
  AlertCircle, 
  Check, 
  Sparkles, 
  Loader2, 
  MapPin, 
  Navigation, 
  Search, 
  ChevronDown,
  Camera,
  Tag,
  Shuffle,
  Gift,
  Coins,
  Handshake,
  ShieldAlert,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { STRUCTURED_CATEGORIES, type TaxonomyCategory } from "@/lib/categories-data";
import { validateListingContent } from "@/lib/moderation";

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
  "მონსტერა (Monstera)",
  "მონსტერა ალბო (Monstera Albo)",
  "მონსტერა ტაი (Thai Constellation)",
  "ფილოდენდრონი (Philodendron)",
  "ალოკაზია (Alocasia)",
  "ანთურიუმი (Anthurium)",
  "ორქიდეა (Orchid)",
  "ფიკუსი (Ficus)",
  "კალათეა (Calathea)",
  "პოთოსი (Pothos)",
  "სანსევიერია (Sansevieria)",
  "ზამიოკულკასი (ZZ Plant)",
  "ხოია (Hoya)",
  "ბონსაი (Bonsai)",
  "ქოთნები (Pots)",
  "კერამიკული ქოთანი",
  "სუბსტრატი / გრუნტი",
  "ორგანული სასუქი",
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
  const isKa = locale !== "en";
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

  // Optional Botanical Care State
  const [showBotanicalCare, setShowBotanicalCare] = React.useState(false);
  const [botanicalName, setBotanicalName] = React.useState("");
  const [wateringSchedule, setWateringSchedule] = React.useState(isKa ? "კვირაში 1-ხელ" : "Weekly");
  const [lightRequirement, setLightRequirement] = React.useState(isKa ? "კაშკაშა გაფანტული" : "Bright Indirect");
  const [careDifficulty, setCareDifficulty] = React.useState<"Easy" | "Medium" | "Expert">("Easy");
  const [toxicity, setToxicity] = React.useState("");

  // AI Recognition State
  const [aiDetecting, setAiDetecting] = React.useState(false);
  const [aiApplied, setAiApplied] = React.useState(false);
  const [gpsLoading, setGpsLoading] = React.useState(false);

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

  const selectedCategoryObj = React.useMemo(() => {
    return STRUCTURED_CATEGORIES.find((c) => c.id === plantCategory);
  }, [plantCategory]);

  const filteredCategories = React.useMemo(() => {
    let list = STRUCTURED_CATEGORIES.filter((c) => c.itemType === itemType);
    if (!categorySearchQuery.trim()) return list;
    const q = categorySearchQuery.toLowerCase().trim();
    return list.filter(
      (c) =>
        c.nameKa.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [itemType, categorySearchQuery]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);

    if (selectedFiles.length + newFiles.length > 5) {
      setErrorMsg(isKa ? "მაქსიმუმ 5 ფოტოს ატვირთვაა შესაძლებელი!" : "Maximum 5 photos allowed!");
      setTimeout(() => setErrorMsg(""), 3500);
      return;
    }

    const MAX_ALLOWED_MB = 15;
    for (const file of newFiles) {
      if (file.size > MAX_ALLOWED_MB * 1024 * 1024) {
        setErrorMsg(
          isKa
            ? `ფაილი "${file.name}" აღემატება ${MAX_ALLOWED_MB}MB-ს.`
            : `File "${file.name}" exceeds ${MAX_ALLOWED_MB}MB.`
        );
        setTimeout(() => setErrorMsg(""), 4000);
        return;
      }
    }

    const updatedFiles = [...selectedFiles, ...newFiles].slice(0, 5);
    setSelectedFiles(updatedFiles);
    setPreviews(updatedFiles.map((file) => URL.createObjectURL(file)));
    setErrorMsg("");
    setAiApplied(false);
  };

  const removeImage = (idx: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== idx);
    setSelectedFiles(updatedFiles);
    setPreviews(updatedFiles.map((file) => URL.createObjectURL(file)));
    if (updatedFiles.length === 0) {
      setAiApplied(false);
    }
  };

  // ──────────────────────────────────────────────
  // 1. Pl@ntNet Botanical AI Identification
  // ──────────────────────────────────────────────
  const [plantNetDetecting, setPlantNetDetecting] = React.useState(false);

  const handlePlantNetAutoFill = async () => {
    if (selectedFiles.length === 0) {
      setErrorMsg(isKa ? "გთხოვთ ჯერ ატვირთოთ მინიმუმ 1 ფოტო Pl@ntNet ამოცნობისთვის!" : "Please upload at least 1 photo for Pl@ntNet!");
      setTimeout(() => setErrorMsg(""), 3500);
      return;
    }

    setPlantNetDetecting(true);
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
        throw new Error(data.error || (isKa ? "Pl@ntNet-ით ამოცნობა ვერ მოხერხდა" : "Pl@ntNet identification failed"));
      }

      const result = data.data;

      if (result.title_ka || result.titleKa) setTitleKa(result.title_ka || result.titleKa);
      if (result.title_en || result.titleEn) setTitleEn(result.title_en || result.titleEn);
      if (result.description_ka || result.descKa) setDescKa(result.description_ka || result.descKa);
      if (result.description_en || result.descEn) setDescEn(result.description_en || result.descEn);
      if (result.botanical_name || result.latinName) setBotanicalName(result.botanical_name || result.latinName);
      if (result.watering_schedule || result.watering) setWateringSchedule(result.watering_schedule || result.watering);
      if (result.light_requirement || result.light) setLightRequirement(result.light_requirement || result.light);
      if (result.care_difficulty || result.careLevel) {
        const diff = (result.care_difficulty || result.careLevel || "").toLowerCase();
        if (diff.includes("easy") || diff.includes("მარტივი")) setCareDifficulty("Easy");
        else if (diff.includes("medium") || diff.includes("საშუალო")) setCareDifficulty("Medium");
        else if (diff.includes("expert") || diff.includes("რთული")) setCareDifficulty("Expert");
      }
      if (result.toxicity) setToxicity(result.toxicity);
      if (result.tags && Array.isArray(result.tags)) {
        setTradeTags((prev) => Array.from(new Set([...prev, ...result.tags])));
      }
      if (result.category) {
        const matched = STRUCTURED_CATEGORIES.find((c) => c.id === result.category);
        if (matched) {
          setPlantCategory(matched.id);
          setItemType(matched.itemType);
        }
      }

      setAiApplied(true);
      setShowBotanicalCare(true);
    } catch (err: any) {
      console.error("Pl@ntNet Recognition Error:", err);
      setErrorMsg(isKa ? `Pl@ntNet: ${err.message || "სცადეთ ხელახლა"}` : `Pl@ntNet: ${err.message || "Try again"}`);
      setTimeout(() => setErrorMsg(""), 5000);
    } finally {
      setPlantNetDetecting(false);
    }
  };

  // ──────────────────────────────────────────────
  // 2. Plant.id v3 Botanical AI Identification
  // ──────────────────────────────────────────────
  const [plantIdDetecting, setPlantIdDetecting] = React.useState(false);

  const handlePlantIdAutoFill = async () => {
    if (selectedFiles.length === 0) {
      setErrorMsg(isKa ? "გთხოვთ ჯერ ატვირთოთ მინიმუმ 1 ფოტო Plant.id ამოცნობისთვის!" : "Please upload at least 1 photo for Plant.id!");
      setTimeout(() => setErrorMsg(""), 3500);
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
        throw new Error(data.error || (isKa ? "Plant.id-ით ამოცნობა ვერ მოხერხდა" : "Plant.id identification failed"));
      }

      const result = data.data;

      if (result.title_ka || result.titleKa) setTitleKa(result.title_ka || result.titleKa);
      if (result.title_en || result.titleEn) setTitleEn(result.title_en || result.titleEn);
      if (result.description_ka || result.descKa) setDescKa(result.description_ka || result.descKa);
      if (result.description_en || result.descEn) setDescEn(result.description_en || result.descEn);
      if (result.botanical_name || result.latinName) setBotanicalName(result.botanical_name || result.latinName);
      if (result.watering_schedule || result.watering) setWateringSchedule(result.watering_schedule || result.watering);
      if (result.light_requirement || result.light) setLightRequirement(result.light_requirement || result.light);
      if (result.care_difficulty || result.careLevel) {
        const diff = (result.care_difficulty || result.careLevel || "").toLowerCase();
        if (diff.includes("easy") || diff.includes("მარტივი")) setCareDifficulty("Easy");
        else if (diff.includes("medium") || diff.includes("საშუალო")) setCareDifficulty("Medium");
        else if (diff.includes("expert") || diff.includes("რთული")) setCareDifficulty("Expert");
      }
      if (result.toxicity) setToxicity(result.toxicity);
      if (result.tags && Array.isArray(result.tags)) {
        setTradeTags((prev) => Array.from(new Set([...prev, ...result.tags])));
      }
      if (result.category) {
        const matched = STRUCTURED_CATEGORIES.find((c) => c.id === result.category);
        if (matched) {
          setPlantCategory(matched.id);
          setItemType(matched.itemType);
        }
      }

      setAiApplied(true);
      setShowBotanicalCare(true);
    } catch (err: any) {
      console.error("Plant.id Recognition Error:", err);
      setErrorMsg(isKa ? `Plant.id: ${err.message || "სცადეთ ხელახლა"}` : `Plant.id: ${err.message || "Try again"}`);
      setTimeout(() => setErrorMsg(""), 5000);
    } finally {
      setPlantIdDetecting(false);
    }
  };

const ALL_GEORGIAN_CITIES = [
  "თბილისი", "ბათუმი", "ქუთაისი", "რუსთავი", "გორი", "ზუგდიდი", "ფოთი", "თელავი",
  "მცხეთა", "ბორჯომი", "ქობულეთი", "ახალციხე", "სამტრედია", "ხაშური", "სენაკი",
  "ზესტაფონი", "მარნეული", "კასპი", "ჭიათურა", "წყალტუბო", "ოზურგეთი", "საგარეჯო",
  "გარდაბანი", "დუშეთი", "სიღნაღი", "ბოლნისი", "გურჯაანი", "ახალქალაქი",
  "სტეფანწმინდა / ყაზბეგი", "მესტია", "ამბროლაური", "ონი", "ლენტეხი", "დედოფლისწყარო",
  "ყვარელი", "ლაგოდეხი", "წალკა", "დმანისი", "ქარელი", "საჩხერე", "ხარაგაული",
  "ბაღდათი", "ვანი", "ხონი", "თერჯოლა", "აბაშა", "მარტვილი", "ჩხოროწყუ",
  "წალენჯიხა", "ხობი", "ლანჩხუთი", "ჩოხატაური", "ხელვაჩაური", "ქედა", "შუახევი",
  "ხულო", "ადიგენი", "ასპინძა", "ნინოწმინდა", "თიანეთი", "ახმეტა"
];

  // Coordinates & Detected Location State
  const [latitude, setLatitude] = React.useState<number | null>(null);
  const [longitude, setLongitude] = React.useState<number | null>(null);

  const handleGpsLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg(isKa ? "თქვენს ბრაუზერს არ აქვს GPS მხარდაჭერა." : "GPS not supported.");
      return;
    }
    setGpsLoading(true);
    setErrorMsg("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setLatitude(lat);
          setLongitude(lng);

          const res = await fetch("/api/geo/reverse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: lat,
              longitude: lng,
              locale,
            }),
          });

          const data = await res.json();
          if (data && data.success) {
            if (data.city) setCity(data.city);
            if (data.street || data.address) setAddress(data.street || data.address);
          } else {
            throw new Error(data?.error || "Geocoding failed");
          }
        } catch (err: any) {
          console.error("GPS Reverse Geocode Error:", err);
          setErrorMsg(isKa ? "მისამართის ამოცნობა ვერ მოხერხდა, გთხოვთ შეიყვანოთ ხელით." : "Could not determine street address.");
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        setErrorMsg(isKa ? "GPS წვდომა უარყოფილია. გთხოვთ ბრაუზერში დაუშვათ ლოკაცია." : "GPS access denied. Please allow location access.");
        setTimeout(() => setErrorMsg(""), 4000);
      },
      { timeout: 10000, maximumAge: 30000, enableHighAccuracy: true }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/auth/login?redirect=${encodeURIComponent("/dashboard/listings/new")}`);
      return;
    }

    if (selectedFiles.length < 2) {
      setErrorMsg(isKa ? "სავალდებულოა მინიმუმ 2 ფოტოს ატვირთვა!" : "Please upload at least 2 photos!");
      return;
    }
    if (!titleKa.trim() && !titleEn.trim()) {
      setErrorMsg(isKa ? "გთხოვთ შეიყვანოთ სათაური." : "Please enter a listing title.");
      return;
    }
    if (!plantCategory) {
      setErrorMsg(isKa ? "გთხოვთ აირჩიოთ კატეგორია!" : "Please select a category!");
      return;
    }
    if (!descKa.trim() && !descEn.trim()) {
      setErrorMsg(isKa ? "გთხოვთ შეიყვანოთ განცხადების აღწერა." : "Please provide a description.");
      return;
    }
    if (!contactPhone.trim()) {
      setErrorMsg(isKa ? "გთხოვთ შეიყვანოთ საკონტაქტო ნომერი." : "Please provide a contact phone number.");
      return;
    }

    // Botanical spam & safety filter
    const modResult = validateListingContent(titleKa || titleEn, descKa || descEn);
    if (!modResult.isValid) {
      setErrorMsg(isKa ? modResult.errorKa! : modResult.errorEn!);
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(isKa ? "სურათების ოპტიმიზაცია და კომპრესია..." : "Optimizing & compressing images...");

    try {
      const compressedFiles = await compressImagesBatch(selectedFiles, {
        maxDimension: 1600,
        quality: 0.82,
        mimeType: "image/webp",
      });

      const uploadedUrls: string[] = [];
      for (let i = 0; i < compressedFiles.length; i++) {
        setUploadProgress(
          isKa
            ? `იტვირთება ფოტო ${i + 1} / ${compressedFiles.length}...`
            : `Uploading image ${i + 1} / ${compressedFiles.length}...`
        );
        const { url, error } = await uploadListingImage(compressedFiles[i], user.id);
        if (error || !url) throw new Error(error || "Image upload failed");
        uploadedUrls.push(url);
      }

      setUploadProgress(isKa ? "განცხადება ინახება..." : "Saving listing...");

      const { data, error: insertError } = await supabase.from("listings").insert({
        user_id: user.id,
        title_ka: titleKa.trim() || titleEn.trim(),
        title_en: titleEn.trim() || titleKa.trim(),
        description_ka: descKa.trim() || descEn.trim(),
        description_en: descEn.trim() || descKa.trim(),
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
        latitude: latitude || null,
        longitude: longitude || null,
        contact_phone: contactPhone.trim() || null,
        trade_preferences: tradeTags,
        botanical_name: botanicalName.trim() || null,
        common_name: titleKa.trim() || null,
        watering_schedule: wateringSchedule || null,
        light_requirement: lightRequirement || null,
        care_difficulty: careDifficulty || null,
        toxicity: toxicity.trim() || null,
      }).select().single();

      if (insertError) throw insertError;

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
      setErrorMsg(err.message || (isKa ? "განცხადების შენახვისას დაფიქსირდა შეცდომა" : "Failed to save listing"));
      setIsSubmitting(false);
      setUploadProgress("");
    }
  };

  if (checkingAuth) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center space-y-3 min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-medium">
          {isKa ? "ავტორიზაციის შემოწმება..." : "Checking authentication..."}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-2xl space-y-6">
      
      {/* Header */}
      <div className="border-b border-border/60 pb-3">
        <h1 className="text-xl sm:text-2xl font-black text-foreground">
          {isKa ? "განცხადების განთავსება" : "Post a New Listing"}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5 font-medium">
          {isKa
            ? "გაყიდეთ, გაცვალეთ ან გააჩუქეთ მცენარეები და მოვლის აქსესუარები"
            : "Sell, trade, or giveaway houseplants, cuttings, and gardening supplies"}
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-[16px] bg-destructive/10 border border-destructive/20 p-3.5 text-xs text-destructive flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* ═══ 1. Item Type & Category ═══ */}
        <div className="rounded-[20px] border border-border/80 bg-card p-4 sm:p-5 shadow-2xs space-y-3.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            {isKa ? "1. ტიპი & კატეგორია" : "1. Type & Category"}
          </label>
          
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setItemType("PLANT");
                setPlantCategory("");
                setCategorySearchQuery("");
              }}
              className={`p-3 rounded-[14px] border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                itemType === "PLANT"
                  ? "border-primary bg-primary/10 text-primary shadow-2xs"
                  : "border-border/70 text-muted-foreground hover:bg-surface-container"
              }`}
            >
              <Sprout className="w-4 h-4" />
              <span>{isKa ? "მცენარე" : "Plant"}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setItemType("INVENTORY");
                setPlantCategory("");
                setCategorySearchQuery("");
              }}
              className={`p-3 rounded-[14px] border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                itemType === "INVENTORY"
                  ? "border-primary bg-primary/10 text-primary shadow-2xs"
                  : "border-border/70 text-muted-foreground hover:bg-surface-container"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{isKa ? "ინვენტარი" : "Inventory"}</span>
            </button>
          </div>

          {/* Searchable Sub-Category Combobox */}
          <div className="relative" ref={categoryWrapperRef}>
            <label className="text-[11px] font-bold text-foreground block mb-1">
              {itemType === "PLANT"
                ? (isKa ? "მცენარის სახეობა / ჯგუფი *" : "Plant Species / Group *")
                : (isKa ? "ინვენტარის კატეგორია *" : "Supplies Category *")}
            </label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
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
                    ? (isKa ? selectedCategoryObj.nameKa : selectedCategoryObj.nameEn)
                    : (isKa ? "მოძებნეთ კატეგორია (მაგ: სუკულენტი, მონსტერა, ქოთანი...)" : "Search category...")
                }
                className="w-full pl-9 pr-9 h-10 rounded-[12px] border border-border/80 bg-background text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-foreground placeholder:font-bold"
              />
              {categorySearchQuery ? (
                <button
                  type="button"
                  onClick={() => setCategorySearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              )}
            </div>

            {/* Selected Category Pill */}
            {selectedCategoryObj && !categoryDropdownOpen && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-muted-foreground font-medium">
                  {isKa ? "არჩეულია:" : "Selected:"}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[8px] bg-primary/10 text-primary border border-primary/20 text-xs font-bold">
                  <span>{isKa ? selectedCategoryObj.nameKa : selectedCategoryObj.nameEn}</span>
                </span>
              </div>
            )}

            {/* Dropdown Suggestions */}
            {categoryDropdownOpen && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1.5 max-h-60 overflow-y-auto rounded-[14px] border border-border/80 bg-card p-1.5 shadow-xl shadow-black/10">
                {filteredCategories.length > 0 ? (
                  <div className="space-y-0.5">
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
                          className={`w-full flex items-center justify-between p-2 rounded-[10px] text-left text-xs transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary text-white font-bold"
                              : "hover:bg-surface-container text-foreground"
                          }`}
                        >
                          <div>
                            <p className="font-bold">{isKa ? cat.nameKa : cat.nameEn}</p>
                            <p className={`text-[10px] ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>
                              {isKa ? cat.nameEn : cat.nameKa}
                            </p>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    {isKa ? "მსგავსი კატეგორია ვერ მოიძებნა." : "No matching categories found."}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ═══ 2. Photos & AI Recognition ═══ */}
        <div className="rounded-[20px] border border-border/80 bg-card p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {isKa ? "2. ფოტოები (2 - 5 ფოტო) *" : "2. Photos (2 - 5 photos) *"}
            </label>

            {/* Pl@ntNet and Plant.id AI Recognition Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Plant.id Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={selectedFiles.length === 0 || plantIdDetecting || plantNetDetecting}
                onClick={handlePlantIdAutoFill}
                className={`rounded-[10px] text-xs font-bold gap-1.5 h-8 border-border/80 transition-all cursor-pointer ${
                  selectedFiles.length > 0 && !plantIdDetecting
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                    : "hover:bg-surface-container"
                }`}
              >
                {plantIdDetecting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    <span>Plant.id...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Plant.id</span>
                  </>
                )}
              </Button>

              {/* Pl@ntNet Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={selectedFiles.length === 0 || plantNetDetecting || plantIdDetecting}
                onClick={handlePlantNetAutoFill}
                className={`rounded-[10px] text-xs font-bold gap-1.5 h-8 border-border/80 transition-all cursor-pointer ${
                  selectedFiles.length > 0 && !plantNetDetecting
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                    : "hover:bg-surface-container"
                }`}
              >
                {plantNetDetecting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    <span>Pl@ntNet...</span>
                  </>
                ) : (
                  <>
                    <Sprout className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pl@ntNet</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Photo Gallery Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
            {previews.map((src, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-[14px] border border-border/80 overflow-hidden bg-surface-container group shadow-2xs"
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
                <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-[6px]">
                  #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-destructive text-white rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {selectedFiles.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-[14px] border-2 border-dashed border-border/80 hover:border-primary/60 bg-surface-container/40 hover:bg-surface-container flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-all cursor-pointer"
              >
                <Camera className="w-5 h-5" />
                <span className="text-[10px] font-bold">
                  {selectedFiles.length === 0
                    ? (isKa ? "+ ფოტოები" : "+ Photos")
                    : `${selectedFiles.length} / 5`}
                </span>
              </button>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground">
            {isKa
              ? "პირველი ფოტო გამოჩნდება მთავარ გარეკანზე. მინიმუმ 2 ფოტო სავალდებულოა."
              : "First photo is the main cover. Minimum 2 photos required."}
          </p>
        </div>

        {/* ═══ 3. Details (Title, Transaction, Price, Description) ═══ */}
        <div className="rounded-[20px] border border-border/80 bg-card p-4 sm:p-5 shadow-2xs space-y-3.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            {isKa ? "3. დეტალები & ფასი" : "3. Details & Price"}
          </label>

          {/* Title Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-foreground block">
              {isKa ? "სათაური *" : "Listing Title *"}
            </label>
            <Input
              type="text"
              required
              value={isKa ? titleKa : (titleEn || titleKa)}
              onChange={(e) => {
                if (isKa) {
                  setTitleKa(e.target.value);
                  if (!titleEn) setTitleEn(e.target.value);
                } else {
                  setTitleEn(e.target.value);
                  if (!titleKa) setTitleKa(e.target.value);
                }
              }}
              placeholder={isKa ? "მაგ: მონსტერა ალბო ვარიეგატა (დაფესვიანებული კალამი)" : "e.g. Monstera Albo Variegata"}
              className="rounded-[12px] h-10 text-xs sm:text-sm font-medium"
            />
          </div>

          {/* Transaction Type Pills */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground block">
              {isKa ? "გარიგების ტიპი" : "Transaction Mode"}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: "FIXED", label: isKa ? "ფიქსირებული" : "Fixed Price", icon: Coins },
                { id: "NEGOTIABLE", label: isKa ? "შეთანხმებით" : "Negotiable", icon: Handshake },
                { id: "TRADE", label: isKa ? "გაცვლა (ISO)" : "Trade (ISO)", icon: Shuffle },
                { id: "GIFT", label: isKa ? "გაჩუქება (უფასოდ)" : "Giveaway", icon: Gift },
              ].map(({ id, label, icon: Icon }) => {
                const active = transactionType === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTransactionType(id as any)}
                    className={`px-2.5 py-2 rounded-[10px] text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                      active
                        ? "border-primary bg-primary text-white shadow-2xs"
                        : "border-border/80 bg-background text-muted-foreground hover:text-foreground hover:bg-surface-container"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Field (Hidden/Disabled on Trade & Gift) */}
          {transactionType !== "TRADE" && transactionType !== "GIFT" && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-foreground block">
                {isKa ? "ფასი (₾ ლარი) *" : "Price (GEL) *"}
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  inputMode="decimal"
                  required={transactionType === "FIXED"}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="rounded-[12px] h-10 text-xs sm:text-sm font-bold pl-3 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground pointer-events-none">
                  ₾
                </span>
              </div>
            </div>
          )}

          {/* Trade Preferences (Shown only when Trade/ISO is selected) */}
          {transactionType === "TRADE" && (
            <div className="space-y-1.5 p-3 rounded-[14px] bg-secondary-container/40 border border-border/70" ref={tagInputWrapperRef}>
              <label className="text-[11px] font-bold text-foreground block">
                {isKa ? "რაში გსურთ გაცვლა? (მცენარე / ინვენტარი)" : "Looking to trade for:"}
              </label>
              <div className="flex gap-1.5">
                <Input
                  type="text"
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value);
                    setShowTagAutocomplete(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSpecificTag(tagInput);
                    }
                  }}
                  placeholder={isKa ? "მაგ: მონსტერა ალბო, ფიკუსი, ქოთანი..." : "e.g. Anthurium, Pot..."}
                  className="rounded-[10px] h-9 text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => addSpecificTag(tagInput)}
                  className="rounded-[10px] h-9 px-3 text-xs font-bold"
                >
                  {isKa ? "დამატება" : "Add"}
                </Button>
              </div>

              {/* Tag Autocomplete Dropdown */}
              {showTagAutocomplete && matchedSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {matchedSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addSpecificTag(s)}
                      className="px-2 py-0.5 rounded-[6px] bg-background border border-border/80 text-[10px] font-bold hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Trade Tags */}
              {tradeTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {tradeTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => setTradeTags(tradeTags.filter((t) => t !== tag))}
                        className="hover:text-destructive cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-foreground block">
                {isKa ? "აღწერა *" : "Description *"}
              </label>
              <span className="text-[10px] text-muted-foreground">
                {(isKa ? descKa : descEn).length} / 2500
              </span>
            </div>
            <textarea
              required
              rows={4}
              maxLength={2500}
              value={isKa ? descKa : (descEn || descKa)}
              onChange={(e) => {
                if (isKa) {
                  setDescKa(e.target.value);
                  if (!descEn) setDescEn(e.target.value);
                } else {
                  setDescEn(e.target.value);
                  if (!descKa) setDescKa(e.target.value);
                }
              }}
              placeholder={
                isKa
                  ? "აღწერეთ მცენარის მდგომარეობა, ფესვთა სისტემა, ზომა და მოვლის დეტალები..."
                  : "Describe plant condition, root system, size, and care info..."
              }
              className="w-full rounded-[12px] border border-border/80 p-2.5 text-xs sm:text-sm text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y min-h-[90px]"
            />
          </div>
        </div>

        {/* ═══ 4. Optional Botanical Care Information ═══ */}
        <div className="rounded-[20px] border border-border/80 bg-card p-4 sm:p-5 shadow-2xs space-y-3">
          <button
            type="button"
            onClick={() => setShowBotanicalCare(!showBotanicalCare)}
            className="w-full flex items-center justify-between text-left cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sprout className="w-4 h-4 text-primary" />
              <div>
                <h3 className="text-xs font-bold text-foreground">
                  {isKa ? "ბოტანიკური მოვლის დეტალები" : "Botanical Care Details"}
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  {isKa ? "მორწყვა, განათება, სირთულე (არასავალდებულო)" : "Watering, sunlight, care difficulty (optional)"}
                </p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showBotanicalCare ? "rotate-180" : ""}`} />
          </button>

          {showBotanicalCare && (
            <div className="space-y-3 pt-2 border-t border-border/50 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground block">
                    {isKa ? "ლათინური / ბოტანიკური სახელი" : "Botanical / Latin Name"}
                  </label>
                  <Input
                    type="text"
                    value={botanicalName}
                    onChange={(e) => setBotanicalName(e.target.value)}
                    placeholder="e.g. Monstera deliciosa"
                    className="rounded-[10px] h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground block">
                    {isKa ? "მოვლის სირთულე" : "Care Difficulty"}
                  </label>
                  <select
                    value={careDifficulty}
                    onChange={(e) => setCareDifficulty(e.target.value as any)}
                    className="w-full h-9 rounded-[10px] border border-border/80 bg-background px-2.5 text-xs font-bold focus:outline-none"
                  >
                    <option value="Easy">{isKa ? "მარტივი (Easy)" : "Easy"}</option>
                    <option value="Medium">{isKa ? "საშუალო (Medium)" : "Medium"}</option>
                    <option value="Expert">{isKa ? "რთული (Expert)" : "Expert"}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground block">
                    {isKa ? "მორწყვის სიხშირე" : "Watering"}
                  </label>
                  <Input
                    type="text"
                    value={wateringSchedule}
                    onChange={(e) => setWateringSchedule(e.target.value)}
                    placeholder={isKa ? "მაგ: კვირაში 1-ხელ" : "e.g. Weekly"}
                    className="rounded-[10px] h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground block">
                    {isKa ? "განათება" : "Sunlight"}
                  </label>
                  <Input
                    type="text"
                    value={lightRequirement}
                    onChange={(e) => setLightRequirement(e.target.value)}
                    placeholder={isKa ? "მაგ: კაშკაშა გაფანტული" : "e.g. Bright Indirect"}
                    className="rounded-[10px] h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground block">
                  {isKa ? "ტოქსიკურობა ცხოველებისთვის" : "Pet Toxicity"}
                </label>
                <Input
                  type="text"
                  value={toxicity}
                  onChange={(e) => setToxicity(e.target.value)}
                  placeholder={isKa ? "მაგ: ტოქსიკურია კატებისთვის / უსაფრთხოა" : "e.g. Toxic to cats / Pet Friendly"}
                  className="rounded-[10px] h-9 text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* ═══ 5. Location, Delivery & Contact ═══ */}
        <div className="rounded-[20px] border border-border/80 bg-card p-4 sm:p-5 shadow-2xs space-y-3.5">
          {/* Header & GPS Trigger */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                {isKa ? "4. მდებარეობა & კონტაქტი" : "4. Location & Contact"}
              </label>
              <p className="text-[10px] text-muted-foreground">
                {isKa ? "მიუთითეთ ზუსტი მისამართი რუკისთვის" : "Specify accurate location for map"}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGpsLocation}
              disabled={gpsLoading}
              className="h-8 px-3 rounded-[10px] text-xs font-bold gap-1.5 border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-all cursor-pointer shrink-0"
            >
              <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? "animate-spin" : ""}`} />
              <span>
                {gpsLoading
                  ? (isKa ? "ძიება..." : "Locating...")
                  : (isKa ? "ჩემი ლოკაცია" : "My Location")}
              </span>
            </Button>
          </div>

          {/* City & Address Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-foreground block">
                {isKa ? "ქალაქი / რეგიონი *" : "City / Region *"}
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-10 rounded-[12px] border border-border/80 bg-background px-3 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {ALL_GEORGIAN_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-foreground block">
                {isKa ? "ქუჩა & სახლის ნომერი *" : "Street & House Number *"}
              </label>
              <Input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={isKa ? "მაგ: აღმაშენებლის გამზ. №45" : "e.g. 45 Aghmashenebeli Ave"}
                className="rounded-[12px] h-10 text-xs sm:text-sm"
              />
              {latitude && longitude && (
                <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 pt-1 animate-in fade-in">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{isKa ? "ზუსტი ლოკაცია დაფიქსირებულია" : "Exact location pinned"}</span>
                </p>
              )}
            </div>
          </div>

          {/* Delivery Methods */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground block">
              {isKa ? "მიწოდების მეთოდები" : "Delivery Options"}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {[
                { id: "PICKUP", label: isKa ? "ადგილიდან გატანა" : "Local Pick-up" },
                { id: "COURIER", label: isKa ? "საკურიერო მიწოდება" : "Courier Delivery" },
                { id: "MARSHRUTKA", label: isKa ? "სამარშრუტო / რეგიონი" : "Regional Transit" },
              ].map(({ id, label }) => {
                const checked = deliveryMethods.includes(id);
                return (
                  <label
                    key={id}
                    className={`flex items-center gap-2 p-2.5 rounded-[10px] border transition-all cursor-pointer select-none ${
                      checked
                        ? "border-primary bg-primary/5 text-primary font-bold"
                        : "border-border/80 bg-background text-muted-foreground"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDelivery(id)}
                      className="rounded-[4px] text-primary focus:ring-primary h-3.5 w-3.5 accent-emerald-600"
                    />
                    <span className="text-xs">{label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Contact Phone */}
          <div className="space-y-1 pt-1">
            <label className="text-[11px] font-bold text-foreground block">
              {isKa ? "საკონტაქტო მობილური *" : "Contact Phone *"}
            </label>
            <Input
              type="tel"
              inputMode="tel"
              required
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+995 5XX XX XX XX"
              className="rounded-[12px] h-10 text-xs sm:text-sm font-medium"
            />
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-primary cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={syncPhoneWithProfile}
                onChange={(e) => setSyncPhoneWithProfile(e.target.checked)}
                className="rounded-[4px] text-primary focus:ring-primary h-3.5 w-3.5 accent-emerald-600"
              />
              <span>{isKa ? "შენახვა ჩემს პროფილშიც" : "Save to my profile"}</span>
            </label>
          </div>
        </div>

        {/* ═══ 6. Submit Button (STRICTLY TEXT ONLY) ═══ */}
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
            className="w-full h-11 sm:h-12 rounded-[14px] bg-primary hover:bg-primary-container text-white font-bold text-xs sm:text-sm shadow-ambient cursor-pointer active:scale-[0.99] transition-all"
          >
            {isSubmitting
              ? (isKa ? "განცხადება იტვირთება..." : "Uploading...")
              : (isKa ? "განცხადების განთავსება" : "Post Listing")}
          </Button>
        </div>

      </form>
    </div>
  );
}
