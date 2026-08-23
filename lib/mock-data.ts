import { ListingCardProps } from "@/components/listings/ListingCard";

// Plant category taxonomy — maps to real plant families/types
export type PlantCategory =
  | "monstera"
  | "philodendron"
  | "ficus"
  | "anthurium"
  | "orchid"
  | "cactus-succulent"
  | "pothos-scindapsus"
  | "alocasia"
  | "calathea"
  | "fern"
  | "palm"
  | "bromeliad"
  | "rare-variegated"
  | "cutting"
  | "outdoor-garden"
  // Inventory categories
  | "pots-ceramic"
  | "pots-plastic"
  | "substrate-soil"
  | "fertilizer"
  | "tools-care"
  | "lighting-grow";

export interface ExtendedListingCardProps extends ListingCardProps {
  plantCategory?: PlantCategory;
}

// Pure 100% Real Live Database — No Mock/Sample Data
export const SAMPLE_LISTINGS: ExtendedListingCardProps[] = [];
