-- ==============================================================================
-- PLANTIO / PLANT — ENTERPRISE SAAS DATABASE MIGRATION (PHASE 1)
-- C2C / B2B / B2C Plant Marketplace — Production-Ready Enterprise Schema
-- PostgreSQL 15+ · Supabase · Strict Security Linter Compliant
-- ==============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- SECTION 1: EXTENDED ROLES (RBAC) & USER CORE SCHEMA
-- ──────────────────────────────────────────────────────────────────────────────

-- 1.1 user_role ENUM (7 Enterprise Roles)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM (
            'SUPER_ADMIN',
            'FINANCE_ADMIN',
            'CONTENT_MANAGER',
            'MODERATOR',
            'SUPPORT',
            'PARTNER',
            'USER'
        );
    END IF;
END $$;

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'FINANCE_ADMIN';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'CONTENT_MANAGER';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'MODERATOR';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'SUPPORT';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'PARTNER';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'USER';

-- 1.2 Profiles table extension
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role public.user_role NOT NULL DEFAULT 'USER',
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS is_on_vacation BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Ensure super admin role for tokolejo@gmail.com safely via auth.users
UPDATE public.profiles 
SET role = 'SUPER_ADMIN' 
WHERE id IN (SELECT id FROM auth.users WHERE email = 'tokolejo@gmail.com');

-- 1.3 B2B Storefronts (stores table)
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    tax_id TEXT,
    logo_url TEXT,
    banner_url TEXT,
    description TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS tax_id TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stores_public_read" ON public.stores;
CREATE POLICY "stores_public_read" ON public.stores FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "stores_owner_manage" ON public.stores;
CREATE POLICY "stores_owner_manage" ON public.stores FOR ALL TO authenticated
USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- 1.4 Dynamic SEO Settings (site_settings table)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seo_title TEXT,
    seo_description TEXT,
    seo_keywords TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS seo_keywords TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_settings_public_read" ON public.site_settings;
CREATE POLICY "site_settings_public_read" ON public.site_settings FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "site_settings_admin_manage" ON public.site_settings;
CREATE POLICY "site_settings_admin_manage" ON public.site_settings FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN ('SUPER_ADMIN', 'CONTENT_MANAGER'))
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN ('SUPER_ADMIN', 'CONTENT_MANAGER'))
);


-- ──────────────────────────────────────────────────────────────────────────────
-- SECTION 2: DYNAMIC BILLING, PLANS, INVOICING & PROMO CODES
-- ──────────────────────────────────────────────────────────────────────────────

-- 2.1 Subscription Plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Plan',
    price_monthly NUMERIC(10, 2) NOT NULL DEFAULT 0,
    price_yearly NUMERIC(10, 2) NOT NULL DEFAULT 0,
    listing_limit INTEGER NOT NULL DEFAULT 5,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure all columns exist even if subscription_plans table already existed
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Plan',
  ADD COLUMN IF NOT EXISTS price_monthly NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_yearly NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS listing_limit INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS features JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plans_public_read" ON public.subscription_plans;
CREATE POLICY "plans_public_read" ON public.subscription_plans FOR SELECT TO public USING (true);

-- Seed default plans
INSERT INTO public.subscription_plans (id, name, price_monthly, price_yearly, listing_limit, features, is_active)
VALUES
    ('FREE', 'Free Starter', 0, 0, 5, '["5 აქტიური განცხადება", "სტანდარტული მხარდაჭერა", "საზოგადოებრივი ჩატი"]'::jsonb, TRUE),
    ('TIER_1', 'Collector (Tier 1)', 15, 144, 25, '["25 აქტიური განცხადება", "Custom Shop URL", "პრიორიტეტული ძიება", "2 VIP ბუსტი / თვეში"]'::jsonb, TRUE),
    ('TIER_2', 'Pro Shop (Tier 2)', 39, 374, 100, '["100 აქტიური განცხადება", "Verified გამყიდველის ბეიჯი", "სრული ანალიტიკა", "5 VIP ბუსტი / თვეში"]'::jsonb, TRUE),
    ('TIER_3', 'Enterprise Nursery (Tier 3)', 89, 854, 999999, '["შეუზღუდავი განცხადებები", "VIP მხარდაჭერა 24/7", "B2B Storefront", "ავტომატური ინვოისინგი"]'::jsonb, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    listing_limit = EXCLUDED.listing_limit,
    features = EXCLUDED.features,
    is_active = EXCLUDED.is_active;

-- 2.2 Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL REFERENCES public.subscription_plans(id) DEFAULT 'FREE',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'paused')),
    billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS plan_id TEXT REFERENCES public.subscription_plans(id) DEFAULT 'FREE',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_owner_read" ON public.subscriptions;
