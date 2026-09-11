-- ==============================================================================
-- Plantio.ge: PostgreSQL Performance & Security Hardening
-- Standards: PostgreSQL 15+ & OWASP Top 10 Database Security
-- Run this script in Supabase SQL Editor
-- ==============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. FOREIGN KEY PERFORMANCE INDEXES
-- In PostgreSQL, FK columns are NOT auto-indexed. These indexes prevent table
-- locks on parent updates/deletes and eliminate sequential scans on joins.
-- ──────────────────────────────────────────────────────────────────────────────

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. FOREIGN KEY PERFORMANCE INDEXES (Fail-safe)
-- ──────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON public.stores(owner_id);
EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by) WHERE referred_by IS NOT NULL;
EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_wishlists_listing_id ON public.wishlists(listing_id);
EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_reviews_listing_id ON public.reviews(listing_id) WHERE listing_id IS NOT NULL;
EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON public.conversations(participant_2);
EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_conversations_listing_id ON public.conversations(listing_id) WHERE listing_id IS NOT NULL;
EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_community_posts_author_id ON public.community_posts(author_id) WHERE author_id IS NOT NULL;
EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON public.community_comments(post_id);
EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END $$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. PARTIAL & FILTER INDEXES FOR FAST MARKETPLACE QUERIES
-- ──────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_listings_active_price ON public.listings(price) WHERE status = 'ACTIVE';
EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_listings_active_views ON public.listings(views_count DESC) WHERE status = 'ACTIVE';
EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id) WHERE is_read = FALSE;
EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END $$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. DOMAIN INVARIANTS & INTEGRITY CONSTRAINTS
-- ──────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'price'
    ) THEN
        ALTER TABLE public.listings 
            ADD CONSTRAINT chk_listings_price_non_negative CHECK (price >= 0);
    END IF;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. RPC FUNCTION HARDENING (Prevent Search Path Hijacking)
-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.increment_affiliate_click(product_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.affiliate_products
    SET 
        clicks = COALESCE(clicks, 0) + 1,
        clicks_count = COALESCE(clicks_count, 0) + 1
    WHERE id = product_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_affiliate_click(UUID) TO authenticated, service_role, anon;

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. DEFENSE-IN-DEPTH: COMMUNITY HIBERNATION RLS POLICIES
-- ──────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'community_posts') THEN
        DROP POLICY IF EXISTS "Public can view community posts" ON public.community_posts;
        DROP POLICY IF EXISTS "Admins can view community posts during hibernation" ON public.community_posts;
        
        CREATE POLICY "Admins can view community posts during hibernation" 
            ON public.community_posts FOR SELECT 
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() 
                      AND (is_admin = TRUE OR role::text IN ('ADMIN', 'SUPER_ADMIN'))
                )
                OR auth.email() = 'tokolejo@gmail.com'
            );

        DROP POLICY IF EXISTS "Authenticated users can create community posts" ON public.community_posts;
        DROP POLICY IF EXISTS "Admins can create community posts during hibernation" ON public.community_posts;

        CREATE POLICY "Admins can create community posts during hibernation" 
            ON public.community_posts FOR INSERT 
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() 
                      AND (is_admin = TRUE OR role::text IN ('ADMIN', 'SUPER_ADMIN'))
                )
                OR auth.email() = 'tokolejo@gmail.com'
            );
    END IF;
EXCEPTION WHEN others THEN NULL; END $$;
