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
  | "syngonium"
  | "pothos-scindapsus"
  | "aglaonema"
  | "spathiphyllum"
  | "dieffenbachia"
  | "calathea"
  | "rare-aroid"
  // Flowering & Exotic
  | "orchid"
  | "bromeliad"
  | "hoya"
  | "begonia"
  | "carnivorous"
  // Trees & Palms
  | "ficus"
  | "palm"
  | "dracaena-cordyline"
  | "bonsai"
  | "citrus-fruit"
  | "fern"
  | "outdoor-garden"
  // Cactus & Succulents & Rare
  | "cactus-succulent"
  | "sansevieria"
  | "zz-plant"
  | "euphorbia"
  | "rare-variegated"
  | "cutting"
  // Inventory
  | "pots-ceramic"
  | "pots-plastic"
  | "substrate-soil"
  | "fertilizer"
  | "tools-care"
  | "lighting-grow"
  | "seeds-bulbs"
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
    labelKa: "აროიდები & ფოთლოვანი",
    emoji: "",
    colorClass: "text-emerald-600 dark:text-emerald-400",
    children: [
      { id: "monstera", labelKa: "მონსტერა (Monstera)", emoji: "" },
      { id: "philodendron", labelKa: "ფილოდენდრონი (Philodendron)", emoji: "" },
      { id: "anthurium", labelKa: "ანთურიუმი (Anthurium)", emoji: "" },
      { id: "alocasia", labelKa: "ალოკაზია (Alocasia)", emoji: "" },
      { id: "syngonium", labelKa: "სინგონიუმი (Syngonium)", emoji: "" },
      { id: "pothos-scindapsus", labelKa: "პოთოსი & სცინდაპსუსი", emoji: "" },
      { id: "aglaonema", labelKa: "აგლაონემა (Aglaonema)", emoji: "" },
      { id: "spathiphyllum", labelKa: "სპატიფილუმი (ქალური ბედნიერება)", emoji: "" },
      { id: "dieffenbachia", labelKa: "დიფენბახია (Dieffenbachia)", emoji: "" },
      { id: "calathea", labelKa: "კალათეა & მარანტა", emoji: "" },
      { id: "rare-aroid", labelKa: "იშვიათი აროიდები", emoji: "" },
    ],
  },
  {
    id: "cactus-rare",
    labelKa: "კაქტუსები & სუქულენტები",
    emoji: "",
    colorClass: "text-amber-600 dark:text-amber-400",
    children: [
      { id: "cactus-succulent", labelKa: "კაქტუსი & სუქულენტი", emoji: "" },
      { id: "sansevieria", labelKa: "სანსევიერია / ხანჯალა", emoji: "" },
      { id: "zz-plant", labelKa: "ზამიოკულკასი / დოლარის ხე", emoji: "" },
      { id: "euphorbia", labelKa: "ეუფორბია / რძიანა", emoji: "" },
      { id: "rare-variegated", labelKa: "ვარიეგატი & იშვიათი", emoji: "" },
      { id: "carnivorous", labelKa: "მწერიჭამია მცენარეები", emoji: "" },
      { id: "cutting", labelKa: "კალმები & ფესვიანები", emoji: "" },
    ],
  },
  {
    id: "trees",
    labelKa: "ხეები, პალმები & ფიკუსები",
    emoji: "",
    colorClass: "text-teal-600 dark:text-teal-400",
    children: [
      { id: "ficus", labelKa: "ფიკუსი (Ficus)", emoji: "" },
      { id: "palm", labelKa: "პალმები (Palm)", emoji: "" },
      { id: "dracaena-cordyline", labelKa: "დრაცენა & კორდილინა", emoji: "" },
      { id: "bonsai", labelKa: "ბონსაი (Bonsai)", emoji: "" },
      { id: "citrus-fruit", labelKa: "ციტრუსი & ხეხილი", emoji: "" },
      { id: "fern", labelKa: "გვიმრები (Fern)", emoji: "" },
      { id: "outdoor-garden", labelKa: "ბაღისა & გარე მცენარეები", emoji: "" },
    ],
  },
  {
    id: "flowering",
    labelKa: "ყვავილოვანი & ეგზოტიკა",
    emoji: "",
    colorClass: "text-rose-500 dark:text-rose-400",
    children: [
      { id: "orchid", labelKa: "ორქიდეები (Orchid)", emoji: "" },
      { id: "hoya", labelKa: "ხოია (ცვილისებრი სურო)", emoji: "" },
      { id: "begonia", labelKa: "ბეგონია (Begonia)", emoji: "" },
      { id: "bromeliad", labelKa: "ბრომელიადები", emoji: "" },
    ],
  },
  {
    id: "inventory",
    labelKa: "ინვენტარი & მოვლა",
    emoji: "",
    colorClass: "text-slate-500 dark:text-slate-400",
    children: [
      { id: "pots-ceramic", labelKa: "კერამიკული ქოთნები", emoji: "" },
      { id: "pots-plastic", labelKa: "პლასტიკური ქოთნები", emoji: "" },
      { id: "substrate-soil", labelKa: "სუბსტრატი & გრუნტი", emoji: "" },
      { id: "fertilizer", labelKa: "სასუქები & პრეპარატები", emoji: "" },
      { id: "tools-care", labelKa: "ხელსაწყოები & მოვლა", emoji: "" },
      { id: "lighting-grow", labelKa: "Grow Light / განათება", emoji: "" },
      { id: "seeds-bulbs", labelKa: "თესლები & ბოლქვები", emoji: "" },
    ],
  },
  {
    id: "other",
    labelKa: "სხვა",
    emoji: "",
    colorClass: "text-muted-foreground",
    children: [
      { id: "other-plant", labelKa: "სხვა მცენარე", emoji: "" },
      { id: "other-inventory", labelKa: "სხვა ინვენტარი", emoji: "" },
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
