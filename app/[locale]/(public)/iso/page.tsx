"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { 
  Shuffle, 
  Sparkles, 
  MapPin, 
  MessageSquare, 
  PlusCircle, 
  Search,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface IsoRequest {
  id: string;
  userNameKa: string;
  userNameEn: string;
  avatarUrl?: string;
  userRating: number;
  titleKa: string;
  titleEn: string;
  descriptionKa: string;
  descriptionEn: string;
  desiredTagsKa: string[];
  desiredTagsEn: string[];
  budgetKa: string;
  budgetEn: string;
  cityKa: string;
  cityEn: string;
  createdAtKa: string;
  createdAtEn: string;
}

const SAMPLE_ISO_REQUESTS: IsoRequest[] = [
  {
    id: "iso-1",
    userNameKa: "ნინო (Tbilisi Plants)",
    userNameEn: "Nino (Tbilisi Plants)",
    avatarUrl: "",
    userRating: 4.9,
    titleKa: "ვეძებ Monstera Albo-ს დაფესვიანებულ კალამს",
    titleEn: "Looking for rooted Monstera Albo cutting",
    descriptionKa: "მაქვს გასაცვლელად Philodendron White Princess და Anthurium Clarinervium.",
    descriptionEn: "Have Philodendron White Princess and Anthurium Clarinervium available for trade.",
    desiredTagsKa: ["Monstera Albo", "ვარიეგატული", "იშვიათი აროიდები"],
    desiredTagsEn: ["Monstera Albo", "Variegated", "Rare Aroids"],
    budgetKa: "100 ₾ (ან გაცვლა)",
    budgetEn: "100 ₾ (or Swap)",
    cityKa: "თბილისი (საბურთალო)",
    cityEn: "Tbilisi (Saburtalo)",
    createdAtKa: "2 საათის წინ",
    createdAtEn: "2 hours ago",
  },
  {
    id: "iso-2",
    userNameKa: "გიორგი მებოსტნე",
    userNameEn: "George Grower",
    avatarUrl: "",
    userRating: 5.0,
    titleKa: "ვეძებ იშვიათი სუკულენტებისა და კაქტუსების კოლექციას",
    titleEn: "ISO Rare Succulents & Cacti Collection",
    descriptionKa: "განვიხილავ როგორც ყიდვას, ასევე გაცვლას იშვიათ ფიკუსებში.",
    descriptionEn: "Open to buying or trading for rare ficus varieties.",
    desiredTagsKa: ["Echeveria", "Astrophytum", "სუქულენტები"],
    desiredTagsEn: ["Echeveria", "Astrophytum", "Succulents"],
    budgetKa: "შეთანხმებით",
    budgetEn: "Negotiable",
    cityKa: "ბათუმი",
    cityEn: "Batumi",
    createdAtKa: "5 საათის წინ",
    createdAtEn: "5 hours ago",
  },
  {
    id: "iso-3",
    userNameKa: "თამარ ბოტანიკოსი",
    userNameEn: "Tamar Botanist",
    avatarUrl: "",
    userRating: 4.8,
    titleKa: "ვეძებ კერამიკულ ხელნაკეთ ქოთნებს (დიდი ზომა)",
    titleEn: "ISO Handmade Ceramic Pots (Large)",
    descriptionKa: "მჭირდება 5 ცალი 30სმ+ დიამეტრის ქოთანი დრენაჟით.",
    descriptionEn: "Need 5 pots with 30cm+ diameter and drainage holes.",
    desiredTagsKa: ["კერამიკა", "დიდი ქოთანი", "ხელნაკეთი"],
    desiredTagsEn: ["Ceramics", "Large Pot", "Handmade"],
    budgetKa: "250 ₾",
    budgetEn: "250 ₾",
    cityKa: "ქუთაისი",
    cityEn: "Kutaisi",
    createdAtKa: "1 დღის წინ",
    createdAtEn: "1 day ago",
  },
];

export default function IsoBoardPage() {
  const locale = useLocale();
  const isKa = locale !== "en";
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredRequests = SAMPLE_ISO_REQUESTS.filter((req: IsoRequest) => {
    const title = isKa ? req.titleKa : req.titleEn;
    const tags = isKa ? req.desiredTagsKa : req.desiredTagsEn;
    const q = searchTerm.toLowerCase();
    return (
      title.toLowerCase().includes(q) ||
      tags.some((tag: string) => tag.toLowerCase().includes(q))
    );
  });

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">
            <Shuffle className="w-3.5 h-3.5" />
            <span>{isKa ? "ვეძებ მცენარეს — გაცვლის დაფა" : "Looking for Plant — Swap Board"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {isKa ? "მცენარეების გაცვლისა და ძიების დაფა" : "Plant Swap & ISO Match Board"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isKa 
              ? "განათავსეთ რას ეძებთ ან რა მცენარეში გსურთ გაცვლა."
              : "Post what you are searching for or what plants you want to swap."}
          </p>
        </div>

        <Link href="/dashboard/iso/new">
          <Button variant="botanical" className="gap-2 rounded-xl font-semibold shadow-md cursor-pointer">
            <PlusCircle className="w-4 h-4" />
            {isKa ? "+ მოთხოვნის დამატება" : "+ Post ISO Request"}
          </Button>
        </Link>
      </div>

      {/* Search Filter */}
      <div className="max-w-md mb-8">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isKa ? "მოძებნე მცენარე, მაგ: Monstera, Philodendron, ქოთანი..." : "Search plants, e.g., Monstera, Philodendron, Pot..."}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/80 bg-card text-xs sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Requests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRequests.map((req: IsoRequest) => {
          const userName = isKa ? req.userNameKa : req.userNameEn;
          const title = isKa ? req.titleKa : req.titleEn;
          const description = isKa ? req.descriptionKa : req.descriptionEn;
          const desiredTags = isKa ? req.desiredTagsKa : req.desiredTagsEn;
          const city = isKa ? req.cityKa : req.cityEn;
          const createdAt = isKa ? req.createdAtKa : req.createdAtEn;

          return (
            <div
              key={req.id}
              className="flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 shadow-sm hover:border-amber-500/40 hover:shadow-lg transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-amber-500/15 text-amber-700 font-bold text-sm flex items-center justify-center">
                      {userName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-xs">{userName}</h3>
                      <span className="text-[10px] text-muted-foreground">{createdAt}</span>
                    </div>
                  </div>
                  <Badge variant="amber" className="text-[10px] px-2 py-0.5">
                    {isKa ? "გაცვლა" : "Swap"}
                  </Badge>
                </div>

                <h2 className="font-bold text-base text-foreground mb-2 leading-snug">
                  {title}
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  {description}
                </p>

                <div className="mb-4">
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 block mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> {isKa ? "სასურველი მცენარეები / თეგები:" : "Desired Plants / Tags:"}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {desiredTags.map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-900 dark:text-amber-200"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-border/50 pt-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>{city}</span>
                </div>

                <Button
                  variant="botanical"
                  size="sm"
                  className="rounded-xl text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {isKa ? "შეთავაზება" : "Make Offer"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
