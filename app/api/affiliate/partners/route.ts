import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

interface PartnerRecord {
  id: string;
  name: string;
  slug: string;
  website_url?: string;
  badge_color: string;
  logo_url?: string;
  referral_param_template: string;
  commission_rate: number;
  is_active: boolean;
  created_at?: string;
  products_count?: number;
}

const DEFAULT_PARTNERS: PartnerRecord[] = [
  {
    id: "partner-domino",
    name: "Domino",
    slug: "domino",
    website_url: "https://domino.com.ge",
    badge_color: "#16a34a",
    referral_param_template: "?ref=plantge",
    commission_rate: 5.0,
    is_active: true,
  },
  {
    id: "partner-gorgia",
    name: "Gorgia",
    slug: "gorgia",
    website_url: "https://gorgia.ge",
    badge_color: "#ea580c",
    referral_param_template: "?ref=plantge",
    commission_rate: 5.0,
    is_active: true,
  },
  {
    id: "partner-bricorama",
    name: "Bricorama",
    slug: "bricorama",
    website_url: "https://bricorama.ge",
    badge_color: "#dc2626",
    referral_param_template: "?ref=plantge",
    commission_rate: 5.0,
    is_active: true,
  },
  {
    id: "partner-agrohub",
    name: "Agrohub",
    slug: "agrohub",
    website_url: "https://agrohub.ge",
    badge_color: "#059669",
    referral_param_template: "?utm_source=plantge",
    commission_rate: 7.0,
    is_active: true,
  },
  {
    id: "partner-miaplant",
    name: "Miaplant",
    slug: "miaplant",
    website_url: "https://miaplant.ge",
    badge_color: "#0284c7",
    referral_param_template: "?ref=plantge",
    commission_rate: 10.0,
    is_active: true,
  },
  {
    id: "partner-amazon",
    name: "Amazon",
    slug: "amazon",
    website_url: "https://amazon.com",
    badge_color: "#d97706",
    referral_param_template: "?tag=plantge-20",
    commission_rate: 4.0,
    is_active: true,
  },
];

