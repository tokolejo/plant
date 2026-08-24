"use client";

import * as React from "react";
import { MapPin, Check, ChevronDown, Navigation, Loader2, Search, X } from "lucide-react";

export interface GeoLocationOption {
  id: string;
  nameKa: string;
  nameEn: string;
  groupKa: string;
  lat?: number;
  lng?: number;
}

export const GEORGIA_CITIES: GeoLocationOption[] = [
  { id: "all", nameKa: "მთელი საქართველო", nameEn: "All Georgia", groupKa: "ძირითადი" },
  // თბილისის უბნები
  { id: "tbilisi-vake", nameKa: "თბილისი (ვაკე)", nameEn: "Tbilisi (Vake)", groupKa: "თბილისის უბნები", lat: 41.7116, lng: 44.7554 },
  { id: "tbilisi-saburtalo", nameKa: "თბილისი (საბურთალო)", nameEn: "Tbilisi (Saburtalo)", groupKa: "თბილისის უბნები", lat: 41.7271, lng: 44.7742 },
  { id: "tbilisi-vera", nameKa: "თბილისი (ვერა)", nameEn: "Tbilisi (Vera)", groupKa: "თბილისის უბნები", lat: 41.7100, lng: 44.7850 },
  { id: "tbilisi-sololaki", nameKa: "თბილისი (მთაწმინდა-სოლოლაკი)", nameEn: "Tbilisi (Sololaki)", groupKa: "თბილისის უბნები", lat: 41.6938, lng: 44.8015 },
  { id: "tbilisi-didube", nameKa: "თბილისი (დიდუბე-ჩუღურეთი)", nameEn: "Tbilisi (Didube)", groupKa: "თბილისის უბნები", lat: 41.7450, lng: 44.7920 },
  { id: "tbilisi-digomi", nameKa: "თბილისი (დიღომი)", nameEn: "Tbilisi (Digomi)", groupKa: "თბილისის უბნები", lat: 41.7820, lng: 44.7680 },
  { id: "tbilisi-gldani", nameKa: "თბილისი (გლდანი-ნაძალადევი)", nameEn: "Tbilisi (Gldani)", groupKa: "თბილისის უბნები", lat: 41.7920, lng: 44.8250 },
  { id: "tbilisi-isani", nameKa: "თბილისი (ისანი-სამგორი)", nameEn: "Tbilisi (Isani)", groupKa: "თბილისის უბნები", lat: 41.6880, lng: 44.8450 },
  { id: "tbilisi-center", nameKa: "თბილისი (ცენტრი)", nameEn: "Tbilisi (Center)", groupKa: "თბილისის უბნები", lat: 41.7151, lng: 44.8271 },
  // ქალაქები & რეგიონები
  { id: "batumi", nameKa: "ბათუმი", nameEn: "Batumi", groupKa: "ქალაქები & რეგიონები", lat: 41.6423, lng: 41.6339 },
  { id: "kutaisi", nameKa: "ქუთაისი", nameEn: "Kutaisi", groupKa: "ქალაქები & რეგიონები", lat: 42.2679, lng: 42.6946 },
  { id: "rustavi", nameKa: "რუსთავი", nameEn: "Rustavi", groupKa: "ქალაქები & რეგიონები", lat: 41.5495, lng: 44.9932 },
  { id: "mtskheta", nameKa: "მცხეთა", nameEn: "Mtskheta", groupKa: "ქალაქები & რეგიონები", lat: 41.8458, lng: 44.7188 },
  { id: "gori", nameKa: "გორი", nameEn: "Gori", groupKa: "ქალაქები & რეგიონები", lat: 41.9842, lng: 44.1158 },
  { id: "telavi", nameKa: "თელავი (კახეთი)", nameEn: "Telavi", groupKa: "ქალაქები & რეგიონები", lat: 41.9198, lng: 45.4731 },
  { id: "zugdidi", nameKa: "ზუგდიდი", nameEn: "Zugdidi", groupKa: "ქალაქები & რეგიონები", lat: 42.5088, lng: 41.8709 },
  { id: "poti", nameKa: "ფოთი", nameEn: "Poti", groupKa: "ქალაქები & რეგიონები", lat: 42.1462, lng: 41.6719 },
  { id: "kobuleti", nameKa: "ქობულეთი", nameEn: "Kobuleti", groupKa: "ქალაქები & რეგიონები", lat: 41.8116, lng: 41.7753 },
  { id: "borjomi", nameKa: "ბორჯომი", nameEn: "Borjomi", groupKa: "ქალაქები & რეგიონები", lat: 41.8389, lng: 43.3792 },
  { id: "akhaltsikhe", nameKa: "ახალციხე", nameEn: "Akhaltsikhe", groupKa: "ქალაქები & რეგიონები", lat: 41.6392, lng: 42.9826 },
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
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  const filteredCities = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return GEORGIA_CITIES;
    return GEORGIA_CITIES.filter((city) =>
      city.nameKa.toLowerCase().includes(q) ||
      city.nameEn.toLowerCase().includes(q) ||
      city.groupKa.toLowerCase().includes(q)
    );
  }, [query]);

  const handleSelectCity = (city: GeoLocationOption) => {
    onCityChange(
      city.nameKa,
      city.lat && city.lng ? [city.lat, city.lng] : undefined
    );
    setQuery("");
    setIsOpen(false);
  };

  // GPS geolocation handler
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("თქვენი ბრაუზერი GPS-ს არ უჭერს მხარს.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onCityChange("ჩემი ლოკაცია", [latitude, longitude]);
        setGpsLoading(false);
        setIsOpen(false);
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === 1) {
          alert("GPS წვდომა უარყოფილია. გთხოვთ ბრაუზერში დაუშვათ ლოკაციის გაზიარება.");
        } else {
          alert("GPS სიგნალი ვერ მოიძებნა. გთხოვთ ხელით აირჩიოთ ქალაქი ან უბანი.");
        }
      },
      { timeout: 8000, maximumAge: 60000, enableHighAccuracy: true }
    );
  };

  // Clean, concise label that never awkwardly truncates
  const displayLabel = selectedCity || "მთელი საქართველო";

  return (
    <div className={`relative ${isOpen ? "z-[60]" : "z-10"} ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-full w-full px-3.5 py-2.5 text-left text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors group cursor-pointer"
        aria-expanded={isOpen}
      >
        <MapPin className="w-4 h-4 text-primary shrink-0 transition-transform group-hover:scale-110" />
        <span className="flex-1 truncate">{displayLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-primary" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Modal */}
      {isOpen && (
        <div
          className="absolute left-0 top-full mt-2 w-full min-w-[270px] sm:min-w-[290px] rounded-[20px] border border-border/90 bg-card shadow-2xl shadow-black/30 z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          style={{ maxHeight: "min(420px, 80vh)" }}
        >
          {/* Search Header */}
          <div className="p-3 border-b border-border/60 bg-surface-cream/40 space-y-2">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ჩაწერეთ ქალაქი ან უბანი..."
                className="w-full pl-8 pr-7 py-2 rounded-[12px] bg-background border border-border/70 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 p-0.5 rounded-full text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* GPS Trigger Button */}
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={gpsLoading}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-[12px] bg-secondary-container/90 hover:bg-secondary-container text-primary text-xs font-bold transition-all border border-border/50 shadow-2xs disabled:opacity-60 cursor-pointer active:scale-[0.98]"
            >
              {gpsLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
              ) : (
                <Navigation className="w-3.5 h-3.5 text-primary shrink-0" />
              )}
              <span>{gpsLoading ? "ლოკაციის ძებნა..." : "ჩემი ლოკაცია (GPS)"}</span>
            </button>
          </div>

          {/* Categorized Options List */}
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
            {filteredCities.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                ლოკაცია ვერ მოიძებნა
              </div>
            ) : (
              filteredCities.map((city, idx) => {
                const isSelected = selectedCity === city.nameKa;
                const isAll = city.id === "all";
                const prevCity = filteredCities[idx - 1];
                const showGroupHeader = !query && (!prevCity || prevCity.groupKa !== city.groupKa) && !isAll;

                return (
                  <React.Fragment key={city.id}>
                    {showGroupHeader && (
                      <div className="px-2.5 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                        {city.groupKa}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSelectCity(city)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-[12px] text-xs sm:text-sm font-semibold transition-all text-left cursor-pointer ${
                        isSelected
                          ? "bg-primary text-white font-bold shadow-xs"
                          : "text-foreground hover:bg-surface-container"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <MapPin
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSelected ? "text-white" : isAll ? "text-primary" : "text-muted-foreground"
                          }`}
                        />
                        <span className="truncate">{city.nameKa}</span>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 shrink-0 text-white ml-2" />
                      )}
                    </button>
                  </React.Fragment>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
