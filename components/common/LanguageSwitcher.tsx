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
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLocale}
      className="flex items-center gap-1.5 font-medium text-xs px-2.5 h-9 rounded-xl border-border/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-500/40 transition-all"
    >
      <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
      <span className="font-semibold">{locale === "ka" ? "GEO" : "ENG"}</span>
    </Button>
  );
}
