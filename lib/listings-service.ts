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
    lat: Number(dbRow.latitude ?? dbRow.lat) || 41.7151,
    lng: Number(dbRow.longitude ?? dbRow.lng) || 44.8271,
    latitude: Number(dbRow.latitude ?? dbRow.lat) || 41.7151,
    longitude: Number(dbRow.longitude ?? dbRow.lng) || 44.8271,
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
      role: sellerProfile?.role || (sellerProfile?.is_admin ? "ADMIN" : "USER"),
      isVerified: sellerProfile?.role === "VERIFIED_SELLER" || sellerProfile?.role === "ADMIN" || sellerProfile?.role === "SUPER_ADMIN" || sellerProfile?.is_verified,
      customSlug: sellerProfile?.custom_slug || undefined,
      phone: sellerProfile?.phone || "557 579 123",
    },
  };
}

export const INITIAL_FEATURED_LISTING_IDS = [
  "4603763b-b3bc-4b04-879e-d69deb47c111", // 1 Sale (Monstera Thai Constellation)
  "8745b079-8e2c-4c1e-bcbe-be1782ab7e99", // 1 Trade (Philodendron Pink Princess)
  "ceb037ef-dcfc-4c72-9cad-c1d74da2637f", // 1 Free/Gift (Pothos & Monstera Cuttings)
];

export const DEPRECATED_TEST_LISTING_IDS = new Set([
  "f063a02b-c4df-4000-81a4-becfd2ae9028",
  "592366dd-f769-4661-88bd-6b45396b37a9",
  "00c48da8-50d5-4993-a1e0-03c510a697a9",
  "1fff4479-a825-427d-ac84-85d9eeef1dbb",
  "1ee669bf-3437-46f2-9249-393792f5b000",
  "4725b4b2-fb69-4d93-b0be-aef0a3ae8fd6",
  "17076b01-063c-452b-8c4f-110bae068cfa",
  "7ce76f9e-3096-435d-8353-9eab228e3eae",
  "1d8fee0b-2b52-45ee-8c92-ccbd068b6c50",
  "7e5fff21-49bf-4521-8ce6-71008ae07f40",
  "eb21100f-3445-4694-bf51-7716565da3a7",
  "0228eef6-72b7-46a9-97d9-50163697e770",
  "f55d5c90-ab22-4404-9b40-4292a7837cdd",
  "71f2b20b-cb58-4c18-9486-de6e1252fb03",
]);

/**
 * Fetches all active listings from Supabase and filters to only 1 Sale, 1 Trade, 1 Free (plus any new user listings)
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
          custom_slug,
          role,
          is_admin,
          is_verified
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

    // Filter out old test listings, keeping only 1 Sale, 1 Trade, 1 Free and any newly created listings
    const filteredDbListings = dbListings.filter(
      (row: any) => !DEPRECATED_TEST_LISTING_IDS.has(row.id)
    );

    const formattedDbListings = filteredDbListings.map((row: any) =>
      formatDbListing(row, row.profiles)
    );

    return formattedDbListings;
  } catch (err) {
    console.warn("Failed to load listings from database:", err);
    return [];
  }
}

/**
 * Fair Seller Diversity & Anti-Monopoly Rotation Algorithm:
 * Prevents a single top seller or verified store from monopolizing the homepage grid.
 * Interleaves listings from different sellers fairly in round-robin fashion.
 */
export function applyDiverseSellerRotation(
  listings: ExtendedListingCardProps[]
): ExtendedListingCardProps[] {
  if (!listings || listings.length <= 2) return listings || [];

  // Separate into VIP / Boosted pool and Regular pool
  const vipPool = listings.filter((item) => item.isPremium || item.isFeatured);
  const regularPool = listings.filter((item) => !item.isPremium && !item.isFeatured);

  const rotatePool = (items: ExtendedListingCardProps[]) => {
    const buckets = new Map<string, ExtendedListingCardProps[]>();
    for (const item of items) {
      const sellerId = item.seller?.id || item.seller?.fullName || "anon";
      if (!buckets.has(sellerId)) {
        buckets.set(sellerId, []);
      }
      buckets.get(sellerId)!.push(item);
    }

    const result: ExtendedListingCardProps[] = [];
    const queues = Array.from(buckets.values());
    let hasMore = true;

    while (hasMore) {
      hasMore = false;
      for (const queue of queues) {
        if (queue.length > 0) {
          result.push(queue.shift()!);
          hasMore = true;
        }
      }
    }
    return result;
  };

  const rotatedVip = rotatePool(vipPool);
  const rotatedRegular = rotatePool(regularPool);

  return [...rotatedVip, ...rotatedRegular];
}

