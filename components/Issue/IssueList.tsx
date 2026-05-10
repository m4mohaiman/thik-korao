"use client";

import { useRouter } from "next/navigation";
import { Issue } from "@/stores/issueStore";
import Image from "next/image";
import {
  MapPin,
  Calendar,
  ChevronUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  XCircle,
  ThumbsUp,
  Eye,
} from "lucide-react";

// ========== স্ট্যাটাস ==========
const STATUS_CONFIG: Record<
  string,
  { label: string; icon: any; className: string }
> = {
  reported: {
    label: "জমা",
    icon: Clock,
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
  acknowledged: {
    label: "গৃহীত",
    icon: AlertCircle,
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  "in-progress": {
    label: "চলছে",
    icon: Loader2,
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
  resolved: {
    label: "সমাধান",
    icon: CheckCircle2,
    className: "bg-green-50 text-green-700 border-green-200",
  },
  rejected: {
    label: "বাতিল",
    icon: XCircle,
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

// ========== ক্যাটাগরি ==========
const CATEGORY_CONFIG: Record<string, { label: string; icon: string }> = {
  road: { label: "রাস্তা", icon: "🛣️" },
  electricity: { label: "বিদ্যুৎ", icon: "💡" },
  water: { label: "পানি", icon: "💧" },
  garbage: { label: "ময়লা", icon: "🗑️" },
  drainage: { label: "ড্রেনেজ", icon: "🌊" },
  other: { label: "অন্যান্য", icon: "📌" },
};

interface IssueListProps {
  issues: Issue[];
  layout?: "list" | "grid";
  isLoading?: boolean;
  emptyMessage?: string;
  emptySubMessage?: string;
  emptyActionLabel?: string;
  emptyActionHref?: string;
}

export default function IssueList({
  issues,
  layout = "list",
  isLoading = false,
  emptyMessage = "কোনো সমস্যা রিপোর্ট করা হয়নি",
  emptySubMessage = "প্রথম রিপোর্টকারী হোন!",
  emptyActionLabel = "রিপোর্ট করুন",
  emptyActionHref = "/report",
}: IssueListProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-gray-500">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <MapPin className="w-10 h-10 text-gray-300" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-1">
          {emptyMessage}
        </h3>
        <p className="text-gray-400 text-sm mb-6 max-w-sm">{emptySubMessage}</p>
        {emptyActionHref && emptyActionLabel && (
          <button
            onClick={() => router.push(emptyActionHref)}
            className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            {emptyActionLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={
        layout === "grid"
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          : "space-y-3"
      }
    >
      {issues.map((issue) =>
        layout === "grid" ? (
          <IssueGridCard key={issue.id} issue={issue} />
        ) : (
          <IssueListItem key={issue.id} issue={issue} />
        ),
      )}
    </div>
  );
}

// ==================== লিস্ট ভিউ ====================
function IssueListItem({ issue }: { issue: Issue }) {
  const router = useRouter();
  const status = STATUS_CONFIG[issue.status] || STATUS_CONFIG.reported;
  const category = CATEGORY_CONFIG[issue.category] || CATEGORY_CONFIG.other;
  const StatusIcon = status.icon;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-blue-200 transition-all group">
      <div className="flex gap-4">
        {/* ক্যাটাগরি ইমোজি */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl">
            {category.icon}
          </div>
        </div>

        {/* কন্টেন্ট */}
        <div className="flex-1 min-w-0">
          {/* টাইটেল — ক্লিক করলে ডিটেইলস */}
          <h3
            onClick={() => router.push(`/issues/${issue.id}`)}
            className="font-semibold text-gray-900 line-clamp-1 cursor-pointer hover:text-blue-600 transition-colors"
          >
            {issue.title}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-2 mt-1">
            {issue.description}
          </p>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${status.className}`}
            >
              <StatusIcon
                className={`w-3 h-3 ${issue.status === "in-progress" ? "animate-spin" : ""}`}
              />
              {status.label}
            </span>
            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {category.label}
            </span>
            {issue.location?.address && (
              <span className="text-[10px] text-gray-400 flex items-center gap-0.5 truncate max-w-[150px]">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{issue.location.address}</span>
              </span>
            )}
            <span className="text-[10px] text-gray-400 flex items-center gap-0.5 ml-auto">
              <Calendar className="w-3 h-3" />
              {timeAgo(issue.created_at)}
            </span>
          </div>
        </div>

        {/* ========== ভোট + ডিটেইলস (ডান পাশ) ========== */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center gap-2">
          {/* ভোট — কালারফুল */}
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                issue.votes > 10
                  ? "bg-red-50"
                  : issue.votes > 5
                    ? "bg-orange-50"
                    : issue.votes > 0
                      ? "bg-blue-50"
                      : "bg-gray-50"
              }`}
            >
              <ThumbsUp
                className={`w-5 h-5 ${
                  issue.votes > 10
                    ? "text-red-500 fill-red-500"
                    : issue.votes > 5
                      ? "text-orange-500 fill-orange-500"
                      : issue.votes > 0
                        ? "text-blue-500 fill-blue-500"
                        : "text-gray-400"
                }`}
              />
            </div>
            <span
              className={`text-xs font-bold mt-0.5 ${
                issue.votes > 10
                  ? "text-red-600"
                  : issue.votes > 5
                    ? "text-orange-600"
                    : issue.votes > 0
                      ? "text-blue-600"
                      : "text-gray-400"
              }`}
            >
              {issue.votes}
            </span>
          </div>

          {/* ডিটেইলস বাটন */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/issues/${issue.id}`);
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-full hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>দেখুন</span>
          </button>
        </div>
      </div>

      {/* ইমেজ প্রিভিউ */}
      {issue.images.length > 0 && (
        <div
          className="flex gap-2 mt-3 overflow-x-auto cursor-pointer"
          onClick={() => router.push(`/issues/${issue.id}`)}
        >
          {issue.images.slice(0, 3).map((img, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100"
            >
              <Image
                width={100}
                height={100}
                src={img}
                alt={`ছবি ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {issue.images.length > 3 && (
            <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-sm text-gray-400 font-medium">
              +{issue.images.length - 3}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==================== গ্রিড ভিউ ====================
function IssueGridCard({ issue }: { issue: Issue }) {
  const router = useRouter();
  const status = STATUS_CONFIG[issue.status] || STATUS_CONFIG.reported;
  const category = CATEGORY_CONFIG[issue.category] || CATEGORY_CONFIG.other;
  const StatusIcon = status.icon;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-blue-200 transition-all group">
      {/* ইমেজ */}
      {issue.images.length > 0 ? (
        <div
          className="aspect-video relative overflow-hidden cursor-pointer"
          onClick={() => router.push(`/issues/${issue.id}`)}
        >
          <img
            src={issue.images[0]}
            alt={issue.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 left-2 flex gap-1.5">
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${status.className}`}
            >
              {status.label}
            </span>
          </div>
          {issue.images.length > 1 && (
            <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
              +{issue.images.length - 1}
            </span>
          )}
        </div>
      ) : (
        <div
          className="aspect-video bg-gray-50 flex items-center justify-center text-4xl cursor-pointer"
          onClick={() => router.push(`/issues/${issue.id}`)}
        >
          {category.icon}
        </div>
      )}

      {/* কন্টেন্ট */}
      <div className="p-3">
        <h3
          onClick={() => router.push(`/issues/${issue.id}`)}
          className="font-semibold text-gray-900 text-sm line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
        >
          {issue.title}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-2 mt-1">
          {issue.description}
        </p>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {issue.images.length === 0 && (
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${status.className}`}
              >
                <StatusIcon
                  className={`w-2.5 h-2.5 ${issue.status === "in-progress" ? "animate-spin" : ""}`}
                />
                {status.label}
              </span>
            )}
            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
              {category.label}
            </span>
          </div>

          {/* ভোট — কালারফুল */}
          <div className="flex items-center gap-0.5">
            <ThumbsUp
              className={`w-3.5 h-3.5 ${
                issue.votes > 10
                  ? "text-red-500 fill-red-500"
                  : issue.votes > 5
                    ? "text-orange-500 fill-orange-500"
                    : issue.votes > 0
                      ? "text-blue-500 fill-blue-500"
                      : "text-gray-400"
              }`}
            />
            <span
              className={`text-xs font-bold ${
                issue.votes > 10
                  ? "text-red-600"
                  : issue.votes > 5
                    ? "text-orange-600"
                    : "text-blue-600"
              }`}
            >
              {issue.votes}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t">
          {issue.location?.address && (
            <span className="text-[10px] text-gray-400 flex items-center gap-0.5 truncate max-w-[60%]">
              <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="truncate">{issue.location.address}</span>
            </span>
          )}
          <span className="text-[10px] text-gray-400 ml-auto">
            {timeAgo(issue.created_at)}
          </span>
        </div>

        {/* ========== ডিটেইলস বাটন (গ্রিড) ========== */}
        <button
          onClick={() => router.push(`/issues/${issue.id}`)}
          className="w-full mt-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
        >
          <Eye className="w-3.5 h-3.5" />
          বিস্তারিত দেখুন
        </button>
      </div>
    </div>
  );
}

// ========== হেল্পার ==========
function timeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMins = Math.floor((now.getTime() - then.getTime()) / 60000);

  if (diffMins < 1) return "এইমাত্র";
  if (diffMins < 60) return `${diffMins} মি. আগে`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ঘ. আগে`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} দিন আগে`;

  return new Date(date).toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "short",
  });
}