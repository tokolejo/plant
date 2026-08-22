"use client";

import * as React from "react";
import Image from "next/image";
import { 
  Check, 
  X, 
  ArrowRightLeft, 
  Coins, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RotateCcw,
  Sparkles,
  ShieldCheck
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

export interface TradeOfferData {
  id: string;
  chat_id?: string;
  sender_id: string;
  receiver_id: string;
  offered_listing_id?: string;
  requested_listing_id: string;
  offered_price?: number;
  cash_difference?: number;
  status: "pending" | "accepted" | "countered" | "declined" | "expired";
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  receiver?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  requested_listing?: {
    id: string;
    title_ka: string;
    title_en?: string;
    price: number;
    images: string[];
    status?: string;
  };
  offered_listing?: {
    id: string;
    title_ka: string;
    title_en?: string;
    price: number;
    images: string[];
    status?: string;
  };
}

interface InChatOfferCardProps {
  offer: TradeOfferData;
  currentUserId: string;
  onStatusUpdate?: (offerId: string, newStatus: string) => void;
}

export function InChatOfferCard({
  offer,
  currentUserId,
  onStatusUpdate,
}: InChatOfferCardProps) {
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState(offer.status);

  const isSender = currentUserId === offer.sender_id;
  const isReceiver = currentUserId === offer.receiver_id;
  const isSwap = Boolean(offer.offered_listing_id && offer.offered_listing);

  const handleAction = async (newStatus: "accepted" | "declined") => {
    setLoading(true);
    try {
      const res = await fetch("/api/offers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId: offer.id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus(newStatus);
        onStatusUpdate?.(offer.id, newStatus);
      }
    } catch (e) {
      console.error("Failed to update offer status:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`my-3 overflow-hidden rounded-[20px] border shadow-ambient transition-all ${
      status === "accepted"
        ? "border-emerald-500/50 bg-emerald-500/10 dark:bg-emerald-950/20"
        : status === "declined"
        ? "border-rose-500/30 bg-rose-500/5 opacity-80"
        : "border-primary/40 bg-card"
    }`}>
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5 bg-muted/30">
        <div className="flex items-center gap-2">
          {isSwap ? (
            <span className="flex items-center gap-1 text-xs font-black text-amber-700 dark:text-amber-300">
              <ArrowRightLeft className="w-3.5 h-3.5" />
              გაცვლის შეთავაზება
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-black text-primary dark:text-emerald-400">
              <Coins className="w-3.5 h-3.5" />
              ფასის შეთავაზება
            </span>
          )}
        </div>

        {/* Status Badge */}
        <div>
          {status === "pending" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-800 dark:text-amber-300">
              <Clock className="w-3 h-3" /> მომლოდინე
            </span>
          )}
          {status === "accepted" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-3 h-3" /> მიღებულია (RESERVED)
            </span>
          )}
          {status === "declined" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-rose-800 dark:text-rose-300">
              <XCircle className="w-3 h-3" /> უარყოფილია
            </span>
          )}
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-4 space-y-3">
        {/* Plant vs Plant / Price layout */}
        {isSwap ? (
          <div className="grid grid-cols-2 gap-3 items-center">
            {/* Offered Plant */}
            <div className="space-y-1.5 rounded-[14px] bg-background p-2.5 border border-border/60">
              <span className="text-[10px] font-extrabold text-muted-foreground block">
                შემოთავაზებული მცენარე
              </span>
              <div className="relative aspect-video w-full rounded-[8px] overflow-hidden bg-muted">
                {offer.offered_listing?.images?.[0] ? (
                  <Image
                    src={offer.offered_listing.images[0]}
                    alt={offer.offered_listing.title_ka}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">🌱</div>
                )}
              </div>
              <p className="text-xs font-bold text-foreground truncate">
                {offer.offered_listing?.title_ka || "მცენარე"}
              </p>
              <p className="text-[11px] font-extrabold text-primary">
                {formatPrice(offer.offered_listing?.price || 0)}
              </p>
            </div>

            {/* Requested Plant */}
            <div className="space-y-1.5 rounded-[14px] bg-background p-2.5 border border-border/60">
              <span className="text-[10px] font-extrabold text-muted-foreground block">
                მოთხოვნილი მცენარე
              </span>
              <div className="relative aspect-video w-full rounded-[8px] overflow-hidden bg-muted">
                {offer.requested_listing?.images?.[0] ? (
                  <Image
                    src={offer.requested_listing.images[0]}
                    alt={offer.requested_listing.title_ka}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">🌿</div>
                )}
              </div>
              <p className="text-xs font-bold text-foreground truncate">
                {offer.requested_listing?.title_ka || "მცენარე"}
              </p>
              <p className="text-[11px] font-extrabold text-primary">
                {formatPrice(offer.requested_listing?.price || 0)}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-[14px] bg-background p-3.5 border border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 rounded-[10px] overflow-hidden bg-muted shrink-0">
                {offer.requested_listing?.images?.[0] ? (
                  <Image
                    src={offer.requested_listing.images[0]}
                    alt="plant"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs">🌿</div>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-foreground truncate max-w-[160px]">
                  {offer.requested_listing?.title_ka}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  თავდაპირველი ფასი: <span className="line-through">{formatPrice(offer.requested_listing?.price || 0)}</span>
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-muted-foreground block">ახალი შეთავაზება:</span>
              <span className="text-base sm:text-lg font-black text-primary dark:text-emerald-400">
                {formatPrice(offer.offered_price || 0)}
              </span>
            </div>
          </div>
        )}

        {/* Cash difference info if any */}
        {offer.cash_difference && offer.cash_difference !== 0 ? (
          <div className="rounded-[10px] bg-secondary-container/60 px-3 py-1.5 text-center text-xs font-bold text-foreground">
            💰 თანხის დამატება: <strong className="text-primary">{formatPrice(offer.cash_difference)}</strong>
          </div>
        ) : null}

        {/* Action Buttons for Receiver if status is pending */}
        {status === "pending" && isReceiver && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction("accepted")}
              className="h-9 px-3 rounded-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>თანხმობა (დაჯავშნა)</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction("declined")}
              className="h-9 px-3 rounded-[11px] bg-secondary-container hover:bg-rose-500/20 text-foreground hover:text-rose-700 border border-border/60 font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>უარყოფა</span>
            </button>
          </div>
        )}

        {/* Action Button for Sender to Withdraw if pending */}
        {status === "pending" && isSender && (
          <div className="text-center pt-1">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction("declined")}
              className="text-[11px] font-bold text-muted-foreground hover:text-rose-600 transition-colors"
            >
              შეთავაზების გაუქმება (Withdraw)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
