/**
 * PlantSale.Ge — Plant Category Taxonomy
 *
 * This is the single source of truth for all plant categories.
 * - Categories are derived dynamically from the `plant_category` column in `listings`
 * - The sidebar filter shows ONLY categories that have ≥1 active listing
 * - Auto-detection trigger on the DB fills `plant_category` on insert/update
 */

export type PlantCategoryId =
  // Aroids
  | "monstera"
  | "philodendron"
  | "anthurium"
  | "alocasia"
  | "calathea"
  | "pothos-scindapsus"
  | "rare-aroid"
  // Flowering
  | "orchid"
  | "bromeliad"
  // Trees & Ficus
  | "ficus"
  | "palm"
  | "fern"
  | "outdoor-garden"
  // Cactus & Rare
  | "cactus-succulent"
  | "rare-variegated"
  | "cutting"
  // Inventory
  | "pots-ceramic"
  | "pots-plastic"
  | "substrate-soil"
  | "fertilizer"
  | "tools-care"
  | "lighting-grow"
  // Catch-all
  | "other-plant"
  | "other-inventory";

export interface CategoryDef {
  id: PlantCategoryId;
  labelKa: string;
  emoji: string;
}

export interface CategoryGroupDef {
  id: string;
  labelKa: string;
  emoji: string;
  colorClass: string; // Tailwind text color
  children: CategoryDef[];
}

/** Full category taxonomy tree */
export const CATEGORY_GROUPS: CategoryGroupDef[] = [
  {
    id: "aroids",
    labelKa: "აროიდები",
    emoji: "🌿",
    colorClass: "text-emerald-600 dark:text-emerald-400",
    children: [
      { id: "monstera", labelKa: "Monstera", emoji: "🌿" },
      { id: "philodendron", labelKa: "Philodendron", emoji: "🌱" },
      { id: "anthurium", labelKa: "Anthurium", emoji: "🌺" },
      { id: "alocasia", labelKa: "Alocasia / Colocasia", emoji: "🍃" },
      { id: "calathea", labelKa: "Calathea / Maranta", emoji: "🎋" },
      { id: "pothos-scindapsus", labelKa: "Pothos / Scindapsus", emoji: "🌾" },
      { id: "rare-aroid", labelKa: "იშვიათი აროიდები", emoji: "✨" },
    ],
  },
  {
    id: "flowering",
    labelKa: "ყვავილოვანი",
    emoji: "🌸",
    colorClass: "text-rose-500 dark:text-rose-400",
    children: [
      { id: "orchid", labelKa: "ორქიდეები", emoji: "🌸" },
      { id: "bromeliad", labelKa: "ბრომელიადები", emoji: "🌺" },
    ],
  },
  {
    id: "trees",
    labelKa: "ხეები & ფიკუსები",
    emoji: "🌳",
    colorClass: "text-teal-600 dark:text-teal-400",
    children: [
      { id: "ficus", labelKa: "Ficus (ფიკუსი)", emoji: "🌳" },
      { id: "palm", labelKa: "პალმები", emoji: "🌴" },
      { id: "fern", labelKa: "გვიმრები", emoji: "🍀" },
      { id: "outdoor-garden", labelKa: "ბაღის მცენარეები", emoji: "🌻" },
    ],
  },
  {
    id: "cactus-rare",
    labelKa: "კაქტუსი & იშვიათები",
    emoji: "🌵",
    colorClass: "text-amber-600 dark:text-amber-400",
    children: [
      { id: "cactus-succulent", labelKa: "კაქტუსი & სუქულენტი", emoji: "🌵" },
      { id: "rare-variegated", labelKa: "ვარიეგატი & იშვიათი", emoji: "✨" },
      { id: "cutting", labelKa: "კალმები & ფესვიანები", emoji: "✂️" },
    ],
  },
  {
    id: "inventory",
    labelKa: "ინვენტარი & მოვლა",
    emoji: "🏺",
    colorClass: "text-slate-500 dark:text-slate-400",
    children: [
      { id: "pots-ceramic", labelKa: "კერამიკული ქოთნები", emoji: "🏺" },
      { id: "pots-plastic", labelKa: "პლასტიკური ქოთნები", emoji: "🪣" },
      { id: "substrate-soil", labelKa: "სუბსტრატი & გრუნტი", emoji: "🌍" },
      { id: "fertilizer", labelKa: "სასუქები & პრეპარატები", emoji: "🧪" },
      { id: "tools-care", labelKa: "ხელსაწყოები", emoji: "🔧" },
      { id: "lighting-grow", labelKa: "Grow Light / განათება", emoji: "💡" },
    ],
  },
  {
    id: "other",
    labelKa: "სხვა",
    emoji: "🌱",
    colorClass: "text-muted-foreground",
    children: [
      { id: "other-plant", labelKa: "სხვა მცენარე", emoji: "🌱" },
      { id: "other-inventory", labelKa: "სხვა ინვენტარი", emoji: "📦" },
    ],
  },
];

/** Flat map: categoryId → definition */
export const CATEGORY_MAP = new Map<PlantCategoryId, CategoryDef & { groupId: string }>(
  CATEGORY_GROUPS.flatMap((g) =>
    g.children.map((c) => [c.id, { ...c, groupId: g.id }])
  )
);

/** Get CategoryDef by id (safe) */
export function getCategoryDef(id: string): (CategoryDef & { groupId: string }) | undefined {
  return CATEGORY_MAP.get(id as PlantCategoryId);
}

/** Category counts record: categoryId → count */
export type CategoryCounts = Record<string, number>;
