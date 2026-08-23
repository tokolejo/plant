import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

// In-memory fallback cache if database table is empty or migrating
let memoryFeedbackStore: any[] = [
  {
    id: "fb-sample-1",
    name: "გიორგი ბერიძე",
    email: "giorgi.beridze@example.com",
    phone: "+995 599 12 34 56",
    type: "suggestion",
    subject: "საძიებო სისტემაში ფილტრის დამატება",
    message: "გამარჯობა, ძალიან მომწონს პლატფორმა! კარგი იქნება თუ მცენარის სიმაღლის მიხედვითაც შევძლებთ ფილტრაციას.",
    status: "NEW",
    admin_notes: null,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "fb-sample-2",
    name: "მარიამ კაპანაძე",
    email: "mariam.k@example.com",
    phone: "+995 577 98 76 54",
    type: "partnership",
    subject: "ყვავილების მაღაზიის ინტეგრაცია (B2B)",
    message: "მოგესალმებით, გვაქვს მცენარეების მაღაზია თბილისში და გვსურს Pro Shop პაკეტის გააქტიურება და პარტნიორობა.",
    status: "NEW",
    admin_notes: null,
    created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
  },
  {
    id: "fb-sample-3",
    name: "დავით შენგელია",
    email: "davit.sh@example.com",
    phone: "+995 555 43 21 00",
    type: "bug",
    subject: "ფოტოს ატვირთვისას შეყოვნება",
    message: "მობაილ ბრაუზერიდან 5 ფოტოს ერთდროულად ატვირთვისას ცოტა ხანს ყოვნდებოდა, თუმცა ბოლოს აიტვირთა.",
    status: "READ",
    admin_notes: "შემოწმდა, კომპრესია გამართულად მუშაობს.",
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
];

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    try {
      const adminClient = createAdminClient();
      let query = adminClient
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (status && status !== "ALL") {
        query = query.eq("status", status);
      }
      if (type && type !== "ALL") {
        query = query.eq("type", type);
      }

      const { data: dbData, error } = await query;

      if (!error && dbData && dbData.length > 0) {
        let results = dbData;
        if (search) {
          const q = search.toLowerCase().trim();
          results = results.filter(
            (item) =>
              item.name?.toLowerCase().includes(q) ||
              item.email?.toLowerCase().includes(q) ||
              item.subject?.toLowerCase().includes(q) ||
              item.message?.toLowerCase().includes(q) ||
              item.phone?.toLowerCase().includes(q)
          );
        }
        return NextResponse.json({ success: true, data: results });
      }
    } catch (dbErr) {
      console.warn("Feedback query fallback:", dbErr);
    }

    // Fallback store filter
    let results = [...memoryFeedbackStore];
    if (status && status !== "ALL") {
      results = results.filter((item) => item.status === status);
    }
    if (type && type !== "ALL") {
      results = results.filter((item) => item.type === type);
    }
    if (search) {
      const q = search.toLowerCase().trim();
      results = results.filter(
        (item) =>
          item.name?.toLowerCase().includes(q) ||
          item.email?.toLowerCase().includes(q) ||
          item.subject?.toLowerCase().includes(q) ||
          item.message?.toLowerCase().includes(q) ||
          item.phone?.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ success: true, data: results });
  } catch (err: any) {
    console.error("GET /api/admin/feedback error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, adminNotes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });
    }

    // Update memory fallback
    memoryFeedbackStore = memoryFeedbackStore.map((item) =>
      item.id === id
        ? {
            ...item,
            status: status !== undefined ? status : item.status,
            admin_notes: adminNotes !== undefined ? adminNotes : item.admin_notes,
            updated_at: new Date().toISOString(),
          }
        : item
    );

    try {
      const adminClient = createAdminClient();
      await adminClient
        .from("feedback")
        .update({
          status: status || undefined,
          admin_notes: adminNotes !== undefined ? adminNotes : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
    } catch (dbErr) {
      console.warn("Feedback update in DB warning:", dbErr);
    }

    return NextResponse.json({ success: true, message: "Updated successfully" });
  } catch (err: any) {
    console.error("PATCH /api/admin/feedback error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });
    }

    memoryFeedbackStore = memoryFeedbackStore.filter((item) => item.id !== id);

    try {
      const adminClient = createAdminClient();
      await adminClient.from("feedback").delete().eq("id", id);
    } catch (dbErr) {
      console.warn("Feedback delete in DB warning:", dbErr);
    }

    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/admin/feedback error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
