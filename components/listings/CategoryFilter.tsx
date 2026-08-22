"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, Check, X } from "lucide-react";
import { CATEGORY_GROUPS, type PlantCategoryId, type CategoryCounts } from "@/lib/categories";

interface CategoryFilterProps {
  counts: CategoryCounts;
  selected: PlantCategoryId[];
  onChange: (cats: PlantCategoryId[]) => void;
}

/** Individual sub-category row */
function CategoryRow({
  id,
  emoji,
  labelKa,
  count,
  isSelected,
  onToggle,
}: {
  id: PlantCategoryId;
  emoji: string;
  labelKa: string;
  count: number;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg text-left text-xs transition-all ${
        isSelected
          ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 font-bold"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {/* Checkbox indicator */}
      <span className={`flex h-4 w-4 shrink-0 rounded items-center justify-center border transition-colors ${
        isSelected
          ? "bg-emerald-600 border-emerald-600"
          : "border-border/80 bg-background"
      }`}>
        {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
      </span>

      <span className="text-xs shrink-0">{emoji}</span>
      <span className="flex-1 truncate text-xs font-medium">{labelKa}</span>

      {/* Count badge */}
      <span className={`ml-auto text-[11px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
        isSelected
          ? "bg-emerald-600 text-white"
          : "bg-muted text-muted-foreground"
      }`}>
        {count}
      </span>
    </button>
  );
}

/** Category group with independent sub-category collapse */
function CategoryGroup({
  group,
  counts,
  selected,
  onToggle,
}: {
  group: (typeof CATEGORY_GROUPS)[0];
  counts: CategoryCounts;
  selected: PlantCategoryId[];
  onToggle: (id: PlantCategoryId) => void;
}) {
  // Only show children that have ≥1 listing
  const visibleChildren = group.children.filter((c) => (counts[c.id] || 0) > 0);
  if (visibleChildren.length === 0) return null;

  const [expanded, setExpanded] = React.useState(true);
  const groupTotal = visibleChildren.reduce((sum, c) => sum + (counts[c.id] || 0), 0);
  const selectedInGroup = visibleChildren.filter((c) => selected.includes(c.id)).length;

  return (
    <div className="border-b border-border/40 last:border-0 pb-1 last:pb-0">
      {/* Group header — click to collapse/expand the whole group */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 py-2 text-left group/group"
      >
        <span className={`text-xs shrink-0 ${group.colorClass}`}>
          {group.emoji}
        </span>
        <span className={`flex-1 text-xs font-bold uppercase tracking-wider ${group.colorClass}`}>
          {group.labelKa}
        </span>
        {selectedInGroup > 0 && (
          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-600 text-white">
            {selectedInGroup}
          </span>
        )}
        <span className="text-[11px] text-muted-foreground ml-1 shrink-0">({groupTotal})</span>
        {expanded ? (
          <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Sub-categories — individually collapsible via their own toggle */}
      {expanded && (
        <div className="space-y-0.5 mb-1.5">
          {visibleChildren.map((cat) => (
            <CategoryRow
              key={cat.id}
              id={cat.id}
              emoji={cat.emoji}
              labelKa={cat.labelKa}
              count={counts[cat.id] || 0}
              isSelected={selected.includes(cat.id)}
              onToggle={() => onToggle(cat.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Full category filter panel */
export function CategoryFilter({ counts, selected, onChange }: CategoryFilterProps) {
  const totalSelected = selected.length;

  const handleToggle = (id: PlantCategoryId) => {
    onChange(
      selected.includes(id)
        ? selected.filter((c) => c !== id)
        : [...selected, id]
    );
  };

  const handleClearAll = () => onChange([]);

  // How many categories have listings at all?
  const totalActive = Object.values(counts).reduce((s, v) => s + v, 0);

  if (totalActive === 0) {
    return (
      <p className="text-[11px] text-muted-foreground italic py-2">
        კატეგორიები ჩაიტვირთება...
      </p>
    );
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          კატეგორიები
        </span>
        {totalSelected > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-emerald-600 transition-colors font-semibold"
          >
            <X className="w-3 h-3" /> გასუფთავება
          </button>
        )}
      </div>

      {/* Category groups */}
      <div className="space-y-0">
        {CATEGORY_GROUPS.map((group) => (
          <CategoryGroup
            key={group.id}
            group={group}
            counts={counts}
            selected={selected}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  );
}
