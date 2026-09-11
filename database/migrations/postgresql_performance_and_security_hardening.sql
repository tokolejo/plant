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

-- Stores & Profiles
CREATE INDEX IF NOT EXISTS idx_stores_owner_id 
    ON public.stores(owner_id);

CREATE INDEX IF NOT EXISTS idx_profiles_referred_by 
    ON public.profiles(referred_by) 
    WHERE referred_by IS NOT NULL;

-- Wishlists & Reviews
CREATE INDEX IF NOT EXISTS idx_wishlists_listing_id 
    ON public.wishlists(listing_id);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id 
    ON public.reviews(reviewer_id);

CREATE INDEX IF NOT EXISTS idx_reviews_listing_id 
    ON public.reviews(listing_id) 
    WHERE listing_id IS NOT NULL;

-- Messaging & Conversations
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 
    ON public.conversations(participant_2);

CREATE INDEX IF NOT EXISTS idx_conversations_listing_id 
    ON public.conversations(listing_id) 
    WHERE listing_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_sender_id 
    ON public.messages(sender_id);

-- Community (Forum)
CREATE INDEX IF NOT EXISTS idx_community_posts_author_id 
    ON public.community_posts(author_id) 
    WHERE author_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_community_comments_post_id 
    ON public.community_comments(post_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. PARTIAL & FILTER INDEXES FOR FAST MARKETPLACE QUERIES
-- Partial indexes are compact, fast, and only index active, non-deleted rows.
-- ──────────────────────────────────────────────────────────────────────────────

-- Fast Sorting: Price (Low to High / High to Low)
CREATE INDEX IF NOT EXISTS idx_listings_active_price 
    ON public.listings(price) 
    WHERE status = 'ACTIVE';

-- Fast Sorting: Popularity (Views count)
CREATE INDEX IF NOT EXISTS idx_listings_active_views 
    ON public.listings(views_count DESC) 
    WHERE status = 'ACTIVE';

-- Fast Notification Badge: Unread count lookup per user
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
    ON public.notifications(user_id) 
    WHERE is_read = FALSE;

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. DOMAIN INVARIANTS & INTEGRITY CONSTRAINTS
-- Prevent invalid business data from ever entering the database
-- ──────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
    ALTER TABLE public.listings 
        ADD CONSTRAINT chk_listings_price_non_negative CHECK (price >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE public.profiles 
        ADD CONSTRAINT chk_profiles_wallet_non_negative CHECK (wallet_balance >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. RPC FUNCTION HARDENING (Prevent Search Path Hijacking)
-- Add immutable search_path on functions to satisfy Supabase security linter
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

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. DEFENSE-IN-DEPTH: COMMUNITY HIBERNATION RLS POLICIES
-- Ensures that while Community is hibernated, only Admins can read or post,
-- even if someone queries the Supabase REST endpoint directly.
-- ──────────────────────────────────────────────────────────────────────────────

-- Restrict community posts to Admins while in maintenance/hibernation
DROP POLICY IF EXISTS "Public can view community posts" ON public.community_posts;
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
