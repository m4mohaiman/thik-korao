"use client";

import { useEffect, useRef, useState } from "react";
import { Marker, Popup, useMap } from "react-leaflet";
import { DivIcon } from "leaflet";
import { useIssueStore } from "@/stores/issueStore";
import Image from 'next/image'
import {
  Clock,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronUp,
} from "lucide-react";

// ========== প্রপস ==========
interface MapMarkerProps {
  issue: Issue;
  isSelected?: boolean;
  onClick?: () => void;
}

// ========== ক্যাটাগরি ইমোজি ম্যাপিং ==========
const CATEGORY_EMOJI: Record<string, string> = {
  road: "🛣️",
  electricity: "💡",
  water: "💧",
  garbage: "🗑️",
  drainage: "🌊",
  other: "📌",
};

// ========== ক্যাটাগরি কালার ==========
const CATEGORY_COLOR: Record<string, string> = {
  road: "#F97316", // orange
  electricity: "#EAB308", // yellow
  water: "#3B82F6", // blue
  garbage: "#6B7280", // gray
  drainage: "#06B6D4", // cyan
  other: "#8B5CF6", // purple
};

// ========== স্ট্যাটাস কালার ==========
const STATUS_COLOR: Record<string, string> = {
  reported: "#F97316", // orange
  acknowledged: "#3B82F6", // blue
  "in-progress": "#8B5CF6", // purple
  resolved: "#22C55E", // green
  rejected: "#EF4444", // red
};

// ========== স্ট্যাটাস ইমোজি ==========
const STATUS_EMOJI: Record<string, string> = {
  reported: "📩",
  acknowledged: "👀",
  "in-progress": "🔧",
  resolved: "✅",
  rejected: "❌",
};

