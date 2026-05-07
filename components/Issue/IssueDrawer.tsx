"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Issue } from "@/types";
import { useIssueStore } from "@/stores/issueStore";
import VotingWidget from "@/components/UI/VotingWidget";
import StatusBadge from "@/components/Issue/StatusBadge";
import {
  X,
  MapPin,
  Calendar,
  MessageCircle,
  Share2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ChevronDown,
  ExternalLink,
  Flag,
  User,
} from "lucide-react";

interface IssueDrawerProps {
  issue: Issue;
  onClose: () => void;
}

export default function IssueDrawer({ issue, onClose }: IssueDrawerProps) {
  const { updateStatus } = useIssueStore();
  const [isVisible, setIsVisible] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [comment, setComment] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // অ্যানিমেশন ট্রিগার
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      clearTimeout(timer);
    };
  }, []);

  // স্ট্যাটাস আপডেট হ্যান্ডলার
  const handleStatusUpdate = async (newStatus: Issue["status"]) => {
    setIsUpdating(true);
    await updateStatus(issue.id, newStatus);
    setShowStatusDropdown(false);
    setIsUpdating(false);
  };

  // শেয়ার হ্যান্ডলার
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: issue.title,
          text: `${issue.title} - ঠিক করাও অ্যাপে দেখুন`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      // Fallback: ক্লিপবোর্ডে কপি
      navigator.clipboard.writeText(`${issue.title}\n${window.location.href}`);
      alert("লিংক কপি করা হয়েছে!");
    }
  };

  // কমেন্ট সাবমিট
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    // এখানে কমেন্ট সেভ করার লজিক যাবে
    setComment("");
  };

  // কীবোর্ড শর্টকাট (Escape দিয়ে বন্ধ)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const isResolved = issue.status === "resolved";
  const isRejected = issue.status === "rejected";

  return (
    <>
      {/* ========== ওভারলে (ব্যাকড্রপ) ========== */}
      <div
        className={`fixed inset-0 bg-black/50 z-[100] transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* ========== ড্রয়ার ========== */}
      <div
        className={`fixed z-[110] bg-white shadow-2xl flex flex-col transition-all duration-300 ease-out
          // মোবাইল: নিচ থেকে
          bottom-0 left-0 right-0 max-h-[90vh] rounded-t-3xl
          // ডেস্কটপ: ডান সাইডবার
          md:top-0 md:right-0 md:left-auto md:bottom-auto md:w-[480px] md:h-full md:rounded-none md:max-h-full
          ${
            isVisible
              ? "translate-y-0 md:translate-x-0"
              : "translate-y-full md:translate-x-full"
          }
        `}
      >
        {/* ========== হ্যান্ডেলবার (মোবাইল) ========== */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* ========== হেডার ========== */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <StatusBadge status={issue.status} size="lg" />

          <div className="flex items-center gap-1">
            {/* শেয়ার বাটন */}
            <button
              onClick={handleShare}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="শেয়ার করুন"
            >
              <Share2 className="w-5 h-5 text-gray-500" />
            </button>

            {/* ক্লোজ বাটন */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* ========== স্ক্রলেবল কন্টেন্ট ========== */}
        <div className="flex-1 overflow-y-auto">
          {/* ইমেজ গ্যালারি */}
          {issue.images.length > 0 && (
            <div className="relative">
              {/* মেইন ইমেজ */}
              <div className="aspect-video bg-gray-100 relative">
                <Image
                  width={100}
                  height={100}
                  src={issue.images[activeImage]}
                  alt={`${issue.title} - ছবি ${activeImage + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* ইমেজ নেভিগেশন ডটস */}
              {issue.images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {issue.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        activeImage === index
                          ? "bg-white w-6"
                          : "bg-white/60 hover:bg-white/80"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* থাম্বনেইল স্ট্রিপ */}
              {issue.images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {issue.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        activeImage === index
                          ? "border-blue-500"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <Image
                        width={64}
                        height={64}
                        src={img}
                        alt={`Thumb ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== কন্টেন্ট বডি ========== */}
          <div className="p-5 space-y-5">
            {/* টাইটেল */}
            <h2 className="text-xl font-bold text-gray-900 leading-tight">
              {issue.title}
            </h2>

            {/* ক্যাটাগরি ট্যাগ */}
            <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium">
              <Flag className="w-4 h-4" />
              {getCategoryName(issue.category)}
            </div>

            {/* বিবরণ */}
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
              {issue.description}
            </p>

            {/* ========== ইনফো গ্রিড ========== */}
            <div className="grid grid-cols-2 gap-3">
              {/* লোকেশন */}
              <div className="bg-gray-50 p-3 rounded-xl">
                <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  লোকেশন
                </div>
                <p className="text-sm font-medium text-gray-700 line-clamp-2">
                  {issue.location.address || "অবস্থান দেখা যাচ্ছে না"}
                </p>
                {issue.location.lat && (
                  <a
                    href={`https://www.google.com/maps?q=${issue.location.lat},${issue.location.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 text-xs mt-1 inline-flex items-center gap-1 hover:underline"
                  >
                    ম্যাপে দেখুন <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* তারিখ */}
              <div className="bg-gray-50 p-3 rounded-xl">
                <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  রিপোর্টের তারিখ
                </div>
                <p className="text-sm font-medium text-gray-700">
                  {formatDate(issue.created_at)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {timeAgo(issue.created_at)}
                </p>
              </div>

              {/* ভোট কাউন্ট */}
              <div className="bg-gray-50 p-3 rounded-xl col-span-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">সমর্থন করেছেন</div>
                      <div className="text-lg font-bold text-gray-900">
                        {issue.votes} জন
                      </div>
                    </div>
                  </div>
                  <VotingWidget issueId={issue.id} votes={issue.votes} />
                </div>
              </div>
            </div>

            {/* ========== স্ট্যাটাস আপডেট (অ্যাডমিন ফিচার) ========== */}
            <div className="border-t pt-4">
              <div className="relative">
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  disabled={isUpdating}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    {isUpdating ? (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    ) : (
                      <RefreshIcon status={issue.status} />
                    )}
                    <span className="text-sm font-medium">
                      স্ট্যাটাস আপডেট করুন
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform ${
                      showStatusDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* ড্রপডাউন */}
                {showStatusDropdown && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border rounded-xl shadow-lg overflow-hidden z-10">
                    {STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleStatusUpdate(option.value)}
                        disabled={issue.status === option.value}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          issue.status === option.value
                            ? "bg-blue-50 text-blue-600"
                            : ""
                        }`}
                      >
                        <span className="text-lg">{option.icon}</span>
                        <div>
                          <div className="font-medium text-sm">
                            {option.label}
                          </div>
                          <div className="text-xs text-gray-400">
                            {option.description}
                          </div>
                        </div>
                        {issue.status === option.value && (
                          <CheckCircle2 className="w-5 h-5 text-blue-500 ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ========== কমেন্ট সেকশন ========== */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <MessageCircle className="w-5 h-5" />
                মন্তব্য ({issue.comments?.length || 0})
              </h3>

              {/* কমেন্ট লিস্ট */}
              {issue.comments && issue.comments.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {issue.comments.map((comment, index) => (
                    <CommentBubble
                      key={comment.id || index}
                      comment={comment}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">এখনো কোনো মন্তব্য নেই</p>
                  <p className="text-xs">প্রথম মন্তব্য করুন</p>
                </div>
              )}

              {/* কমেন্ট ফর্ম */}
              <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="মন্তব্য লিখুন..."
                  className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="submit"
                  disabled={!comment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  পাঠান
                </button>
              </form>
            </div>

          </div>
        </div>

        {/* ========== ফুটার অ্যাকশন (মোবাইল) ========== */}
        <div className="md:hidden border-t p-4 pb-safe">
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              শেয়ার
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
        <div className="md:hidden border-t p-4 pb-safe">
            <div className="flex gap-3">
                <Link
                href={`/issues/${issue.id}`}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                <ExternalLink className="w-4 h-4" />
                সম্পূর্ণ পৃষ্ঠা দেখুন
                </Link>
            </div>
</div>
      </div>
    </>
  );
}

// ==================== হেল্পার কম্পোনেন্টস ====================

// স্ট্যাটাস রিফ্রেশ আইকন
function RefreshIcon({ status }: { status: string }) {
  switch (status) {
    case "reported":
      return <Clock className="w-5 h-5 text-orange-500" />;
    case "acknowledged":
      return <AlertCircle className="w-5 h-5 text-blue-500" />;
    case "in-progress":
      return <Loader2 className="w-5 h-5 text-purple-500" />;
    case "resolved":
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    default:
      return <Clock className="w-5 h-5 text-gray-400" />;
  }
}

// কমেন্ট বাবল
function CommentBubble({
  comment,
}: {
  comment: {
    text: string;
    isOfficial?: boolean;
    created_at?: Date;
    id?: string;
  };
}) {
  const isOfficial = comment.isOfficial;

  return (
    <div
      className={`flex gap-3 ${isOfficial ? "flex-row" : "flex-row-reverse"}`}
    >
      {/* অ্যাভাটার */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isOfficial ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
        }`}
      >
        <User className="w-4 h-4" />
      </div>

      {/* মেসেজ */}
      <div
        className={`max-w-[80%] p-3 rounded-2xl text-sm ${
          isOfficial
            ? "bg-blue-50 text-gray-800 rounded-tl-none"
            : "bg-gray-100 text-gray-800 rounded-tr-none"
        }`}
      >
        <p>{comment.text}</p>
        {comment.created_at && (
          <p className="text-xs text-gray-400 mt-1">
            {timeAgo(comment.created_at)}
          </p>
        )}
      </div>
    </div>
  );
}

// ==================== কনস্ট্যান্টস ====================

const STATUS_OPTIONS = [
  {
    value: "reported" as const,
    label: "জমা পড়েছে",
    icon: "📩",
    description: "সমস্যাটি জমা পড়েছে, এখনো দেখা হয়নি",
  },
  {
    value: "acknowledged" as const,
    label: "গৃহীত হয়েছে",
    icon: "👀",
    description: "কর্তৃপক্ষ সমস্যাটি দেখেছেন",
  },
  {
    value: "in-progress" as const,
    label: "কাজ চলছে",
    icon: "🔧",
    description: "সমস্যা সমাধানের কাজ চলছে",
  },
  {
    value: "resolved" as const,
    label: "সমাধান হয়েছে",
    icon: "✅",
    description: "সমস্যাটি সমাধান করা হয়েছে",
  },
  {
    value: "rejected" as const,
    label: "গ্রহণযোগ্য নয়",
    icon: "❌",
    description: "সমস্যাটি গ্রহণযোগ্য নয়",
  },
];

// ==================== হেল্পার ফাংশন ====================

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

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("bn-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function timeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 1) return "এইমাত্র";
  if (diffMins < 60) return `${diffMins} মিনিট আগে`;
  if (diffHours < 24) return `${diffHours} ঘণ্টা আগে`;
  if (diffDays < 7) return `${diffDays} দিন আগে`;
  if (diffWeeks < 4) return `${diffWeeks} সপ্তাহ আগে`;

  return formatDate(date);
}
