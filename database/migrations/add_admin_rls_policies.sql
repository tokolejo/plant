-- ==============================================================================
-- Migration: Add Admin RLS Policies for Listings & Profiles Moderation
-- Enables Administrators (is_admin = true or tokolejo@gmail.com) to moderate
-- (update status, hide, restore, delete) any listing and manage user subscription tiers.
-- ==============================================================================

-- 1. Ensure is_admin column exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. Grant Admin Status to tokolejo@gmail.com
UPDATE public.profiles
SET is_admin = TRUE
WHERE id IN (SELECT id FROM auth.users WHERE email = 'tokolejo@gmail.com')
   OR id = 'd16ac556-a368-41dc-a7d1-d9c1f3feb4c8';

-- 3. Drop existing policies if they conflict
DROP POLICY IF EXISTS "Admins can update any listing" ON public.listings;
DROP POLICY IF EXISTS "Admins can delete any listing" ON public.listings;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- 4. Admin Listings UPDATE Policy
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

-- 5. Admin Listings DELETE Policy
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

-- 6. Admin Profiles UPDATE Policy (Subscription Tier & Settings)
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
