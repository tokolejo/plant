-- ===========================================================================
-- Migration: Add plant_category column to listings table
-- PlantSale.Ge - Dynamic category system
-- Run this in Supabase SQL Editor
-- ===========================================================================

-- 1. Add plant_category column to listings
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS plant_category TEXT;

-- 2. Index for fast category filtering & counting
CREATE INDEX IF NOT EXISTS idx_listings_plant_category
  ON public.listings(plant_category)
  WHERE plant_category IS NOT NULL AND status = 'ACTIVE';

-- 3. View: live category counts — used by the frontend filter sidebar
--    Returns only categories that have at least 1 active listing
CREATE OR REPLACE VIEW public.category_counts AS
SELECT
  plant_category,
  COUNT(*) AS listing_count
FROM public.listings
WHERE
  status = 'ACTIVE'
  AND plant_category IS NOT NULL
  AND plant_category <> ''
GROUP BY plant_category
ORDER BY listing_count DESC;

-- Grant read access to anonymous users (public can see category counts)
GRANT SELECT ON public.category_counts TO anon, authenticated;

-- 4. Trigger: auto-detect plant_category from tags/title if not set
--    This runs BEFORE INSERT so new listings without explicit category
--    still get auto-categorized based on their title keywords.
CREATE OR REPLACE FUNCTION public.auto_detect_plant_category()
RETURNS TRIGGER AS $$
DECLARE
  title_lower TEXT;
BEGIN
  -- Only auto-detect if plant_category is not explicitly set
  IF NEW.plant_category IS NOT NULL AND NEW.plant_category <> '' THEN
    RETURN NEW;
  END IF;

  title_lower := LOWER(COALESCE(NEW.title_ka, '') || ' ' || COALESCE(NEW.title_en, ''));

  -- Aroids
  IF title_lower ~* 'monstera' THEN
    NEW.plant_category := 'monstera';
  ELSIF title_lower ~* 'philodendron|philo' THEN
    NEW.plant_category := 'philodendron';
  ELSIF title_lower ~* 'anthurium' THEN
    NEW.plant_category := 'anthurium';
  ELSIF title_lower ~* 'alocasia|colocasia' THEN
    NEW.plant_category := 'alocasia';
  ELSIF title_lower ~* 'calathea|maranta|ctenanthe|stromanthe' THEN
    NEW.plant_category := 'calathea';
  ELSIF title_lower ~* 'pothos|epipremnum|scindapsus' THEN
    NEW.plant_category := 'pothos-scindapsus';
  ELSIF title_lower ~* 'syngonium|aglaonema|dieffenbachia|spathiphyllum|zamioculcas|zz' THEN
    NEW.plant_category := 'rare-aroid';
  -- Orchids & bromeliads
  ELSIF title_lower ~* 'orchid|ორქიდეა|phalaenopsis|dendrobium|oncidium|cattleya' THEN
    NEW.plant_category := 'orchid';
  ELSIF title_lower ~* 'bromeliad|tillandsia|neoregelia|guzmania|aechmea' THEN
    NEW.plant_category := 'bromeliad';
  -- Ficus & trees
  ELSIF title_lower ~* 'ficus|ფიკუს' THEN
    NEW.plant_category := 'ficus';
  ELSIF title_lower ~* 'palm|პალმა|chamaedorea|livistona|washingtonia' THEN
    NEW.plant_category := 'palm';
  ELSIF title_lower ~* 'fern|გვიმარა|adiantum|nephrolepis|asplenium' THEN
    NEW.plant_category := 'fern';
  -- Cactus & succulents
  ELSIF title_lower ~* 'cactus|კაქტუს|echinocactus|opuntia|cereus|gymnocalycium' THEN
    NEW.plant_category := 'cactus-succulent';
  ELSIF title_lower ~* 'succulent|სუქულენტ|echeveria|haworthia|aloe|sedum|crassula' THEN
    NEW.plant_category := 'cactus-succulent';
  -- Rare & variegated
  ELSIF title_lower ~* 'variegat|albo|thai constellation|aurea|mint|white fusion|pink princess|burle marx' THEN
    NEW.plant_category := 'rare-variegated';
  -- Cuttings
  ELSIF title_lower ~* 'კალმ|cutting|rooted|ფესვიანი' THEN
    NEW.plant_category := 'cutting';
  -- Inventory
  ELSIF title_lower ~* 'ქოთანი|ქოთნ|pot|ceramic|კერამიკ' THEN
    NEW.plant_category := 'pots-ceramic';
  ELSIF title_lower ~* 'plastic.*pot| პლასტიკ.*ქოთ' THEN
    NEW.plant_category := 'pots-plastic';
  ELSIF title_lower ~* 'სუბსტრატ|substrate|soil|გრუნტ|perlite|პერლიტ|bark|ქერქ' THEN
    NEW.plant_category := 'substrate-soil';
  ELSIF title_lower ~* 'სასუქ|fertilizer|nutrient|npk|კვება' THEN
    NEW.plant_category := 'fertilizer';
  ELSIF title_lower ~* 'grow light|led.*plant|ნათება.*მცენარ|phytolamp' THEN
    NEW.plant_category := 'lighting-grow';
  ELSIF title_lower ~* 'tool|scissors|spray|ხელსაწყო|მოვლა' THEN
    NEW.plant_category := 'tools-care';
  -- Fallback
  ELSIF NEW.item_type = 'PLANT' THEN
    NEW.plant_category := 'other-plant';
  ELSE
    NEW.plant_category := 'other-inventory';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to listings
DROP TRIGGER IF EXISTS trg_auto_plant_category ON public.listings;
CREATE TRIGGER trg_auto_plant_category
  BEFORE INSERT OR UPDATE OF title_ka, title_en
  ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_detect_plant_category();

-- 5. Backfill existing listings (run once)
UPDATE public.listings SET plant_category = plant_category WHERE TRUE;
-- (triggers will fire and auto-populate)
