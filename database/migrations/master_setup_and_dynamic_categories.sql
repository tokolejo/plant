-- ==============================================================================
-- 🌿 PLANT.GE — MASTER DATABASE MIGRATION & DYNAMIC CATEGORIES SYSTEM
-- 
-- 1. Admin Full Privileges (d16ac556-a368-41dc-a7d1-d9c1f3feb4c8 / tokolejo@gmail.com)
-- 2. Listings Schema Columns (inventory_category, trade_preferences, trade_tags)
-- 3. Dynamic Categories Table (public.categories)
-- 4. Automatic Category Trigger (Auto-registers new categories from any user listing)
-- 5. Complete RLS Security Policies
-- 6. Schema Cache Reload
-- ==============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ENSURE LISTINGS TABLE HAS ALL NECESSARY COLUMNS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS inventory_category TEXT;

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS plant_category TEXT DEFAULT 'other-plant';

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS trade_preferences TEXT[] DEFAULT '{}';

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS trade_tags TEXT[] DEFAULT '{}';

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS delivery_methods TEXT[] DEFAULT '{PICKUP}';

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS boost_tier TEXT DEFAULT 'STANDARD';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ENSURE PROFILES TABLE HAS ADMIN AND SUBSCRIPTION FIELDS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'FREE';

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3, 2) DEFAULT 5.00;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS custom_slug TEXT;

-- Explicitly set admin rights for tokolejo@gmail.com
UPDATE public.profiles 
SET is_admin = TRUE, subscription_tier = 'TIER_3'
WHERE id = 'd16ac556-a368-41dc-a7d1-d9c1f3feb4c8'
   OR id IN (SELECT id FROM auth.users WHERE email = 'tokolejo@gmail.com');

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. DYNAMIC CATEGORIES TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name_ka TEXT NOT NULL,
    name_en TEXT,
    item_type TEXT NOT NULL DEFAULT 'PLANT' CHECK (item_type IN ('PLANT', 'INVENTORY')),
    icon TEXT DEFAULT '🌿',
    group_name TEXT DEFAULT 'other',
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Seed Initial System Categories (if not exists)
INSERT INTO public.categories (slug, name_ka, name_en, item_type, icon, group_name, is_system)
VALUES 
    -- 🌿 Plants
    ('monstera', 'მონსტერა', 'Monstera', 'PLANT', '🌿', 'aroid', true),
    ('philodendron', 'ფილოდენდრონი', 'Philodendron', 'PLANT', '🌱', 'aroid', true),
    ('anthurium', 'ანთურიუმი', 'Anthurium', 'PLANT', '🌺', 'aroid', true),
    ('alocasia', 'ალოკაზია', 'Alocasia', 'PLANT', '🍃', 'aroid', true),
    ('calathea', 'კალათეა / მარანტა', 'Calathea / Maranta', 'PLANT', '🌿', 'aroid', true),
    ('pothos-scindapsus', 'პოთოსი / სცინდაპსუსი', 'Pothos / Scindapsus', 'PLANT', '🌾', 'aroid', true),
    ('orchid', 'ორქიდეა', 'Orchid', 'PLANT', '🌸', 'flowering', true),
    ('bromeliad', 'ბრომელია', 'Bromeliad', 'PLANT', '🌺', 'flowering', true),
    ('ficus', 'ფიკუსი', 'Ficus', 'PLANT', '🌳', 'tree-ficus', true),
    ('palm', 'პალმა', 'Palm', 'PLANT', '🌴', 'tree-ficus', true),
    ('fern', 'გვიმრა', 'Fern', 'PLANT', '🌿', 'tree-ficus', true),
    ('outdoor-garden', 'ბაღის & ეზოს მცენარეები', 'Outdoor & Garden', 'PLANT', '🌻', 'tree-ficus', true),
    ('cactus-succulent', 'კაქტუსი & სუქულენტი', 'Cactus & Succulent', 'PLANT', '🌵', 'cactus-etc', true),
    ('rare-variegated', 'იშვიათი & ვარიეგატული', 'Rare & Variegated', 'PLANT', '✨', 'cactus-etc', true),
    ('cutting', 'კალმები & ნერგები', 'Cuttings & Seedlings', 'PLANT', '✂️', 'cactus-etc', true),
    ('bonsai', 'ბონსაი', 'Bonsai', 'PLANT', '🎋', 'tree-ficus', true),
    ('sansevieria', 'სანსევიერია', 'Sansevieria', 'PLANT', '🪴', 'cactus-etc', true),
    ('zz-plant', 'ზამიოკულკასი (ZZ)', 'ZZ Plant', 'PLANT', '🌿', 'aroid', true),
    ('hoya', 'ხოია / ცვილისებრი', 'Hoya', 'PLANT', '🌸', 'flowering', true),
    ('syngonium', 'სინგონიუმი', 'Syngonium', 'PLANT', '🌱', 'aroid', true),

    -- 🏺 Inventory & Care
    ('pots-ceramic', 'კერამიკული ქოთნები & სადგამები', 'Ceramic Pots & Saucers', 'INVENTORY', '🏺', 'inventory', true),
    ('pots-plastic', 'პლასტიკური & საწარმოო ქოთნები', 'Plastic & Nursery Pots', 'INVENTORY', '🪣', 'inventory', true),
    ('substrate-soil', 'სუბსტრატები, გრუნტი & პერლიტი', 'Substrates, Soil & Perlite', 'INVENTORY', '🌍', 'inventory', true),
    ('fertilizer', 'სასუქები, ვიტამინები & მოვლა', 'Fertilizer & Nutrients', 'INVENTORY', '🧪', 'inventory', true),
    ('tools-care', 'მცენარის მოვლის ხელსაწყოები', 'Care Tools & Shears', 'INVENTORY', '🔧', 'inventory', true),
    ('lighting-grow', 'ფიტო-განათება (Grow Light)', 'Grow Lighting', 'INVENTORY', '💡', 'inventory', true)
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. AUTOMATIC CATEGORY CREATION TRIGGER
-- Whenever a user adds or edits a listing with a new category, this function 
-- automatically inserts it into public.categories if it does not exist yet!
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_auto_create_listing_category()
RETURNS TRIGGER AS $$
DECLARE
    cat_name TEXT;
    cat_slug TEXT;
    cat_type TEXT;
