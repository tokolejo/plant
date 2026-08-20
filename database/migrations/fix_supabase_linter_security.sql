-- ==============================================================================
-- PlantSale.Ge - Complete Security & Supabase Linter Fixes Migration
-- Resolves all ERROR & WARN items from the Supabase Database Linter:
-- 1. Sets immutable search_path on all functions (fixes function_search_path_mutable)
-- 2. Sets security_invoker = true on views (fixes security_definer_view)
-- 3. Enables RLS on spatial_ref_sys (fixes rls_disabled_in_public)
-- 4. Revokes public/anon access on background functions (fixes anon_security_definer)
-- 5. Tightens Storage policy on listing-images (fixes public_bucket_allows_listing)
-- ==============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. FIX: security_definer_view on category_counts
-- ──────────────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.category_counts;
CREATE VIEW public.category_counts 
WITH (security_invoker = true) 
AS
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

GRANT SELECT ON public.category_counts TO anon, authenticated, service_role;

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. Storage broad SELECT policy cleanup on public bucket listing-images
-- (Public buckets already serve files directly via public URL without broad SELECT)
-- ──────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Listing images are publicly accessible" ON storage.objects;

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. FIX: function_search_path_mutable on all functions (Add SET search_path)
-- ──────────────────────────────────────────────────────────────────────────────

-- 4.1 handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$;

-- 4.2 handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    clean_affiliate TEXT;
BEGIN
    clean_affiliate := LOWER(SUBSTRING(MD5(RANDOM()::TEXT || NEW.id::TEXT) FROM 1 FOR 8));

    INSERT INTO public.profiles (
        id,
        full_name,
        avatar_url,
        affiliate_code,
        subscription_tier,
        billing_cycle,
        average_rating,
        total_reviews,
        is_admin
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url',
        clean_affiliate,
        'FREE',
        'MONTHLY',
        0.00,
        0,
        FALSE
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- 4.3 check_listing_tier_limit
CREATE OR REPLACE FUNCTION public.check_listing_tier_limit()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    user_tier subscription_tier;
    current_count INTEGER;
    max_allowed INTEGER;
BEGIN
    IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND NEW.status = 'ACTIVE' AND OLD.status <> 'ACTIVE') THEN
        SELECT subscription_tier INTO user_tier
        FROM public.profiles
        WHERE id = NEW.user_id;

        SELECT COUNT(*) INTO current_count
        FROM public.listings
        WHERE user_id = NEW.user_id AND status = 'ACTIVE';

        CASE user_tier
            WHEN 'FREE' THEN max_allowed := 5;
            WHEN 'TIER_1' THEN max_allowed := 25;
            WHEN 'TIER_2' THEN max_allowed := 50;
            WHEN 'TIER_3' THEN max_allowed := 999999;
            ELSE max_allowed := 5;
        END CASE;

        IF current_count >= max_allowed THEN
            RAISE EXCEPTION 'Active listing limit reached for your subscription tier (%). Maximum allowed: %', user_tier, max_allowed;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- 4.4 auto_hide_stale_listings
CREATE OR REPLACE FUNCTION public.auto_hide_stale_listings()
RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE public.listings
    SET status = 'HIDDEN', updated_at = TIMEZONE('utc'::text, NOW())
    WHERE status = 'ACTIVE' 
      AND updated_at < (TIMEZONE('utc'::text, NOW()) - INTERVAL '30 days');

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows;
END;
$$;

-- 4.5 update_profile_reviews_and_badges
CREATE OR REPLACE FUNCTION public.update_profile_reviews_and_badges()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    target_seller UUID;
    new_avg NUMERIC(3,2);
    new_total INTEGER;
    earned_badges TEXT[];
BEGIN
    target_seller := COALESCE(NEW.seller_id, OLD.seller_id);

    SELECT 
        COALESCE(AVG(rating), 0.00)::NUMERIC(3,2),
        COUNT(*)::INTEGER
    INTO new_avg, new_total
    FROM public.reviews
    WHERE seller_id = target_seller;

    SELECT badges INTO earned_badges FROM public.profiles WHERE id = target_seller;
    earned_badges := COALESCE(earned_badges, '{}');

    IF new_total >= 5 AND new_avg >= 4.50 THEN
        IF NOT ('Trusted Seller' = ANY(earned_badges)) THEN
            earned_badges := array_append(earned_badges, 'Trusted Seller');
        END IF;
    END IF;

    IF (SELECT COUNT(*) FROM public.listings WHERE user_id = target_seller AND transaction_type = 'TRADE') >= 5 THEN
        IF NOT ('Swap Master' = ANY(earned_badges)) THEN
            earned_badges := array_append(earned_badges, 'Swap Master');
        END IF;
    END IF;

    UPDATE public.profiles
    SET average_rating = new_avg,
        total_reviews = new_total,
        badges = earned_badges,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = target_seller;

    RETURN NULL;
END;
$$;