CREATE POLICY "subscriptions_owner_read" ON public.subscriptions FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 2.3 Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'GEL',
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'succeeded', 'failed', 'refunded')),
    payment_method TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'GEL',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_owner_read" ON public.transactions;
CREATE POLICY "transactions_owner_read" ON public.transactions FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 2.4 Invoice auto-numbering sequence & Invoices Table
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START WITH 1001;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE sql
AS $$
    SELECT 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(NEXTVAL('public.invoice_number_seq')::TEXT, 5, '0');
$$;

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL UNIQUE DEFAULT public.generate_invoice_number(),
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'GEL',
    status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'issued', 'void', 'overdue')),
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'GEL',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'paid',
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_owner_read" ON public.invoices;
CREATE POLICY "invoices_owner_read" ON public.invoices FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 2.5 Promo Codes
CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    discount_percentage NUMERIC(5, 2) NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
    usage_limit INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_codes
  ADD COLUMN IF NOT EXISTS code TEXT,
  ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS usage_limit INTEGER,
  ADD COLUMN IF NOT EXISTS used_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "promo_codes_public_read" ON public.promo_codes;
CREATE POLICY "promo_codes_public_read" ON public.promo_codes FOR SELECT TO authenticated
USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > now()));


-- ──────────────────────────────────────────────────────────────────────────────
-- SECTION 3: LISTINGS, BOTANICAL AI, GEOLOCATION & DELIVERY
-- ──────────────────────────────────────────────────────────────────────────────

-- 3.1 Item Category ENUM
DO $$ BEGIN
    CREATE TYPE public.item_category AS ENUM (
        'PLANT', 'POT', 'FERTILIZER', 'TOOL', 'ACCESSORY', 'OTHER'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3.2 Listing Status ENUM
DO $$ BEGIN
    CREATE TYPE public.listing_status AS ENUM (
        'ACTIVE', 'RESERVED', 'SOLD', 'TRADED', 'DRAFT', 'HIDDEN', 'REJECTED'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3.3 Listings Table Alterations
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS is_vip BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS vip_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS category public.item_category NOT NULL DEFAULT 'PLANT',
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
  -- Botanical & Care info (populated by Plant AI)
  ADD COLUMN IF NOT EXISTS botanical_name TEXT,
  ADD COLUMN IF NOT EXISTS common_name TEXT,
  ADD COLUMN IF NOT EXISTS watering_schedule TEXT,
  ADD COLUMN IF NOT EXISTS light_requirement TEXT,
  ADD COLUMN IF NOT EXISTS care_difficulty TEXT,
  ADD COLUMN IF NOT EXISTS plantnet_id TEXT,
  -- Contact phone
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  -- Delivery Options
  ADD COLUMN IF NOT EXISTS can_deliver BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pickup_only BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ships_nationwide BOOLEAN NOT NULL DEFAULT FALSE,
  -- Geolocation
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);

-- 3.4 Affiliate Products Table
CREATE TABLE IF NOT EXISTS public.affiliate_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_name TEXT NOT NULL,
    title TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    image_url TEXT,
    product_url TEXT NOT NULL,
    category TEXT,
    matching_tags TEXT[] NOT NULL DEFAULT '{}',
    commission_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_products
  ADD COLUMN IF NOT EXISTS partner_name TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS product_url TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS matching_tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS commission_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.affiliate_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "affiliate_products_public_read" ON public.affiliate_products;
CREATE POLICY "affiliate_products_public_read" ON public.affiliate_products FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "affiliate_products_admin_manage" ON public.affiliate_products;
CREATE POLICY "affiliate_products_admin_manage" ON public.affiliate_products FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN ('SUPER_ADMIN', 'FINANCE_ADMIN', 'CONTENT_MANAGER'))
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN ('SUPER_ADMIN', 'FINANCE_ADMIN', 'CONTENT_MANAGER'))
);

