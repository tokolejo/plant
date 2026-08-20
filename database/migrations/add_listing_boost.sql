-- ==============================================================================
-- Migration: Add Listing Boost / VIP / Featured Support
-- Allows sellers to purchase temporary top placement / featured badges
-- ==============================================================================

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS boost_tier TEXT DEFAULT 'STANDARD'; -- 'STANDARD', 'VIP_24H', 'VIP_7D', 'TOP_SPOT'

-- Create index to quickly fetch active boosted listings
CREATE INDEX IF NOT EXISTS idx_listings_featured ON public.listings(is_featured, featured_until) 
WHERE status = 'ACTIVE' AND is_featured = TRUE;

COMMENT ON COLUMN public.listings.is_featured IS 'True if listing currently has an active paid boost/VIP promotion';
COMMENT ON COLUMN public.listings.featured_until IS 'Timestamp when the premium promotion expires';
COMMENT ON COLUMN public.listings.boost_tier IS 'Tier of promotion, e.g. VIP_24H, VIP_7D, TOP_SPOT';
