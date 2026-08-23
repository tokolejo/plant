"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import {
  Mail,
  CheckCircle2,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  AlertCircle,
  HelpCircle,
  Building2,
  Lightbulb,
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

  const categories: { id: InquiryType; label: string; icon: any }[] = [
    { id: "general", label: isKa ? "ზოგადი" : "General", icon: MessageSquare },
    { id: "suggestion", label: isKa ? "იდეა & წინადადება" : "Suggestion", icon: Lightbulb },
    { id: "bug", label: isKa ? "ხარვეზი" : "Bug", icon: AlertCircle },
    { id: "partnership", label: isKa ? "პარტნიორობა / B2B" : "Partnership", icon: Building2 },
  ];

  return (
    <div className="bg-background py-4 sm:py-6 lg:py-8">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl space-y-4">
        
        {/* Compact Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <span>{isKa ? "კონტაქტი & უკუკავშირი" : "Contact & Feedback"}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isKa
                ? "დაგვიკავშირდით ნებისმიერი შეკითხვის, იდეის ან თანამშრომლობისთვის."
                : "Reach out for inquiries, feedback, feature suggestions, or B2B collaboration."}
            </p>
          </div>

          <Link
            href="/faq"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline self-start sm:self-auto bg-primary/5 px-3 py-1.5 rounded-[10px] border border-primary/20"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{isKa ? "კითხვები & ინსტრუქციები →" : "FAQ & Guide →"}</span>
          </Link>
        </div>

        {/* Compact Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
          
          {/* Main Form (8 cols on desktop) */}
          <div className="lg:col-span-8 rounded-[20px] border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
            {submitted ? (
              <div className="py-8 sm:py-12 text-center space-y-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-foreground">
                  {isKa ? "შეტყობინება წარმატებით გაიგზავნა" : "Message Sent Successfully"}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  {isKa
                    ? "გმადლობთ უკუკავშირისთვის. ჩვენი გუნდი მალე განიხილავს თქვენს წერილს."
                    : "Thank you. Our team will review your inquiry and reply as soon as possible."}
                </p>
                <div className="pt-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSubmitted(false);
                      setMessage("");
                      setSubject("");
                    }}
                    className="rounded-[10px] bg-primary hover:bg-primary-container text-white text-xs font-bold px-4 h-9 shadow-xs cursor-pointer"
                  >
                    {isKa ? "ახალი შეტყობინება" : "Send Another"}
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                
                {/* 1. Category Selector (Compact Inline Pills) */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-foreground block">
                    {isKa ? "კატეგორია" : "Topic"}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {categories.map(({ id, label, icon: Icon }) => {
                      const active = inquiryType === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setInquiryType(id)}
                          className={`px-2.5 py-2 rounded-[10px] text-left border transition-all cursor-pointer flex items-center gap-1.5 ${
                            active
                              ? "border-primary bg-primary/5 text-primary font-bold shadow-2xs"
                              : "border-border/80 bg-background text-muted-foreground hover:text-foreground hover:bg-surface-container"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-xs truncate">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground block">
                      {isKa ? "სახელი და გვარი *" : "Full Name *"}
                    </label>
                    <Input
                      type="text"
                      required
                      placeholder={isKa ? "გიორგი ბერიძე" : "John Doe"}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-[10px] border-border/80 h-9 text-xs bg-background font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground block">
                      {isKa ? "ელ-ფოსტა *" : "Email Address *"}
                    </label>
                    <Input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-[10px] border-border/80 h-9 text-xs bg-background font-medium"
                    />
                  </div>
                </div>

                {/* 3. Phone & Subject */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground block">
                      {isKa ? "ტელეფონი" : "Phone"} <span className="text-muted-foreground font-normal">({isKa ? "არასავალდებულო" : "Optional"})</span>
                    </label>
                    <Input
                      type="tel"
                      placeholder="+995 5XX XX XX XX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="rounded-[10px] border-border/80 h-9 text-xs bg-background font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground block">
                      {isKa ? "თემა" : "Subject"}
                    </label>
                    <Input
                      type="text"
                      placeholder={isKa ? "მოკლე სათაური..." : "Subject..."}
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="rounded-[10px] border-border/80 h-9 text-xs bg-background font-medium"
                    />
                  </div>
                </div>

                {/* 4. Message Textarea (Compact 3 rows) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-foreground block">
                      {isKa ? "შეტყობინება *" : "Message *"}
                    </label>
                    <span className="text-[10px] text-muted-foreground">
                      {message.length} / 2000
                    </span>
                  </div>
                  <textarea
                    required
                    rows={3}
                    maxLength={2000}
                    placeholder={
                      isKa
                        ? "აღწერეთ თქვენი შეკითხვა, იდეა ან წინადადება..."
                        : "Describe your question or feedback..."
                    }
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded-[10px] border border-border/80 p-2.5 text-xs text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-y min-h-[85px]"
                  />
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-2.5 rounded-[10px] bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-[10px] bg-primary hover:bg-primary-container text-white text-xs font-bold h-9 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{isKa ? "იგზავნება..." : "Sending..."}</span>
                    </>
                  ) : (
                    <>
                      <SendHorizontal className="w-3.5 h-3.5" />
                      <span>{isKa ? "შეტყობინების გაგზავნა" : "Send Message"}</span>
                    </>
                  )}
                </Button>

              </form>
            )}
          </div>

          {/* Right Column: Direct Contact Info (4 cols on desktop) */}
          <div className="lg:col-span-4 rounded-[20px] border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {isKa ? "საკონტაქტო არხები" : "Contact Channels"}
            </h3>

            <div className="space-y-2 text-xs">
              <a
                href="mailto:support@plantsale.ge"
                className="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-surface-container/50 border border-border/60 hover:bg-primary/5 hover:border-primary/30 transition-colors block"
              >
                <div className="h-7 w-7 rounded-[8px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground font-semibold">{isKa ? "ელ-ფოსტა" : "Email"}</p>
                  <p className="font-bold text-foreground truncate">support@plantsale.ge</p>
                </div>
              </a>

              <div className="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-surface-container/50 border border-border/60">
                <div className="h-7 w-7 rounded-[8px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground font-semibold">Telegram Community</p>
                  <p className="font-bold text-foreground">@PlantGeorgia</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-surface-container/50 border border-border/60">
                <div className="h-7 w-7 rounded-[8px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground font-semibold">{isKa ? "სამუშაო საათები" : "Hours"}</p>
                  <p className="font-bold text-foreground">10:00 - 20:00 (ორშ - კვ)</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-surface-container/50 border border-border/60">
                <div className="h-7 w-7 rounded-[8px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground font-semibold">{isKa ? "მდებარეობა" : "Location"}</p>
                  <p className="font-bold text-foreground">{isKa ? "თბილისი, საქართველო" : "Tbilisi, Georgia"}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-border/50 text-[10px] text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{isKa ? "საშუალო პასუხის დრო: 2-4 საათი" : "Avg. response: 2-4 hours"}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
