"use client";

import * as React from "react";
import { useRouter, Link } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { compressImage, compressImageToBase64 } from "@/utils/image-compression";
import { 
  UploadCloud, 
  Trash2, 
  X, 
  Sparkles, 
  Check, 
  AlertCircle, 
  MapPin, 
  ShieldCheck, 
  ArrowLeft,
  Navigation,
  Loader2,
  Image as ImageIcon,
  HelpCircle,
  Clock,
  Layers,
  Sprout,
  Eye,
  EyeOff,
  Save,
  Search,
  ChevronDown,
  ExternalLink,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SAMPLE_LISTINGS } from "@/lib/mock-data";
import { STRUCTURED_CATEGORIES, type TaxonomyCategory } from "@/lib/categories-data";

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

export default function EditListingPage() {
  const routeParams = useParams();
  const listingId = (routeParams?.id as string) || "";
  const router = useRouter();
  const locale = useLocale();
  const supabase = createClient();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [loading, setLoading] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isOwner, setIsOwner] = React.useState(false);
  const [originalListing, setOriginalListing] = React.useState<any>(null);

  // Form State
  const [itemType, setItemType] = React.useState<"PLANT" | "INVENTORY">("PLANT");
  const [transactionType, setTransactionType] = React.useState<"FIXED" | "NEGOTIABLE" | "TRADE" | "GIFT">("FIXED");
  const [titleKa, setTitleKa] = React.useState("");
  const [titleEn, setTitleEn] = React.useState("");
  const [descKa, setDescKa] = React.useState("");
  const [descEn, setDescEn] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [plantCategory, setPlantCategory] = React.useState("monstera");
  const [categorySearchQuery, setCategorySearchQuery] = React.useState("");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = React.useState(false);
  const categoryWrapperRef = React.useRef<HTMLDivElement>(null);

  const [city, setCity] = React.useState("თბილისი");
  const [address, setAddress] = React.useState("");
  const [contactPhone, setContactPhone] = React.useState("");
  const [syncPhoneWithProfile, setSyncPhoneWithProfile] = React.useState(true);
  const [status, setStatus] = React.useState<"ACTIVE" | "HIDDEN">("ACTIVE");
  
  // Botanical Care State
  const [botanicalName, setBotanicalName] = React.useState("");
  const [wateringSchedule, setWateringSchedule] = React.useState("Weekly (კვირაში 1-ხელ)");
  const [lightRequirement, setLightRequirement] = React.useState("Bright Indirect (კაშკაშა გაფანტული)");
  const [careDifficulty, setCareDifficulty] = React.useState<"Easy" | "Medium" | "Expert">("Easy");
  const [toxicity, setToxicity] = React.useState("");

  const [deliveryMethods, setDeliveryMethods] = React.useState<string[]>(["PICKUP"]);
  const [tagInput, setTagInput] = React.useState("");
  const [tradeTags, setTradeTags] = React.useState<string[]>([]);
  const [showTagAutocomplete, setShowTagAutocomplete] = React.useState(false);
  const tagInputWrapperRef = React.useRef<HTMLDivElement>(null);
  
  // Images
  const [existingImages, setExistingImages] = React.useState<string[]>([]);
  const [newFiles, setNewFiles] = React.useState<File[]>([]);
  const [newPreviews, setNewPreviews] = React.useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState("");
  const [successMsg, setSuccessMsg] = React.useState("");
  const [savedId, setSavedId] = React.useState(listingId);

  // Close tag & category autocomplete on outside click
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

  // Fetch Listing & Check Permissions
  React.useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        let userIsAdmin = false;
        if (user) {
          if (user.email === "tokolejo@gmail.com") {
            userIsAdmin = true;
          } else {
            const { data: profile } = await supabase
              .from("profiles")
              .select("is_admin")
              .eq("id", user.id)
              .single();
            if (profile?.is_admin === true) {
              userIsAdmin = true;
            }
          }
        }
        setIsAdmin(userIsAdmin);

        // Fetch from Supabase
        let listingData: any = null;
        if (!listingId.startsWith("lst-")) {
          const { data, error } = await supabase
            .from("listings")
            .select("*, seller:profiles(*)")
            .eq("id", listingId)
            .single();

          if (data && !error) {
            listingData = data;
          }
        }

        // Fallback to sample listings if not in DB
        if (!listingData) {
          const sample = SAMPLE_LISTINGS.find((l) => l.id === listingId);
          if (sample) {
            listingData = {
              id: sample.id,
              user_id: user?.id, // allow edit in demo
              item_type: (sample as any).itemType || "PLANT",
              transaction_type: (sample as any).transactionType || "FIXED",
              title_ka: sample.title,
              title_en: (sample as any).titleEn || sample.title,
              description_ka: (sample as any).descriptionKa || (sample as any).description || "",
              description_en: (sample as any).descriptionEn || "",
              price: sample.price,
              plant_category: sample.plantCategory || "monstera",
              city: sample.city,
              address: sample.address || "",
              delivery_methods: sample.deliveryMethods || ["PICKUP"],
              trade_tags: (sample as any).tradeTags || [],
              images: sample.images || [(sample as any).image].filter(Boolean),
              status: (sample as any).status || "ACTIVE",
            };
          }
        }

        if (!listingData) {
          setErrorMsg("განცხადება ვერ მოიძებნა.");
          setLoading(false);
          return;
        }

        // Permission check
        const ownerMatch = user && user.id === listingData.user_id;
        setIsOwner(Boolean(ownerMatch));

        if (!user) {
          setErrorMsg("განცხადების რედაქტირებისთვის გთხოვთ გაიაროთ ავტორიზაცია.");
          setLoading(false);
          return;
        }

        if (!ownerMatch && !userIsAdmin) {
          setErrorMsg("თქვენ არ გაქვთ ამ განცხადების რედაქტირების უფლება.");
          setLoading(false);
          return;
        }

        setOriginalListing(listingData);

        // Populate fields
        setItemType((listingData.item_type as any) || "PLANT");
        setTransactionType((listingData.transaction_type as any) || "FIXED");
        setTitleKa(listingData.title_ka || listingData.title || "");
        setTitleEn(listingData.title_en || listingData.titleEn || "");
        setDescKa(listingData.description_ka || listingData.description || "");
        setDescEn(listingData.description_en || listingData.descriptionEn || "");
        setPrice(listingData.price !== undefined ? String(listingData.price) : "");
        
        const loadedCategory = listingData.plant_category || listingData.inventory_category || "monstera";
        setPlantCategory(loadedCategory);

        setCity(listingData.city || "თბილისი");
        setAddress(listingData.address || "");
        setContactPhone(listingData.contact_phone || listingData.seller?.phone || "");
        setBotanicalName(listingData.botanical_name || "");
        setWateringSchedule(listingData.watering_schedule || "Weekly (კვირაში 1-ხელ)");
        setLightRequirement(listingData.light_requirement || "Bright Indirect (კაშკაშა გაფანტული)");
        setCareDifficulty(listingData.care_difficulty || "Easy");
        setToxicity(listingData.toxicity || "");
        setStatus(listingData.status === "HIDDEN" ? "HIDDEN" : "ACTIVE");
        setDeliveryMethods(listingData.delivery_methods || ["PICKUP"]);
        setTradeTags(listingData.trade_preferences || listingData.trade_tags || []);
        setExistingImages(listingData.images || []);
      } catch (err: any) {
        console.error("Load error:", err);
        setErrorMsg(err.message || "მონაცემების ჩატვირთვა ვერ მოხერხდა.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [listingId, supabase, router]);

  // Remove existing photo
  const removeExistingImage = (idx: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // Select new files
  const handleNewFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    // Total limit 6
    const availableSlots = 6 - existingImages.length - newFiles.length;
    const filesToAdd = files.slice(0, availableSlots);

    if (filesToAdd.length < files.length) {
      setErrorMsg("სულ დასაშვებია მაქსიმუმ 6 ფოტო.");
      setTimeout(() => setErrorMsg(""), 3000);
    }

    setNewFiles((prev) => [...prev, ...filesToAdd]);

    // Create preview URLs
    const newUrls = filesToAdd.map((f) => URL.createObjectURL(f));
    setNewPreviews((prev) => [...prev, ...newUrls]);
  };

  const removeNewFile = (idx: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
    setNewPreviews((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
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

  const addSpecificTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (trimmed && !tradeTags.includes(trimmed)) {
      setTradeTags([...tradeTags, trimmed]);
      setTagInput("");
      setShowTagAutocomplete(false);
    }
  };

  // ──────────────────────────────────────────────
  // AI AutoFill Handlers
  // ──────────────────────────────────────────────
  const [aiStatusMsg, setAiStatusMsg] = React.useState<{ text: string; type: "info" | "success" | "error" } | null>(null);
  const [geminiDetecting, setGeminiDetecting] = React.useState(false);
  const [plantIdDetecting, setPlantIdDetecting] = React.useState(false);
  const [plantNetDetecting, setPlantNetDetecting] = React.useState(false);

  const getTargetFileForAi = async (): Promise<File | null> => {
    if (newFiles.length > 0) return newFiles[0];
    if (existingImages.length > 0) {
      try {
        const resp = await fetch(existingImages[0]);
        const blob = await resp.blob();
        return new File([blob], "plant.jpg", { type: blob.type || "image/jpeg" });
      } catch (err) {
        console.warn("Failed to fetch existing image blob for AI:", err);
      }
    }
    return null;
  };

  const applyAiResult = (result: any) => {
    if (result.titleKa || result.title_ka) setTitleKa(result.titleKa || result.title_ka);
    if (result.titleEn || result.title_en) setTitleEn(result.titleEn || result.title_en);
    if (result.descKa || result.description_ka) setDescKa(result.descKa || result.description_ka);
    if (result.descEn || result.description_en) setDescEn(result.descEn || result.description_en);
    if (result.botanicalName || result.botanical_name || result.latinName) setBotanicalName(result.botanicalName || result.botanical_name || result.latinName);
    if (result.watering || result.watering_schedule) setWateringSchedule(result.watering || result.watering_schedule);
    if (result.light || result.light_requirement) setLightRequirement(result.light || result.light_requirement);
    if (result.careDifficulty || result.care_difficulty || result.careLevel) {
      const diff = (result.careDifficulty || result.care_difficulty || result.careLevel || "").toLowerCase();
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
    if (result.itemType) {
      setItemType(result.itemType);
    }
  };

  const safeParseResponse = async (res: Response, defaultError: string) => {
    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      if (res.status === 413 || text.includes("Request Entity Too Large") || text.includes("Request En")) {
        throw new Error("ფოტოს ზომა დიდია, სცადეთ უფრო მცირე ზომის ფოტო");
      }
      throw new Error(`სერვერის შეცდომა (${res.status}): ${text.slice(0, 80)}`);
    }
    if (!res.ok || !data.success) {
      throw new Error(data?.error || defaultError);
    }
    return data.data;
  };

  const handleGeminiAutoFill = async () => {
    const file = await getTargetFileForAi();
    if (!file) {
      setAiStatusMsg({ text: "გთხოვთ ატვირთოთ მინიმუმ 1 ფოტო AI ამოცნობისთვის!", type: "error" });
      setTimeout(() => setAiStatusMsg(null), 3500);
      return;
    }
    setGeminiDetecting(true);
    setErrorMsg("");
    setAiStatusMsg({ text: "მიმდინარეობს Gemini AI ანალიზი...", type: "info" });
    try {
      const { imageBase64, mimeType } = await compressImageToBase64(file, { maxDimension: 800, quality: 0.75 });
      const res = await fetch("/api/ai/recognize-plant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType }),
      });
      const result = await safeParseResponse(res, "Gemini ამოცნობა ვერ მოხერხდა");
      applyAiResult(result);
      setAiStatusMsg({ text: `✨ წარმატებით ამოიცნო: ${result.titleKa || result.titleEn}`, type: "success" });
    } catch (err: any) {
      const msg = err.message || "სცადეთ ხელახლა";
      setAiStatusMsg({ text: `⚠️ Gemini AI: ${msg}`, type: "error" });
    } finally {
      setGeminiDetecting(false);
    }
  };

  const handlePlantIdAutoFill = async () => {
    const file = await getTargetFileForAi();
    if (!file) {
      setAiStatusMsg({ text: "გთხოვთ ატვირთოთ მინიმუმ 1 ფოტო Plant.id ამოცნობისთვის!", type: "error" });
      setTimeout(() => setAiStatusMsg(null), 3500);
      return;
    }
    setPlantIdDetecting(true);
    setErrorMsg("");
    setAiStatusMsg({ text: "მიმდინარეობს Plant.id ანალიზი...", type: "info" });
    try {
      const { imageBase64, mimeType } = await compressImageToBase64(file, { maxDimension: 800, quality: 0.75 });
      const res = await fetch("/api/ai/recognize-plantid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType }),
      });
      const result = await safeParseResponse(res, "Plant.id ამოცნობა ვერ მოხერხდა");
      applyAiResult(result);
      setAiStatusMsg({ text: `✨ წარმატებით ამოიცნო: ${result.titleKa || result.titleEn}`, type: "success" });
    } catch (err: any) {
      const msg = err.message || "სცადეთ ხელახლა";
      setAiStatusMsg({ text: `⚠️ Plant.id: ${msg}`, type: "error" });
    } finally {
      setPlantIdDetecting(false);
    }
  };

  const handlePlantNetAutoFill = async () => {
    const file = await getTargetFileForAi();
    if (!file) {
      setAiStatusMsg({ text: "გთხოვთ ატვირთოთ მინიმუმ 1 ფოტო Pl@ntNet ამოცნობისთვის!", type: "error" });
      setTimeout(() => setAiStatusMsg(null), 3500);
      return;
    }
    setPlantNetDetecting(true);
    setErrorMsg("");
    setAiStatusMsg({ text: "მიმდინარეობს Pl@ntNet ანალიზი...", type: "info" });
    try {
      const { imageBase64, mimeType } = await compressImageToBase64(file, { maxDimension: 800, quality: 0.75 });
      const res = await fetch("/api/ai/identify-plant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType }),
      });
      const result = await safeParseResponse(res, "Pl@ntNet ამოცნობა ვერ მოხერხდა");
      applyAiResult(result);
      setAiStatusMsg({ text: `✨ წარმატებით ამოიცნო: ${result.titleKa || result.titleEn}`, type: "success" });
    } catch (err: any) {
      const msg = err.message || "სცადეთ ხელახლა";
      setAiStatusMsg({ text: `⚠️ Pl@ntNet: ${msg}`, type: "error" });
    } finally {
      setPlantNetDetecting(false);
    }
  };

  // ──────────────────────────────────────────────
  // GPS & Address Autocomplete Handlers
  // ──────────────────────────────────────────────
  const [gpsLoading, setGpsLoading] = React.useState(false);
  const [latitude, setLatitude] = React.useState<number | null>(null);
  const [longitude, setLongitude] = React.useState<number | null>(null);
  const [addressSuggestions, setAddressSuggestions] = React.useState<any[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = React.useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = React.useState(false);

  React.useEffect(() => {
    if (!address || address.length < 2) {
      setAddressSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setIsSearchingAddress(true);
        const res = await fetch(`/api/geo/autocomplete?q=${encodeURIComponent(address)}&city=${encodeURIComponent(city)}&locale=ka`);
        const data = await res.json();
        if (data && data.results && data.results.length > 0) {
          setAddressSuggestions(data.results);
        }
      } catch (err) {
        console.warn("Autocomplete error:", err);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [address, city]);

  const handleGpsLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("თქვენს ბრაუზერს არ აქვს GPS მხარდაჭერა.");
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
            body: JSON.stringify({ latitude: lat, longitude: lng, locale: "ka" }),
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
          setErrorMsg("მისამართის ამოცნობა ვერ მოხერხდა, გთხოვთ შეიყვანოთ ხელით.");
        } finally {
          setGpsLoading(false);
        }
      },
      () => {
        setGpsLoading(false);
        setErrorMsg("GPS წვდომა უარყოფილია. გთხოვთ ბრაუზერში დაუშვათ ლოკაცია.");
        setTimeout(() => setErrorMsg(""), 4000);
      },
      { timeout: 10000, maximumAge: 30000, enableHighAccuracy: true }
    );
  };

  // Form Submit Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!titleKa.trim() && !titleEn.trim()) {
      setErrorMsg("სათაურის შეყვანა სავალდებულოა.");
      return;
    }

    const totalImagesCount = existingImages.length + newFiles.length;
    if (totalImagesCount < 1) {
      setErrorMsg("მინიმუმ 1 ფოტო აუცილებელია.");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress("ინფორმაცია მუშავდება...");

    try {
      // 1. Upload any new files to Supabase Storage
      const uploadedUrls: string[] = [];
      if (newFiles.length > 0) {
        setUploadProgress("ახალი ფოტოები იტვირთება სერვერზე...");
        for (let i = 0; i < newFiles.length; i++) {
          const file = newFiles[i];
          const fileExt = file.name.split(".").pop() || "jpg";
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
          const filePath = `${currentUser?.id || "admin"}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("listings")
            .upload(filePath, file, { contentType: file.type });

          if (uploadError) {
            console.warn("Storage upload warning, using base64/url:", uploadError);
            const reader = new FileReader();
            const b64 = await new Promise<string>((res) => {
              reader.onload = () => res(reader.result as string);
              reader.readAsDataURL(file);
            });
            uploadedUrls.push(b64);
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from("listings")
              .getPublicUrl(filePath);
            uploadedUrls.push(publicUrl);
          }
        }
      }

      const finalImages = [...existingImages, ...uploadedUrls];
      let savedListingId = listingId;

      const listingPayload = {
        item_type: itemType,
        transaction_type: transactionType,
        title_ka: titleKa.trim(),
        title_en: titleEn.trim() || titleKa.trim(),
        description_ka: descKa.trim(),
        description_en: descEn.trim() || descKa.trim(),
        price: (transactionType === "GIFT" || transactionType === "TRADE") ? 0 : Number(price) || 0,
        plant_category: plantCategory,
        inventory_category: itemType === "INVENTORY" ? plantCategory : null,
        city: city,
        address: address.trim(),
        contact_phone: contactPhone.trim() || null,
        botanical_name: botanicalName.trim() || null,
        common_name: titleKa.trim() || null,
        watering_schedule: wateringSchedule || null,
        light_requirement: lightRequirement || null,
        care_difficulty: careDifficulty || null,
        toxicity: toxicity.trim() || null,
        delivery_methods: deliveryMethods,
        trade_preferences: transactionType === "TRADE" ? tradeTags : [],
        images: finalImages,
        status: status,
        updated_at: new Date().toISOString(),
      };

      // 2. Update Database row (Always update existing row, never create duplicates)
      const targetId = (savedId && !savedId.startsWith("lst-")) ? savedId : listingId;

      if (!targetId.startsWith("lst-")) {
        const { error: updateErr } = await supabase
          .from("listings")
          .update(listingPayload)
          .eq("id", targetId);

        if (updateErr) {
          throw updateErr;
        }
        savedListingId = targetId;
      } else {
        // If editing a mock/sample listing for the first time, insert it into Supabase
        const { data: newRow, error: insertErr } = await supabase
          .from("listings")
          .insert([{
            user_id: currentUser?.id,
            ...listingPayload,
          }])
          .select("id")
          .single();

        if (insertErr) {
          throw insertErr;
        }
        if (newRow?.id) {
          savedListingId = newRow.id;
          setSavedId(newRow.id);
          router.replace(`/dashboard/listings/${newRow.id}/edit`);
        }
      }

      // Sync phone to profile if checked
      if (syncPhoneWithProfile && contactPhone.trim() && currentUser?.id) {
        await supabase.from("profiles").update({
          phone: contactPhone.trim(),
          updated_at: new Date().toISOString()
        }).eq("id", currentUser.id);
      }

      setSavedId(savedListingId);
      setSuccessMsg(" ცვლილებები წარმატებით შეინახა!");
      router.refresh();
    } catch (err: any) {
      console.error("Save error:", err);
      setErrorMsg(err.message || "განცხადების განახლება ვერ მოხერხდა.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress("");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-3xl text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-sm font-bold text-muted-foreground">იტვირთება განცხადების მონაცემები...</p>
      </div>
    );
  }

  if (errorMsg && !originalListing) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-foreground">{errorMsg}</h2>
        <Button onClick={() => router.push("/dashboard")} className="rounded-[14px] bg-primary text-white">
          <ArrowLeft className="w-4 h-4 mr-2" />
          კაბინეტში დაბრუნება
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          უკან დაბრუნება
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push(`/listings/${savedId}`)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[12px] border border-primary/40 hover:bg-primary/10 text-primary font-bold text-xs cursor-pointer transition-colors"
            title="საჯარო განცხადების გვერდზე გადასვლა"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>განცხადების ნახვა</span>
          </button>

          <Badge variant="outline" className="text-xs font-bold">
            ID: {savedId.substring(0, 8)}...
          </Badge>
          {isAdmin && !isOwner && (
            <Badge className="bg-amber-500 text-white font-bold text-xs gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              ადმინისტრატორის რეჟიმი
            </Badge>
          )}
        </div>
      </div>

      {/* Admin Notice Banner */}
      {isAdmin && !isOwner && (
        <div className="mb-6 rounded-[18px] bg-amber-500/10 border border-amber-500/30 p-4 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
              თქვენ არედაქტირებთ სხვა მომხმარებლის განცხადებას როგორც ადმინისტრატორი
            </p>
            <p className="text-[11px] text-amber-700/90 dark:text-amber-400">
              შენახული ცვლილებები მყისიერად აისახება საიტზე.
            </p>
          </div>
        </div>
      )}

      {/* Main Edit Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Item Type & Searchable Category Selector */}
        <div className="rounded-[24px] border border-border/80 bg-card p-5 shadow-sm space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            1. ძირითადი კატეგორია & სახეობა
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setItemType("PLANT");
                setPlantCategory("monstera");
                setCategorySearchQuery("");
              }}
              className={`p-3.5 rounded-[16px] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                itemType === "PLANT"
                  ? "bg-primary text-white border-primary shadow-ambient"
                  : "bg-background border-border/70 text-foreground hover:bg-surface-container"
              }`}
            >
              <Sprout className="w-4 h-4" />
               მცენარე
            </button>

            <button
              type="button"
              onClick={() => {
                setItemType("INVENTORY");
                setPlantCategory("pots-ceramic");
                setCategorySearchQuery("");
              }}
              className={`p-3.5 rounded-[16px] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                itemType === "INVENTORY"
                  ? "bg-primary text-white border-primary shadow-ambient"
                  : "bg-background border-border/70 text-foreground hover:bg-surface-container"
              }`}
            >
              <Layers className="w-4 h-4" />
               ინვენტარი & მოვლა
            </button>
          </div>

          {/* Searchable Sub-Category Combobox */}
          <div className="relative" ref={categoryWrapperRef}>
            <label className="text-xs font-bold text-foreground block mb-1.5">
              {itemType === "PLANT" ? "მცენარის სახეობა / ჯგუფი" : "ინვენტარის კატეგორია"}
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
                    : " აირჩიეთ კატეგორია ან ჩაწერეთ სახეობა..."
                }
                className="w-full pl-10 pr-10 h-11 rounded-[14px] border border-border/80 bg-background text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground placeholder:font-medium"
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

        {/* 2. Photos Section */}
        <div className="rounded-[24px] border border-border/80 bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              2. ფოტოები ({existingImages.length + newFiles.length} / 6)
            </label>

            {/* AI Recognition Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={existingImages.length + newFiles.length === 0 || geminiDetecting || plantIdDetecting || plantNetDetecting}
                onClick={handleGeminiAutoFill}
                className={`rounded-[10px] text-xs font-bold gap-1.5 h-8 border-border/80 transition-all cursor-pointer ${
                  existingImages.length + newFiles.length > 0 && !geminiDetecting
                    ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 hover:bg-purple-500/20"
                    : "hover:bg-surface-container"
                }`}
              >
                {geminiDetecting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    <span>Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-purple-600" />
                    <span>Gemini AI</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={existingImages.length + newFiles.length === 0 || plantIdDetecting || plantNetDetecting || geminiDetecting}
                onClick={handlePlantIdAutoFill}
                className={`rounded-[10px] text-xs font-bold gap-1.5 h-8 border-border/80 transition-all cursor-pointer ${
                  existingImages.length + newFiles.length > 0 && !plantIdDetecting
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

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={existingImages.length + newFiles.length === 0 || plantNetDetecting || plantIdDetecting || geminiDetecting}
                onClick={handlePlantNetAutoFill}
                className={`rounded-[10px] text-xs font-bold gap-1.5 h-8 border-border/80 transition-all cursor-pointer ${
                  existingImages.length + newFiles.length > 0 && !plantNetDetecting
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

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {/* Existing Images */}
            {existingImages.map((url, idx) => (
              <div key={`exist-${idx}`} className="relative aspect-square rounded-[16px] overflow-hidden border border-border/80 bg-surface-container group">
                <img src={url} alt="Listing photo" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeExistingImage(idx)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center shadow-xs hover:scale-110 transition-all cursor-pointer"
                  title="ფოტოს წაშლა"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {idx === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-[6px] bg-black/70 text-white text-[9px] font-black">
                    მთავარი
                  </span>
                )}
              </div>
            ))}

            {/* New Upload Previews */}
            {newPreviews.map((url, idx) => (
              <div key={`new-${idx}`} className="relative aspect-square rounded-[16px] overflow-hidden border-2 border-primary/40 bg-surface-container group">
                <img src={url} alt="New upload" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewFile(idx)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center shadow-xs hover:scale-110 transition-all cursor-pointer"
                  title="ფოტოს წაშლა"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-[6px] bg-primary text-white text-[9px] font-black">
                  ახალი
                </span>
              </div>
            ))}

            {/* Add Photo Button */}
            {existingImages.length + newFiles.length < 6 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-[16px] border-2 border-dashed border-border/80 hover:border-primary/60 bg-background/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-muted-foreground hover:text-primary"
              >
                <UploadCloud className="w-6 h-6" />
                <span className="text-[10px] font-bold">+ დამატება</span>
              </button>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleNewFiles}
            multiple
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* 3. Title & Description */}
        <div className="rounded-[24px] border border-border/80 bg-card p-5 shadow-sm space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            3. დასახელება & აღწერა
          </label>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-foreground block">სათაური (ქართულად) *</span>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {titleKa.length} / 80
                </span>
              </div>
              <Input
                value={titleKa}
                maxLength={80}
                onChange={(e) => setTitleKa(e.target.value)}
                placeholder="მაგ: Monstera Deliciosa (ვარიეგატა)"
                className="rounded-[14px] font-semibold text-xs sm:text-sm h-10"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-foreground block">სათაური (ინგლისურად / ლათინურად)</span>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {titleEn.length} / 80
                </span>
              </div>
              <Input
                value={titleEn}
                maxLength={80}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="მაგ: Monstera Deliciosa Variegata"
                className="rounded-[14px] text-xs sm:text-sm h-10"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-foreground block">დეტალური აღწერა</span>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {descKa.length} / 1500
                </span>
              </div>
              <textarea
                value={descKa}
                maxLength={1500}
                onChange={(e) => setDescKa(e.target.value)}
                placeholder="დაწერეთ მცენარის მდგომარეობა, სიმაღლე, მოვლის თავისებურებები..."
                className="w-full rounded-[16px] border border-input bg-background p-3 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[90px]"
              />
            </div>
          </div>
        </div>

        {/* 3.1 Botanical Care & Characteristics */}
        {itemType === "PLANT" && (
          <div className="rounded-[24px] border border-border/80 bg-card p-5 shadow-sm space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-primary" />
              ბოტანიკური მახასიათებლები & მოვლა
            </label>

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
                   მორწყვის გრაფიკი
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
                  ️ განათების მოთხოვნა
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
                   მოვლის სირთულე
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
                   ტოქსიკურობა (შინაური ცხოველების უსაფრთხოება)
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

        {/* 4. Transaction Type & Price */}
        <div className="rounded-[24px] border border-border/80 bg-card p-5 shadow-sm space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            4. გარიგების ტიპი & ფასი
          </label>

          {/* Transaction Type Buttons */}
          <div>
            <span className="text-xs font-bold text-foreground block mb-1.5">გარიგების ტიპი</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "FIXED", label: "ფიქსირებული", emoji: "" },
                { id: "NEGOTIABLE", label: "შეთანხმებით", emoji: "" },
                { id: "TRADE", label: "გაცვლა", emoji: "" },
                { id: "GIFT", label: "გაჩუქება", emoji: "" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTransactionType(t.id as any)}
                  className={`py-2.5 px-2 rounded-[14px] text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer border ${
                    transactionType === t.id
                      ? "bg-primary text-white border-primary shadow-ambient"
                      : "bg-background border-border/70 text-foreground hover:bg-surface-container"
                  }`}
                >
                  <span className="text-base">{t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Input (if not GIFT and not TRADE) */}
          {transactionType !== "GIFT" && transactionType !== "TRADE" && (
            <div>
              <span className="text-xs font-bold text-foreground block mb-1">ფასი (₾ ლარი)</span>
              <Input
                type="number"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="ჩაწერეთ ფასი ლარში"
                className="rounded-[14px] h-10 text-xs sm:text-sm font-bold"
              />
            </div>
          )}

          {/* Trade Tags Section */}
          {transactionType === "TRADE" && (
            <div className="rounded-[18px] bg-amber-500/10 border border-amber-500/20 p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <span></span> რაში გსურთ გაცვლა? (არჩევითი)
                </span>
                <span className="text-[10px] text-amber-700/80 dark:text-amber-400 font-medium">
                  შეგიძლიათ დატოვოთ ცარიელი
                </span>
              </div>

              {/* 4 Presets */}
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
                      {isSelected ? " " : "+ "}
                      {preset}
                    </button>
                  );
                })}
              </div>

              {/* Tag Input with Autocomplete */}
              <div className="relative" ref={tagInputWrapperRef}>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => {
                      setTagInput(e.target.value);
                      setShowTagAutocomplete(true);
                    }}
                    onFocus={() => setShowTagAutocomplete(true)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (matchedSuggestions.length > 0 && tagInput.trim()) {
                          addSpecificTag(matchedSuggestions[0]);
                        } else if (tagInput.trim()) {
                          addSpecificTag(tagInput);
                        }
                      }
                    }}
                    placeholder="ჩაწერე მცენარე: მაგ. კაქტუსი, სუკულენტი, Monstera..."
                    className="text-xs rounded-[14px] h-9 bg-card font-medium"
                  />
                  <Button
                    type="button"
                    onClick={() => tagInput.trim() && addSpecificTag(tagInput)}
                    size="sm"
                    className="rounded-[14px] bg-primary text-white text-xs font-bold shrink-0 h-9 px-4"
                  >
                    + დამატება
                  </Button>
                </div>

                {showTagAutocomplete && matchedSuggestions.length > 0 && (
                  <div className="absolute left-0 right-16 top-full mt-1.5 max-h-48 overflow-y-auto rounded-[14px] border border-border/80 bg-card shadow-ambient-lg z-50 p-1.5 space-y-0.5">
                    {matchedSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => addSpecificTag(suggestion)}
                        className="w-full text-left px-3 py-1.5 rounded-[10px] text-xs font-semibold hover:bg-amber-500/15 text-foreground transition-colors cursor-pointer flex items-center justify-between"
                      >
                        <span> {suggestion}</span>
                        <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold">+ დამატება</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Tags */}
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

        {/* 5. Location & Delivery */}
        <div className="rounded-[24px] border border-border/80 bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              5. მდებარეობა & მიწოდება
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGpsLocation}
              disabled={gpsLoading}
              className="h-8 px-3 rounded-[10px] text-xs font-bold gap-1.5 border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-all cursor-pointer shrink-0"
            >
              <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? "animate-spin" : ""}`} />
              <span>{gpsLoading ? "ძიება..." : "ჩემი ლოკაცია"}</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-xs font-bold text-foreground block mb-1">ქალაქი / რეგიონი</span>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-10 px-3 rounded-[14px] border border-border/80 bg-background text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="თბილისი">თბილისი</option>
                <option value="ბათუმი">ბათუმი</option>
                <option value="ქუთაისი">ქუთაისი</option>
                <option value="რუსთავი">რუსთავი</option>
                <option value="მცხეთა">მცხეთა</option>
                <option value="გორი">გორი</option>
                <option value="თელავი">თელავი</option>
                <option value="ზუგდიდი">ზუგდიდი</option>
                <option value="ფოთი">ფოთი</option>
              </select>
            </div>

            <div className="space-y-1 relative">
              <span className="text-xs font-bold text-foreground block mb-1">ქუჩა & სახლის ნომერი</span>
              <div className="relative">
                <Input
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setShowAddressSuggestions(true);
                  }}
                  onFocus={() => {
                    if (addressSuggestions.length > 0) setShowAddressSuggestions(true);
                  }}
                  placeholder="მაგ: მერაბ მამარდაშვილის ქუჩა 22"
                  className="rounded-[14px] text-xs sm:text-sm h-10 pr-8"
                />
                {isSearchingAddress && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground absolute right-3 top-3.5" />
                )}
              </div>

              {/* Autocomplete Suggestions Dropdown */}
              {showAddressSuggestions && addressSuggestions.length > 0 && (
                <div className="absolute z-30 left-0 right-0 top-[66px] bg-popover border border-border/80 rounded-[14px] shadow-lg overflow-hidden py-1 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95">
                  {addressSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAddress(item.address || item.formatted);
                        if (item.lat && item.lng) {
                          setLatitude(item.lat);
                          setLongitude(item.lng);
                        }
                        if (item.city) setCity(item.city);
                        setShowAddressSuggestions(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-surface-container flex items-start gap-2 text-xs transition-colors cursor-pointer border-b border-border/30 last:border-0"
                    >
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-foreground">{item.address}</div>
                        <div className="text-[10px] text-muted-foreground">{item.formatted}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {latitude && longitude && (
                <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 pt-1 animate-in fade-in">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>ზუსტი ლოკაცია დაფიქსირებულია</span>
                </p>
              )}
            </div>
          </div>

          {/* Delivery Methods */}
          <div>
            <span className="text-xs font-bold text-foreground block mb-1.5">მიწოდების მეთოდები</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: "PICKUP", label: " ადგილზე გატანა" },
                { id: "COURIER", label: " საკურიერო მიწოდება" },
                { id: "MARSHRUTKA", label: " სამარშრუტო / რეგიონი" },
              ].map((m) => {
                const isSelected = deliveryMethods.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleDelivery(m.id)}
                    className={`p-2.5 rounded-[12px] text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer border ${
                      isSelected
                        ? "bg-primary/10 text-primary border-primary/40 font-bold"
                        : "bg-background border-border/70 text-foreground hover:bg-surface-container"
                    }`}
                  >
                    <span>{m.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contact Phone */}
          <div className="border-t border-border/50 pt-3">
            <span className="text-xs font-bold text-foreground mb-1 block">
               საკონტაქტო ნომერი *
            </span>
            <Input
              type="tel"
              inputMode="tel"
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

        {/* 6. Visibility Status (Active / Hidden) */}
        <div className="rounded-[24px] border border-border/80 bg-card p-5 shadow-sm space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            6. განცხადების სტატუსი
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setStatus("ACTIVE")}
              className={`p-3 rounded-[16px] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                status === "ACTIVE"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-background border-border/70 text-foreground hover:bg-surface-container"
              }`}
            >
              <Eye className="w-4 h-4" />
               აქტიური (ჩანს საიტზე)
            </button>

            <button
              type="button"
              onClick={() => setStatus("HIDDEN")}
              className={`p-3 rounded-[16px] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                status === "HIDDEN"
                  ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                  : "bg-background border-border/70 text-foreground hover:bg-surface-container"
              }`}
            >
              <EyeOff className="w-4 h-4" />
               დამალული (საიტზე არ ჩანს)
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-3.5 rounded-[16px] bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-[18px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-black">{successMsg}</p>
                <p className="text-[11px] text-muted-foreground">მონაცემები წარმატებით განახლდა მონაცემთა ბაზაში.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push(`/listings/${savedId}`)}
                className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs cursor-pointer transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>განცხადების ნახვა</span>
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-[10px] border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/10 font-bold text-xs cursor-pointer transition-colors"
              >
                <span>კაბინეტში დაბრუნება</span>
              </button>
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="rounded-[16px] h-12 px-6 font-bold text-xs cursor-pointer"
          >
            გაუქმება
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-[16px] bg-primary hover:bg-primary-container text-white font-black text-sm h-12 px-8 shadow-ambient cursor-pointer gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{uploadProgress || "ინახება..."}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>ცვლილებების შენახვა</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
