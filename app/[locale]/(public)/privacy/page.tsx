import * as React from "react";
import { ShieldCheck, Lock, Eye, Database, HelpCircle } from "lucide-react";
import { Link } from "@/i18n/routing";

export default async function PrivacyPage({ params }: { params: { locale: string } }) {
  const isKa = params.locale !== "en";

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 text-primary mb-2">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {isKa ? "კონფიდენციალურობის პოლიტიკა" : "Privacy Policy"}
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            {isKa
              ? "როგორ იცავს Plant.ge თქვენს პირად მონაცემებსა და უსაფრთხოებას."
              : "How Plant.ge protects your personal data and security."}
          </p>
          <div className="text-xs text-muted-foreground font-medium pt-1">
            {isKa ? "ბოლო განახლება: აგვისტო 2026" : "Last updated: August 2026"}
          </div>
        </div>

        {/* Content Cards */}
        <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-10 shadow-ambient space-y-8 text-foreground text-sm sm:text-base leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2.5 text-foreground">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-primary text-white text-xs font-black">1</span>
              {isKa ? "მონაცემთა შეგროვება" : "Data Collection"}
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {isKa
                ? "ჩვენ ვაგროვებთ მხოლოდ იმ მონაცემებს, რომლებიც აუცილებელია პლატფორმის გამართული მუშაობისთვის: ელფოსტის მისამართი, საკონტაქტო ტელეფონი, ქალაქი/მისამართი (განცხადების განთავსებისთვის) და მომხმარებლის მიერ ატვირთული მცენარეების ფოტოები."
                : "We only collect data necessary for operating the platform: email, phone number, location, and plant photos."}
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2.5 text-foreground">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-primary text-white text-xs font-black">2</span>
              {isKa ? "მონაცემთა დაცვა & უსაფრთხოება" : "Data Protection & Security"}
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {isKa
                ? "თქვენი მონაცემები ინახება დაცულ ღრუბლოვან ინფრასტრუქტურაში (Supabase PostgreSQL) Row Level Security (RLS) დაშიფვრით. თქვენი პაროლები დაშიფრულია თანამედროვე ჰეშირების ალგორითმებით და ადმინისტრაციასაც კი არ აქვს მათზე წვდომა."
                : "All data is securely stored in Supabase PostgreSQL protected by Row Level Security (RLS). Passwords are encrypted."}
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2.5 text-foreground">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-primary text-white text-xs font-black">3</span>
              {isKa ? "ქუქი-ფაილები (Cookies) & GPS" : "Cookies & Geolocation"}
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {isKa
                ? "საიტი იყენებს ქუქი-ფაილებს თქვენი ავტორიზაციის სესიის და ენის შესანარჩუნებლად. GPS კოორდინატები გამოიყენება მხოლოდ თქვენი თანხმობით, რათა განცხადებაზე დაფიქსირდეს ზუსტი ლოკაცია მყიდველებისთვის."
                : "Cookies are used for sessions and language preferences. Geolocation is strictly used with your permission for listing coordinates."}
            </p>
          </section>

          {/* Contact Box */}
          <div className="rounded-2xl bg-secondary-container/60 border border-border p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-primary shrink-0" />
              <p className="text-xs font-medium text-foreground">
                {isKa ? "გსურთ თქვენი მონაცემების წაშლა ან განახლება?" : "Wish to delete or update your personal data?"}
              </p>
            </div>
            <Link
              href="/contact"
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shrink-0"
            >
              {isKa ? "მოგვწერეთ" : "Contact Us"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
