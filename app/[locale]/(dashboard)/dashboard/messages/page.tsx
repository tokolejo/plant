"use client";

import * as React from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/routing";
import { createClient } from "@/utils/supabase/client";
import { 
  MessageSquare, 
  Send, 
  Sprout, 
  User, 
  ArrowLeft, 
  Check, 
  CheckCheck, 
  Sparkles,
  MapPin,
  Clock,
  Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

interface ConversationItem {
  id: string;
  listing_id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  otherUser: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  listing?: {
    id: string;
    title: string;
    price: number;
    image: string;
  };
  lastMessage?: string;
  unreadCount?: number;
}

interface MessageItem {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

function MessagesInboxContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeConvId = searchParams.get("conv") || "";
  const supabase = createClient();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [conversations, setConversations] = React.useState<ConversationItem[]>([
    {
      id: "demo-conv-1",
      listing_id: "lst-1",
      participant_1: "usr-1",
      participant_2: "usr-demo",
      last_message_at: "ახლახანს",
      otherUser: {
        id: "usr-1",
        fullName: "თამარ ბოტანიკა",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      },
      listing: {
        id: "lst-1",
        title: "Monstera Thai Constellation",
        price: 180,
        image: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400&auto=format&fit=crop&q=80",
      },
      lastMessage: "გამარჯობა, ადგილზე გატანა სად არის შესაძლებელი?",
      unreadCount: 1,
    },
  ]);

  const [activeConv, setActiveConv] = React.useState<ConversationItem | null>(null);
  const [messages, setMessages] = React.useState<MessageItem[]>([
    {
      id: "msg-1",
      conversation_id: "demo-conv-1",
      sender_id: "usr-1",
      content: "გამარჯობა! გაინტერესებთ Monstera Thai Constellation?",
      is_read: true,
      created_at: "10:30",
    },
    {
      id: "msg-2",
      conversation_id: "demo-conv-1",
      sender_id: "usr-demo",
      content: "გამარჯობა, ადგილზე გატანა სად არის შესაძლებელი?",
      is_read: true,
      created_at: "10:32",
    },
  ]);

  const [newMessage, setNewMessage] = React.useState("");

  // 1. Initial Load & Auth Check
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        // demo state if not logged in
        setCurrentUser({ id: "usr-demo", email: "guest@plantsale.ge" });
      } else {
        setCurrentUser(user);
        loadRealConversations(user.id);
      }
    });
  }, [supabase]);

  // 2. Load Real Conversations from Supabase
  const loadRealConversations = async (userId: string) => {
    const { data: convData } = await supabase
      .from("conversations")
      .select(`
        id,
        listing_id,
        participant_1,
        participant_2,
        last_message_at,
        listings:listing_id (id, title_ka, price, images)
      `)
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
      .order("last_message_at", { ascending: false });

    if (convData && convData.length > 0) {
      const formatted: ConversationItem[] = convData.map((c: any) => {
        const otherUserId = c.participant_1 === userId ? c.participant_2 : c.participant_1;
        return {
          id: c.id,
          listing_id: c.listing_id,
          participant_1: c.participant_1,
          participant_2: c.participant_2,
          last_message_at: new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          otherUser: {
            id: otherUserId,
            fullName: "მცენარის გამყიდველი",
          },
          listing: c.listings ? {
            id: c.listings.id,
            title: c.listings.title_ka,
            price: c.listings.price,
            image: c.listings.images?.[0] || "",
          } : undefined,
        };
      });

      setConversations(formatted);
    }
  };

  // 3. Set Active Conversation
  React.useEffect(() => {
    if (activeConvId) {
      const found = conversations.find((c) => c.id === activeConvId);
      if (found) {
        setActiveConv(found);
      }
    } else if (conversations.length > 0) {
      setActiveConv(conversations[0]);
    }
  }, [activeConvId, conversations]);

  // 4. Supabase Realtime Subscription for incoming messages
  React.useEffect(() => {
    if (!activeConv?.id) return;

    // Listen to real-time message inserts
    const channel = supabase
      .channel(`chat:${activeConv.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConv.id}`,
        },
        (payload) => {
          const incoming = payload.new as MessageItem;
          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConv?.id, supabase]);

  // Auto-scroll on new message
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 5. Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;

    const messageContent = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    const senderId = currentUser?.id || "usr-demo";

    // Optimistic UI Update
    const optimisticMsg: MessageItem = {
      id: tempId,
      conversation_id: activeConv.id,
      sender_id: senderId,
      content: messageContent,
      is_read: false,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage("");

    // Send to Supabase
    if (currentUser && currentUser.id !== "usr-demo" && !activeConv.id.startsWith("demo")) {
      await supabase.from("messages").insert({
        conversation_id: activeConv.id,
        sender_id: senderId,
        content: messageContent,
      });

      await supabase.from("conversations").update({
        last_message_at: new Date().toISOString(),
      }).eq("id", activeConv.id);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 max-w-6xl">
      <div className="rounded-[24px] border border-border/80 bg-card shadow-ambient-lg overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[600px] h-[75vh]">
        {/* Left Side: Conversations List */}
        <div className={`md:col-span-4 border-r border-border/60 flex flex-col ${activeConv && "hidden md:flex"}`}>
          {/* Header */}
          <div className="p-4 border-b border-border/60 flex items-center justify-between bg-surface-cream/50">
            <h1 className="font-bold text-base flex items-center gap-2 text-foreground">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span>შეტყობინებები & გაცვლა</span>
            </h1>
            <span className="text-xs text-muted-foreground font-medium bg-secondary-container px-2.5 py-0.5 rounded-[8px]">
              {conversations.length} ჩატი
            </span>
          </div>

          {/* Conversations Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {conversations.map((c) => {
              const isSelected = activeConv?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveConv(c);
                    router.push(`/dashboard/messages?conv=${c.id}`);
                  }}
                  className={`w-full p-4 text-left flex items-start gap-3 transition-colors ${
                    isSelected
                      ? "bg-secondary-container/60"
                      : "hover:bg-surface-container/50"
                  }`}
                >
                  <div className="relative h-11 w-11 shrink-0 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                    {c.otherUser.avatarUrl ? (
                      <Image
                        src={c.otherUser.avatarUrl}
                        alt={c.otherUser.fullName}
                        fill
                        className="rounded-full object-cover"
                      />
                    ) : (
                      c.otherUser.fullName.charAt(0)
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-foreground truncate">
                        {c.otherUser.fullName}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {c.last_message_at}
                      </span>
                    </div>

                    {c.listing && (
                      <p className="text-[11px] font-semibold text-primary dark:text-primary-fixed truncate mb-0.5">
                        🌱 {c.listing.title} ({formatPrice(c.listing.price)})
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground truncate">
                      {c.lastMessage || "დააჭირეთ ჩატის სანახავად"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Active Chat Window */}
        <div className={`md:col-span-8 flex flex-col h-full bg-background/50 ${!activeConv && "hidden md:flex"}`}>
          {activeConv ? (
            <>
              {/* Chat Top Bar */}
              <div className="p-4 border-b border-border/60 bg-card/90 backdrop-blur-md flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveConv(null)}
                    className="md:hidden p-1.5 rounded-[10px] hover:bg-surface-container text-muted-foreground"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                    {activeConv.otherUser.fullName.charAt(0)}
                  </div>

                  <div>
                    <h2 className="text-xs font-bold text-foreground">
                      {activeConv.otherUser.fullName}
                    </h2>
                    <span className="text-[10px] text-primary dark:text-primary-fixed font-semibold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      Live Realtime
                    </span>
                  </div>
                </div>

                {activeConv.listing && (
                  <Link
                    href={`/listings/${activeConv.listing.id}`}
                    className="flex items-center gap-2 rounded-[14px] bg-secondary-container/70 hover:bg-secondary-container p-2 pr-3 transition-colors max-w-[220px]"
                  >
                    {activeConv.listing.image && (
                      <div className="relative h-8 w-8 rounded-[8px] overflow-hidden shrink-0">
                        <Image
                          src={activeConv.listing.image}
                          alt={activeConv.listing.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="truncate text-left">
                      <p className="text-[10px] font-bold truncate text-foreground">
                        {activeConv.listing.title}
                      </p>
                      <p className="text-[10px] font-bold text-primary">
                        {formatPrice(activeConv.listing.price)}
                      </p>
                    </div>
                  </Link>
                )}
              </div>

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-cream/30">
                {messages.map((m) => {
                  const isMine = m.sender_id === (currentUser?.id || "usr-demo");

                  return (
                    <div
                      key={m.id}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-[18px] px-4 py-2.5 text-xs shadow-ambient ${
                          isMine
                            ? "bg-primary text-white rounded-tr-none"
                            : "bg-card border border-border/80 text-foreground rounded-tl-none"
                        }`}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                        <div
                          className={`flex items-center justify-end gap-1 text-[9px] mt-1 ${
                            isMine ? "text-primary-fixed/80" : "text-muted-foreground"
                          }`}
                        >
                          <span>{m.created_at}</span>
                          {isMine && <CheckCheck className="w-3 h-3 text-primary-fixed" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form
                onSubmit={handleSendMessage}
                className="p-3.5 border-t border-border/60 bg-card flex items-center gap-2"
              >
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="აკრიფეთ შეტყობინება..."
                  className="rounded-[16px] text-xs h-11 border-border/70 focus:ring-primary"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-11 w-11 rounded-[16px] bg-primary hover:bg-primary-container text-white shrink-0 shadow-ambient"
                >
                  <Send className="w-4 h-4 text-primary-fixed" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <h3 className="font-bold text-sm text-foreground">აირჩიეთ ჩატი</h3>
              <p className="text-xs max-w-xs mt-1">
                აირჩიეთ საუბარი მარცხენა სიიდან მყიდველთან ან გამყიდველთან დასაკავშირებლად.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesInboxPage() {
  return (
    <React.Suspense fallback={<div className="container mx-auto px-4 py-16 text-center text-sm">იტვირთება ჩატი...</div>}>
      <MessagesInboxContent />
    </React.Suspense>
  );
}
