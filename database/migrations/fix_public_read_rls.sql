-- ==============================================================================
-- Migration: Fix Public Read RLS Policies for Listings and Profiles
-- Ensures unauthenticated visitors and logged-in users can view all active listings,
-- count platform statistics accurately, and view public seller profiles.
-- ==============================================================================

-- 1. Listings Table: Public Read Policy
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active listings" ON public.listings;
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;
DROP POLICY IF EXISTS "Public can read listings" ON public.listings;

CREATE POLICY "Public can view active listings" ON public.listings
FOR SELECT
TO public
USING (
  (status = 'ACTIVE')
  OR (auth.uid() = user_id)
  OR (auth.jwt() ->> 'email' = 'tokolejo@gmail.com')
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
  )
);

-- 2. Profiles Table: Public Read Policy
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

CREATE POLICY "Public can view profiles" ON public.profiles
FOR SELECT
TO public
USING (true);
