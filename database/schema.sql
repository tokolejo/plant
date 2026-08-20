-- ==============================================================================
-- PlantSale.Ge - Complete Production Database Schema
-- Tech Stack: PostgreSQL 15+ with PostGIS, Supabase Auth & RLS
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. CUSTOM ENUMS
DO $$ BEGIN
    CREATE TYPE subscription_tier AS ENUM ('FREE', 'TIER_1', 'TIER_2', 'TIER_3');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE billing_cycle AS ENUM ('MONTHLY', 'YEARLY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE listing_status AS ENUM ('ACTIVE', 'HIDDEN', 'SOLD', 'DELETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE item_type AS ENUM ('PLANT', 'INVENTORY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE delivery_method AS ENUM ('PICKUP', 'COURIER', 'MARSHRUTKA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('FIXED', 'NEGOTIABLE', 'TRADE');
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
    city TEXT DEFAULT 'Tbilisi',
    
    -- Subscription & Shop Customization
    subscription_tier subscription_tier NOT NULL DEFAULT 'FREE',
    billing_cycle billing_cycle NOT NULL DEFAULT 'MONTHLY',
    subscription_expires_at TIMESTAMPTZ,
    custom_slug TEXT UNIQUE, -- Custom shop URL slug for TIER_2 and TIER_3
    
    -- Affiliate / Referral Logic
    affiliate_code TEXT UNIQUE NOT NULL,
    referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Ratings, Reviews & Gamification
    average_rating NUMERIC(3,2) NOT NULL DEFAULT 0.00 CHECK (average_rating >= 0.00 AND average_rating <= 5.00),
    total_reviews INTEGER NOT NULL DEFAULT 0 CHECK (total_reviews >= 0),
    badges TEXT[] NOT NULL DEFAULT '{}', -- e.g. 'Green Thumb', 'Trusted Seller', 'Swap Master'
    
    -- Roles & Metadata
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Indexing for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_custom_slug ON public.profiles(custom_slug) WHERE custom_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_affiliate_code ON public.profiles(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);

-- 4. LISTINGS TABLE
CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Bilingual Content
    title_ka TEXT NOT NULL,
    title_en TEXT NOT NULL,
    description_ka TEXT,
    description_en TEXT,
    
    -- Classification & Financials
    item_type item_type NOT NULL DEFAULT 'PLANT',
    status listing_status NOT NULL DEFAULT 'ACTIVE',
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
    transaction_type transaction_type NOT NULL DEFAULT 'FIXED',
    
    -- Delivery & Location
    delivery_methods delivery_method[] NOT NULL DEFAULT '{PICKUP}',
    location geography(Point, 4326),
    city TEXT NOT NULL DEFAULT 'Tbilisi',
    address TEXT,
    
    -- Media & Trade
    images TEXT[] NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    trade_preferences TEXT[] NOT NULL DEFAULT '{}', -- Desired tags if transaction_type = 'TRADE'
    
    -- Analytics & Timestamps
    views_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    
    -- Constraints
    CONSTRAINT check_listing_images_count CHECK (cardinality(images) >= 2 AND cardinality(images) <= 5)
);

-- Indexing for listings
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON public.listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_item_type ON public.listings(item_type);
CREATE INDEX IF NOT EXISTS idx_listings_transaction_type ON public.listings(transaction_type);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_updated_at ON public.listings(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_location ON public.listings USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_listings_tags ON public.listings USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_listings_trade_pref ON public.listings USING GIN(trade_preferences);

-- 5. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    
    CONSTRAINT check_cannot_review_self CHECK (reviewer_id <> seller_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_seller_id ON public.reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);

-- 6. ISO (IN SEARCH OF) / TRADE MATCHMAKING BOARD
CREATE TABLE IF NOT EXISTS public.iso_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    desired_tags TEXT[] NOT NULL DEFAULT '{}',
    budget_max NUMERIC(10,2),
    location geography(Point, 4326),
    city TEXT DEFAULT 'Tbilisi',
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'FULFILLED', 'CLOSED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_iso_user_id ON public.iso_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_iso_desired_tags ON public.iso_requests USING GIN(desired_tags);
CREATE INDEX IF NOT EXISTS idx_iso_location ON public.iso_requests USING GIST(location);

-- 7. CONVERSATIONS & MESSAGING
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    participant_1 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    participant_2 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    
    CONSTRAINT check_different_participants CHECK (participant_1 <> participant_2),
    CONSTRAINT unique_conversation_pair UNIQUE (listing_id, participant_1, participant_2)
);

CREATE INDEX IF NOT EXISTS idx_conv_participant_1 ON public.conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_conv_participant_2 ON public.conversations(participant_2);
CREATE INDEX IF NOT EXISTS idx_conv_last_message ON public.conversations(last_message_at DESC);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at ASC);

