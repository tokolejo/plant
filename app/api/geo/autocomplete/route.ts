import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 10;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const city = searchParams.get("city") || "თბილისი";
    const locale = searchParams.get("locale") || "ka";

    if (!query.trim() || query.trim().length < 2) {
      return NextResponse.json({ success: true, results: [] });
    }

    const geoapifyKey = process.env.GEOAPIFY_API_KEY || process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
    const isKa = locale !== "en";
    const searchText = `${query}, ${city}, Georgia`;

    if (geoapifyKey) {
      try {
        const resp = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(searchText)}&filter=countrycode:ge&lang=${isKa ? "ka" : "en"}&apiKey=${geoapifyKey}`
        );
        const data = await resp.json();
        if (data.features && Array.isArray(data.features)) {
          const results = data.features.map((f: any) => {
            const p = f.properties;
            const streetName = p.street || p.name || query;
            const houseNum = p.housenumber || "";
            const addressFormatted = houseNum ? `${streetName} ${houseNum}` : streetName;
            return {
              address: addressFormatted,
              formatted: p.formatted || addressFormatted,
              city: p.city || city,
              district: p.district || p.suburb || p.quarter || "",
              lat: p.lat || f.geometry?.coordinates?.[1],
              lng: p.lon || f.geometry?.coordinates?.[0],
            };
          });

          return NextResponse.json({ success: true, results: results.slice(0, 6) });
        }
      } catch (err) {
        console.error("Geoapify autocomplete error:", err);
      }
    }

    return NextResponse.json({ success: true, results: [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