-- 3.5 Listing Views Table
CREATE TABLE IF NOT EXISTS public.listing_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.listing_views
  ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.listing_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "listing_views_insert" ON public.listing_views;
CREATE POLICY "listing_views_insert" ON public.listing_views FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "listing_views_select" ON public.listing_views;
CREATE POLICY "listing_views_select" ON public.listing_views FOR SELECT TO public USING (true);


-- ──────────────────────────────────────────────────────────────────────────────
-- SECTION 4: SOCIAL, REVIEWS, ENGAGEMENT & SMART OFFERS
-- ──────────────────────────────────────────────────────────────────────────────

-- 4.1 Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_id UUID NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('USER', 'STORE')),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS target_id UUID,
  ADD COLUMN IF NOT EXISTS target_type TEXT,
  ADD COLUMN IF NOT EXISTS rating INTEGER,
  ADD COLUMN IF NOT EXISTS comment TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_public_read" ON public.reviews;
CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "reviews_author_manage" ON public.reviews;
CREATE POLICY "reviews_author_manage" ON public.reviews FOR INSERT TO authenticated
WITH CHECK (reviewer_id = auth.uid());

-- 4.2 Wishlists Table
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, listing_id)
);

ALTER TABLE public.wishlists
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wishlists_owner_all" ON public.wishlists;
CREATE POLICY "wishlists_owner_all" ON public.wishlists FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 4.3 Trade Offers Table
CREATE TABLE IF NOT EXISTS public.trade_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    offered_listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    requested_listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    cash_difference NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'countered', 'declined', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trade_offers
  ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS offered_listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS requested_listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS cash_difference NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.trade_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trade_offers_participant_access" ON public.trade_offers;
CREATE POLICY "trade_offers_participant_access" ON public.trade_offers FOR ALL TO authenticated
USING (sender_id = auth.uid() OR receiver_id = auth.uid())
WITH CHECK (sender_id = auth.uid() OR receiver_id = auth.uid());

-- 4.4 Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('PRICE_DROP', 'TRADE_OFFER', 'BILLING', 'SYSTEM', 'CHAT')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_owner_all" ON public.notifications;
CREATE POLICY "notifications_owner_all" ON public.notifications FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- ──────────────────────────────────────────────────────────────────────────────
-- SECTION 5: ENTERPRISE AUDIT LOGS, METRICS & MODERATION
-- ──────────────────────────────────────────────────────────────────────────────

-- 5.1 Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS action_type TEXT,
  ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_admin_read" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_read" ON public.audit_logs FOR SELECT TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN ('SUPER_ADMIN', 'FINANCE_ADMIN', 'MODERATOR'))
);

-- 5.2 Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_item_id UUID NOT NULL,
    reported_type TEXT NOT NULL CHECK (reported_type IN ('LISTING', 'STORE', 'USER')),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS reported_item_id UUID,
  ADD COLUMN IF NOT EXISTS reported_type TEXT,
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_reporter_insert" ON public.reports;
CREATE POLICY "reports_reporter_insert" ON public.reports FOR INSERT TO authenticated
WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "reports_moderator_all" ON public.reports;
CREATE POLICY "reports_moderator_all" ON public.reports FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN ('SUPER_ADMIN', 'MODERATOR'))
);