-- ==============================================================================
-- 8. AUTOMATION FUNCTIONS & TRIGGERS
-- ==============================================================================

-- A. Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_listings_updated_at
    BEFORE UPDATE ON public.listings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_iso_updated_at
    BEFORE UPDATE ON public.iso_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- B. Automatically create Profile on Auth Signup with Unique Affiliate Code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_affiliate_code TEXT;
    referred_by_uuid UUID;
    is_admin_user BOOLEAN;
BEGIN
    -- Check if admin user
    is_admin_user := (NEW.email = 'tokolejo@gmail.com');

    -- Generate unique affiliate code (e.g. GEO-PLANT-XXXXXX)
    new_affiliate_code := 'GEO-' || UPPER(SUBSTRING(MD5(NEW.id::text || NOW()::text) FROM 1 FOR 6));
    
    -- Check if referrer code was passed in user metadata
    IF NEW.raw_user_meta_data->>'referred_by_code' IS NOT NULL THEN
        SELECT id INTO referred_by_uuid 
        FROM public.profiles 
        WHERE affiliate_code = NEW.raw_user_meta_data->>'referred_by_code';
    END IF;

    INSERT INTO public.profiles (
        id,
        full_name,
        avatar_url,
        phone,
        affiliate_code,
        referred_by,
        subscription_tier,
        billing_cycle,
        is_admin
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Plant Lover'),
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'phone',
        new_affiliate_code,
        referred_by_uuid,
        CASE WHEN is_admin_user THEN 'TIER_3'::subscription_tier ELSE 'FREE'::subscription_tier END,
        'MONTHLY',
        is_admin_user
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- C. Enforce Subscription Tier Active Listing Limits
CREATE OR REPLACE FUNCTION public.check_listing_tier_limit()
RETURNS TRIGGER AS $$
DECLARE
    user_tier subscription_tier;
    max_allowed INTEGER;
    current_active_count INTEGER;
BEGIN
    -- Only check if the listing is or is becoming ACTIVE
    IF NEW.status = 'ACTIVE' THEN
        -- Get user's subscription tier
        SELECT subscription_tier INTO user_tier
        FROM public.profiles
        WHERE id = NEW.user_id;

        -- Determine allowed active listings count
        CASE user_tier
            WHEN 'FREE' THEN max_allowed := 5;
            WHEN 'TIER_1' THEN max_allowed := 20;
            WHEN 'TIER_2' THEN max_allowed := 50;
            WHEN 'TIER_3' THEN max_allowed := 150;
            ELSE max_allowed := 5;
        END CASE;

        -- Count existing ACTIVE listings for this user (excluding the current one if updating)
        SELECT COUNT(*) INTO current_active_count
        FROM public.listings
        WHERE user_id = NEW.user_id
          AND status = 'ACTIVE'
          AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

        IF current_active_count >= max_allowed THEN
            RAISE EXCEPTION 'Active listing limit reached for tier %. Max allowed: %', user_tier, max_allowed;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_listing_tier_limit
    BEFORE INSERT OR UPDATE ON public.listings
    FOR EACH ROW EXECUTE FUNCTION public.check_listing_tier_limit();

-- D. Auto-Hide Stale Listings (Older than 30 days without update)
CREATE OR REPLACE FUNCTION public.auto_hide_stale_listings()
RETURNS INTEGER AS $$
DECLARE
    affected_count INTEGER;
BEGIN
    UPDATE public.listings
    SET status = 'HIDDEN',
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE status = 'ACTIVE'
      AND updated_at < (TIMEZONE('utc'::text, NOW()) - INTERVAL '30 days');

    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RETURN affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- E. Calculate Seller Rating and Badges on Review Insertion/Update
CREATE OR REPLACE FUNCTION public.update_profile_reviews_and_badges()
RETURNS TRIGGER AS $$
DECLARE
    target_seller_id UUID;
    calc_avg NUMERIC(3,2);
    calc_total INTEGER;
    new_badges TEXT[];
BEGIN
    target_seller_id := COALESCE(NEW.seller_id, OLD.seller_id);

    SELECT 
        COALESCE(ROUND(AVG(rating)::numeric, 2), 0.00),
        COUNT(*)
    INTO calc_avg, calc_total
    FROM public.reviews
    WHERE seller_id = target_seller_id;

    -- Compute gamified badges
    new_badges := '{}'::text[];
    IF calc_total >= 1 THEN
        new_badges := array_append(new_badges, 'Green Thumb');
    END IF;
    IF calc_total >= 10 AND calc_avg >= 4.8 THEN
        new_badges := array_append(new_badges, 'Trusted Seller');
    END IF;
    IF EXISTS (
        SELECT 1 FROM public.listings 
        WHERE user_id = target_seller_id AND transaction_type = 'TRADE' AND status = 'SOLD'
    ) THEN
        new_badges := array_append(new_badges, 'Swap Master');
    END IF;

    UPDATE public.profiles
    SET average_rating = calc_avg,
        total_reviews = calc_total,
        badges = new_badges
    WHERE id = target_seller_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_change
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_profile_reviews_and_badges();

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iso_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.profiles FOR SELECT 
    USING (true);

CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- LISTINGS POLICIES
CREATE POLICY "Active listings are viewable by everyone" 
    ON public.listings FOR SELECT 
    USING (
        status = 'ACTIVE' 
        OR auth.uid() = user_id 
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Authenticated users can create listings" 
    ON public.listings FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings" 
    ON public.listings FOR UPDATE 
    USING (
        auth.uid() = user_id 
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Users can delete their own listings" 
    ON public.listings FOR DELETE 
    USING (
        auth.uid() = user_id 
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- REVIEWS POLICIES
CREATE POLICY "Reviews are viewable by everyone" 
    ON public.reviews FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated users can create reviews for sellers" 
    ON public.reviews FOR INSERT 
    WITH CHECK (auth.uid() = reviewer_id AND auth.uid() <> seller_id);

CREATE POLICY "Reviewers can update their own reviews" 
    ON public.reviews FOR UPDATE 
    USING (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers or admins can delete reviews" 
    ON public.reviews FOR DELETE 
    USING (
        auth.uid() = reviewer_id 
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- ISO REQUESTS POLICIES
CREATE POLICY "ISO requests are viewable by everyone" 
    ON public.iso_requests FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated users can create ISO requests" 
    ON public.iso_requests FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ISO requests" 
    ON public.iso_requests FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ISO requests" 
    ON public.iso_requests FOR DELETE 
    USING (auth.uid() = user_id);

-- CONVERSATIONS POLICIES
CREATE POLICY "Users can view their own conversations" 
    ON public.conversations FOR SELECT 
    USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can start conversations" 
    ON public.conversations FOR INSERT 
    WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Participants can update conversation timestamps" 
    ON public.conversations FOR UPDATE 
    USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- MESSAGES POLICIES
CREATE POLICY "Users can view messages in their conversations" 
    ON public.messages FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c 
            WHERE c.id = messages.conversation_id 
              AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
        )
    );

CREATE POLICY "Users can insert messages into their conversations" 
    ON public.messages FOR INSERT 
    WITH CHECK (
        auth.uid() = sender_id 
        AND EXISTS (
            SELECT 1 FROM public.conversations c 
            WHERE c.id = messages.conversation_id 
              AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
        )
    );

CREATE POLICY "Message receivers can mark messages as read" 
    ON public.messages FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c 
            WHERE c.id = messages.conversation_id 
              AND (
                (c.participant_1 = auth.uid() AND messages.sender_id <> auth.uid())
                OR (c.participant_2 = auth.uid() AND messages.sender_id <> auth.uid())
              )
        )
    );

-- ==============================================================================
-- 10. SUPABASE STORAGE BUCKET CONFIGURATION
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for listing-images bucket
CREATE POLICY "Listing images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'listing-images');

CREATE POLICY "Authenticated users can upload listing images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'listing-images' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update or delete their own listing images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'listing-images' 
        AND auth.uid()::text = (storage.foldername(name))[2]
    );

-- ==============================================================================
-- 11. SUPABASE REALTIME PUBLICATION
-- ==============================================================================

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
EXCEPTION
    WHEN others THEN null;
END $$;

-- Grant Admin and TIER_3 Pro Subscription to tokolejo@gmail.com
UPDATE public.profiles
SET is_admin = true, subscription_tier = 'TIER_3'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'tokolejo@gmail.com');


