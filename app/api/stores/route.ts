import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const ownerId = searchParams.get("ownerId");

    let query = supabase.from("stores").select(`
      *,
      owner:owner_id (
        id,
        full_name,
        avatar_url,
        phone,
        subscription_tier,
        is_verified,
        is_on_vacation,
        average_rating,
        total_reviews
      )
    `);

    if (slug) {
      query = query.eq("slug", slug);
    } else if (ownerId) {
      query = query.eq("owner_id", ownerId);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ success: false, error: "slug or authentication required" }, { status: 400 });
      }
      query = query.eq("owner_id", user.id);
    }

    const { data: store, error } = await query.maybeSingle();
    if (error) throw error;

    if (!store) {
      return NextResponse.json({ success: false, error: "მაღაზია ვერ მოიძებნა" }, { status: 404 });
    }

    // Fetch store active inventory
    const { data: listings } = await supabase
      .from("listings")
      .select("*")
      .eq("user_id", store.owner_id)
      .eq("status", "ACTIVE")
      .is("deleted_at", null)
      .order("is_vip", { ascending: false })
      .order("created_at", { ascending: false });

    return NextResponse.json({
      success: true,
      data: {
        ...store,
        listings: listings || [],
      },
    });
  } catch (err: any) {
    console.error("[Store GET Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      slug,
      description,
      taxId,
      logoUrl,
      bannerUrl,
      city = "თბილისი",
      address,
      phone,
      email,
      socialLinks = {},
    } = body;

    if (!name || !slug) {
      return NextResponse.json({ success: false, error: "მაღაზიის სახელი და სლაგი (URL) სავალდებულოა" }, { status: 400 });
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "");

    // Check if store already exists for user
    const { data: existingStore } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (existingStore) {
      // Update
      const { data: updated, error } = await supabase
        .from("stores")
        .update({
          name,
          slug: cleanSlug,
          description,
          tax_id: taxId,
          logo_url: logoUrl,
          banner_url: bannerUrl,
          city,
          address,
          phone,
          email,
          social_links: socialLinks,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingStore.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, action: "updated", data: updated });
    } else {
      // Insert
      const { data: created, error } = await supabase
        .from("stores")
        .insert({
          owner_id: user.id,
          name,
          slug: cleanSlug,
          description,
          tax_id: taxId,
          logo_url: logoUrl,
          banner_url: bannerUrl,
          city,
          address,
          phone,
          email,
          social_links: socialLinks,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, action: "created", data: created });
    }
  } catch (err: any) {
    console.error("[Store POST Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
