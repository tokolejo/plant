-- ==============================================================================
-- 🌿 DATABASE EXTENSIONS FOR LISTINGS (Supabase SQL Editor)
-- 
-- Adds optional columns for explicit inventory categories and trade tags 
-- to ensure full compatibility across all queries and views.
-- ==============================================================================

-- 1. Ensure inventory_category column exists on public.listings
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS inventory_category TEXT;

-- 2. Ensure trade_preferences and trade_tags columns exist on public.listings
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS trade_preferences TEXT[] DEFAULT '{}';

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS trade_tags TEXT[] DEFAULT '{}';

-- 3. Ensure transaction_type enum or text supports 'GIFT', 'FIXED', 'NEGOTIABLE', 'TRADE'
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'transaction_type' AND e.enumlabel = 'GIFT'
    ) THEN
        BEGIN
            ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'GIFT';
        EXCEPTION
            WHEN duplicate_object THEN null;
            WHEN undefined_object THEN null;
        END;
    END IF;
END $$;

-- 4. Reload PostgREST Schema Cache so changes take effect immediately
NOTIFY pgrst, 'reload schema';
