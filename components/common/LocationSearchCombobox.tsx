"use client";

import * as React from "react";
import { MapPin, Check, ChevronUp, ChevronDown, Navigation, Loader2 } from "lucide-react";

export interface GeoLocationOption {
  id: string;
  nameKa: string;
  nameEn: string;
  regionKa: string;
  lat?: number;
  lng?: number;
}

export const GEORGIA_CITIES: GeoLocationOption[] = [
  { id: "all", nameKa: "მთელი საქართველო", nameEn: "All Georgia", regionKa: "საქართველო" },
  // Tbilisi & Districts
  { id: "tbilisi-vake", nameKa: "თბილისი (ვაკე)", nameEn: "Tbilisi (Vake)", regionKa: "თბილისი", lat: 41.7116, lng: 44.7554 },
  { id: "tbilisi-saburtalo", nameKa: "თბილისი (საბურთალო)", nameEn: "Tbilisi (Saburtalo)", regionKa: "თბილისი", lat: 41.7271, lng: 44.7742 },
  { id: "tbilisi-vera", nameKa: "თბილისი (ვერა)", nameEn: "Tbilisi (Vera)", regionKa: "თბილისი", lat: 41.7100, lng: 44.7850 },
  { id: "tbilisi-sololaki", nameKa: "თბილისი (სოლოლაკი / მთაწმინდა)", nameEn: "Tbilisi (Sololaki)", regionKa: "თბილისი", lat: 41.6938, lng: 44.8015 },
  { id: "tbilisi-didube", nameKa: "თბილისი (დიდუბე)", nameEn: "Tbilisi (Didube)", regionKa: "თბილისი", lat: 41.7450, lng: 44.7920 },
  { id: "tbilisi-digomi", nameKa: "თბილისი (დიდი დიღომი)", nameEn: "Tbilisi (Didi Digomi)", regionKa: "თბილისი", lat: 41.7820, lng: 44.7680 },
  { id: "tbilisi-gldani", nameKa: "თბილისი (გლდანი-ნაძალადევი)", nameEn: "Tbilisi (Gldani)", regionKa: "თბილისი", lat: 41.7920, lng: 44.8250 },
  { id: "tbilisi-isani", nameKa: "თბილისი (ისანი-სამგორი)", nameEn: "Tbilisi (Isani)", regionKa: "თბილისი", lat: 41.6880, lng: 44.8450 },
  { id: "tbilisi-all", nameKa: "თბილისი (ცენტრი)", nameEn: "Tbilisi (Center)", regionKa: "თბილისი", lat: 41.7151, lng: 44.8271 },
  // Major Cities & Regions
  { id: "batumi", nameKa: "ბათუმი (ბულვარი & ცენტრი)", nameEn: "Batumi (Boulevard)", regionKa: "აჭარა", lat: 41.6423, lng: 41.6339 },
  { id: "kutaisi", nameKa: "ქუთაისი (ცენტრი)", nameEn: "Kutaisi (Center)", regionKa: "იმერეთი", lat: 42.2679, lng: 42.6946 },
  { id: "rustavi", nameKa: "რუსთავი", nameEn: "Rustavi", regionKa: "ქვემო ქართლი", lat: 41.5495, lng: 44.9932 },
  { id: "mtskheta", nameKa: "მცხეთა", nameEn: "Mtskheta", regionKa: "მცხეთა-მთიანეთი", lat: 41.8458, lng: 44.7188 },
  { id: "gori", nameKa: "გორი", nameEn: "Gori", regionKa: "შიდა ქართლი", lat: 41.9842, lng: 44.1158 },
  { id: "telavi", nameKa: "თელავი", nameEn: "Telavi", regionKa: "კახეთი", lat: 41.9198, lng: 45.4731 },
  { id: "zugdidi", nameKa: "ზუგდიდი", nameEn: "Zugdidi", regionKa: "სამეგრელო", lat: 42.5088, lng: 41.8709 },
  { id: "poti", nameKa: "ფოთი", nameEn: "Poti", regionKa: "სამეგრელო", lat: 42.1462, lng: 41.6719 },
  { id: "kobuleti", nameKa: "ქობულეთი", nameEn: "Kobuleti", regionKa: "აჭარა", lat: 41.8116, lng: 41.7753 },
  { id: "borjomi", nameKa: "ბორჯომი", nameEn: "Borjomi", regionKa: "სამცხე-ჯავახეთი", lat: 41.8389, lng: 43.3792 },
  { id: "akhaltsikhe", nameKa: "ახალციხე", nameEn: "Akhaltsikhe", regionKa: "სამცხე-ჯავახეთი", lat: 41.6392, lng: 42.9826 },
];

