"use client";

import * as React from "react";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { uploadListingImage } from "@/utils/supabase/storage";
import { compressImage } from "@/utils/image-compression";
import { 
  Sprout, 
  Droplets, 
  Plus, 
  Calendar, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Sun, 
  Trash2, 
  Edit3, 
  Stethoscope, 
  Camera, 
  Loader2, 
  X, 
  ArrowLeft, 
  Heart,
  Store,
  Info,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface UserPlant {
  id: string;
  user_id: string;
  listing_id?: string;
  name: string;
  species_name?: string;
  image_url?: string;
  watering_frequency_days: number;
  last_watered_at: string;
  next_watering_at: string;
  notes?: string;
  room_location?: string;
  created_at: string;
}

const COMMON_PRESETS = [
  { name: "მონსტერა", species: "Monstera deliciosa", days: 7, light: "გაფანტული სინათლე", room: "მისაღები" },
  { name: "ფიკუსი", species: "Ficus elastica", days: 7, light: "კაშკაშა სინათლე", room: "მისაღები" },
  { name: "სანსევიერია", species: "Sansevieria trifasciata", days: 14, light: "ნებისმიერი", room: "საძინებელი" },
  { name: "ზამიოკულკასი", species: "Zamioculcas zamiifolia", days: 14, light: "ჩრდილი/ნახევრად ჩრდილი", room: "ოფისი" },
  { name: "პოთოსი", species: "Epipremnum aureum", days: 6, light: "საშუალო სინათლე", room: "აივანი" },
  { name: "ორქიდეა", species: "Phalaenopsis", days: 9, light: "გაფანტული სინათლე", room: "მისაღები" },
  { name: "სპატიფილუმი", species: "Spathiphyllum", days: 4, light: "ნახევრად ჩრდილი", room: "საძინებელი" },
  { name: "სუკულენტი / კაქტუსი", species: "Succulent", days: 18, light: "მზიანი ადგილი", room: "აივანი" },
];

export default function VirtualGreenhousePage() {
  const locale = useLocale();
  const isKa = locale !== "en";
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [plants, setPlants] = React.useState<UserPlant[]>([]);
  const [userId, setUserId] = React.useState<string>("");
  const [notice, setNotice] = React.useState<string>("");

  // Filter States
  const [selectedRoom, setSelectedRoom] = React.useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Add/Edit Modal States
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingPlantId, setEditingPlantId] = React.useState<string | null>(null);
  const [savingPlant, setSavingPlant] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [formName, setFormName] = React.useState("");
  const [formSpecies, setFormSpecies] = React.useState("");
  const [formRoom, setFormRoom] = React.useState("მისაღები");
  const [formFrequency, setFormFrequency] = React.useState<number>(7);
  const [formNotes, setFormNotes] = React.useState("");
  const [formImageUrl, setFormImageUrl] = React.useState("");
  const [formImageFile, setFormImageFile] = React.useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = React.useState("");

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 4000);
  };

  const loadPlants = React.useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { data, error } = await supabase
        .from("user_plants")
        .select("*")
        .eq("user_id", user.id)
        .order("next_watering_at", { ascending: true });

      if (!error && data) {
        setPlants(data);
      }
    } catch (err) {
      console.warn("Failed to load user plants:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  React.useEffect(() => {
    loadPlants();
  }, [loadPlants]);

  // Handle Water Plant (1-Click)
  const handleWaterPlant = async (plant: UserPlant) => {
    const now = new Date();
    const nextWaterDate = new Date(now.getTime() + plant.watering_frequency_days * 24 * 60 * 60 * 1000);

    // Optimistic Update
    setPlants((prev) =>
      prev.map((p) =>
        p.id === plant.id
          ? {
              ...p,
              last_watered_at: now.toISOString(),
              next_watering_at: nextWaterDate.toISOString(),
            }
          : p
      )
    );

    showNotice(`💧 „${plant.name}“ მოირწყა! შემდეგი მორწყვა: ${nextWaterDate.toLocaleDateString("ka-GE", { day: "numeric", month: "short" })}`);

    try {
      await supabase
        .from("user_plants")
        .update({
          last_watered_at: now.toISOString(),
          next_watering_at: nextWaterDate.toISOString(),
        })
        .eq("id", plant.id);
    } catch (err: any) {
      console.error(err);
    }
  };

  // Open Add Modal with Preset
  const handleSelectPreset = (preset: typeof COMMON_PRESETS[0]) => {
    setFormName(preset.name);
    setFormSpecies(preset.species);
    setFormFrequency(preset.days);
    setFormRoom(preset.room);
    setFormNotes(`იდეალური განათება: ${preset.light}`);
  };

  const handleOpenAddModal = () => {
    setEditingPlantId(null);
    setFormName("");
    setFormSpecies("");
    setFormRoom("მისაღები");
    setFormFrequency(7);
    setFormNotes("");
    setFormImageUrl("");
    setFormImageFile(null);
    setFormImagePreview("");
    setModalOpen(true);
  };

  const handleOpenEditModal = (plant: UserPlant) => {
    setEditingPlantId(plant.id);
    setFormName(plant.name);
    setFormSpecies(plant.species_name || "");
    setFormRoom(plant.room_location || "მისაღები");
    setFormFrequency(plant.watering_frequency_days || 7);
    setFormNotes(plant.notes || "");
    setFormImageUrl(plant.image_url || "");
    setFormImageFile(null);
    setFormImagePreview(plant.image_url || "");
    setModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setFormImageFile(file);
    setFormImagePreview(URL.createObjectURL(file));
  };

  const handleSavePlant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setSavingPlant(true);
    try {
      let finalImageUrl = formImageUrl;

      if (formImageFile && userId) {
        const compressed = await compressImage(formImageFile, {
          maxDimension: 800,
          quality: 0.85,
          mimeType: "image/jpeg",
        });
        const { url, error: uploadErr } = await uploadListingImage(compressed, userId);
        if (!uploadErr && url) {
          finalImageUrl = url;
        }
      }

      const now = new Date();
      const nextWaterDate = new Date(now.getTime() + formFrequency * 24 * 60 * 60 * 1000);

      if (editingPlantId) {
        // Update Existing Plant
        const { error } = await supabase
          .from("user_plants")
          .update({
            name: formName.trim(),
            species_name: formSpecies.trim() || null,
            room_location: formRoom,
            watering_frequency_days: formFrequency,
            notes: formNotes.trim() || null,
            image_url: finalImageUrl || null,
          })
          .eq("id", editingPlantId);

        if (error) throw error;
        showNotice(`🌿 „${formName}“ წარმატებით განახლდა!`);
      } else {
        // Insert New Plant
        const { error } = await supabase
          .from("user_plants")
          .insert({
            user_id: userId,
            name: formName.trim(),
            species_name: formSpecies.trim() || null,
            room_location: formRoom,
            watering_frequency_days: formFrequency,
            last_watered_at: now.toISOString(),
            next_watering_at: nextWaterDate.toISOString(),
            notes: formNotes.trim() || null,
            image_url: finalImageUrl || null,
          });

        if (error) throw error;
        showNotice(`🎉 „${formName}“ დაემატა თქვენს ორანჟერეაში!`);
      }

      setModalOpen(false);
      loadPlants();
    } catch (err: any) {
      showNotice(`❌ შეცდომა: ${err.message}`);
    } finally {
      setSavingPlant(false);
    }
  };

  const handleDeletePlant = async (id: string, name: string) => {
    if (!confirm(`ნამდვილად გსურთ „${name}“-ს წაშლა ორანჟერეიდან?`)) return;

    setPlants((prev) => prev.filter((p) => p.id !== id));
    showNotice(`🗑️ „${name}“ წაიშალა.`);

    try {
      await supabase.from("user_plants").delete().eq("id", id);
    } catch (err: any) {
      console.error(err);
    }
  };

  // Compute Days until next watering
  const getWateringStatus = (plant: UserPlant) => {
    const nextDate = new Date(plant.next_watering_at || new Date()).getTime();
    const today = new Date().setHours(0, 0, 0, 0);
    const target = new Date(nextDate).setHours(0, 0, 0, 0);

    const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: "OVERDUE",
        label: `🔴 ვადაგადაცილებულია (${Math.abs(diffDays)} დღით)`,
        diffDays,
        color: "bg-destructive/15 text-destructive border-destructive/30",
      };
    }
    if (diffDays === 0) {
      return {
        status: "TODAY",
        label: "🟡 დღეს მოსარწყავია",
        diffDays,
        color: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
      };
    }
    return {
      status: "UPCOMING",
      label: `🟢 მოირწყვება ${diffDays} დღეში`,
      diffDays,
      color: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
    };
  };

  // Filtered Plants List
  const filteredPlants = React.useMemo(() => {
    return plants.filter((plant) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          plant.name.toLowerCase().includes(q) ||
          (plant.species_name && plant.species_name.toLowerCase().includes(q)) ||
          (plant.notes && plant.notes.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // 2. Room Location
      if (selectedRoom !== "ALL") {
        if (plant.room_location !== selectedRoom) return false;
      }

      // 3. Watering Status
      if (selectedStatus !== "ALL") {
        const info = getWateringStatus(plant);
        if (info.status !== selectedStatus) return false;
      }

      return true;
    });
  }, [plants, searchQuery, selectedRoom, selectedStatus]);

  // Quick Stats
  const overdueCount = plants.filter((p) => getWateringStatus(p).status === "OVERDUE").length;
  const todayCount = plants.filter((p) => getWateringStatus(p).status === "TODAY").length;
  const upcomingCount = plants.filter((p) => getWateringStatus(p).status === "UPCOMING").length;

  const roomsList = Array.from(
    new Set(plants.map((p) => p.room_location).filter(Boolean))
  ) as string[];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <span className="font-bold">{isKa ? "იტვირთება თქვენი ორანჟერეა..." : "Loading Greenhouse..."}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl space-y-6">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-[10px] bg-surface-container/60 hover:bg-surface-container text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="h-9 w-9 rounded-[12px] bg-primary/10 text-primary flex items-center justify-center font-black">
              <Sprout className="w-5 h-5" />
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-foreground">
              {isKa ? "ჩემი ვირტუალური ორანჟერეა" : "My Virtual Greenhouse"}
            </h1>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-black">
              {plants.length} {isKa ? "მცენარე" : "Plants"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {isKa
              ? "მართეთ თქვენი მცენარეების კოლექცია, მორწყვის კალენდარი და მიიღეთ ჭკვიანი რჩევები."
              : "Manage your houseplants, watering schedules, and health care tracking."}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <Link href="/plant-doctor">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 rounded-[12px] text-xs font-bold gap-1.5 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/10 cursor-pointer"
            >
              <Stethoscope className="w-4 h-4 text-emerald-600" />
              <span>{isKa ? "🩺 AI მცენარის ექიმი" : "AI Plant Doctor"}</span>
            </Button>
          </Link>

          <Button
            type="button"
            onClick={handleOpenAddModal}
            className="h-10 rounded-[12px] bg-primary hover:bg-primary/90 text-white text-xs font-black gap-1.5 shadow-ambient cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isKa ? "მცენარის დამატება" : "Add Plant"}</span>
          </Button>
        </div>
      </div>

      {/* Floating Notice */}
      {notice && (
        <div className="rounded-[16px] bg-emerald-500/15 border border-emerald-500/30 p-3.5 text-xs font-black text-emerald-900 dark:text-emerald-200 animate-in fade-in flex items-center gap-2.5 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* 2. Top Summary KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Plants */}
        <div className="p-4 rounded-[20px] bg-card border border-border/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            {isKa ? "სულ მცენარეები" : "Total Plants"}
          </span>
          <p className="text-2xl font-black text-foreground">{plants.length}</p>
          <span className="text-[10px] text-muted-foreground">{roomsList.length} ოთახში</span>
        </div>

        {/* Due Today */}
        <div 
          onClick={() => setSelectedStatus("TODAY")}
          className={`p-4 rounded-[20px] border shadow-2xs space-y-1 cursor-pointer transition-all ${
            selectedStatus === "TODAY" ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/10" : "bg-card border-border/80 hover:border-amber-500/40"
          }`}
        >
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider block flex items-center gap-1">
            <Droplets className="w-3.5 h-3.5 text-amber-500" />
            {isKa ? "დღეს მოსარწყავი" : "Due Today"}
          </span>
          <p className="text-2xl font-black text-amber-600">{todayCount}</p>
          <span className="text-[10px] text-muted-foreground">{isKa ? "დაუყოვნებლივ" : "Needs water"}</span>
        </div>

        {/* Overdue */}
        <div 
          onClick={() => setSelectedStatus("OVERDUE")}
          className={`p-4 rounded-[20px] border shadow-2xs space-y-1 cursor-pointer transition-all ${
            selectedStatus === "OVERDUE" ? "border-destructive ring-2 ring-destructive/20 bg-destructive/10" : "bg-card border-border/80 hover:border-destructive/40"
          }`}
        >
          <span className="text-[11px] font-bold text-destructive uppercase tracking-wider block flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-destructive" />
            {isKa ? "ვადაგადაცილებული" : "Overdue"}
          </span>
          <p className="text-2xl font-black text-destructive">{overdueCount}</p>
          <span className="text-[10px] text-muted-foreground">{isKa ? "დაგვიანებული" : "Urgent"}</span>
        </div>

        {/* Upcoming / Well Watered */}
        <div 
          onClick={() => setSelectedStatus("UPCOMING")}
          className={`p-4 rounded-[20px] border shadow-2xs space-y-1 cursor-pointer transition-all ${
            selectedStatus === "UPCOMING" ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/10" : "bg-card border-border/80 hover:border-emerald-500/40"
          }`}
        >
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {isKa ? "მორწყული" : "Watered"}
          </span>
          <p className="text-2xl font-black text-emerald-600">{upcomingCount}</p>
          <span className="text-[10px] text-muted-foreground">{isKa ? "კარგ მდგომარეობაში" : "In schedule"}</span>
        </div>
      </div>

      {/* 3. Filter Toolbar & Search */}
      <div className="p-3.5 sm:p-4 rounded-[22px] bg-secondary-container/30 border border-border/60 space-y-3">
        {/* Search */}
        <div className="relative w-full">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isKa ? "ძიება მცენარის სახელით, ჯიშით ან შენიშვნით..." : "Search plants..."}
            className="h-10 pl-9 rounded-[14px] text-xs font-bold bg-card"
          />
          <Sprout className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Room Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          <span className="text-[10px] font-black uppercase text-muted-foreground shrink-0 mr-1">
            {isKa ? "ოთახი:" : "Room:"}
          </span>
          {["ALL", "მისაღები", "აივანი", "საძინებელი", "ეზო/ბაღი", "ოფისი", ...roomsList.filter((r) => !["მისაღები", "აივანი", "საძინებელი", "ეზო/ბაღი", "ოფისი"].includes(r))].map((room) => {
            const isSelected = selectedRoom === room;
            return (
              <button
                key={room}
                type="button"
                onClick={() => setSelectedRoom(room)}
                className={`px-3 py-1.5 rounded-[12px] text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary text-white shadow-xs"
                    : "bg-card text-muted-foreground hover:text-foreground border border-border/60"
                }`}
              >
                {room === "ALL" ? (isKa ? "ყველა ოთახი" : "All Rooms") : room}
              </button>
            );
          })}
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-border/40 pb-0.5 no-scrollbar">
          <span className="text-[10px] font-black uppercase text-muted-foreground shrink-0 mr-1">
            {isKa ? "სტატუსი:" : "Status:"}
          </span>
          {[
            { id: "ALL", label: isKa ? "ყველა სტატუსი" : "All" },
            { id: "TODAY", label: isKa ? "🟡 დღეს მოსარწყავი" : "🟡 Due Today" },
            { id: "OVERDUE", label: isKa ? "🔴 ვადაგადაცილებული" : "🔴 Overdue" },
            { id: "UPCOMING", label: isKa ? "🟢 მორწყული" : "🟢 Watered" },
          ].map((st) => {
            const isSelected = selectedStatus === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStatus(st.id)}
                className={`px-2.5 py-1.5 rounded-[10px] text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-foreground text-background shadow-xs"
                    : "bg-card text-muted-foreground hover:text-foreground border border-border/50"
                }`}
              >
                {st.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Plants Grid */}
      {filteredPlants.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-border/80 rounded-[24px] bg-card/40 p-8 space-y-4">
          <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Sprout className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-black text-foreground">
              {plants.length === 0
                ? (isKa ? "თქვენი ორანჟერეა ჯერ ცარიელია" : "Your greenhouse is empty")
                : (isKa ? "მცენარეები ამ ფილტრით ვერ მოიძებნა" : "No plants match these filters")}
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
              {plants.length === 0
                ? (isKa
                    ? "დაამატეთ თქვენი პირველი მცენარე, რათა სისტემამ დროულად შეგახსენოთ მორწყვისა და მოვლის წესები!"
                    : "Add your first houseplant to get automated watering and care schedules.")
                : (isKa ? "სცადეთ ფილტრების გასუფთავება ან სხვა სიტყვით ძიება." : "Try clearing your filters.")}
            </p>
          </div>
          {plants.length === 0 && (
            <Button
              type="button"
              onClick={handleOpenAddModal}
              className="rounded-[14px] bg-primary hover:bg-primary/90 text-white text-xs font-black gap-2 shadow-ambient cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isKa ? "პირველი მცენარის დამატება" : "Add Your First Plant"}</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredPlants.map((plant) => {
            const statusInfo = getWateringStatus(plant);
            const lastWateredDate = plant.last_watered_at
              ? new Date(plant.last_watered_at).toLocaleDateString("ka-GE", { day: "numeric", month: "short" })
              : (isKa ? "არ არის" : "None");

            return (
              <div
                key={plant.id}
                className="rounded-[24px] border border-border/80 bg-card p-4 sm:p-5 shadow-2xs hover:shadow-ambient transition-all flex flex-col justify-between space-y-4 group"
              >
                {/* Top: Image, Nickname, Species, Room Badge */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3.5">
                    {/* Plant Thumbnail */}
                    <div className="relative h-18 w-18 rounded-[18px] bg-surface-container overflow-hidden border border-border/60 shrink-0 shadow-2xs flex items-center justify-center font-black text-xl text-primary">
                      {plant.image_url ? (
                        <img
                          src={plant.image_url}
                          alt={plant.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Sprout className="w-8 h-8 text-primary/40" />
                      )}
                    </div>

                    {/* Titles & Location */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="text-sm font-black text-foreground truncate">
                          {plant.name}
                        </h3>
                        {plant.room_location && (
                          <span className="px-2 py-0.5 rounded-[8px] bg-surface-container text-[10px] font-bold text-muted-foreground shrink-0 border border-border/40">
                            📍 {plant.room_location}
                          </span>
                        )}
                      </div>

                      {plant.species_name && (
                        <p className="text-[11px] font-serif italic text-muted-foreground truncate">
                          {plant.species_name}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium pt-0.5">
                        <Clock className="w-3 h-3 text-muted-foreground/80" />
                        <span>ყოველ {plant.watering_frequency_days} დღეში</span>
                      </div>
                    </div>
                  </div>

                  {/* Watering Status Pill */}
                  <div className={`p-2.5 rounded-[14px] border text-xs font-bold flex items-center justify-between ${statusInfo.color}`}>
                    <span className="flex items-center gap-1.5">
                      <Droplets className="w-4 h-4" />
                      <span>{statusInfo.label}</span>
                    </span>
                    <span className="text-[10px] opacity-80">
                      ბოლო: {lastWateredDate}
                    </span>
                  </div>

                  {/* Notes / Care details if present */}
                  {plant.notes && (
                    <div className="p-2.5 rounded-[12px] bg-surface-container/40 border border-border/40 text-[11px] text-foreground/80 font-medium line-clamp-2">
                      💡 {plant.notes}
                    </div>
                  )}
                </div>

                {/* Bottom: Action Buttons */}
                <div className="pt-2 border-t border-border/40 space-y-2">
                  {/* Primary 1-Click Water Button */}
                  <Button
                    type="button"
                    onClick={() => handleWaterPlant(plant)}
                    className="w-full h-10 rounded-[14px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black gap-2 cursor-pointer shadow-xs active:scale-98 transition-all"
                  >
                    <Droplets className="w-4 h-4" />
                    <span>{isKa ? "💧 მოვრწყე დღეს" : "💧 Watered Today"}</span>
                  </Button>

                  {/* Secondary Quick Toolbar (AI Doctor, Edit, Delete) */}
                  <div className="flex items-center justify-between gap-1 pt-1">
                    <Link
                      href={`/plant-doctor?plantName=${encodeURIComponent(plant.name)}&species=${encodeURIComponent(plant.species_name || "")}&imageUrl=${encodeURIComponent(plant.image_url || "")}`}
                      className="flex-1"
                    >
                      <button
                        type="button"
                        className="w-full h-8 px-2 rounded-[10px] bg-surface-container/60 hover:bg-surface-container text-foreground text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer border border-border/40"
                        title="დაავადების შემოწმება AI ექიმით"
                      >
                        <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                        <span>AI ექიმი</span>
                      </button>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(plant)}
                      className="h-8 px-2.5 rounded-[10px] bg-card hover:bg-surface-container text-muted-foreground hover:text-foreground text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-border/50"
                      title="რედაქტირება"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeletePlant(plant.id, plant.name)}
                      className="h-8 w-8 rounded-[10px] hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors cursor-pointer"
                      title="წაშლა"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Add / Edit Plant Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border/80 rounded-[24px] max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center font-black">
                  <Sprout className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-foreground">
                  {editingPlantId
                    ? (isKa ? "მცენარის რედაქტირება" : "Edit Plant")
                    : (isKa ? "ახალი მცენარის დამატება" : "Add New Plant")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlant} className="space-y-4 overflow-y-auto flex-1 p-1">
              {/* Presets Bar for Instant Auto-fill */}
              {!editingPlantId && (
                <div className="space-y-1.5 p-3 rounded-[16px] bg-secondary-container/40 border border-border/60">
                  <span className="text-[10.5px] font-black uppercase text-muted-foreground block">
                    ⚡ პოპულარული მცენარეები (სწრაფი შევსება):
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {COMMON_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => handleSelectPreset(p)}
                        className="px-2.5 py-1 rounded-[10px] bg-card hover:bg-primary hover:text-white text-foreground text-[11px] font-bold border border-border/60 transition-all shrink-0 cursor-pointer shadow-2xs"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Photo Upload */}
              <div className="flex items-center gap-3.5 p-3 rounded-[16px] bg-surface-container/30 border border-border/50">
                <div className="relative h-16 w-16 rounded-[14px] bg-primary/10 overflow-hidden border border-primary/20 flex items-center justify-center font-black text-primary shrink-0 shadow-2xs">
                  {formImagePreview ? (
                    <img src={formImagePreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-primary/60" />
                  )}
                </div>

                <div className="space-y-1">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[10px] bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-bold transition-colors cursor-pointer border border-primary/20"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{isKa ? "ფოტოს ატვირთვა" : "Upload Photo"}</span>
                  </button>
                  <p className="text-[10.5px] text-muted-foreground">JPG, PNG, WebP (ავტო-ოპტიმიზაცია)</p>
                </div>
              </div>

              {/* Name & Species */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    {isKa ? "მცენარის სახელი *" : "Plant Name *"}
                  </label>
                  <Input
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="მაგ: ჩემი მონსტერა"
                    className="h-10 rounded-[12px] text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    {isKa ? "ბოტანიკური ჯიში / სახეობა" : "Species"}
                  </label>
                  <Input
                    value={formSpecies}
                    onChange={(e) => setFormSpecies(e.target.value)}
                    placeholder="მაგ: Monstera deliciosa"
                    className="h-10 rounded-[12px] text-xs font-medium font-serif italic"
                  />
                </div>
              </div>

              {/* Room & Watering Frequency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    {isKa ? "ოთახი / ლოკაცია" : "Room"}
                  </label>
                  <select
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    className="w-full h-10 px-3 rounded-[12px] border border-input bg-card text-xs font-bold text-foreground outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    {["მისაღები", "აივანი", "საძინებელი", "ეზო/ბაღი", "ოფისი", "სამზარეულო", "აბაზანა", "სხვა"].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    {isKa ? "მორწყვის სიხშირე (დღეები) *" : "Watering Frequency *"}
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      required
                      min={1}
                      max={90}
                      value={formFrequency}
                      onChange={(e) => setFormFrequency(parseInt(e.target.value) || 7)}
                      className="h-10 rounded-[12px] text-xs font-black pl-9"
                    />
                    <Droplets className="w-4 h-4 text-primary absolute left-3 top-1/2 -translate-y-1/2" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">დღეში 1-ხელ</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  {isKa ? "შენიშვნები & მოვლის რჩევები" : "Notes"}
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="მაგ: უყვარს ფოთლების დანამვა, არ უყვარს პირდაპირი მზე..."
                  className="w-full rounded-[12px] border border-border/80 bg-background p-2.5 text-xs font-medium focus:ring-1 focus:ring-primary outline-hidden resize-none"
                />
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
                  disabled={savingPlant}
                  className="rounded-[10px] bg-primary hover:bg-primary/90 text-white text-xs font-bold gap-1.5 cursor-pointer shadow-ambient"
                >
                  {savingPlant ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{editingPlantId ? "ცვლილების შენახვა" : "დამატება"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
