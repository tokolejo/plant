-- ==============================================================================
-- Migration: Ensure user_role enum and role column on profiles
-- ==============================================================================

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

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS role public.user_role NOT NULL DEFAULT 'USER';

-- Ensure tokolejo@gmail.com and is_admin users have SUPER_ADMIN role
UPDATE public.profiles 
SET role = 'SUPER_ADMIN', is_admin = TRUE 
WHERE is_admin = TRUE OR email = 'tokolejo@gmail.com';

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
