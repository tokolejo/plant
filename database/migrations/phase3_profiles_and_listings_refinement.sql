-- ==============================================================================
-- Plantio / PlantSale.Ge - Refinement: Profiles, Phone Sync & Botanical Care
-- Migration: Phase 1 (Targeted SQL Script)
-- ==============================================================================

-- 1. EXTEND PROFILES TABLE
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS first_name TEXT,
    ADD COLUMN IF NOT EXISTS last_name TEXT,
    ADD COLUMN IF NOT EXISTS location TEXT;

-- Auto-populate first_name and last_name from existing full_name if available
UPDATE public.profiles
SET 
    first_name = COALESCE(NULLIF(first_name, ''), split_part(full_name, ' ', 1)),
    last_name = COALESCE(NULLIF(last_name, ''), NULLIF(substr(full_name, length(split_part(full_name, ' ', 1)) + 2), ''))
WHERE full_name IS NOT NULL AND full_name <> '' AND (first_name IS NULL OR first_name = '');

-- Profile Full Name Sync Trigger Function
CREATE OR REPLACE FUNCTION public.handle_profile_full_name_sync()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- If first_name or last_name updated, keep full_name synchronized
    IF NEW.first_name IS NOT NULL OR NEW.last_name IS NOT NULL THEN
        NEW.full_name = TRIM(CONCAT_WS(' ', COALESCE(NEW.first_name, ''), COALESCE(NEW.last_name, '')));
    END IF;
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_full_name_sync ON public.profiles;
CREATE TRIGGER trg_profile_full_name_sync
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_profile_full_name_sync();

-- 2. EXTEND LISTINGS TABLE FOR CONTACT PHONE & STRUCTURED CARE
ALTER TABLE public.listings
    ADD COLUMN IF NOT EXISTS contact_phone TEXT,
    ADD COLUMN IF NOT EXISTS botanical_name TEXT,
    ADD COLUMN IF NOT EXISTS common_name TEXT,
    ADD COLUMN IF NOT EXISTS watering_schedule TEXT,
    ADD COLUMN IF NOT EXISTS light_requirement TEXT,
    ADD COLUMN IF NOT EXISTS care_difficulty TEXT,
    ADD COLUMN IF NOT EXISTS toxicity TEXT;

-- 3. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_listings_contact_phone ON public.listings(contact_phone);

-- 4. ROW LEVEL SECURITY POLICIES ENSURANCE
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can view public info, users can edit only their own
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.profiles FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Listings: Users can update their own listings
DROP POLICY IF EXISTS "Users can update their own listings" ON public.listings;
CREATE POLICY "Users can update their own listings" 
    ON public.listings FOR UPDATE 
    USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