// ========== মার্কার আইকন জেনারেটর ==========
function createMarkerIcon(
  category: string,
  status: string,
  votes: number,
  isSelected: boolean
): DivIcon {
  const emoji = CATEGORY_EMOJI[category] || "📌";
  const color = status === "resolved" ? "#22C55E" : CATEGORY_COLOR[category] || "#8B5CF6";
  const statusEmoji = STATUS_EMOJI[status] || "";
  const isResolved = status === "resolved";
  const isRejected = status === "rejected";

  // সিলেক্টেড মার্কার বড় হবে
  const size = isSelected ? 56 : 44;
  const borderWidth = isSelected ? 3 : 2;
  const shadowSize = isSelected ? "0 8px 25px" : "0 4px 12px";

  const html = `
    <div style="
      position: relative;
      cursor: pointer;
      transition: transform 0.2s ease;
      transform: ${isSelected ? "scale(1.15)" : "scale(1)"};
    ">
      <!-- মেইন মার্কার -->
      <div style="
        background: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: ${isSelected ? "16px" : "12px"};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${isSelected ? "24px" : "20px"};
        box-shadow: ${shadowSize} rgba(0,0,0,0.25);
        border: ${borderWidth}px solid white;
        transform: rotate(45deg);
        opacity: ${isResolved || isRejected ? "0.7" : "1"};
        position: relative;
      ">
        <span style="transform: rotate(-45deg);">
          ${emoji}
        </span>
      </div>

      ${
        status !== "reported" && !isResolved && !isRejected
          ? `
        <!-- স্ট্যাটাস ইন্ডিকেটর (নিচে) -->
        <div style="
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          background: ${STATUS_COLOR[status]};
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 8px;
          white-space: nowrap;
          font-weight: 500;
          border: 1px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.15);
        ">
          ${statusEmoji}
        </div>
      `
          : ""
      }

      ${
        isResolved
          ? `
        <!-- রিজল্ভড চেকমার্ক -->
        <div style="
          position: absolute;
          top: -4px;
          right: -4px;
          width: 20px;
          height: 20px;
          background: #22C55E;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.15);
        ">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      `
          : ""
      }

      ${
        isRejected
          ? `
        <!-- রিজেক্টেড ক্রস -->
        <div style="
          position: absolute;
          top: -4px;
          right: -4px;
          width: 20px;
          height: 20px;
          background: #EF4444;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.15);
        ">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
      `
          : ""
      }

      ${
        votes > 1
          ? `
        <!-- ভোট ব্যাজ -->
        <div style="
          position: absolute;
          top: -8px;
          left: -8px;
          background: #EF4444;
          color: white;
          font-size: 11px;
          font-weight: bold;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">
          ${votes}
        </div>
      `
          : ""
      }

      ${
        isSelected
          ? `
        <!-- পালস রিং (সিলেক্টেড) -->
        <div style="
          position: absolute;
          inset: -8px;
          border-radius: 20px;
          border: 3px solid ${color};
          opacity: 0.3;
          animation: marker-pulse 2s infinite;
        "></div>
      `
          : ""
      }
    </div>

    <style>
      @keyframes marker-pulse {
        0% {
          transform: scale(1);
          opacity: 0.3;
        }
        50% {
          transform: scale(1.3);
          opacity: 0;
        }
        100% {
          transform: scale(1);
          opacity: 0.3;
        }
      }
    </style>
  `;

  return new DivIcon({
    html,
    iconSize: [size + 16, size + 24], // extra space for badges
    iconAnchor: [(size + 16) / 2, (size + 24) / 2 + 12],
    popupAnchor: [0, -(size / 2 + 12)],
    className: "", // remove default leaflet styles
  });
}

// ========== মেইন MapMarker কম্পোনেন্ট ==========
export default function MapMarker({ issue, isSelected = false, onClick }: MapMarkerProps) {
  const markerRef = useRef<any>(null);
  const map = useMap();
  const { voteIssue } = useIssueStore();
  const [hasVoted, setHasVoted] = useState(false);
  const [localVotes, setLocalVotes] = useState(issue.votes);

  // সিলেক্টেড মার্কারে জুম + প্যান
  useEffect(() => {
    if (isSelected && markerRef.current) {
      const latlng = markerRef.current.getLatLng();
      map.flyTo(latlng, 16, {
        duration: 1,
      });
    }
  }, [isSelected, map]);

  // লোকাল স্টোরেজ থেকে ভোট চেক
  useEffect(() => {
    const deviceId = localStorage.getItem("deviceId") || "";
    if (deviceId && issue.voted_by.includes(deviceId)) {
      setHasVoted(true);
    }
  }, [issue.voted_by]);

  // ভোট হ্যান্ডলার
  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasVoted) return;

    const deviceId = localStorage.getItem("deviceId") || "anonymous";
    setHasVoted(true);
    setLocalVotes((prev) => prev + 1);

    await voteIssue(issue.id, deviceId);
  };

  // মার্কার ক্লিক হ্যান্ডলার
  const handleMarkerClick = () => {
    if (onClick) onClick();
  };

  // কাস্টম আইকন
  const icon = createMarkerIcon(issue.category, issue.status, localVotes, isSelected);

  return (
    <Marker
      ref={markerRef}
      position={[issue.location.lat, issue.location.lng]}
      icon={icon}
      eventHandlers={{
        click: handleMarkerClick,
      }}
    >
      <Popup
        maxWidth={300}
        minWidth={240}
        className="custom-marker-popup"
        closeButton={true}
      >
        <PopupContent
          issue={issue}
          localVotes={localVotes}
          hasVoted={hasVoted}
          onVote={handleVote}
          onViewDetails={handleMarkerClick}
        />
      </Popup>
    </Marker>
  );
}

// ========== পপআপ কন্টেন্ট ==========
function PopupContent({
  issue,
  localVotes,
  hasVoted,
  onVote,
  onViewDetails,
}: {
  issue: Issue;
  localVotes: number;
  hasVoted: boolean;
  onVote: (e: React.MouseEvent) => void;
  onViewDetails: () => void;
}) {
  const statusText = getStatusText(issue.status);
  const timeText = timeAgo(issue.created_at);

  // প্রোগ্রেস ইন্ডিকেটর (কাজ চলছে)
  const isInProgress = issue.status === "in-progress";

  return (
    <div className="p-">
      {/* ইমেজ (থাকলে) */}
      {issue.images.length > 0 && (
        <div className="relative -mx-0.5 -mt-0.5 mb-3">
          <Image
            width={300}
            height={144}
            src={issue.images[0]}
            alt={issue.title}
            className="w-full h-36 object-cover rounded-t-lg"
            loading="lazy"
          />
          {issue.images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
              +{issue.images.length - 1}
            </div>
          )}
          {/* স্ট্যাটাস ওভারলে */}
          <div className="absolute top-2 left-2">
            <StatusBadge status={issue.status} />
          </div>
        </div>
      )}

      {/* ক্যাটাগরি + স্ট্যাটাস (যদি ইমেজ না থাকে) */}
      {issue.images.length === 0 && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{CATEGORY_EMOJI[issue.category]}</span>
          <span className="text-xs font-medium text-gray-500">
            {getCategoryName(issue.category)}
          </span>
          <StatusBadge status={issue.status} />
        </div>
      )}

      {/* টাইটেল */}
      <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1 line-clamp-2">
        {issue.title}
      </h3>

      {/* ডেসক্রিপশন প্রিভিউ */}
      <p className="text-gray-500 text-xs line-clamp-2 mb-3">
        {issue.description}
      </p>

      {/* প্রোগ্রেস ইন্ডিকেটর (কাজ চলছে) */}
      {isInProgress && (
        <div className="mb-3 bg-purple-50 p-2 rounded-lg">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
            <span className="text-xs font-medium text-purple-700">
              সমাধানের কাজ চলছে...
            </span>
          </div>
          <div className="mt-2 w-full bg-purple-100 rounded-full h-1.5">
            <div className="bg-purple-500 h-full rounded-full w-3/4 animate-pulse" />
          </div>
        </div>
      )}

      {/* ভোট + সময় */}
      <div className="flex items-center justify-between mb-3">
        {/* ভোট বাটন */}
        <button
          onClick={onVote}
          disabled={hasVoted}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            hasVoted
              ? "bg-green-50 text-green-600 cursor-default"
              : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 active:scale-95"
          }`}
          title={hasVoted ? "আপনি ভোট দিয়েছেন" : "সমর্থন জানান"}
        >
          <ChevronUp
            className={`w-3.5 h-3.5 ${hasVoted ? "text-green-500" : ""}`}
          />
          <span>{localVotes}</span>
        </button>

        {/* সময় */}
        <span className="text-xs text-gray-400">{timeText}</span>
      </div>

      {/* লোকেশন */}
      {issue.location.address && (
        <p className="text-xs text-gray-400 mb-3 flex items-start gap-1">
          <span className="mt-0.5">📍</span>
          <span className="line-clamp-1">{issue.location.address}</span>
        </p>
      )}

      {/* ডিটেইলস বাটন */}
      <button
        onClick={onViewDetails}
        className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        বিস্তারিত দেখুন →
      </button>
    </div>
  );
}

