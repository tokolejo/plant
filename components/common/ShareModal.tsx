"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { 
  Share2, 
  Copy, 
  Check, 
  X, 
  Send, 
  ExternalLink 
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url?: string;
  price?: number;
}

export function ShareModal({ isOpen, onClose, title, url, price }: ShareModalProps) {
  const locale = useLocale();
  const isKa = locale !== "en";
  const [copied, setCopied] = React.useState(false);

  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "https://plant.ge");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${title} | Plant.ge`,
          text: price ? `${title} - ${price} ₾ | Plant.ge` : `${title} | Plant.ge`,
          url: shareUrl,
        });
      } catch {
        // user cancelled or share failed
      }
    }
  };

  const shareText = encodeURIComponent(`${title} ${price ? `(${price} ₾)` : ""}\n${shareUrl}`);
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const waUrl = `https://api.whatsapp.com/send?text=${shareText}`;
  const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-[24px] bg-card border border-border/80 p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">
                {isKa ? "გაზიარება" : "Share"}
              </h3>
              <p className="text-[11px] text-muted-foreground line-clamp-1">
                {title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface-container text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Social Share Buttons */}
        <div className="grid grid-cols-3 gap-2">
          {/* Facebook */}
          <a
            href={fbUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border border-border/70 bg-card hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all text-muted-foreground text-xs font-bold text-center"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </div>
            <span>Facebook</span>
          </a>

          {/* WhatsApp */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border border-border/70 bg-card hover:bg-emerald-500/10 hover:border-emerald-500/40 hover:text-emerald-600 transition-all text-muted-foreground text-xs font-bold text-center"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 0C5.438 0 0 5.438 0 12.031c0 2.109.547 4.141 1.594 5.953L.047 24l6.188-1.594c1.766.969 3.766 1.484 5.797 1.484 6.594 0 12.031-5.438 12.031-12.031S18.625 0 12.031 0zm0 21.938c-1.844 0-3.641-.5-5.219-1.438l-.375-.219-3.875 1 1.031-3.766-.25-.391c-1.031-1.641-1.578-3.531-1.578-5.484 0-5.516 4.484-10 10-10s10 4.484 10 10-4.484 9.898-10 9.898z" />
              </svg>
            </div>
            <span>WhatsApp</span>
          </a>

          {/* Telegram */}
          <a
            href={tgUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border border-border/70 bg-card hover:bg-sky-500/10 hover:border-sky-500/40 hover:text-sky-600 transition-all text-muted-foreground text-xs font-bold text-center"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <span>Telegram</span>
          </a>
        </div>

        {/* Copy Link Input */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            {isKa ? "პირდაპირი ბმული" : "Direct Link"}
          </label>
          <div className="flex items-center gap-1.5 bg-secondary-container/60 border border-border/80 rounded-xl p-1.5">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent px-2 text-xs text-foreground font-mono truncate focus:outline-none"
            />
            <Button
              size="sm"
              onClick={handleCopy}
              className={`rounded-lg h-8 px-3 text-xs font-bold transition-all ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-primary text-white hover:bg-primary/90"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  <span>{isKa ? "დაკოპირდა" : "Copied"}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  <span>{isKa ? "კოპირება" : "Copy"}</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Native Mobile Share Button */}
        {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
          <Button
            type="button"
            variant="outline"
            onClick={handleNativeShare}
            className="w-full rounded-xl text-xs font-bold h-10 border-border"
          >
            <Share2 className="w-3.5 h-3.5 mr-2" />
            <span>{isKa ? "სხვა აპლიკაციით გაზიარება..." : "Share with other apps..."}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
