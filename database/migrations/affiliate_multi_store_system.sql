-- ==============================================================================
-- Migration: Multi-Store Affiliate System, Partners & Bulk Ingestion
-- ==============================================================================

-- 1. Create Affiliate Partners Table
CREATE TABLE IF NOT EXISTS public.affiliate_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    website_url TEXT,
    badge_color TEXT NOT NULL DEFAULT '#16a34a',
    logo_url TEXT,
    referral_param_template TEXT NOT NULL DEFAULT '?ref=plantge',
    commission_rate NUMERIC(5, 2) DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for partners
ALTER TABLE public.affiliate_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "affiliate_partners_public_read" ON public.affiliate_partners;
CREATE POLICY "affiliate_partners_public_read" ON public.affiliate_partners
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "affiliate_partners_admin_all" ON public.affiliate_partners;
CREATE POLICY "affiliate_partners_admin_all" ON public.affiliate_partners
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN ('SUPER_ADMIN', 'FINANCE_ADMIN', 'CONTENT_MANAGER'))
        OR auth.email() = 'tokolejo@gmail.com'
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN ('SUPER_ADMIN', 'FINANCE_ADMIN', 'CONTENT_MANAGER'))
        OR auth.email() = 'tokolejo@gmail.com'
    );

-- 2. Enhance Affiliate Products Table
ALTER TABLE public.affiliate_products 
    ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES public.affiliate_partners(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'ინვენტარი',
    ADD COLUMN IF NOT EXISTS raw_category TEXT,
    ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS clicks INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS clicks_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMPTZ DEFAULT now();

-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_affiliate_products_partner_id ON public.affiliate_products(partner_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_category ON public.affiliate_products(category);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_is_active ON public.affiliate_products(is_active);

-- 3. Seed Standard Georgian & International Partners
INSERT INTO public.affiliate_partners (name, slug, website_url, badge_color, referral_param_template, commission_rate, is_active)
VALUES
    ('Domino', 'domino', 'https://domino.com.ge', '#16a34a', '?ref=plantge', 5.0, true),
    ('Gorgia', 'gorgia', 'https://gorgia.ge', '#ea580c', '?ref=plantge', 5.0, true),
    ('Bricorama', 'bricorama', 'https://bricorama.ge', '#dc2626', '?ref=plantge', 5.0, true),
    ('Agrohub', 'agrohub', 'https://agrohub.ge', '#059669', '?utm_source=plantge', 7.0, true),
    ('Miaplant', 'miaplant', 'https://miaplant.ge', '#0284c7', '?ref=plantge', 10.0, true),
    ('Amazon', 'amazon', 'https://amazon.com', '#d97706', '?tag=plantge-20', 4.0, true)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    website_url = EXCLUDED.website_url,
    badge_color = EXCLUDED.badge_color,
    referral_param_template = EXCLUDED.referral_param_template;
