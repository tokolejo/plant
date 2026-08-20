"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { 
  Shuffle, 
  Sparkles, 
  MapPin, 
  ArrowRight, 
  MessageSquare,
  Sprout
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const SAMPLE_ISO_REQUESTS = [
  {
    id: "iso-1",
    userName: "ნინო (Tbilisi Plants)",
    avatarUrl: "",
    userRating: 4.9,
    title: "ვეძებ Monstera Albo-ს დაფესვიანებულ კალამს",
    description: "მაქვს გასაცვლელად Philodendron White Princess და Anthurium Clarinervium.",
    desiredTags: ["Monstera Albo", "Variegated", "Rare Aroids"],
    budget: "100 ₾ (ან გაცვლა)",
    city: "თბილისი (საბურთალო)",
    createdAt: "2 საათის წინ",
  },
  {
    id: "iso-2",
    userName: "გიორგი მებოსტნე",
    avatarUrl: "",
    userRating: 5.0,
    title: "ვეძებ იშვიათი სუკულენტებისა და კაქტუსების კოლექციას",
    description: "განვიხილავ როგორც ყიდვას, ასევე გაცვლას იშვიათ ფიკუსებში.",
    desiredTags: ["Echeveria", "Astrophytum", "Succulents"],
    budget: "შეთანხმებით",
    city: "ბათუმი",
    createdAt: "5 საათის წინ",
  },
  {
    id: "iso-3",
    userName: "თამარ ბოტანიკოსი",
    avatarUrl: "",
    userRating: 4.8,
    title: "ვეძებ კერამიკულ ხელნაკეთ ქოთნებს (დიდი ზომა)",
    description: "მჭირდება 5 ცალი 30სმ+ დიამეტრის ქოთანი დრენაჟით.",
    desiredTags: ["კერამიკა", "დიდი ქოთანი", "ხელნაკეთი"],
    budget: "250 ₾",
    city: "ქუთაისი",
    createdAt: "1 დღის წინ",
  },
];

export function IsoBoardPreview() {
  return (
    <section className="py-12 sm:py-16 bg-surface-cream/60 border-y border-border/60">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-2">
              <Shuffle className="w-3.5 h-3.5" />
              <span>მცენარეების გაცვლის დაფა</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              ეძებ იშვიათ მცენარეს ან გსურს გაცვლა?
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              განათავსე მოთხოვნა და იპოვე სხვა კოლექციონერები გაცვლისთვის.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/iso">
              <Button variant="outline" className="gap-2 rounded-[14px] text-xs font-semibold h-10 px-4 border-border/70 hover:bg-surface-container">
                სრული დაფა <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Link href="/dashboard/iso/new">
              <Button className="gap-2 rounded-[14px] bg-primary hover:bg-primary-container text-white text-xs font-bold h-10 px-4 shadow-ambient">
                + მოთხოვნის დამატება
              </Button>
            </Link>
          </div>
        </div>

        {/* Requests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SAMPLE_ISO_REQUESTS.map((iso) => (
            <div
              key={iso.id}
              className="flex flex-col justify-between rounded-[20px] border border-border/70 bg-card p-5 shadow-ambient hover:border-primary/40 hover:shadow-ambient-lg transition-all"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-secondary-container text-primary flex items-center justify-center font-bold text-xs">
                      {iso.userName.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-foreground">{iso.userName}</span>
                      <span className="text-[10px] text-muted-foreground">{iso.createdAt}</span>
                    </div>
                  </div>
                  <Badge className="text-[10px] px-2.5 py-0.5 rounded-[8px] bg-amber-500/15 text-amber-800 dark:text-amber-300 font-semibold">
                    გაცვლის მოთხოვნა
                  </Badge>
                </div>

                {/* Title & Description */}
                <h3 className="font-bold text-sm text-foreground mb-2 line-clamp-2">
                  {iso.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                  {iso.description}
                </p>

                {/* Desired Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {iso.desiredTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="rounded-[8px] bg-secondary-container/70 px-2 py-0.5 text-[11px] font-medium text-on-secondary-container"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-border/50 pt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span className="truncate max-w-[130px]">{iso.city}</span>
                </div>

                <Link href={`/iso/${iso.id}`}>
                  <Button size="sm" variant="ghost" className="h-8 text-xs font-semibold gap-1 text-primary hover:bg-secondary-container rounded-[10px]">
                    <MessageSquare className="w-3.5 h-3.5" />
                    შეთავაზება
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
