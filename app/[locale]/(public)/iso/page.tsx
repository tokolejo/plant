"use client";

import * as React from "react";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { getMergedListings, formatDbListing } from "@/lib/listings-service";
import { 
  Shuffle, 
  Sparkles, 
  MapPin, 
  MessageSquare, 
  PlusCircle, 
  Search,
  Gift,
  Phone,
  ExternalLink,
  CheckCircle2,
  X,
  Send,
  SlidersHorizontal,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function IsoBoardPage() {
  const locale = useLocale();
  const isKa = locale !== "en";
  const router = useRouter();
  const supabase = createClient();

  const [tradeListings, setTradeListings] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<any>(null);

  // Filters
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCity, setSelectedCity] = React.useState("ALL");
  const [typeFilter, setTypeFilter] = React.useState<"ALL" | "TRADE" | "GIFT">("ALL");

  // Offer Modal State
  const [selectedOfferTarget, setSelectedOfferTarget] = React.useState<any | null>(null);
  const [offerMessage, setOfferMessage] = React.useState("");
  const [sendingOffer, setSendingOffer] = React.useState(false);
  const [offerSuccess, setOfferSuccess] = React.useState(false);

  // Check auth
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, [supabase]);

  // Load Real Trade Listings from Supabase
  const loadTradeListings = React.useCallback(async () => {
    try {
      setLoading(true);
      const all = await getMergedListings();
      // Filter items that are either TRADE, GIFT, or have tradePreferences
      const tradesOnly = all.filter(
        (l) => l.transactionType === "TRADE" || l.transactionType === "GIFT" || (l.tradePreferences && l.tradePreferences.length > 0)
      );

      // If database has trades, use them; otherwise add curated community swap seeds
      if (tradesOnly.length > 0) {
        setTradeListings(tradesOnly);
      } else {
        // Fallback sample community requests if empty
        const sampleSeed = all.slice(0, 4).map((item, i) => ({
          ...item,
          transactionType: i % 2 === 0 ? "TRADE" : "GIFT",
          tradePreferences: item.tradePreferences?.length ? item.tradePreferences : ["Monstera Albo", "Ficus Lyrata", "Philodendron"],
        }));
        setTradeListings(sampleSeed);
      }
    } catch (e) {
      console.error("Failed to load trade listings:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadTradeListings();

    // Supabase Realtime Listener on Listings for instant swap updates
    const channel = supabase
      .channel("iso-trades-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listings" },
        () => {
          loadTradeListings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadTradeListings, supabase]);

  // Filtered results
  const filteredListings = React.useMemo(() => {
    return tradeListings.filter((item) => {
      // Type filter
      if (typeFilter !== "ALL" && item.transactionType !== typeFilter) {
        return false;
      }

      // City filter
      if (selectedCity !== "ALL" && !item.city?.toLowerCase().includes(selectedCity.toLowerCase())) {
        return false;
      }

      // Keyword search (title, description, or tradePreferences tags)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const titleMatch = (item.titleKa || item.title || "").toLowerCase().includes(q);
        const descMatch = (item.descriptionKa || item.description || "").toLowerCase().includes(q);
        const tagMatch = item.tradePreferences?.some((tag: string) => tag.toLowerCase().includes(q));
        if (!titleMatch && !descMatch && !tagMatch) return false;
      }

      return true;
    });
  }, [tradeListings, typeFilter, selectedCity, searchTerm]);

  // Handle Offer Submission
  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOfferTarget || !offerMessage.trim()) return;

    if (!currentUser) {
      router.push(`/login?redirect=/iso`);
      return;
    }

    setSendingOffer(true);
    try {
      const targetSellerId = selectedOfferTarget.seller?.id || selectedOfferTarget.userId || selectedOfferTarget.user_id;
      
      if (!targetSellerId || targetSellerId === currentUser.id) {
        setOfferSuccess(true);
        setTimeout(() => {
          setSelectedOfferTarget(null);
          setOfferMessage("");
          setOfferSuccess(false);
        }, 2000);
        return;
      }

      // 1. Ensure conversation exists in Supabase
      let conversationId = null;
      const { data: convData } = await supabase
        .from("conversations")
        .select("id")
        .or(`and(buyer_id.eq.${currentUser.id},seller_id.eq.${targetSellerId}),and(buyer_id.eq.${targetSellerId},seller_id.eq.${currentUser.id})`)
        .maybeSingle();

      if (convData) {
        conversationId = convData.id;
      } else {
        const { data: newConv } = await supabase
          .from("conversations")
          .insert({
            buyer_id: currentUser.id,
            seller_id: targetSellerId,
            listing_id: selectedOfferTarget.id,
          })
          .select()
          .single();
        if (newConv) conversationId = newConv.id;
      }

      // 2. Insert Offer Message
      if (conversationId) {
        const fullOfferText = `🔄 [გაცვლის შეთავაზება განცხადებაზე "${selectedOfferTarget.titleKa || selectedOfferTarget.title}"]: ${offerMessage}`;
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: currentUser.id,
          content: fullOfferText,
        });
      }

      setOfferSuccess(true);
      setTimeout(() => {
        setSelectedOfferTarget(null);
        setOfferMessage("");
        setOfferSuccess(false);
        router.push("/dashboard/messages");
      }, 1500);
    } catch (err) {
      console.error("Offer send error:", err);
    } finally {
      setSendingOffer(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
      {/* 🌟 1. Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8 pb-6 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-900 dark:text-amber-300 text-xs font-bold border border-amber-500/20 mb-2.5">
            <Shuffle className="w-3.5 h-3.5" />
            <span>{isKa ? "ბოტანიკური გაცვლა & ISO დაფა" : "Plant Swaps & ISO Match Board"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
            {isKa ? "მცენარეების გაცვლისა და ძიების დაფა" : "Plant Swap & Match Board"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
            {isKa
              ? "გაქვთ მცენარე და ეძებთ სხვა ჯიშს? განათავსეთ თქვენი გასაცვლელი მცენარე ან შესთავაზეთ გაცვლა სხვა წევრებს."
              : "Have a plant and looking for another variety? Post your trade plant or offer swaps directly to community members."}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          <Link href="/dashboard/listings/new?trans=TRADE">
            <Button className="h-11 px-5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold shadow-ambient gap-2 cursor-pointer transition-all hover:scale-[1.02]">
              <PlusCircle className="w-4 h-4" />
              <span>{isKa ? "+ გასაცვლელი მცენარის დამატება" : "+ Post Plant for Swap"}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 🔍 2. Filter & Search Controls */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-2xs mb-8 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Keyword Search */}
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isKa ? "მოძებნე: Monstera, ფიკუსი, სუკულენტი, კალათეა..." : "Search: Monstera, Ficus, Succulent, Calathea..."}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* City Filter */}
          <div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border border-input bg-background text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="ALL">{isKa ? "ყველა ქალაქი" : "All Cities"}</option>
              <option value="თბილისი">თბილისი</option>
              <option value="ბათუმი">ბათუმი</option>
              <option value="ქუთაისი">ქუთაისი</option>
              <option value="რუსთავი">რუსთავი</option>
              <option value="გორი">გორი</option>
              <option value="ზუგდიდი">ზუგდიდი</option>
              <option value="თელავი">თელავი</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50">
          <span className="text-xs font-bold text-muted-foreground mr-1">
            {isKa ? "გაფილტვრა:" : "Filter:"}
          </span>
          <button
            onClick={() => setTypeFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              typeFilter === "ALL"
                ? "bg-foreground text-background shadow-xs"
                : "bg-secondary-container text-foreground hover:bg-secondary-container/80"
            }`}
          >
            {isKa ? "ყველა შეთავაზება" : "All Offers"} ({tradeListings.length})
          </button>
          <button
            onClick={() => setTypeFilter("TRADE")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              typeFilter === "TRADE"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-500/10 text-amber-900 dark:text-amber-300 hover:bg-amber-500/20"
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>{isKa ? "მცენარის გაცვლა" : "Plant Swaps"}</span>
          </button>
          <button
            onClick={() => setTypeFilter("GIFT")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              typeFilter === "GIFT"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-500/20"
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>{isKa ? "გაჩუქება (უფასოდ)" : "Free Giveaways"}</span>
          </button>
        </div>
      </div>

      {/* 🌿 3. Live Trade Requests Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="rounded-3xl border border-border bg-card p-6 h-64 animate-pulse" />
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/80 bg-card p-12 text-center space-y-4">
          <Shuffle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-lg font-bold text-foreground">
            {isKa ? "გასაცვლელი მცენარეები ვერ მოიძებნა" : "No swap offers found"}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            {isKa
              ? "სცადეთ ფილტრის გასუფთავება ან იყავით პირველი, ვინც განათავსებს გასაცვლელ მცენარეს!"
              : "Try changing your search or be the first to post a plant for trade!"}
          </p>
          <Link href="/dashboard/listings/new?trans=TRADE">
            <Button variant="outline" className="rounded-xl text-xs font-bold">
              {isKa ? "+ განათავსეთ გასაცვლელი მცენარე" : "+ Post Swap Offer"}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((item) => {
            const title = isKa ? (item.titleKa || item.title) : (item.titleEn || item.title);
            const description = isKa ? (item.descriptionKa || item.description) : (item.descriptionEn || item.description);
            const image = item.images?.[0] || "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800";
            const seller = item.seller || {};
            const isTrade = item.transactionType === "TRADE";
            const isGift = item.transactionType === "GIFT";
            const tradeTags = item.tradePreferences && item.tradePreferences.length > 0
              ? item.tradePreferences
              : ["ფიკუსი", "სუკულენტი", "აროიდები"];

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-3xl border border-border/80 bg-card overflow-hidden shadow-2xs hover:shadow-ambient hover:border-amber-500/50 transition-all group"
              >
                <div>
                  {/* Top Image + Deal Type Badge */}
                  <div className="relative w-full aspect-[16/10] bg-surface-container overflow-hidden">
                    <Image
                      src={image}
                      alt={title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 400px"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                      {isTrade && (
                        <span className="backdrop-blur-md bg-amber-500/90 text-white font-black text-xs px-2.5 py-1 rounded-xl shadow-xs flex items-center gap-1">
                          <Shuffle className="w-3.5 h-3.5" />
                          <span>{isKa ? "მცენარის გაცვლა" : "Plant Swap"}</span>
                        </span>
                      )}
                      {isGift && (
                        <span className="backdrop-blur-md bg-emerald-600/90 text-white font-black text-xs px-2.5 py-1 rounded-xl shadow-xs flex items-center gap-1">
                          <Gift className="w-3.5 h-3.5" />
                          <span>{isKa ? "საჩუქარი (უფასო)" : "Free Giveaway"}</span>
                        </span>
                      )}
                      {!isTrade && !isGift && (
                        <span className="backdrop-blur-md bg-background/90 text-foreground font-black text-xs px-2.5 py-1 rounded-xl border border-border shadow-xs">
                          {item.price ? `${item.price} ₾` : isKa ? "შეთანხმებით" : "Negotiable"}
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3 bg-background/85 backdrop-blur-md px-2.5 py-0.5 rounded-lg text-[11px] font-bold text-foreground flex items-center gap-1 border border-border/40">
                      <MapPin className="w-3 h-3 text-primary" />
                      <span>{item.city || (isKa ? "თბილისი" : "Tbilisi")}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    {/* Seller Header */}
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/60">
                      <div className="flex items-center gap-2.5">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-primary/10 border border-border shrink-0">
                          {seller.avatarUrl ? (
                            <Image src={seller.avatarUrl} alt={seller.fullName || "User"} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-black text-xs text-primary">
                              {(seller.fullName || "U").charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-foreground flex items-center gap-1">
                            {seller.fullName || (isKa ? "მცენარის პატრონი" : "Plant Owner")}
                            {seller.isVerified && <CheckCircle2 className="w-3 h-3 text-primary fill-primary/20" />}
                          </h4>
                          <span className="text-[10px] text-muted-foreground">
                            ★ {seller.rating || 5.0} ({seller.totalReviews || 1})
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/listings/${item.id}`}
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
                      >
                        <span>{isKa ? "დეტალები" : "Details"}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>

                    {/* Offered Plant */}
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-0.5">
                        {isKa ? "მაქვს გასაცვლელად:" : "Offered Plant:"}
                      </span>
                      <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug line-clamp-1">
                        {title}
                      </h3>
                      {description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {description}
                        </p>
                      )}
                    </div>

                    {/* Desired Trade Tags */}
                    {isTrade && (
                      <div className="pt-1">
                        <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 block mb-1.5 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          {isKa ? "სანაცვლოდ ვეძებ / მსურს:" : "Looking in Exchange for:"}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {tradeTags.map((tag: string, idx: number) => (
                            <span
                              key={idx}
                              className="rounded-lg bg-amber-500/10 text-amber-900 dark:text-amber-200 border border-amber-500/20 px-2 py-0.5 text-xs font-bold"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-4 bg-secondary-container/40 border-t border-border/60 flex items-center justify-between gap-2">
                  <Button
                    onClick={() => setSelectedOfferTarget(item)}
                    className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-xs gap-1.5 h-9 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{isKa ? "შეთავაზება" : "Make Offer"}</span>
                  </Button>

                  {seller.phone && (
                    <a
                      href={`https://wa.me/995${seller.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 px-3 rounded-xl border border-border/80 bg-card hover:bg-surface-container text-foreground flex items-center justify-center text-xs font-bold transition-colors"
                      title="WhatsApp"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 💬 4. Interactive Make Offer Modal */}
      {selectedOfferTarget && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
                  <Shuffle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    {isKa ? "გაცვლის შეთავაზება" : "Send Swap Proposal"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isKa ? "მიწერეთ მფლობელს პირდაპირ ჩათში" : "Message seller directly in chat"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedOfferTarget(null);
                  setOfferSuccess(false);
                }}
                className="p-1.5 rounded-full hover:bg-surface-container text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Item Summary */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary-container/60 border border-border/60">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-surface-container shrink-0">
                <Image
                  src={selectedOfferTarget.images?.[0] || "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=200"}
                  alt={selectedOfferTarget.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-foreground truncate">
                  {isKa ? (selectedOfferTarget.titleKa || selectedOfferTarget.title) : (selectedOfferTarget.titleEn || selectedOfferTarget.title)}
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  {selectedOfferTarget.seller?.fullName || (isKa ? "მებაღე" : "Owner")} • {selectedOfferTarget.city}
                </p>
              </div>
            </div>

            {/* Success State */}
            {offerSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                  {isKa ? "შეთავაზება წარმატებით გაიგზავნა!" : "Offer sent successfully!"}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {isKa ? "გადავდივართ პირად შეტყობინებებში..." : "Redirecting to messages..."}
                </p>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSendOffer} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {isKa ? "თქვენი შეთავაზება (რა მცენარეში სთავაზობთ გაცვლას):" : "Your Offer (What plant are you proposing):"}
                  </label>
                  <textarea
                    rows={3}
                    value={offerMessage}
                    onChange={(e) => setOfferMessage(e.target.value)}
                    placeholder={
                      isKa
                        ? "გამარჯობა! მაქვს ჯანსაღი ფიკუსი / მონსტერა და მსურს თქვენს მცენარეში გაცვლა..."
                        : "Hi! I have a healthy Ficus/Monstera and would love to trade for your plant..."
                    }
                    required
                    className="w-full p-3 rounded-xl border border-input bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedOfferTarget(null)}
                    className="rounded-xl text-xs font-bold"
                  >
                    {isKa ? "გაუქმება" : "Cancel"}
                  </Button>
                  <Button
                    type="submit"
                    disabled={sendingOffer || !offerMessage.trim()}
                    className="rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold gap-1.5 shadow-ambient"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingOffer ? (isKa ? "იგზავნება..." : "Sending...") : (isKa ? "შეთავაზების გაგზავნა" : "Send Offer")}</span>
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
