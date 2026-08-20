"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { SAMPLE_ISO_REQUESTS } from "@/components/home/IsoBoardPreview";
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

export default function IsoBoardPage() {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredRequests = SAMPLE_ISO_REQUESTS.filter(
    (req) =>
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.desiredTags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">
            <Shuffle className="w-3.5 h-3.5" />
            <span>Plant Matchmaking (ISO - In Search Of)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            მცენარეების გაცვლისა და ძიების დაფა
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            განათავსეთ რას ეძებთ ან რა მცენარეში გსურთ გაცვლა.
          </p>
        </div>

        <Link href="/dashboard/iso/new">
          <Button variant="botanical" className="gap-2 rounded-xl font-semibold shadow-md">
            <PlusCircle className="w-4 h-4" />
            + მოთხოვნის დამატება
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
            placeholder="მოძებნე მცენარე, მაგ: Monstera, Philodendron, ქოთანი..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/80 bg-card text-xs sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* ISO Requests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRequests.map((req) => (
          <div
            key={req.id}
            className="flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 shadow-sm hover:border-amber-500/40 hover:shadow-lg transition-all"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-amber-500/15 text-amber-700 font-bold text-sm flex items-center justify-center">
                    {req.userName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs">{req.userName}</h3>
                    <span className="text-[10px] text-muted-foreground">{req.createdAt}</span>
                  </div>
                </div>
                <Badge variant="amber" className="text-[10px] px-2 py-0.5">
                  ISO Match
                </Badge>
              </div>

              <h2 className="font-bold text-base text-foreground mb-2 leading-snug">
                {req.title}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                {req.description}
              </p>

              <div className="mb-4">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 block mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> სასურველი მცენარეები / თეგები:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {req.desiredTags.map((tag, idx) => (
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
                <span>{req.city}</span>
              </div>

              <Button
                variant="botanical"
                size="sm"
                className="rounded-xl text-xs font-semibold gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                შეთავაზება
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
