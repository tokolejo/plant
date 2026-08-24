"use client";

import * as React from "react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import {
  X,
  Home,
  Store,
  MapPin,
  Shuffle,
  Sparkles,
  MessageSquare,
  Globe,
  Sprout,
  Plus,
  ChevronRight,
  HelpCircle,
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
  const navT = useTranslations("Navigation");

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

  const toggleLanguage = () => {
    const nextLocale = locale === "ka" ? "en" : "ka";
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    router.replace(pathname || "/", { locale: nextLocale });
    router.refresh();
  };

  const navLinks = [
    { href: "/", label: navT("home"), icon: Home, match: "/" },
    { href: "/listings", label: navT("market"), icon: Store, match: "/listings" },
    { href: "/map", label: navT("map"), icon: MapPin, match: "/map" },
    { href: "/iso", label: navT("iso"), icon: Shuffle, match: "/iso" },
    { href: "/faq", label: isKa ? "კითხვები" : "FAQ", icon: HelpCircle, match: "/faq" },
    { href: "/pricing", label: navT("pricing"), icon: Sparkles, match: "/pricing" },
    { href: "/contact", label: navT("contact"), icon: MessageSquare, match: "/contact" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] lg:hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 w-[290px] max-w-[82vw] bg-card text-foreground shadow-2xl z-[201] flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-250 ease-out border-l border-border/80">
        
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/60 bg-surface-cream/80">
            <Link href="/" onClick={onClose} className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-primary text-white shadow-ambient">
                <Sprout className="h-4 w-4" />
              </div>
              <span className="font-bold text-sm text-foreground">
                Plant
              </span>
            </Link>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-surface-container text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Post Listing Button */}
          <div className="p-3">
            <Link
              href="/dashboard/listings/new"
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-[12px] bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-ambient transition-all"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>{isKa ? "განცხადების დამატება" : "Post Listing"}</span>
            </Link>
          </div>

          {/* Navigation Links — Mirroring Desktop Navigation */}
          <div className="px-3 py-1 space-y-1">
            {navLinks.map(({ href, label, icon: Icon, match }) => {
              const active = match === "/" ? pathname === "/" : pathname.startsWith(match);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-[12px] text-xs font-semibold transition-all ${
                    active
                      ? "bg-secondary-container text-primary font-bold shadow-2xs"
                      : "text-foreground hover:bg-surface-container"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                    <span>{label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom Section: Language & Footer */}
        <div className="p-4 border-t border-border/60 bg-surface-cream/40 space-y-3">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="w-full flex items-center justify-between px-3 py-2 rounded-[12px] text-xs font-semibold text-foreground bg-surface-container/80 hover:bg-surface-container border border-border/70 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600" />
              <span>{isKa ? "ენა" : "Language"}</span>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-[6px] bg-primary text-white">
              {locale === "ka" ? "ქართული (GE)" : "English (EN)"}
            </span>
          </button>

          <p className="text-[10px] text-center text-muted-foreground">
            © {new Date().getFullYear()} Plant • Botanical Marketplace
          </p>
        </div>

      </div>
    </div>
  );
}
