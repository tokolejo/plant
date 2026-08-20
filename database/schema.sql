-- ==============================================================================
-- PlantSale.Ge - Complete Production Master Database Schema
-- Tech Stack: PostgreSQL 15+ with PostGIS, Supabase Auth, Storage & Strict RLS
-- ==============================================================================

-- 1. EXTENSIONS (Installed in dedicated extensions schema for clean security)
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA extensions;

-- 2. CUSTOM ENUMS
DO $$ BEGIN
    CREATE TYPE public.subscription_tier AS ENUM ('FREE', 'TIER_1', 'TIER_2', 'TIER_3');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.billing_cycle AS ENUM ('MONTHLY', 'YEARLY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.listing_status AS ENUM ('ACTIVE', 'HIDDEN', 'SOLD', 'DELETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.item_type AS ENUM ('PLANT', 'INVENTORY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.delivery_method AS ENUM ('PICKUP', 'COURIER', 'MARSHRUTKA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.transaction_type AS ENUM ('FIXED', 'NEGOTIABLE', 'TRADE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    bio TEXT,
    city TEXT DEFAULT 'თბილისი',
    
    -- Subscription & Shop Customization
    subscription_tier public.subscription_tier NOT NULL DEFAULT 'FREE',
    billing_cycle public.billing_cycle NOT NULL DEFAULT 'MONTHLY',
    subscription_expires_at TIMESTAMPTZ,
    custom_slug TEXT UNIQUE,
    banner_url TEXT,
    theme_preset TEXT DEFAULT 'emerald',
    social_links JSONB DEFAULT '{}'::jsonb,
    
    -- Gamification & Trust
    average_rating NUMERIC(3, 2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    badges TEXT[] DEFAULT '{}',
    is_admin BOOLEAN DEFAULT FALSE,
    
    -- Growth & Affiliates
    affiliate_code TEXT UNIQUE,
    referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    wallet_balance NUMERIC(10, 2) DEFAULT 0.00,
    
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. LISTINGS TABLE
CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Categorization & Multilingual Details
    item_type public.item_type NOT NULL DEFAULT 'PLANT',
    plant_category TEXT DEFAULT 'other-plant',
    title_ka TEXT NOT NULL,
    title_en TEXT,
    description_ka TEXT NOT NULL,
    description_en TEXT,
    
    -- Pricing & Transaction Model
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    transaction_type public.transaction_type NOT NULL DEFAULT 'FIXED',
    trade_preferences TEXT[] DEFAULT '{}',
    delivery_methods public.delivery_method[] NOT NULL DEFAULT '{PICKUP}',
    
    -- Media & Location
    images TEXT[] NOT NULL DEFAULT '{}',
    city TEXT NOT NULL DEFAULT 'თბილისი',
    address TEXT,
    location extensions.geography(Point, 4326),
    
    -- Status & Analytics
    status public.listing_status NOT NULL DEFAULT 'ACTIVE',
    views_count INTEGER NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    featured_until TIMESTAMPTZ,
    boost_tier TEXT DEFAULT 'STANDARD',
    
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    CONSTRAINT unique_reviewer_per_listing UNIQUE (reviewer_id, listing_id)
);

-- 6. ISO (IN SEARCH OF) REQUESTS
CREATE TABLE IF NOT EXISTS public.iso_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    budget_max NUMERIC(10, 2),
    images TEXT[] DEFAULT '{}',
    city TEXT DEFAULT 'თბილისი',
    status TEXT DEFAULT 'OPEN',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. DIRECT MESSAGING & CHATS
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_1 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    participant_2 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    last_message_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    CONSTRAINT unique_conversation_participants UNIQUE (participant_1, participant_2, listing_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    images TEXT[] DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON public.listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_city ON public.listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_plant_category ON public.listings(plant_category) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_listings_featured ON public.listings(is_featured, featured_until) WHERE status = 'ACTIVE' AND is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_listings_location_gist ON public.listings USING GIST(location);

CREATE INDEX IF NOT EXISTS idx_reviews_seller_id ON public.reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);

-- 9. VIEWS
CREATE OR REPLACE VIEW public.category_counts 
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

-- 10. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iso_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Listings Policies
DROP POLICY IF EXISTS "Active listings are viewable by everyone" ON public.listings;
CREATE POLICY "Active listings are viewable by everyone" ON public.listings FOR SELECT 
USING (status = 'ACTIVE' OR auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Authenticated users can create listings" ON public.listings;
CREATE POLICY "Authenticated users can create listings" ON public.listings FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own listings" ON public.listings;
CREATE POLICY "Users can update their own listings" ON public.listings FOR UPDATE USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Users can delete their own listings" ON public.listings;
CREATE POLICY "Users can delete their own listings" ON public.listings FOR DELETE USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Reviews Policies
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create reviews for sellers" ON public.reviews;
CREATE POLICY "Authenticated users can create reviews for sellers" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id AND auth.uid() <> seller_id);

DROP POLICY IF EXISTS "Reviewers can update their own reviews" ON public.reviews;
CREATE POLICY "Reviewers can update their own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Reviewers or admins can delete reviews" ON public.reviews;
CREATE POLICY "Reviewers or admins can delete reviews" ON public.reviews FOR DELETE USING (auth.uid() = reviewer_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Messages & Conversations Policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
CREATE POLICY "Users can view their own conversations" ON public.conversations FOR SELECT USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

DROP POLICY IF EXISTS "Users can start conversations" ON public.conversations;
CREATE POLICY "Users can start conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())));

DROP POLICY IF EXISTS "Users can insert messages into their conversations" ON public.messages;
CREATE POLICY "Users can insert messages into their conversations" ON public.messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())));

-- 11. SECURE DATABASE FUNCTIONS (With immutable search_path)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    clean_affiliate TEXT;
BEGIN
    clean_affiliate := LOWER(SUBSTRING(MD5(RANDOM()::TEXT || NEW.id::TEXT) FROM 1 FOR 8));
    INSERT INTO public.profiles (
        id, full_name, avatar_url, affiliate_code, subscription_tier, billing_cycle, average_rating, total_reviews, is_admin
    ) VALUES (
        NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.raw_user_meta_data->>'avatar_url', clean_affiliate, 'FREE', 'MONTHLY', 0.00, 0, FALSE
    ) ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_listing_tier_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    user_tier public.subscription_tier;
    current_count INTEGER;
    max_allowed INTEGER;
BEGIN
    IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND NEW.status = 'ACTIVE' AND OLD.status <> 'ACTIVE') THEN
        SELECT subscription_tier INTO user_tier FROM public.profiles WHERE id = NEW.user_id;
        SELECT COUNT(*) INTO current_count FROM public.listings WHERE user_id = NEW.user_id AND status = 'ACTIVE';

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

