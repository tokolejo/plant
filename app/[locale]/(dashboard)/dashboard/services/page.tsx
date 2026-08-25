"use client";

import * as React from "react";
import { Link, useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { compressImage } from "@/utils/image-compression";
import { uploadListingImage } from "@/utils/supabase/storage";
import { 
  Wrench, 
  Plus, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  Camera, 
  Phone, 
  MessageSquare, 
  Loader2, 
  Check, 
  X,
  ExternalLink,
  Calendar,
  Clock,
  MapPin,
  XCircle,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function DashboardServicesPage() {
  const locale = useLocale();
  const isKa = locale !== "en";
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<any>(null);
  const [services, setServices] = React.useState<any[]>([]);
  const [bookings, setBookings] = React.useState<any[]>([]);
  const [activeTab, setActiveTab] = React.useState<"services" | "bookings">("services");
  const [notice, setNotice] = React.useState<string>("");

  // Modal form states
  const [modalOpen, setModalOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const [formTitle, setFormTitle] = React.useState("");
  const [formCategory, setFormCategory] = React.useState("PRUNING");
  const [formDescription, setFormDescription] = React.useState("");
  const [formPriceFrom, setFormPriceFrom] = React.useState<number>(50);
  const [formPriceUnit, setFormPriceUnit] = React.useState("ხეზე");
  const [formCity, setFormCity] = React.useState("თბილისი");
  const [formPhone, setFormPhone] = React.useState("");
  const [formWhatsapp, setFormWhatsapp] = React.useState("");
  const [formImages, setFormImages] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 4000);
  };

  const loadData = React.useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUser(user);

      // 1. Load services
      const { data: srvData } = await supabase
        .from("gardening_services")
        .select("*")
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false });

      if (srvData) {
        setServices(srvData);
      }

      // 2. Load incoming bookings
      const { data: bookData } = await supabase
        .from("service_bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (bookData) {
        setBookings(bookData);
      }
    } catch (err) {
      console.warn("Failed to load dashboard services data:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    );
    showNotice(isKa ? `ჯავშნის სტატუსი განახლდა: ${newStatus}` : `Status updated to ${newStatus}`);

    try {
      await supabase
        .from("service_bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);
    } catch (e) {
      console.warn("Booking status update error:", e);
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormTitle("");
    setFormCategory("PRUNING");
    setFormDescription("");
    setFormPriceFrom(50);
    setFormPriceUnit("ხეზე");
    setFormCity("თბილისი");
    setFormPhone(user?.user_metadata?.phone || "");
    setFormWhatsapp(user?.user_metadata?.phone || "");
    setFormImages([]);
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    const file = e.target.files[0];
    try {
      const compressed = await compressImage(file, { maxDimension: 1000, quality: 0.85, mimeType: "image/jpeg" });
      const { url, error } = await uploadListingImage(compressed, user.id);
      if (!error && url) {
        setFormImages((prev) => [...prev, url]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !user) return;

    setSaving(true);
    try {
      const payload = {
        provider_id: user.id,
        provider_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "მებაღე",
        provider_avatar: user.user_metadata?.avatar_url || null,
        title: formTitle.trim(),
        category: formCategory,
        description: formDescription.trim(),
        price_from: formPriceFrom,
        price_unit: formPriceUnit,
        city: formCity,
        phone: formPhone.trim(),
        whatsapp: formWhatsapp.trim() || null,
        portfolio_images: formImages.length > 0 ? formImages : [
          "https://images.unsplash.com/photo-1558904541-efa8c4a08931?auto=format&fit=crop&w=600&q=80"
        ],
        is_verified: true,
      };

      if (editingId) {
        const { error } = await supabase
          .from("gardening_services")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
        showNotice("სერვისი წარმატებით განახლდა.");
      } else {
        const { error } = await supabase
          .from("gardening_services")
          .insert(payload);
        if (error) throw error;
        showNotice("სერვისი წარმატებით დაემატა კატალოგში.");
      }

      setModalOpen(false);
      loadData();
    } catch (err: any) {
      showNotice(`შეცდომა: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`ნამდვილად გსურთ სერვისის წაშლა: „${title}“?`)) return;
    setServices((prev) => prev.filter((s) => s.id !== id));
    showNotice("სერვისი წაიშალა.");
    try {
      await supabase.from("gardening_services").delete().eq("id", id);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <span className="font-bold">იტვირთება...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-[10px] bg-surface-container/60 hover:bg-surface-container text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="h-9 w-9 rounded-[12px] bg-primary/10 text-primary flex items-center justify-center font-black">
              <Wrench className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground">
              {isKa ? "ჩემი მებაღეობის სერვისები" : "My Gardening Services"}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            დაამატეთ თქვენი სერვისები (გასხვლა, ლანდშაფტი, გაზონი, სარწყავი სისტემები) და მიიღეთ პირდაპირი შეკვეთები.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/services">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-[12px] text-xs font-bold gap-1.5 h-10 border-border/80"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>კატალოგის ნახვა</span>
            </Button>
          </Link>

          <Button
            type="button"
            onClick={handleOpenAddModal}
            className="rounded-[12px] bg-primary hover:bg-primary/90 text-white text-xs font-black gap-1.5 h-10 shadow-ambient cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ახალი სერვისის დამატება</span>
          </Button>
        </div>
      </div>

      {notice && (
        <div className="rounded-[16px] bg-emerald-500/15 border border-emerald-500/30 p-3.5 text-xs font-black text-emerald-900 dark:text-emerald-200 animate-in fade-in flex items-center gap-2.5 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Tab Switcher: Services vs Bookings */}
      <div className="flex items-center gap-2 p-1 rounded-[16px] bg-secondary-container/60 border border-border/60 w-full sm:w-auto self-start">
        <button
          type="button"
          onClick={() => setActiveTab("services")}
          className={`px-4 py-2 rounded-[12px] text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "services"
              ? "bg-primary text-white shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>{isKa ? "ჩემი სერვისები" : "My Services"}</span>
          <span className="text-[10px] opacity-80 font-mono">({services.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("bookings")}
          className={`px-4 py-2 rounded-[12px] text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "bookings"
              ? "bg-primary text-white shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{isKa ? "მიღებული ჯავშნები" : "Client Bookings"}</span>
          <span className="text-[10px] opacity-80 font-mono">({bookings.length})</span>
        </button>
      </div>

      {/* ─── TAB 1: SERVICES LIST ─── */}
      {activeTab === "services" && (
        <>
          {services.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-border/80 rounded-[24px] bg-card/40 p-8 space-y-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Wrench className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">
                  {isKa ? "თქვენ ჯერ არ გაქვთ დამატებული სერვისი" : "No services added yet"}
                </h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                  {isKa
                    ? "თუ ხართ მებაღე, ლანდშაფტის დიზაინერი ან გამწვანების სპეციალისტი, განათავსეთ თქვენი მომსახურება Plant.ge-ს კატალოგში."
                    : "If you are a gardener, landscape architect, or plant care specialist, post your services here."}
                </p>
              </div>
              <Button
                type="button"
                onClick={handleOpenAddModal}
                className="rounded-[14px] bg-primary hover:bg-primary/90 text-white text-xs font-black gap-2 shadow-ambient cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isKa ? "პირველი სერვისის დამატება" : "Add Your First Service"}</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  className="rounded-[22px] border border-border/80 bg-card p-5 shadow-2xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] font-black bg-primary/5 text-primary border-primary/20">
                        {srv.category}
                      </Badge>
                      <span className="text-xs font-black text-emerald-600">
                        დან {srv.price_from} ₾ / {srv.price_unit}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-foreground">{srv.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{srv.description}</p>
                    <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span>{srv.city}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{srv.phone}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                    <button
                      type="button"
                      onClick={() => handleDelete(srv.id, srv.title)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer"
                      title={isKa ? "სერვისის წაშლა" : "Delete Service"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── TAB 2: INCOMING CLIENT BOOKINGS ─── */}
      {activeTab === "bookings" && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-border/80 rounded-[24px] bg-card/40 p-8 space-y-3">
              <Calendar className="w-10 h-10 text-muted-foreground mx-auto" />
              <h3 className="text-base font-black text-foreground">
                {isKa ? "ახალი ჯავშნები ჯერ არ არის" : "No booking requests yet"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {isKa
                  ? "როდესაც მომხმარებელი დაჯავშნის თქვენს სერვისს კალენდრიდან, მოთხოვნა გამოჩნდება აქ."
                  : "When clients book your service through the interactive calendar, requests will appear here."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookings.map((b) => {
                const isPending = !b.status || b.status === "pending";
                const isConfirmed = b.status === "confirmed";
                const isCompleted = b.status === "completed";
                const isCancelled = b.status === "cancelled";

                return (
                  <div
                    key={b.id}
                    className="rounded-[22px] border border-border/80 bg-card p-5 shadow-2xs space-y-3.5 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={`text-[10.5px] font-black ${
                            isPending
                              ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30"
                              : isConfirmed
                              ? "bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30"
                              : isCompleted
                              ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
                              : "bg-muted text-muted-foreground border-border/60"
                          }`}
                        >
                          {isPending
                            ? (isKa ? "მოლოდინში" : "Pending")
                            : isConfirmed
                            ? (isKa ? "დადასტურებული" : "Confirmed")
                            : isCompleted
                            ? (isKa ? "შესრულებული" : "Completed")
                            : (isKa ? "გაუქმებული" : "Cancelled")}
                        </Badge>

                        <span className="text-xs font-black text-emerald-600">
                          ~{b.estimated_price || 0} ₾
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-black text-foreground">{b.client_name || "დამკვეთი"}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <a href={`tel:${b.client_phone}`} className="font-bold text-foreground hover:underline">
                            {b.client_phone}
                          </a>
                        </div>
                      </div>

                      <div className="p-3 rounded-[14px] bg-secondary-container/40 border border-border/50 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-primary" />
                            <span>{isKa ? "თარიღი:" : "Date:"}</span>
                          </span>
                          <span className="font-bold text-foreground">{b.booking_date} ({b.time_slot})</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-sky-500" />
                            <span>{isKa ? "მისამართი:" : "Address:"}</span>
                          </span>
                          <span className="font-medium text-foreground truncate max-w-[180px]">{b.client_address || "-"}</span>
                        </div>
                        {b.comment && (
                          <div className="pt-1 text-[11px] text-muted-foreground italic border-t border-border/30">
                            „{b.comment}“
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Booking Action Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                      {isPending && (
                        <>
                          <Button
                            size="sm"
                            type="button"
                            onClick={() => handleUpdateBookingStatus(b.id, "cancelled")}
                            variant="outline"
                            className="h-8.5 px-3 rounded-[10px] text-xs font-bold text-muted-foreground hover:text-destructive border-border/80"
                          >
                            <X className="w-3.5 h-3.5 mr-1" />
                            <span>{isKa ? "უარყოფა" : "Decline"}</span>
                          </Button>
                          <Button
                            size="sm"
                            type="button"
                            onClick={() => handleUpdateBookingStatus(b.id, "confirmed")}
                            className="h-8.5 px-3 rounded-[10px] bg-primary hover:bg-primary/90 text-white text-xs font-black"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            <span>{isKa ? "დადასტურება" : "Confirm"}</span>
                          </Button>
                        </>
                      )}

                      {isConfirmed && (
                        <Button
                          size="sm"
                          type="button"
                          onClick={() => handleUpdateBookingStatus(b.id, "completed")}
                          className="h-8.5 px-4 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          <span>{isKa ? "შესრულებულად მონიშვნა" : "Mark as Completed"}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border/80 rounded-[24px] max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary" />
                <h3 className="text-base font-black text-foreground">
                  {editingId ? "სერვისის რედაქტირება" : "ახალი სერვისის დამატება"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3.5 overflow-y-auto flex-1 p-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-foreground block">სათაური *</label>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {formTitle.length} / 80
                  </span>
                </div>
                <Input
                  required
                  maxLength={80}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="მაგ: ხეხილის პროფესიონალური გასხვლა და შეწამვლა"
                  className="h-10 rounded-[12px] text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">კატეგორია *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-[12px] border border-input bg-card text-xs font-bold text-foreground outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="PRUNING">ხეების გასხვლა</option>
                    <option value="LANDSCAPE">ლანდშაფტის დიზაინი</option>
                    <option value="LAWN">რულონური გაზონი</option>
                    <option value="GREENING">ოფისების გამწვანება</option>
                    <option value="IRRIGATION">სარწყავი სისტემები</option>
                    <option value="DOCTOR_VISIT">მცენარის ექიმი</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">ქალაქი / რეგიონი *</label>
                  <Input
                    required
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="თბილისი, მცხეთა..."
                    className="h-10 rounded-[12px] text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">საწყისი ფასი (₾) *</label>
                  <Input
                    type="number"
                    required
                    min={1}
                    value={formPriceFrom}
                    onChange={(e) => setFormPriceFrom(parseFloat(e.target.value) || 0)}
                    className="h-10 rounded-[12px] text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">ერთეული *</label>
                  <Input
                    required
                    value={formPriceUnit}
                    onChange={(e) => setFormPriceUnit(e.target.value)}
                    placeholder="ხეზე, მ², საათში..."
                    className="h-10 rounded-[12px] text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">ტელეფონის ნომერი *</label>
                  <Input
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+995 5..."
                    className="h-10 rounded-[12px] text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">WhatsApp ნომერი</label>
                  <Input
                    value={formWhatsapp}
                    onChange={(e) => setFormWhatsapp(e.target.value)}
                    placeholder="995599..."
                    className="h-10 rounded-[12px] text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-foreground block">აღწერა & პირობები *</label>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {formDescription.length} / 1500
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  maxLength={1500}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="აღწერეთ თქვენი გამოცდილება, გამოყენებული ტექნიკა და მომსახურების პირობები..."
                  className="w-full rounded-[12px] border border-input bg-background p-2.5 text-xs font-medium focus:ring-1 focus:ring-primary outline-hidden resize-none"
                />
              </div>

              {/* Photo Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">პორტფოლიოს ფოტოები</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 rounded-[10px] bg-secondary-container text-foreground text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-surface-container"
                >
                  <Camera className="w-3.5 h-3.5 text-primary" />
                  <span>ფოტოს დამატება</span>
                </button>
                {formImages.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pt-1">
                    {formImages.map((img, i) => (
                      <img key={i} src={img} alt="" className="h-14 w-14 rounded-lg object-cover border" />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                  className="rounded-[10px] text-xs"
                >
                  გაუქმება
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="rounded-[10px] bg-primary hover:bg-primary/90 text-white text-xs font-bold gap-1.5 cursor-pointer shadow-ambient"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>შენახვა & გამოქვეყნება</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
