-- ==============================================================================
-- PLANTIO — ENTERPRISE SAAS UPGRADE: PHASE 1 DATABASE MIGRATION
-- C2C / B2B / B2C Marketplace — Production-Ready Schema Extension
-- PostgreSQL 15+ · Supabase · PostGIS
-- ==============================================================================
-- ეს სკრიპტი არსებულ სქემაზე დამატებას ახდენს (CREATE TABLE IF NOT EXISTS).
-- არსებული ცხრილები და მონაცემები ხელუხლებელი რჩება.
-- ==============================================================================

-- ═══════════════════════════════════════════════════════════════
-- SECTION 1: ახალი ENUM ტიპები
-- ═══════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM (
    'SUPER_ADMIN', 'MODERATOR', 'SUPPORT', 'USER'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM (
    'PRICE_DROP', 'BILLING', 'SYSTEM', 'TRADE', 'MODERATION', 'REVIEW'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM (
    'trialing', 'active', 'past_due', 'canceled', 'paused'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM (
    'pending', 'completed', 'failed', 'refunded'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.report_status AS ENUM (
    'pending', 'reviewing', 'resolved', 'dismissed'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;


-- ═══════════════════════════════════════════════════════════════
-- SECTION 2: PROFILES გაფართოება
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role public.user_role NOT NULL DEFAULT 'USER',
  ADD COLUMN IF NOT EXISTS is_on_vacation BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

UPDATE public.profiles SET role = 'SUPER_ADMIN' WHERE is_admin = TRUE;

CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_vacation ON public.profiles(is_on_vacation) WHERE is_on_vacation = TRUE;


-- ═══════════════════════════════════════════════════════════════
-- SECTION 3: STORES — ბიზნეს ვიტრინები
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.stores (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  slug           TEXT NOT NULL UNIQUE,
  description    TEXT,
  tax_id         TEXT,
  logo_url       TEXT,
  banner_url     TEXT,
  city           TEXT DEFAULT 'თბილისი',
  address        TEXT,
  phone          TEXT,
  email          TEXT,
  social_links   JSONB DEFAULT '{}'::jsonb,
  is_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  total_sales    INTEGER NOT NULL DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0.00,
  created_at     TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at     TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON public.stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON public.stores(slug);

DROP POLICY IF EXISTS "stores_public_read" ON public.stores;
CREATE POLICY "stores_public_read" ON public.stores FOR SELECT USING (is_active = TRUE OR owner_id = auth.uid());

DROP POLICY IF EXISTS "stores_owner_insert" ON public.stores;
CREATE POLICY "stores_owner_insert" ON public.stores FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "stores_owner_update" ON public.stores;
CREATE POLICY "stores_owner_update" ON public.stores FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "stores_admin_all" ON public.stores;
CREATE POLICY "stores_admin_all" ON public.stores FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = TRUE OR role IN ('SUPER_ADMIN','MODERATOR'))));


-- ═══════════════════════════════════════════════════════════════
-- SECTION 4: LISTINGS გაფართოება
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_vip BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS vip_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS can_deliver BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pickup_only BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS ships_nationwide BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS inventory_category TEXT,
  ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'GOOD';

CREATE INDEX IF NOT EXISTS idx_listings_store_id ON public.listings(store_id) WHERE store_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_vip ON public.listings(is_vip, vip_until) WHERE is_vip = TRUE;
CREATE INDEX IF NOT EXISTS idx_listings_deleted ON public.listings(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_listings_tags ON public.listings USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_listings_created ON public.listings(created_at DESC);


-- ═══════════════════════════════════════════════════════════════
-- SECTION 5: WISHLISTS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.wishlists (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT unique_wishlist_entry UNIQUE (user_id, listing_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_listing_id ON public.wishlists(listing_id);

DROP POLICY IF EXISTS "wishlists_owner_select" ON public.wishlists;
CREATE POLICY "wishlists_owner_select" ON public.wishlists FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wishlists_owner_insert" ON public.wishlists;
CREATE POLICY "wishlists_owner_insert" ON public.wishlists FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wishlists_owner_delete" ON public.wishlists;
CREATE POLICY "wishlists_owner_delete" ON public.wishlists FOR DELETE USING (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════
-- SECTION 6: NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  message    TEXT,
  type       public.notification_type NOT NULL DEFAULT 'SYSTEM',
  link       TEXT,
  meta       JSONB DEFAULT '{}'::jsonb,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

DROP POLICY IF EXISTS "notifications_owner_select" ON public.notifications;
CREATE POLICY "notifications_owner_select" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_owner_update" ON public.notifications;
CREATE POLICY "notifications_owner_update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_service_insert" ON public.notifications;
CREATE POLICY "notifications_service_insert" ON public.notifications FOR INSERT TO service_role WITH CHECK (true);


-- ═══════════════════════════════════════════════════════════════
-- SECTION 7: SITE SETTINGS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.site_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL DEFAULT 'null'::jsonb,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_settings_public_read" ON public.site_settings;
CREATE POLICY "site_settings_public_read" ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "site_settings_admin_write" ON public.site_settings;
CREATE POLICY "site_settings_admin_write" ON public.site_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = TRUE OR role = 'SUPER_ADMIN')));

INSERT INTO public.site_settings (key, value, description) VALUES
  ('seo_title_ka', '"Plantio — ყიდე, გაცვალე, გამართე მცენარეები"', 'ქართული სათაური'),
  ('seo_title_en', '"Plantio — Buy, Swap & Gift Plants"', 'ინგლისური სათაური'),
  ('seo_description_ka', '"საქართველოს #1 მცენარეების მარკეტპლეისი"', 'ქართული მეტა-დეს'),
  ('maintenance_mode', 'false', 'ტექნიკური სამუშაოების რეჟიმი'),
  ('max_images_per_listing', '6', 'განცხადებაზე ფოტოების მაქსიმუმი'),
  ('featured_listings_count', '8', 'VIP განცხადებების რაოდენობა მთავარ გვერდზე')
ON CONFLICT (key) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════
-- SECTION 8: SUBSCRIPTION PLANS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ka       TEXT NOT NULL,
  name_en       TEXT NOT NULL,
  tier          public.subscription_tier NOT NULL UNIQUE,
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  price_yearly  NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  listing_limit INTEGER NOT NULL DEFAULT 5,
  vip_slots     INTEGER NOT NULL DEFAULT 0,
  features      JSONB DEFAULT '[]'::jsonb,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plans_public_read" ON public.subscription_plans;
CREATE POLICY "plans_public_read" ON public.subscription_plans FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "plans_admin_all" ON public.subscription_plans;
CREATE POLICY "plans_admin_all" ON public.subscription_plans FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = TRUE OR role = 'SUPER_ADMIN')));

INSERT INTO public.subscription_plans (name_ka, name_en, tier, price_monthly, price_yearly, listing_limit, vip_slots, features, sort_order) VALUES
  ('უფასო', 'Free', 'FREE', 0.00, 0.00, 5, 0,
   '["5 განცხადება","სტანდარტული გვერდი","Pl@ntNet ამოცნობა"]'::jsonb, 0),
  ('სტარტერი', 'Starter', 'TIER_1', 9.99, 99.99, 25, 1,
   '["25 განცხადება","1 VIP განცხადება","ანალიტიკა","პრიორიტეტული მხარდაჭერა"]'::jsonb, 1),
  ('ბიზნესი', 'Business', 'TIER_2', 24.99, 249.99, 100, 5,
   '["100 განცხადება","5 VIP","მაღაზიის ვიტრინა","B2B ფუნქციები"]'::jsonb, 2),
  ('ენტერპრაიზი', 'Enterprise', 'TIER_3', 79.99, 799.99, 999999, 999,
   '["შეუზღუდავი","Dedicated მხარდაჭერა","White-label","SLA 99.9%"]'::jsonb, 3)
ON CONFLICT (tier) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════
-- SECTION 9: SUBSCRIPTIONS V2
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id              UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  status               public.subscription_status NOT NULL DEFAULT 'trialing',
  billing_cycle        public.billing_cycle NOT NULL DEFAULT 'MONTHLY',
  current_period_start TIMESTAMPTZ DEFAULT now(),
  current_period_end   TIMESTAMPTZ,
  trial_end            TIMESTAMPTZ,
  canceled_at          TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  external_sub_id      TEXT,
  metadata             JSONB DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at           TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

DROP POLICY IF EXISTS "subscriptions_owner_select" ON public.subscriptions;
CREATE POLICY "subscriptions_owner_select" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "subscriptions_admin_all" ON public.subscriptions;
CREATE POLICY "subscriptions_admin_all" ON public.subscriptions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = TRUE OR role = 'SUPER_ADMIN')));