-- 5.3 Daily Metrics Table
CREATE TABLE IF NOT EXISTS public.daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date DATE NOT NULL UNIQUE,
    mrr NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_users INTEGER NOT NULL DEFAULT 0,
    active_vip_count INTEGER NOT NULL DEFAULT 0,
    total_listings INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_metrics
  ADD COLUMN IF NOT EXISTS metric_date DATE,
  ADD COLUMN IF NOT EXISTS mrr NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_users INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active_vip_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_listings INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_metrics_admin_read" ON public.daily_metrics;
CREATE POLICY "daily_metrics_admin_read" ON public.daily_metrics FOR SELECT TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN ('SUPER_ADMIN', 'FINANCE_ADMIN'))
);


-- ──────────────────────────────────────────────────────────────────────────────
-- SECTION 6: HIGH-PERFORMANCE INDEXING STRATEGY
-- ──────────────────────────────────────────────────────────────────────────────

-- 6.1 GIN Indexes for JSONB & Arrays
CREATE INDEX IF NOT EXISTS idx_audit_logs_details_gin ON public.audit_logs USING gin (details);
CREATE INDEX IF NOT EXISTS idx_listings_tags_gin ON public.listings USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_affiliate_matching_tags_gin ON public.affiliate_products USING gin (matching_tags);

