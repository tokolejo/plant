"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { Heart, Trash2, ExternalLink, Sprout, Store, Tag, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

export default function WishlistPage() {
  const locale = useLocale();
  const isKa = locale !== "en";
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [removingId, setRemovingId] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState("");

  const loadWishlist = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/wishlist");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setItems(json.data || []);
        }
      }
    } catch (e) {
      console.error("Wishlist load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const handleRemove = async (listingId: string, title: string) => {
    setRemovingId(listingId);
    // Optimistic remove
    setItems((prev) => prev.filter((item) => item.id !== listingId));
    try {
      const res = await fetch(`/api/wishlist?listingId=${listingId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotice(`💔 "${title}" ამოიშალა შენახულებიდან`);
        setTimeout(() => setNotice(""), 3000);
      }
    } catch {
      loadWishlist();
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1.5">
            <Heart className="w-4 h-4 fill-current" />
            <span>{isKa ? "შენახული მცენარეები & სურვილების სია" : "Wishlist & Saved Plants"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {isKa ? "ჩემი რჩეულები" : "My Wishlist"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {isKa
              ? "თვალყური ადევნეთ სასურველ მცენარეებს. ფასის შემცირებისას მიიღებთ ავტომატურ შეტყობინებას."
              : "Track your favorite plants and receive instant price drop alerts."}
          </p>
        </div>

        <Link href="/listings">
          <Button variant="outline" className="rounded-[16px] text-xs font-bold gap-2">
            <Store className="w-4 h-4 text-primary" />
            <span>{isKa ? "მარკეტზე გადასვლა" : "Browse Market"}</span>
          </Button>
        </Link>
      </div>

      {notice && (
        <div className="mb-6 rounded-[18px] bg-primary/10 border border-primary/20 p-3.5 text-xs text-primary font-bold flex items-center justify-between animate-in fade-in">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} className="text-primary hover:underline text-xs cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-xs text-muted-foreground font-semibold">
            {isKa ? "შენახული მცენარეები იტვირთება..." : "Loading saved plants..."}
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[28px] border border-border/80 bg-card p-12 text-center max-w-md mx-auto shadow-ambient space-y-4">
          <div className="h-16 w-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h2 className="text-lg font-black text-foreground">
            {isKa ? "სურვილების სია ცარიელია" : "Your Wishlist is Empty"}
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isKa
              ? "მცენარის ბარათზე გულის ხატულაზე დაჭერით შეინახეთ სასურველი მცენარეები და მიიღეთ ფასდაკლების შეტყობინებები."
              : "Save plants by clicking the heart icon on any listing to receive instant price drop alerts."}
          </p>
          <Link href="/listings" className="inline-block pt-2">
            <Button className="rounded-[16px] bg-primary hover:bg-primary-container text-white text-xs font-bold px-6 shadow-ambient">
              🌿 {isKa ? "მცენარეების დათვალიერება" : "Explore Plants"}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-[22px] border border-border/80 bg-card p-3 shadow-ambient hover:shadow-ambient-lg transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Image */}
                <div className="relative aspect-square w-full rounded-[16px] overflow-hidden bg-surface-container mb-3">
                  <img
                    src={item.images?.[0] || "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400"}
                    alt={item.title_ka || item.title_en}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {item.is_vip && (
                    <Badge className="absolute top-2.5 left-2.5 bg-amber-500 text-white font-black text-[10px] shadow-xs">
                      👑 VIP
                    </Badge>
                  )}
                  <button
                    type="button"
                    disabled={removingId === item.id}
                    onClick={() => handleRemove(item.id, item.title_ka || item.title_en)}
                    className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-background/80 hover:bg-destructive text-muted-foreground hover:text-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-xs"
                    title="ამოშლა"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Details */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold text-primary uppercase">
                      {item.item_type === "PLANT" ? "🌿 მცენარე" : "🪴 ინვენტარი"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      📍 {item.city || "თბილისი"}
                    </span>
                  </div>

                  <Link
                    href={`/listings/${item.id}`}
                    className="font-black text-xs sm:text-sm text-foreground hover:text-primary transition-colors line-clamp-1 block"
                  >
                    {item.title_ka || item.title_en}
                  </Link>

                  <p className="text-xs font-bold text-foreground">
                    {formatPrice(item.price)}
                  </p>
                </div>
              </div>

              {/* Action Link */}
              <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground truncate">
                  👤 {item.profiles?.full_name || "გამყიდველი"}
                </span>
                <Link
                  href={`/listings/${item.id}`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                >
                  <span>ნახვა</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
