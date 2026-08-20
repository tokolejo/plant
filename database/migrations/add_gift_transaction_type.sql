-- ==============================================================================
-- Migration: Add 'GIFT' Transaction Type for Free Plant Giveaways
-- Allows users to give away free plants/cuttings to community members
-- ==============================================================================

DO $$ BEGIN
    ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'GIFT';
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null;
END $$;