CREATE OR REPLACE FUNCTION public.auto_detect_plant_category()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
  title_lower TEXT;
BEGIN
  IF NEW.plant_category IS NOT NULL AND NEW.plant_category <> '' THEN
    RETURN NEW;
  END IF;

  title_lower := LOWER(COALESCE(NEW.title_ka, '') || ' ' || COALESCE(NEW.title_en, ''));

  IF title_lower ~* 'monstera' THEN NEW.plant_category := 'monstera';
  ELSIF title_lower ~* 'philodendron|philo' THEN NEW.plant_category := 'philodendron';
  ELSIF title_lower ~* 'anthurium' THEN NEW.plant_category := 'anthurium';
  ELSIF title_lower ~* 'alocasia|colocasia' THEN NEW.plant_category := 'alocasia';
  ELSIF title_lower ~* 'calathea|maranta|ctenanthe|stromanthe' THEN NEW.plant_category := 'calathea';
  ELSIF title_lower ~* 'pothos|epipremnum|scindapsus' THEN NEW.plant_category := 'pothos-scindapsus';
  ELSIF title_lower ~* 'orchid|orkide' THEN NEW.plant_category := 'orchid';
  ELSIF title_lower ~* 'bromelia|bromeliad|guzmania' THEN NEW.plant_category := 'bromeliad';
  ELSIF title_lower ~* 'ficus|fikus|lyrata|elastica' THEN NEW.plant_category := 'ficus';
  ELSIF title_lower ~* 'palm|palma|areca|chamaedorea' THEN NEW.plant_category := 'palm';
  ELSIF title_lower ~* 'fern|gvimra|nephrolepis' THEN NEW.plant_category := 'fern';
  ELSIF title_lower ~* 'cactus|kaktus|succulent|sukulent|echeveria|haworthia|sansevieria' THEN NEW.plant_category := 'cactus-succulent';
  ELSIF title_lower ~* 'rare|variegat|variegata|thai constellation|albo' THEN NEW.plant_category := 'rare-variegated';
  ELSIF title_lower ~* 'cutting|kalami|fesviani' THEN NEW.plant_category := 'cutting';
  ELSIF title_lower ~* 'outdoor|ezo|bagis|baRi' THEN NEW.plant_category := 'outdoor-garden';
  ELSIF title_lower ~* 'ceramic|keramik|keramikuli|pot|qotani' THEN NEW.plant_category := 'pots-ceramic';
  ELSIF title_lower ~* 'plastic|plastmas|plastikuri' THEN NEW.plant_category := 'pots-plastic';
  ELSIF title_lower ~* 'soil|substrat|grunt|perlit|perlite|kokos' THEN NEW.plant_category := 'substrate-soil';
  ELSIF title_lower ~* 'fertiliz|sasuqi|vitamini|care' THEN NEW.plant_category := 'fertilizer';
  ELSIF title_lower ~* 'tool|makrateli|shears|xelsawyo' THEN NEW.plant_category := 'tools-care';
  ELSIF title_lower ~* 'light|fito|grow light|ganateba' THEN NEW.plant_category := 'lighting-grow';
  ELSE NEW.plant_category := 'other-plant';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_outdated_boosts()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE public.listings
    SET is_featured = FALSE, boost_tier = 'STANDARD', updated_at = TIMEZONE('utc'::text, NOW())
    WHERE is_featured = TRUE AND featured_until IS NOT NULL AND featured_until <= TIMEZONE('utc'::text, NOW());
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_listing_featured_expiry()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
    IF NEW.is_featured = TRUE AND NEW.featured_until IS NOT NULL AND NEW.featured_until <= TIMEZONE('utc'::text, NOW()) THEN
        NEW.is_featured := FALSE;
        NEW.boost_tier := 'STANDARD';
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_listing_postgis_location()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
    IF NEW.location IS NULL THEN
        NEW.location := extensions.ST_SetSRID(extensions.ST_MakePoint(44.7871, 41.7151), 4326)::extensions.geography;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_nearby_listings(
    user_lat DOUBLE PRECISION,
    user_lng DOUBLE PRECISION,
    radius_km DOUBLE PRECISION DEFAULT NULL,
    item_type_filter TEXT DEFAULT NULL,
    plant_category_filter TEXT DEFAULT NULL,
    max_results INT DEFAULT 50
)
RETURNS TABLE (
    id UUID, user_id UUID, title_ka TEXT, title_en TEXT, price NUMERIC,
    item_type public.item_type, plant_category TEXT, transaction_type public.transaction_type,
    delivery_methods public.delivery_method[], images TEXT[], city TEXT, views_count INT,
    is_featured BOOLEAN, featured_until TIMESTAMPTZ, distance_meters DOUBLE PRECISION
)
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public, extensions, pg_temp AS $$
DECLARE
    user_geog extensions.geography;
