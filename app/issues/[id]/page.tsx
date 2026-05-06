"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useIssueStore } from "@/stores/issueStore";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  XCircle,
  Share2,
  ExternalLink,
  MessageCircle,
  Flag,
  ChevronRight,
  User,
  RefreshCw,
} from "lucide-react";

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { issues, loadIssues, updateStatus, voteIssue } = useIssueStore();
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [comment, setComment] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const issue = issues.find((i) => i.id === params.id);

  useEffect(() => {
    const fetchData = async () => {
      if (issues.length === 0) {
        await loadIssues();
      }
      setIsLoading(false);
    };
    fetchData();
  }, [params.id, loadIssues, issues.length]);

  // স্ট্যাটাস আপডেট
  const handleStatusUpdate = async (newStatus: string) => {
    if (!issue) return;
    setIsUpdating(true);
    await updateStatus(issue.id, newStatus as any);
    setIsUpdating(false);
  };

  // ভোট
  const handleVote = async () => {
    if (!issue) return;
    const deviceId = localStorage.getItem("deviceId") || "anonymous";
    if (issue.votedBy.includes(deviceId)) return;
    await voteIssue(issue.id, deviceId);
  };

  // শেয়ার
  const handleShare = async () => {
    if (!issue) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: issue.title,
          text: `${issue.title} - ঠিক করাও`,
          url: window.location.href,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("লিংক কপি করা হয়েছে!");
    }
  };

  // কমেন্ট
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    // কমেন্ট সেভ লজিক
    setComment("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          সমস্যা পাওয়া যায়নি
        </h1>
        <p className="text-gray-500 mb-6">
          এই সমস্যাটি মুছে ফেলা হয়েছে অথবা লিংকটি ভুল
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700"
        >
          হোমে ফিরে যান
        </Link>
      </div>
    );
  }

  const deviceId = localStorage.getItem("deviceId") || "anonymous";
  const hasVoted = issue.votedBy.includes(deviceId);
  const isResolved = issue.status === "resolved";
  const isRejected = issue.status === "rejected";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ========== হেডার ========== */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="font-semibold text-gray-900 truncate max-w-[60%]">
            ইস্যু ডিটেইল
          </h1>
          <button
            onClick={handleShare}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto">
        {/* ========== ইমেজ গ্যালারি ========== */}
        {issue.images.length > 0 && (
          <div className="relative bg-black">
            <Image
              width={100}
              height={100}
              src={issue.images[activeImage]}
              alt={issue.title}
              className="w-full aspect-video object-cover max-h-[400px]"
            />
            {issue.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {issue.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      activeImage === i
                        ? "bg-white w-8"
                        : "bg-white/50 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== কন্টেন্ট ========== */}
        <div className="p-5 space-y-6">
          {/* স্ট্যাটাস ব্যানার */}
          <StatusBanner status={issue.status} />

          {/* টাইটেল ও ক্যাটাগরি */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">
                {getCategoryIcon(issue.category)}
              </span>
              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                {getCategoryName(issue.category)}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">
              {issue.title}
            </h2>
          </div>

          {/* বিবরণ */}
          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {issue.description} Hello
            </p>
          </div>

          {/* ইনফো কার্ড */}
          <div className="grid grid-cols-2 gap-3">
            <InfoCard
              icon={<MapPin className="w-5 h-5" />}
              label="লোকেশন"
              value={issue.location.address || "অনির্ধারিত"}
              action={
                <a
                  href={`https://www.google.com/maps?q=${issue.location.lat},${issue.location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 text-xs flex items-center gap-1 hover:underline mt-1"
                >
                  ম্যাপে দেখুন <ExternalLink className="w-3 h-3" />
                </a>
              }
            />
            <InfoCard
              icon={<Calendar className="w-5 h-5" />}
              label="রিপোর্টের তারিখ"
              value={new Date(issue.createdAt).toLocaleDateString("bn-BD", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
            <InfoCard
              icon={<User className="w-5 h-5" />}
              label="রিপোর্ট করেছেন"
              value={shortId(issue.createdBy)}
            />
            <InfoCard
              icon={<Calendar className="w-5 h-5" />}
              label="সর্বশেষ আপডেট"
              value={timeAgo(issue.updatedAt)}
            />
          </div>

          {/* ভোটিং সেকশন */}
          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {issue.votes}
                </div>
                <div className="text-sm text-gray-500">জন সমর্থন করেছেন</div>
              </div>
              <button
                onClick={handleVote}
                disabled={hasVoted}
                className={`px-6 py-3 rounded-full font-bold text-lg transition-all ${
                  hasVoted
                    ? "bg-green-100 text-green-600 cursor-default"
                    : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-200"
                }`}
              >
                {hasVoted ? "✅ সমর্থন করেছেন" : "👍 সমর্থন জানান"}
              </button>
            </div>
          </div>

          {/* স্ট্যাটাস আপডেট (এডমিন) */}
          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">
              স্ট্যাটাস আপডেট
            </h3>
            <div className="flex flex-wrap gap-2">
              {STATUS_STEPS.map((step) => (
                <button
                  key={step.value}
                  onClick={() => handleStatusUpdate(step.value)}
                  disabled={issue.status === step.value || isUpdating}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    issue.status === step.value
                      ? step.activeClass
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isUpdating && issue.status !== step.value ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>{step.icon}</span>
                  )}
                  {step.label}
                  {issue.status === step.value && (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* কমেন্ট সেকশন */}
          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              মন্তব্য ({issue.comments?.length || 0})
            </h3>

            {/* কমেন্ট লিস্ট */}
            <div className="space-y-4 mb-6">
              {issue.comments && issue.comments.length > 0 ? (
                issue.comments.map((c, i) => (
                  <div
                    key={c.id || i}
                    className={`flex gap-3 ${
                      c.isOfficial ? "" : "flex-row-reverse"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        c.isOfficial
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <User className="w-4 h-4" />
                    </div>
                    <div
                      className={`max-w-[75%] p-3 rounded-2xl ${
                        c.isOfficial
                          ? "bg-blue-50 rounded-tl-none"
                          : "bg-gray-100 rounded-tr-none"
                      }`}
                    >
                      <p className="text-sm text-gray-800">{c.text}</p>
                      {c.createdAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          {timeAgo(c.createdAt)}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 py-4">
                  এখনো কোনো মন্তব্য নেই
                </p>
              )}
            </div>

            {/* কমেন্ট ফর্ম */}
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="আপনার মন্তব্য লিখুন..."
                className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
              />
              <button
                type="submit"
                disabled={!comment.trim()}
                className="px-5 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                পাঠান
              </button>
            </form>
          </div>

          {/* ব্যাক বাটন */}
          <div className="pb-8">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              হোমে ফিরে যান
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ======================== সাব-কম্পোনেন্ট ========================

function StatusBanner({ status }: { status: string }) {
  const config: Record<
    string,
    {
      icon: React.ReactNode;
      label: string;
      description: string;
      className: string;
    }
  > = {
    reported: {
      icon: <Clock className="w-6 h-6" />,
      label: "সমস্যা জমা পড়েছে",
      description: "কর্তৃপক্ষের দৃষ্টি আকর্ষণের অপেক্ষায়",
      className: "bg-orange-50 border-orange-200 text-orange-800",
    },
    acknowledged: {
      icon: <AlertCircle className="w-6 h-6" />,
      label: "কর্তৃপক্ষ অবগত",
      description: "সমস্যাটি গুরুত্বের সাথে দেখা হয়েছে",
      className: "bg-blue-50 border-blue-200 text-blue-800",
    },
    "in-progress": {
      icon: <Loader2 className="w-6 h-6 animate-spin" />,
      label: "সমাধানের কাজ চলছে",
      description: "দ্রুত সমাধানের চেষ্টা করা হচ্ছে",
      className: "bg-purple-50 border-purple-200 text-purple-800",
    },
    resolved: {
      icon: <CheckCircle2 className="w-6 h-6" />,
      label: "সমাধান হয়েছে",
      description: "সমস্যাটি সফলভাবে সমাধান করা হয়েছে",
      className: "bg-green-50 border-green-200 text-green-800",
    },
    rejected: {
      icon: <XCircle className="w-6 h-6" />,
      label: "গ্রহণযোগ্য নয়",
      description: "দুঃখিত, এই সমস্যাটি গ্রহণযোগ্য নয়",
      className: "bg-red-50 border-red-200 text-red-800",
    },
  };

  const c = config[status] || config.reported;

  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border ${c.className}`}>
      {c.icon}
      <div>
        <div className="font-bold">{c.label}</div>
        <div className="text-sm opacity-80">{c.description}</div>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm">
      <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
        {icon}
        {label}
      </div>
      <p className="text-sm font-medium text-gray-900">{value}</p>
      {action}
    </div>
  );
}

// ======================== কনস্ট্যান্টস ========================

const STATUS_STEPS = [
  {
    value: "reported",
    label: "জমা পড়েছে",
    icon: "📩",
    activeClass: "bg-orange-100 text-orange-700 border-2 border-orange-300",
  },
  {
    value: "acknowledged",
    label: "গৃহীত",
    icon: "👀",
    activeClass: "bg-blue-100 text-blue-700 border-2 border-blue-300",
  },
  {
    value: "in-progress",
    label: "কাজ চলছে",
    icon: "🔧",
    activeClass: "bg-purple-100 text-purple-700 border-2 border-purple-300",
  },
  {
    value: "resolved",
    label: "সমাধান",
    icon: "✅",
    activeClass: "bg-green-100 text-green-700 border-2 border-green-300",
  },
  {
    value: "rejected",
    label: "বাতিল",
    icon: "❌",
    activeClass: "bg-red-100 text-red-700 border-2 border-red-300",
  },
];

// ======================== হেল্পার ========================

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

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    road: "🛣️",
    electricity: "💡",
    water: "💧",
    garbage: "🗑️",
    drainage: "🌊",
    other: "📌",
  };
  return icons[category] || "📌";
}

function timeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMins = Math.floor((now.getTime() - then.getTime()) / 60000);

  if (diffMins < 1) return "এইমাত্র";
  if (diffMins < 60) return `${diffMins} মিনিট আগে`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ঘণ্টা আগে`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} দিন আগে`;
  return new Date(date).toLocaleDateString("bn-BD");
}

function shortId(id: string): string {
  return id.slice(0, 8) + "...";
}