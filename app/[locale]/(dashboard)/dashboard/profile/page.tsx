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
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function ProfileEditPage() {
  const locale = useLocale();
  const isKa = locale !== "en";
  const supabase = createClient();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState("");

  const [userId, setUserId] = React.useState<string>("");
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

  React.useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

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
        }
      } catch (err) {
        console.warn("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [supabase]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
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
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "პროფილის შენახვა ვერ მოხერხდა");
      }

      setSuccessMsg("პროფილი და საკონტაქტო ტელეფონი წარმატებით განახლდა! ✅");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "შეცდომა პროფილის შენახვისას");
    } finally {
      setSaving(false);
    }
  };

  const fullNameDisplay = [firstName, lastName].filter(Boolean).join(" ").trim() || "მომხმარებელი";
  const avatarLetter = firstName ? firstName.charAt(0).toUpperCase() : "U";

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span>იტვირთება პროფილი...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isKa ? "უკან კაბინეტში" : "Back to Dashboard"}</span>
        </Link>

        {customSlug && (
          <Link
            href={`/shops/${customSlug}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-[10px] hover:bg-primary/20 transition-colors"
          >
            <Store className="w-3.5 h-3.5" />
            <span>{isKa ? "მაღაზიის ვიტრინის ნახვა" : "View Storefront"}</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Edit Form */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-[24px] border border-border/80 bg-card p-6 sm:p-7 shadow-ambient space-y-5">
            <div>
              <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                {isKa ? "პროფილის რედაქტირება" : "Edit Profile"}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isKa
                  ? "მართეთ თქვენი სახელი, მობილურის ნომერი, მისამართი და ავატარი."
                  : "Manage your personal details, phone number, address, and avatar."}
              </p>
            </div>

            {/* Notification Messages */}
            {successMsg && (
              <div className="rounded-[14px] bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs font-bold text-emerald-800 dark:text-emerald-300 animate-in fade-in flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="rounded-[14px] bg-rose-500/15 border border-rose-500/30 p-3 text-xs font-bold text-rose-700 dark:text-rose-300 animate-in fade-in">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-5">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 rounded-full ring-2 ring-primary/30 overflow-hidden bg-primary/10 flex items-center justify-center font-black text-xl text-primary shrink-0">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                  ) : avatarUrl ? (
                    <Image src={avatarUrl} alt="avatar" fill className="object-cover" />
                  ) : (
                    <span>{avatarLetter}</span>
                  )}
                </div>

                <div className="space-y-1.5">
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
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-white hover:bg-primary border border-primary/30 px-3.5 py-1.5 rounded-[10px] bg-primary/10 transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{isKa ? "ფოტოს შეცვლა" : "Change Avatar"}</span>
                  </button>
                  <p className="text-[11px] text-muted-foreground">
                    {isKa ? "JPG, PNG ან WebP (მაქს. 10MB)" : "JPG, PNG, or WebP up to 10MB"}
                  </p>
                </div>
              </div>

              {/* Name Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    {isKa ? "სახელი *" : "First Name *"}
                  </label>
                  <Input
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="მაგ: თამარ"
                    className="h-10.5 rounded-[12px] text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    {isKa ? "გვარი *" : "Last Name *"}
                  </label>
                  <Input
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="მაგ: ბოტანიკა"
                    className="h-10.5 rounded-[12px] text-xs font-medium"
                  />
                </div>
              </div>

              {/* Mobile Phone Number (Permanent Profile Persistence) */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  {isKa ? "საკონტაქტო მობილურის ნომერი *" : "Contact Phone Number *"}
                </label>
                <div className="relative">
                  <Input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="557 579 123 ან +995 557 579 123"
                    className="h-10.5 rounded-[12px] text-xs font-black pl-9"
                  />
                  <Phone className="w-4 h-4 text-primary absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[10.5px] text-muted-foreground mt-1">
                  {isKa
                    ? "ეს ნომერი ავტომატურად ჩაისმება ახალი განცხადების დამატებისას და გამოჩნდება მყიდველებისთვის."
                    : "This phone number will pre-fill automatically when creating listings."}
                </p>
              </div>

              {/* City & Detailed Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    {isKa ? "ქალაქი / რეგიონი *" : "City / Region *"}
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-10.5 px-3 rounded-[12px] border border-input bg-background text-xs font-bold text-foreground outline-hidden focus:ring-2 focus:ring-primary/20"
                  >
                    {["თბილისი", "ბათუმი", "ქუთაისი", "რუსთავი", "გორი", "ზუგდიდი", "თელავი", "სხვა"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    {isKa ? "ზუსტი მისამართი / უბანი" : "Address / District"}
                  </label>
                  <div className="relative">
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="მაგ: ვაკე, ჭავჭავაძის 45"
                      className="h-10.5 rounded-[12px] text-xs font-medium pl-9"
                    />
                    <MapPin className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* Bio / Description */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  {isKa ? "ჩემ შესახებ / მაღაზიის აღწერა" : "About Me / Bio"}
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="მოკლედ მოგვიყევით თქვენს მცენარეებზე, გამოცდილებაზე ან სანერგეზე..."
                  className="w-full rounded-[14px] border border-border/80 bg-background/90 px-3.5 py-2 text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-hidden resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full h-11 rounded-[14px] bg-primary hover:bg-primary/90 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-ambient transition-all cursor-pointer active:scale-98"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isKa ? "ინახება..." : "Saving..."}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isKa ? "ცვლილებების შენახვა" : "Save Profile"}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Live Profile Preview Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-[22px] border border-border/80 bg-card p-5 shadow-ambient space-y-4">
            <span className="text-[11px] font-black text-muted-foreground uppercase tracking-wider block">
              {isKa ? "როგორ ხედავენ სხვები" : "Public Preview"}
            </span>

            {/* User Mini Card */}
            <div className="flex items-center gap-3.5">
              <div className="relative h-13 w-13 rounded-full ring-2 ring-primary/30 overflow-hidden bg-primary/10 flex items-center justify-center font-black text-lg text-primary shrink-0">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="preview" className="w-full h-full object-cover" />
                ) : avatarUrl ? (
                  <Image src={avatarUrl} alt="preview" fill className="object-cover" />
                ) : (
                  <span>{avatarLetter}</span>
                )}
              </div>

              <div className="min-w-0">
                <h3 className="text-sm font-black text-foreground truncate">
                  {fullNameDisplay}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                  <MapPin className="w-3 h-3 text-primary" />
                  <span>{city}</span>
                </p>
                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 mt-0.5">
                  <span>★ {averageRating.toFixed(1)}</span>
                  <span className="text-muted-foreground font-normal">• სანდო გამყიდველი</span>
                </div>
              </div>
            </div>

            {bio ? (
              <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                "{bio}"
              </p>
            ) : null}

            {phone && (
              <div className="rounded-[12px] bg-secondary-container/70 p-2.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">ტელეფონი:</span>
                <strong className="text-foreground font-black">{phone}</strong>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
