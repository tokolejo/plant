"use client";

import * as React from "react";
import { Link, usePathname } from "@/i18n/routing";
import { 
  Home, 
  Search, 
  PlusCircle, 
  Shuffle, 
  User 
} from "lucide-react";
import { useTranslations } from "next-intl";
import { createClient } from "@/utils/supabase/client";

export function MobileBottomNav() {
  const pathname = usePathname();
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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 block lg:hidden border-t border-border/70 bg-background/90 backdrop-blur-xl pb-safe">
      <div className="flex h-16 items-center justify-around px-2">

        {/* Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center gap-1 w-14 py-1.5 rounded-[12px] transition-all ${
            pathname === "/" ? "text-primary dark:text-primary-fixed font-bold bg-secondary-container/50" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px]">{navT("home")}</span>
        </Link>

        {/* Map */}
        <Link
          href="/map"
          className={`flex flex-col items-center justify-center gap-1 w-14 py-1.5 rounded-[12px] transition-all ${
            pathname === "/map" ? "text-primary dark:text-primary-fixed font-bold bg-secondary-container/50" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Search className="h-5 w-5" />
          <span className="text-[10px]">რუკა</span>
        </Link>

        {/* Center Post Listing Button */}
        <Link
          href="/dashboard/listings/new"
          className="flex flex-col items-center justify-center -mt-6 group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-primary text-white shadow-ambient-lg group-active:scale-95 transition-transform">
            <PlusCircle className="h-6 w-6 text-primary-fixed" />
          </div>
          <span className="text-[10px] font-bold text-primary dark:text-primary-fixed mt-1">დამატება</span>
        </Link>

        {/* Inbox / Messages */}
        <Link
          href="/dashboard/messages"
          className={`flex flex-col items-center justify-center gap-1 w-14 py-1.5 rounded-[12px] transition-all ${
            pathname.startsWith("/dashboard/messages") ? "text-primary dark:text-primary-fixed font-bold bg-secondary-container/50" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Shuffle className="h-5 w-5" />
          <span className="text-[10px]">ჩატი</span>
        </Link>

        {/* Profile / Dashboard */}
        <Link
          href={user ? "/dashboard" : "/auth/login"}
          className={`flex flex-col items-center justify-center gap-1 w-14 py-1.5 rounded-[12px] transition-all ${
            isDashboardActive ? "text-primary dark:text-primary-fixed font-bold bg-secondary-container/50" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {user ? (
            <div className={`relative h-6 w-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white transition-all ${
              isDashboardActive ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""
            }`}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold">
                  {avatarLetter}
                </div>
              )}
            </div>
          ) : (
            <User className="h-5 w-5" />
          )}
          <span className="text-[10px]">{user ? "კაბინეტი" : "შესვლა"}</span>
        </Link>

      </div>
    </div>
  );
}
