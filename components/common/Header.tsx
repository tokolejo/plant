"use client";

import * as React from "react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { 
  Sprout, 
  PlusCircle, 
  Shuffle, 
  Store, 
  Sparkles, 
  Layers, 
  User,
  MessageSquare,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Bell,
  Settings,
  Crown,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const t = useTranslations("Common");
  const navT = useTranslations("Navigation");
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = React.useState<any>(null);
  const [profile, setProfile] = React.useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        supabase.from("profiles").select("*").eq("id", user.id).single()
          .then(({ data }) => setProfile(data));
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from("profiles").select("*").eq("id", session.user.id).single()
          .then(({ data }) => setProfile(data));
      } else {
        setProfile(null);
      }
    });

    return () => { authListener.subscription.unsubscribe(); };
  }, [supabase]);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setDropdownOpen(false);
    router.push("/");
    router.refresh();
  };

  const isAdmin = user?.email === "tokolejo@gmail.com" || profile?.is_admin === true;

  const navLinks = [
    { href: "/listings?type=PLANT", label: navT("plants"), icon: Sprout, match: "/listings" },
    { href: "/map", label: navT("map"), icon: MapPin, match: "/map" },
    { href: "/listings?type=INVENTORY", label: navT("inventory"), icon: Layers },
    { href: "/iso", label: navT("iso"), icon: Shuffle },
    { href: "/pricing", label: navT("pricing"), icon: Sparkles },
  ];

  const tierColors: Record<string, string> = {
    FREE: "text-slate-500",
    TIER_1: "text-emerald-600 dark:text-emerald-400",
    TIER_2: "text-teal-600 dark:text-teal-400",
    TIER_3: "text-amber-600 dark:text-amber-400",
  };

  const tierLabels: Record<string, string> = {
    FREE: "Free",
    TIER_1: "Collector",
    TIER_2: "Pro Shop",
    TIER_3: "Premium",
  };

  const userTier = profile?.subscription_tier || "FREE";
  const avatarLetter = profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/90 backdrop-blur-md transition-colors">
      <div className="container mx-auto flex h-16 items-center justify-between gap-2 px-3 sm:px-6">

        {/* ═══ Left: Brand + Nav ═══ */}
        <div className="flex items-center gap-3 xl:gap-6 min-w-0">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-primary text-white shadow-ambient group-hover:scale-105 transition-all">
              <Sprout className="h-5 w-5 text-primary-fixed" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-foreground flex items-center gap-0.5">
                Plant
              </span>
              <span className="text-[9px] font-medium tracking-wider text-muted-foreground uppercase leading-none hidden sm:block">
                Botanical Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop Nav — Clean, Non-Wrapping & Compact */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1.5 whitespace-nowrap">
            {navLinks.map(({ href, label, icon: Icon, match }) => {
              const active = pathname === (match || href.split("?")[0]);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-[12px] text-xs font-semibold whitespace-nowrap shrink-0 transition-all duration-150 ${
                    active
                      ? "text-primary dark:text-emerald-400 bg-secondary-container/80 font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-container"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ═══ Right: Actions ═══ */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <LanguageSwitcher />
          <ThemeToggle />

          {user ? (
            <>
              {/* Post listing - desktop only */}
              <Link href="/dashboard/listings/new" className="hidden sm:inline-flex">
                <Button
                  className="gap-2 rounded-[20px] bg-primary hover:bg-primary-container text-white font-bold text-xs h-9 px-4 shadow-ambient active:scale-95 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden md:inline">{t("postListing")}</span>
                  <span className="md:hidden">+</span>
                </Button>
              </Link>

              {/* User Avatar + Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 rounded-[20px] bg-surface-container/60 hover:bg-surface-container pl-1.5 pr-2.5 py-1 transition-colors border border-border/40"
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className="h-8 w-8 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shadow-sm">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        avatarLetter
                      )}
                    </div>
                    {isAdmin && (
                      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-purple-600 rounded-full border-2 border-background flex items-center justify-center">
                        <div className="w-1 h-1 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                  {/* Name + tier */}
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-bold leading-tight max-w-[95px] truncate text-foreground">
                      {profile?.full_name || user.email?.split("@")[0]}
                    </span>
                    <span className={`text-[9px] font-bold ${isAdmin ? "text-purple-500" : tierColors[userTier]}`}>
                      {isAdmin ? "⭐ ADMIN" : tierLabels[userTier] || "Free"}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-[20px] border border-border/80 bg-card shadow-ambient-lg z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150">
                    {/* User Info Header */}
                    <div className="px-4 py-3.5 bg-surface-container/60 border-b border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center shrink-0">
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" />
                          ) : avatarLetter}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{profile?.full_name || user.email?.split("@")[0]}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                          <span className={`text-[9px] font-bold ${isAdmin ? "text-purple-500" : tierColors[userTier]}`}>
                            {isAdmin ? "⭐ ADMIN" : `${tierLabels[userTier]} Plan`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2 space-y-1">
                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-[12px] text-xs font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          🛠️ ადმინ პანელი
                        </Link>
                      )}

                      <Link href="/dashboard" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-[12px] text-xs font-semibold hover:bg-surface-container text-foreground transition-colors">
                        <User className="w-4 h-4 text-primary" />
                        კაბინეტი
                      </Link>

                      <Link href="/dashboard/shop" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-[12px] text-xs font-semibold hover:bg-surface-container text-foreground transition-colors">
                        <Store className="w-4 h-4 text-primary" />
                        მაღაზია & Custom URL
                      </Link>

                      <Link href="/dashboard/messages" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-[12px] text-xs font-semibold hover:bg-surface-container text-foreground transition-colors">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        შეტყობინებები
                      </Link>

                      <Link href="/pricing" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-[12px] text-xs font-semibold hover:bg-surface-container text-foreground transition-colors">
                        <Crown className="w-4 h-4 text-amber-500" />
                        ტარიფები & პაკეტები
                      </Link>

                      <div className="border-t border-border/50 my-1" />

                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[12px] text-xs font-semibold hover:bg-destructive/10 text-destructive transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        გამოსვლა
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm" className="rounded-[20px] text-xs font-semibold h-9 px-3.5 hover:bg-surface-container">
                  შესვლა
                </Button>
              </Link>
              <Link href="/auth/register" className="hidden sm:inline-flex">
                <Button size="sm" className="rounded-[20px] bg-primary hover:bg-primary-container text-white text-xs font-bold h-9 px-4 shadow-ambient">
                  რეგისტრაცია
                </Button>
              </Link>
              <Link href="/dashboard/listings/new" className="hidden sm:inline-flex">
                <Button variant="outline" size="sm" className="gap-1.5 rounded-[20px] text-xs font-bold h-9 px-3.5 border-primary/30 text-primary hover:bg-secondary-container">
                  <PlusCircle className="w-4 h-4" />
                  {t("postListing")}
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
