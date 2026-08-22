-- ==============================================================================
-- PLANTIO / PLANT — ENTERPRISE SAAS DATABASE MIGRATION (PHASE 1)
-- Tailored 100% to Existing Supabase Database Schema
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
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS is_on_vacation BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Ensure super admin role for tokolejo@gmail.com safely via auth.users
UPDATE public.profiles 
SET role = 'SUPER_ADMIN', is_admin = TRUE 
WHERE id IN (SELECT id FROM auth.users WHERE email = 'tokolejo@gmail.com');

-- 1.3 B2B Storefronts (stores table)
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    tax_id TEXT,
    logo_url TEXT,
    banner_url TEXT,
    city TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    social_links JSONB DEFAULT '{}'::jsonb,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    total_sales INTEGER NOT NULL DEFAULT 0,
    average_rating NUMERIC(3, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stores_public_read" ON public.stores;
CREATE POLICY "stores_public_read" ON public.stores FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "stores_owner_manage" ON public.stores;
CREATE POLICY "stores_owner_manage" ON public.stores FOR ALL TO authenticated
USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- 1.4 Dynamic SEO Settings (site_settings table)
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

-- Seed default global SEO settings
INSERT INTO public.site_settings (key, value, description)
VALUES (
    'seo', 
    '{"title": "Plantio - მცენარეების ონლაინ მარკეტპლეისი", "description": "იყიდეთ, გაყიდეთ და გაცვალეთ მცენარეები საქართველოში", "keywords": "მცენარეები, ყვავილები, ბოტანიკა, plantio"}'::jsonb,
    'Global SEO Meta Configuration'
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();


-- ──────────────────────────────────────────────────────────────────────────────
-- SECTION 2: DYNAMIC BILLING, PLANS, INVOICING & PROMO CODES
-- ──────────────────────────────────────────────────────────────────────────────

-- 2.1 Subscription Plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ka TEXT NOT NULL,
    name_en TEXT NOT NULL,
    tier public.subscription_tier NOT NULL UNIQUE,
    price_monthly NUMERIC(10, 2) NOT NULL DEFAULT 0,
    price_yearly NUMERIC(10, 2) NOT NULL DEFAULT 0,
    listing_limit INTEGER NOT NULL DEFAULT 5,
    vip_slots INTEGER NOT NULL DEFAULT 0,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plans_public_read" ON public.subscription_plans;
CREATE POLICY "plans_public_read" ON public.subscription_plans FOR SELECT TO public USING (true);

-- Seed/Update default plans by unique `tier`
INSERT INTO public.subscription_plans (
    name_ka, name_en, tier, price_monthly, price_yearly, listing_limit, vip_slots, features, is_active, sort_order
)
VALUES
    ('სტარტერი (უფასო)', 'Free Starter', 'FREE', 0, 0, 5, 0, '["5 აქტიური განცხადება", "სტანდარტული მხარდაჭერა", "საზოგადოებრივი ჩატი"]'::jsonb, TRUE, 1),
    ('კოლექციონერი (Tier 1)', 'Collector (Tier 1)', 'TIER_1', 15, 144, 25, 2, '["25 აქტიური განცხადება", "Custom Shop URL", "პრიორიტეტული ძიება", "2 VIP ბუსტი / თვეში"]'::jsonb, TRUE, 2),
    ('პრო შოპი (Tier 2)', 'Pro Shop (Tier 2)', 'TIER_2', 39, 374, 100, 5, '["100 აქტიური განცხადება", "Verified გამყიდველის ბეიჯი", "სრული ანალიტიკა", "5 VIP ბუსტი / თვეში"]'::jsonb, TRUE, 3),
    ('ენთერპრაიზი (Tier 3)', 'Enterprise Nursery (Tier 3)', 'TIER_3', 89, 854, 999999, 15, '["შეუზღუდავი განცხადებები", "VIP მხარდაჭერა 24/7", "B2B Storefront", "ავტომატური ინვოისინგი"]'::jsonb, TRUE, 4)
ON CONFLICT (tier) DO UPDATE SET
    name_ka = EXCLUDED.name_ka,
    name_en = EXCLUDED.name_en,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    listing_limit = EXCLUDED.listing_limit,
    vip_slots = EXCLUDED.vip_slots,
    features = EXCLUDED.features,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

-- 2.2 Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
    status public.subscription_status NOT NULL DEFAULT 'active',
    billing_cycle public.billing_cycle NOT NULL DEFAULT 'monthly',
    current_period_start TIMESTAMPTZ DEFAULT now(),
    current_period_end TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
    trial_end TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    external_sub_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_owner_read" ON public.subscriptions;
CREATE POLICY "subscriptions_owner_read" ON public.subscriptions FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 2.3 Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'GEL',
    status public.payment_status NOT NULL DEFAULT 'completed',
    provider TEXT,
    provider_tx_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
    invoice_number TEXT NOT NULL UNIQUE DEFAULT public.generate_invoice_number(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'GEL',
    status public.payment_status NOT NULL DEFAULT 'completed',
    description TEXT,
    pdf_url TEXT,
    due_date TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "promo_codes_public_read" ON public.promo_codes;
CREATE POLICY "promo_codes_public_read" ON public.promo_codes FOR SELECT TO authenticated
USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > now()));


-- ──────────────────────────────────────────────────────────────────────────────
-- SECTION 3: LISTINGS, BOTANICAL AI, GEOLOCATION & DELIVERY
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS is_vip BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS vip_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS plant_category TEXT,
  ADD COLUMN IF NOT EXISTS condition TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS trade_tags TEXT[] DEFAULT '{}',
  -- Botanical & Care info (populated by Plant AI)
  ADD COLUMN IF NOT EXISTS botanical_name TEXT,
  ADD COLUMN IF NOT EXISTS common_name TEXT,
  ADD COLUMN IF NOT EXISTS watering_schedule TEXT,
  ADD COLUMN IF NOT EXISTS light_requirement TEXT,
  ADD COLUMN IF NOT EXISTS care_difficulty TEXT,
  ADD COLUMN IF NOT EXISTS plantnet_id TEXT,
  ADD COLUMN IF NOT EXISTS toxicity TEXT,
  -- Contact phone
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  -- Delivery Options
  ADD COLUMN IF NOT EXISTS can_deliver BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pickup_only BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ships_nationwide BOOLEAN NOT NULL DEFAULT FALSE,
  -- Geolocation
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);

