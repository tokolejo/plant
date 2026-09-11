-- ==============================================================================
-- Plantio.ge: Supabase Synchronization & Database Hardening
-- გაუშვით ეს სკრიპტი Supabase SQL Editor-ში
-- ==============================================================================

-- 1. Create or Replace Atomic Click Increment RPC
CREATE OR REPLACE FUNCTION public.increment_affiliate_click(product_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.affiliate_products
    SET 
        clicks = COALESCE(clicks, 0) + 1,
        clicks_count = COALESCE(clicks_count, 0) + 1
    WHERE id = product_id;
END;
$$;

-- Grant execution to authenticated & service_role & anon
GRANT EXECUTE ON FUNCTION public.increment_affiliate_click(UUID) TO authenticated, service_role, anon;

-- 2. Update existing affiliate partner referral parameters to Plantio
UPDATE public.affiliate_partners
SET referral_param_template = REPLACE(referral_param_template, 'plantge', 'plantio')
WHERE referral_param_template LIKE '%plantge%';

-- 3. Ensure affiliate_partners table schema & RLS policies
ALTER TABLE public.affiliate_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "affiliate_partners_public_read" ON public.affiliate_partners;
CREATE POLICY "affiliate_partners_public_read" ON public.affiliate_partners
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "affiliate_partners_admin_all" ON public.affiliate_partners;
CREATE POLICY "affiliate_partners_admin_all" ON public.affiliate_partners
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN ('SUPER_ADMIN', 'FINANCE_ADMIN', 'CONTENT_MANAGER', 'ADMIN'))
        OR auth.email() = 'tokolejo@gmail.com'
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN ('SUPER_ADMIN', 'FINANCE_ADMIN', 'CONTENT_MANAGER', 'ADMIN'))
        OR auth.email() = 'tokolejo@gmail.com'
    );

-- 4. Update default partners list if missing
INSERT INTO public.affiliate_partners (name, slug, website_url, badge_color, referral_param_template, commission_rate, is_active)
VALUES
    ('Domino', 'domino', 'https://domino.com.ge', '#16a34a', '?ref=plantio', 5.0, true),
    ('Gorgia', 'gorgia', 'https://gorgia.ge', '#ea580c', '?ref=plantio', 5.0, true),
    ('Bricorama', 'bricorama', 'https://bricorama.ge', '#dc2626', '?ref=plantio', 5.0, true),
    ('Agrohub', 'agrohub', 'https://agrohub.ge', '#059669', '?utm_source=plantio', 7.0, true),
    ('Miaplant', 'miaplant', 'https://miaplant.ge', '#0284c7', '?ref=plantio', 10.0, true),
    ('Amazon', 'amazon', 'https://amazon.com', '#d97706', '?tag=plantio-20', 4.0, true)
ON CONFLICT (slug) DO UPDATE SET
    referral_param_template = EXCLUDED.referral_param_template;
