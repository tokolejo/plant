import * as React from "react";
import { Link } from "@/i18n/routing";
import { Sprout, ShieldCheck, Truck, RefreshCw, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/60 bg-surface-cream/70 dark:bg-card/40 mt-20 pb-24 lg:pb-10 transition-colors">
      {/* Platform Features Highlight */}
      <div className="border-b border-border/40 py-8">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-secondary-container text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">სანდო გამყიდველები</h4>
                <p className="text-xs text-muted-foreground">რეიტინგები და შეფასებები</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-secondary-container text-primary">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">მოქნილი მიწოდება</h4>
                <p className="text-xs text-muted-foreground">ადგილზე, კურიერი, სამარშრუტო</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-amber-500/15 text-amber-700 dark:text-amber-300">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">მცენარეების გაცვლა</h4>
                <p className="text-xs text-muted-foreground">Trade & ISO Matchmaking სისტემა</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-secondary-container text-primary">
                <Sprout className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">100% ქართული ბაზარი</h4>
                <p className="text-xs text-muted-foreground">თბილისი, ბათუმი, რეგიონები</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary text-white">
                <Sprout className="h-4 w-4 text-primary-fixed" />
              </div>
              <span className="font-bold text-base text-foreground">PlantSale<span className="text-primary font-black">.Ge</span></span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              საქართველოს უდიდესი მცენარეებისა და მებაღეობის ნივთების პლატფორმა. იყიდე, გაყიდე და გაცვალე მარტივად.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">კატალოგი</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/listings?type=PLANT" className="hover:text-primary transition-colors">მცენარეები</Link></li>
              <li><Link href="/listings?type=INVENTORY" className="hover:text-primary transition-colors">ინვენტარი & ქოთნები</Link></li>
              <li><Link href="/iso" className="hover:text-primary transition-colors">გაცვლის დაფა (ISO)</Link></li>
              <li><Link href="/shops" className="hover:text-primary transition-colors">ვერიფიცირებული მაღაზიები</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">გამყიდველებისთვის</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/pricing" className="hover:text-primary transition-colors">ტარიფები და პაკეტები</Link></li>
              <li><Link href="/dashboard/listings/new" className="hover:text-primary transition-colors">განცხადების დამატება</Link></li>
              <li><Link href="/dashboard/affiliate" className="hover:text-primary transition-colors">აფილიეიტ პროგრამა</Link></li>
              <li><Link href="/rules" className="hover:text-primary transition-colors">წესები და პირობები</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">კონტაქტი & ქსელები</h4>
            <p className="text-xs text-muted-foreground mb-3">
              შემოუერთდით ქართველ მცენარეთა მოყვარულების საზოგადოებას.
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
          <p>© {new Date().getFullYear()} PlantSale.Ge. ყველა უფლება დაცულია.</p>
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