BEGIN
    user_geog := extensions.ST_SetSRID(extensions.ST_MakePoint(user_lng, user_lat), 4326)::extensions.geography;
    RETURN QUERY
    SELECT 
        l.id, l.user_id, l.title_ka, l.title_en, l.price, l.item_type, l.plant_category,
        l.transaction_type, l.delivery_methods, l.images, l.city, l.views_count,
        l.is_featured, l.featured_until, extensions.ST_Distance(l.location, user_geog) AS distance_meters
    FROM public.listings l
    WHERE l.status = 'ACTIVE'
      AND (item_type_filter IS NULL OR l.item_type::text = item_type_filter)
      AND (plant_category_filter IS NULL OR l.plant_category = plant_category_filter)
      AND (radius_km IS NULL OR extensions.ST_DWithin(l.location, user_geog, radius_km * 1000))
    ORDER BY l.is_featured DESC, extensions.ST_Distance(l.location, user_geog) ASC
    LIMIT max_results;
END;
$$;

-- 12. PERMISSION RESTRICTIONS (REVOKES)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_listing_tier_limit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expire_outdated_boosts() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_listing_featured_expiry() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_listing_postgis_location() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_detect_plant_category() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_nearby_listings(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, TEXT, INT) TO anon, authenticated, service_role;