export interface LocationSearchComboboxProps {
  selectedCity: string;
  onCityChange: (cityName: string, coords?: [number, number]) => void;
  className?: string;
}

export function LocationSearchCombobox({
  selectedCity,
  onCityChange,
  className = "",
}: LocationSearchComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [gpsLoading, setGpsLoading] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  const filteredCities = GEORGIA_CITIES.filter((city) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      city.nameKa.toLowerCase().includes(q) ||
      city.nameEn.toLowerCase().includes(q) ||
      city.regionKa.toLowerCase().includes(q)
    );
  });

  const handleSelectCity = (city: GeoLocationOption) => {
    onCityChange(
      city.nameKa,
      city.lat && city.lng ? [city.lat, city.lng] : undefined
    );
    setQuery("");
    setIsOpen(false);
  };

  // GPS handler
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("თქვენი ბრაუზერი GPS-ს არ უჭერს მხარს.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onCityChange("📍 ჩემი ლოკაცია", [latitude, longitude]);
        setGpsLoading(false);
        setIsOpen(false);
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === 1) {
          alert("GPS წვდომა უარყოფილია. გთხოვთ ბრაუზერის პარამეტრებში დაუშვათ ლოკაცია.");
        } else {
          alert("GPS სიგნალი ვერ მოიძებნა. სცადეთ ხელით ქალაქის/უბნის არჩევა.");
        }
      },
      { timeout: 8000, maximumAge: 60000, enableHighAccuracy: true }
    );
  };

  const displayLabel =
    selectedCity === "მთელი საქართველო" ? "ლოკაცია (მთელი საქართველო)" : selectedCity;

  return (
    <div className={`relative isolate ${className}`} ref={dropdownRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-full w-full px-3.5 py-2.5 text-left text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors group"
        aria-expanded={isOpen}
      >
        <MapPin className="w-4 h-4 text-primary shrink-0" />
        <span className="flex-1 truncate">{displayLabel}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute left-0 top-full mt-1.5 w-76 sm:w-80 rounded-2xl border border-border/80 bg-card shadow-2xl shadow-black/20 z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Search Input */}
          <div className="p-3 border-b border-border/60">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ჩაწერეთ ქალაქი ან უბანი..."
              className="w-full pl-3 pr-3 py-2 rounded-xl bg-background border border-input text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              autoComplete="off"
            />

            {/* GPS Button */}
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={gpsLoading}
              className="mt-2.5 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary dark:text-primary-fixed text-xs font-bold transition-colors disabled:opacity-60"
            >
              {gpsLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <Navigation className="w-4 h-4 text-primary" />
              )}
              {gpsLoading ? "ლოკაციის ძებნა..." : "📍 ჩემი ლოკაცია (GPS)"}
            </button>
          </div>

          {/* City & District List */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
            {filteredCities.map((city) => {
              const isSelected = selectedCity === city.nameKa;
              return (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => handleSelectCity(city)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors text-left ${
                    isSelected
                      ? "bg-primary text-white font-bold"
                      : "text-foreground hover:bg-surface-container"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-white" : "text-muted-foreground"}`} />
                    <span className="truncate">{city.nameKa}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 shrink-0 text-white" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
