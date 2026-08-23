"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { Sprout, Heart } from "lucide-react";

export function Footer() {
  const locale = useLocale();
  const isKa = locale !== "en";

  return (
    <footer className="w-full border-t border-border/60 bg-surface-cream/70 dark:bg-card/40 mt-0 pb-24 lg:pb-10 transition-colors">
      {/* Main Footer Links */}
      <div className="container mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary text-white">
                <Sprout className="h-4 w-4 text-primary-fixed" />
              </div>
              <span className="font-bold text-base text-foreground">Plant</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isKa 
                ? "საქართველოს უდიდესი მცენარეებისა და მებაღეობის ნივთების პლატფორმა. იყიდე, გაყიდე და გაცვალე მარტივად."
                : "Georgia's premier botanical and gardening marketplace. Buy, sell, and swap plants easily."}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
              {isKa ? "კატალოგი" : "Catalog"}
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/listings?type=PLANT" className="hover:text-primary transition-colors">{isKa ? "მცენარეები" : "Plants"}</Link></li>
              <li><Link href="/listings?type=INVENTORY" className="hover:text-primary transition-colors">{isKa ? "ინვენტარი & ქოთნები" : "Pots & Care"}</Link></li>
              <li><Link href="/iso" className="hover:text-primary transition-colors">{isKa ? "ვეძებ მცენარეს (გაცვლა)" : "ISO Plant Swap"}</Link></li>
              <li><Link href="/shops" className="hover:text-primary transition-colors">{isKa ? "ვერიფიცირებული მაღაზიები" : "Verified Shops"}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
              {isKa ? "პლატფორმა & გზამკვლევი" : "Platform & Guide"}
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/how-it-works" className="hover:text-primary transition-colors">{isKa ? "როგორ მუშაობს (ფუნქციონალი)" : "How It Works & Guide"}</Link></li>
              <li><Link href="/pricing" className="hover:text-primary transition-colors">{isKa ? "ტარიფები და პაკეტები" : "Pricing & Plans"}</Link></li>
              <li><Link href="/dashboard/listings/new" className="hover:text-primary transition-colors">{isKa ? "განცხადების დამატება" : "Add Listing"}</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">{isKa ? "კონტაქტი & ფიდბექი" : "Contact & Feedback"}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
              {isKa ? "კონტაქტი & ქსელები" : "Community & Social"}
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              {isKa 
                ? "შემოუერთდით ქართველ მცენარეთა მოყვარულების საზოგადოებას."
                : "Join Georgia's fastest growing community of plant lovers."}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs px-3 py-1 rounded-[10px] bg-secondary-container text-primary font-medium">
                Telegram Community
              </span>
              <span className="text-xs px-3 py-1 rounded-[10px] bg-secondary-container text-primary font-medium">
                Facebook Group
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-border/40 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Plant. {isKa ? "ყველა უფლება დაცულია." : "All rights reserved."}</p>
          <div className="flex items-center gap-1">
            <span>Made with</span>
            <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500 inline" />
            <span>for Georgian Plant Lovers</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
