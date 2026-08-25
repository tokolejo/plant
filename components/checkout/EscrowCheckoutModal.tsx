"use client";

import * as React from "react";
import Image from "next/image";
import {
  X,
  CreditCard,
  ShieldCheck,
  Truck,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  Sparkles,
  Info,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

interface EscrowCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: {
    id: string;
    title: string;
    price: number;
    images?: string[];
    city?: string;
    sellerId?: string;
    deliveryMethods?: string[];
    itemType?: string;
  };
  isKa?: boolean;
}

export function EscrowCheckoutModal({
  isOpen,
  onClose,
  listing,
  isKa = true,
}: EscrowCheckoutModalProps) {
  const supabase = createClient();

  // Form States
  const [step, setStep] = React.useState<"details" | "payment" | "processing" | "success">("details");
  const [deliveryMethod, setDeliveryMethod] = React.useState<string>(
    listing.deliveryMethods?.[0] || "COURIER"
  );
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [city, setCity] = React.useState(listing.city || "თბილისი");
  const [address, setAddress] = React.useState("");
  const [comment, setComment] = React.useState("");

  // Payment form states (Mock TBC / BOG)
  const [cardNumber, setCardNumber] = React.useState("");
  const [cardExpiry, setCardExpiry] = React.useState("");
  const [cardCvv, setCardCvv] = React.useState("");
  const [cardName, setCardName] = React.useState("");
  const [selectedBank, setSelectedBank] = React.useState<"tbc" | "bog">("tbc");

  const [orderId, setOrderId] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string>("");

  // Auto-fill user profile if logged in
  React.useEffect(() => {
    async function fetchUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setName(user.user_metadata?.full_name || "");
          setPhone(user.user_metadata?.phone || "");
        }
      } catch (e) {
        console.warn("Could not fetch auth user for checkout:", e);
      }
    }
    if (isOpen) {
      fetchUser();
      setStep("details");
      setErrorMessage("");
    }
  }, [isOpen, supabase]);

  if (!isOpen) return null;

  const deliveryFee = deliveryMethod === "COURIER" ? 7 : deliveryMethod === "MARSHRUTKA" ? 10 : 0;
  const grandTotal = listing.price + deliveryFee;

  const handleFillTestCard = () => {
    setCardNumber("4127 8900 1234 5678");
    setCardExpiry("12/28");
    setCardCvv("789");
    setCardName(name || "GIORGI BERIDZE");
  };

  const handleGoToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || (!address.trim() && deliveryMethod !== "PICKUP")) {
      setErrorMessage(isKa ? "გთხოვთ შეავსოთ ყველა აუცილებელი ველი" : "Please fill in all required fields");
      return;
    }
    setErrorMessage("");
    setStep("payment");
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.replace(/\s/g, "").length < 16) {
      setErrorMessage(isKa ? "გთხოვთ მიუთითოთ ვალიდური 16-ნიშნა ბარათის ნომერი" : "Please enter a valid 16-digit card number");
      return;
    }

    setStep("processing");
    setLoading(true);

    try {
      const generatedOrderId = `PLANT-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      setOrderId(generatedOrderId);

      // Simulate 3D Secure / Payment Gateway roundtrip delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Attempt to save order to Supabase orders table (or fallback gracefully)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from("orders").insert({
          id: generatedOrderId,
          listing_id: listing.id,
          buyer_id: user?.id || null,
          seller_id: listing.sellerId || null,
          total_price: grandTotal,
          delivery_method: deliveryMethod,
          delivery_address: address,
          contact_phone: phone,
          contact_name: name,
          status: "escrow_held",
          payment_provider: selectedBank,
          created_at: new Date().toISOString()
        });
      } catch (dbErr) {
        console.warn("Orders table insert fallback:", dbErr);
      }

      setStep("success");
    } catch (err: any) {
      setErrorMessage(isKa ? "გადახდის შეცდომა. გთხოვთ სცადოთ ხელახლა." : "Payment failed. Please try again.");
      setStep("payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-[28px] border border-border/80 bg-card p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4.5 top-4.5 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-container transition-all cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ─── STEP 1: DETAILS & DELIVERY ─── */}
        {step === "details" && (
          <form onSubmit={handleGoToPayment} className="space-y-5">
            <div>
              <div className="flex items-center gap-2 text-primary font-extrabold text-xs mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{isKa ? "უსაფრთხო ყიდვა & Escrow გარანტია" : "Secure Purchase & Escrow"}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                {isKa ? "შეკვეთის გაფორმება" : "Order Checkout"}
              </h2>
            </div>

            {/* Item Card Preview */}
            <div className="flex items-center gap-3.5 p-3 rounded-[16px] bg-secondary-container/50 border border-border/60">
              <div className="relative w-16 h-16 rounded-[12px] overflow-hidden bg-muted shrink-0">
                {listing.images?.[0] ? (
                  <Image src={listing.images[0]} alt={listing.title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                    Plant
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-foreground truncate">{listing.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {isKa ? "ფასი:" : "Price:"} <span className="font-bold text-foreground">{formatPrice(listing.price)}</span>
                </p>
                <div className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{isKa ? "დაცულია გარანტიით" : "Protected by Escrow"}</span>
                </div>
              </div>
            </div>

            {/* Delivery Method Selection */}
            <div className="space-y-2">
              <label className="text-xs font-black text-foreground uppercase tracking-wider block">
                {isKa ? "მიწოდების მეთოდი" : "Delivery Method"}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "COURIER", label: isKa ? "კურიერი" : "Courier", fee: 7, icon: Truck },
                  { id: "MARSHRUTKA", label: isKa ? "სამარშრუტო" : "Intercity", fee: 10, icon: Truck },
                  { id: "PICKUP", label: isKa ? "ადგილიდან" : "Pickup", fee: 0, icon: MapPin },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = deliveryMethod === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDeliveryMethod(item.id)}
                      className={`p-2.5 rounded-[14px] border text-center transition-all cursor-pointer ${
                        active
                          ? "bg-primary/10 border-primary text-primary font-black shadow-xs scale-102"
                          : "bg-card border-border/70 text-foreground hover:bg-surface-container"
                      }`}
                    >
                      <Icon className="w-4 h-4 mx-auto mb-1 opacity-80" />
                      <div className="text-xs font-bold truncate">{item.label}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {item.fee === 0 ? (isKa ? "უფასო" : "Free") : `+${item.fee} ₾`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recipient Details */}
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{isKa ? "მიმღების სახელი" : "Full Name"} *</span>
                  </label>
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isKa ? "მაგ. გიორგი ბერიძე" : "e.g. John Doe"}
                    className="rounded-[12px] h-10 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{isKa ? "ტელეფონი" : "Phone"} *</span>
                  </label>
                  <Input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="5XX XX XX XX"
                    className="rounded-[12px] h-10 text-xs font-mono"
                  />
                </div>
              </div>

              {deliveryMethod !== "PICKUP" && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{isKa ? "მიწოდების მისამართი (ქალაქი, ქუჩა, ბინა)" : "Delivery Address"} *</span>
                  </label>
                  <Input
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={isKa ? "მაგ. თბილისი, ჭავჭავაძის გამზ. 25, ბინა 14" : "City, Street, Apartment"}
                    className="rounded-[12px] h-10 text-xs"
                  />
                </div>
              )}
            </div>

            {/* Escrow Guarantee Notice */}
            <div className="p-3.5 rounded-[16px] bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-foreground leading-relaxed">
                <span className="font-black text-emerald-800 dark:text-emerald-300 block mb-0.5">
                  {isKa ? "როგორ მუშაობს Escrow გარანტია?" : "How Escrow Protection Works"}
                </span>
                {isKa
                  ? "თანხა რჩება დაცულ ანგარიშზე. გამყიდველს თანხა გადაერიცხება მხოლოდ მას შემდეგ, რაც მცენარეს ჩაიბარებთ და დაადასტურებთ მის სიჯანსაღეს."
                  : "Your payment is held safely by Plant.ge. The seller receives the funds only after you receive the plant and confirm its healthy condition."}
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-2.5 rounded-[12px] bg-destructive/15 text-destructive text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Footer Summary & Submit */}
            <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-4">
              <div>
                <span className="text-[11px] text-muted-foreground font-bold block">
                  {isKa ? "სულ გადასახდელი:" : "Total Amount:"}
                </span>
                <span className="text-xl font-black text-primary">
                  {formatPrice(grandTotal)}
                </span>
              </div>

              <Button
                type="submit"
                className="h-11 px-6 rounded-[14px] bg-primary hover:bg-primary/90 text-white font-black text-xs gap-2 shadow-ambient cursor-pointer"
              >
                <span>{isKa ? "გადახდაზე გადასვლა" : "Continue to Payment"}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>
        )}

        {/* ─── STEP 2: PAYMENT METHOD (TBC / BOG GATEWAY SIMULATION) ─── */}
        {step === "payment" && (
          <form onSubmit={handleProcessPayment} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>256-Bit SSL Encrypted</span>
                </div>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                  {isKa ? "სატესტო რეჟიმი" : "Test Sandbox"}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                {isKa ? "საბანკო ბარათით გადახდა" : "Bank Card Payment"}
              </h2>
            </div>

            {/* Bank Switcher */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedBank("tbc")}
                className={`p-3 rounded-[14px] border text-left transition-all cursor-pointer flex items-center justify-between ${
                  selectedBank === "tbc"
                    ? "bg-blue-500/10 border-blue-500/50 text-blue-900 dark:text-blue-200 font-bold shadow-xs"
                    : "bg-card border-border/70 text-foreground hover:bg-surface-container"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-[10px]">
                    TBC
                  </div>
                  <span className="text-xs font-bold">TBC Bank e-Commerce</span>
                </div>
                {selectedBank === "tbc" && <Check className="w-4 h-4 text-blue-600" />}
              </button>

              <button
                type="button"
                onClick={() => setSelectedBank("bog")}
                className={`p-3 rounded-[14px] border text-left transition-all cursor-pointer flex items-center justify-between ${
                  selectedBank === "bog"
                    ? "bg-orange-500/10 border-orange-500/50 text-orange-900 dark:text-orange-200 font-bold shadow-xs"
                    : "bg-card border-border/70 text-foreground hover:bg-surface-container"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#FA6400] text-white flex items-center justify-center font-black text-[10px]">
                    BOG
                  </div>
                  <span className="text-xs font-bold">Bank of Georgia (BOG)</span>
                </div>
                {selectedBank === "bog" && <Check className="w-4 h-4 text-orange-600" />}
              </button>
            </div>

            {/* Quick-Fill Demo Button */}
            <button
              type="button"
              onClick={handleFillTestCard}
              className="w-full py-1.5 px-3 rounded-[10px] bg-secondary-container/80 hover:bg-secondary text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-border/50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isKa ? "სატესტო ბარათის მონაცემების შევსება (1-Click)" : "Auto-fill Test Card"}</span>
            </button>

            {/* Card Inputs */}
            <div className="space-y-3 p-4 rounded-[18px] bg-secondary-container/30 border border-border/70">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">
                  {isKa ? "ბარათის ნომერი" : "Card Number"}
                </label>
                <div className="relative">
                  <Input
                    required
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim();
                      setCardNumber(v);
                    }}
                    placeholder="4127 8900 1234 5678"
                    className="rounded-[12px] h-10 text-xs font-mono pl-9"
                  />
                  <CreditCard className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    {isKa ? "ვადა (MM/YY)" : "Expires"}
                  </label>
                  <Input
                    required
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="12/28"
                    className="rounded-[12px] h-10 text-xs font-mono text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    CVC / CVV
                  </label>
                  <Input
                    required
                    maxLength={3}
                    type="password"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    placeholder="•••"
                    className="rounded-[12px] h-10 text-xs font-mono text-center"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">
                  {isKa ? "ბარათის მფლობელი" : "Cardholder Name"}
                </label>
                <Input
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  placeholder="GIORGI BERIDZE"
                  className="rounded-[12px] h-10 text-xs uppercase"
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-2.5 rounded-[12px] bg-destructive/15 text-destructive text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("details")}
                className="h-11 px-4 rounded-[14px] text-xs font-bold cursor-pointer"
              >
                {isKa ? "უკან" : "Back"}
              </Button>

              <Button
                type="submit"
                className="flex-1 h-11 rounded-[14px] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs gap-2 shadow-emerald-600/20 shadow-xs cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>{isKa ? `გადახდა: ${formatPrice(grandTotal)}` : `Pay ${formatPrice(grandTotal)}`}</span>
              </Button>
            </div>
          </form>
        )}

        {/* ─── STEP 3: PROCESSING SIMULATION ─── */}
        {step === "processing" && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
            <h3 className="text-lg font-black text-foreground">
              {isKa ? "მიმდინარეობს გადახდის ვერიფიკაცია..." : "Verifying Payment with 3D Secure..."}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {isKa
                ? "გთხოვთ დაელოდოთ. თანხა უსაფრთხოდ იყინება Plant.ge Escrow ანგარიშზე."
                : "Please wait. Funds are being securely held in the Plant.ge Escrow account."}
            </p>
          </div>
        )}

        {/* ─── STEP 4: SUCCESS & ESCROW CONFIRMATION ─── */}
        {step === "success" && (
          <div className="py-6 text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider block">
                {isKa ? "გადახდა წარმატებულია (სატესტო)" : "Payment Successful (Sandbox)"}
              </span>
              <h2 className="text-2xl font-black text-foreground tracking-tight">
                {isKa ? "შეკვეთა მიღებულია!" : "Order Placed Successfully!"}
              </h2>
              <p className="text-xs text-muted-foreground font-mono">
                {isKa ? "შეკვეთის ID:" : "Order ID:"} {orderId}
              </p>
            </div>

            <div className="p-4 rounded-[18px] bg-secondary-container/40 border border-border/70 text-left space-y-2 text-xs">
              <div className="flex justify-between font-bold">
                <span className="text-muted-foreground">{isKa ? "პროდუქტი:" : "Product:"}</span>
                <span className="text-foreground">{listing.title}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-muted-foreground">{isKa ? "თანხა (Escrow-ში):" : "Escrow Amount:"}</span>
                <span className="text-primary font-black">{formatPrice(grandTotal)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-muted-foreground">{isKa ? "მიწოდების სტატუსი:" : "Delivery:"}</span>
                <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                  {isKa ? "მზადდება გასაგზავნად" : "Preparing Shipment"}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-[16px] bg-emerald-500/10 border border-emerald-500/30 text-left text-xs text-foreground space-y-1">
              <span className="font-black text-emerald-800 dark:text-emerald-300 block">
                {isKa ? "შემდეგი ნაბიჯი:" : "Next Steps:"}
              </span>
              <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                {isKa
                  ? "როდესაც მცენარეს ჩაიბარებთ და დარწმუნდებით მის უვნებლობაში, პროფილში შეძლებთ „ჩაბარების დადასტურებას“, რის შემდეგაც თანხა გადაირიცხება გამყიდველთან."
                  : "When you receive the plant and confirm it is healthy, confirm delivery in your profile to release funds to the seller."}
              </p>
            </div>

            <Button
              type="button"
              onClick={onClose}
              className="w-full h-11 rounded-[14px] bg-primary hover:bg-primary/90 text-white font-black text-xs cursor-pointer"
            >
              {isKa ? "დასრულება" : "Done"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