BEGIN
    -- 1. Check Plant Category
    IF NEW.plant_category IS NOT NULL AND TRIM(NEW.plant_category) <> '' THEN
        cat_name := TRIM(NEW.plant_category);
        -- Generate simple clean slug
        cat_slug := LOWER(REGEXP_REPLACE(cat_name, '[^a-zA-Z0-9\u10A0-\u10FF]+', '-', 'g'));
        cat_slug := TRIM(BOTH '-' FROM cat_slug);
        
        IF LENGTH(cat_slug) > 0 THEN
            cat_type := COALESCE(NEW.item_type, 'PLANT');
            
            INSERT INTO public.categories (slug, name_ka, name_en, item_type, icon, group_name, is_system)
            VALUES (
                cat_slug, 
                INITCAP(cat_name), 
                INITCAP(cat_name), 
                cat_type, 
                CASE WHEN cat_type = 'INVENTORY' THEN '📦' ELSE '🌿' END,
                CASE WHEN cat_type = 'INVENTORY' THEN 'inventory' ELSE 'other' END,
                FALSE
            )
            ON CONFLICT (slug) DO NOTHING;
        END IF;
    END IF;

    -- 2. Check Inventory Category (if provided)
    IF NEW.inventory_category IS NOT NULL AND TRIM(NEW.inventory_category) <> '' THEN
        cat_name := TRIM(NEW.inventory_category);
        cat_slug := LOWER(REGEXP_REPLACE(cat_name, '[^a-zA-Z0-9\u10A0-\u10FF]+', '-', 'g'));
        cat_slug := TRIM(BOTH '-' FROM cat_slug);
        
        IF LENGTH(cat_slug) > 0 THEN
            INSERT INTO public.categories (slug, name_ka, name_en, item_type, icon, group_name, is_system)
            VALUES (
                cat_slug, 
                INITCAP(cat_name), 
                INITCAP(cat_name), 
                'INVENTORY', 
                '📦',
                'inventory',
                FALSE
            )
            ON CONFLICT (slug) DO NOTHING;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind Trigger to listings table
DROP TRIGGER IF EXISTS trg_auto_create_listing_category ON public.listings;

CREATE TRIGGER trg_auto_create_listing_category
AFTER INSERT OR UPDATE OF plant_category, inventory_category, item_type
ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.fn_auto_create_listing_category();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. RLS POLICIES FOR CATEGORIES, LISTINGS & PROFILES
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.uid() = 'd16ac556-a368-41dc-a7d1-d9c1f3feb4c8'::uuid
        OR (auth.jwt() ->> 'email') = 'tokolejo@gmail.com'
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Categories RLS:
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Categories can be inserted by authenticated users or triggers" ON public.categories;
CREATE POLICY "Categories can be inserted by authenticated users or triggers" 
ON public.categories FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Categories can be updated by admin" ON public.categories;
CREATE POLICY "Categories can be updated by admin" 
ON public.categories FOR ALL 
USING (public.is_admin_user());

-- Listings RLS:
DROP POLICY IF EXISTS "Public can view active listings" ON public.listings;
CREATE POLICY "Public can view active listings" 
ON public.listings FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can insert their own listings" ON public.listings;
CREATE POLICY "Users can insert their own listings" 
ON public.listings FOR INSERT 
WITH CHECK (auth.uid() = user_id OR public.is_admin_user());

DROP POLICY IF EXISTS "Owners and admins can update listings" ON public.listings;
CREATE POLICY "Owners and admins can update listings" 
ON public.listings FOR UPDATE 
USING (auth.uid() = user_id OR public.is_admin_user());

DROP POLICY IF EXISTS "Owners and admins can delete listings" ON public.listings;
CREATE POLICY "Owners and admins can delete listings" 
ON public.listings FOR DELETE 
USING (auth.uid() = user_id OR public.is_admin_user());

-- Profiles RLS:
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id OR public.is_admin_user());

DROP POLICY IF EXISTS "Users can update own profile and admins can update all" ON public.profiles;
CREATE POLICY "Users can update own profile and admins can update all" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id OR public.is_admin_user());

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. RELOAD SCHEMA CACHE
-- ─────────────────────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
