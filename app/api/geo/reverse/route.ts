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

    // 1. Google Maps Geocoding API (if Google API Key is configured)
    const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (googleKey) {
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

    // 2. OpenStreetMap / Nominatim (High resolution zoom 18)
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

    // Construct clean address string: "ქალაქი, ქუჩა [№ნომერი]"
    let formattedAddress = "";
    if (detectedStreet) {
      const streetWithNum = houseNumber ? `${detectedStreet} №${houseNumber}` : detectedStreet;
      formattedAddress = `${detectedCity}, ${streetWithNum}`;
    } else {
      formattedAddress = detectedCity;
    }

    return NextResponse.json({
      success: true,
      city: detectedCity,
      address: formattedAddress,
      latitude: lat,
      longitude: lng,
    });
  } catch (error: any) {
    console.error("Reverse Geocoding Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
