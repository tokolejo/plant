-- ==============================================================================
-- 🔍 PLANT.GE — ADVANCED FULL-TEXT & TRIGRAM SEARCH (POSTGRESQL 15+)
-- Run this script in the Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Enable pg_trgm extension for fuzzy & substring matching
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- 2. GIN Trigram Indexes on Title and Description
-- Enables lightning fast ILIKE and similarity searches without sequential table scans
CREATE INDEX IF NOT EXISTS idx_listings_title_ka_trgm ON public.listings USING GIN (title_ka extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_listings_title_en_trgm ON public.listings USING GIN (title_en extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_listings_desc_ka_trgm ON public.listings USING GIN (description_ka extensions.gin_trgm_ops);

-- 3. Composite GIN Full-Text Index for multi-column search
CREATE INDEX IF NOT EXISTS idx_listings_fts ON public.listings USING GIN (
  to_tsvector('simple', COALESCE(title_ka, '') || ' ' || COALESCE(title_en, '') || ' ' || COALESCE(plant_category, ''))
);

-- 4. Advanced High-Performance Search RPC Function
CREATE OR REPLACE FUNCTION public.search_listings_fts(
  p_query TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_trans_type TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'newest',
  p_limit INT DEFAULT 30,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title_ka TEXT,
  title_en TEXT,
  description_ka TEXT,
  price NUMERIC,
  plant_category TEXT,
  item_type public.item_type,
  transaction_type public.transaction_type,
  delivery_methods public.delivery_method[],
  images TEXT[],
  city TEXT,
  address TEXT,
  status public.listing_status,
  views_count INT,
  is_featured BOOLEAN,
  boost_tier TEXT,
  created_at TIMESTAMPTZ,
  search_rank REAL
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_search_query TEXT := TRIM(COALESCE(p_query, ''));
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.user_id,
    l.title_ka,
    l.title_en,
    l.description_ka,
    l.price,
    l.plant_category,
    l.item_type,
    l.transaction_type,
    l.delivery_methods,
    l.images,
    l.city,
    l.address,
    l.status,
    COALESCE(l.views_count, 0) AS views_count,
    COALESCE(l.is_featured, FALSE) AS is_featured,
    COALESCE(l.boost_tier, 'STANDARD') AS boost_tier,
    l.created_at,
    CASE 
      WHEN v_search_query = '' THEN 0.0::REAL
      ELSE (
        extensions.similarity(l.title_ka, v_search_query) * 3.0 +
        extensions.similarity(COALESCE(l.title_en, ''), v_search_query) * 2.0 +
        extensions.similarity(COALESCE(l.plant_category, ''), v_search_query) * 1.5 +
        ts_rank(
          to_tsvector('simple', COALESCE(l.title_ka, '') || ' ' || COALESCE(l.title_en, '')),
          plainto_tsquery('simple', v_search_query)
        ) * 2.0
      )::REAL
    END AS search_rank
  FROM public.listings l
  WHERE 
    l.status = 'ACTIVE'
    AND (p_category IS NULL OR p_category = '' OR l.plant_category = p_category)
    AND (p_min_price IS NULL OR l.price >= p_min_price)
    AND (p_max_price IS NULL OR l.price <= p_max_price)
    AND (p_trans_type IS NULL OR p_trans_type = '' OR l.transaction_type::TEXT = p_trans_type)
    AND (p_city IS NULL OR p_city = '' OR l.city = p_city)
    AND (
      v_search_query = ''
      OR l.title_ka ILIKE '%' || v_search_query || '%'
      OR COALESCE(l.title_en, '') ILIKE '%' || v_search_query || '%'
      OR COALESCE(l.description_ka, '') ILIKE '%' || v_search_query || '%'
      OR COALESCE(l.plant_category, '') ILIKE '%' || v_search_query || '%'
      OR to_tsvector('simple', COALESCE(l.title_ka, '') || ' ' || COALESCE(l.title_en, '')) @@ plainto_tsquery('simple', v_search_query)
    )
  ORDER BY
    l.is_featured DESC,
    CASE WHEN v_search_query <> '' THEN search_rank END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'price-asc' THEN l.price END ASC,
    CASE WHEN p_sort_by = 'price-desc' THEN l.price END DESC,
    CASE WHEN p_sort_by = 'views' THEN l.views_count END DESC,
    l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.search_listings_fts TO anon, authenticated, service_role;