// ========== স্ট্যাটাস ব্যাজ (ছোট) ==========
function StatusBadge({ status }: { status: string }) {
  const config: Record<
    string,
    { label: string; className: string; icon: React.ReactNode }
  > = {
    reported: {
      label: "জমা পড়েছে",
      className: "bg-orange-100 text-orange-700",
      icon: <Clock className="w-2.5 h-2.5" />,
    },
    acknowledged: {
      label: "গৃহীত",
      className: "bg-blue-100 text-blue-700",
      icon: <AlertCircle className="w-2.5 h-2.5" />,
    },
    "in-progress": {
      label: "কাজ চলছে",
      className: "bg-purple-100 text-purple-700",
      icon: <Loader2 className="w-2.5 h-2.5 animate-spin" />,
    },
    resolved: {
      label: "সমাধান",
      className: "bg-green-100 text-green-700",
      icon: <CheckCircle2 className="w-2.5 h-2.5" />,
    },
    rejected: {
      label: "বাতিল",
      className: "bg-red-100 text-red-700",
      icon: <XCircle className="w-2.5 h-2.5" />,
    },
  };

  const c = config[status] || config.reported;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${c.className}`}
    >
      {c.icon}
      {c.label}
    </span>
  );
}

// ========== হেল্পার ফাংশন ==========

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    reported: "জমা পড়েছে",
    acknowledged: "গৃহীত হয়েছে",
    "in-progress": "কাজ চলছে",
    resolved: "সমাধান হয়েছে",
    rejected: "গ্রহণযোগ্য নয়",
  };
  return map[status] || status;
}

function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    road: "রাস্তা",
    electricity: "বিদ্যুৎ",
    water: "পানি",
    garbage: "ময়লা",
    drainage: "ড্রেনেজ",
    other: "অন্যান্য",
  };
  return names[category] || category;
}

function timeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMins = Math.floor((now.getTime() - then.getTime()) / 60000);

  if (diffMins < 1) return "এইমাত্র";
  if (diffMins < 60) return `${diffMins} মি. আগে`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ঘ. আগে`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} দিন আগে`;

  return then.toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "short",
  });
}