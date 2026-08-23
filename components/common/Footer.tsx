"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import {
  Sprout,
  Heart,
  MapPin,
  Mail,
} from "lucide-react";

export function Footer() {
  const locale = useLocale();
  const isKa = locale !== "en";

  return (
    <footer className="w-full border-t border-border/70 bg-surface-container-lowest/80 dark:bg-card/40 mt-4 sm:mt-8 lg:mt-12 pb-20 lg:pb-8 transition-colors">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-10 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5 sm:gap-8 lg:gap-10">
          
          {/* Column 1: Brand & Contact (Spans 2 columns on wide screens) */}
          <div className="col-span-2 md:col-span-1 lg:col-span-2 space-y-2.5">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <div className="flex h-7.5 w-7.5 items-center justify-center rounded-xl bg-primary text-white shadow-ambient group-hover:scale-105 transition-transform">
                <Sprout className="h-4.5 w-4.5" />
              </div>
              <span className="font-black text-lg text-foreground tracking-tight">
                Plant<span className="text-primary font-bold">.ge</span>
              </span>
            </Link>

            <div className="space-y-1 text-xs text-muted-foreground pt-0.5">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{isKa ? "თბილისი, საქართველო" : "Tbilisi, Georgia"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                <a href="mailto:info@plant.ge" className="hover:text-primary transition-colors font-medium">
                  info@plant.ge
                </a>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-7 h-7 rounded-lg border border-border/80 bg-card hover:bg-primary/10 hover:border-primary/40 hover:text-primary flex items-center justify-center text-muted-foreground transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-7 h-7 rounded-lg border border-border/80 bg-card hover:bg-primary/10 hover:border-primary/40 hover:text-primary flex items-center justify-center text-muted-foreground transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              <a
                href="https://t.me"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="w-7 h-7 rounded-lg border border-border/80 bg-card hover:bg-primary/10 hover:border-primary/40 hover:text-primary flex items-center justify-center text-muted-foreground transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.832.942z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: მარკეტპლეისი */}
          <div className="col-span-1 space-y-2">
            <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-foreground">
              {isKa ? "მარკეტპლეისი" : "Marketplace"}
            </h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs text-muted-foreground font-medium">
              <li>
                <Link href="/listings?type=PLANT" className="hover:text-primary transition-colors">
                  {isKa ? "მცენარეები" : "Plants"}
                </Link>
              </li>
              <li>
                <Link href="/listings?type=INVENTORY" className="hover:text-primary transition-colors">
                  {isKa ? "ინვენტარი & ქოთნები" : "Pots & Care"}
                </Link>
              </li>
              <li>
                <Link href="/map" className="hover:text-primary transition-colors">
                  {isKa ? "ბოტანიკური რუკა" : "Botanical Map"}
                </Link>
              </li>
              <li>
                <Link href="/shops" className="hover:text-primary transition-colors">
                  {isKa ? "მაღაზიები & სანერგეები" : "Shops & Nurseries"}
                </Link>
              </li>
              <li>
                <Link href="/iso" className="hover:text-primary transition-colors">
                  {isKa ? "მცენარის გაცვლა" : "Plant Swaps"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: გამყიდველებისთვის */}
          <div className="col-span-1 space-y-2">
            <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-foreground">
              {isKa ? "გამყიდველებისთვის" : "For Sellers"}
            </h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs text-muted-foreground font-medium">
              <li>
                <Link href="/dashboard/listings/new" className="text-primary font-bold hover:underline transition-all">
                  {isKa ? "+ განცხადება" : "+ Add Listing"}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-primary transition-colors">
                  {isKa ? "ტარიფები & VIP" : "Pricing & VIP"}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-primary transition-colors">
                  {isKa ? "ვერიფიკაცია" : "Verification"}
                </Link>
              </li>
              <li className="flex items-center gap-1.5 text-muted-foreground/80">
                <span>{isKa ? "მებაღეები" : "Gardeners"}</span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  {isKa ? "მალე" : "Soon"}
                </span>
              </li>
            </ul>
          </div>

          {/* Column 4: დახმარება & წესები */}
          <div className="col-span-2 sm:col-span-1 space-y-2">
            <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-foreground">
              {isKa ? "დახმარება & წესები" : "Support & Legal"}
            </h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs text-muted-foreground font-medium">
              <li>
                <Link href="/faq" className="hover:text-primary transition-colors">
                  {isKa ? "როგორ მუშაობს & FAQ" : "How It Works & FAQ"}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  {isKa ? "კონტაქტი & ფიდბექი" : "Contact & Feedback"}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  {isKa ? "წესები და პირობები" : "Terms & Conditions"}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  {isKa ? "კონფიდენციალურობა" : "Privacy Policy"}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar — Compact & Clean */}
        <div className="border-t border-border/60 mt-6 sm:mt-8 pt-4 sm:pt-5 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-muted-foreground font-medium text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1">
            <p>© {new Date().getFullYear()} Plant.ge. {isKa ? "ყველა უფლება დაცულია." : "All rights reserved."}</p>
            <span className="hidden sm:inline text-border">•</span>
            <span className="text-foreground/80 font-semibold">🇬🇪 {isKa ? "საქართველო (GEL ₾)" : "Georgia (GEL ₾)"}</span>
          </div>

          <div className="flex items-center justify-center gap-1 text-muted-foreground text-[11px] sm:text-xs">
            <span>{isKa ? "შექმნილია" : "Built with"}</span>
            <Heart className="h-3.5 w-3.5 text-emerald-600 fill-emerald-600 inline" />
            <span>{isKa ? "ქართველი მცენარეთა მოყვარულებისთვის" : "for Georgian Plant Lovers"}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