-- ═══════════════════════════════════════════════════════════════
-- SECTION 10: INVOICES & TRANSACTIONS
-- ═══════════════════════════════════════════════════════════════

CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START 1000;

CREATE TABLE IF NOT EXISTS public.invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  TEXT NOT NULL UNIQUE DEFAULT ('INV-' || LPAD(nextval('public.invoice_number_seq')::TEXT, 6, '0')),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount          NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  currency        TEXT NOT NULL DEFAULT 'GEL',
  status          public.payment_status NOT NULL DEFAULT 'pending',
  description     TEXT,
  pdf_url         TEXT,
  due_date        TIMESTAMPTZ,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);

DROP POLICY IF EXISTS "invoices_owner_select" ON public.invoices;
CREATE POLICY "invoices_owner_select" ON public.invoices FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invoice_id      UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount          NUMERIC(10,2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'GEL',
  status          public.payment_status NOT NULL DEFAULT 'pending',
  provider        TEXT,
  provider_tx_id  TEXT,
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);

DROP POLICY IF EXISTS "transactions_owner_select" ON public.transactions;
CREATE POLICY "transactions_owner_select" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_admin_all" ON public.transactions;
CREATE POLICY "transactions_admin_all" ON public.transactions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = TRUE OR role = 'SUPER_ADMIN')));


