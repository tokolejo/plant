import { createClient } from "@/utils/supabase/client";
import { SAMPLE_LISTINGS, ExtendedListingCardProps } from "./mock-data";

/**
 * Transforms a Supabase database listing row into the ExtendedListingCardProps format used across UI
 */
export function formatDbListing(dbRow: any, sellerProfile?: any): ExtendedListingCardProps {
  const images = Array.isArray(dbRow.images) && dbRow.images.length > 0
    ? dbRow.images
    : typeof dbRow.image === "string" && dbRow.image
    ? [dbRow.image]
    : ["https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800"];

  return {
    id: dbRow.id,
    title: dbRow.title_ka || dbRow.title || "მცენარე",
    titleKa: dbRow.title_ka || dbRow.title || "მცენარე",
    titleEn: dbRow.title_en || dbRow.title || "Plant",
    descriptionKa: dbRow.description_ka || dbRow.description,
    descriptionEn: dbRow.description_en,
    price: Number(dbRow.price) || 0,
    itemType: dbRow.item_type || "PLANT",
    plantCategory: dbRow.plant_category || "monstera",
    transactionType: dbRow.transaction_type || "FIXED",
    deliveryMethods: Array.isArray(dbRow.delivery_methods) ? dbRow.delivery_methods : ["PICKUP"],
    images: images,
    city: dbRow.city || "თბილისი",
    address: dbRow.address,
    lat: dbRow.lat || 41.7151,
    lng: dbRow.lng || 44.8271,
    isPremium: dbRow.is_boosted || false,
    viewsCount: dbRow.views_count || 1,
    createdAt: dbRow.created_at,
    tradePreferences: dbRow.trade_preferences || [],
    seller: {
      id: sellerProfile?.id || dbRow.user_id || "usr-anon",
      fullName: sellerProfile?.full_name || "მებაღე",
      avatarUrl: sellerProfile?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
      rating: Number(sellerProfile?.average_rating) || 5.0,
      totalReviews: Number(sellerProfile?.total_reviews) || 1,
      badges: sellerProfile?.is_verified ? ["Verified Seller"] : ["Community Member"],
      tier: sellerProfile?.subscription_tier || "FREE",
      customSlug: sellerProfile?.custom_slug || undefined,
      phone: sellerProfile?.phone || "557 579 123",
    },
  };
}

/**
 * Fetches all active listings from Supabase and merges with sample mock data
 */
export async function getMergedListings(): Promise<ExtendedListingCardProps[]> {
  try {
    const supabase = createClient();
    
    // Fetch active listings from Supabase
    const { data: dbListings, error } = await supabase
      .from("listings")
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          avatar_url,
          phone,
          average_rating,
          total_reviews,
          subscription_tier,
          custom_slug
        )
      `)
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Error fetching Supabase listings:", error.message);
      return [];
    }

    if (!dbListings || dbListings.length === 0) {
      return [];
    }

    const formattedDbListings = dbListings.map((row: any) =>
      formatDbListing(row, row.profiles)
    );

    // Return pure real database listings
    return formattedDbListings;
  } catch (err) {
    console.warn("Failed to load listings from database:", err);
    return [];
  }
}
