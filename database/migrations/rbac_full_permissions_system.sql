-- ==============================================================================
-- Plantio / Plant - Complete Production Role-Based Access Control (RBAC) System
-- Enforces permissions for: SUPER_ADMIN, ADMIN, MODERATOR, VERIFIED_SELLER, USER
-- ==============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. Ensure user_role ENUM exists with all 5 tiers
-- ──────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM (
            'USER',
            'VERIFIED_SELLER',
            'MODERATOR',
            'ADMIN',
            'SUPER_ADMIN'
        );
    END IF;
END $$;

-- Ensure profiles table has role column with default 'USER'
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS role public.user_role NOT NULL DEFAULT 'USER';

-- Ensure tokolejo@gmail.com is SUPER_ADMIN
UPDATE public.profiles 
SET role = 'SUPER_ADMIN', is_admin = TRUE 
WHERE email = 'tokolejo@gmail.com' OR is_admin = TRUE;

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);


-- ──────────────────────────────────────────────────────────────────────────────
-- 2. SECURE RBAC HELPER FUNCTIONS (SET search_path = public, pg_temp)
-- ──────────────────────────────────────────────────────────────────────────────

-- 2.1 is_super_admin()
CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role user_role;
  v_email text;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT role, email INTO v_role, v_email
  FROM public.profiles
  WHERE id = p_user_id;

  RETURN (v_role = 'SUPER_ADMIN' OR v_email = 'tokolejo@gmail.com');
END;
$$;

REVOKE ALL ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated, service_role;


-- 2.2 is_admin_or_higher()
CREATE OR REPLACE FUNCTION public.is_admin_or_higher(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role user_role;
  v_is_admin boolean;
  v_email text;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT role, is_admin, email INTO v_role, v_is_admin, v_email
  FROM public.profiles
  WHERE id = p_user_id;

  RETURN (
    v_role IN ('ADMIN', 'SUPER_ADMIN') 
    OR COALESCE(v_is_admin, false) = true 
    OR v_email = 'tokolejo@gmail.com'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin_or_higher(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_or_higher(uuid) TO authenticated, service_role;


-- 2.3 is_moderator_or_higher()
CREATE OR REPLACE FUNCTION public.is_moderator_or_higher(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role user_role;
  v_is_admin boolean;
  v_email text;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT role, is_admin, email INTO v_role, v_is_admin, v_email
  FROM public.profiles
  WHERE id = p_user_id;

  RETURN (
    v_role IN ('MODERATOR', 'ADMIN', 'SUPER_ADMIN') 
    OR COALESCE(v_is_admin, false) = true 
    OR v_email = 'tokolejo@gmail.com'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_moderator_or_higher(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_moderator_or_higher(uuid) TO authenticated, service_role;


-- ──────────────────────────────────────────────────────────────────────────────
-- 3. RLS PERMISSIONS ENFORCEMENT ACROSS TABLES
-- ──────────────────────────────────────────────────────────────────────────────

-- 3.1 Listings Moderation & Deletion Policies
DROP POLICY IF EXISTS "Admins and Moderators can update any listing" ON public.listings;
CREATE POLICY "Admins and Moderators can update any listing" ON public.listings
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = user_id) OR public.is_moderator_or_higher(auth.uid())
)
WITH CHECK (
  (auth.uid() = user_id) OR public.is_moderator_or_higher(auth.uid())
);

DROP POLICY IF EXISTS "Admins can delete any listing" ON public.listings;
CREATE POLICY "Admins can delete any listing" ON public.listings
FOR DELETE
TO authenticated
USING (
  (auth.uid() = user_id) OR public.is_admin_or_higher(auth.uid())
);


-- 3.2 Profiles Management Policies
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = id) OR public.is_admin_or_higher(auth.uid())
)
WITH CHECK (
  (auth.uid() = id) OR public.is_admin_or_higher(auth.uid())
);


-- 3.3 Audit Logs Policies (Admins and Super Admins only)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_admin_select" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_select" ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.is_admin_or_higher(auth.uid()));


-- 3.4 Affiliate Products Policies
ALTER TABLE public.affiliate_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "affiliate_products_public_read" ON public.affiliate_products;
CREATE POLICY "affiliate_products_public_read" ON public.affiliate_products
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "affiliate_products_admin_all" ON public.affiliate_products;
CREATE POLICY "affiliate_products_admin_all" ON public.affiliate_products
FOR ALL
TO authenticated
USING (public.is_admin_or_higher(auth.uid()))
WITH CHECK (public.is_admin_or_higher(auth.uid()));
