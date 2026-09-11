"use client";

import * as React from "react";
import { 
  MapPin, 
  Phone, 
  Heart, 
  Share2, 
  Copy, 
  Check, 
  Truck, 
  Boxes, 
  ExternalLink,
  Sprout,
  RefreshCw,
  Gift,
  Edit3,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

function WhatsAppIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

interface ListingActionCardProps {
  title: string;
  categoryLabel?: string;
  city?: string;
  address?: string;
  googleMapsUrl?: string;
  price: number;
  transactionType: "FIXED" | "NEGOTIABLE" | "GIFT" | "TRADE" | string;
  deliveryOptions?: {
    pickup?: boolean;
    courier?: boolean;
    post?: boolean;
  };
  phone?: string;
  whatsapp?: string;
  inWishlist: boolean;
  onToggleWishlist: () => void;
  onOpenShare: () => void;
  onAddToGreenhouse?: () => void;
  greenhouseAdded?: boolean;
  greenhouseEnabled?: boolean;
  isOwnerOrAdmin?: boolean;
  onEditListing?: () => void;
  isKa?: boolean;
}

export function ListingActionCard({
  title,
  categoryLabel,
  city,
  address,
  googleMapsUrl,
  price,
  transactionType,
  deliveryOptions,
  phone,
  whatsapp,
  inWishlist,
  onToggleWishlist,
  onOpenShare,
  onAddToGreenhouse,
  greenhouseAdded,
  greenhouseEnabled = true,
  isOwnerOrAdmin,
  onEditListing,
  isKa = true,
}: ListingActionCardProps) {
  const [showFullPhone, setShowFullPhone] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);

  const handleCopy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const rawPhone = phone || "557 57 90 20";
  const cleanPhoneDigits = rawPhone.replace(/\D/g, "");
  const formattedPhone = cleanPhoneDigits.length >= 9
    ? `${cleanPhoneDigits.slice(0, 3)} ${cleanPhoneDigits.slice(3, 5)} ${cleanPhoneDigits.slice(5, 7)} ${cleanPhoneDigits.slice(7, 9)}`
    : rawPhone;
  const maskedPhone = showFullPhone 
    ? formattedPhone 
    : `${cleanPhoneDigits.slice(0, 3)} ${cleanPhoneDigits.slice(3, 5)} ** **`;

  const waNumber = (whatsapp || phone || "").replace(/\D/g, "");
  const waUrl = waNumber
    ? `https://wa.me/${waNumber.startsWith("995") ? waNumber : `995${waNumber}`}?text=${encodeURIComponent(
        transactionType === "TRADE"
          ? (isKa 
              ? `გამარჯობა! Plantio.ge-ზე ვნახე თქვენი განცხადება: "${title}". მსურს მცენარის გაცვლა.`
              : `Hello! I saw your listing on Plantio.ge: "${title}". I'd like to propose a plant swap.`)
          : (isKa
              ? `გამარჯობა! Plantio.ge-ზე ვნახე თქვენი განცხადება: "${title}". დავინტერესდი.`
              : `Hello! I saw your listing on Plantio.ge: "${title}". I'm interested.`)
      )}`
    : null;

  // Active delivery methods (informational chips)
  const activeDeliveryMethods: Array<{ label: string; icon: any }> = [];
  if (deliveryOptions?.pickup) {
    activeDeliveryMethods.push({ label: isKa ? "ადგილზე გატანა" : "Self-Pickup", icon: Boxes });
  }
  if (deliveryOptions?.courier) {
    activeDeliveryMethods.push({ label: isKa ? "კურიერი" : "Courier", icon: Truck });
  }
  if (deliveryOptions?.post) {
    activeDeliveryMethods.push({ label: isKa ? "ფოსტა" : "Post Delivery", icon: Truck });
  }

  const handlePhoneClick = () => {
    if (!showFullPhone) {
      setShowFullPhone(true);
    } else {
      window.location.href = `tel:${cleanPhoneDigits}`;
    }
  };

  return (
    <div className="rounded-[22px] border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-4">
      {/* ── Top Meta & Quick Action Icons ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {categoryLabel && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-[10px] bg-secondary-container text-foreground">
              {categoryLabel}
            </span>
          )}
          {city && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-[8px] text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3 text-primary" />
              {city}
            </span>
          )}
        </div>

        {/* Action icons: Edit, Wishlist, Share, Copy */}
        <div className="flex items-center gap-1 shrink-0">
          {isOwnerOrAdmin && onEditListing && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onEditListing}
              title={isKa ? "რედაქტირება" : "Edit"}
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
            >
              <Edit3 className="w-4 h-4" />
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleWishlist}
            aria-label={isKa ? "სურვილების სია" : "Wishlist"}
            className={`h-8 w-8 rounded-full transition-colors ${
              inWishlist 
                ? "text-rose-500 bg-rose-500/10 hover:bg-rose-500/20" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Heart className={`w-4 h-4 ${inWishlist ? "fill-rose-500" : ""}`} />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onOpenShare}
            aria-label={isKa ? "გაზიარება" : "Share"}
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
          >
            <Share2 className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            aria-label={isKa ? "ბმულის კოპირება" : "Copy link"}
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* ── Title & Address ── */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-snug">
          {title}
        </h1>
        {address && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <span className="truncate">{address}</span>
            {googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary font-bold hover:underline inline-flex items-center gap-0.5 shrink-0"
              >
                <span>Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* ── Price & Transaction Type ── */}
      <div className="pt-3 pb-3 border-y border-border/60 flex items-center justify-between">
        <div>
          {transactionType === "TRADE" ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <RefreshCw className="w-6 h-6" /> {isKa ? "გაცვლა" : "Trade"}
              </span>
            </div>
          ) : transactionType === "GIFT" ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                <Gift className="w-6 h-6" /> {isKa ? "უფასო" : "Free"}
              </span>
              <span className="text-xs text-muted-foreground font-semibold">
                ({isKa ? "საჩუქრად" : "Giveaway"})
              </span>
            </div>
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {formatPrice(price)}
              </span>
              {transactionType === "NEGOTIABLE" && (
                <span className="text-xs font-semibold text-muted-foreground">
                  ({isKa ? "შეთანხმებით" : "Negotiable"})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Simple Active / Available Tag */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-secondary-container text-foreground border border-border/50">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{isKa ? "აქტიური" : "Active"}</span>
        </div>
      </div>

      {/* ── Delivery Methods (Informational) ── */}
      {activeDeliveryMethods.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            {isKa ? "მიწოდება / გატანა:" : "Delivery options:"}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {activeDeliveryMethods.map((method, idx) => {
              const Icon = method.icon;
              return (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[10px] text-xs font-semibold bg-secondary-container/60 text-foreground border border-border/40"
                >
                  <Icon className="w-3.5 h-3.5 text-primary" />
                  {method.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PRIMARY DIRECT CONTACT BLOCK: SIMPLE PHONE & WHATSAPP
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="pt-2 space-y-2.5">
        {/* 1. Phone Call Button (Large, High-Contrast) */}
        <Button
          type="button"
          onClick={handlePhoneClick}
          className="w-full h-12 rounded-[14px] bg-primary hover:bg-primary/90 text-white font-black text-sm shadow-xs flex items-center justify-center gap-2.5 cursor-pointer transition-all active:scale-[0.99]"
        >
          <Phone className="w-4 h-4 shrink-0" />
          <span>{showFullPhone ? formattedPhone : (isKa ? `დარეკვა: ${maskedPhone}` : `Call: ${maskedPhone}`)}</span>
        </Button>

        {/* 2. WhatsApp Direct Chat Button (Large, Official Green) */}
        {waUrl ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-12 rounded-[14px] bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-sm shadow-xs flex items-center justify-center gap-2.5 cursor-pointer transition-all active:scale-[0.99]"
          >
            <WhatsAppIcon className="w-5 h-5 fill-current shrink-0" />
            <span>
              {transactionType === "TRADE" 
                ? (isKa ? "WhatsApp-ში გაცვლის შეთავაზება" : "Propose Swap on WhatsApp")
                : (isKa ? "WhatsApp-ში მიწერა" : "Chat on WhatsApp")}
            </span>
          </a>
        ) : (
          <Button
            type="button"
            disabled
            className="w-full h-12 rounded-[14px] bg-[#25D366]/60 text-white font-black text-sm opacity-60 flex items-center justify-center gap-2.5"
          >
            <WhatsAppIcon className="w-5 h-5 fill-current shrink-0" />
            <span>WhatsApp</span>
          </Button>
        )}

        {/* Virtual Greenhouse Bridge (Subtle personal utility) */}
        {greenhouseEnabled && onAddToGreenhouse && (
          <button
            type="button"
            onClick={onAddToGreenhouse}
            className="w-full py-2 px-3 rounded-[12px] text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary-container/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sprout className={`w-3.5 h-3.5 ${greenhouseAdded ? "text-emerald-700 fill-emerald-700" : "text-primary"}`} />
            <span>
              {greenhouseAdded 
                ? (isKa ? "დამატებულია ორანჟერეაში ✓" : "Added to Greenhouse ✓")
                : (isKa ? "+ ჩემს ორანჟერეაში დამატება" : "+ Add to My Virtual Greenhouse")}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
