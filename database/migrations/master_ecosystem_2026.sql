-- ==============================================================================
-- 🌿 PLANT.GE — MASTER BOTANICAL ECOSYSTEM DATABASE MIGRATION (2026)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. VIRTUAL GREENHOUSE (User Plants Collection & Care Schedules)
CREATE TABLE IF NOT EXISTS public.user_plants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    species_name TEXT,
    room_location TEXT DEFAULT 'მისაღები',
    watering_frequency_days INTEGER NOT NULL DEFAULT 7,
    last_watered_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    next_watering_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW() + INTERVAL '7 days') NOT NULL,
    image_url TEXT,
    notes TEXT,
    health_status TEXT DEFAULT 'HEALTHY',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS for user_plants
ALTER TABLE public.user_plants ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view their own greenhouse plants"
    ON public.user_plants FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own greenhouse plants"
    ON public.user_plants FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own greenhouse plants"
    ON public.user_plants FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their own greenhouse plants"
    ON public.user_plants FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. GARDENING & LANDSCAPING SERVICES DIRECTORY
CREATE TABLE IF NOT EXISTS public.gardening_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider_name TEXT NOT NULL,
    provider_avatar TEXT,
    is_verified BOOLEAN DEFAULT TRUE,
    category TEXT NOT NULL DEFAULT 'PRUNING', -- PRUNING, LANDSCAPE, LAWN, GREENING, IRRIGATION, DOCTOR_VISIT
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price_from NUMERIC(10, 2) NOT NULL DEFAULT 50.00,
    price_unit TEXT NOT NULL DEFAULT 'ხეზე',
    city TEXT NOT NULL DEFAULT 'თბილისი',
    phone TEXT NOT NULL,
    whatsapp TEXT,
    portfolio_images TEXT[] DEFAULT '{}',
    rating NUMERIC(3, 2) DEFAULT 5.00,
    reviews_count INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS for gardening_services
ALTER TABLE public.gardening_services ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public can view active gardening services"
    ON public.gardening_services FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Providers can manage their own services"
    ON public.gardening_services FOR ALL USING (auth.uid() = provider_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. SERVICE INQUIRIES & BOOKING LEADS
CREATE TABLE IF NOT EXISTS public.service_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES public.gardening_services(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'NEW', -- NEW, CONTACTED, COMPLETED, CANCELLED
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.service_inquiries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public can insert service inquiries"
    ON public.service_inquiries FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Providers and Clients can view inquiries"
    ON public.service_inquiries FOR SELECT USING (
      auth.uid() = client_id OR 
      EXISTS (SELECT 1 FROM public.gardening_services WHERE id = service_inquiries.service_id AND provider_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. COMMUNITY POSTS & Q&A FORUM
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    category TEXT NOT NULL DEFAULT 'QA', -- QA, IDENTIFY, SHOWCASE, SWAP, CONTEST
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    upvotes_count INTEGER DEFAULT 1,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public can view community posts"
    ON public.community_posts FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can create community posts"
    ON public.community_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. COMMUNITY COMMENTS
CREATE TABLE IF NOT EXISTS public.community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public can view community comments"
    ON public.community_comments FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert comments"
    ON public.community_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Success confirmation
DO $$ BEGIN
  RAISE NOTICE '✅ Plant.ge Master Botanical Ecosystem tables created & secured successfully!';
END $$;
