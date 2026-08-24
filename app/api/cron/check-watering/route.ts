import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: "Missing Supabase configuration" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const nowIso = new Date().toISOString();

    // Query all plants where next_watering_at is due (<= now)
    const { data: duePlants, error } = await supabase
      .from("user_plants")
      .select("id, user_id, name, room_location, next_watering_at")
      .lte("next_watering_at", nowIso);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!duePlants || duePlants.length === 0) {
      return NextResponse.json({
        success: true,
        message: "მორწყვის გრაფიკით მოსარწყავი მცენარეები ამ მომენტში არ არის.",
        processedCount: 0,
      });
    }

    // Group plants by user_id
    const userMap: Record<string, typeof duePlants> = {};
    for (const plant of duePlants) {
      if (!userMap[plant.user_id]) {
        userMap[plant.user_id] = [];
      }
      userMap[plant.user_id].push(plant);
    }

    const digestList = Object.entries(userMap).map(([userId, plants]) => {
      const plantNames = plants.map((p) => `„${p.name}“ (${p.room_location || "მისაღები"})`).join(", ");
      const notificationText = `დღეს თქვენს ${plants.length} მცენარეს სჭირდება მორწყვა: ${plantNames}. შეამოწმეთ თქვენი ორანჟერეა Plant.ge-ზე.`;

      return {
        userId,
        plantsCount: plants.length,
        notificationText,
      };
    });

    return NextResponse.json({
      success: true,
      duePlantsTotal: duePlants.length,
      usersToNotify: digestList.length,
      digests: digestList,
      timestamp: nowIso,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
