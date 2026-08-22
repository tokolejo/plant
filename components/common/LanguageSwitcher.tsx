"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLocale = () => {
    const nextLocale = locale === "ka" ? "en" : "ka";
    
    // Explicitly set cookie so middleware immediately reads the user's manual preference
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    
    router.replace(pathname || "/", { locale: nextLocale });
    router.refresh();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLocale}
      className="flex items-center gap-1 font-bold text-[11px] sm:text-xs px-2 sm:px-2.5 h-8 sm:h-9 rounded-[12px] sm:rounded-xl border-border/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-500/40 transition-all cursor-pointer shrink-0"
    >
      <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
      <span className="font-bold">{locale === "ka" ? "GEO" : "ENG"}</span>
    </Button>
  );
}
