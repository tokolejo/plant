-- ==============================================================================
-- Plantio / PlantSale.Ge - Core Module: Smart Offers & Trades + Botanical Care
-- Migration: Phase 1 (SQL Script)
-- ==============================================================================

-- 1. EXTEND LISTING STATUS ENUM WITH 'RESERVED' (IF NOT PRESENT)
DO $$ BEGIN
    ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'RESERVED';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. CREATE TRADE OFFER STATUS ENUM
DO $$ BEGIN
    CREATE TYPE public.trade_offer_status AS ENUM ('pending', 'accepted', 'countered', 'declined', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. CREATE SMART OFFERS & TRADES TABLE (trade_offers)
CREATE TABLE IF NOT EXISTS public.trade_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    offered_listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    requested_listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    offered_price NUMERIC(10, 2),
    cash_difference NUMERIC(10, 2) DEFAULT 0.00,
    status public.trade_offer_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. BOTANICAL & AI CARE ENHANCEMENTS ON LISTINGS TABLE
ALTER TABLE public.listings
    ADD COLUMN IF NOT EXISTS botanical_name TEXT,
    ADD COLUMN IF NOT EXISTS watering_schedule TEXT,
    ADD COLUMN IF NOT EXISTS light_requirement TEXT,
    ADD COLUMN IF NOT EXISTS care_difficulty TEXT,
    ADD COLUMN IF NOT EXISTS plantnet_id TEXT;

-- 5. AUTOMATED RESERVATION & AUTO-DECLINE TRIGGER ON ACCEPTED OFFERS
CREATE OR REPLACE FUNCTION public.handle_trade_offer_accepted()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Only trigger when offer status transitions to 'accepted'
    IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status <> 'accepted') THEN
        -- 1. Automatically update requested listing status to 'RESERVED'
        UPDATE public.listings
        SET status = 'RESERVED',
            updated_at = TIMEZONE('utc'::text, NOW())
        WHERE id = NEW.requested_listing_id;

        -- 2. If a swap plant was offered, reserve offered listing too
        IF NEW.offered_listing_id IS NOT NULL THEN
            UPDATE public.listings
            SET status = 'RESERVED',
                updated_at = TIMEZONE('utc'::text, NOW())
            WHERE id = NEW.offered_listing_id;
        END IF;

        -- 3. Auto-decline other concurrent pending offers for this listing
        UPDATE public.trade_offers
        SET status = 'declined',
            updated_at = TIMEZONE('utc'::text, NOW())
        WHERE requested_listing_id = NEW.requested_listing_id
          AND id <> NEW.id
          AND status = 'pending';
    END IF;

    -- Update updated_at timestamp on any row change
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trade_offer_accepted ON public.trade_offers;
CREATE TRIGGER trg_trade_offer_accepted
    BEFORE UPDATE OR INSERT ON public.trade_offers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_trade_offer_accepted();

-- 6. REALTIME SUBSCRIPTION FOR IN-CHAT OFFER CARDS
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_offers;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null;
END $$;

-- 7. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_trade_offers_chat_id ON public.trade_offers(chat_id);
CREATE INDEX IF NOT EXISTS idx_trade_offers_sender_id ON public.trade_offers(sender_id);
CREATE INDEX IF NOT EXISTS idx_trade_offers_receiver_id ON public.trade_offers(receiver_id);
CREATE INDEX IF NOT EXISTS idx_trade_offers_requested_listing ON public.trade_offers(requested_listing_id);
CREATE INDEX IF NOT EXISTS idx_trade_offers_status ON public.trade_offers(status);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.trade_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view their trade offers" ON public.trade_offers;
CREATE POLICY "Participants can view their trade offers" ON public.trade_offers
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can create trade offers" ON public.trade_offers;
CREATE POLICY "Users can create trade offers" ON public.trade_offers
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Participants can update trade offers" ON public.trade_offers;
CREATE POLICY "Participants can update trade offers" ON public.trade_offers
    FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
