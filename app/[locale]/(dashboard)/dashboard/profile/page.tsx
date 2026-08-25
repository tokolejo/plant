"use client";

import * as React from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { uploadListingImage } from "@/utils/supabase/storage";
import { compressImage } from "@/utils/image-compression";
import { 
  User, 
  Phone, 
  MapPin, 
  Camera, 
  Check, 
  Loader2, 
  ShieldCheck, 
  Sparkles, 
  Save, 
  ArrowLeft,
  Store,
  ExternalLink,
  Lock,
  Key,
  MessageCircle,
  Instagram,
  Send,
  Bell,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Sliders,
  Award,
  Sprout,
  Stethoscope
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type ProfileTab = "general" | "social" | "security" | "notifications";

export default function ProfileEditPage() {
  const locale = useLocale();
  const isKa = locale !== "en";
  const supabase = createClient();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [passwordSaving, setPasswordSaving] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState("");
  const [passwordSuccess, setPasswordSuccess] = React.useState("");
  const [passwordError, setPasswordError] = React.useState("");

  const [activeTab, setActiveTab] = React.useState<ProfileTab>("general");

  // User State
  const [userId, setUserId] = React.useState<string>("");
  const [userEmail, setUserEmail] = React.useState<string>("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [city, setCity] = React.useState("თბილისი");
  const [location, setLocation] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [customSlug, setCustomSlug] = React.useState("");
  const [subscriptionTier, setSubscriptionTier] = React.useState("FREE");
  const [averageRating, setAverageRating] = React.useState(5.0);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string>("");

  // Social & Messengers State
  const [whatsapp, setWhatsapp] = React.useState("");
  const [sameAsPhone, setSameAsPhone] = React.useState(false);
  const [telegram, setTelegram] = React.useState("");
  const [instagram, setInstagram] = React.useState("");
  const [facebook, setFacebook] = React.useState("");

  // Notification Preferences State
  const [notifyEmailInquiries, setNotifyEmailInquiries] = React.useState(true);
  const [notifyEmailUpdates, setNotifyEmailUpdates] = React.useState(true);

  // Security / Password State
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  React.useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);
        setUserEmail(user.email || "");

        const { data: prof, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (prof && !error) {
          setFirstName(prof.first_name || prof.full_name?.split(" ")[0] || "");
          setLastName(prof.last_name || prof.full_name?.split(" ").slice(1).join(" ") || "");
          setPhone(prof.phone || "");
          setCity(prof.city || "თბილისი");
          setLocation(prof.location || prof.address || "");
          setBio(prof.bio || "");
          setAvatarUrl(prof.avatar_url || "");
          setCustomSlug(prof.custom_slug || "");
          setSubscriptionTier(prof.subscription_tier || "FREE");
          setAverageRating(prof.average_rating ? Number(prof.average_rating) : 5.0);

          // Parse social links if present
          if (prof.social_links) {
            const sl = typeof prof.social_links === "string" ? JSON.parse(prof.social_links) : prof.social_links;
            setWhatsapp(sl.whatsapp || "");
            setTelegram(sl.telegram || "");
            setInstagram(sl.instagram || "");
            setFacebook(sl.facebook || "");
            if (sl.whatsapp && sl.whatsapp === prof.phone) {
              setSameAsPhone(true);
            }
          }

          // Parse notification preferences
          if (prof.notification_preferences) {
            const np = typeof prof.notification_preferences === "string" ? JSON.parse(prof.notification_preferences) : prof.notification_preferences;
            setNotifyEmailInquiries(np.emailInquiries ?? true);
            setNotifyEmailUpdates(np.emailUpdates ?? true);
          }
        }
      } catch (err) {
        console.warn("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [supabase]);

  // Compute Profile Strength / Completeness Score
  const completeness = React.useMemo(() => {
    let score = 0;
    const missing: string[] = [];

    if (avatarUrl || avatarPreview) score += 20;
    else missing.push(isKa ? "ავატარის ფოტო" : "Avatar Photo");

    if (firstName.trim() && lastName.trim()) score += 20;
    else missing.push(isKa ? "სახელი და გვარი" : "Full Name");

    if (phone.trim()) score += 20;
    else missing.push(isKa ? "მობილურის ნომერი" : "Phone Number");

    if (city.trim() && location.trim()) score += 15;
    else missing.push(isKa ? "ზუსტი მისამართი" : "Detailed Address");

    if (bio.trim()) score += 15;
    else missing.push(isKa ? "ბიოგრაფია / ჩემ შესახებ" : "Bio Description");

    if (whatsapp.trim() || telegram.trim() || instagram.trim() || facebook.trim()) score += 10;
    else missing.push(isKa ? "საკონტაქტო მესინჯერი (WhatsApp/Telegram)" : "Messenger link");

    return { score, missing };
  }, [avatarUrl, avatarPreview, firstName, lastName, phone, city, location, bio, whatsapp, telegram, instagram, facebook, isKa]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // Format Georgian Phone Numbers (+995 5XX XX-XX-XX)
  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (sameAsPhone) {
      setWhatsapp(val);
    }
  };

  const handleToggleSameAsPhone = (checked: boolean) => {
    setSameAsPhone(checked);
    if (checked) {
      setWhatsapp(phone);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      let finalAvatarUrl = avatarUrl;

      // Upload new avatar if selected
      if (avatarFile && userId) {
        const compressed = await compressImage(avatarFile, {
          maxDimension: 500,
          quality: 0.85,
          mimeType: "image/jpeg",
        });
        const { url, error: uploadErr } = await uploadListingImage(compressed, userId);
        if (uploadErr || !url) throw new Error(uploadErr || "ავატარის ატვირთვა ვერ მოხერხდა");
        finalAvatarUrl = url;
        setAvatarUrl(url);
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone,
          city,
          location,
          bio,
          avatar_url: finalAvatarUrl,
          custom_slug: customSlug || undefined,
          social_links: {
            whatsapp: sameAsPhone ? phone : whatsapp,
            telegram,
            instagram,
            facebook,
          },
          notification_preferences: {
            emailInquiries: notifyEmailInquiries,
            emailUpdates: notifyEmailUpdates,
          },
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "პროფილის შენახვა ვერ მოხერხდა");
      }

      setSuccessMsg(isKa ? "პროფილის მონაცემები წარმატებით განახლდა! " : "Profile successfully updated! ");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "შეცდომა პროფილის შენახვისას");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 6) {
      setPasswordError(isKa ? "პაროლი უნდა შედგებოდეს მინიმუმ 6 სიმბოლოსგან" : "Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(isKa ? "პაროლები ერთმანეთს არ ემთხვევა" : "Passwords do not match");
      return;
    }

    setPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPasswordSuccess(isKa ? "პაროლი წარმატებით შეიცვალა! " : "Password successfully updated! ");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(""), 4000);
    } catch (err: any) {
      setPasswordError(err.message || "პაროლის შეცვლა ვერ მოხერხდა");
    } finally {
      setPasswordSaving(false);
    }
  };

  const fullNameDisplay = [firstName, lastName].filter(Boolean).join(" ").trim() || "მომხმარებელი";
  const avatarLetter = firstName ? firstName.charAt(0).toUpperCase() : "U";

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <span className="font-bold">{isKa ? "იტვირთება პროფილი..." : "Loading Profile..."}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl space-y-6">
      {/* 1. Header & Navigation Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-black text-muted-foreground hover:text-primary transition-colors bg-surface-container/60 hover:bg-surface-container px-3 py-1.5 rounded-[12px] border border-border/50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isKa ? "კაბინეტში დაბრუნება" : "Back to Dashboard"}</span>
          </Link>
          <h1 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            <span>{isKa ? "პროფილის მართვა" : "Profile Management"}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <Link
            href="/dashboard/greenhouse"
            className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3.5 py-2 rounded-[12px] border border-emerald-500/20 transition-all cursor-pointer"
          >
            <Sprout className="w-4 h-4 text-emerald-600" />
            <span>{isKa ? "ჩემი ორანჟერეა" : "My Greenhouse"}</span>
          </Link>

          {customSlug && (
            <Link
              href={`/shops/${customSlug}`}
              className="inline-flex items-center gap-2 text-xs font-black text-primary bg-primary/10 hover:bg-primary/20 px-3.5 py-2 rounded-[12px] border border-primary/20 transition-all"
            >
              <Store className="w-4 h-4" />
              <span>{isKa ? "მაღაზიის ვიტრინა" : "Storefront"}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* 2. Profile Strength / Completeness Meter */}
      <div className="rounded-[22px] border border-border/80 bg-gradient-to-br from-card via-card to-surface-container/30 p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-foreground">
                  {isKa ? "პროფილის სისრულე" : "Profile Strength"}
                </span>
                <Badge className={`text-[11px] font-black border-none ${
                  completeness.score >= 80 ? "bg-emerald-600 text-white" : completeness.score >= 50 ? "bg-primary text-white" : "bg-muted text-foreground"
                }`}>
                  {completeness.score}%
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {completeness.score === 100
                  ? (isKa ? " თქვენი პროფილი სრულად შევსებულია და მზადაა მაქსიმალური ნდობისთვის!" : " Your profile is 100% complete!")
                  : (isKa ? `დარჩენილია: ${completeness.missing.slice(0, 2).join(", ")}` : `Complete: ${completeness.missing.slice(0, 2).join(", ")}`)}
              </p>
            </div>
          </div>

          <div className="text-[11px] font-bold text-muted-foreground hidden sm:block">
            {completeness.score < 100 && (
              <span className="text-primary font-extrabold">{isKa ? "+ ნდობის ზრდა" : "+ Trust Boost"}</span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden p-0.5 border border-border/60">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${completeness.score}%` }}
          />
        </div>
      </div>
      {/* 2.5. Botanical Status & Achievement Badges */}
      <div className="rounded-[22px] border border-border/80 bg-card p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-black uppercase tracking-wider text-foreground">
              {isKa ? "ბოტანიკური რანგი & მიღწევები" : "Botanical Rank & Achievements"}
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-[10px] font-black border border-emerald-500/20">
            {isKa ? "დონე 2: ორანჟერეის ოსტატი" : "Level 2: Greenhouse Master"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-2.5 rounded-[14px] bg-secondary-container/40 border border-border/60 flex items-center gap-2">
            <Sprout className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="text-[11px] font-black text-foreground block">მწვანე თითი</span>
              <span className="text-[9.5px] text-muted-foreground">ორანჟერეის წევრი</span>
            </div>
          </div>

          <div className="p-2.5 rounded-[14px] bg-secondary-container/40 border border-border/60 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <span className="text-[11px] font-black text-foreground block">ვერიფიცირებული</span>
              <span className="text-[9.5px] text-muted-foreground">ნომერი დადასტურებულია</span>
            </div>
          </div>

          <div className="p-2.5 rounded-[14px] bg-secondary-container/40 border border-border/60 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-teal-600 shrink-0" />
            <div>
              <span className="text-[11px] font-black text-foreground block">მცენარის ექიმი</span>
              <span className="text-[9.5px] text-muted-foreground">AI დიაგნოსტიკა</span>
            </div>
          </div>

          <div className="p-2.5 rounded-[14px] bg-secondary-container/40 border border-border/60 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <span className="text-[11px] font-black text-foreground block">კომუნის წევრი</span>
              <span className="text-[9.5px] text-muted-foreground">აქტიური მებაღე</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tabbed Edit Interface */}
        <div className="lg:col-span-8 space-y-5">
          {/* Modern Segmented Tab Bar */}
          <div className="flex items-center gap-1.5 p-1 bg-surface-container/60 rounded-[16px] border border-border/60 overflow-x-auto no-scrollbar">
            {[
              { id: "general", label: isKa ? "ძირითადი" : "General", icon: User },
              { id: "social", label: isKa ? "მესინჯერები" : "Social/Chat", icon: Share2 },
              { id: "security", label: isKa ? "უსაფრთხოება" : "Security", icon: Lock },
              { id: "notifications", label: isKa ? "შეტყობინებები" : "Alerts", icon: Bell },
            ].map((tab) => {
              const IconComp = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as ProfileTab)}
                  className={`flex-1 min-w-[120px] sm:min-w-0 py-2 px-3 rounded-[12px] text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? "bg-card text-foreground shadow-xs border border-border/60"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Feedback Notices */}
          {successMsg && (
            <div className="rounded-[16px] bg-emerald-500/15 border border-emerald-500/30 p-3.5 text-xs font-black text-emerald-900 dark:text-emerald-200 animate-in fade-in flex items-center gap-2.5 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="rounded-[16px] bg-destructive/15 border border-destructive/30 p-3.5 text-xs font-black text-destructive animate-in fade-in flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: GENERAL INFO                                              */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {activeTab === "general" && (
            <div className="rounded-[24px] border border-border/80 bg-card p-5 sm:p-7 shadow-ambient space-y-6 animate-in fade-in">
              <div className="border-b border-border/50 pb-4">
                <h2 className="text-base font-black text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <span>{isKa ? "პერსონალური მონაცემები" : "Personal Information"}</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isKa
                    ? "თქვენი საკონტაქტო ნომერი და სახელი ავტომატურად გამოჩნდება თქვენს განცხადებებზე."
                    : "Your contact information will be shown on your published listings."}
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                {/* Avatar Uploader Section */}
                <div className="flex items-center gap-4 p-3.5 rounded-[18px] bg-surface-container/40 border border-border/50">
                  <div className="relative h-20 w-20 rounded-[18px] ring-2 ring-primary/20 overflow-hidden bg-primary/10 flex items-center justify-center font-black text-xl text-primary shrink-0 shadow-2xs">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                    ) : avatarUrl ? (
                      <Image src={avatarUrl} alt="avatar" fill className="object-cover" />
                    ) : (
                      <span>{avatarLetter}</span>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:text-white hover:bg-primary border border-primary/30 px-3.5 py-1.5 rounded-[10px] bg-primary/10 transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isKa ? "ავატარის შეცვლა" : "Upload Photo"}</span>
                    </button>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      {isKa ? "JPG, PNG ან WebP (ავტო-ოპტიმიზაცია WebP-ში)" : "Auto-compressed to WebP"}
                    </p>
                  </div>
                </div>

                {/* Name Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-black text-foreground block mb-1">
                      {isKa ? "სახელი *" : "First Name *"}
                    </label>
                    <Input
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="მაგ: თამარ"
                      className="h-10.5 rounded-[14px] text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-foreground block mb-1">
                      {isKa ? "გვარი *" : "Last Name *"}
                    </label>
                    <Input
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="მაგ: კობახიძე"
                      className="h-10.5 rounded-[14px] text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Mobile Phone Input */}
                <div>
                  <label className="text-xs font-black text-foreground block mb-1">
                    {isKa ? "საკონტაქტო მობილური *" : "Contact Phone Number *"}
                  </label>
                  <div className="relative">
                    <Input
                      required
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="557 579 123 ან +995 557 579 123"
                      className="h-10.5 rounded-[14px] text-xs font-black pl-9 font-mono"
                    />
                    <Phone className="w-4 h-4 text-primary absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[10.5px] text-muted-foreground mt-1 font-medium">
                    {isKa
                      ? "ეს ნომერი ავტომატურად ჩაისმება ახალი განცხადების დამატებისას."
                      : "Pre-filled automatically when adding listings."}
                  </p>
                </div>

                {/* City & Address */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-black text-foreground block mb-1">
                      {isKa ? "ქალაქი / რეგიონი *" : "City / Region *"}
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full h-10.5 px-3 rounded-[14px] border border-input bg-card text-xs font-bold text-foreground outline-hidden focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    >
                      {["თბილისი", "ბათუმი", "ქუთაისი", "რუსთავი", "გორი", "ზუგდიდი", "თელავი", "სხვა"].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-black text-foreground block mb-1">
                      {isKa ? "ზუსტი მისამართი / უბანი" : "Address / District"}
                    </label>
                    <div className="relative">
                      <Input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="მაგ: ვაკე, ჭავჭავაძის 45"
                        className="h-10.5 rounded-[14px] text-xs font-bold pl-9"
                      />
                      <MapPin className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                {/* Bio / Description */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-black text-foreground block">
                      {isKa ? "ჩემ შესახებ / აღწერა" : "About Me / Bio"}
                    </label>
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      {bio.length} / 500
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="მოკლედ მოგვიყევით თქვენს მცენარეებზე, გამოცდილებაზე ან სანერგეზე..."
                    className="w-full rounded-[14px] border border-border/80 bg-background px-3.5 py-2.5 text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-hidden resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full h-11 rounded-[14px] bg-primary hover:bg-primary/90 text-white font-black text-xs sm:text-sm gap-2 shadow-ambient cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isKa ? "ინახება..." : "Saving..."}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{isKa ? "პროფილის შენახვა" : "Save Changes"}</span>
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* TAB 2: SOCIAL & MESSENGERS                                       */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {activeTab === "social" && (
            <div className="rounded-[24px] border border-border/80 bg-card p-5 sm:p-7 shadow-ambient space-y-6 animate-in fade-in">
              <div className="border-b border-border/50 pb-4">
                <h2 className="text-base font-black text-foreground flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>{isKa ? "მესინჯერები და სოციალური ქსელები" : "Messengers & Social Media"}</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isKa
                    ? "მიუთითეთ WhatsApp, Telegram ან Instagram, რათა მყიდველებმა მარტივად დაგიკავშირდნენ."
                    : "Add quick chat channels for potential plant buyers."}
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4.5">
                {/* WhatsApp */}
                <div className="p-4 rounded-[18px] bg-emerald-500/5 border border-emerald-500/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      <span>WhatsApp ნომერი</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sameAsPhone}
                        onChange={(e) => handleToggleSameAsPhone(e.target.checked)}
                        className="rounded accent-emerald-600 cursor-pointer"
                      />
                      <span>{isKa ? "იგივე რაც მობილური" : "Same as phone"}</span>
                    </label>
                  </div>
                  <Input
                    value={sameAsPhone ? phone : whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    disabled={sameAsPhone}
                    placeholder="+995 557 579 123"
                    className="h-10 rounded-[12px] text-xs font-bold font-mono bg-card"
                  />
                </div>

                {/* Telegram */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-blue-500" />
                    <span>Telegram Username</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">@</span>
                    <Input
                      value={telegram.replace(/^@/, "")}
                      onChange={(e) => setTelegram(e.target.value.replace(/^@/, ""))}
                      placeholder="botanical_user"
                      className="h-10 rounded-[12px] text-xs font-bold pl-8"
                    />
                  </div>
                </div>

                {/* Instagram */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <Instagram className="w-3.5 h-3.5 text-pink-500" />
                    <span>Instagram პროფილის ბმული ან Handle</span>
                  </label>
                  <Input
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="https://instagram.com/my_plants"
                    className="h-10 rounded-[12px] text-xs font-medium"
                  />
                </div>

                {/* Facebook */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Facebook გვერდი ან პროფილი</span>
                  </label>
                  <Input
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="https://facebook.com/myplantsge"
                    className="h-10 rounded-[12px] text-xs font-medium"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full h-11 rounded-[14px] bg-primary hover:bg-primary/90 text-white font-black text-xs sm:text-sm gap-2 cursor-pointer shadow-ambient"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isKa ? "ინახება..." : "Saving..."}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{isKa ? "საკონტაქტო არხების შენახვა" : "Save Social Links"}</span>
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* TAB 3: SECURITY & PASSWORD                                       */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {activeTab === "security" && (
            <div className="rounded-[24px] border border-border/80 bg-card p-5 sm:p-7 shadow-ambient space-y-6 animate-in fade-in">
              <div className="border-b border-border/50 pb-4">
                <h2 className="text-base font-black text-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  <span>{isKa ? "ანგარიშის უსაფრთხოება" : "Account Security"}</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isKa ? "განაახლეთ თქვენი პაროლი და მართეთ ავტორიზაციის მონაცემები." : "Update your password and login credentials."}
                </p>
              </div>

              {passwordSuccess && (
                <div className="rounded-[16px] bg-emerald-500/15 border border-emerald-500/30 p-3.5 text-xs font-black text-emerald-900 dark:text-emerald-200 animate-in fade-in flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}
              {passwordError && (
                <div className="rounded-[16px] bg-destructive/15 border border-destructive/30 p-3.5 text-xs font-black text-destructive animate-in fade-in flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {/* Email Display (Read-Only) */}
              <div className="p-3.5 rounded-[16px] bg-surface-container/50 border border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground block">{isKa ? "მიბმული ელ-ფოსტა" : "Linked Email"}</span>
                    <strong className="text-xs font-black text-foreground">{userEmail}</strong>
                  </div>
                </div>
                <Badge className="bg-emerald-600/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20 text-[10px] font-black">
                  {isKa ? " დადასტურებული" : " Verified"}
                </Badge>
              </div>

              {/* Password Change Form */}
              <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
                <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
                  {isKa ? "ახალი პაროლის დაყენება" : "Set New Password"}
                </h3>

                <div className="space-y-1">
                  <label className="text-xs font-black text-foreground block">
                    {isKa ? "ახალი პაროლი *" : "New Password *"}
                  </label>
                  <div className="relative">
                    <Input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="მინიმუმ 6 სიმბოლო"
                      className="h-10.5 rounded-[14px] text-xs font-bold pl-9"
                    />
                    <Key className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-foreground block">
                    {isKa ? "გაიმეორეთ ახალი პაროლი *" : "Confirm New Password *"}
                  </label>
                  <div className="relative">
                    <Input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="გაიმეორეთ პაროლი"
                      className="h-10.5 rounded-[14px] text-xs font-bold pl-9"
                    />
                    <Key className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={passwordSaving}
                  className="w-full h-11 rounded-[14px] bg-primary hover:bg-primary/90 text-white font-black text-xs sm:text-sm gap-2 cursor-pointer shadow-ambient"
                >
                  {passwordSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isKa ? "იცვლება..." : "Updating..."}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isKa ? "პაროლის განახლება" : "Update Password"}</span>
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* TAB 4: NOTIFICATIONS                                             */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {activeTab === "notifications" && (
            <div className="rounded-[24px] border border-border/80 bg-card p-5 sm:p-7 shadow-ambient space-y-6 animate-in fade-in">
              <div className="border-b border-border/50 pb-4">
                <h2 className="text-base font-black text-foreground flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <span>{isKa ? "შეტყობინებების პარამეტრები" : "Notification Settings"}</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isKa ? "მართეთ რა შეტყობინებები მიიღოთ ელ-ფოსტაზე." : "Control email and activity alerts."}
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="p-4 rounded-[18px] bg-surface-container/40 border border-border/50 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-foreground">
                      {isKa ? "ახალი შეტყობინებები & ზარები" : "Inquiries & Buyer Contacts"}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      {isKa ? "მიიღეთ მეილი, როდესაც მყიდველი დაგიკავშირდებათ განცხადებაზე." : "Receive email alerts on buyer inquiries."}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyEmailInquiries}
                    onChange={(e) => setNotifyEmailInquiries(e.target.checked)}
                    className="w-4.5 h-4.5 rounded accent-primary cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-[18px] bg-surface-container/40 border border-border/50 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-foreground">
                      {isKa ? "პლატფორმის სიახლეები & რჩევები" : "Plant.ge Updates & Tips"}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      {isKa ? "სეზონური რჩევები მცენარეების მოვლაზე და ახალი ფუნქციები." : "Plant care guides and feature announcements."}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyEmailUpdates}
                    onChange={(e) => setNotifyEmailUpdates(e.target.checked)}
                    className="w-4.5 h-4.5 rounded accent-primary cursor-pointer"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full h-11 rounded-[14px] bg-primary hover:bg-primary/90 text-white font-black text-xs sm:text-sm gap-2 cursor-pointer shadow-ambient"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isKa ? "ინახება..." : "Saving..."}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{isKa ? "პარამეტრების შენახვა" : "Save Preferences"}</span>
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Live Public Profile Preview Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-[24px] border border-border/80 bg-card p-5 sm:p-6 shadow-ambient space-y-4 sticky top-6">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <span className="text-[11px] font-black text-muted-foreground uppercase tracking-wider block">
                {isKa ? "ვიზუალი მყიდველებისთვის" : "Public Card Preview"}
              </span>
              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black">
                Live Preview
              </Badge>
            </div>

            {/* User Mini Card */}
            <div className="flex items-center gap-3.5">
              <div className="relative h-14 w-14 rounded-[16px] ring-2 ring-primary/30 overflow-hidden bg-primary/10 flex items-center justify-center font-black text-lg text-primary shrink-0 shadow-2xs">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="preview" className="w-full h-full object-cover" />
                ) : avatarUrl ? (
                  <Image src={avatarUrl} alt="preview" fill className="object-cover" />
                ) : (
                  <span>{avatarLetter}</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-black text-foreground truncate">
                  {fullNameDisplay}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium mt-0.5">
                  <MapPin className="w-3 h-3 text-primary shrink-0" />
                  <span>{city}</span>
                  {location && <span className="truncate text-muted-foreground/70">• {location}</span>}
                </p>
                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 mt-1">
                  <span> {averageRating.toFixed(1)}</span>
                  <span className="text-muted-foreground font-medium">• {isKa ? "სანდო გამყიდველი" : "Trusted Seller"}</span>
                </div>
              </div>
            </div>

            {bio ? (
              <div className="rounded-[14px] bg-surface-container/40 p-3 border border-border/40">
                <p className="text-xs text-foreground/80 leading-relaxed font-medium">
                  "{bio}"
                </p>
              </div>
            ) : null}

            {phone && (
              <div className="rounded-[14px] bg-secondary-container/50 border border-border/60 p-3 flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-bold flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  {isKa ? "ტელეფონი:" : "Phone:"}
                </span>
                <strong className="text-foreground font-black font-mono">{phone}</strong>
              </div>
            )}

            {/* Quick Contact Buttons Preview */}
            {(whatsapp || telegram || instagram || facebook) && (
              <div className="space-y-1.5 pt-2 border-t border-border/40">
                <span className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider block">
                  {isKa ? "საკონტაქტო არხები:" : "Direct Channels:"}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(whatsapp || (sameAsPhone && phone)) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                      <MessageCircle className="w-3 h-3" /> WhatsApp
                    </span>
                  )}
                  {telegram && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-500/10 text-blue-800 dark:text-blue-300 border border-blue-500/20">
                      <Send className="w-3 h-3" /> @{telegram}
                    </span>
                  )}
                  {instagram && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-pink-500/10 text-pink-800 dark:text-pink-300 border border-pink-500/20">
                      <Instagram className="w-3 h-3" /> Instagram
                    </span>
                  )}
                  {facebook && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-600/10 text-blue-800 dark:text-blue-300 border border-blue-600/20">
                      <Share2 className="w-3 h-3" /> Facebook
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
