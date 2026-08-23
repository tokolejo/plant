"use client";

import * as React from "react";
import { Link, usePathname } from "@/i18n/routing";
import { 
  Home, 
  Store, 
  PlusCircle, 
  MapPin, 
  Menu
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { MobileMenuDrawer } from "./MobileMenuDrawer";

export function MobileBottomNav() {
  const pathname = usePathname();
  const locale = useLocale();
  const isKa = locale !== "en";
  const navT = useTranslations("Navigation");

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const isListingsActive = pathname.startsWith("/listings");
  const isMapActive = pathname === "/map";

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 block lg:hidden border-t border-border/70 bg-card/95 backdrop-blur-xl pb-safe">
        <div className="flex h-15 items-center justify-around px-1">

          {/* 1. Home */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center gap-0.5 w-14 py-1 rounded-[10px] transition-all ${
              pathname === "/" ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px]">{navT("home")}</span>
          </Link>

          {/* 2. Shop / Catalog */}
          <Link
            href="/listings"
            className={`flex flex-col items-center justify-center gap-0.5 w-14 py-1 rounded-[10px] transition-all ${
              isListingsActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
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
            <span className="text-[9px] font-bold text-primary mt-0.5">
              {isKa ? "დამატება" : "Post"}
            </span>
          </Link>

          {/* 4. Botanical Map */}
          <Link
            href="/map"
            className={`flex flex-col items-center justify-center gap-0.5 w-14 py-1 rounded-[10px] transition-all ${
              isMapActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MapPin className="h-5 w-5" />
            <span className="text-[10px]">{navT("map")}</span>
          </Link>

          {/* 5. Mobile Burger Menu Drawer Opener */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 w-14 py-1 rounded-[10px] transition-all cursor-pointer ${
              isMenuOpen ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Open mobile menu"
          >
            <div className="relative">
              <Menu className="h-5 w-5" />
            </div>
            <span className="text-[10px]">
              {isKa ? "მენიუ" : "Menu"}
            </span>
          </button>

        </div>
      </div>

      {/* Slide-out Mobile Menu Drawer */}
      <MobileMenuDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}