-- 6.2 Composite & B-Tree Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles (phone);
CREATE INDEX IF NOT EXISTS idx_listings_vip_created ON public.listings (is_vip, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_geo ON public.listings (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions (user_id, status);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_listing ON public.wishlists (user_id, listing_id);
CREATE INDEX IF NOT EXISTS idx_trade_offers_users ON public.trade_offers (sender_id, receiver_id, status);


-- ──────────────────────────────────────────────────────────────────────────────
-- SECTION 7: AUTOMATED TRIGGERS & BUSINESS LOGIC RPCS
-- ──────────────────────────────────────────────────────────────────────────────

-- 7.1 TRIGGER 1: Plan Limit Guard (Listing Limit Enforcement)
CREATE OR REPLACE FUNCTION public.fn_check_listing_limit_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_role TEXT;
    v_plan_limit INT := 5;
    v_current_active_count INT;
BEGIN
    -- Admins and Super Admins have unlimited listings
    SELECT role::text INTO v_user_role FROM public.profiles WHERE id = NEW.user_id;
    IF v_user_role IN ('SUPER_ADMIN', 'FINANCE_ADMIN', 'CONTENT_MANAGER', 'MODERATOR') THEN
        RETURN NEW;
    END IF;

    -- Fetch active plan limit
    SELECT COALESCE(p.listing_limit, 5) INTO v_plan_limit
    FROM public.subscriptions s
    JOIN public.subscription_plans p ON s.plan_id = p.id
    WHERE s.user_id = NEW.user_id AND s.status = 'active'
    LIMIT 1;

    IF v_plan_limit IS NULL THEN
        v_plan_limit := 5;
    END IF;

    -- Count active listings
    SELECT COUNT(*) INTO v_current_active_count
    FROM public.listings
    WHERE user_id = NEW.user_id 
      AND status = 'ACTIVE'
      AND deleted_at IS NULL;

    IF v_current_active_count >= v_plan_limit THEN
        RAISE EXCEPTION 'თქვენ ამოწურეთ თქვენი ტარიფის ლიმიტი (% განცხადება). განაახლეთ ტარიფი მეტი მცენარის განსათავსებლად.', v_plan_limit;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_listing_limit ON public.listings;
CREATE TRIGGER trg_check_listing_limit
BEFORE INSERT ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.fn_check_listing_limit_before_insert();


-- 7.2 TRIGGER 2: Price Drop Notification (Auto-Notify Wishlist Users)
CREATE OR REPLACE FUNCTION public.fn_notify_price_drop_on_wishlists()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    r_wishlist RECORD;
    v_title TEXT;
BEGIN
    IF (NEW.price < OLD.price AND OLD.price > 0 AND NEW.price > 0) THEN
        v_title := COALESCE(NEW.title_ka, NEW.title, 'მცენარე');
        FOR r_wishlist IN 
            SELECT user_id FROM public.wishlists WHERE listing_id = NEW.id
        LOOP
            INSERT INTO public.notifications (user_id, title, message, type)
            VALUES (
                r_wishlist.user_id,
                '📉 ფასდაკლება თქვენს რჩეულ მცენარეზე!',
                format('მცენარეზე "%s" ფასი შემცირდა: %s ₾ -> %s ₾', v_title, OLD.price, NEW.price),
                'PRICE_DROP'
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_price_drop ON public.listings;
CREATE TRIGGER trg_notify_price_drop
AFTER UPDATE OF price ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.fn_notify_price_drop_on_wishlists();


-- 7.3 TRIGGER 3: Auto-Reserve Listing on Accepted Trade Offer
CREATE OR REPLACE FUNCTION public.fn_auto_reserve_on_trade_accept()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF (NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted')) THEN
        -- Reserve offered listing
        UPDATE public.listings 
        SET status = 'RESERVED' 
        WHERE id = NEW.offered_listing_id;

        -- Reserve requested listing
        UPDATE public.listings 
        SET status = 'RESERVED' 
        WHERE id = NEW.requested_listing_id;

        -- Notify both parties
        INSERT INTO public.notifications (user_id, title, message, type)
        VALUES 
            (NEW.sender_id, '🤝 გაცვლის შეთავაზება მიღებულია!', 'თქვენი გაცვლის შეთავაზება წარმატებით დადასტურდა. განცხადებები დარეზერვდა.', 'TRADE_OFFER'),
            (NEW.receiver_id, '🤝 გაცვლა დადასტურდა!', 'გაცვლის შეთანხმება შედგა. განცხადებები დარეზერვდა.', 'TRADE_OFFER');
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_reserve_on_trade ON public.trade_offers;
CREATE TRIGGER trg_auto_reserve_on_trade
AFTER UPDATE OF status ON public.trade_offers
FOR EACH ROW
EXECUTE FUNCTION public.fn_auto_reserve_on_trade_accept();


-- 7.4 RPC 1: Bulk Extend Subscription
CREATE OR REPLACE FUNCTION public.bulk_extend_subscription(
    user_ids UUID[],
    extra_days INT DEFAULT 30,
    admin_id UUID DEFAULT auth.uid()
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    u_id UUID;
BEGIN
    FOREACH u_id IN ARRAY user_ids LOOP
        -- Extend existing subscription or insert one
        UPDATE public.subscriptions
        SET current_period_end = GREATEST(current_period_end, now()) + (extra_days || ' days')::interval,
            status = 'active',
            updated_at = now()
        WHERE user_id = u_id;

        -- Audit log entry
        INSERT INTO public.audit_logs (admin_id, target_user_id, action_type, details)
        VALUES (
            admin_id,
            u_id,
            'BULK_EXTEND_SUBSCRIPTION',
            jsonb_build_object('extra_days', extra_days, 'timestamp', now())
        );
    END LOOP;
END;
$$;


-- 7.5 RPC 2: Bulk Suspend Users
CREATE OR REPLACE FUNCTION public.bulk_suspend_users(
    user_ids UUID[],
    reason TEXT DEFAULT 'ადმინისტრატორის მიერ შეჩერებული ანგარიში',
    admin_id UUID DEFAULT auth.uid()
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    u_id UUID;
BEGIN
    FOREACH u_id IN ARRAY user_ids LOOP
        -- Set user vacation / freeze status
        UPDATE public.profiles
        SET is_on_vacation = TRUE
        WHERE id = u_id;

        -- Hide all active listings
        UPDATE public.listings
        SET status = 'HIDDEN'
        WHERE user_id = u_id AND status = 'ACTIVE';

        -- Audit log entry
        INSERT INTO public.audit_logs (admin_id, target_user_id, action_type, details)
        VALUES (
            admin_id,
            u_id,
            'BULK_SUSPEND_USER',
            jsonb_build_object('reason', reason, 'timestamp', now())
        );
    END LOOP;
END;
$$;
