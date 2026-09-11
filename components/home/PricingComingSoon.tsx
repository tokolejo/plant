"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Rocket, 
  ShieldCheck, 
  Store, 
  Plus, 
  ArrowRight,
  Crown,
  Eye,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";

interface PricingComingSoonProps {
  onPreviewActivePlans?: () => void;
  showAdminBanner?: boolean;
}

export function PricingComingSoon({ onPreviewActivePlans, showAdminBanner = true }: PricingComingSoonProps) {
  const locale = useLocale();
  const isKa = locale !== "en";
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      if (user.email === "tokolejo@gmail.com") {
        setIsAdmin(true);
        return;
      }
      supabase
        .from("profiles")
        .select("is_admin, role")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.is_admin || data?.role === "SUPER_ADMIN" || data?.role === "MODERATOR") {
            setIsAdmin(true);
          }
        });
    });
  }, [supabase]);

  return (
    <section className="py-10 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        
        {/* Admin Bar (Visible only to administrators) */}
        {isAdmin && showAdminBanner && (
          <div className="mb-8 p-3.5 rounded-[18px] bg-purple-500/10 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-purple-800 dark:text-purple-200 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold">
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                {isKa
                  ? "ადმინ რეჟიმი: საჯარო მომხმარებლები ხედავენ ამ „Coming Soon“ გვერდს."
                  : "Admin Mode: Public visitors currently see this 'Coming Soon' state."}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onPreviewActivePlans && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onPreviewActivePlans}
                  className="rounded-[12px] h-8 text-xs font-bold gap-1.5 border-purple-400/40 hover:bg-purple-500/20 text-purple-900 dark:text-purple-100 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {isKa ? "პაკეტების წინასწარ ნახვა" : "Preview Active Plans"}
                </Button>
              )}
              <Link href="/admin">
                <Button
                  size="sm"
                  className="rounded-[12px] h-8 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white gap-1.5 cursor-pointer shadow-xs"
                >
                  <Settings className="w-3.5 h-3.5" />
                  {isKa ? "მართვა ადმინში" : "Manage in Admin"}
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Hero Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
          <Badge
            variant="outline"
            className="rounded-full px-3.5 py-1 text-xs font-black gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 shadow-xs"
          >
            <Rocket className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isKa ? "გაშვების ეტაპი — სრულიად უფასო!" : "Launch Phase — 100% Free!"}</span>
          </Badge>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight">
            {isKa
              ? "პრემიუმ ტარიფები & VIP პაკეტები მალე დაემატება"
              : "Premium Plans & VIP Packages Coming Soon"}
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
            {isKa
              ? "საიტის საწყის ეტაპზე ყველა ძირითადი ფუნქცია (განცხადების განთავსება, მცენარეების გაცვლა, AI ამოცნობა, პირდაპირი WhatsApp კომუნიკაცია) სრულიად უფასოა საზოგადოების ყველა წევრისთვის! როდესაც საზოგადოება გაიზრდება, ეტაპობრივად ჩაირთვება VIP პაკეტები, Custom URL-ები და სელერების პრემიუმ ინსტრუმენტები."
              : "During the initial launch phase, all core features (posting listings, plant swap, AI plant identification, direct WhatsApp contact) are completely free for everyone! Premium VIP plans, custom URLs, and advanced seller tools will become available as our community grows."}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link href="/dashboard/listings/new">
              <Button className="rounded-[14px] h-10 px-5 text-xs font-bold bg-primary hover:bg-primary-container text-white gap-2 shadow-ambient cursor-pointer">
                <Plus className="w-4 h-4" />
                <span>{isKa ? "განცხადების დამატება (უფასოდ)" : "Post a Listing (Free)"}</span>
              </Button>
            </Link>

            <Link href="/listings">
              <Button
                variant="outline"
                className="rounded-[14px] h-10 px-5 text-xs font-bold border-border/80 hover:bg-surface-container gap-2 cursor-pointer"
              >
                <span>{isKa ? "მარკეტპლეისის დათვალიერება" : "Browse Marketplace"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: What is free right now */}
          <div className="rounded-[24px] border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-card to-card p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-[14px] bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">
                    {isKa ? "რა არის უფასო ახლა?" : "What is Free Today?"}
                  </h3>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    {isKa ? "ხელმისაწვდომია ყველა რეგისტრირებული მომხმარებლისთვის" : "Available to all registered users"}
                  </p>
                </div>
              </div>
              <Badge className="bg-emerald-600 text-white font-black text-[10px] px-2.5 py-0.5">
                {isKa ? "100% უფასო" : "100% Free"}
              </Badge>
            </div>

            <ul className="space-y-3 text-xs text-foreground/90 font-medium">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{isKa ? "აქტიური განცხადებების განთავსება და გაყიდვა" : "Post active listings and sell houseplants"}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{isKa ? "მცენარეების გაცვლის (ISO) დაფა და გაჩუქება" : "Plant Swap (ISO) board & Free plant giveaways"}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{isKa ? "ბოტანიკური AI ამოცნობა (Plant.id & Pl@ntNet)" : "Botanical AI recognition (Plant.id & Pl@ntNet)"}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{isKa ? "პირდაპირი WhatsApp კონტაქტი და სატელეფონო ზარი" : "Direct WhatsApp messaging and instant phone dial"}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{isKa ? "2-დან 5-მდე მაღალი ხარისხის ფოტოს ატვირთვა" : "2 to 5 high-resolution photos per listing"}</span>
              </li>
            </ul>
          </div>

          {/* Card 2: What is coming soon */}
          <div className="rounded-[24px] border border-border/80 bg-surface-container/30 p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-[14px] bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">
                    {isKa ? "რა დაემატება VIP პაკეტებში?" : "Coming in VIP Plans"}
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-bold">
                    {isKa ? "ეტაპობრივად გააქტიურდება საზოგადოების ზრდასთან ერთად" : "Will activate as community scales"}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="border-amber-500/40 text-amber-600 bg-amber-500/10 font-bold text-[10px] px-2.5 py-0.5">
                <Clock className="w-3 h-3 mr-1" />
                {isKa ? "მალე" : "Coming Soon"}
              </Badge>
            </div>

            <ul className="space-y-3 text-xs text-muted-foreground font-medium">
              <li className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{isKa ? "გაფართოებული და შეუზღუდავი განცხადებების ლიმიტები" : "Extended & unlimited active listing limits"}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Store className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{isKa ? "Custom Shop URL მაღაზიებისთვის (plantio.ge/მაღაზია)" : "Custom Shop URL for nurseries (plantio.ge/shopname)"}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Rocket className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{isKa ? "VIP ბუსტები და პირველი ადგილი ძიების შედეგებში" : "Monthly VIP boosts and priority search placement"}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{isKa ? "ვერიფიცირებული მაღაზიის მწვანე ბეიჯი" : "Verified Nursery & Trusted Seller green badges"}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{isKa ? "სრული B2B ანალიტიკა და ინვოისინგი" : "Full business analytics and pro dashboard"}</span>
              </li>
            </ul>
          </div>

        </div>

      </div>
    </section>
  );
}
