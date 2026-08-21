-- ════════════════════════════════════════════════════════════════════════════════════════
-- 🌿 SEED REAL LISTINGS & ASSIGN TO YOUR GOOGLE / ADMIN ACCOUNT
-- ════════════════════════════════════════════════════════════════════════════════════════

-- 1. Ensure 'GIFT' exists in transaction_type enum if enum is used
DO $$ BEGIN
    ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'GIFT';
EXCEPTION
    WHEN others THEN null;
END $$;

-- 2. Insert Real Plant Listings into public.listings (Each listing has >= 2 images)
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Look for your user profile in public.profiles
    SELECT id INTO target_user_id 
    FROM public.profiles 
    WHERE is_admin = true OR custom_slug = 'tokolejo' OR full_name ILIKE '%Toko%' OR full_name ILIKE '%თოკო%'
    LIMIT 1;

    -- If not found, check auth.users for Google email
    IF target_user_id IS NULL THEN
        BEGIN
            SELECT id INTO target_user_id 
            FROM auth.users 
            WHERE email = 'tokolejo@gmail.com' OR email ILIKE '%toko%'
            LIMIT 1;
        EXCEPTION WHEN others THEN
            null;
        END;
    END IF;

    -- Fallback: first profile in the database
    IF target_user_id IS NULL THEN
        SELECT id INTO target_user_id FROM public.profiles ORDER BY created_at ASC LIMIT 1;
    END IF;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION '❌ No profile found in public.profiles. Please log in to the website first so your profile is created.';
    END IF;

    -- Insert rich real plant listings assigned to your profile
    INSERT INTO public.listings (
        user_id, 
        item_type, 
        plant_category, 
        title_ka, 
        title_en, 
        description_ka, 
        description_en,
        price, 
        transaction_type, 
        delivery_methods, 
        images, 
        city, 
        address,
        is_featured, 
        status, 
        views_count, 
        trade_preferences
    )
    SELECT
        target_user_id,
        seed.item_type::public.item_type,
        seed.plant_category,
        seed.title_ka,
        seed.title_en,
        seed.description_ka,
        seed.description_en,
        seed.price,
        seed.transaction_type::public.transaction_type,
        seed.delivery_methods::public.delivery_method[],
        seed.images,
        seed.city,
        seed.address,
        seed.is_featured,
        'ACTIVE'::public.listing_status,
        seed.views_count,
        seed.trade_preferences
    FROM (
        VALUES
        (
            'PLANT', 'monstera',
            'იშვიათი Monstera Thai Constellation (დიდი ზომა, ფესვიანი)',
            'Rare Monstera Thai Constellation (Large, Rooted)',
            'ჯანსაღი, უნიკალური ვარიეგაციის მქონე მონსტერა. გამოყვანილია პრემიუმ სუბსტრატში, აქვს ძლიერი ფესვთა სისტემა.',
            'Healthy, uniquely variegated Monstera Thai Constellation with strong root system in premium aroid soil.',
            180.00, 'FIXED', ARRAY['PICKUP', 'COURIER']::text[],
            ARRAY['https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800', 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=800']::text[],
            'თბილისი (ვაკე)', 'ჭავჭავაძის გამზ. 42',
            true, 142, ARRAY[]::text[]
        ),
        (
            'PLANT', 'philodendron',
            'Philodendron Pink Princess — კარგად გამოხატული ვარიეგაციით',
            'Philodendron Pink Princess — High Variegation',
            'ვარდისფერი პრინცესა ინტენსიური ვარდისფერი ჭრელი ფოთლებით. იცვლება Monstera Albo-ში ან იშვიათ აროიდებში.',
            'Pink Princess Philodendron with vibrant pink sectors. Open for trade for Monstera Albo or rare aroids.',
            0.00, 'TRADE', ARRAY['PICKUP', 'MARSHRUTKA']::text[],
            ARRAY['https://images.unsplash.com/photo-1597055181300-e3633a917c9c?w=800', 'https://images.unsplash.com/photo-1604762524889-3e2fcc145683?w=800']::text[],
            'ბათუმი', 'რუსთაველის ქ. 15',
            false, 89, ARRAY['Monstera Albo', 'Anthurium', 'Syngonium']::text[]
        ),
        (
            'INVENTORY', 'pots-ceramic',
            'პრემიუმ კერამიკული ქოთნების კომპლექტი სადგამით (3 ცალი)',
            'Premium Ceramic Plant Pots Set with Saucers (3 pcs)',
            'ხელნაკეთი კერამიკული ქოთნები დრენაჟის ნახვრეტით და თეფშით. იდეალურია აროიდებისთვის და ოთახის მცენარეებისთვის.',
            'Handmade ceramic pots with drainage holes and matching saucers. Ideal for indoor houseplants.',
            65.00, 'NEGOTIABLE', ARRAY['PICKUP', 'COURIER', 'MARSHRUTKA']::text[],
            ARRAY['https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800', 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=800']::text[],
            'თბილისი (საბურთალო)', 'ვაჟა-ფშაველას გამზ. 20',
            true, 65, ARRAY[]::text[]
        ),
        (
            'PLANT', 'ficus',
            'Ficus Lyrata (ვიოლინოსებრი ფიკუსი, სიმაღლე 1.2 მ)',
            'Ficus Lyrata (Fiddle Leaf Fig, Height 1.2m)',
            'დიდი და ჯანსაღი ვიოლინოსებრი ფიკუსი, დარგულია კერამიკულ ქოთანში. იდეალურია მისაღები ოთახისა და ოფისის დეკორისთვის.',
            'Large and healthy Fiddle Leaf Fig planted in a ceramic pot. Perfect for living room and office.',
            110.00, 'FIXED', ARRAY['PICKUP', 'COURIER']::text[],
            ARRAY['https://images.unsplash.com/photo-1545241047-6083a3684587?w=800', 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800']::text[],
            'ქუთაისი', 'წერეთლის ქ. 8',
            false, 112, ARRAY[]::text[]
        ),
        (
            'INVENTORY', 'substrate-soil',
            'სპეციალური აროიდების სუბსტრატი (ქერქი + პერლიტი + ნახშირი) 10ლ',
            'Special Aroid Chunky Soil Mix (Bark + Perlite + Charcoal) 10L',
            'ჰაეროვანი და ფხვიერი სუბსტრატი მონსტერების, ფილოდენდრონებისა და ანთურიუმებისთვის. იცავს ფესვებს ლპობისგან.',
            'Chunky and airy substrate mix for Monsteras, Philodendrons and Anthuriums. Prevents root rot.',
            25.00, 'FIXED', ARRAY['PICKUP', 'COURIER', 'MARSHRUTKA']::text[],
            ARRAY['https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800']::text[],
            'თბილისი (დიდუბე)', 'წერეთლის გამზ. 116',
            false, 204, ARRAY[]::text[]
        ),
        (
            'PLANT', 'anthurium',
            'Anthurium Clarinervium (ხავერდოვანი ფოთლებით, ახალი ფესვებით)',
            'Anthurium Clarinervium (Velvet Foliage, Fresh Roots)',
            'მუქი მწვანე ხავერდოვანი ფოთლები თეთრი ძარღვებით. დარგულია პერლიტიან გრუნტში.',
            'Dark green velvet leaves with striking white veins. Well rooted and actively growing.',
            75.00, 'NEGOTIABLE', ARRAY['PICKUP', 'COURIER']::text[],
            ARRAY['https://images.unsplash.com/photo-1512428813834-c702c7702b78?w=800', 'https://images.unsplash.com/photo-1597055181300-e3633a917c9c?w=800']::text[],
            'თბილისი (ჩუღურეთი)', 'აღმაშენებლის გამზ. 85',
            false, 78, ARRAY[]::text[]
        ),
        (
            'PLANT', 'monstera',
            'Monstera Deliciosa — საჩუქრად მცენარეების მოყვარულს',
            'Monstera Deliciosa — Free Giveaway for Plant Lovers',
            'გავაჩუქებ ჯანსაღ მონსტერას დაფესვიანებულ კალამს ახალი ფოთლით. გატანა ადგილიდან ისანში.',
            'Giving away a rooted Monstera Deliciosa cutting for free to plant enthusiasts. Pickup in Isani.',
            0.00, 'FIXED', ARRAY['PICKUP']::text[],
            ARRAY['https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800', 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=800']::text[],
            'თბილისი (ისანი)', 'ნავთლუღის ქ. 10',
            false, 95, ARRAY[]::text[]
        )
    ) AS seed(
        item_type, plant_category, title_ka, title_en, description_ka, description_en,
        price, transaction_type, delivery_methods, images, city, address,
        is_featured, views_count, trade_preferences
    )
    WHERE NOT EXISTS (
        SELECT 1 FROM public.listings WHERE title_ka = seed.title_ka
    );

    RAISE NOTICE '✅ მცენარეები წარმატებით მიება პროფილს: %', target_user_id;
END $$;
