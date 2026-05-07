"use client";

import { useEffect, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { Icon, DivIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useIssueStore } from "@/stores/issueStore";
import { getCurrentPosition, reverseGeocode } from "@/lib/location";
import { MapPin } from "lucide-react";
import MapMarker from "./MapMarker";

// ========== লোকেশন ট্র্যাকার ==========
function LocationTracker() {
  const map = useMap();
  const [position, setPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    getCurrentPosition()
      .then((pos) => {
        const coords: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];
        setPosition(coords);
        // ✅ map অবজেক্ট চেক করে নিন
        if (map && typeof map.setView === "function") {
          map.setView(coords, 15);
        }
      })
      .catch(() => {
        const dhaka: [number, number] = [23.8103, 90.4125];
        setPosition(dhaka);
        // ✅ চেক করুন map আছে কিনা
        if (map && typeof map.setView === "function") {
          map.setView(dhaka, 12);
        }
      });
  }, [map]);

  return position ? (
    <Marker
      position={position}
      icon={new DivIcon({
        html: `<div style="
          width: 16px; height: 16px;
          background: #3B82F6;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 0 4px rgba(59,130,246,0.3);
          animation: pulse 2s infinite;
        "></div>`,
        iconSize: [16, 16],
        className: "",
      })}
    >
      <Popup>
        <div className="text-center text-sm font-medium">📍 আপনার অবস্থান</div>
      </Popup>
    </Marker>
  ) : null;
}

// ========== ম্যাপ ক্লিক হ্যান্ডলার (নতুন লোকেশন সিলেক্ট) ==========
function MapClickHandler({
  onClick,
}: {
  onClick?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: async (e) => {
      if (onClick) {
        onClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// ========== কাস্টম মার্কার আইকন ==========
const categoryIcons: Record<string, string> = {
  road: "🛣️",
  electricity: "💡",
  water: "💧",
  garbage: "🗑️",
  drainage: "🌊",
  other: "📌",
};

const categoryColors: Record<string, string> = {
  road: "#F97316",
  electricity: "#FACC15",
  water: "#3B82F6",
  garbage: "#6B7280",
  drainage: "#06B6D4",
  other: "#8B5CF6",
};

function createIssueIcon(category: string, votes: number, status: string) {
  const emoji = categoryIcons[category] || "📌";
  const color = status === "resolved" ? "#22C55E" : categoryColors[category] || "#8B5CF6";
  const opacity = status === "resolved" ? "0.6" : "1";

  return new DivIcon({
    html: `
      <div style="
        position: relative;
        opacity: ${opacity};
        cursor: pointer;
      ">
        <div style="
          background: ${color};
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          border: 2px solid white;
          transform: rotate(45deg);
        ">
          <span style="transform: rotate(-45deg);">${emoji}</span>
        </div>
        ${
          votes > 1
            ? `
          <div style="
            position: absolute;
            top: -6px;
            right: -8px;
            background: #EF4444;
            color: white;
            font-size: 10px;
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 10px;
            border: 1px solid white;
          ">${votes}</div>
        `
            : ""
        }
        ${
          status === "resolved"
            ? `
          <div style="
            position: absolute;
            bottom: -4px;
            left: 50%;
            transform: translateX(-50%);
            background: #22C55E;
            color: white;
            font-size: 8px;
            padding: 1px 6px;
            border-radius: 8px;
            white-space: nowrap;
          ">সমাধান</div>
        `
            : ""
        }
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
    className: "",
  });
}

// ========== মেইন ম্যাপ কম্পোনেন্ট ==========
export default function MapView() {
  const { issues, setSelectedIssue, selectedIssue } = useIssueStore();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    23.8103, 90.4125,
  ]); // Dhaka

  // লোকেশন নেওয়া
  useEffect(() => {
    getCurrentPosition()
      .then((pos) => {
        const loc: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];
        setUserLocation(loc);
        setMapCenter(loc);
      })
      .catch(() => console.log("Using default location"));
  }, []);

  // সিলেক্টেড ইস্যুতে জুম করা
  const selectedMarker = useMemo(() => {
    if (!selectedIssue) return null;
    return [selectedIssue.location.lat, selectedIssue.location.lng] as [
      number,
      number
    ];
  }, [selectedIssue]);

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={mapCenter}
        zoom={14}
        className="h-full w-full z-0"
        zoomControl={false} // নিজস্ব কাস্টম কন্ট্রোল দিলে
      >
        {/* টাইল লেয়ার */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />

        {/* নিজের অবস্থান ট্র্যাকার */}
        <LocationTracker />

        {/* ইস্যু মার্কারগুলো */}
            {issues.map((issue) => (
            <MapMarker
                key={issue.id}
                issue={issue}
                isSelected={selectedIssue?.id === issue.id}
                onClick={() => setSelectedIssue(issue)}
            />
            ))}

        {/* ক্লিক হ্যান্ডলার (ভবিষ্যতে ব্যবহারের জন্য) */}
        <MapClickHandler
          onClick={(lat, lng) => {
            console.log("Clicked at:", lat, lng);
            // চাইলে এখানে লোকেশন সেট করে /report পেজে পাঠাতে পারেন
          }}
        />
      </MapContainer>

      {/* ========== জুম কন্ট্রোল (কাস্টম) ========== */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[1000] flex flex-col gap-2">
        <button
          onClick={() => {
            const map = document.querySelector(".leaflet-container");
            if (map) {
              map._leaflet_map?.zoomIn();
            }
          }}
          className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center text-xl hover:bg-gray-50"
        >
          +
        </button>
        <button
          onClick={() => {
            const map = document.querySelector(".leaflet-container");
            if (map) {
              // @ts-ignore
              map._leaflet_map?.zoomOut();
            }
          }}
          className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center text-xl hover:bg-gray-50"
        >
          −
        </button>
        {/* My Location */}
        <button
          onClick={() => {
            if (userLocation) {
              const map = document.querySelector(".leaflet-container");
              // @ts-ignore
              map?._leaflet_map?.setView(userLocation, 16);
            }
          }}
          className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50"
        >
          <MapPin className="w-5 h-5 text-blue-600" />
        </button>
      </div>

      {/* ========== নিচের স্ট্যাটস বার ========== */}
      <div className="absolute bottom-4 left-4 right-4 z-[1000] pointer-events-none">
        <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-3 pointer-events-auto">
          <div className="flex justify-around text-center">
            <div>
              <div className="text-lg font-bold text-orange-500">
                {issues.filter((i) => i.status === "reported").length}
              </div>
              <div className="text-xs text-gray-500">জমা পড়েছে</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-500">
                {issues.filter((i) => i.status === "in-progress").length}
              </div>
              <div className="text-xs text-gray-500">কাজ চলছে</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-500">
                {issues.filter((i) => i.status === "resolved").length}
              </div>
              <div className="text-xs text-gray-500">সমাধান</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-500">
                {issues.reduce((sum, i) => sum + i.votes, 0)}
              </div>
              <div className="text-xs text-gray-500">মোট ভোট</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== হেল্পার: সময় বের করা ==========
function timeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "এইমাত্র";
  if (diffMins < 60) return `${diffMins} মিনিট আগে`;
  if (diffHours < 24) return `${diffHours} ঘন্টা আগে`;
  if (diffDays < 7) return `${diffDays} দিন আগে`;
  return then.toLocaleDateString("bn-BD");
}