-- ==============================================================================
-- Migration: Automatic VIP Boost Expiration Function & Background Routine
-- Automatically demotes expired featured/VIP listings back to standard
-- ==============================================================================

-- 1. Create a function to expire outdated boosts
CREATE OR REPLACE FUNCTION public.expire_outdated_boosts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE public.listings
    SET 
        is_featured = FALSE,
        boost_tier = 'STANDARD',
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE 
        is_featured = TRUE 
        AND featured_until IS NOT NULL 
        AND featured_until <= TIMEZONE('utc'::text, NOW());
        
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows;
END;
$$;

-- 2. Create a secure trigger that runs whenever listings are queried or updated
CREATE OR REPLACE FUNCTION public.check_listing_featured_expiry()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.is_featured = TRUE AND NEW.featured_until IS NOT NULL AND NEW.featured_until <= TIMEZONE('utc'::text, NOW()) THEN
        NEW.is_featured := FALSE;
        NEW.boost_tier := 'STANDARD';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_check_listing_featured_expiry ON public.listings;
CREATE TRIGGER trigger_check_listing_featured_expiry
BEFORE UPDATE ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.check_listing_featured_expiry();

-- 3. Create a view for actively boosted listings only
CREATE OR REPLACE VIEW public.active_boosted_listings AS
SELECT *
FROM public.listings
WHERE status = 'ACTIVE' 
  AND is_featured = TRUE 
  AND (featured_until IS NULL OR featured_until > TIMEZONE('utc'::text, NOW()));

COMMENT ON FUNCTION public.expire_outdated_boosts() IS 'Called via cron or RPC to expire outdated VIP promotions';
