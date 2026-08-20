-- ==============================================================================
-- Migration: Add Admin RLS Policies for Listings & Profiles Moderation
-- Enables Administrators (is_admin = true or tokolejo@gmail.com) to moderate
-- (update status, hide, restore, delete) any listing and manage user subscription tiers.
-- ==============================================================================

-- Drop existing policies if they conflict
DROP POLICY IF EXISTS "Admins can update any listing" ON public.listings;
DROP POLICY IF EXISTS "Admins can delete any listing" ON public.listings;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- 1. Admin Listings UPDATE Policy
CREATE POLICY "Admins can update any listing" ON public.listings
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = user_id)
  OR (auth.jwt() ->> 'email' = 'tokolejo@gmail.com')
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
  )
)
WITH CHECK (
  (auth.uid() = user_id)
  OR (auth.jwt() ->> 'email' = 'tokolejo@gmail.com')
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
  )
);

-- 2. Admin Listings DELETE Policy
CREATE POLICY "Admins can delete any listing" ON public.listings
FOR DELETE
TO authenticated
USING (
  (auth.uid() = user_id)
  OR (auth.jwt() ->> 'email' = 'tokolejo@gmail.com')
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
  )
);

-- 3. Admin Profiles UPDATE Policy
CREATE POLICY "Admins can update any profile" ON public.profiles
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = id)
  OR (auth.jwt() ->> 'email' = 'tokolejo@gmail.com')
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
  )
)
WITH CHECK (
  (auth.uid() = id)
  OR (auth.jwt() ->> 'email' = 'tokolejo@gmail.com')
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
  )
);
