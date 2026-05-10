"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { DivIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { getCurrentPosition } from "@/lib/location";
import { MapPin } from "lucide-react";
import MapMarker from "./MapMarker";
import { useIssueStore } from "@/stores/issueStore";

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
        map?.setView(coords, 15);
      })
      .catch(() => {
        const dhaka: [number, number] = [23.8103, 90.4125];
        setPosition(dhaka);
        map?.setView(dhaka, 12);
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
        "></div>
        <style>
          @keyframes pulse {
            0% { box-shadow: 0 0 0 4px rgba(59,130,246,0.3); }
            50% { box-shadow: 0 0 0 12px rgba(59,130,246,0); }
            100% { box-shadow: 0 0 0 4px rgba(59,130,246,0.3); }
          }
        </style>`,
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

// ========== ম্যাপ ক্লিক হ্যান্ডলার ==========
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

// ========== জুম কন্ট্রোল (MapContainer-এর ভিতরে) ==========
function ZoomControls({ userLocation }: { userLocation: [number, number] | null }) {
  const map = useMap();

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[1000] flex flex-col gap-2">
      <button
        onClick={() => map?.zoomIn()}
        className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center text-xl font-medium hover:bg-gray-50 text-gray-700"
      >
        +
      </button>
      <button
        onClick={() => map?.zoomOut()}
        className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center text-xl font-medium hover:bg-gray-50 text-gray-700"
      >
        −
      </button>
      <button
        onClick={() => {
          if (userLocation) {
            map?.setView(userLocation, 16);
          }
        }}
        className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50"
      >
        <MapPin className="w-5 h-5 text-blue-600" />
      </button>
    </div>
  );
}

// ========== মেইন ম্যাপ কম্পোনেন্ট ==========
export default function MapView() {
  const { issues, setSelectedIssue, selectedIssue } = useIssueStore();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([23.8103, 90.4125]);

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

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={mapCenter}
        zoom={14}
        className="h-full w-full z-0"
        zoomControl={false}
      >
        {/* টাইল লেয়ার */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />

        {/* নিজের অবস্থান */}
        <LocationTracker />

        {/* ইস্যু মার্কার */}
        {issues.map((issue) => (
          <MapMarker
            key={issue.id}
            issue={issue}
            isSelected={selectedIssue?.id === issue.id}
            onClick={() => setSelectedIssue(issue)}
          />
        ))}

        {/* জুম কন্ট্রোল (MapContainer-এর ভিতরে, useMap অ্যাক্সেস পায়) */}
        <ZoomControls userLocation={userLocation} />

        {/* ক্লিক হ্যান্ডলার */}
        <MapClickHandler
          onClick={(lat, lng) => {
            console.log("Clicked at:", lat, lng);
          }}
        />
      </MapContainer>

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

// ========== হেল্পার ==========
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