"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { SAMPLE_LISTINGS, type PlantCategory } from "@/lib/mock-data";
import { getMergedListings } from "@/lib/listings-service";
import { formatPrice, calculateDistanceKm } from "@/lib/utils";
import { 
  Search, 
  Navigation, 
  Loader2,
  SlidersHorizontal,
  X,
  RotateCcw,
  Leaf,
  Flower2,
  TreeDeciduous,
  Sprout,
  Layers,
  ChevronDown,
  ChevronUp,
  Check,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocationSearchCombobox } from "@/components/common/LocationSearchCombobox";

// ─── Localized Category Taxonomy ──────────────────────────────────────────────
type LocalizedCategory = {
  id: PlantCategory;
  labelKa: string;
  labelEn: string;
  emoji: string;
};

type LocalizedCategoryGroup = {
  id: string;
  labelKa: string;
  labelEn: string;
  icon: React.ElementType;
  color: string;
  children: LocalizedCategory[];
};

const PLANT_CATEGORY_GROUPS: LocalizedCategoryGroup[] = [
  {
    id: "aroid",
    labelKa: "აროიდები",
    labelEn: "Aroids",
    icon: Leaf,
    color: "text-emerald-700 dark:text-emerald-400",
    children: [
      { id: "monstera", labelKa: "მონსტერა", labelEn: "Monstera", emoji: "" },
      { id: "philodendron", labelKa: "ფილოდენდრონი", labelEn: "Philodendron", emoji: "" },
      { id: "anthurium", labelKa: "ანთურიუმი", labelEn: "Anthurium", emoji: "" },
      { id: "alocasia", labelKa: "ალოკაზია", labelEn: "Alocasia", emoji: "" },
      { id: "calathea", labelKa: "კალათეა / მარანტა", labelEn: "Calathea / Maranta", emoji: "" },
      { id: "pothos-scindapsus", labelKa: "პოთოსი / სცინდაპსუსი", labelEn: "Pothos / Scindapsus", emoji: "" },
    ],
  },
  {
    id: "flowering",
    labelKa: "ყვავილოვანი",
    labelEn: "Flowering",
    icon: Flower2,
    color: "text-rose-700 dark:text-rose-400",
    children: [
      { id: "orchid", labelKa: "ორქიდეა", labelEn: "Orchid", emoji: "" },
      { id: "bromeliad", labelKa: "ბრომელია", labelEn: "Bromeliad", emoji: "" },
    ],
  },
  {
    id: "tree-ficus",
    labelKa: "ხეები & ფიკუსები",
    labelEn: "Trees & Ficus",
    icon: TreeDeciduous,
    color: "text-teal-700 dark:text-teal-400",
    children: [
      { id: "ficus", labelKa: "ფიკუსი", labelEn: "Ficus", emoji: "" },
      { id: "palm", labelKa: "პალმა", labelEn: "Palm", emoji: "" },
      { id: "fern", labelKa: "გვიმრა", labelEn: "Fern", emoji: "" },
      { id: "outdoor-garden", labelKa: "ბაღის & ეზოს მცენარეები", labelEn: "Outdoor & Garden", emoji: "" },
    ],
  },
  {
    id: "cactus-etc",
    labelKa: "კაქტუსი & სუქულენტები",
    labelEn: "Cactus & Succulents",
    icon: Sprout,
    color: "text-amber-700 dark:text-amber-400",
    children: [
      { id: "cactus-succulent", labelKa: "კაქტუსი & სუქულენტი", labelEn: "Cactus & Succulent", emoji: "" },
      { id: "rare-variegated", labelKa: "იშვიათი & ვარიეგატული", labelEn: "Rare & Variegated", emoji: "" },
      { id: "cutting", labelKa: "კალმები & ფესვიანები", labelEn: "Cuttings & Rooted", emoji: "" },
    ],
  },
  {
    id: "inventory",
    labelKa: "ინვენტარი & მოვლა",
    labelEn: "Inventory & Care",
    icon: Layers,
    color: "text-slate-800 dark:text-slate-200",
    children: [
      { id: "pots-ceramic", labelKa: "კერამიკული ქოთნები", labelEn: "Ceramic Pots", emoji: "" },
      { id: "pots-plastic", labelKa: "პლასტიკური ქოთნები", labelEn: "Plastic Pots", emoji: "" },
      { id: "substrate-soil", labelKa: "სუბსტრატი & გრუნტი", labelEn: "Substrate & Soil", emoji: "" },
      { id: "fertilizer", labelKa: "სასუქები & ვიტამინები", labelEn: "Fertilizer & Care", emoji: "" },
      { id: "tools-care", labelKa: "მოვლის ხელსაწყოები", labelEn: "Care Tools", emoji: "" },
      { id: "lighting-grow", labelKa: "განათება (Grow Light)", labelEn: "Grow Light", emoji: "" },
    ],
  },
];

