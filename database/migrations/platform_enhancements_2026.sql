-- ==============================================================================
-- 🌿 PLANT.GE — COMPLETE PLATFORM ENHANCEMENTS MIGRATION (2026)
-- Run this script in the Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. EXTEND LISTINGS TABLE (Analytics, Bumping, Discounts & Statuses)
ALTER TABLE public.listings 
  ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS saves_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phone_clicks_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_price NUMERIC,
  ADD COLUMN IF NOT EXISTS last_bumped_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';

-- Add index on listings status and bumped time for ultra-fast catalog sorting
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_last_bumped_at ON public.listings(last_bumped_at DESC);

-- 2. EXTEND PROFILES TABLE (Shop Banners, Working Hours, Terms & Verified Status)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS shop_banner_url TEXT,
  ADD COLUMN IF NOT EXISTS shop_working_hours TEXT,
  ADD COLUMN IF NOT EXISTS shop_delivery_terms TEXT,
  ADD COLUMN IF NOT EXISTS is_verified_shop BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "push": true, "offers": true}'::jsonb;

-- 3. CREATE VIRTUAL GREENHOUSE & PLANT CARE CALENDAR (User Plants)
CREATE TABLE IF NOT EXISTS public.user_plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  species_name TEXT,
  image_url TEXT,
  watering_frequency_days INTEGER DEFAULT 7,
  last_watered_at TIMESTAMPTZ DEFAULT NOW(),
  next_watering_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_plants_user_id ON public.user_plants(user_id);

-- Enable RLS for user_plants
ALTER TABLE public.user_plants ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_plants' AND policyname = 'Users can view own plants'
  ) THEN
    CREATE POLICY "Users can view own plants" ON public.user_plants
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_plants' AND policyname = 'Users can insert own plants'
  ) THEN
    CREATE POLICY "Users can insert own plants" ON public.user_plants
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_plants' AND policyname = 'Users can update own plants'
  ) THEN
    CREATE POLICY "Users can update own plants" ON public.user_plants
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_plants' AND policyname = 'Users can delete own plants'
  ) THEN
    CREATE POLICY "Users can delete own plants" ON public.user_plants
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 4. SAFE RPC FUNCTIONS FOR REAL-TIME METRICS & BUMPING

-- Increment Listing Page Views (Callable by anyone viewing listing)
CREATE OR REPLACE FUNCTION public.increment_listing_views(p_listing_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.listings
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_listing_id;
END;
$$;

-- Increment Phone / WhatsApp Contact Clicks
CREATE OR REPLACE FUNCTION public.increment_listing_phone_clicks(p_listing_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.listings
  SET phone_clicks_count = COALESCE(phone_clicks_count, 0) + 1
  WHERE id = p_listing_id;
END;
$$;

-- 1-Click Bump Up Listing (Refreshes listing to the top of catalog, 24h cooldown)
CREATE OR REPLACE FUNCTION public.bump_listing(p_listing_id UUID, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_bumped TIMESTAMPTZ;
  v_cooldown_hours INTEGER := 24;
  v_diff_seconds NUMERIC;
BEGIN
  -- Verify ownership
  SELECT last_bumped_at INTO v_last_bumped
  FROM public.listings
  WHERE id = p_listing_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'განცხადება ვერ მოიძებნა ან არ გაქვთ წვდომა');
  END IF;

  -- Check cooldown
  IF v_last_bumped IS NOT NULL THEN
    v_diff_seconds := EXTRACT(EPOCH FROM (NOW() - v_last_bumped));
    IF v_diff_seconds < (v_cooldown_hours * 3600) THEN
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'განცხადების განახლება შესაძლებელია 24 საათში ერთხელ',
        'remaining_minutes', ROUND(((v_cooldown_hours * 3600) - v_diff_seconds) / 60)
      );
    END IF;
  END IF;

  -- Apply bump
  UPDATE public.listings
  SET 
    last_bumped_at = NOW(),
    created_at = NOW()
  WHERE id = p_listing_id AND user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'განცხადება წარმატებით ამოიწია თავში!');
END;
$$;

-- Grant execution to authenticated & anon roles
GRANT EXECUTE ON FUNCTION public.increment_listing_views(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_listing_phone_clicks(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bump_listing(UUID, UUID) TO authenticated;
