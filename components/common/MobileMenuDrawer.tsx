"use client";

import * as React from "react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import {
  X,
  Home,
  Store,
  Sprout,
  Package,
  MapPin,
  Shuffle,
  Building2,
  PlusCircle,
  User,
  BarChart3,
  Heart,
  MessageSquare,
  Crown,
  Gift,
  ShieldCheck,
  Globe,
  FileText,
  LogOut,
  LogIn,
  UserPlus,
  ChevronRight,
} from "lucide-react";

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenuDrawer({ isOpen, onClose }: MobileMenuDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const isKa = locale !== "en";
  const supabase = createClient();

  const [user, setUser] = React.useState<any>(null);
  const [profile, setProfile] = React.useState<any>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
          .then(({ data }) => setProfile(data));
      }
    });

    const { data: auth } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => setProfile(data));
      } else {
        setProfile(null);
      }
    });

    return () => {
      auth.subscription.unsubscribe();
    };
  }, [supabase]);

  // Lock body scroll when drawer is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close drawer on path change
  React.useEffect(() => {
    onClose();
  }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onClose();
    router.push("/");
    router.refresh();
  };

  const toggleLanguage = () => {
    const nextLocale = locale === "ka" ? "en" : "ka";
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    router.replace(pathname || "/", { locale: nextLocale });
    router.refresh();
  };

  const isAdmin = user?.email === "tokolejo@gmail.com" || profile?.is_admin === true;
  const avatarLetter =
    profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "?";
  const userTier = profile?.subscription_tier || "FREE";

  const tierColors: Record<string, string> = {
    FREE: "text-slate-500 bg-slate-100",
    TIER_1: "text-emerald-700 bg-emerald-50",
    TIER_2: "text-teal-700 bg-teal-50",
    TIER_3: "text-amber-700 bg-amber-50",
  };

  const tierLabels: Record<string, string> = {
    FREE: "Free",
    TIER_1: "Collector",
    TIER_2: "Pro Shop",
    TIER_3: "Premium",
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] lg:hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 w-[320px] max-w-[86vw] bg-card text-foreground shadow-2xl z-[160] flex flex-col overflow-hidden animate-in slide-in-from-right duration-250 ease-out border-l border-border/80">
        
        {/* Top Bar / Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/60 bg-surface-cream/80">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-primary text-white">
              <Sprout className="h-4 w-4" />
            </div>
            <span className="font-bold text-sm text-foreground">
              {isKa ? "ნავიგაცია & მენიუ" : "Menu & Navigation"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface-container text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

          {/* User Account / Profile Card */}
          {user ? (
            <div className="p-3.5 rounded-[16px] bg-surface-container/70 border border-border/70 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-11 w-11 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center overflow-hidden">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      avatarLetter
                    )}
                  </div>
                  {isAdmin && (
                    <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-purple-600 rounded-full border-2 border-card flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate">
                    {profile?.full_name || user.email?.split("@")[0]}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded-[6px] text-[9px] font-bold ${
                      isAdmin ? "bg-purple-100 text-purple-700" : tierColors[userTier]
                    }`}
                  >
                    {isAdmin ? "⭐ ADMIN" : `${tierLabels[userTier]} Plan`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-border/50">
                <Link
                  href="/dashboard"
                  onClick={onClose}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[10px] bg-card hover:bg-surface-container text-xs font-bold text-primary border border-border/60 transition-colors text-center"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{isKa ? "კაბინეტი" : "Dashboard"}</span>
                </Link>
                <Link
                  href="/dashboard/seller"
                  onClick={onClose}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[10px] bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-800 border border-emerald-200/60 transition-colors text-center"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>{isKa ? "სელერი" : "Seller"}</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-[16px] bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100/80 flex flex-col gap-2.5 text-center">
              <p className="text-xs font-bold text-emerald-950">
                {isKa ? "მოგესალმებით Plant-ში! 🌿" : "Welcome to Plant! 🌿"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {isKa
                  ? "შედით სისტემაში მცენარეების შესაძენად, გასაყიდად და გასაცვლელად"
                  : "Sign in to buy, sell, and swap rare plants and accessories"}
              </p>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Link
                  href="/auth/login"
                  onClick={onClose}
                  className="flex items-center justify-center gap-1 py-2 px-3 rounded-[12px] bg-primary text-white text-xs font-bold shadow-ambient transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{isKa ? "შესვლა" : "Sign In"}</span>
                </Link>
                <Link
                  href="/auth/register"
                  onClick={onClose}
                  className="flex items-center justify-center gap-1 py-2 px-3 rounded-[12px] bg-card border border-border/80 hover:bg-surface-container text-xs font-bold text-foreground transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isKa ? "რეგისტრაცია" : "Sign Up"}</span>
                </Link>
              </div>
            </div>
          )}

          {/* Quick Action: Post New Listing CTA */}
          <Link
            href="/dashboard/listings/new"
            onClick={onClose}
            className="flex items-center justify-between p-3 rounded-[14px] bg-primary text-white shadow-ambient group active:scale-98 transition-transform"
          >
            <div className="flex items-center gap-2.5">
              <PlusCircle className="w-5 h-5 text-white shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-xs font-black leading-tight">
                  {isKa ? "განცხადების დამატება" : "Post a New Listing"}
                </span>
                <span className="text-[10px] text-white/80">
                  {isKa ? "გაყიდე ან გაცვალე მცენარე" : "Sell or trade your plant"}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/80 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Category 1: Market & Discover */}
          <div className="space-y-1">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground px-2 mb-1.5">
              {isKa ? "კატალოგი & აღმოჩენა" : "Market & Discover"}
            </h4>
            <div className="space-y-0.5">
              <Link
                href="/"
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2 rounded-[12px] text-xs font-semibold transition-colors ${
                  pathname === "/"
                    ? "bg-secondary-container text-primary font-bold"
                    : "text-foreground hover:bg-surface-container"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Home className="w-4 h-4 text-primary" />
                  <span>{isKa ? "მთავარი გვერდი" : "Home"}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
              </Link>

              <Link
                href="/listings"
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2 rounded-[12px] text-xs font-semibold transition-colors ${
                  pathname === "/listings"
                    ? "bg-secondary-container text-primary font-bold"
                    : "text-foreground hover:bg-surface-container"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Store className="w-4 h-4 text-primary" />
                  <span>{isKa ? "მარკეტი & ყველა განცხადება" : "Marketplace & Listings"}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
              </Link>

              <Link
                href="/listings?type=PLANT"
                onClick={onClose}
                className="flex items-center justify-between px-3 py-2 rounded-[12px] text-xs font-semibold text-foreground hover:bg-surface-container transition-colors pl-6"
              >
                <div className="flex items-center gap-2.5">
                  <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isKa ? "მცენარეები" : "Plants"}</span>
                </div>
                <span className="text-[10px] text-muted-foreground bg-surface-container px-2 py-0.5 rounded-[6px]">
                  {isKa ? "კატალოგი" : "Catalog"}
                </span>
              </Link>

              <Link
                href="/listings?type=INVENTORY"
                onClick={onClose}
                className="flex items-center justify-between px-3 py-2 rounded-[12px] text-xs font-semibold text-foreground hover:bg-surface-container transition-colors pl-6"
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isKa ? "ინვენტარი & ქოთნები" : "Pots & Care"}</span>
                </div>
                <span className="text-[10px] text-muted-foreground bg-surface-container px-2 py-0.5 rounded-[6px]">
                  {isKa ? "აქსესუარები" : "Care"}
                </span>
              </Link>

              <Link
                href="/map"
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2 rounded-[12px] text-xs font-semibold transition-colors ${
                  pathname === "/map"
                    ? "bg-secondary-container text-primary font-bold"
                    : "text-foreground hover:bg-surface-container"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>{isKa ? "ბოტანიკური რუკა" : "Botanical Map"}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
              </Link>

              <Link
                href="/iso"
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2 rounded-[12px] text-xs font-semibold transition-colors ${
                  pathname === "/iso"
                    ? "bg-secondary-container text-primary font-bold"
                    : "text-foreground hover:bg-surface-container"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Shuffle className="w-4 h-4 text-teal-600" />
                  <span>{isKa ? "ვეძებ მცენარეს (გაცვლა)" : "ISO & Plant Swap"}</span>
                </div>
                <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-[6px] font-bold">
                  {isKa ? "ახალი" : "Swap"}
                </span>
              </Link>

              <Link
                href="/shops"
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2 rounded-[12px] text-xs font-semibold transition-colors ${
                  pathname === "/shops"
                    ? "bg-secondary-container text-primary font-bold"
                    : "text-foreground hover:bg-surface-container"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span>{isKa ? "ვერიფიცირებული მაღაზიები" : "Verified Shops"}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
              </Link>
            </div>
          </div>

          {/* Category 2: User Services & Account */}
          <div className="space-y-1">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground px-2 mb-1.5">
              {isKa ? "სერვისები & კაბინეტი" : "Services & Dashboard"}
            </h4>
            <div className="space-y-0.5">
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="flex items-center justify-between px-3 py-2 rounded-[12px] text-xs font-bold bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>{isKa ? "🛠️ ადმინ პანელი" : "🛠️ Admin Panel"}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-purple-500" />
                </Link>
              )}

              <Link
                href="/dashboard/wishlist"
                onClick={onClose}
                className="flex items-center justify-between px-3 py-2 rounded-[12px] text-xs font-semibold text-foreground hover:bg-surface-container transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span>{isKa ? "შენახული (Wishlist)" : "Wishlist"}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
              </Link>

              <Link
                href="/dashboard/messages"
                onClick={onClose}
                className="flex items-center justify-between px-3 py-2 rounded-[12px] text-xs font-semibold text-foreground hover:bg-surface-container transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span>{isKa ? "შეტყობინებები" : "Messages"}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
              </Link>

              <Link
                href="/dashboard/shop"
                onClick={onClose}
                className="flex items-center justify-between px-3 py-2 rounded-[12px] text-xs font-semibold text-foreground hover:bg-surface-container transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Store className="w-4 h-4 text-primary" />
                  <span>{isKa ? "მაღაზია & Custom URL" : "Shop Profile & URL"}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
              </Link>

              <Link
                href="/pricing"
                onClick={onClose}
                className="flex items-center justify-between px-3 py-2 rounded-[12px] text-xs font-semibold text-foreground hover:bg-surface-container transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span>{isKa ? "ტარიფები & პაკეტები" : "Pricing & Plans"}</span>
                </div>
                <span className="text-[10px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-[6px] font-bold">
                  PRO
                </span>
              </Link>

              <Link
                href="/dashboard/affiliate"
                onClick={onClose}
                className="flex items-center justify-between px-3 py-2 rounded-[12px] text-xs font-semibold text-foreground hover:bg-surface-container transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Gift className="w-4 h-4 text-emerald-600" />
                  <span>{isKa ? "აფილიეიტ პროგრამა" : "Affiliate Program"}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
              </Link>
            </div>
          </div>

          {/* Category 3: Settings & Preferences */}
          <div className="space-y-1">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground px-2 mb-1.5">
              {isKa ? "პარამეტრები & წესები" : "Settings & Info"}
            </h4>
            <div className="space-y-0.5">
              {/* Language Switcher inside Drawer */}
              <button
                onClick={toggleLanguage}
                className="w-full flex items-center justify-between px-3 py-2 rounded-[12px] text-xs font-semibold text-foreground hover:bg-surface-container transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span>{isKa ? "ენა (Language)" : "Language (ენა)"}</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-[6px] bg-secondary-container text-primary">
                  {locale === "ka" ? "ქართული (GE)" : "English (EN)"}
                </span>
              </button>

              <Link
                href="/rules"
                onClick={onClose}
                className="flex items-center justify-between px-3 py-2 rounded-[12px] text-xs font-semibold text-foreground hover:bg-surface-container transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span>{isKa ? "წესები და პირობები" : "Terms & Rules"}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
              </Link>

              {user && (
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-[12px] text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors mt-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <LogOut className="w-4 h-4 text-destructive" />
                    <span>{isKa ? "სისტემიდან გამოსვლა" : "Sign Out"}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-destructive/60" />
                </button>
              )}
            </div>
          </div>

          {/* Footer Info */}
          <div className="pt-3 pb-6 border-t border-border/40 text-center">
            <p className="text-[11px] text-muted-foreground">
              © {new Date().getFullYear()} Plant • Botanical Marketplace
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
