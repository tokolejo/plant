import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

function escapeCsvField(field: any): string {
  if (field === null || field === undefined) return "";
  const str = typeof field === "object" ? JSON.stringify(field) : String(field);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function arrayToCsv(headers: { key: string; label: string }[], rows: any[]): string {
  const headerRow = headers.map((h) => escapeCsvField(h.label)).join(",");
  const dataRows = rows.map((row) =>
    headers.map((h) => escapeCsvField(row[h.key])).join(",")
  );
  // Prepend UTF-8 BOM so Georgian characters open properly in Microsoft Excel
  return "\uFEFF" + [headerRow, ...dataRows].join("\r\n");
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check Admin status
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, role")
      .eq("id", user.id)
      .single();

    const isSuperAdmin = user.email === "tokolejo@gmail.com";
    const hasAdminAccess = isSuperAdmin || profile?.is_admin || profile?.role === "SUPER_ADMIN" || profile?.role === "MODERATOR";

    if (!hasAdminAccess) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "listings";
    const format = searchParams.get("format") || "csv";
    const status = searchParams.get("status");

    const adminClient = createAdminClient();

    let csvContent = "";
    let fileName = `plantio_export_${type}_${new Date().toISOString().split("T")[0]}`;

    if (type === "listings") {
      let query = adminClient
        .from("listings")
        .select(`
          id,
          title_ka,
          title_en,
          price,
          item_type,
          plant_category,
          transaction_type,
          status,
          city,
          address,
          views_count,
          is_vip,
          is_featured,
          created_at,
          profiles:user_id (
            full_name,
            phone
          )
        `)
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;

      const flatRows = (data || []).map((row: any) => ({
        id: row.id,
        title_ka: row.title_ka || "",
        title_en: row.title_en || "",
        price: row.price || 0,
        item_type: row.item_type || "PLANT",
        plant_category: row.plant_category || "",
        transaction_type: row.transaction_type || "FIXED",
        status: row.status || "ACTIVE",
        city: row.city || "",
        address: row.address || "",
        seller_name: row.profiles?.full_name || "უცნობი",
        seller_phone: row.profiles?.phone || "",
        views_count: row.views_count || 0,
        is_vip: row.is_vip ? "კი" : "არა",
        is_featured: row.is_featured ? "კი" : "არა",
        created_at: row.created_at ? new Date(row.created_at).toLocaleString("ka-GE") : "",
      }));

      const headers = [
        { key: "id", label: "ID" },
        { key: "title_ka", label: "სათაური (ქართული)" },
        { key: "title_en", label: "სათაური (ინგლისური)" },
        { key: "price", label: "ფასი (₾)" },
        { key: "item_type", label: "ტიპი" },
        { key: "plant_category", label: "კატეგორია" },
        { key: "transaction_type", label: "გარიგება" },
        { key: "status", label: "სტატუსი" },
        { key: "city", label: "ქალაქი" },
        { key: "address", label: "მისამართი" },
        { key: "seller_name", label: "გამყიდველი" },
        { key: "seller_phone", label: "ტელეფონი" },
        { key: "views_count", label: "ნახვები" },
        { key: "is_vip", label: "VIP" },
        { key: "is_featured", label: "რეკომენდებული" },
        { key: "created_at", label: "დამატების თარიღი" },
      ];

      csvContent = arrayToCsv(headers, flatRows);
    } else if (type === "users") {
      const { data, error } = await adminClient
        .from("profiles")
        .select(`
          id,
          full_name,
          phone,
          city,
          role,
          subscription_tier,
          billing_cycle,
          average_rating,
          total_reviews,
          wallet_balance,
          is_admin,
          is_verified,
          is_on_vacation,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const flatRows = (data || []).map((row: any) => ({
        id: row.id,
        full_name: row.full_name || "",
        phone: row.phone || "",
        city: row.city || "",
        role: row.role || "USER",
        tier: row.subscription_tier || "FREE",
        billing_cycle: row.billing_cycle || "MONTHLY",
        rating: row.average_rating || "0.00",
        total_reviews: row.total_reviews || 0,
        wallet_balance: row.wallet_balance || 0,
        is_admin: row.is_admin ? "კი" : "არა",
        is_verified: row.is_verified ? "კი" : "არა",
        is_on_vacation: row.is_on_vacation ? "შვებულებაში" : "აქტიური",
        created_at: row.created_at ? new Date(row.created_at).toLocaleString("ka-GE") : "",
      }));

      const headers = [
        { key: "id", label: "User ID" },
        { key: "full_name", label: "სახელი" },
        { key: "phone", label: "ტელეფონი" },
        { key: "city", label: "ქალაქი" },
        { key: "role", label: "როლი" },
        { key: "tier", label: "ტარიფი" },
        { key: "billing_cycle", label: "ბილინგი" },
        { key: "rating", label: "რეიტინგი" },
        { key: "total_reviews", label: "შეფასებები" },
        { key: "wallet_balance", label: "ბალანსი (₾)" },
        { key: "is_admin", label: "ადმინი" },
        { key: "is_verified", label: "ვერიფიცირებული" },
        { key: "is_on_vacation", label: "სტატუსი" },
        { key: "created_at", label: "რეგისტრაციის თარიღი" },
      ];

      csvContent = arrayToCsv(headers, flatRows);
    } else if (type === "audit") {
      const { data, error } = await adminClient
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) throw error;

      const flatRows = (data || []).map((row: any) => ({
        id: row.id,
        actor_id: row.actor_id || "სისტემა",
        action: row.action,
        target_type: row.target_type,
        target_id: row.target_id || "",
        new_data: JSON.stringify(row.new_data || {}),
        created_at: row.created_at ? new Date(row.created_at).toLocaleString("ka-GE") : "",
      }));

      const headers = [
        { key: "id", label: "Log ID" },
        { key: "actor_id", label: "შემსრულებელი ID" },
        { key: "action", label: "მოქმედება" },
        { key: "target_type", label: "ობიექტი" },
        { key: "target_id", label: "ობიექტის ID" },
        { key: "new_data", label: "დეტალები" },
        { key: "created_at", label: "დრო" },
      ];

      csvContent = arrayToCsv(headers, flatRows);
    } else {
      return NextResponse.json({ success: false, error: "უცნობი ექსპორტის ტიპი" }, { status: 400 });
    }

    // Log export audit
    await adminClient.from("audit_logs").insert({
      actor_id: user.id,
      action: `export_${type}`,
      target_type: "system",
      new_data: { type, format },
    });

    if (format === "json") {
      return NextResponse.json({ success: true, count: csvContent.length });
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}.csv"`,
      },
    });
  } catch (err: any) {
    console.error("[Export API Error]:", err);
    return NextResponse.json({ success: false, error: err.message || "ექსპორტის შეცდომა" }, { status: 500 });
  }
}
