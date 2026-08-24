-- ==============================================================================
-- 🌿 PLANT.GE — PROFILE EXTENSIONS & SOCIAL CHANNELS (2026)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Ensure all new profile fields exist in `profiles` table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{"whatsapp": "", "telegram": "", "instagram": "", "facebook": ""}'::jsonb,
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"emailInquiries": true, "emailUpdates": true}'::jsonb,
  ADD COLUMN IF NOT EXISTS shop_banner_url TEXT,
  ADD COLUMN IF NOT EXISTS shop_working_hours TEXT,
  ADD COLUMN IF NOT EXISTS shop_delivery_terms TEXT,
  ADD COLUMN IF NOT EXISTS is_verified_shop BOOLEAN DEFAULT FALSE;

-- 2. Populate first_name and last_name from existing full_name if empty
UPDATE public.profiles
SET 
  first_name = COALESCE(first_name, split_part(full_name, ' ', 1)),
  last_name = COALESCE(last_name, NULLIF(substr(full_name, length(split_part(full_name, ' ', 1)) + 2), ''))
WHERE full_name IS NOT NULL AND (first_name IS NULL OR last_name IS NULL);

-- 3. Notify completion
DO $$ BEGIN
  RAISE NOTICE '✅ Profiles table extended successfully with all modern social, contact and store fields!';
END $$;