-- ═══════════════════════════════════════════════════════════════
-- SECTION 11: LISTING VIEWS — ანალიტიკა
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.listing_views (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  viewer_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  viewed_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  ip_hash     TEXT,
  device_type TEXT
);

ALTER TABLE public.listing_views ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_listing_views_listing_id ON public.listing_views(listing_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_views_viewer_id ON public.listing_views(viewer_id) WHERE viewer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listing_views_date ON public.listing_views(viewed_at DESC);

DROP POLICY IF EXISTS "listing_views_insert" ON public.listing_views;
CREATE POLICY "listing_views_insert" ON public.listing_views FOR INSERT TO authenticated, anon WITH CHECK (true);

DROP POLICY IF EXISTS "listing_views_owner_select" ON public.listing_views;
CREATE POLICY "listing_views_owner_select" ON public.listing_views FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.listings WHERE id = listing_views.listing_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = TRUE OR role IN ('SUPER_ADMIN','MODERATOR')))
  );


-- ═══════════════════════════════════════════════════════════════
-- SECTION 12: AFFILIATE PRODUCTS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.affiliate_products (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name   TEXT NOT NULL,
  product_name   TEXT NOT NULL,
  description    TEXT,
  image_url      TEXT,
  product_url    TEXT NOT NULL,
  price          NUMERIC(10,2),
  currency       TEXT DEFAULT 'GEL',
  commission_pct NUMERIC(5,2) DEFAULT 0.00,
  matching_tags  TEXT[] DEFAULT '{}',
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  clicks         INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at     TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.affiliate_products ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_affiliate_tags ON public.affiliate_products USING GIN(matching_tags);

DROP POLICY IF EXISTS "affiliate_public_read" ON public.affiliate_products;
CREATE POLICY "affiliate_public_read" ON public.affiliate_products FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "affiliate_admin_all" ON public.affiliate_products;
CREATE POLICY "affiliate_admin_all" ON public.affiliate_products FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = TRUE OR role = 'SUPER_ADMIN')));


-- ═══════════════════════════════════════════════════════════════
-- SECTION 13: AUDIT LOGS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_audit_logs_details ON public.audit_logs USING GIN(new_data);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

