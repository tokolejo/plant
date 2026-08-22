import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { calculateDistanceKm } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);

    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    const radiusKm = parseFloat(searchParams.get("radiusKm") || "25");
    const itemType = searchParams.get("itemType");
    const plantCategory = searchParams.get("category");
    const maxResults = parseInt(searchParams.get("limit") || "50", 10);

    const userLat = latParam ? parseFloat(latParam) : 41.7151; // Tbilisi default
    const userLng = lngParam ? parseFloat(lngParam) : 44.7871;

    // 1. Try PostGIS RPC function
    try {
      const { data: rpcListings, error: rpcError } = await supabase.rpc("get_nearby_listings", {
        user_lat: userLat,
        user_lng: userLng,
        radius_km: radiusKm,
        item_type_filter: itemType || null,
        plant_category_filter: plantCategory || null,
        max_results: maxResults,
      });

      if (!rpcError && rpcListings && rpcListings.length > 0) {
        const enriched = rpcListings.map((item: any) => ({
          ...item,
          distanceKm: Number(((item.distance_meters || 0) / 1000).toFixed(1)),
        }));
        return NextResponse.json({ success: true, count: enriched.length, data: enriched });
      }
    } catch {
      // Fallback to coordinates query
    }

    // 2. Fallback: Haversine distance on listings
    let query = supabase
      .from("listings")
      .select(`
        id,
        user_id,
        title_ka,
        title_en,
        price,
        item_type,
        plant_category,
        transaction_type,
        delivery_methods,
        images,
        city,
        address,
        latitude,
        longitude,
        views_count,
        is_featured,
        is_vip,
        created_at,
        profiles:user_id (
          id,
          full_name,
          avatar_url,
          average_rating
        )
      `)
      .eq("status", "ACTIVE")
      .is("deleted_at", null);

    if (itemType && itemType !== "all") {
      query = query.eq("item_type", itemType);
    }
    if (plantCategory && plantCategory !== "all") {
      query = query.eq("plant_category", plantCategory);
    }

    const { data: listings, error } = await query.limit(200);
    if (error) throw error;

    // Filter and sort by Haversine distance
    const withDistance = (listings || [])
      .map((item: any) => {
        const itemLat = item.latitude || 41.7151;
        const itemLng = item.longitude || 44.7871;
        const distanceKm = calculateDistanceKm(userLat, userLng, itemLat, itemLng);
        return {
          ...item,
          distanceKm,
        };
      })
      .filter((item) => radiusKm === 0 || item.distanceKm <= radiusKm)
      .sort((a, b) => {
        // VIP / Featured first, then closest distance
        if (a.is_vip && !b.is_vip) return -1;
        if (!a.is_vip && b.is_vip) return 1;
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return a.distanceKm - b.distanceKm;
      })
      .slice(0, maxResults);

    return NextResponse.json({
      success: true,
      userLocation: { lat: userLat, lng: userLng },
      radiusKm,
      count: withDistance.length,
      data: withDistance,
    });
  } catch (err: any) {
    console.error("[Nearby Listings API Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "ლოკაციით ძიების შეცდომა" },
      { status: 500 }
    );
  }
}
