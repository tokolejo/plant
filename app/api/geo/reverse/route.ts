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
    let districtName = "";
    let fullAddressLine = "";

    // ─── 1. Geoapify (High precision building & house number in Georgia) ───
    const geoapifyKey = process.env.GEOAPIFY_API_KEY || process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
    if (geoapifyKey) {
      try {
        const geoRes = await fetch(
          `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&type=building&apiKey=${geoapifyKey}&lang=${isKa ? "ka" : "en"}`
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
          if (feat.district || feat.suburb || feat.quarter) {
            districtName = feat.district || feat.suburb || feat.quarter;
          }
          if (feat.address_line1) fullAddressLine = feat.address_line1;
        }
      } catch (err) {
        console.error("Geoapify reverse error:", err);
      }
    }

    // ─── 2. LocationIQ (Fallback / Verification) ───
    const locationIqKey = process.env.LOCATIONIQ_API_KEY || process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY;
    if (locationIqKey && (!detectedStreet || !houseNumber)) {
      try {
        const liqRes = await fetch(
          `https://us1.locationiq.com/v1/reverse?key=${locationIqKey}&lat=${lat}&lon=${lng}&format=json&addressdetails=1&normalizeaddress=1&accept-language=${isKa ? "ka" : "en"}`
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
          if (!detectedStreet && (a.road || a.pedestrian || a.street)) {
            detectedStreet = a.road || a.pedestrian || a.street;
          }
          if (!houseNumber && a.house_number) {
            houseNumber = a.house_number;
          }
          if (!districtName && (a.neighbourhood || a.quarter || a.suburb)) {
            districtName = a.neighbourhood || a.quarter || a.suburb;
          }
        }
      } catch (err) {
        console.error("LocationIQ reverse error:", err);
      }
    }

    // ─── 3. OpenStreetMap / Nominatim (Free Open Data with zoom=18 building level) ───
    if (!detectedStreet || !houseNumber) {
      try {
        const osmRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=${isKa ? "ka" : "en"}`,
          { headers: { "User-Agent": "PlantSaleGE/2.0" } }
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

          if (!detectedStreet && (a.road || a.pedestrian || a.street || a.avenue || a.path)) {
            detectedStreet = a.road || a.pedestrian || a.street || a.avenue || a.path;
          }
          if (!houseNumber && (a.house_number || a.building)) {
            houseNumber = a.house_number || a.building;
          }
          if (!districtName && (a.neighbourhood || a.suburb || a.quarter)) {
            districtName = a.neighbourhood || a.suburb || a.quarter;
          }
        }
      } catch (err) {
        console.error("Nominatim reverse error:", err);
      }
    }

    // ─── 4. Assemble Exact Street Address ───
    let finalStreet = "";

    if (fullAddressLine && houseNumber) {
      finalStreet = fullAddressLine;
    } else if (detectedStreet) {
      finalStreet = houseNumber ? `${detectedStreet} ${houseNumber}` : detectedStreet;
    }

    let finalFullAddress = "";
    if (finalStreet) {
      finalFullAddress = districtName && !finalStreet.includes(districtName)
        ? `${detectedCity}, ${districtName}, ${finalStreet}`
        : `${detectedCity}, ${finalStreet}`;
    } else {
      finalFullAddress = detectedCity;
    }

    return NextResponse.json({
      success: true,
      city: detectedCity,
      street: finalStreet || detectedStreet,
      address: finalStreet || detectedStreet || finalFullAddress,
      houseNumber: houseNumber || undefined,
      district: districtName || undefined,
      fullAddress: finalFullAddress,
      latitude: lat,
      longitude: lng,
    });
  } catch (error: any) {
    console.error("Reverse Geocoding Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