DROP POLICY IF EXISTS "audit_admin_select" ON public.audit_logs;
CREATE POLICY "audit_admin_select" ON public.audit_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = TRUE OR role IN ('SUPER_ADMIN','MODERATOR'))));

DROP POLICY IF EXISTS "audit_service_insert" ON public.audit_logs;
CREATE POLICY "audit_service_insert" ON public.audit_logs FOR INSERT TO service_role WITH CHECK (true);


-- ═══════════════════════════════════════════════════════════════
-- SECTION 14: REPORTS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_type     TEXT NOT NULL,
  target_id       UUID NOT NULL,
  reason          TEXT NOT NULL,
  description     TEXT,
  status          public.report_status NOT NULL DEFAULT 'pending',
  reviewed_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at     TIMESTAMPTZ,
  resolution_note TEXT,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_reports_target ON public.reports(target_type, target_id);

DROP POLICY IF EXISTS "reports_owner_insert" ON public.reports;
CREATE POLICY "reports_owner_insert" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reports_admin_all" ON public.reports;
CREATE POLICY "reports_admin_all" ON public.reports FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = TRUE OR role IN ('SUPER_ADMIN','MODERATOR'))));


-- ═══════════════════════════════════════════════════════════════
-- SECTION 15: DAILY METRICS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.daily_metrics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date     DATE NOT NULL UNIQUE,
  new_users       INTEGER NOT NULL DEFAULT 0,
  new_listings    INTEGER NOT NULL DEFAULT 0,
  active_listings INTEGER NOT NULL DEFAULT 0,
  total_views     INTEGER NOT NULL DEFAULT 0,
  new_messages    INTEGER NOT NULL DEFAULT 0,
  new_reviews     INTEGER NOT NULL DEFAULT 0,
  revenue_gel     NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON public.daily_metrics(metric_date DESC);

DROP POLICY IF EXISTS "daily_metrics_admin_all" ON public.daily_metrics;
CREATE POLICY "daily_metrics_admin_all" ON public.daily_metrics FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = TRUE OR role IN ('SUPER_ADMIN','MODERATOR'))));


-- ═══════════════════════════════════════════════════════════════
-- SECTION 16: TRIGGERS
-- ═══════════════════════════════════════════════════════════════

-- TRIGGER 1: ფასის შემცირებისას PRICE_DROP შეტყობინება wishlist-ის მომხმარებლებს
CREATE OR REPLACE FUNCTION public.notify_price_drop()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.price < OLD.price AND NEW.status = 'ACTIVE' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link, meta)
    SELECT
      w.user_id,
      '💸 ფასი შემცირდა!',
      NEW.title_ka || ' — ახალი ფასი: ' || NEW.price::TEXT || ' ₾',
      'PRICE_DROP',
      '/listings/' || NEW.id::TEXT,
      jsonb_build_object(
        'listing_id', NEW.id,
        'old_price', OLD.price,
        'new_price', NEW.price,
        'drop_pct', ROUND(((OLD.price - NEW.price) / NULLIF(OLD.price, 0)) * 100, 1)
      )
    FROM public.wishlists w
    WHERE w.listing_id = NEW.id AND w.user_id <> NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_price_drop_notify ON public.listings;
CREATE TRIGGER trg_price_drop_notify
  AFTER UPDATE OF price ON public.listings
  FOR EACH ROW
  WHEN (NEW.price IS DISTINCT FROM OLD.price)
  EXECUTE FUNCTION public.notify_price_drop();

-- TRIGGER 2: listing view-ების COUNT sync
CREATE OR REPLACE FUNCTION public.increment_listing_views()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.listings
    SET views_count = views_count + 1, updated_at = now()
  WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_views ON public.listing_views;
CREATE TRIGGER trg_increment_views
  AFTER INSERT ON public.listing_views
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_listing_views();

-- TRIGGER 3: updated_at ავტო-განახლება ახალ ცხრილებზე
DROP TRIGGER IF EXISTS trg_stores_updated_at ON public.stores;
CREATE TRIGGER trg_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_sub_plans_updated_at ON public.subscription_plans;
CREATE TRIGGER trg_sub_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_affiliate_updated_at ON public.affiliate_products;
CREATE TRIGGER trg_affiliate_updated_at
  BEFORE UPDATE ON public.affiliate_products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ═══════════════════════════════════════════════════════════════
