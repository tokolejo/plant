"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  HelpCircle,
  Bug,
  Lightbulb,
  Handshake,
  ChevronDown,
  Loader2,
  ShieldAlert,
  Sprout
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FeedbackType = "general" | "suggestion" | "bug" | "partnership";

export default function ContactPage() {
  const locale = useLocale();
  const isKa = locale !== "en";

  const [feedbackType, setFeedbackType] = React.useState<FeedbackType>("general");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [rating, setRating] = React.useState<number | null>(5);

  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = React.useState<number | null>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !email.trim()) {
      setErrorMsg(
        isKa
          ? "გთხოვთ შეავსოთ ელ-ფოსტა და შეტყობინების ველი."
          : "Please fill in your email and message."
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
          type: feedbackType,
          name,
          email,
          phone,
          subject,
          message,
          rating,
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

  const typeOptions: { id: FeedbackType; label: string; icon: any; color: string }[] = [
    {
      id: "general",
      label: isKa ? "💬 ზოგადი კითხვა" : "💬 General Question",
      icon: MessageSquare,
      color: "border-emerald-500 bg-emerald-50 text-emerald-900",
    },
    {
      id: "suggestion",
      label: isKa ? "💡 იდეა & შემოთავაზება" : "💡 Idea & Suggestion",
      icon: Lightbulb,
      color: "border-amber-500 bg-amber-50 text-amber-900",
    },
    {
      id: "bug",
      label: isKa ? "🐞 ხარვეზის რეპორტი" : "🐞 Bug Report",
      icon: Bug,
      color: "border-rose-500 bg-rose-50 text-rose-900",
    },
    {
      id: "partnership",
      label: isKa ? "🤝 პარტნიორობა / მაღაზია" : "🤝 Partnership / B2B",
      icon: Handshake,
      color: "border-teal-500 bg-teal-50 text-teal-900",
    },
  ];

  const ratingOptions = [
    { value: 5, emoji: "😍", label: isKa ? "საუკეთესო" : "Great" },
    { value: 4, emoji: "😃", label: isKa ? "კარგი" : "Good" },
    { value: 3, emoji: "🙂", label: isKa ? "ნორმალური" : "Okay" },
    { value: 2, emoji: "😐", label: isKa ? "საშუალო" : "Mediocre" },
    { value: 1, emoji: "🙁", label: isKa ? "ცუდი" : "Poor" },
  ];

  const faqs = [
    {
      q: isKa
        ? "როგორ დავამატო მცენარის განცხადება?"
        : "How do I post a plant listing?",
      a: isKa
        ? "განცხადების დასამატებლად გაიარეთ მარტივი ავტორიზაცია და დააჭირეთ „+ დამატება“ ღილაკს. ატვირთეთ ფოტოები, მიუთითეთ ფასი, მდებარეობა და მიწოდების პირობები."
        : "Sign in and click the '+ Add Listing' button. Upload photos, set your price, location, and preferred delivery methods.",
    },
    {
      q: isKa
        ? "რა ღირს Plant-ზე განცხადების განთავსება?"
        : "How much does it cost to list on Plant?",
      a: isKa
        ? "ძირითადი განცხადებების განთავსება უფასოა! პრემიუმ სელერებისთვის და მაღაზიებისთვის გვაქვს სპეციალური Pro და Shop ტარიფები გაფართოებული ფუნქციებით."
        : "Basic listings are completely free! For verified shops and power sellers, we offer Pro & Shop subscription tiers with advanced features.",
    },
    {
      q: isKa
        ? "როგორ მუშაობს მცენარეების გაცვლა (ISO Swap)?"
        : "How does the ISO Plant Swap work?",
      a: isKa
        ? "ISO (In Search Of) განყოფილებაში შეგიძლიათ გამოაქვეყნოთ თქვენთვის სასურველი იშვიათი მცენარე და მიუთითოთ რაში გაცვლით მას."
        : "In the ISO section, you can post the rare plant you are searching for and specify what you are willing to trade for it.",
    },
    {
      q: isKa
        ? "როგორ ხდება მიწოდება და ანგარიშსწორება?"
        : "How does delivery and payment work?",
      a: isKa
        ? "გამყიდველსა და მყიდველს შორის ანგარიშსწორება ხდება უშუალოდ (ადგილზე გატანით, კურიერით ან სამარშრუტო მიწოდებით)."
        : "Buyers and sellers arrange delivery and payment directly via pickup, local courier, or regional intercity transport.",
    },
  ];

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        
        {/* Header Title Section */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
            <Sprout className="w-3.5 h-3.5" />
            <span>{isKa ? "დაგვიკავშირდით & შეგვაფასეთ" : "Contact Us & Feedback"}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
            {isKa ? "ჩვენთვის მნიშვნელოვანია თქვენი აზრი" : "We Value Your Feedback"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {isKa
              ? "გაქვთ კითხვა, იდეა ან შეამჩნიეთ ხარვეზი? მოგვწერეთ და ჩვენი გუნდი უმოკლეს დროში გიპასუხებთ."
              : "Have a question, an idea, or noticed an issue? Send us a message and our team will get back to you promptly."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Feedback & Contact Form (7 Cols) */}
          <div className="lg:col-span-7 rounded-[24px] border border-border/80 bg-card p-5 sm:p-8 shadow-ambient">
            {submitted ? (
              <div className="py-12 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                  {isKa ? "მადლობა, შეტყობინება მიღებულია! 🌿" : "Thank you! Message Received! 🌿"}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                  {isKa
                    ? "თქვენი ფიდბექი წარმატებით გაიგზავნა. ჩვენი გუნდი მალე განიხილავს მას."
                    : "Your message has been sent successfully. Our team will review it shortly."}
                </p>
                <Button
                  onClick={() => {
                    setSubmitted(false);
                    setMessage("");
                    setSubject("");
                  }}
                  className="rounded-[14px] bg-primary hover:bg-primary-container text-white text-xs font-bold px-6 h-10 shadow-ambient transition-all cursor-pointer"
                >
                  {isKa ? "ახალი შეტყობინების გაგზავნა" : "Send Another Message"}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* 1. Category / Feedback Type */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground block">
                    {isKa ? "შეტყობინების ტიპი" : "Topic / Reason"}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {typeOptions.map(({ id, label, color }) => {
                      const active = feedbackType === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setFeedbackType(id)}
                          className={`p-2.5 rounded-[12px] text-xs font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                            active
                              ? `${color} ring-2 ring-primary/20 shadow-2xs`
                              : "border-border/70 bg-surface-cream/50 hover:bg-surface-container text-foreground"
                          }`}
                        >
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Rating Scale */}
                <div className="p-3.5 rounded-[16px] bg-surface-cream/70 border border-border/60 space-y-2">
                  <label className="text-xs font-bold text-foreground block">
                    {isKa ? "როგორ შეაფასებდით Plant-ის გამოცდილებას?" : "How would you rate your experience?"}
                  </label>
                  <div className="flex items-center justify-between gap-1 sm:gap-2">
                    {ratingOptions.map(({ value, emoji, label }) => {
                      const active = rating === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRating(value)}
                          className={`flex-1 flex flex-col items-center justify-center p-2 rounded-[12px] border transition-all cursor-pointer ${
                            active
                              ? "bg-card border-primary ring-2 ring-primary/20 scale-105 shadow-ambient"
                              : "border-transparent hover:bg-card/60 opacity-80 hover:opacity-100"
                          }`}
                        >
                          <span className="text-xl sm:text-2xl">{emoji}</span>
                          <span className="text-[9px] font-bold text-foreground mt-0.5">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">
                      {isKa ? "თქვენი სახელი" : "Your Name"}
                    </label>
                    <Input
                      type="text"
                      placeholder={isKa ? "მაგ: გიორგი ბერიძე" : "e.g. John Doe"}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-[12px] border-border/80 h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">
                      {isKa ? "ელ-ფოსტა *" : "Email Address *"}
                    </label>
                    <Input
                      type="email"
                      required
                      placeholder="example@mail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-[12px] border-border/80 h-10 text-xs"
                    />
                  </div>
                </div>

                {/* 4. Phone & Subject */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">
                      {isKa ? "ტელეფონი (არასავალდებულო)" : "Phone Number (Optional)"}
                    </label>
                    <Input
                      type="tel"
                      placeholder="+995 5XX XX XX XX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="rounded-[12px] border-border/80 h-10 text-xs"
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
                      className="rounded-[12px] border-border/80 h-10 text-xs"
                    />
                  </div>
                </div>

                {/* 5. Message */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    {isKa ? "თქვენი შეტყობინება / ფიდბექი *" : "Your Message / Feedback *"}
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder={
                      isKa
                        ? "დაწერეთ დეტალურად თქვენი კითხვა, იდეა ან რეკომენდაცია..."
                        : "Write your question, suggestion, or detailed feedback..."
                    }
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded-[14px] border border-border/80 p-3 text-xs text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y"
                  />
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-3 rounded-[12px] bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-[14px] bg-primary hover:bg-primary-container text-white text-xs font-bold h-11 shadow-ambient transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isKa ? "იგზავნება..." : "Sending..."}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{isKa ? "შეტყობინების გაგზავნა" : "Send Feedback"}</span>
                    </>
                  )}
                </Button>

              </form>
            )}
          </div>

          {/* Right Column: Contact Cards & FAQs (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Quick Contact Info Box */}
            <div className="p-6 rounded-[24px] border border-border/80 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 shadow-ambient space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>{isKa ? "საკონტაქტო არხები" : "Direct Contact Channels"}</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3 p-3 rounded-[14px] bg-card border border-border/60 shadow-2xs">
                  <div className="h-8 w-8 rounded-[10px] bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">{isKa ? "ელ-ფოსტა" : "Email"}</p>
                    <a href="mailto:support@plantsale.ge" className="font-bold text-foreground hover:text-primary transition-colors">
                      support@plantsale.ge
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-[14px] bg-card border border-border/60 shadow-2xs">
                  <div className="h-8 w-8 rounded-[10px] bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Telegram Community</p>
                    <span className="font-bold text-foreground">
                      @PlantGeorgia
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-[14px] bg-card border border-border/60 shadow-2xs">
                  <div className="h-8 w-8 rounded-[10px] bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">{isKa ? "სამუშაო დრო" : "Support Hours"}</p>
                    <p className="font-bold text-foreground">10:00 - 20:00 (Mon - Sun)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQs Accordion */}
            <div className="p-6 rounded-[24px] border border-border/80 bg-card shadow-ambient space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary" />
                <span>{isKa ? "ხშირად დასმული კითხვები" : "Frequently Asked Questions"}</span>
              </h3>

              <div className="space-y-2">
                {faqs.map((faq, index) => {
                  const isOpen = openFaq === index;
                  return (
                    <div
                      key={index}
                      className="rounded-[14px] border border-border/70 overflow-hidden bg-surface-cream/30 transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : index)}
                        className="w-full flex items-center justify-between p-3 text-left text-xs font-bold text-foreground hover:bg-surface-container transition-colors cursor-pointer"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 shrink-0 ml-2 ${isOpen ? "rotate-180" : ""}`} />
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
