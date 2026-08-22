"use client";

import * as React from "react";
import { Link, usePathname } from "@/i18n/routing";
import { 
  Home, 
  Store, 
  PlusCircle, 
  MapPin, 
  User, 
  LogIn,
  Heart
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/utils/supabase/client";

export function MobileBottomNav() {
  const pathname = usePathname();
  const locale = useLocale();
  const isKa = locale !== "en";
  const t = useTranslations("Common");
  const navT = useTranslations("Navigation");
  const supabase = createClient();

  const [user, setUser] = React.useState<any>(null);
  const [profile, setProfile] = React.useState<any>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        supabase.from("profiles").select("avatar_url, full_name").eq("id", user.id).single()
          .then(({ data }) => setProfile(data));
      }
    });

    const { data: auth } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from("profiles").select("avatar_url, full_name").eq("id", session.user.id).single()
          .then(({ data }) => setProfile(data));
      } else {
        setProfile(null);
      }
    });

    return () => { auth.subscription.unsubscribe(); };
  }, [supabase]);

  const avatarLetter = profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "?";
  const isDashboardActive = pathname.startsWith("/dashboard") || pathname === "/dashboard";
  const isListingsActive = pathname.startsWith("/listings");
  const isMapActive = pathname === "/map";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 block lg:hidden border-t border-border/70 bg-card/95 backdrop-blur-xl pb-safe">
      <div className="flex h-15 items-center justify-around px-1">

        {/* 1. Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center gap-0.5 w-14 py-1 rounded-[10px] transition-all ${
            pathname === "/" ? "text-primary dark:text-emerald-400 font-bold" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px]">{navT("home")}</span>
        </Link>

        {/* 2. Shop / Catalog */}
        <Link
          href="/listings"
          className={`flex flex-col items-center justify-center gap-0.5 w-14 py-1 rounded-[10px] transition-all ${
            isListingsActive ? "text-primary dark:text-emerald-400 font-bold" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Store className="h-5 w-5" />
          <span className="text-[10px]">{navT("market")}</span>
        </Link>

        {/* 3. Center Add Listing Button */}
        <Link
          href="/dashboard/listings/new"
          className="flex flex-col items-center justify-center -mt-5 group"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-primary text-white shadow-ambient group-active:scale-95 transition-transform">
            <PlusCircle className="h-5 w-5 text-white" />
          </div>
          <span className="text-[9px] font-bold text-primary dark:text-emerald-400 mt-0.5">
            {isKa ? "დამატება" : "Post"}
          </span>
        </Link>

        {/* 4. Wishlist */}
        <Link
          href="/dashboard/wishlist"
          className={`flex flex-col items-center justify-center gap-0.5 w-14 py-1 rounded-[10px] transition-all ${
            pathname.includes("/wishlist") ? "text-rose-500 font-bold" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Heart className="h-5 w-5" />
          <span className="text-[10px]">{isKa ? "რჩეულები" : "Wishlist"}</span>
        </Link>

        {/* 5. Profile / Dashboard */}
        <Link
          href={user ? "/dashboard" : "/auth/login"}
          className={`flex flex-col items-center justify-center gap-0.5 w-14 py-1 rounded-[10px] transition-all ${
            isDashboardActive ? "text-primary dark:text-emerald-400 font-bold" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {user ? (
            <div className={`relative h-5 w-5 rounded-full flex items-center justify-center font-bold text-[9px] text-white transition-all ${
              isDashboardActive ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""
            }`}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-primary flex items-center justify-center text-white text-[9px] font-bold">
                  {avatarLetter}
                </div>
              )}
            </div>
          ) : (
            <User className="h-5 w-5" />
          )}
          <span className="text-[10px]">
            {user ? (isKa ? "პროფილი" : "Profile") : (isKa ? "შესვლა" : "Sign In")}
          </span>
        </Link>

      </div>
    </div>
  );
}
