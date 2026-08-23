"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import {
  Mail,
  Send,
  CheckCircle2,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  AlertCircle,
  HelpCircle,
  Building2,
  Lightbulb,
  ChevronDown,
  Loader2,
  ShieldCheck,
  SendHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type InquiryType = "general" | "suggestion" | "bug" | "partnership";

export default function ContactPage() {
  const locale = useLocale();
  const isKa = locale !== "en";

  const [inquiryType, setInquiryType] = React.useState<InquiryType>("general");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = React.useState<number | null>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMsg(
        isKa
          ? "გთხოვთ შეავსოთ სახელი, ელ-ფოსტა და შეტყობინების ველი."
          : "Please provide your name, email, and message."
      );
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: inquiryType,
          name,
          email,
          phone,
          subject,
          message,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setErrorMsg(data.error || (isKa ? "დაფიქსირდა შეცდომა." : "An error occurred."));
      }
    } catch (err: any) {
      setErrorMsg(err?.message || (isKa ? "დაფიქსირდა შეცდომა." : "An error occurred."));
    } finally {
      setSubmitting(false);
    }
  };

  const categories: { id: InquiryType; title: string; subtitle: string; icon: any }[] = [
    {
      id: "general",
      title: isKa ? "ზოგადი კითხვა" : "General Inquiry",
      subtitle: isKa ? "კითხვები პლატფორმის შესახებ" : "Platform questions",
      icon: MessageSquare,
    },
    {
      id: "suggestion",
      title: isKa ? "იდეა & წინადადება" : "Idea & Suggestion",
      subtitle: isKa ? "ფუნქციონალის გაუმჯობესება" : "Feature requests",
      icon: Lightbulb,
    },
    {
      id: "bug",
      title: isKa ? "ხარვეზის რეპორტი" : "Bug Report",
      subtitle: isKa ? "ტექნიკური პრობლემა" : "Technical issue",
      icon: AlertCircle,
    },
    {
      id: "partnership",
      title: isKa ? "პარტნიორობა / B2B" : "Partnership / B2B",
      subtitle: isKa ? "მაღაზიები & ბიზნესი" : "Shops & Collaboration",
      icon: Building2,
    },
  ];

  const faqs = [
    {
      q: isKa ? "როგორ დავამატო მცენარის განცხადება?" : "How do I list a plant?",
      a: isKa
        ? "განცხადების დასამატებლად გაიარეთ ავტორიზაცია და დააჭირეთ „+ დამატება“ ღილაკს. ატვირთეთ ფოტოები, მიუთითეთ ფასი, მდებარეობა და მიწოდების მეთოდები."
        : "Sign in and click '+ Post Listing'. Upload photos, set your price, location, and preferred delivery terms.",
    },
    {
      q: isKa ? "რა ღირს Plant-ზე განცხადების განთავსება?" : "How much does it cost to list?",
      a: isKa
        ? "ძირითადი განცხადებების განთავსება სრულიად უფასოა. აქტიური გამყიდველებისა და მაღაზიებისთვის გვაქვს სპეციალური Pro და Shop ტარიფები გაფართოებული შესაძლებლობებით."
        : "Standard listings are free. For high-volume sellers and verified stores, we offer Pro and Shop subscription packages.",
    },
    {
      q: isKa ? "როგორ მუშაობს მცენარეების გაცვლა (ISO Swap)?" : "How does the plant swap work?",
      a: isKa
        ? "ISO განყოფილებაში შეგიძლიათ განათავსოთ მცენარე, რომელსაც ეძებთ, და მიუთითოთ რა მცენარეში ან აქსესუარში გსურთ მისი გაცვლა."
        : "In the ISO section, you can post the plant you are searching for and define what you want to trade for it.",
    },
    {
      q: isKa ? "როგორ ხდება ანგარიშსწორება და მიწოდება?" : "How do delivery and payments work?",
      a: isKa
        ? "გამყიდველსა და მყიდველს შორის ანგარიშსწორება ხდება უშუალოდ (ადგილზე გატანით, საკურიერო მიწოდებით ან რეგიონული სამარშრუტო გზავნილით)."
        : "Buyers and sellers arrange delivery and settlement directly via pickup, courier, or regional transport.",
    },
  ];

  return (
    <div className="min-h-screen bg-background py-6 sm:py-10 lg:py-14">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        
        {/* Page Header */}
        <div className="max-w-3xl mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-foreground text-xs font-bold mb-3 border border-border/60">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>{isKa ? "კონტაქტი & მხარდაჭერა" : "Contact & Support"}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
            {isKa ? "დაგვიკავშირდით" : "Get in Touch"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
            {isKa
              ? "გაქვთ შეკითხვა, იდეა ან გსურთ თანამშრომლობა? გამოგვიგზავნეთ შეტყობინება და ჩვენი გუნდი მალე გიპასუხებთ."
              : "Have a question, feedback, or a business proposal? Fill out the form and our team will get back to you shortly."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          
          {/* Main Form (7 cols on desktop) */}
          <div className="lg:col-span-7 rounded-[22px] border border-border/80 bg-card p-5 sm:p-7 shadow-xs">
            {submitted ? (
              <div className="py-12 sm:py-16 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-foreground">
                  {isKa ? "შეტყობინება წარმატებით გაიგზავნა" : "Message Sent Successfully"}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  {isKa
                    ? "გმადლობთ უკუკავშირისთვის. ჩვენი გუნდი უმოკლეს ვადაში განიხილავს თქვენს წერილს."
                    : "Thank you for reaching out. We will review your message and reply as soon as possible."}
                </p>
                <div className="pt-2">
                  <Button
                    onClick={() => {
                      setSubmitted(false);
                      setMessage("");
                      setSubject("");
                    }}
                    className="rounded-[12px] bg-primary hover:bg-primary-container text-white text-xs font-bold px-6 h-10 shadow-xs transition-all cursor-pointer"
                  >
                    {isKa ? "ახალი შეტყობინების გაგზავნა" : "Send Another Message"}
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* 1. Category Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground block">
                    {isKa ? "შეტყობინების კატეგორია" : "Topic"}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                    {categories.map(({ id, title, subtitle, icon: Icon }) => {
                      const active = inquiryType === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setInquiryType(id)}
                          className={`p-3 rounded-[14px] text-left border transition-all cursor-pointer flex flex-col gap-1 ${
                            active
                              ? "border-primary bg-primary/5 ring-1 ring-primary shadow-2xs"
                              : "border-border/80 bg-background hover:bg-surface-container"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                            <span className={`text-xs font-bold ${active ? "text-foreground" : "text-foreground/90"}`}>
                              {title}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground hidden sm:block">
                            {subtitle}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">
                      {isKa ? "სახელი და გვარი *" : "Full Name *"}
                    </label>
                    <Input
                      type="text"
                      required
                      placeholder={isKa ? "გიორგი ბერიძე" : "John Doe"}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-[12px] border-border/80 h-10 text-xs sm:text-sm bg-background font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">
                      {isKa ? "ელ-ფოსტა *" : "Email Address *"}
                    </label>
                    <Input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-[12px] border-border/80 h-10 text-xs sm:text-sm bg-background font-medium"
                    />
                  </div>
                </div>

                {/* 3. Phone & Subject */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">
                      {isKa ? "ტელეფონის ნომერი" : "Phone Number"} <span className="text-muted-foreground font-normal">({isKa ? "არასავალდებულო" : "Optional"})</span>
                    </label>
                    <Input
                      type="tel"
                      placeholder="+995 5XX XX XX XX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="rounded-[12px] border-border/80 h-10 text-xs sm:text-sm bg-background font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">
                      {isKa ? "თემა" : "Subject"}
                    </label>
                    <Input
                      type="text"
                      placeholder={isKa ? "მოკლე სათაური..." : "Brief subject..."}
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="rounded-[12px] border-border/80 h-10 text-xs sm:text-sm bg-background font-medium"
                    />
                  </div>
                </div>

                {/* 4. Message Textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground block">
                      {isKa ? "შეტყობინება *" : "Message *"}
                    </label>
                    <span className="text-[10px] text-muted-foreground">
                      {message.length} / 2000
                    </span>
                  </div>
                  <textarea
                    required
                    rows={5}
                    maxLength={2000}
                    placeholder={
                      isKa
                        ? "აღწერეთ თქვენი შეკითხვა, იდეა ან წინადადება დეტალურად..."
                        : "Describe your question, feedback, or inquiry in detail..."
                    }
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded-[14px] border border-border/80 p-3 text-xs sm:text-sm text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y min-h-[120px]"
                  />
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-3 rounded-[12px] bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-[14px] bg-primary hover:bg-primary-container text-white text-xs sm:text-sm font-bold h-11 shadow-ambient transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isKa ? "იგზავნება..." : "Sending..."}</span>
                    </>
                  ) : (
                    <>
                      <SendHorizontal className="w-4 h-4" />
                      <span>{isKa ? "შეტყობინების გაგზავნა" : "Send Message"}</span>
                    </>
                  )}
                </Button>

              </form>
            )}
          </div>

          {/* Right Column: Contact Channels & FAQs (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Contact Information Card */}
            <div className="p-5 sm:p-6 rounded-[22px] border border-border/80 bg-card shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {isKa ? "საკონტაქტო არხები" : "Contact Channels"}
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-3 p-3 rounded-[12px] bg-surface-container/60 border border-border/60">
                  <div className="h-8 w-8 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground font-semibold">{isKa ? "ელ-ფოსტა" : "Email"}</p>
                    <a
                      href="mailto:support@plantsale.ge"
                      className="font-bold text-foreground hover:text-primary transition-colors truncate block"
                    >
                      support@plantsale.ge
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-[12px] bg-surface-container/60 border border-border/60">
                  <div className="h-8 w-8 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground font-semibold">Telegram Community</p>
                    <span className="font-bold text-foreground">
                      @PlantGeorgia
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-[12px] bg-surface-container/60 border border-border/60">
                  <div className="h-8 w-8 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground font-semibold">{isKa ? "სამუშაო საათები" : "Operating Hours"}</p>
                    <p className="font-bold text-foreground">10:00 - 20:00 (ორშ - კვ)</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-[12px] bg-surface-container/60 border border-border/60">
                  <div className="h-8 w-8 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground font-semibold">{isKa ? "მდებარეობა" : "Location"}</p>
                    <p className="font-bold text-foreground">{isKa ? "თბილისი, საქართველო" : "Tbilisi, Georgia"}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{isKa ? "საშუალო პასუხის დრო: 2-4 საათი" : "Average response time: 2-4 hours"}</span>
              </div>
            </div>

            {/* FAQs Accordion */}
            <div className="p-5 sm:p-6 rounded-[22px] border border-border/80 bg-card shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-primary" />
                <span>{isKa ? "ხშირად დასმული კითხვები" : "Frequently Asked Questions"}</span>
              </h3>

              <div className="space-y-2">
                {faqs.map((faq, index) => {
                  const isOpen = openFaq === index;
                  return (
                    <div
                      key={index}
                      className="rounded-[12px] border border-border/70 overflow-hidden bg-surface-container/30 transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : index)}
                        className="w-full flex items-center justify-between p-3 text-left text-xs font-bold text-foreground hover:bg-surface-container transition-colors cursor-pointer"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 shrink-0 ml-2 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-3 pb-3 pt-1 text-[11px] text-muted-foreground leading-relaxed border-t border-border/40 bg-card">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
