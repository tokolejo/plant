import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetSellerId = searchParams.get("sellerId") || user.id;

    // Permissions check: user can only view their own analytics unless they are admin
    if (targetSellerId !== user.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin, role")
        .eq("id", user.id)
        .single();

      const isSuperAdmin = user.email === "tokolejo@gmail.com";
      const isAdmin = isSuperAdmin || profile?.is_admin || profile?.role === "SUPER_ADMIN" || profile?.role === "MODERATOR";

      if (!isAdmin) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
    }

    const fromDate = searchParams.get("fromDate") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const toDate = searchParams.get("toDate") || new Date().toISOString().split("T")[0];

    const adminClient = createAdminClient();

    // 1. Try calling the PostgreSQL RPC function
    let analyticsData: any = null;
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("get_seller_analytics", {
        p_seller_id: targetSellerId,
        from_date: fromDate,
        to_date: toDate,
      });

      if (!rpcError && rpcData) {
        analyticsData = rpcData;
      }
    } catch {
      // fallback to direct queries below
    }

    // 2. Direct aggregation fallback / enhancement
    const [
      listingsRes,
      profileRes,
      viewsRes,
      wishlistsRes,
      reviewsRes,
    ] = await Promise.all([
      adminClient
        .from("listings")
        .select("id, title_ka, price, images, views_count, status, is_vip, created_at")
        .eq("user_id", targetSellerId)
        .is("deleted_at", null)
        .order("views_count", { ascending: false }),

      adminClient
        .from("profiles")
        .select("id, full_name, is_on_vacation, subscription_tier, average_rating, total_reviews, custom_slug")
        .eq("id", targetSellerId)
        .single(),

      adminClient
        .from("listing_views")
        .select("id, listing_id, viewed_at, device_type")
        .gte("viewed_at", `${fromDate}T00:00:00Z`)
        .lte("viewed_at", `${toDate}T23:59:59Z`),

      adminClient
        .from("wishlists")
        .select("id, listing_id"),

      adminClient
        .from("reviews")
        .select("id, rating, comment, created_at, reviewer:reviewer_id(full_name, avatar_url)")
        .eq("seller_id", targetSellerId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const listings = listingsRes.data || [];
    const profile: any = profileRes.data || {};
    const sellerListingIds = new Set(listings.map((l) => l.id));

    // Filter views strictly for this seller's listings
    const sellerViews = (viewsRes.data || []).filter((v) => sellerListingIds.has(v.listing_id));

    // Compute views by day
    const dayMap = new Map<string, number>();
    const cur = new Date(fromDate);
    const end = new Date(toDate);
    while (cur <= end) {
      dayMap.set(cur.toISOString().split("T")[0], 0);
      cur.setDate(cur.getDate() + 1);
    }

    let mobileViews = 0;
    let desktopViews = 0;

    sellerViews.forEach((v) => {
      const day = v.viewed_at.split("T")[0];
      if (dayMap.has(day)) {
        dayMap.set(day, (dayMap.get(day) || 0) + 1);
      }
      if (v.device_type === "mobile") mobileViews++;
      else desktopViews++;
    });

    const viewsTimeline = Array.from(dayMap.entries()).map(([day, views]) => ({
      day,
      views,
    }));

    // Filter wishlist saves
    const wishlistCount = (wishlistsRes.data || []).filter((w) => sellerListingIds.has(w.listing_id)).length;

    const totalViewsAllTime = listings.reduce((sum, l) => sum + (l.views_count || 0), 0);
    const activeListingsCount = listings.filter((l) => l.status === "ACTIVE").length;

    const responsePayload = {
      success: true,
      sellerId: targetSellerId,
      profile: {
        fullName: profile.full_name || "მომხმარებელი",
        tier: profile.subscription_tier || "FREE",
        isOnVacation: profile.is_on_vacation || false,
        rating: profile.average_rating || "0.00",
        totalReviews: profile.total_reviews || 0,
        customSlug: profile.custom_slug || null,
      },
      kpis: {
        totalListings: listings.length,
        activeListings: activeListingsCount,
        periodViews: sellerViews.length || totalViewsAllTime,
        totalViewsAllTime,
        wishlistSaves: analyticsData?.wishlist_saves ?? wishlistCount,
        avgRating: profile.average_rating || "0.00",
        totalReviews: profile.total_reviews || 0,
      },
      viewsTimeline: analyticsData?.views_by_day || viewsTimeline,
      topListings: listings.slice(0, 5).map((l) => ({
        id: l.id,
        title: l.title_ka,
        price: l.price,
        image: l.images?.[0] || null,
        viewsCount: l.views_count || 0,
        status: l.status,
        isVip: l.is_vip,
      })),
      deviceBreakdown: {
        mobile: mobileViews,
        desktop: desktopViews,
      },
      recentReviews: reviewsRes.data || [],
    };

    return NextResponse.json(responsePayload);
  } catch (err: any) {
    console.error("[Seller Analytics API Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "სელერის ანალიტიკის ჩატვირთვის შეცდომა" },
      { status: 500 }
    );
  }
}
