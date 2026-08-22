"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { Bell, CheckCheck, ExternalLink, Sparkles, Tag, AlertTriangle, MessageSquare, Info } from "lucide-react";

export function NotificationDropdown() {
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setNotifications(json.data || []);
          setUnreadCount(json.unreadCount || 0);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // 1 min poll
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
    } catch {
      // ignore
    }
  };

  const markOneAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
    } catch {
      // ignore
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "PRICE_DROP":
        return <Tag className="w-4 h-4 text-emerald-500" />;
      case "BILLING":
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case "TRADE":
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case "MODERATION":
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      default:
        return <Info className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) fetchNotifications();
        }}
        className="relative flex items-center justify-center h-9 w-9 rounded-[14px] border border-border/80 bg-card hover:bg-surface-container text-muted-foreground hover:text-foreground transition-all cursor-pointer"
        title="შეტყობინებები"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-black text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-[22px] border border-border/80 bg-card shadow-ambient-lg z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-secondary-container/60 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-foreground">შეტყობინებები</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {unreadCount} ახალი
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                ყველას წაკითხვა
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border/40 p-1">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-xs font-medium">
                📭 შეტყობინებები არ არის
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && markOneAsRead(n.id)}
                  className={`p-3 rounded-[14px] transition-colors cursor-pointer flex items-start gap-3 ${
                    !n.is_read ? "bg-primary/5 font-semibold" : "hover:bg-muted/40"
                  }`}
                >
                  <div className="p-2 rounded-[10px] bg-secondary-container shrink-0 mt-0.5">
                    {getIcon(n.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className="text-xs font-bold text-foreground truncate">{n.title}</p>
                      <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                        {n.created_at ? new Date(n.created_at).toLocaleDateString("ka-GE", { month: "short", day: "numeric" }) : ""}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                      {n.message}
                    </p>
                    {n.link && (
                      <Link
                        href={n.link}
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline mt-1.5"
                      >
                        <span>დეტალურად</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
