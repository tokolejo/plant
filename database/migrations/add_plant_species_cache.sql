-- ==============================================================================
-- Plant Species Description Cache Table
-- Stores AI-generated plant descriptions keyed by scientific name
-- Avoids repeated Gemini API calls for the same species
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.plant_species_cache (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  scientific_name text NOT NULL,
  genus text,
  common_name_en text,
  name_ka text,
  description_ka text NOT NULL,
  description_en text,
  plant_category text,
  care_tips_ka text,
  hit_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Unique index on scientific name (case-insensitive) for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_plant_species_cache_scientific_name
  ON public.plant_species_cache (lower(scientific_name));

-- Index for genus-level fallback lookups
CREATE INDEX IF NOT EXISTS idx_plant_species_cache_genus
  ON public.plant_species_cache (lower(genus));

-- Auto-update updated_at on upsert
CREATE OR REPLACE FUNCTION public.update_plant_cache_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_plant_cache_updated_at ON public.plant_species_cache;
CREATE TRIGGER trg_plant_cache_updated_at
  BEFORE UPDATE ON public.plant_species_cache
  FOR EACH ROW EXECUTE FUNCTION public.update_plant_cache_updated_at();

-- RLS: public read, no user write (only server-side service role inserts)
ALTER TABLE public.plant_species_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plant_cache_public_read" ON public.plant_species_cache;
CREATE POLICY "plant_cache_public_read"
  ON public.plant_species_cache
  FOR SELECT TO public USING (true);

-- Only service role (server) can insert/update
DROP POLICY IF EXISTS "plant_cache_service_write" ON public.plant_species_cache;
CREATE POLICY "plant_cache_service_write"
  ON public.plant_species_cache
  FOR ALL TO service_role USING (true) WITH CHECK (true);
