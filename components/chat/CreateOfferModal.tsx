"use client";

import * as React from "react";
import Image from "next/image";
import { 
  X, 
  Coins, 
  ArrowRightLeft, 
  Check, 
  Sparkles, 
  Sprout, 
  Send 
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { formatPrice } from "@/lib/utils";

interface CreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  receiverId: string;
  requestedListing: {
    id: string;
    title: string;
    price: number;
    image?: string;
  };
  onOfferCreated: (newOffer: any) => void;
}

export function CreateOfferModal({
  isOpen,
  onClose,
  chatId,
  receiverId,
  requestedListing,
  onOfferCreated,
}: CreateOfferModalProps) {
  const supabase = createClient();
  const [tab, setTab] = React.useState<"price" | "swap">("price");
  const [offeredPrice, setOfferedPrice] = React.useState<number>(
    Math.round(requestedListing.price * 0.85)
  );
  const [cashDiff, setCashDiff] = React.useState<number>(0);
  const [myListings, setMyListings] = React.useState<any[]>([]);
  const [selectedMyListingId, setSelectedMyListingId] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");

  // Fetch current user's active listings for swap
  React.useEffect(() => {
    if (!isOpen) return;

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data } = await supabase
          .from("listings")
          .select("id, title_ka, price, images")
          .eq("user_id", user.id)
          .eq("status", "ACTIVE")
          .order("created_at", { ascending: false });

        if (data && data.length > 0) {
          setMyListings(data);
          setSelectedMyListingId(data[0].id);
        }
      }
    });
  }, [isOpen, supabase]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const payload = {
        chat_id: chatId || null,
        receiver_id: receiverId,
        requested_listing_id: requestedListing.id,
        offered_price: tab === "price" ? Number(offeredPrice) : null,
        offered_listing_id: tab === "swap" ? selectedMyListingId : null,
        cash_difference: tab === "swap" ? Number(cashDiff) : 0,
      };

      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error || "შეთავაზების გაგზავნა ვერ მოხერხდა");
      } else {
        onOfferCreated(data.offer);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "კავშირის შეცდომა");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-[24px] border border-border/80 bg-card p-5 sm:p-6 shadow-2xl space-y-4">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Title */}
        <div>
          <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            შეთავაზების გაკეთება
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            განცხადებაზე: <strong className="text-foreground">{requestedListing.title}</strong> ({formatPrice(requestedListing.price)})
          </p>
        </div>

        {/* Tabs: Price vs Swap */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-[14px] bg-secondary-container/60 border border-border/60">
          <button
            type="button"
            onClick={() => setTab("price")}
            className={`py-2 px-3 rounded-[10px] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tab === "price"
                ? "bg-card text-primary shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Coins className="w-4 h-4" />
            ფასის შეთავაზება
          </button>

          <button
            type="button"
            onClick={() => setTab("swap")}
            className={`py-2 px-3 rounded-[10px] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tab === "swap"
                ? "bg-card text-primary shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            მცენარეში გაცვლა
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Option A: Price Offer */}
          {tab === "price" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  თქვენი შეთავაზებული ფასი (₾)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    inputMode="numeric"
                    value={offeredPrice}
                    onChange={(e) => setOfferedPrice(Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-[12px] border border-input bg-background text-sm font-black text-foreground focus:ring-2 focus:ring-primary/30 outline-hidden"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    ₾ GEL
                  </span>
                </div>
              </div>

              {/* Quick discount buttons */}
              <div className="flex gap-2">
                {[
                  { label: "-10%", factor: 0.9 },
                  { label: "-15%", factor: 0.85 },
                  { label: "-20%", factor: 0.8 },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    type="button"
                    onClick={() => setOfferedPrice(Math.round(requestedListing.price * btn.factor))}
                    className="flex-1 py-1.5 px-2 rounded-[8px] border border-border/70 text-[11px] font-bold bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {btn.label} ({Math.round(requestedListing.price * btn.factor)} ₾)
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Option B: Swap Offer */}
          {tab === "swap" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  აირჩიეთ თქვენი მცენარე გასაცვლელად:
                </label>
                {myListings.length === 0 ? (
                  <div className="p-3 rounded-[12px] bg-muted/30 border border-border/60 text-center text-xs text-muted-foreground">
                    თქვენ არ გაქვთ აქტიური განცხადებები გასაცვლელად.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {myListings.map((l) => (
                      <div
                        key={l.id}
                        onClick={() => setSelectedMyListingId(l.id)}
                        className={`flex items-center gap-3 p-2.5 rounded-[12px] border transition-all cursor-pointer ${
                          selectedMyListingId === l.id
                            ? "border-primary bg-primary/10"
                            : "border-border/60 hover:bg-muted/30"
                        }`}
                      >
                        <div className="relative h-10 w-10 rounded-[8px] overflow-hidden bg-muted shrink-0">
                          {l.images?.[0] ? (
                            <Image src={l.images[0]} alt="plant" fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary/60">
                              <Sprout className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{l.title_ka}</p>
                          <p className="text-[10px] text-primary font-black">{formatPrice(l.price)}</p>
                        </div>
                        {selectedMyListingId === l.id && (
                          <Check className="w-4 h-4 text-primary shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cash Difference */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  თანხის დამატება / სხვაობა (სურვილისამებრ ₾):
                </label>
                <input
                  type="number"
                  placeholder="0 (თანხის დამატების გარეშე)"
                  value={cashDiff || ""}
                  onChange={(e) => setCashDiff(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-[10px] border border-input bg-background text-xs font-bold text-foreground"
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={loading || (tab === "swap" && myListings.length === 0)}
            className="w-full h-11 rounded-[12px] bg-primary hover:bg-primary/90 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-ambient transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? "იგზავნება..." : "შეთავაზების გაგზავნა"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
