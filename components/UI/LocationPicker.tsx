"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { Icon, DivIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Search,
  Navigation,
  Loader2,
  X,
  CheckCircle2,
  Target,
  RotateCcw,
} from "lucide-react";

// ========== টাইপ ==========
interface LocationPickerProps {
  onSelect: (location: { lat: number; lng: number; address: string }) => void;
  onClose: () => void;
  initialLocation?: { lat: number; lng: number } | null;
}

interface SearchResult {
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
}

// ========== কাস্টম মার্কার ==========
const markerIcon = new DivIcon({
  html: `
    <div style="
      position: relative;
    ">
      <div style="
        width: 30px;
        height: 30px;
        background: #3B82F6;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      "></div>
      <div style="
        position: absolute;
        top: -4px;
        left: -4px;
        width: 12px;
        height: 12px;
        background: white;
        border-radius: 50%;
        box-shadow: 0 0 0 4px rgba(59,130,246,0.3);
      "></div>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  className: "",
});

// ========== ম্যাপ ক্লিক হ্যান্ডলার ==========
function MapClickHandler({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// ========== ম্যাপ সেন্টার আপডেটার ==========
function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

// ========== মেইন কম্পোনেন্ট ==========
export default function LocationPicker({
  onSelect,
  onClose,
  initialLocation,
}: LocationPickerProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(
    initialLocation
      ? { lat: initialLocation.lat, lng: initialLocation.lng }
      : null,
  );
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    initialLocation
      ? [initialLocation.lat, initialLocation.lng]
      : [23.8103, 90.4125], // Dhaka default
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [locationError, setLocationError] = useState("");

  // ========== অটো-লোকেশন (GPS) ==========
  const getAutoLocation = useCallback(async () => {
    setIsLocating(true);
    setLocationError("");

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("Geolocation not supported"));
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        },
      );

      const { latitude: lat, longitude: lng } = position.coords;
      setSelectedLocation({ lat, lng });
      setMapCenter([lat, lng]);

      // রিভার্স জিওকোডিং
      const address = await reverseGeocode(lat, lng);
      setSelectedAddress(address);
    } catch (error: any) {
      console.error("Location error:", error);
      if (error.code === 1) {
        setLocationError(
          "লোকেশন পারমিশন দেওয়া হয়নি। দয়া করে ম্যানুয়ালি লোকেশন সার্চ করুন।",
        );
      } else {
        setLocationError(
          "লোকেশন পাওয়া যায়নি। দয়া করে ম্যানুয়ালি সার্চ করুন।",
        );
      }
    }

    setIsLocating(false);
  }, []);

  // ========== সার্চ (Nominatim API) ==========
  const searchLocation = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query,
        )}&limit=5&countrycodes=bd&accept-language=bn`,
      );
      const data: SearchResult[] = await response.json();
      setSearchResults(data);
      setShowSearchResults(true);
    } catch (error) {
      console.error("Search error:", error);
    }

    setIsSearching(false);
  }, []);

  // ========== ডিবাউন্সড সার্চ ==========
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(value);
    }, 500);
  };

  // ========== সার্চ রেজাল্ট সিলেক্ট ==========
  const handleSelectSearchResult = async (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    setSelectedLocation({ lat, lng });
    setMapCenter([lat, lng]);
    setSelectedAddress(result.display_name);
    setSearchQuery(result.display_name);
    setShowSearchResults(false);
    setSearchResults([]);
  };

  // ========== ম্যাপ ক্লিক ==========
  const handleMapClick = async (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    const address = await reverseGeocode(lat, lng);
    setSelectedAddress(address);
    setSearchQuery(address);
  };

  // ========== কনফার্ম ==========
  const handleConfirm = () => {
    if (selectedLocation && selectedAddress) {
      onSelect({
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        address: selectedAddress,
      });
    }
  };

  // ========== অটো-লোকেশন (প্রথম লোডে) ==========
  useEffect(() => {
    if (!initialLocation) {
      getAutoLocation();
    } else {
      // লোকেশন আগে থেকেই থাকলে রিভার্স জিওকোড
      reverseGeocode(initialLocation.lat, initialLocation.lng).then(
        setSelectedAddress,
      );
    }
  }, []);

  // ========== ক্লিনআপ ==========
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  // ========== লোকেশন সেফ (কম্পোনেন্ট আনমাউন্টে) ==========
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && selectedLocation && selectedAddress) {
        handleConfirm();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedLocation, selectedAddress]);

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col">
      {/* ========== হেডার ========== */}
      <div className="bg-white border-b z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>

          <h2 className="font-semibold text-gray-900 text-lg">
            লোকেশন নির্বাচন করুন
          </h2>

          <div className="w-9" />
        </div>

        {/* ========== সার্চ বার ========== */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() =>
                searchResults.length > 0 && setShowSearchResults(true)
              }
              placeholder="লোকেশন সার্চ করুন (যেমন: ধানমন্ডি, গুলশান...)"
              className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
            )}
            {searchQuery && !isSearching && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setShowSearchResults(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* ========== সার্চ রেজাল্ট ড্রপডাউন ========== */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="mt-2 border rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectSearchResult(result)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b last:border-b-0 flex items-start gap-3"
                >
                  <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                      {result.name || result.display_name.split(",")[0]}
                    </p>
                    <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">
                      {result.display_name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* নো রেজাল্ট */}
          {showSearchResults &&
            searchResults.length === 0 &&
            searchQuery.length >= 2 &&
            !isSearching && (
              <div className="mt-2 p-4 text-center text-gray-400 text-sm border rounded-xl">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                কোনো লোকেশন পাওয়া যায়নি
              </div>
            )}
        </div>
      </div>

      {/* ========== ম্যাপ ========== */}
      <div className="flex-1 relative">
        <MapContainer
          center={mapCenter}
          zoom={15}
          className="h-full w-full z-0"
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          />

          <MapCenterUpdater center={mapCenter} />
          <MapClickHandler onClick={handleMapClick} />

          {/* সিলেক্টেড লোকেশন মার্কার */}
          {selectedLocation && (
            <Marker
              position={[selectedLocation.lat, selectedLocation.lng]}
              icon={markerIcon}
            />
          )}
        </MapContainer>

        {/* ========== ম্যাপ ওভারলে কন্ট্রোল ========== */}
        {/* জুম কন্ট্রোল */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-[1000] flex flex-col gap-1.5">
          <button
            onClick={() => {
              const mapEl = document.querySelector(".leaflet-container") as any;
              if (mapEl?._leaflet_map) mapEl._leaflet_map.zoomIn();
            }}
            className="w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center text-lg font-medium hover:bg-gray-50 text-gray-700"
          >
            +
          </button>
          <button
            onClick={() => {
              const mapEl = document.querySelector(".leaflet-container") as any;
              if (mapEl?._leaflet_map) mapEl._leaflet_map.zoomOut();
            }}
            className="w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center text-lg font-medium hover:bg-gray-50 text-gray-700"
          >
            −
          </button>
        </div>

        {/* My Location Button */}
        <button
          onClick={getAutoLocation}
          disabled={isLocating}
          className="absolute right-3 top-3 z-[1000] w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
        >
          {isLocating ? (
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          ) : (
            <Target className="w-5 h-5 text-blue-500" />
          )}
        </button>

        {/* লোকেশন এরর */}
        {locationError && (
          <div className="absolute top-3 left-3 right-16 z-[1000] bg-red-50 border border-red-200 p-3 rounded-xl text-sm text-red-600">
            {locationError}
          </div>
        )}

        {/* ========== সিলেক্টেড লোকেশন কার্ড (নিচে) ========== */}
        {selectedLocation && selectedAddress && (
          <div className="absolute bottom-4 left-4 right-4 z-[1000]">
            <div className="bg-white rounded-2xl shadow-lg p-4 border">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm line-clamp-2">
                    {selectedAddress}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {selectedLocation.lat.toFixed(6)},{" "}
                    {selectedLocation.lng.toFixed(6)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedLocation(null);
                    setSelectedAddress("");
                    setSearchQuery("");
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-full flex-shrink-0"
                >
                  <RotateCcw className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* সিলেক্ট করেননি — প্রম্পট */}
        {!selectedLocation && (
          <div className="absolute bottom-4 left-4 right-4 z-[1000]">
            <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lg p-4 border border-blue-100 text-center">
              <p className="text-gray-500 text-sm">
                👆 ম্যাপে ট্যাপ করুন অথবা উপরে সার্চ করে লোকেশন নির্বাচন করুন
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ========== ফুটার (Confirm + GPS) ========== */}
      <div className="border-t bg-white p-4 pb-safe flex gap-3">
        {/* GPS অটো লোকেশন */}
        <button
          onClick={getAutoLocation}
          disabled={isLocating}
          className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {isLocating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Navigation className="w-5 h-5" />
          )}
          <span className="hidden sm:inline">বর্তমান লোকেশন</span>
        </button>

        {/* কনফার্ম বাটন */}
        <button
          onClick={handleConfirm}
          disabled={!selectedLocation || !selectedAddress}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-200"
        >
          <CheckCircle2 className="w-5 h-5" />
          {selectedLocation ? "লোকেশন নিশ্চিত করুন" : "লোকেশন নির্বাচন করুন"}
        </button>
      </div>
    </div>
  );
}

// ========== রিভার্স জিওকোডিং ==========
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=bn`,
    );
    const data = await response.json();
    return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}
