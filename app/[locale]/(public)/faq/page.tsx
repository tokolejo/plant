"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import {
  HelpCircle,
  Store,
  Shuffle,
  MapPin,
  Sparkles,
  Building2,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  PlusCircle,
  ShieldCheck,
  UserCheck,
  Zap,
  HeartHandshake,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FAQPage() {
  const locale = useLocale();
  const isKa = locale !== "en";

  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(0);

  // 1. What We Offer
  const whatWeOffer = [
    {
      icon: Store,
      title: isKa ? "მცენარეებისა & ინვენტარის მარკეტი" : "Plant & Supplies Marketplace",
      desc: isKa
        ? "ოთახისა და ეზოს მცენარეების, იშვიათი კალმების, ქოთნებისა და სასუქების ყიდვა-გაყიდვა ფიქსირებულ ფასად, შეთანხმებით ან უფასოდ გაჩუქებით."
        : "Buy and sell indoor/outdoor plants, rare cuttings, pots, and soil with fixed price, negotiable, or free giveaway options.",
    },
    {
      icon: Shuffle,
      title: isKa ? "მცენარეების გაცვლა (ISO Swap)" : "Plant Swapping (ISO)",
      desc: isKa
        ? "სასურველი მცენარის მოძიება და პირდაპირი ბარტერი თანხის გარეშე. განათავსეთ რა მცენარე გაქვთ და რაში გსურთ მისი გაცვლა."
        : "Post what plant you have and what cutting you're looking for to arrange direct, cashless swaps.",
    },
    {
      icon: MapPin,
      title: isKa ? "ინტერაქტიული ბოტანიკური რუკა" : "Interactive Botanical Map",
      desc: isKa
        ? "მცენარეების, ორანჟერეებისა და კოლექციონერების მოძიება ლოკაციით თქვენს უბანსა თუ ქალაქში (თბილისი, ბათუმი, ქუთაისი და სხვ.)."
        : "Discover plants, local growers, and botanical nurseries on an interactive map across Georgia.",
    },
    {
      icon: Sparkles,
      title: isKa ? "AI ამოცნობა & მოვლის რჩევები" : "AI Plant Identification & Care",
      desc: isKa
        ? "ფოტოს ატვირთვით მცენარის ჯიშის მომენტალური დადგენა, მორწყვის გრაფიკი და ცხოველებისთვის უსაფრთხოების (Pet-Friendly) შემოწმება."
        : "Snap a photo to identify plant species, get optimal watering instructions, and check pet toxicity.",
    },
    {
      icon: Building2,
      title: isKa ? "ონლაინ მაღაზიები & Pro პაკეტები" : "Verified Stores & Pro Shop",
      desc: isKa
        ? "ყვავილების მაღაზიებისთვის და ორანჟერეებისთვის: საკუთარი ბრენდირებული გვერდი (plant.ge/shopname), VIP ბუსტები და ანალიტიკა."
        : "For commercial shops and nurseries: branded store URLs (plant.ge/shopname), VIP boosts, and inventory tools.",
    },
  ];

  // 2. How It Helps You
  const howItHelps = [
    {
      title: isKa ? "მყიდველებისთვის & მოყვარულებისთვის" : "For Buyers & Enthusiasts",
      points: isKa
        ? [
            "შეიძინეთ ჯანსაღი მცენარეები შუამავლების გარეშე საუკეთესო ფასად.",
            "იპოვეთ უფასო საჩუქრები და მცენარეების კალმები.",
            "შეამოწმეთ გამყიდველის რეალური რეიტინგი და შეფასებები.",
          ]
        : [
            "Buy healthy plants directly from growers at fair prices.",
            "Find community giveaways and free cuttings.",
            "Check transparent seller ratings and reviews.",
          ],
    },
    {
      title: isKa ? "გამყიდველებისთვის & მაღაზიებისთვის" : "For Sellers & Plant Shops",
      points: isKa
        ? [
            "გაყიდეთ მცენარეები და ინვენტარი მარტივად მთელ საქართველოში.",
            "მიიღეთ საკუთარი ონლაინ ვიტრინა (plant.ge/თქვენი-სახელი).",
            "გამოიყენეთ VIP ბუსტები პირველ გვერდზე მოსახვედრად.",
          ]
        : [
            "List and sell plants with zero hassle across Georgia.",
            "Launch your branded online storefront (plant.ge/yourname).",
            "Use VIP boosts for top homepage visibility.",
          ],
    },
    {
      title: isKa ? "კოლექციონერებისთვის & დამწყებთათვის" : "For Collectors & Beginners",
      points: isKa
        ? [
            "გაამდიდრეთ კოლექცია იშვიათი ჯიშებით პირდაპირი გაცვლის გზით.",
            "გაიგეთ სწორი მოვლის წესები AI ასისტენტის დახმარებით.",
            "დაუკავშირდით მცენარეთა ადგილობრივ საზოგადოებას.",
          ]
        : [
            "Source rare cultivars via cashless plant swaps.",
            "Learn care tips and watering guides via AI assistant.",
            "Connect with a vibrant local plant community.",
          ],
    },
  ];

  // 3. Simple Step-by-Step
  const simpleSteps = [
    {
      num: "1",
      title: isKa ? "ავტორიზაცია" : "Sign In",
      text: isKa
        ? "გაიარეთ ავტორიზაცია Google-ით ან მეილით 1 წამში."
        : "Sign in with Google or email in seconds.",
    },
    {
      num: "2",
      title: isKa ? "განთავსება ან ძიება" : "Post or Browse",
      text: isKa
        ? "ატვირთეთ მცენარის ფოტოები, ფასი ან მოძებნეთ სასურველი ჯიში."
        : "Upload photos, set price/trade, or browse catalog.",
    },
    {
      num: "3",
      title: isKa ? "პირდაპირი გარიგება" : "Connect & Deal",
      text: isKa
        ? "დაუკავშირდით პირდაპირ ტელეფონით და შეათანხმეთ გატანა ან მიწოდება."
        : "Contact seller directly to arrange pickup or delivery.",
    },
  ];

  // 4. Clean FAQs
  const faqs = [
    {
      q: isKa ? "რა ღირს საიტზე განცხადების განთავსება?" : "Is it free to list plants?",
      a: isKa
        ? "ძირითადი განცხადებების განთავსება სრულიად უფასოა. აქტიური მაღაზიებისა და კომერციული სელერებისთვის გვაქვს დამატებითი Pro Shop პაკეტები."
        : "Standard listings are 100% free. For volume sellers and commercial stores, premium Pro Shop packages are available.",
    },
    {
      q: isKa ? "როგორ ხდება მიწოდება და ანგარიშსწორება?" : "How does delivery and payment work?",
      a: isKa
        ? "მყიდველი და გამყიდველი პირდაპირ ათანხმებენ მიწოდების ფორმას: ადგილზე გატანით (თბილისი, ბათუმი, ქუთაისი და სხვ.), საკურიერო მიწოდებით ან რეგიონული სამარშრუტო გზავნილით."
        : "Buyers and sellers arrange payment and handover directly via local pickup, courier dispatch, or regional transport.",
    },
    {
      q: isKa ? "როგორ მუშაობს მცენარეების გაცვლა (ISO Swap)?" : "How does the plant swap work?",
      a: isKa
        ? "განცხადების დამატებისას აირჩიეთ ტიპი „გაცვლა (Trade)“ და მიუთითეთ რა მცენარეში გსურთ გაცვლა. დაინტერესებული მომხმარებელი დაგიკავშირდებათ პირდაპირ."
        : "When creating a listing, select 'Trade' and specify the plant you are looking for to arrange a direct swap.",
    },
    {
      q: isKa ? "როგორ მივიღო საკუთარი მაღაზიის მისამართი (plant.ge/shopname)?" : "How do I get a custom store URL?",
      a: isKa
        ? "გადადით ტარიფების გვერდზე (/pricing), აირჩიეთ Pro Shop პაკეტი და პროფილის პარამეტრებში მიუთითეთ თქვენი მაღაზიის უნიკალური სახელი."
        : "Choose a Pro Shop package on /pricing and set your custom slug in profile settings.",
    },
    {
      q: isKa ? "როგორ მუშაობს AI მცენარის ამოცნობა?" : "How does AI plant recognition work?",
      a: isKa
        ? "განცხადების შევსებისას ფოტოს ატვირთვის შემდეგ AI ავტომატურად განსაზღვრავს მცენარის სახეობას, მოვლის რეკომენდაციებსა და ტოქსიკურობას შინაური ცხოველებისთვის."
        : "Upon uploading photos, our AI assistant detects the botanical species, provides watering advice, and pet toxicity status.",
    },
  ];

  return (
    <div className="min-h-screen bg-background py-6 sm:py-10">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl space-y-8 sm:space-y-12">

        {/* ═══ Header ═══ */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-foreground text-xs font-bold border border-border/60">
            <HelpCircle className="w-3.5 h-3.5 text-primary" />
            <span>{isKa ? "კითხვები & გზამკვლევი" : "FAQ & Platform Guide"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">
            {isKa ? "როგორ მუშაობს და რას გთავაზობთ Plant.ge?" : "How Plant.ge Works & What We Offer"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {isKa
              ? "მარტივი და ლაკონიური გზამკვლევი პლატფორმის შესაძლებლობებსა და გამოყენების წესებზე."
              : "A simple, clear guide to platform capabilities, benefits, and instructions."}
          </p>
        </div>

        {/* ═══ 1. What We Offer ═══ */}
        <div className="space-y-4">
          <div className="border-b border-border/60 pb-2">
            <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              <span>{isKa ? "1. რას გთავაზობთ პლატფორმა?" : "1. What We Offer"}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {whatWeOffer.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="p-4 rounded-[16px] border border-border/80 bg-card shadow-2xs space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="h-9 w-9 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-foreground">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ 2. How It Helps You ═══ */}
        <div className="space-y-4">
          <div className="border-b border-border/60 pb-2">
            <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-600" />
              <span>{isKa ? "2. რაში გამოგადგებათ და რაში დაგეხმარებათ?" : "2. How It Helps You"}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {howItHelps.map((col, i) => (
              <div
                key={i}
                className="p-4 rounded-[16px] border border-border/80 bg-surface-container/30 space-y-2.5"
              >
                <h3 className="text-xs font-bold text-foreground">
                  {col.title}
                </h3>
                <ul className="space-y-1.5 text-[11px] text-muted-foreground">
                  {col.points.map((p, j) => (
                    <li key={j} className="flex items-start gap-1.5 leading-snug">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ 3. Simple Step-by-Step Instructions ═══ */}
        <div className="space-y-4">
          <div className="border-b border-border/60 pb-2">
            <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>{isKa ? "3. როგორ გამოიყენოთ საიტი (3 მარტივი ნაბიჯი)" : "3. How to Use (3 Simple Steps)"}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {simpleSteps.map((st, i) => (
              <div
                key={i}
                className="p-4 rounded-[16px] border border-border/80 bg-card shadow-2xs space-y-1.5"
              >
                <div className="h-6 w-6 rounded-full bg-primary text-white font-black text-xs flex items-center justify-center">
                  {st.num}
                </div>
                <h3 className="text-xs font-bold text-foreground">{st.title}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{st.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ 4. Frequently Asked Questions ═══ */}
        <div className="space-y-4">
          <div className="border-b border-border/60 pb-2">
            <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              <span>{isKa ? "4. ხშირად დასმული კითხვები" : "4. Frequently Asked Questions"}</span>
            </h2>
          </div>

          <div className="space-y-2.5">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-[14px] border border-border/80 overflow-hidden bg-card transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-foreground hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 shrink-0 ml-2 ${
                        isOpen ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-3.5 pb-3.5 pt-1 text-[11px] text-muted-foreground leading-relaxed border-t border-border/40 bg-surface-container/20">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ Call to Action Bar ═══ */}
        <div className="rounded-[20px] bg-secondary-container/60 border border-border/80 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-black text-foreground">
              {isKa ? "მზად ხართ განათავსოთ თქვენი მცენარე?" : "Ready to post your listing?"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isKa
                ? "განცხადების განთავსება უფასოა და მხოლოდ 2 წუთს მოითხოვს."
                : "Posting a listing is completely free and takes just 2 minutes."}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href="/dashboard/listings/new">
              <Button className="rounded-[12px] bg-primary hover:bg-primary-container text-white text-xs font-bold px-4 h-9 shadow-xs gap-1.5 cursor-pointer">
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{isKa ? "+ განცხადების დამატება" : "+ Add Listing"}</span>
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="rounded-[12px] border-border/80 text-xs font-bold px-4 h-9 hover:bg-surface-container cursor-pointer">
                <span>{isKa ? "კონტაქტი" : "Contact"}</span>
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
