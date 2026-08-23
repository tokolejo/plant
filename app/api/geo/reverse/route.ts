import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 15;

const GEORGIAN_CITY_MAP: Record<string, string> = {
  tbilisi: "თბილისი", თბილისი: "თბილისი",
  batumi: "ბათუმი", ბათუმი: "ბათუმი",
  kutaisi: "ქუთაისი", ქუთაისი: "ქუთაისი",
  rustavi: "რუსთავი", რუსთავი: "რუსთავი",
  gori: "გორი", გორი: "გორი",
  zugdidi: "ზუგდიდი", ზუგდიდი: "ზუგდიდი",
  poti: "ფოთი", ფოთი: "ფოთი",
  telavi: "თელავი", თელავი: "თელავი",
  mtskheta: "მცხეთა", მცხეთა: "მცხეთა",
  borjomi: "ბორჯომი", ბორჯომი: "ბორჯომი",
  kobuleti: "ქობულეთი", ქობულეთი: "ქობულეთი",
  akhaltsikhe: "ახალციხე", ახალციხე: "ახალციხე",
  samtredia: "სამტრედია", სამტრედია: "სამტრედია",
  khashuri: "ხაშური", ხაშური: "ხაშური",
  senaki: "სენაკი", სენაკი: "სენაკი",
  zestafoni: "ზესტაფონი", ზესტაფონი: "ზესტაფონი",
  marneuli: "მარნეული", მარნეული: "მარნეული",
  kaspi: "კასპი", კასპი: "კასპი",
  chiatura: "ჭიათურა", ჭიათურა: "ჭიათურა",
  tskaltubo: "წყალტუბო", წყალტუბო: "წყალტუბო",
  ozurgeti: "ოზურგეთი", ოზურგეთი: "ოზურგეთი",
  sagarejo: "საგარეჯო", საგარეჯო: "საგარეჯო",
  gardabani: "გარდაბანი", გარდაბანი: "გარდაბანი",
  dusheti: "დუშეთი", დუშეთი: "დუშეთი",
  sighnaghi: "სიღნაღი", სიღნაღი: "სიღნაღი",
  bolnisi: "ბოლნისი", ბოლნისი: "ბოლნისი",
  gurjaani: "გურჯაანი", გურჯაანი: "გურჯაანი",
  akhalkalaki: "ახალქალაქი", ახალქალაქი: "ახალქალაქი",
  stepantsminda: "სტეფანწმინდა / ყაზბეგი", kazbegi: "სტეფანწმინდა / ყაზბეგი", ყაზბეგი: "სტეფანწმინდა / ყაზბეგი",
  mestia: "მესტია", მესტია: "მესტია",
  ambrolauri: "ამბროლაური", ამბროლაური: "ამბროლაური",
  oni: "ონი", ონი: "ონი",
  lentekhi: "ლენტეხი", ლენტეხი: "ლენტეხი",
  dedoplistskaro: "დედოფლისწყარო", დედოფლისწყარო: "დედოფლისწყარო",
  kvareli: "ყვარელი", ყვარელი: "ყვარელი",
  lagodekhi: "ლაგოდეხი", ლაგოდეხი: "ლაგოდეხი",
  tsalka: "წალკა", წალკა: "წალკა",
  dmanisi: "დმანისი", დმანისი: "დმანისი",
  kareli: "ქარელი", ქარელი: "ქარელი",
  sachkhere: "საჩხერე", საჩხერე: "საჩხერე",
  kharagauli: "ხარაგაული", ხარაგაული: "ხარაგაული",
  baghdati: "ბაღდათი", ბაღდათი: "ბაღდათი",
  vani: "ვანი", ვანი: "ვანი",
  khoni: "ხონი", ხონი: "ხონი",
  terjola: "თერჯოლა", თერჯოლა: "თერჯოლა",
  abasha: "აბაშა", აბაშა: "აბაშა",
  martvili: "მარტვილი", მარტვილი: "მარტვილი",
  chkhorotsku: "ჩხოროწყუ", ჩხოროწყუ: "ჩხოროწყუ",
  tsalenjikha: "წალენჯიხა", წალენჯიხა: "წალენჯიხა",
  khobi: "ხობი", ხობი: "ხობი",
  lanchkhuti: "ლანჩხუთი", ლანჩხუთი: "ლანჩხუთი",
  chokhatauri: "ჩოხატაური", ჩოხატაური: "ჩოხატაური",
  khelvachauri: "ხელვაჩაური", ხელვაჩაური: "ხელვაჩაური",
  keda: "ქედა", ქედა: "ქედა",
  shuakhevi: "შუახევი", შუახევი: "შუახევი",
  khulo: "ხულო", ხულო: "ხულო",
  adigeni: "ადიგენი", ადიგენი: "ადიგენი",
  aspindza: "ასპინძა", ასპინძა: "ასპინძა",
  ninotsminda: "ნინოწმინდა", ნინოწმინდა: "ნინოწმინდა",
  tianeti: "თიანეთი", თიანეთი: "თიანეთი",
  akhmeta: "ახმეტა", ახმეტა: "ახმეტა",
};