-- 3.2 Affiliate Products Table
CREATE TABLE IF NOT EXISTS public.affiliate_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_name TEXT NOT NULL,
    product_name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    product_url TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'GEL',
    commission_pct NUMERIC(5, 2) DEFAULT 0,
    matching_tags TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    clicks INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

-- 3.3 Listing Views Table
CREATE TABLE IF NOT EXISTS public.listing_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ip_hash TEXT,
    device_type TEXT,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wishlists_owner_all" ON public.wishlists;
CREATE POLICY "wishlists_owner_all" ON public.wishlists FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 4.3 Trade Offers Table
CREATE TABLE IF NOT EXISTS public.trade_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    offered_listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    requested_listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    offered_price NUMERIC(10, 2),
    cash_difference NUMERIC(10, 2) DEFAULT 0,
    status public.trade_offer_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
    message TEXT,
    type public.notification_type NOT NULL DEFAULT 'SYSTEM',
    link TEXT,
    meta JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_admin_read" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_read" ON public.audit_logs FOR SELECT TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN ('SUPER_ADMIN', 'FINANCE_ADMIN', 'MODERATOR'))
);

-- 5.2 Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_type TEXT NOT NULL,
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status public.report_status NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolution_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
    new_users INTEGER NOT NULL DEFAULT 0,
    new_listings INTEGER NOT NULL DEFAULT 0,
    active_listings INTEGER NOT NULL DEFAULT 0,
    total_views INTEGER NOT NULL DEFAULT 0,
    new_messages INTEGER NOT NULL DEFAULT 0,
    new_reviews INTEGER NOT NULL DEFAULT 0,
    revenue_gel NUMERIC(12, 2) NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
CREATE INDEX IF NOT EXISTS idx_audit_logs_new_data_gin ON public.audit_logs USING gin (new_data);
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

    -- Fetch active plan limit from active subscription or profile tier
    SELECT COALESCE(p.listing_limit, 5) INTO v_plan_limit
    FROM public.subscriptions s
    JOIN public.subscription_plans p ON s.plan_id = p.id
    WHERE s.user_id = NEW.user_id AND s.status::text = 'active'
    LIMIT 1;

    IF v_plan_limit IS NULL THEN
        SELECT 
            CASE 
                WHEN subscription_tier::text = 'TIER_3' THEN 999999
                WHEN subscription_tier::text = 'TIER_2' THEN 100
                WHEN subscription_tier::text = 'TIER_1' THEN 25
                ELSE 5
            END INTO v_plan_limit
        FROM public.profiles 
        WHERE id = NEW.user_id;
    END IF;

    IF v_plan_limit IS NULL THEN
        v_plan_limit := 5;
    END IF;

    -- Count active listings
    SELECT COUNT(*) INTO v_current_active_count
    FROM public.listings
    WHERE user_id = NEW.user_id 
      AND status::text = 'ACTIVE'
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
        v_title := COALESCE(NEW.title_ka, NEW.title_en, 'მცენარე');
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
    IF (NEW.status::text = 'accepted' AND (OLD.status::text IS DISTINCT FROM 'accepted')) THEN
        -- Reserve offered listing if present
        IF NEW.offered_listing_id IS NOT NULL THEN
            UPDATE public.listings 
            SET status = 'RESERVED' 
            WHERE id = NEW.offered_listing_id;
        END IF;

        -- Reserve requested listing
        UPDATE public.listings 
        SET status = 'RESERVED' 
        WHERE id = NEW.requested_listing_id;

        -- Notify both parties
        INSERT INTO public.notifications (user_id, title, message, type)
        VALUES 
            (NEW.sender_id, '🤝 გაცვლის შეთავაზება მიღებულია!', 'თქვენი გაცვლის შეთავაზება წარმატებით დადასტურდა. განცხადებები დარეზერვდა.', 'TRADE'),
            (NEW.receiver_id, '🤝 გაცვლა დადასტურდა!', 'გაცვლის შეთანხმება შედგა. განცხადებები დარეზერვდა.', 'TRADE');
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
        -- Extend existing subscription
        UPDATE public.subscriptions
        SET current_period_end = GREATEST(current_period_end, now()) + (extra_days || ' days')::interval,
            status = 'active',
            updated_at = now()
        WHERE user_id = u_id;

        -- Also update profile expires_at
        UPDATE public.profiles
        SET subscription_expires_at = GREATEST(COALESCE(subscription_expires_at, now()), now()) + (extra_days || ' days')::interval
        WHERE id = u_id;

        -- Audit log entry
        INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, new_data)
        VALUES (
            admin_id,
            'BULK_EXTEND_SUBSCRIPTION',
            'USER',
            u_id,
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
        WHERE user_id = u_id AND status::text = 'ACTIVE';

        -- Audit log entry
        INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, new_data)
        VALUES (
            admin_id,
            'BULK_SUSPEND_USER',
            'USER',
            u_id,
            jsonb_build_object('reason', reason, 'timestamp', now())
        );
    END LOOP;
END;
$$;
