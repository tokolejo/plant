"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import {
  Sprout,
  Store,
  Shuffle,
  MapPin,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  PlusCircle,
  Search,
  Layers,
  Heart,
  Star,
  Zap,
  Users,
  Eye,
  Camera,
  Truck,
  Building2,
  HelpCircle,
  BadgeCheck,
  Flame,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HowItWorksPage() {
  const locale = useLocale();
  const isKa = locale !== "en";

  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(0);
  const [activeFaqCategory, setActiveFaqCategory] = React.useState<string>("all");

  const coreFeatures = [
    {
      icon: Store,
      title: isKa ? "მცენარეებისა & ინვენტარის მარკეტი" : "Botanical Marketplace",
      badge: isKa ? "ყიდვა / გაყიდვა" : "Buy / Sell",
      badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
      description: isKa
        ? "განათავსეთ ან შეიძინეთ ოთახისა და ეზოს მცენარეები, იშვიათი კალმები, კერამიკული ქოთნები, გრუნტები და სასუქები. ხელმისაწვდომია ფიქსირებული ფასი, შეთანხმებით ან უფასოდ გაჩუქება."
        : "Buy and sell indoor/outdoor plants, rare cuttings, ceramic pots, premium soil, and plant care accessories. Choose fixed prices, negotiable deals, or giveaway items.",
      highlights: isKa
        ? ["მინიმუმ 2 და მაქსიმუმ 5 ფოტო", "მიწოდების მეთოდები (კურიერი, გატანა, სამარშრუტო)", "ფილტრაცია ქალაქის, ფასისა და კატეგორიის მიხედვით"]
        : ["2 to 5 high-res photos per listing", "Flexible delivery options (pickup, courier, regional transport)", "Precise filters by city, price range, and plant species"],
    },
    {
      icon: Shuffle,
      title: isKa ? "მცენარეების გაცვლა (ISO Swap)" : "Plant Swapping (ISO)",
      badge: isKa ? "ბარტერი" : "Swap & Trade",
      badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
      description: isKa
        ? "გაქვთ მცენარე, რომელიც გინდათ გაცვალოთ სხვა ჯიშში? In Search Of (ISO) განყოფილებაში შეგიძლიათ იპოვოთ სასურველი მცენარე და შესთავაზოთ თქვენი კოლექციის ეგზემპლარი."
        : "Looking to trade plants? Our dedicated ISO (In Search Of) board lets you post what you have and what you're looking for, facilitating seamless plant swaps across Georgia.",
      highlights: isKa
        ? ["პირდაპირი ბარტერი თანხის გარეშე", "იშვიათი ჯიშების მოძიება", "მცენარეთა ენთუზიასტების კომუნიკაცია"]
        : ["Direct cashless swaps", "Discover rare cultivars & cuttings", "Engage with active local growers"],
    },
    {
      icon: MapPin,
      title: isKa ? "ინტერაქტიული ბოტანიკური რუკა" : "Interactive Botanical Map",
      badge: isKa ? "ლოკაციები" : "Local Map",
      badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
      description: isKa
        ? "აღმოაჩინეთ მცენარეები და ორანჟერეები თქვენს სიახლოვეს. ცოცხალი რუკა გაჩვენებთ სად იმყოფებიან გამყიდველები თბილისში, ბათუმში, ქუთაისსა და რეგიონებში."
        : "Discover plants, private collectors, and professional nurseries near you. Explore listings pinpointed on an interactive map across Tbilisi, Batumi, Kutaisi, and all regions.",
      highlights: isKa
        ? ["უბნებისა და ქალაქების მიხედვით ლოკაცია", "პირდაპირი მარშრუტი და მისამართი", "ადგილზე გატანის გამარტივება"]
        : ["Neighborhood & city breakdown", "Directions and exact pickup areas", "Convenient local pickups"],
    },
    {
      icon: Sparkles,
      title: isKa ? "AI მცენარის ამოცნობა & მოვლის რჩევები" : "AI PlantNet & Care Assistant",
      badge: isKa ? "ხელოვნური ინტელექტი" : "AI Powered",
      badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
      description: isKa
        ? "განცხადების დამატებისას ან მცენარის შემოწმებისას AI ავტომატურად ამოიცნობს ჯიშს, გთავაზობთ მოვლის რჩევებს, მორწყვის სიხშირესა და ტოქსიკურობის შემოწმებას შინაური ცხოველებისთვის."
        : "Snap or upload a photo and our integrated AI instantly identifies the botanical species, suggests optimal watering, light requirements, and warns if it is pet-friendly or toxic.",
      highlights: isKa
        ? ["სახეობის მყისიერი დეტექცია", "Pet-Friendly (ცხოველებისთვის უსაფრთხოების) სტატუსი", "მოვლის გზამკვლევი (მზე, წყალი, ტემპერატურა)"]
        : ["Instant botanical species identification", "Pet-safety & toxicity check", "Care tips: watering, sunlight, and humidity"],
    },
    {
      icon: Building2,
      title: isKa ? "ვერიფიცირებული მაღაზიები & Pro პაკეტები" : "Verified Stores & Pro Shop",
      badge: isKa ? "ბიზნესებისთვის" : "For Businesses",
      badgeColor: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
      description: isKa
        ? "ყვავილების მაღაზიებს, ორანჟერეებსა და აქტიურ გამყიდველებს შეუძლიათ გაააქტიურონ Pro / Shop ტარიფები, მიიღონ საკუთარი Custom URL (plant.ge/shopname) და გაყიდვების დეტალური ანალიტიკა."
        : "Plant shops, greenhouses, and commercial nurseries can activate Pro/Shop tiers to unlock branded storefronts (plant.ge/yourname), unlimited listings, VIP boosts, and seller analytics.",
      highlights: isKa
        ? ["პერსონალური მისამართი: plant.ge/username", "VIP ბუსტები პირველ გვერდზე მოსახვედრად", "სრული ინვენტარის მართვის პანელი"]
        : ["Custom shop URL: plant.ge/username", "VIP Boosts for top homepage placement", "Full inventory & seller analytics dashboard"],
    },
    {
      icon: ShieldCheck,
      title: isKa ? "სანდოობა, რეიტინგები & უსაფრთხოება" : "Trust, Ratings & Verified Badges",
      badge: isKa ? "უსაფრთხოება" : "Trust & Safety",
      badgeColor: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
      description: isKa
        ? "მომხმარებელთა რეალური შეფასებები, ვარსკვლავები და ვერიფიცირებული სელერის ბეიჯები უზრუნველყოფს გამჭვირვალე და დაცულ გარემოს ყოველი გარიგებისთვის."
        : "Real user reviews, 5-star rating scores, and verified seller badges ensure complete transparency and peace of mind for every transaction.",
      highlights: isKa
        ? ["გამყიდველის საჯარო რეიტინგი და შეფასებები", "პირდაპირი კომუნიკაცია ტელეფონითა და ჩატით", "მოდერირებული და გადამოწმებული განცხადებები"]
        : ["Transparent seller ratings and reviews", "Direct phone and chat communication", "Moderated listings with spam protection"],
    },
  ];

  const targetAudiences = [
    {
      icon: Heart,
      title: isKa ? "მცენარეების მოყვარულებისთვის" : "For Plant Lovers & Enthusiasts",
      desc: isKa
        ? "აღმოაჩინეთ ჯანსაღი მცენარეები პირდაპირ მფლობელებისგან ხელმისაწვდომ ფასად ან მიიღეთ უფასო საჩუქრები."
        : "Discover healthy houseplants directly from local owners at affordable prices or grab community giveaways.",
    },
    {
      icon: Star,
      title: isKa ? "იშვიათი ჯიშების კოლექციონერებისთვის" : "For Rare Plant Collectors",
      desc: isKa
        ? "მოძებნეთ ვარიეგატული მონსტერები, ანთურიუმები, იშვიათი ფილოდენდრონები და გაცვალეთ თქვენი კალმები."
        : "Source variegated Monsteras, rare Anthuriums, and exotic Philodendrons; trade cuttings safely.",
    },
    {
      icon: Store,
      title: isKa ? "მაღაზიებისა & ორანჟერეებისთვის" : "For Shops, Greenhouses & Nurseries",
      desc: isKa
        ? "გაზარდეთ გაყიდვები, მიიღეთ საკუთარი ბრენდირებული გვერდი და მიაწვდინეთ ხმა მწვანე აუდიტორიას მთელ საქართველოში."
        : "Expand your customer reach, manage bulk catalog listings, and build your digital storefront.",
    },
    {
      icon: Sprout,
      title: isKa ? "დამწყებთათვის & მწვანე ინტერიერისთვის" : "For Beginners & Home Decor",
      desc: isKa
        ? "შეარჩიეთ მარტივად მოსავლელი მცენარეები, გაეცანით AI მოვლის რჩევებს და გაამწვანეთ თქვენი სახლი ან ოფისი."
        : "Find low-maintenance beginner plants, get AI-assisted watering tips, and transform your indoor living space.",
    },
  ];

  const stepWorkflow = [
    {
      step: "01",
      title: isKa ? "ავტორიზაცია & პროფილი" : "Sign In & Setup Profile",
      desc: isKa
        ? "გაიარეთ სწრაფი ავტორიზაცია Google-ით ან ელ-ფოსტით. შეავსეთ თქვენი სახელი, ქალაქი და საკონტაქტო ნომერი."
        : "Sign in quickly via Google or email. Set your city, contact phone, and seller bio.",
    },
    {
      step: "02",
      title: isKa ? "განცხადების განთავსება" : "Post or Search Listings",
      desc: isKa
        ? "ატვირთეთ ფოტოები, მიუთითეთ მცენარის ჯიში, ფასი (ან გაცვლა/საჩუქარი), მდებარეობა და მიწოდების მეთოდი."
        : "Upload 2-5 plant photos, specify price (or trade/giveaway), location, and delivery terms.",
    },
    {
      step: "03",
      title: isKa ? "პირდაპირი დაკავშირება" : "Connect & Arrange Deal",
      desc: isKa
        ? "დაუკავშირდით გამყიდველს ან მყიდველს პირდაპირ ტელეფონით, შეათანხმეთ შეხვედრის ადგილი ან საკურიერო მიწოდება."
        : "Reach out via phone or direct contact, agree on pickup or courier delivery terms.",
    },
    {
      step: "04",
      title: isKa ? "შეფასება & საზოგადოება" : "Review & Grow Community",
      desc: isKa
        ? "გარიგების შემდეგ დატოვეთ შეფასება, დააგროვეთ რეიტინგი და შემოუერთდით საქართველოს მწვანე ეკოსისტემას."
        : "Leave a seller review, earn community trust points, and help grow Georgia's botanical community.",
    },
  ];

  const faqCategories = [
    { id: "all", label: isKa ? "ყველა კითხვა" : "All Questions" },
    { id: "general", label: isKa ? "ზოგადი & ანგარიში" : "General & Account" },
    { id: "buying", label: isKa ? "ყიდვა & გაყიდვა" : "Buying & Selling" },
    { id: "swap", label: isKa ? "გაცვლა (ISO)" : "Plant Swapping" },
    { id: "shops", label: isKa ? "მაღაზიები & ტარიფები" : "Shops & Pro Plans" },
  ];

  const allFaqs = [
    {
      cat: "general",
      q: isKa ? "რა არის Plant.ge და რა მიზანს ემსახურება?" : "What is Plant.ge?",
      a: isKa
        ? "Plant.ge არის საქართველოს პირველი სპეციალიზებული ბოტანიკური პლატფორმა, რომელიც აერთიანებს მცენარეების მოყვარულებს, კოლექციონერებს, ორანჟერეებსა და ყვავილების მაღაზიებს. პლატფორმაზე შეგიძლიათ შეიძინოთ, გაყიდოთ, გაცვალოთ ან გააჩუქოთ მცენარეები და ინვენტარი, ასევე გამოიყენოთ AI ამოცნობა და ინტერაქტიული რუკა."
        : "Plant.ge is Georgia's premier botanical marketplace connecting plant lovers, rare collectors, greenhouses, and verified plant stores. It enables seamless buying, selling, swapping, giveaways, AI plant recognition, and interactive local map discovery.",
    },
    {
      cat: "general",
      q: isKa ? "უფასოა თუ არა საიტით სარგებლობა?" : "Is it free to use?",
      a: isKa
        ? "დიახ, სტანდარტული მომხმარებლებისთვის რეგისტრაცია, განცხადებების დათვალიერება, მცენარეების ყიდვა და ძირითადი განცხადებების განთავსება სრულიად უფასოა. აქტიური მაღაზიებისა და კომერციული სელერებისთვის ხელმისაწვდომია გაფართოებული Pro და Shop ტარიფები."
        : "Yes, browsing, buying, and posting standard listings are 100% free for individual users. For volume sellers and commercial stores, premium Pro and Shop tiers offer increased capacity and VIP perks.",
    },
    {
      cat: "buying",
      q: isKa ? "როგორ დავამატო განცხადება საიტზე?" : "How do I post a listing?",
      a: isKa
        ? "დააჭირეთ ღილაკს „+ დამატება“ (ან გადადით /dashboard/listings/new-ზე). თუ ავტორიზაცია არ გაქვთ გავლილი, სისტემა ჯერ შესვლის გვერდზე გადაგამისამართებთ და შემდეგ ავტომატურად დაგაბრუნებთ ფორმაზე. ატვირთეთ მინიმუმ 2 ფოტო, მიუთითეთ სათაური, ფასი, ქალაქი და მიწოდების პირობები."
        : "Click '+ Post Listing'. If not signed in, you will be prompted to log in and automatically redirected back. Upload at least 2 photos, choose category/price, set location, and submit.",
    },
    {
      cat: "buying",
      q: isKa ? "როგორ ხდება ანგარიშსწორება და მიწოდება?" : "How do payments and delivery work?",
      a: isKa
        ? "მყიდველი და გამყიდველი ანგარიშსწორებასა და მიწოდების ფორმას ათანხმებენ უშუალოდ: ადგილზე გატანით (თბილისში, ბათუმში ან სხვა ქალაქში), საკურიერო სერვისით (Wolt Drive, Yandex Delivery, Georgian Post) ან რეგიონული სამარშრუტო გზავნილით."
        : "Buyers and sellers arrange payment and handover directly: local pickup, courier dispatch, or regional bus transit.",
    },
    {
      cat: "swap",
      q: isKa ? "როგორ მუშაობს მცენარეების გაცვლის (ISO) განყოფილება?" : "How does the ISO swap section work?",
      a: isKa
        ? "ISO (In Search Of) განკუთვნილია ბარტერისთვის. განცხადების დამატებისას აირჩიეთ გარიგების ტიპი „გაცვლა (Trade)“ და ველში „გავცვლი შემდეგში“ მიუთითეთ რა მცენარის კალამი ან ჯიში გაინტერესებთ. მსურველი დაგიკავშირდებათ და შეათანხმებთ გაცვლას."
        : "The ISO section enables barter. When creating a listing, select 'Trade' and specify which plant or cutting you are seeking in exchange.",
    },
    {
      cat: "shops",
      q: isKa ? "რა უპირატესობა აქვს Pro Shop პაკეტს?" : "What are the benefits of a Pro Shop package?",
      a: isKa
        ? "Pro Shop ტარიფი განკუთვნილია მაღაზიებისა და აქტიური გამყიდველებისთვის. ის გაძლევთ საკუთარ Custom URL მისამართს (მაგ: plant.ge/shopname), 100-მდე აქტიურ განცხადებას, VIP ბუსტებს მთავარ გვერდზე მოსახვედრად, ვერიფიცირებულ ბეიჯს და გაყიდვების სტატისტიკას."
        : "Pro Shop packages offer branded vanity URLs (plant.ge/shopname), up to 100 listings, VIP Homepage boosts, verified store badges, and deep sales analytics.",
    },
    {
      cat: "shops",
      q: isKa ? "როგორ მივიღო საკუთარი მისამართი (plant.ge/shopname)?" : "How can I get my own custom store URL?",
      a: isKa
        ? "გადადით ტარიფების გვერდზე (/pricing), გაააქტიურეთ Pro Shop ან Enterprise პაკეტი და პროფილის პარამეტრებში მიუთითეთ თქვენთვის სასურველი უნიკალური Slug (მაგ: 'greengarden'). თქვენი მაღაზიის ბმული მომენტალურად გახდება აქტიური."
        : "Activate a Pro Shop or Enterprise tier from /pricing, and set your desired custom slug in your dashboard profile settings.",
    },
  ];

  const filteredFaqs = React.useMemo(() => {
    if (activeFaqCategory === "all") return allFaqs;
    return allFaqs.filter((f) => f.cat === activeFaqCategory);
  }, [activeFaqCategory, allFaqs]);

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12 lg:py-16">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl space-y-12 sm:space-y-16">

        {/* ═══ 1. Hero Section ═══ */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary-container text-foreground text-xs font-bold border border-border/70 shadow-2xs">
            <Sprout className="w-4 h-4 text-primary" />
            <span>{isKa ? "ბოტანიკური ეკოსისტემა & მარკეტფლეისი" : "Botanical Ecosystem & Marketplace"}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-tight">
            {isKa ? (
              <>
                ყველაფერი რაც უნდა იცოდეთ <span className="text-primary">Plant.ge</span>-ს შესახებ
              </>
            ) : (
              <>
                Everything You Need to Know About <span className="text-primary">Plant.ge</span>
              </>
            )}
          </h1>

          <p className="text-xs sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {isKa
              ? "საქართველოს პირველი სპეციალიზებული პლატფორმა მცენარეების ყიდვა-გაყიდვის, გაცვლის (ISO), AI ამოცნობისა და მწვანე ბიზნესების განვითარებისთვის."
              : "Georgia's first specialized botanical platform for plant trading, ISO swaps, AI identification, and green business growth."}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/listings">
              <Button className="rounded-[14px] bg-primary hover:bg-primary-container text-white text-xs sm:text-sm font-bold px-5 h-11 shadow-ambient gap-2 cursor-pointer">
                <Store className="w-4 h-4" />
                <span>{isKa ? "მარკეტის დათვალიერება" : "Explore Marketplace"}</span>
              </Button>
            </Link>

            <Link href="/dashboard/listings/new">
              <Button variant="outline" className="rounded-[14px] border-border/80 text-xs sm:text-sm font-bold px-5 h-11 gap-2 hover:bg-surface-container cursor-pointer">
                <PlusCircle className="w-4 h-4 text-primary" />
                <span>{isKa ? "განცხადების განთავსება" : "Post a Listing"}</span>
              </Button>
            </Link>

            <Link href="/map">
              <Button variant="ghost" className="rounded-[14px] text-xs sm:text-sm font-bold px-4 h-11 gap-1.5 hover:bg-surface-container cursor-pointer text-muted-foreground hover:text-foreground">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>{isKa ? "რუკა" : "Map"}</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* ═══ 2. Key Capabilities Grid (6 Features) ═══ */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1.5">
            <h2 className="text-xl sm:text-3xl font-black text-foreground">
              {isKa ? "რას გთავაზობთ პლატფორმა?" : "Core Platform Capabilities"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isKa
                ? "ყველა ინსტრუმენტი, რაც მცენარეების მოყვარულსა და ბიზნესს სჭირდება ერთ სივრცეში"
                : "Every feature plant lovers and green stores need in one unified ecosystem"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {coreFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="rounded-[22px] border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-primary/40 hover:shadow-ambient transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-11 w-11 rounded-[14px] bg-primary/10 text-primary flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${feat.badgeColor}`}>
                        {feat.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-foreground">
                      {feat.title}
                    </h3>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {feat.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border/50 space-y-1.5 text-[11px]">
                    {feat.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-foreground/80 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ 3. Who Is It For? (Target Audiences) ═══ */}
        <div className="rounded-[26px] border border-border/80 bg-surface-container/40 p-6 sm:p-10 space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-1.5">
            <h2 className="text-xl sm:text-3xl font-black text-foreground">
              {isKa ? "ვის გამოადგება Plant.ge?" : "Who is Plant.ge For?"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isKa
                ? "მცენარეების დამწყები მოყვარულიდან პროფესიულ ორანჟერეამდე"
                : "From passionate home growers to commercial botanical nurseries"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {targetAudiences.map((aud, idx) => {
              const Icon = aud.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-[18px] bg-card border border-border/70 shadow-2xs space-y-2.5 flex flex-col"
                >
                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-black text-foreground">
                    {aud.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {aud.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ 4. How It Works Step-by-Step ═══ */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1.5">
            <h2 className="text-xl sm:text-3xl font-black text-foreground">
              {isKa ? "როგორ მუშაობს - 4 მარტივი ნაბიჯი" : "How It Works in 4 Steps"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isKa
                ? "დაიწყეთ მცენარეების ყიდვა-გაყიდვა რამდენიმე წუთში"
                : "Start trading and sharing plants in minutes"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stepWorkflow.map((st, idx) => (
              <div
                key={idx}
                className="relative p-5 sm:p-6 rounded-[22px] border border-border/80 bg-card shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <span className="text-2xl sm:text-3xl font-black text-primary/40 font-mono">
                    {st.step}
                  </span>
                  <h4 className="text-sm font-black text-foreground">
                    {st.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ 5. Comprehensive FAQs ═══ */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary mb-1">
              <HelpCircle className="w-4 h-4" />
              <span>{isKa ? "კითხვები და პასუხები" : "Knowledge Base"}</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-foreground">
              {isKa ? "ხშირად დასმული კითხვები" : "Frequently Asked Questions"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isKa
                ? "მიიღეთ პასუხი ყველა მნიშვნელოვან საკითხზე"
                : "Find quick answers to common questions regarding account, trading, and delivery"}
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {faqCategories.map((c) => {
              const isSelected = activeFaqCategory === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveFaqCategory(c.id)}
                  className={`px-3.5 py-1.5 rounded-[12px] text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary text-white shadow-2xs"
                      : "bg-surface-container/60 text-muted-foreground hover:text-foreground hover:bg-surface-container"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Accordion list */}
          <div className="max-w-3xl mx-auto space-y-3">
            {filteredFaqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-[16px] border border-border/80 overflow-hidden bg-card transition-all shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-4 text-left text-xs sm:text-sm font-bold text-foreground hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0 ml-3 ${
                        isOpen ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/40 bg-surface-container/20">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ 6. CTA Banner ═══ */}
        <div className="rounded-[28px] bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6 sm:p-12 text-center space-y-5 shadow-ambient">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-black">
              {isKa
                ? "მზად ხართ შემოუერთდეთ მცენარეების ეკოსისტემას?"
                : "Ready to Join Georgia's Plant Marketplace?"}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              {isKa
                ? "განათავსეთ თქვენი პირველი განცხადება, იპოვეთ იშვიათი კალმები ან შექმენით საკუთარი ონლაინ მაღაზია."
                : "Post your first listing, source rare cuttings, or launch your digital botanical shop today."}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/dashboard/listings/new">
              <Button className="rounded-[14px] bg-white text-emerald-900 hover:bg-white/90 text-xs sm:text-sm font-black px-6 h-11 shadow-md cursor-pointer">
                <span>{isKa ? "+ განცხადების დამატება" : "+ Post a Listing"}</span>
              </Button>
            </Link>

            <Link href="/pricing">
              <Button variant="outline" className="rounded-[14px] border-white/40 bg-white/10 text-white hover:bg-white/20 text-xs sm:text-sm font-bold px-6 h-11 cursor-pointer">
                <span>{isKa ? "ტარიფების ნახვა" : "Explore Pro Plans"}</span>
              </Button>
            </Link>

            <Link href="/contact">
              <Button variant="ghost" className="rounded-[14px] text-white/90 hover:text-white hover:bg-white/10 text-xs sm:text-sm font-bold px-4 h-11 cursor-pointer">
                <span>{isKa ? "კონტაქტი" : "Contact Us"}</span>
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