export async function GET() {
  try {
    const admin = createAdminClient();

    // 1. Try fetching from affiliate_partners table
    const { data: dbPartners, error: dbErr } = await admin
      .from("affiliate_partners")
      .select("*")
      .order("created_at", { ascending: true });

    if (!dbErr && dbPartners && dbPartners.length > 0) {
      // Fetch product counts per partner
      const { data: products } = await admin
        .from("affiliate_products")
        .select("partner_name, partner_id");

      const partnerMap = dbPartners.map((p) => {
        const count = (products || []).filter(
          (prod) => prod.partner_id === p.id || prod.partner_name?.toLowerCase() === p.name.toLowerCase()
        ).length;
        return {
          ...p,
          products_count: count,
        };
      });

      return NextResponse.json({ success: true, partners: partnerMap });
    }

    // 2. Fallback to site_settings or default partners
    let customPartners: PartnerRecord[] = [];
    try {
      const { data: setting } = await admin
        .from("site_settings")
        .select("value")
        .eq("key", "affiliate_partners_custom")
        .single();
      if (setting?.value && Array.isArray(setting.value)) {
        customPartners = setting.value;
      }
    } catch {
      // ignore
    }

    const merged = [...DEFAULT_PARTNERS];
    for (const c of customPartners) {
      if (!merged.some((m) => m.slug === c.slug)) {
        merged.push(c);
      }
    }

    return NextResponse.json({ success: true, partners: merged });
  } catch (err: any) {
    return NextResponse.json({ success: true, partners: DEFAULT_PARTNERS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "ავტორიზაცია აუცილებელია" }, { status: 401 });
    }

    // Admin-only: only admins can add affiliate partners
    const { data: profile } = await supabase.from("profiles").select("role, is_admin").eq("id", user.id).single();
    const isAdmin = user.email === "tokolejo@gmail.com" || profile?.is_admin === true || profile?.role === "ADMIN" || profile?.role === "SUPER_ADMIN";
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "მხოლოდ ადმინისტრატორს შეუძლია პარტნიორის დამატება" }, { status: 403 });
    }

    const body = await req.json();
    const { name, website_url, badge_color, referral_param_template, commission_rate } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ success: false, error: "მაღაზიის სახელი სავალდებულოა" }, { status: 400 });
    }

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]/g, "-") || `partner-${Date.now()}`;
    const newPartner: PartnerRecord = {
      id: crypto.randomUUID(),
      name: name.trim(),
      slug,
      website_url: website_url?.trim() || "",
      badge_color: badge_color || "#16a34a",
      referral_param_template: referral_param_template?.trim() || "?ref=plantge",
      commission_rate: Number(commission_rate) || 5,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const admin = createAdminClient();

    // 1. Try DB table insert
    const { data: inserted, error: insertErr } = await admin
      .from("affiliate_partners")
      .insert({
        name: newPartner.name,
        slug: newPartner.slug,
        website_url: newPartner.website_url,
        badge_color: newPartner.badge_color,
        referral_param_template: newPartner.referral_param_template,
        commission_rate: newPartner.commission_rate,
        is_active: true,
      })
      .select()
      .single();

    if (!insertErr && inserted) {
      return NextResponse.json({ success: true, partner: inserted });
    }

    // 2. Fallback: Save to site_settings
    const { data: setting } = await admin
      .from("site_settings")
      .select("value")
      .eq("key", "affiliate_partners_custom")
      .single();

    const existing: PartnerRecord[] = setting?.value && Array.isArray(setting.value) ? setting.value : [];
    existing.push(newPartner);

    await admin.from("site_settings").upsert({
      key: "affiliate_partners_custom",
      value: existing,
      description: "Custom affiliate partner stores",
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, partner: newPartner });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "ავტორიზაცია აუცილებელია" }, { status: 401 });
    }

    // Admin-only
    const { data: profile } = await supabase.from("profiles").select("role, is_admin").eq("id", user.id).single();
    const isAdmin = user.email === "tokolejo@gmail.com" || profile?.is_admin === true || profile?.role === "ADMIN" || profile?.role === "SUPER_ADMIN";
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "მხოლოდ ადმინისტრატორს შეუძლია პარტნიორის წაშლა" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");

    if (!id && !slug) {
      return NextResponse.json({ success: false, error: "ID ან slug აუცილებელია" }, { status: 400 });
    }

    const admin = createAdminClient();

    if (id) {
      await admin.from("affiliate_partners").delete().eq("id", id);
    }
    if (slug) {
      await admin.from("affiliate_partners").delete().eq("slug", slug);
    }

    // Also remove from site_settings fallback
    try {
      const { data: setting } = await admin
        .from("site_settings")
        .select("value")
        .eq("key", "affiliate_partners_custom")
        .single();
      if (setting?.value && Array.isArray(setting.value)) {
        const filtered = setting.value.filter((p: any) => p.id !== id && p.slug !== slug);
        await admin.from("site_settings").upsert({
          key: "affiliate_partners_custom",
          value: filtered,
          updated_at: new Date().toISOString(),
        });
      }
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "ავტორიზაცია აუცილებელია" }, { status: 401 });
    }

    // Admin-only
    const { data: profile } = await supabase.from("profiles").select("role, is_admin").eq("id", user.id).single();
    const isAdmin = user.email === "tokolejo@gmail.com" || profile?.is_admin === true || profile?.role === "ADMIN" || profile?.role === "SUPER_ADMIN";
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "მხოლოდ ადმინისტრატორს შეუძლია პარტნიორის რედაქტირება" }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, website_url, badge_color, referral_param_template, commission_rate, is_active } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "პარტნიორის ID სავალდებულოა" }, { status: 400 });
    }

    const admin = createAdminClient();
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name.trim();
    if (website_url !== undefined) updateData.website_url = website_url.trim();
    if (badge_color !== undefined) updateData.badge_color = badge_color;
    if (referral_param_template !== undefined) updateData.referral_param_template = referral_param_template.trim();
    if (commission_rate !== undefined) updateData.commission_rate = Number(commission_rate);
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);

    const { data: updated, error: updateErr } = await admin
      .from("affiliate_partners")
      .update(updateData)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (!updateErr && updated) {
      return NextResponse.json({ success: true, partner: updated });
    }

    // Also sync fallback in site_settings if needed
    try {
      const { data: setting } = await admin
        .from("site_settings")
        .select("value")
        .eq("key", "affiliate_partners_custom")
        .single();
      if (setting?.value && Array.isArray(setting.value)) {
        const updatedList = setting.value.map((p: any) =>
          p.id === id ? { ...p, ...updateData } : p
        );
        await admin.from("site_settings").upsert({
          key: "affiliate_partners_custom",
          value: updatedList,
          updated_at: new Date().toISOString(),
        });
      }
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true, partner: updated || updateData });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