const LISTING_COORDINATES: Record<string, [number, number]> = {
  "lst-1": [41.7116, 44.7554], // Vake, Tbilisi
  "lst-2": [41.6423, 41.6339], // Batumi Boulevard
  "lst-3": [41.7271, 44.7742], // Saburtalo, Tbilisi
  "lst-4": [42.2679, 42.6946], // Kutaisi Center
  "lst-5": [41.7450, 44.7920], // Didube, Tbilisi
  "lst-6": [41.7050, 44.8050], // Chugureti, Tbilisi
  "lst-7": [41.7820, 44.7680], // Didi Digomi, Tbilisi
  "lst-8": [41.6980, 44.7930], // Vera / Mtatsminda, Tbilisi
};

function MapFilterSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="border-b border-border/60 py-3 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-1 text-left group"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-foreground">
          {title}
        </span>
        {open ? (
          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
      </button>
      {open && <div className="pt-2 pb-1">{children}</div>}
    </div>
  );
}

export default function BotanicalMap() {
  const locale = useLocale();
  const isKa = locale !== "en";

  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<any>(null);
  const markersRef = React.useRef<any[]>([]);
  const userMarkerRef = React.useRef<any>(null);

  // Filter States — Open on desktop by default, closed on mobile
  const [filterPanelOpen, setFilterPanelOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth >= 1024) {
        setFilterPanelOpen(true);
      } else {
        setFilterPanelOpen(false);
      }
    }
  }, []);
  const [selectedCity, setSelectedCity] = React.useState("მთელი საქართველო");
  const [userCoords, setUserCoords] = React.useState<[number, number] | null>(null);
  const [selectedCategories, setSelectedCategories] = React.useState<PlantCategory[]>([]);
  const [selectedTrans, setSelectedTrans] = React.useState<string[]>([]);
  const [selectedDelivery, setSelectedDelivery] = React.useState<string[]>([]);
  const [priceRange, setPriceRange] = React.useState<[number, number]>([0, 500]);
  const [isMapReady, setIsMapReady] = React.useState(false);

  // Accordion Category Groups State — all collapsed by default
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({
    aroid: false,
    flowering: false,
    "tree-ficus": false,
    "cactus-etc": false,
    inventory: false,
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const toggleCategory = (cat: PlantCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleTrans = (t: string) => {
    setSelectedTrans((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const toggleDelivery = (d: string) => {
    setSelectedDelivery((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const activeFilterCount =
    selectedCategories.length +
    selectedTrans.length +
    selectedDelivery.length +
    (priceRange[0] > 0 || priceRange[1] < 500 ? 1 : 0) +
    (userCoords ? 1 : 0) +
    (selectedCity !== "მთელი საქართველო" && !selectedCity.includes("ჩემი ლოკაცია") ? 1 : 0);

  const [gpsLoading, setGpsLoading] = React.useState(false);

  const handleLocateMe = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert(isKa ? "თქვენს ბრაუზერს არ აქვს გეოლოკაციის მხარდაჭერა." : "Geolocation is not supported by your browser.");
      return;
    }

    setGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserCoords(coords);
        setSelectedCity("ჩემი ლოკაცია (GPS)");
        setGpsLoading(false);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo(coords, 15, { duration: 1.5 });
        }
      },
      (err) => {
        console.warn("GPS error:", err);
        setGpsLoading(false);
        alert(isKa ? "ვერ მოხერხდა ლოკაციის განსაზღვრა. გთხოვთ ჩართოთ GPS." : "Could not retrieve your location. Please enable GPS.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const resetAllFilters = () => {
    setSearchTerm("");
    setSelectedCity("მთელი საქართველო");
    setUserCoords(null);
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
    setSelectedCategories([]);
    setSelectedTrans([]);
    setSelectedDelivery([]);
    setPriceRange([0, 500]);
  };

  const [allMapListings, setAllMapListings] = React.useState<any[]>([]);

  React.useEffect(() => {
    getMergedListings().then((data) => {
      setAllMapListings(data);
    });
  }, []);

  const countByCategory = (catId: PlantCategory) =>
    allMapListings.filter((l) => l.plantCategory === catId).length;

  // Initialize Leaflet Map
  React.useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;

      const L = (await import("leaflet")).default;

      if (!isMounted || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [41.7151, 44.7871],
        zoom: 13,
        zoomControl: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> & OpenStreetMap',
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      L.control.zoom({ position: "topright" }).addTo(map);

      mapInstanceRef.current = map;
      setIsMapReady(true);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 🎯 Auto-detect user's GPS location on initial map load
  React.useEffect(() => {
    if (!isMapReady || typeof window === "undefined" || !navigator.geolocation) return;

    if (!userCoords) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserCoords(coords);
          setSelectedCity("ჩემი ლოკაცია (GPS)");

          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo(coords, 14, { duration: 1.2 });
          }
        },
        (err) => {
          console.log("Auto-location GPS fallback:", err.message);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    }
  }, [isMapReady]);

  // Update User Marker — Only renders when userCoords is chosen
  React.useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return;

    async function updateUserLocation() {
      const L = (await import("leaflet")).default;
      const map = mapInstanceRef.current;

      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }

      if (!userCoords) return;

      const userIconHtml = `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-10 h-10 bg-blue-500/25 rounded-full animate-ping"></div>
          <div class="w-7 h-7 bg-blue-600 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white text-xs font-black z-10">
            📍
          </div>
        </div>
      `;

      const userIcon = L.divIcon({
        html: userIconHtml,
        className: "user-gps-pin",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      userMarkerRef.current = L.marker(userCoords, { icon: userIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup("<div class='text-xs font-bold text-center p-1.5'>📍 თქვენ იმყოფებით აქ</div>");
    }

    updateUserLocation();
  }, [isMapReady, userCoords]);

  // Compute Filtered Listings for the Map — Never filters out plants when selecting "ჩემი ლოკაცია"
  const filteredListings = React.useMemo(() => {
    const refLat = userCoords ? userCoords[0] : 41.7151;
    const refLng = userCoords ? userCoords[1] : 44.7871;

    return allMapListings.map((item) => {
      const coords = LISTING_COORDINATES[item.id] || [item.lat || 41.7151, item.lng || 44.7871];
      const dist = calculateDistanceKm(refLat, refLng, coords[0], coords[1]);
      return {
        ...item,
        coords,
        distanceKm: dist,
      };
    }).filter((item) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchCategory = item.plantCategory?.toLowerCase().includes(q);
        const matchCity = item.city.toLowerCase().includes(q);
        if (!matchTitle && !matchCategory && !matchCity) return false;
      }

      // Filter by city ONLY if user specifically chose a city other than "მთელი საქართველო" and NOT "ჩემი ლოკაცია"
      if (
        selectedCity !== "მთელი საქართველო" &&
        !selectedCity.includes("ჩემი ლოკაცია") &&
        !selectedCity.includes("GPS")
      ) {
        if (!item.city.toLowerCase().includes(selectedCity.toLowerCase())) {
          return false;
        }
      }

      if (selectedCategories.length > 0 && !selectedCategories.includes(item.plantCategory as PlantCategory)) {
        return false;
      }

      if (selectedTrans.length > 0 && !selectedTrans.includes(item.transactionType)) {
        return false;
      }

      if (selectedDelivery.length > 0 && !selectedDelivery.some((d: string) => item.deliveryMethods?.includes(d as any))) {
        return false;
      }

      if (item.transactionType !== "TRADE") {
        if (item.price < priceRange[0] || item.price > priceRange[1]) return false;
      }

      return true;
    });
  }, [
    searchTerm,
    selectedCity,
    selectedCategories,
    selectedTrans,
    selectedDelivery,
    priceRange,
    userCoords,
  ]);

  // Update Dynamic Map Pins with High-End Popup Design
  React.useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return;

    async function updatePlantMarkers() {
      const L = (await import("leaflet")).default;
      const map = mapInstanceRef.current;

      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      filteredListings.forEach((item) => {
        const isVip = item.isPremium || item.isFeatured;
        const isGift = item.transactionType === "GIFT" || (item.price === 0 && item.transactionType !== "TRADE");
        const isTrade = item.transactionType === "TRADE";

        let pinBg = 'border-gray-200 bg-white text-gray-900 group-hover:border-[#003629] group-hover:bg-[#003629] group-hover:text-white';
        let pinArrow = 'bg-white border-r border-b border-gray-200 group-hover:bg-[#003629] group-hover:border-[#003629]';
        let pinEmoji = '🌱';
        let priceLabel = formatPrice(item.price);

        if (isVip) {
          pinBg = 'bg-amber-600 text-white border-amber-300 font-bold scale-105 ring-2 ring-amber-500/30';
          pinArrow = 'bg-amber-600 border-r border-b border-amber-300';
          pinEmoji = '⭐';
          priceLabel = isGift ? 'საჩუქარი' : isTrade ? 'გაცვლა' : formatPrice(item.price);
        } else if (isGift) {
          pinBg = 'bg-emerald-600 text-white border-emerald-300 font-black ring-2 ring-emerald-500/30';
          pinArrow = 'bg-emerald-600 border-r border-b border-emerald-300';
          pinEmoji = '🎁';
          priceLabel = 'საჩუქარი';
        } else if (isTrade) {
          pinBg = 'bg-amber-500 text-white border-amber-300 font-bold';
          pinArrow = 'bg-amber-500 border-r border-b border-amber-300';
          pinEmoji = '🔄';
          priceLabel = 'გაცვლა';
        }

        const distLabel = item.distanceKm < 1 ? `${Math.round(item.distanceKm * 1000)} მ` : `${item.distanceKm} კმ`;

        const iconHtml = `
          <div class="relative flex flex-col items-center group cursor-pointer">
            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-[16px] shadow-lg border transition-all duration-200 ${pinBg}">
              <span class="text-sm">${pinEmoji}</span>
              <span class="text-xs font-black">${priceLabel}</span>
            </div>
            <div class="w-2.5 h-2.5 rotate-45 -mt-1.5 ${pinArrow} transition-colors"></div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: "custom-plant-pin",
          iconSize: [84, 40],
          iconAnchor: [42, 36],
        });

        const marker = L.marker(item.coords, { icon: customIcon }).addTo(map);

        // Refined, Beautiful Popup
        const popupPriceBadge = isVip
          ? 'bg-amber-600'
          : isGift
          ? 'bg-emerald-600'
          : isTrade
          ? 'bg-amber-500'
          : '';

        const popupPriceText = isVip
          ? `VIP ${isGift ? 'საჩუქარი' : priceLabel}`
          : isGift
          ? 'უფასო საჩუქარი'
          : isTrade
          ? 'გაცვლა'
          : priceLabel;

        const popupContent = `
          <a href="/ka/listings/${item.id}" class="custom-popup-card">
            <div class="custom-popup-image-wrap">
              <img src="${item.images[0]}" alt="${item.title}" class="custom-popup-img" />
              <span class="custom-popup-price-badge ${popupPriceBadge}">
                ${popupPriceText}
              </span>
              <span class="custom-popup-dist-badge">
                📍 ${distLabel}
              </span>
            </div>
            <div class="custom-popup-title">
              ${item.title}
            </div>
            <div class="custom-popup-footer">
              <span class="custom-popup-city">📍 ${item.city}</span>
              <span class="custom-popup-action">დეტალურად ნახვა →</span>
            </div>
          </a>
        `;

        marker.bindPopup(popupContent, {
          className: "custom-plant-leaflet-popup",
          closeButton: false,
          offset: [0, -32],
        });

        marker.on("mouseover", () => marker.openPopup());
        marker.on("click", () => {
          map.panTo(item.coords, { animate: true, duration: 0.3 });
          marker.openPopup();
        });

        markersRef.current.push(marker);
      });
    }

    updatePlantMarkers();
  }, [isMapReady, filteredListings]);

  return (
    <div className="relative isolate z-0 w-full h-[calc(100dvh-4rem-3.75rem)] lg:h-[calc(100vh-5rem)] overflow-hidden bg-background">
      {/* Top Floating Controls Bar */}
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20 flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
        {/* Filters Toggle Button */}
        <Button
          onClick={() => setFilterPanelOpen(!filterPanelOpen)}
          className={`rounded-[16px] text-xs sm:text-sm font-bold shadow-ambient-lg h-10 px-3.5 sm:px-4 gap-2 transition-all cursor-pointer ${
            filterPanelOpen
              ? "bg-primary text-white hover:bg-primary-container"
              : "bg-card/95 backdrop-blur-xl border border-border/80 text-foreground hover:bg-card hover:border-primary/50"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {isKa ? "ფილტრები" : "Filters"}
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-white text-primary text-[11px] font-black flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {/* 🎯 Locate Me GPS Button directly beside Filters */}
        <Button
          type="button"
          onClick={handleLocateMe}
          disabled={gpsLoading}
          title={isKa ? "ჩემი ლოკაციის პოვნა (GPS)" : "Locate My Position"}
          className={`h-10 px-3 sm:px-3.5 rounded-[16px] font-bold text-xs sm:text-sm shadow-ambient-lg transition-all gap-1.5 cursor-pointer ${
            userCoords
              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 ring-2 ring-blue-400/50"
              : "bg-card/95 backdrop-blur-xl border border-border/80 text-foreground hover:bg-card hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400"
          }`}
        >
          {gpsLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          ) : (
            <Navigation className={`w-4 h-4 ${userCoords ? "text-white fill-white" : "text-blue-600 dark:text-blue-400"}`} />
          )}
          <span className="hidden sm:inline">
            {gpsLoading 
              ? (isKa ? "ვეძებ..." : "Locating...") 
              : userCoords 
                ? (isKa ? "ჩემი ლოკაცია" : "My Location") 
                : (isKa ? "ჩემი ლოკაცია" : "My Location")}
          </span>
        </Button>

        {/* Listings count pill */}
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[14px] bg-card/95 backdrop-blur-xl border border-border/80 text-xs font-bold text-foreground shadow-ambient">
          <span className="text-primary font-black">{filteredListings.length}</span> / {SAMPLE_LISTINGS.length} {isKa ? "პინი" : "pins"}
        </span>
      </div>

      {/* Floating Glassmorphic Filter Sidebar */}
      {filterPanelOpen && (
        <div className="absolute top-14 sm:top-16 left-3 sm:left-4 bottom-4 sm:bottom-6 z-30 w-80 sm:w-84 max-w-[calc(100vw-1.5rem)] rounded-[24px] bg-card/95 backdrop-blur-xl border border-border/80 shadow-ambient-lg flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-4 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-border/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">
                {isKa ? "რუკის ფილტრები" : "Map Filters"}
              </h2>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <button
                  onClick={resetAllFilters}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary font-semibold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {isKa ? "გასუფთავება" : "Reset"}
                </button>
              )}
              <button
                onClick={() => setFilterPanelOpen(false)}
                className="p-1 rounded-[8px] hover:bg-surface-container text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {/* Search */}
            <MapFilterSection title={isKa ? "ძებნა" : "Search"} defaultOpen={true}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={isKa ? "Monstera, ფიკუსი, ქოთანი..." : "Monstera, Ficus, Pot..."}
                  className="w-full pl-9 pr-4 py-2 rounded-[12px] border border-input bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </MapFilterSection>

            {/* Location (City / District / GPS) */}
            <MapFilterSection title={isKa ? "ლოკაცია" : "Location"}>
              <div className="rounded-[12px] border border-border/80 bg-background overflow-visible">
                <LocationSearchCombobox
                  selectedCity={selectedCity}
                  onCityChange={(cityName, coords) => {
                    setSelectedCity(cityName);
                    if (coords) {
                      setUserCoords(coords);
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo(coords, 14, { duration: 1.2 });
                      }
                    }
                  }}
                />
              </div>
              {userCoords && (
                <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1 font-medium">
                  <Navigation className="w-3 h-3 text-primary animate-pulse" />
                  {isKa ? "მანძილი დათვლილია თქვენი ლოკაციიდან" : "Distance calculated from your location"}
                </p>
              )}
            </MapFilterSection>

            {/* 💰 Price Range — Moved directly below Location */}
            <MapFilterSection title={isKa ? "ფასის დიაპაზონი (₾)" : "Price Range (₾)"}>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="w-full px-2.5 py-1.5 rounded-[8px] border border-input bg-background text-xs font-bold text-center"
                    min={0} max={priceRange[1]}
                  />
                  <span className="text-xs font-bold text-muted-foreground">—</span>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-full px-2.5 py-1.5 rounded-[8px] border border-input bg-background text-xs font-bold text-center"
                    min={priceRange[0]} max={1000}
                  />
                  <span className="text-xs font-black text-primary">₾</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {[[0, 30], [0, 100], [0, 200], [0, 500]].map(([min, max]) => (
                    <button
                      key={`${min}-${max}`}
                      onClick={() => setPriceRange([min, max])}
                      className={`px-2.5 py-0.5 rounded-[6px] text-[11px] font-bold transition-all ${
                        priceRange[0] === min && priceRange[1] === max
                          ? "bg-primary text-white"
                          : "bg-secondary-container text-foreground hover:bg-secondary-container/80"
                      }`}
                    >
                      {min === 0 ? `≤ ${max} ₾` : `${min}–${max} ₾`}
                    </button>
                  ))}
                </div>
              </div>
            </MapFilterSection>

            {/* Transaction Type */}
            <MapFilterSection title={isKa ? "გარიგების ტიპი" : "Transaction Type"}>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { id: "FIXED", label: isKa ? "ფიქსირებული ფასი" : "Fixed Price" },
                  { id: "NEGOTIABLE", label: isKa ? "ფასი შეთანხმებით" : "Negotiable" },
                  { id: "TRADE", label: isKa ? "მცენარის გაცვლა" : "Trade Only" },
                  { id: "GIFT", label: isKa ? "გაჩუქება (უფასოდ)" : "Free Giveaway" },
                ].map((t) => {
                  const active = selectedTrans.includes(t.id);
                  const count = SAMPLE_LISTINGS.filter((l) => l.transactionType === t.id).length;
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggleTrans(t.id)}
                      className={`flex items-center justify-between px-3 py-2 rounded-[12px] border text-left transition-all cursor-pointer ${
                        active
                          ? "border-primary bg-primary text-white font-bold shadow-sm"
                          : "border-border/70 bg-card hover:bg-surface-container/60 text-foreground font-semibold"
                      }`}
                    >
                      <span className="text-xs">{t.label}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                        active ? "bg-white/20 text-white" : "bg-secondary-container text-muted-foreground"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </MapFilterSection>

            {/* Delivery Methods — Right below Transaction Type */}
            <MapFilterSection title={isKa ? "მიწოდების მეთოდები" : "Delivery Methods"}>
              <div className="space-y-1.5">
                {[
                  { id: "PICKUP", label: isKa ? "ადგილიდან გატანა" : "Local Pickup" },
                  { id: "COURIER", label: isKa ? "საკურიერო მიწოდება" : "Courier Delivery" },
                  { id: "MARSHRUTKA", label: isKa ? "სამარშრუტო ტრანსპორტი" : "Regional Transit" },
                ].map((d) => {
                  const active = selectedDelivery.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      onClick={() => toggleDelivery(d.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-xs font-semibold transition-all text-left cursor-pointer ${
                        active
                          ? "bg-primary/10 text-primary font-bold border border-primary/30"
                          : "text-foreground hover:bg-surface-container border border-border/50 bg-card"
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center shrink-0 ${
                        active ? "bg-primary border-primary text-white" : "border-border"
                      }`}>
                        {active && <Check className="w-2.5 h-2.5" />}
                      </div>
                      <span>{d.label}</span>
                    </button>
                  );
                })}
              </div>
            </MapFilterSection>

            {/* Categories with Accordion & Counts */}
            <MapFilterSection title={isKa ? "მცენარის კატეგორიები" : "Plant Categories"}>
              <div className="space-y-2">
                {PLANT_CATEGORY_GROUPS.map((group) => {
                  const Icon = group.icon;
                  const groupTotal = group.children.reduce(
                    (sum, c) => sum + countByCategory(c.id),
                    0
                  );
                  if (groupTotal === 0) return null;
                  const isGroupOpen = openGroups[group.id] ?? false;
                  const groupLabel = isKa ? group.labelKa : group.labelEn;

                  return (
                    <div key={group.id} className="border-b border-border/40 pb-2 last:border-b-0">
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.id)}
                        className="w-full flex items-center justify-between py-1.5 px-2 rounded-[10px] text-left hover:bg-surface-container/60 transition-colors cursor-pointer"
                      >
                        <div className={`flex items-center gap-2 ${group.color}`}>
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="text-xs sm:text-sm font-bold text-foreground">{groupLabel}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground bg-secondary-container px-2 py-0.5 rounded-full">
                            {groupTotal}
                          </span>
                          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isGroupOpen ? "rotate-180" : ""}`} />
                        </div>
                      </button>

                      {isGroupOpen && (
                        <div className="space-y-1 mt-1 pl-2">
                          {group.children.map((cat) => {
                            const count = countByCategory(cat.id);
                            if (count === 0) return null;
                            const isActive = selectedCategories.includes(cat.id);
                            const catLabel = isKa ? cat.labelKa : cat.labelEn;

                            return (
                              <button
                                key={cat.id}
                                onClick={() => toggleCategory(cat.id)}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[10px] text-xs transition-all text-left cursor-pointer ${
                                  isActive
                                    ? "bg-primary text-white font-bold shadow-sm"
                                    : "text-foreground hover:bg-surface-container font-medium"
                                }`}
                              >
                                <span className="flex items-center gap-1.5 pr-2">
                                  <span className="break-words">{catLabel}</span>
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-auto ${
                                  isActive ? "bg-white/20 text-white" : "bg-secondary-container text-muted-foreground"
                                }`}>
                                  {count}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </MapFilterSection>
          </div>
        </div>
      )}

      {/* Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
}