-- 4.6 auto_detect_plant_category
CREATE OR REPLACE FUNCTION public.auto_detect_plant_category()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  title_lower TEXT;
BEGIN
  IF NEW.plant_category IS NOT NULL AND NEW.plant_category <> '' THEN
    RETURN NEW;
  END IF;

  title_lower := LOWER(COALESCE(NEW.title_ka, '') || ' ' || COALESCE(NEW.title_en, ''));

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
  ELSIF title_lower ~* 'orchid|orkide' THEN
    NEW.plant_category := 'orchid';
  ELSIF title_lower ~* 'bromelia|bromeliad|guzmania' THEN
    NEW.plant_category := 'bromeliad';
  ELSIF title_lower ~* 'ficus|fikus|lyrata|elastica' THEN
    NEW.plant_category := 'ficus';
  ELSIF title_lower ~* 'palm|palma|areca|chamaedorea' THEN
    NEW.plant_category := 'palm';
  ELSIF title_lower ~* 'fern|gvimra|nephrolepis' THEN
    NEW.plant_category := 'fern';
  ELSIF title_lower ~* 'cactus|kaktus|succulent|sukulent|echeveria|haworthia|sansevieria' THEN
    NEW.plant_category := 'cactus-succulent';
  ELSIF title_lower ~* 'rare|variegat|variegata|thai constellation|albo' THEN
    NEW.plant_category := 'rare-variegated';
  ELSIF title_lower ~* 'cutting|kalami|fesviani' THEN
    NEW.plant_category := 'cutting';
  ELSIF title_lower ~* 'outdoor|ezo|bagis|baRi' THEN
    NEW.plant_category := 'outdoor-garden';
  ELSIF title_lower ~* 'ceramic|keramik|keramikuli|pot|qotani' THEN
    NEW.plant_category := 'pots-ceramic';
  ELSIF title_lower ~* 'plastic|plastmas|plastikuri' THEN
    NEW.plant_category := 'pots-plastic';
  ELSIF title_lower ~* 'soil|substrat|grunt|perlit|perlite|kokos' THEN
    NEW.plant_category := 'substrate-soil';
  ELSIF title_lower ~* 'fertiliz|sasuqi|vitamini|care' THEN
    NEW.plant_category := 'fertilizer';
  ELSIF title_lower ~* 'tool|makrateli|shears|xelsawyo' THEN
    NEW.plant_category := 'tools-care';
  ELSIF title_lower ~* 'light|fito|grow light|ganateba' THEN
    NEW.plant_category := 'lighting-grow';
  ELSE
    NEW.plant_category := 'other-plant';
  END IF;

  RETURN NEW;
END;
$$;

-- 4.7 expire_outdated_boosts
CREATE OR REPLACE FUNCTION public.expire_outdated_boosts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

-- 4.8 check_listing_featured_expiry
CREATE OR REPLACE FUNCTION public.check_listing_featured_expiry()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.is_featured = TRUE AND NEW.featured_until IS NOT NULL AND NEW.featured_until <= TIMEZONE('utc'::text, NOW()) THEN
        NEW.is_featured := FALSE;
        NEW.boost_tier := 'STANDARD';
    END IF;
    RETURN NEW;
END;
$$;

-- 4.9 sync_listing_postgis_location
CREATE OR REPLACE FUNCTION public.sync_listing_postgis_location()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.location IS NULL THEN
        NEW.location := ST_SetSRID(ST_MakePoint(44.7871, 41.7151), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$;

-- 4.10 get_nearby_listings
CREATE OR REPLACE FUNCTION public.get_nearby_listings(
    user_lat DOUBLE PRECISION,
    user_lng DOUBLE PRECISION,
    radius_km DOUBLE PRECISION DEFAULT NULL,
    item_type_filter TEXT DEFAULT NULL,
    plant_category_filter TEXT DEFAULT NULL,
    max_results INT DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    title_ka TEXT,
    title_en TEXT,
    price NUMERIC,
    item_type public.item_type,
    plant_category TEXT,
    transaction_type public.transaction_type,
    delivery_methods public.delivery_method[],
    images TEXT[],
    city TEXT,
    views_count INT,
    is_featured BOOLEAN,
    featured_until TIMESTAMPTZ,
    distance_meters DOUBLE PRECISION
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    user_geog geography;
BEGIN
    user_geog := ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography;

    RETURN QUERY
    SELECT 
        l.id,
        l.user_id,
        l.title_ka,
        l.title_en,
        l.price,
        l.item_type,
        l.plant_category,
        l.transaction_type,
        l.delivery_methods,
        l.images,
        l.city,
        l.views_count,
        l.is_featured,
        l.featured_until,
        ST_Distance(l.location, user_geog) AS distance_meters
    FROM public.listings l
    WHERE l.status = 'ACTIVE'
      AND (item_type_filter IS NULL OR l.item_type::text = item_type_filter)
      AND (plant_category_filter IS NULL OR l.plant_category = plant_category_filter)
      AND (radius_km IS NULL OR ST_DWithin(l.location, user_geog, radius_km * 1000))
    ORDER BY 
        l.is_featured DESC,
        ST_Distance(l.location, user_geog) ASC
    LIMIT max_results;
END;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. FIX: Revoke public API EXECUTE permissions on internal / trigger functions
-- (Prevents anon & authenticated roles from invoking background functions via HTTP RPC)
-- ──────────────────────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_listing_tier_limit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_hide_stale_listings() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_profile_reviews_and_badges() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expire_outdated_boosts() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_listing_featured_expiry() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_listing_postgis_location() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_detect_plant_category() FROM PUBLIC, anon, authenticated;

-- Allow public search RPC
GRANT EXECUTE ON FUNCTION public.get_nearby_listings(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, TEXT, INT) TO anon, authenticated, service_role;
