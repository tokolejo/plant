"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { 
  ChevronRight, 
  ArrowLeft, 
  ShieldCheck, 
  Activity, 
  LayoutDashboard,
  Layers,
  Users,
  CreditCard,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuditStudio } from "@/components/admin/AuditStudio";

export default function AdminAuditStandalonePage() {
  const params = useParams();
  const locale = (params?.locale as string) || "ka";
  const [notice, setNotice] = React.useState<string>("");

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Toast Notice */}
      {notice && (
        <div className="fixed bottom-6 right-6 z-50 bg-foreground text-background font-bold text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200 border border-border">
          <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Top Breadcrumb & Page Bar */}
      <div className="border-b border-border/80 bg-card/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <Link
              href="/admin"
              className="hover:text-foreground transition-colors flex items-center gap-1 font-bold text-primary"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ადმინ პანელი</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-purple-600" />
              აუდიტის ჟურნალი (სრული ხედი)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-bold gap-1.5 border-border/80"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-primary" />
                <span>მთავარი დაშბორდი</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <AuditStudio showNotice={showNotice} standalone={true} locale={locale} />
      </main>
    </div>
  );
}
