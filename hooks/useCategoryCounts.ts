"use client";

import * as React from "react";
import { createClient } from "@/utils/supabase/client";
import { SAMPLE_LISTINGS } from "@/lib/mock-data";
import type { CategoryCounts } from "@/lib/categories";

/**
 * useCategoryCounts
 *
 * Returns live category counts from Supabase.
 * Falls back to mock data counts when no real DB listings exist yet.
 *
 * Supabase query uses the `category_counts` VIEW created by the migration.
 * Real-time subscription updates counts when listings are added/removed.
 */
export function useCategoryCounts(): {
  counts: CategoryCounts;
  loading: boolean;
} {
  const [counts, setCounts] = React.useState<CategoryCounts>({});
  const [loading, setLoading] = React.useState(true);
  const supabase = createClient();

  // Build mock fallback from mock data
  const mockCounts = React.useMemo<CategoryCounts>(() => {
    const map: CategoryCounts = {};
    SAMPLE_LISTINGS.forEach((l) => {
      if (l.plantCategory) {
        map[l.plantCategory] = (map[l.plantCategory] || 0) + 1;
      }
    });
    return map;
  }, []);

  React.useEffect(() => {
    let mounted = true;

    async function fetchCounts() {
      try {
        // Try fetching from the category_counts view
        const { data, error } = await supabase
          .from("category_counts")
          .select("plant_category, listing_count");

        if (error || !data || data.length === 0) {
          // Fallback: query listings table directly
          const { data: listings, error: listingsError } = await supabase
            .from("listings")
            .select("plant_category")
            .eq("status", "ACTIVE")
            .not("plant_category", "is", null);

          if (listingsError || !listings || listings.length === 0) {
            // Final fallback: use mock data
            if (mounted) {
              setCounts(mockCounts);
              setLoading(false);
            }
            return;
          }

          // Aggregate counts from listings
          const aggregated: CategoryCounts = {};
          listings.forEach((l: any) => {
            if (l.plant_category) {
              aggregated[l.plant_category] = (aggregated[l.plant_category] || 0) + 1;
            }
          });
          if (mounted) {
            setCounts(Object.keys(aggregated).length > 0 ? aggregated : mockCounts);
            setLoading(false);
          }
          return;
        }

        // Build counts from view result
        const result: CategoryCounts = {};
        data.forEach((row: any) => {
          if (row.plant_category) {
            result[row.plant_category] = Number(row.listing_count);
          }
        });

        if (mounted) {
          setCounts(Object.keys(result).length > 0 ? result : mockCounts);
          setLoading(false);
        }
      } catch (e) {
        // Always fall back to mock data on error
        if (mounted) {
          setCounts(mockCounts);
          setLoading(false);
        }
      }
    }

    fetchCounts();

    // Realtime subscription — re-fetch counts when listings change
    const channel = supabase
      .channel("category-counts-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listings" },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [mockCounts, supabase]);

  return { counts, loading };
}
