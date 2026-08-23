import * as React from "react";
import { ShieldCheck, FileText, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";
import { Link } from "@/i18n/routing";

export default async function TermsPage({ params }: { params: { locale: string } }) {
  const isKa = params.locale !== "en";

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-2">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {isKa ? "წესები და პირობები" : "Terms & Conditions"}
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            {isKa
              ? "Plant.ge-ს პლატფორმით სარგებლობის წესები, უფლებები და ვალდებულებები."
              : "Terms of service, user rights, and obligations for using Plant.ge."}
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
              {isKa ? "ზოგადი დებულებები" : "General Provisions"}
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {isKa
                ? "Plant.ge არის ონლაინ მარკეტპლეისი, რომელიც აკავშირებს მცენარეების, ნერგების, ქოთნებისა და ბოტანიკური ინვენტარის მყიდველებსა და გამყიდველებს. საიტით სარგებლობით თქვენ ეთანხმებით წინამდებარე წესებს."
                : "Plant.ge is an online marketplace connecting buyers and sellers of plants, seedlings, pots, and gardening supplies. By using this platform, you agree to these terms."}
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2.5 text-foreground">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-primary text-white text-xs font-black">2</span>
              {isKa ? "განცხადების განთავსება & მოდერაცია" : "Listing Rules & Moderation"}
            </h2>
            <div className="text-muted-foreground text-xs sm:text-sm space-y-2">
              <p>
                {isKa
                  ? "მომხმარებელი ვალდებულია განათავსოს მხოლოდ რეალური, უტყუარი ინფორმაცია და საკუთარი მცენარეების ფოტოები."
                  : "Users are required to post accurate information and original photos of their items."}
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>{isKa ? "აკრძალულია საქართველოს კანონმდებლობით შეზღუდული მცენარეების განთავსება." : "Prohibited plants restricted by Georgian legislation are strictly banned."}</li>
                <li>{isKa ? "აკრძალულია შეცდომაში შემყვანი ფასის ან ყალბი ლოკაციის მითითება." : "Misleading prices or fake coordinates are prohibited."}</li>
                <li>{isKa ? "ადმინისტრაცია იტოვებს უფლებას წაშალოს წესების დამრღვევი განცხადება." : "Administration reserves the right to remove non-compliant listings."}</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2.5 text-foreground">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-primary text-white text-xs font-black">3</span>
              {isKa ? "გარიგებები & უსაფრთხოება" : "Transactions & Safety"}
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {isKa
                ? "Plant.ge უზრუნველყოფს საკომუნიკაციო პლატფორმასა და ზუსტ GPS ნავიგაციას. ანგარიშსწორება ხდება უშუალოდ მყიდველსა და გამყიდველს შორის. გირჩევთ ნივთის შემოწმებას გადაცემისას."
                : "Plant.ge provides the communication platform and geolocation. Payments and swaps take place directly between buyer and seller."}
            </p>
          </section>

          {/* Contact Box */}
          <div className="rounded-2xl bg-secondary-container/60 border border-border p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-primary shrink-0" />
              <p className="text-xs font-medium text-foreground">
                {isKa ? "გაქვთ შეკითხვა წესებთან დაკავშირებით?" : "Have questions about these terms?"}
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