-- SECTION 17: BULK ACTION RPCs
-- ═══════════════════════════════════════════════════════════════

-- RPC 1: Bulk განცხადებების სტატუსის ცვლილება (ადმინ პანელი)
CREATE OR REPLACE FUNCTION public.bulk_update_listing_status(
  listing_ids UUID[],
  new_status  TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  affected INTEGER;
  caller_is_admin BOOLEAN;
BEGIN
  SELECT (is_admin OR role IN ('SUPER_ADMIN','MODERATOR'))
    INTO caller_is_admin
  FROM public.profiles WHERE id = auth.uid();
  IF NOT COALESCE(caller_is_admin, FALSE) THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;
  UPDATE public.listings
    SET status = new_status::public.listing_status, updated_at = now()
  WHERE id = ANY(listing_ids);
  GET DIAGNOSTICS affected = ROW_COUNT;
  INSERT INTO public.audit_logs (actor_id, action, target_type, new_data)
  VALUES (auth.uid(), 'bulk_update_listing_status', 'listing',
    jsonb_build_object('ids', listing_ids, 'new_status', new_status, 'count', affected));
  RETURN affected;
END;
$$;

-- RPC 2: Bulk განცხადებების soft-delete
CREATE OR REPLACE FUNCTION public.bulk_delete_listings(listing_ids UUID[])
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  affected INTEGER;
  caller_is_admin BOOLEAN;
BEGIN
  SELECT (is_admin OR role IN ('SUPER_ADMIN','MODERATOR'))
    INTO caller_is_admin
  FROM public.profiles WHERE id = auth.uid();
  IF NOT COALESCE(caller_is_admin, FALSE) THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;
  UPDATE public.listings
    SET status = 'DELETED', deleted_at = now(), updated_at = now()
  WHERE id = ANY(listing_ids) AND deleted_at IS NULL;
  GET DIAGNOSTICS affected = ROW_COUNT;
  INSERT INTO public.audit_logs (actor_id, action, target_type, new_data)
  VALUES (auth.uid(), 'bulk_delete_listings', 'listing',
    jsonb_build_object('ids', listing_ids, 'count', affected));
  RETURN affected;
END;
$$;

-- RPC 3: Bulk მომხმარებლების გაყინვა
CREATE OR REPLACE FUNCTION public.bulk_suspend_users(
  user_ids UUID[],
  reason   TEXT DEFAULT 'Policy violation'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  affected INTEGER;
  caller_is_admin BOOLEAN;
BEGIN
  SELECT (is_admin OR role IN ('SUPER_ADMIN','MODERATOR'))
    INTO caller_is_admin
  FROM public.profiles WHERE id = auth.uid();
  IF NOT COALESCE(caller_is_admin, FALSE) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.profiles
    SET deleted_at = now(), updated_at = now()
  WHERE id = ANY(user_ids) AND deleted_at IS NULL;
  GET DIAGNOSTICS affected = ROW_COUNT;
  UPDATE public.listings
    SET status = 'HIDDEN', updated_at = now()
  WHERE user_id = ANY(user_ids) AND status = 'ACTIVE';
  INSERT INTO public.audit_logs (actor_id, action, target_type, new_data)
  VALUES (auth.uid(), 'bulk_suspend_users', 'user',
    jsonb_build_object('ids', user_ids, 'reason', reason, 'count', affected));
  RETURN affected;
END;
$$;

-- RPC 4: Bulk subscription ვადის გაგრძელება
CREATE OR REPLACE FUNCTION public.bulk_extend_subscription(
  user_ids   UUID[],
  extra_days INTEGER DEFAULT 30,
  new_tier   public.subscription_tier DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  affected INTEGER;
  caller_is_admin BOOLEAN;
BEGIN
  SELECT (is_admin OR role = 'SUPER_ADMIN')
    INTO caller_is_admin
  FROM public.profiles WHERE id = auth.uid();
  IF NOT COALESCE(caller_is_admin, FALSE) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.profiles
    SET
      subscription_expires_at = COALESCE(subscription_expires_at, now()) + (extra_days || ' days')::INTERVAL,
      subscription_tier = COALESCE(new_tier, subscription_tier),
      updated_at = now()
  WHERE id = ANY(user_ids);
  GET DIAGNOSTICS affected = ROW_COUNT;
  INSERT INTO public.audit_logs (actor_id, action, target_type, new_data)
  VALUES (auth.uid(), 'bulk_extend_subscription', 'user',
    jsonb_build_object('ids', user_ids, 'extra_days', extra_days, 'tier', new_tier, 'count', affected));
  RETURN affected;
END;
$$;

-- RPC 5: Seller Analytics
CREATE OR REPLACE FUNCTION public.get_seller_analytics(
  p_seller_id UUID,
  from_date   DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
  to_date     DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE result JSONB;
BEGIN
  IF auth.uid() <> p_seller_id AND NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (is_admin OR role IN ('SUPER_ADMIN','MODERATOR'))
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT jsonb_build_object(
    'total_listings',   (SELECT COUNT(*) FROM public.listings WHERE user_id = p_seller_id AND deleted_at IS NULL),
    'active_listings',  (SELECT COUNT(*) FROM public.listings WHERE user_id = p_seller_id AND status = 'ACTIVE'),
    'total_views',      (SELECT COUNT(*) FROM public.listing_views lv
                         JOIN public.listings l ON l.id = lv.listing_id
                         WHERE l.user_id = p_seller_id
                           AND lv.viewed_at::DATE >= from_date
                           AND lv.viewed_at::DATE <= to_date),
    'wishlist_saves',   (SELECT COUNT(*) FROM public.wishlists w
                         JOIN public.listings l ON l.id = w.listing_id
                         WHERE l.user_id = p_seller_id),
    'avg_rating',       (SELECT ROUND(AVG(rating)::NUMERIC, 2) FROM public.reviews WHERE seller_id = p_seller_id),
    'total_reviews',    (SELECT COUNT(*) FROM public.reviews WHERE seller_id = p_seller_id),
    'views_by_day',     (SELECT jsonb_agg(row_to_json(t)) FROM (
                          SELECT DATE(lv.viewed_at) AS day, COUNT(*) AS views
                          FROM public.listing_views lv
                          JOIN public.listings l ON l.id = lv.listing_id
                          WHERE l.user_id = p_seller_id
                            AND lv.viewed_at::DATE >= from_date
                            AND lv.viewed_at::DATE <= to_date
                          GROUP BY DATE(lv.viewed_at) ORDER BY day
                        ) t)
  ) INTO result;
  RETURN result;
END;
$$;


-- ═══════════════════════════════════════════════════════════════
-- SECTION 18: PERMISSIONS
-- ═══════════════════════════════════════════════════════════════

GRANT EXECUTE ON FUNCTION public.get_seller_analytics(UUID, DATE, DATE) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.bulk_update_listing_status(UUID[], TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bulk_delete_listings(UUID[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bulk_suspend_users(UUID[], TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bulk_extend_subscription(UUID[], INTEGER, public.subscription_tier) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.notify_price_drop() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_listing_views() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.bulk_update_listing_status(UUID[], TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.bulk_delete_listings(UUID[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.bulk_suspend_users(UUID[], TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.bulk_extend_subscription(UUID[], INTEGER, public.subscription_tier) TO authenticated, service_role;

-- ==============================================================================
-- END OF PHASE 1 MIGRATION ✅
-- ==============================================================================
-- ახალი ცხრილები (13):
--   stores, wishlists, notifications, site_settings,
--   subscription_plans, subscriptions, invoices, transactions,
--   listing_views, affiliate_products, audit_logs, reports, daily_metrics
-- ახალი ENUMs (5): user_role, notification_type, subscription_status,
--   payment_status, report_status
-- ახალი RPC-ები (5): bulk_update_listing_status, bulk_delete_listings,
--   bulk_suspend_users, bulk_extend_subscription, get_seller_analytics
-- ახალი ტრიგერები (2): trg_price_drop_notify, trg_increment_views
-- ==============================================================================