export async function POST(req: NextRequest) {
  try {
    const { latitude, longitude, locale } = await req.json();

    if (!latitude || !longitude) {
      return NextResponse.json({ success: false, error: "Missing coordinates" }, { status: 400 });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const isKa = locale !== "en";

    let detectedCity = "თბილისი";
    let detectedStreet = "";
    let houseNumber = "";

    // 1. LocationIQ (100% Free 5,000 requests/day)
    const locationIqKey = process.env.LOCATIONIQ_API_KEY || process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY;
    if (locationIqKey && !detectedStreet) {
      try {
        const liqRes = await fetch(
          `https://us1.locationiq.com/v1/reverse?key=${locationIqKey}&lat=${lat}&lon=${lng}&format=json&accept-language=${isKa ? "ka" : "en"}`
        );
        const liqData = await liqRes.json();
        if (liqData && liqData.address) {
          const a = liqData.address;
          const rawCity = (a.city || a.town || a.village || a.municipality || a.county || a.state || "").toLowerCase();
          for (const [k, v] of Object.entries(GEORGIAN_CITY_MAP)) {
            if (rawCity.includes(k)) {
              detectedCity = v;
              break;
            }
          }
          detectedStreet = a.road || a.pedestrian || a.street || a.neighbourhood || "";
          if (a.house_number) houseNumber = a.house_number;
        }
      } catch (err) {
        console.error("LocationIQ error:", err);
      }
    }

    // 2. Geoapify (100% Free 3,000 requests/day)
    const geoapifyKey = process.env.GEOAPIFY_API_KEY || process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
    if (geoapifyKey && (!detectedStreet || !houseNumber)) {
      try {
        const geoRes = await fetch(
          `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${geoapifyKey}&lang=${isKa ? "ka" : "en"}`
        );
        const geoData = await geoRes.json();
        const feat = geoData.features?.[0]?.properties;
        if (feat) {
          if (feat.city) {
            const rawCity = feat.city.toLowerCase();
            for (const [k, v] of Object.entries(GEORGIAN_CITY_MAP)) {
              if (rawCity.includes(k)) {
                detectedCity = v;
                break;
              }
            }
          }
          if (feat.street) detectedStreet = feat.street;
          if (feat.housenumber) houseNumber = feat.housenumber;
        }
      } catch (err) {
        console.error("Geoapify error:", err);
      }
    }

    // 3. Mapbox Geocoding (100% Free 100,000 requests/month)
    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (mapboxToken && (!detectedStreet || !houseNumber)) {
      try {
        const mbRes = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&language=${isKa ? "ka" : "en"}&types=address,poi`
        );
        const mbData = await mbRes.json();
        const feat = mbData.features?.[0];
        if (feat) {
          if (feat.text) detectedStreet = feat.text;
          if (feat.address) houseNumber = feat.address;
        }
      } catch (err) {
        console.error("Mapbox Geocode error:", err);
      }
    }

    // 4. Google Maps Geocoding API (if Google Key is provided)
    const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (googleKey && (!detectedStreet || !houseNumber)) {
      try {
        const gRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=${isKa ? "ka" : "en"}&key=${googleKey}`
        );
        const gData = await gRes.json();
        if (gData.status === "OK" && gData.results?.[0]) {
          const res = gData.results[0];
          for (const c of res.address_components) {
            if (c.types.includes("street_number")) houseNumber = c.long_name;
            if (c.types.includes("route")) detectedStreet = c.long_name;
            if (c.types.includes("locality")) detectedCity = c.long_name;
          }
        }
      } catch (err) {
        console.error("Google Geocoding error:", err);
      }
    }

    // 5. OpenStreetMap / Nominatim (Free, no key required)
    if (!detectedStreet) {
      try {
        const osmRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=${isKa ? "ka" : "en"}`,
          { headers: { "User-Agent": "PlantApp/2.0" } }
        );
        const osmData = await osmRes.json();
        if (osmData && osmData.address) {
          const a = osmData.address;
          const rawCity = (a.city || a.town || a.village || a.municipality || a.county || a.state || a.region || "").toLowerCase();
          for (const [k, v] of Object.entries(GEORGIAN_CITY_MAP)) {
            if (rawCity.includes(k)) {
              detectedCity = v;
              break;
            }
          }

          detectedStreet = a.road || a.pedestrian || a.street || a.avenue || a.path || a.neighbourhood || a.suburb || "";
          if (a.house_number) {
            houseNumber = a.house_number;
          }
        }
      } catch (err) {
        console.error("Nominatim error:", err);
      }
    }

    // 3. Photon Reverse Geocoding for nearest building number
    if (!houseNumber) {
      try {
        const photonRes = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`);
        const photonData = await photonRes.json();
        const p = photonData.features?.[0]?.properties;
        if (p?.housenumber) {
          houseNumber = p.housenumber;
        }
        if (!detectedStreet && p?.street) {
          detectedStreet = p.street;
        }
      } catch {
        // Ignore photon fallback error
      }
    }

    // Construct clean street and full address string
    let streetAddress = "";
    if (detectedStreet) {
      streetAddress = houseNumber ? `${detectedStreet} №${houseNumber}` : `${detectedStreet} №`;
    }

    let formattedAddress = "";
    if (streetAddress) {
      formattedAddress = `${detectedCity}, ${streetAddress}`;
    } else {
      formattedAddress = detectedCity;
    }

    return NextResponse.json({
      success: true,
      city: detectedCity,
      street: streetAddress,
      address: streetAddress || formattedAddress,
      fullAddress: formattedAddress,
      latitude: lat,
      longitude: lng,
    });
  } catch (error: any) {
    console.error("Reverse Geocoding Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
