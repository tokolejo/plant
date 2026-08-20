"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { createClient } from "@/utils/supabase/client";
import { 
  Store, 
  Link as LinkIcon, 
  Check, 
  AlertCircle, 
  Sparkles, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Save, 
  Crown,
  ExternalLink,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ShopSettingsDashboardPage() {
  const supabase = createClient();

  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [profile, setProfile] = React.useState<any>(null);

  const [shopName, setShopName] = React.useState("თამარ ბოტანიკა");
  const [customSlug, setCustomSlug] = React.useState("tamarbustan");
  const [bio, setBio] = React.useState("იშვიათი ოთახის მცენარეების, აროიდების და მონსტერების ორანჟერეა.");
  const [city, setCity] = React.useState("თბილისი");
  const [address, setAddress] = React.useState("ჭავჭავაძის გამზ. 42");
  const [phone, setPhone] = React.useState("+995 599 12 34 56");
  const [whatsapp, setWhatsapp] = React.useState("+995599123456");

  const [isSlugAvailable, setIsSlugAvailable] = React.useState<boolean | null>(true);
  const [checkingSlug, setCheckingSlug] = React.useState(false);
  const [savedSuccess, setSavedSuccess] = React.useState(false);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
      if (user) {
        supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setProfile(data);
              if (data.custom_slug) setCustomSlug(data.custom_slug);
              if (data.full_name) setShopName(data.full_name);
              if (data.phone) setPhone(data.phone);
            }
          });
      }
    });
  }, [supabase]);

  // Check slug uniqueness in real time
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    setCustomSlug(rawVal);
    setSavedSuccess(false);

    if (rawVal.length < 3) {
      setIsSlugAvailable(null);
      return;
    }

    setCheckingSlug(true);
    // Check against database profiles
    supabase
      .from("profiles")
      .select("id, custom_slug")
      .eq("custom_slug", rawVal)
      .then(({ data }) => {
        setCheckingSlug(false);
        if (!data || data.length === 0 || (profile && data[0].id === profile.id)) {
          setIsSlugAvailable(true);
        } else {
          setIsSlugAvailable(false);
        }
      });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSlugAvailable && customSlug) return;

    if (currentUser) {
      await supabase
        .from("profiles")
        .update({
          custom_slug: customSlug,
          full_name: shopName,
          phone: phone,
        })
        .eq("id", currentUser.id);
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const userTier = profile?.subscription_tier || "TIER_2";
  const allowsCustomSlug = ["TIER_2", "TIER_3"].includes(userTier) || currentUser?.email === "tokolejo@gmail.com";

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <Store className="w-4 h-4" />
            <span>მაღაზიის მართვა & Custom URL</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            შოპის პროფილი და ბმული
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            დააყენეთ თქვენი მაღაზიის უნიკალური მისამართი და საკონტაქტო ინფორმაცია.
          </p>
        </div>

        {/* Live Shop Preview Link */}
        {customSlug && (
          <Link href={`/shops/${customSlug}`} target="_blank">
            <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
              <span>მაღაზიის ნახვა</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </Link>
        )}
      </div>

      {/* Tier Requirement Notice */}
      {!allowsCustomSlug && (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 mb-6 flex items-start gap-4">
          <Crown className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300">
              Custom Shop URL ხელმისაწვდომია TIER 2 და TIER 3 ტარიფებზე
            </h3>
            <p className="text-xs text-amber-700/80 dark:text-amber-400 leading-relaxed">
              პერსონალური შოპის ლინკის (მაგ: plantsale.ge/username) გასააქტიურებლად განაახლეთ თქვენი პაკეტი.
            </p>
            <Link href="/pricing" className="inline-block pt-1">
              <Button variant="botanical" size="sm" className="rounded-xl text-xs font-bold h-8">
                ტარიფების ნახვა
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Custom URL Card */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-7 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-emerald-600" />
            <span>უნიკალური URL მისამართი (Slug)</span>
          </h2>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground block">
              შოპის მისამართი ბრაუზერში
            </label>
            
            <div className="flex rounded-2xl border border-input bg-background/80 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500">
              <span className="inline-flex items-center px-3.5 bg-muted/60 text-xs font-mono font-bold text-muted-foreground border-r border-border/60">
                plantsale.ge/
              </span>
              <input
                type="text"
                value={customSlug}
                onChange={handleSlugChange}
                placeholder="tamar_bustan"
                className="w-full px-3.5 py-2.5 bg-transparent text-xs sm:text-sm font-mono font-bold text-foreground focus:outline-none"
              />
            </div>

            {/* Availability Status */}
            <div className="flex items-center gap-2 pt-1 text-xs">
              {checkingSlug ? (
                <span className="text-muted-foreground">მოწმდება უნიკალურობა...</span>
              ) : isSlugAvailable === true && customSlug.length >= 3 ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> სახელი თავისუფალია! თქვენი ლინკი იქნება: <strong>plantsale.ge/{customSlug}</strong>
                </span>
              ) : isSlugAvailable === false ? (
                <span className="text-destructive font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> ეს სახელი უკვე დაკავებულია სხვა შოპის მიერ.
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground">
                  მინიმუმ 3 სიმბოლო (მხოლოდ ლათინური ასოები, ციფრები და ტირე).
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. Shop Details Card */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-7 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-600" />
            <span>მაღაზიის ინფორმაცია</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                მაღაზიის დასახელება
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                ქალაქი / რეგიონი
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                ფიზიკური მისამართი (თუ გაქვთ ორანჟერეა/მაღაზია)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="მაგ: ვაკე, ჭავჭავაძის გამზ. 42"
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                ტელეფონის ნომერი
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                WhatsApp ნომერი პირდაპირი შეტყობინებისთვის
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+995599123456"
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                მაღაზიის აღწერა & მოვლის პირობები
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-xl border border-input bg-background p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              <Check className="w-4 h-4" /> ცვლილებები წარმატებით შეინახა!
            </span>
          ) : (
            <span />
          )}

          <Button
            type="submit"
            variant="botanical"
            size="lg"
            className="rounded-2xl text-xs font-bold h-11 px-8 gap-2 shadow-md"
          >
            <Save className="w-4 h-4" />
            <span>პარამეტრების შენახვა</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
