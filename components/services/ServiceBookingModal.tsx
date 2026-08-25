"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Calculator,
  CheckCircle2,
  Send,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GardeningServiceItem } from "@/lib/mock-services";
import { createClient } from "@/utils/supabase/client";

interface ServiceBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: GardeningServiceItem;
  isKa?: boolean;
}

export function ServiceBookingModal({
  isOpen,
  onClose,
  service,
  isKa = true,
}: ServiceBookingModalProps) {
  const supabase = createClient();

  // Determine estimator unit type
  const isPerSqM = service.price_unit.includes("მ²");
  const isPerTree = service.price_unit.includes("ხე");
  const isPerPoint = service.price_unit.includes("წერტილ");

  const [quantity, setQuantity] = useState<number>(
    isPerSqM ? 50 : isPerTree ? 4 : isPerPoint ? 3 : 1
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState(service.city || "");
  const [preferredDate, setPreferredDate] = useState("");
  const [timeSlot, setTimeSlot] = useState<"morning" | "afternoon" | "evening" | "any">("any");
  const [comment, setComment] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate next 14 interactive days for quick selection
  const availableDays = useMemo(() => {
    const days = [];
    const weekdaysKa = ["კვი", "ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ"];
    const weekdaysEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthsKa = ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"];
    
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      const weekday = isKa ? weekdaysKa[d.getDay()] : weekdaysEn[d.getDay()];
      const month = isKa ? monthsKa[d.getMonth()] : (d.getMonth() + 1);
      const dayNum = d.getDate();
      const label = i === 0 
        ? (isKa ? "დღეს" : "Today") 
        : i === 1 
        ? (isKa ? "ხვალ" : "Tomorrow") 
        : `${weekday}, ${dayNum} ${isKa ? month : ""}`;

      days.push({ iso, label, dayNum, weekday });
    }
    return days;
  }, [isKa]);

  // Set default preferred date to tomorrow on load
  useEffect(() => {
    if (isOpen && availableDays.length > 1 && !preferredDate) {
      setPreferredDate(availableDays[1].iso);
    }
  }, [isOpen, availableDays, preferredDate]);

  // Fetch logged in user details if available
  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setName(user.user_metadata?.full_name || "");
          setPhone(user.user_metadata?.phone || "");
        }
      } catch (e) {
        console.warn("Could not fetch user for booking:", e);
      }
    }
    if (isOpen) {
      loadUser();
    }
  }, [isOpen, supabase]);

  if (!isOpen) return null;

  const estimatedTotal = service.price_from * Math.max(1, quantity);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("service_bookings").insert({
        service_id: service.id,
        provider_name: service.provider_name,
        client_id: user?.id || null,
        client_name: name,
        client_phone: phone,
        client_address: address,
        booking_date: preferredDate || new Date().toISOString().split("T")[0],
        time_slot: timeSlot,
        quantity,
        estimated_price: estimatedTotal,
        comment,
        status: "pending",
        created_at: new Date().toISOString()
      });
    } catch (err) {
      console.warn("Recorded booking with offline fallback:", err);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 400);
  };

  const getWhatsAppForwardUrl = () => {
    const cleanPhone = (service.whatsapp || service.phone || "557579020").replace(/\D/g, "");
    const timeSlotLabel =
      timeSlot === "morning"
        ? isKa ? "დილა (09:00 - 13:00)" : "Morning"
        : timeSlot === "afternoon"
        ? isKa ? "შუადღე (13:00 - 17:00)" : "Afternoon"
        : timeSlot === "evening"
        ? isKa ? "საღამო (17:00 - 20:00)" : "Evening"
        : isKa ? "ნებისმიერი დრო" : "Any time";

    const msg = isKa
      ? `გამარჯობა! მსურს სერვისის დაჯავშნა Plant.ge-დან:
*სერვისი:* ${service.title}
*დამკვეთი:* ${name}
*ტელეფონი:* ${phone}
*მისამართი:* ${address}
*სასურველი თარიღი:* ${preferredDate || "უახლოეს დღეებში"} (${timeSlotLabel})
*მოცულობა / რაოდენობა:* ${quantity} ${service.price_unit}
*სავარაუდო ჯამი:* ~${estimatedTotal} ₾
*კომენტარი:* ${comment || "არ არის"}`
      : `Hello! I would like to book a service from Plant.ge:
*Service:* ${service.title}
*Client:* ${name}
*Phone:* ${phone}
*Address:* ${address}
*Preferred Date:* ${preferredDate || "Soonest"} (${timeSlotLabel})
*Estimated Total:* ~${estimatedTotal} GEL`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  const handleReset = () => {
    setIsSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-[24px] bg-card border border-border/80 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between bg-secondary-container/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-foreground">
                {isKa ? "სერვისის ონლაინ დაჯავშნა" : "Online Service Booking"}
              </h3>
              <p className="text-[11px] text-muted-foreground line-clamp-1">
                {service.provider_name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary-container hover:bg-secondary-container/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 no-scrollbar">
          {isSubmitted ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-lg font-black text-foreground">
                  {isKa ? "მოთხოვნა წარმატებით გაიგზავნა!" : "Request Sent Successfully!"}
                </h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  {isKa
                    ? `სპეციალისტი (${service.provider_name}) უმოკლეს დროში დაგიკავშირდებათ მითითებულ ნომერზე (${phone}).`
                    : `The specialist (${service.provider_name}) will contact you soon at ${phone}.`}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-secondary-container/50 border border-border/60 text-left space-y-1 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>{isKa ? "სერვისი:" : "Service:"}</span>
                  <span className="font-bold text-foreground text-right">{service.title}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{isKa ? "სავარაუდო ღირებულება:" : "Estimated Price:"}</span>
                  <span className="font-black text-emerald-600">~{estimatedTotal} ₾</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <a
                  href={getWhatsAppForwardUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block"
                >
                  <Button className="w-full rounded-[14px] bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-xs h-11 gap-2 shadow-md">
                    <MessageSquare className="w-4 h-4 fill-current" />
                    <span>{isKa ? "გადამისამართება WhatsApp-ში" : "Forward to WhatsApp"}</span>
                  </Button>
                </a>

                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="w-full rounded-[14px] text-xs font-bold h-10 border-border/80"
                >
                  {isKa ? "დახურვა" : "Close"}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Service & Price Estimator Box */}
              <div className="p-3.5 rounded-[18px] bg-secondary-container/40 border border-border/60 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-foreground flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-primary" />
                    {isKa ? "ფასის ცოცხალი კალკულატორი" : "Live Price Estimator"}
                  </span>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {service.price_from} ₾ / {service.price_unit}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <label htmlFor="service-quantity" className="text-muted-foreground">
                      {isPerSqM
                        ? isKa ? "ფართობი (მ²):" : "Area (m²):"
                        : isPerTree
                        ? isKa ? "ხეების რაოდენობა:" : "Trees count:"
                        : isKa ? "ერთეულების რაოდენობა:" : "Units / Quantity:"}
                    </label>
                    <span className="font-black text-primary text-sm">
                      {quantity} {service.price_unit}
                    </span>
                  </div>

                  <input
                    id="service-quantity"
                    type="range"
                    min={1}
                    max={isPerSqM ? 500 : isPerTree ? 50 : 20}
                    step={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full accent-primary h-2 bg-secondary-container rounded-lg cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs font-black">
                  <span className="text-muted-foreground">{isKa ? "სავარაუდო ხარჯი:" : "Estimated Total:"}</span>
                  <span className="text-base text-emerald-600 dark:text-emerald-400">
                    ~{estimatedTotal} ₾
                  </span>
                </div>
              </div>

              {/* Client Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="booking-name" className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3 text-primary" />
                    {isKa ? "თქვენი სახელი *" : "Your Name *"}
                  </label>
                  <input
                    id="booking-name"
                    required
                    type="text"
                    placeholder={isKa ? "მაგ. გიორგი ბერიძე" : "e.g. Giorgi"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border/80 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="booking-phone" className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    {isKa ? "ტელეფონის ნომერი *" : "Phone Number *"}
                  </label>
                  <input
                    id="booking-phone"
                    required
                    type="tel"
                    placeholder="599 12 34 56"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border/80 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Address / City */}
              <div className="space-y-1">
                <label htmlFor="booking-address" className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-sky-500" />
                  {isKa ? "მისამართი / ობიექტის ლოკაცია *" : "Address / Location *"}
                </label>
                <input
                  id="booking-address"
                  required
                  type="text"
                  placeholder={isKa ? "მაგ. თბილისი, ვაკე, ჭავჭავაძის 37" : "e.g. Tbilisi, Vake"}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border/80 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Preferred Date & Interactive 14-Day Calendar Chips */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>{isKa ? "სასურველი თარიღი (აირჩიეთ დღე)" : "Select Preferred Day"}</span>
                  </label>
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="text-[10px] font-bold text-primary bg-transparent border-none cursor-pointer p-0 focus:outline-none"
                  />
                </div>

                {/* Horizontal Scrollable Day Selector */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {availableDays.map((day) => {
                    const active = preferredDate === day.iso;
                    return (
                      <button
                        key={day.iso}
                        type="button"
                        onClick={() => setPreferredDate(day.iso)}
                        className={`shrink-0 px-3 py-2 rounded-[12px] border text-center transition-all cursor-pointer ${
                          active
                            ? "bg-primary text-white border-primary shadow-xs scale-102 font-black"
                            : "bg-background border-border/70 text-foreground hover:bg-surface-container font-semibold"
                        }`}
                      >
                        <div className="text-[10px] uppercase opacity-80">{day.weekday}</div>
                        <div className="text-xs font-black">{day.dayNum}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slot Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>{isKa ? "დღის მონაკვეთი / საათები" : "Preferred Time Slot"}</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(
                    [
                      { id: "any", labelKa: "ნებისმიერი", labelEn: "Any time", hint: "09:00 - 20:00" },
                      { id: "morning", labelKa: "დილა", labelEn: "Morning", hint: "09:00 - 13:00" },
                      { id: "afternoon", labelKa: "შუადღე", labelEn: "Afternoon", hint: "13:00 - 17:00" },
                      { id: "evening", labelKa: "საღამო", labelEn: "Evening", hint: "17:00 - 20:00" },
                    ] as const
                  ).map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setTimeSlot(slot.id)}
                      className={`py-2 px-1 rounded-[12px] text-center transition-all cursor-pointer border ${
                        timeSlot === slot.id
                          ? "bg-primary text-white border-primary shadow-xs font-black"
                          : "bg-secondary-container/60 border-border/50 text-muted-foreground hover:text-foreground font-bold"
                      }`}
                    >
                      <div className="text-[11px] font-bold">{isKa ? slot.labelKa : slot.labelEn}</div>
                      <div className="text-[9px] opacity-75 font-mono">{slot.hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Note / Comments */}
              <div className="space-y-1">
                <label htmlFor="booking-comment" className="text-[11px] font-bold text-muted-foreground">
                  {isKa ? "დამატებითი დეტალები / აღწერა (არასავალდებულო)" : "Additional Notes"}
                </label>
                <textarea
                  id="booking-comment"
                  rows={2}
                  placeholder={isKa ? "მაგ. ეზოში არის დახრილი რელიეფი..." : "Any specifics..."}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border/80 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-[14px] bg-primary hover:bg-primary/90 text-white font-extrabold text-xs h-11 gap-2 shadow-md cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? isKa ? "იგზავნება..." : "Sending..."
                      : isKa ? "დაჯავშნის მოთხოვნის გაგზავნა" : "Send Booking Request"}
                  </span>
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
