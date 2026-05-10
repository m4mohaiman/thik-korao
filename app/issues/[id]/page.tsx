"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useIssueStore } from "@/stores/issueStore";
import { useAuthStore } from "@/stores/authStore";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
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
  User,
  RefreshCw,
  ChevronUp,
  Send,
  ChevronLeft,
  ChevronRight,
  Shield,
  Eye,
  ThumbsUp,
} from "lucide-react";

// ========== স্ট্যাটাস কনফিগ ==========
const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string; description: string }> = {
  reported: {
    label: "জমা পড়েছে",
    icon: Clock,
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-200",
    description: "কর্তৃপক্ষের দৃষ্টি আকর্ষণের অপেক্ষায়",
  },
  acknowledged: {
    label: "গৃহীত হয়েছে",
    icon: AlertCircle,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
    description: "সমস্যাটি গুরুত্বের সাথে দেখা হয়েছে",
  },
  "in-progress": {
    label: "কাজ চলছে",
    icon: Loader2,
    color: "text-purple-600",
    bg: "bg-purple-50 border-purple-200",
    description: "দ্রুত সমাধানের চেষ্টা করা হচ্ছে",
  },
  resolved: {
    label: "সমাধান হয়েছে",
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50 border-green-200",
    description: "সমস্যাটি সফলভাবে সমাধান করা হয়েছে",
  },
  rejected: {
    label: "গ্রহণযোগ্য নয়",
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    description: "দুঃখিত, এই সমস্যাটি গ্রহণযোগ্য নয়",
  },
};

// ========== ক্যাটাগরি কনফিগ ==========
const CATEGORY_CONFIG: Record<string, { label: string; icon: string }> = {
  road: { label: "রাস্তা", icon: "🛣️" },
  electricity: { label: "বিদ্যুৎ", icon: "💡" },
  water: { label: "পানি", icon: "💧" },
  garbage: { label: "ময়লা", icon: "🗑️" },
  drainage: { label: "ড্রেনেজ", icon: "🌊" },
  other: { label: "অন্যান্য", icon: "📌" },
};

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const { selectedIssue, fetchIssueById, voteIssue, updateStatus } = useIssueStore();
  const user = useAuthStore((state) => state.user);
  const isAdmin = useAuthStore((state) => state.isAdmin);

  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [comment, setComment] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [comments, setComments] = useState<any[]>([]);

  const [showAllImages, setShowAllImages] = useState(false);

  const issue = selectedIssue;

  const localVotes = issue?.votes || 0;
  const hasVoted = user ? (issue?.voted_by?.includes(user.id) || false) : false;

  // ========== ফেচ ইস্যু ==========
  useEffect(() => {
    const loadIssue = async () => {
      setIsLoading(true);
      await fetchIssueById(params.id as string);

      // কমেন্ট ফেচ
      const { data: commentData } = await supabase
        .from("comments")
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq("issue_id", params.id)
        .order("created_at", { ascending: true });

      setComments(commentData || []);
      setIsLoading(false);
    };

    loadIssue();
  }, [params.id]);



  // ========== ভোট ==========
const handleVote = async () => {
  if (!issue || !user) {
    router.push("/auth/login?next=/issues/" + params.id);
    return;
  }
  if (hasVoted) return;
  await voteIssue(issue.id, user.id);
};

  // ========== স্ট্যাটাস আপডেট ==========
  const handleStatusUpdate = async (newStatus: string) => {
    if (!issue) return;
    setIsUpdating(true);
    await updateStatus(issue.id, newStatus as any);
    setIsUpdating(false);
  };

  // ========== শেয়ার ==========
  const handleShare = async () => {
    if (!issue) return;
    const shareData = {
      title: issue.title,
      text: `📍 ${issue.title}\n— ঠিক করাও অ্যাপে দেখুন`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert("🔗 লিংক কপি করা হয়েছে!");
    }
  };

  // ========== কমেন্ট সাবমিট ==========
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !user) return;

    setIsCommentSubmitting(true);

    const { data, error } = await supabase
      .from("comments")
      .insert({
        issue_id: params.id as string,
        user_id: user.id,
        text: comment.trim(),
        is_official: isAdmin,
      })
      .select(`
        *,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `)
      .single();

    if (!error && data) {
      setComments((prev) => [...prev, data]);
    }

    setComment("");
    setIsCommentSubmitting(false);
  };

  // ========== কীবোর্ড নেভিগেশন ==========
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && issue?.images?.length) {
        setActiveImage((prev) => (prev === 0 ? issue.images.length - 1 : prev - 1));
      }
      if (e.key === "ArrowRight" && issue?.images?.length) {
        setActiveImage((prev) => (prev === issue.images.length - 1 ? 0 : prev + 1));
      }
      if (e.key === "Escape") router.back();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [issue, router]);

  // ========== লোডিং ==========
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <RefreshCw className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-gray-500">ইস্যু লোড হচ্ছে...</p>
      </div>
    );
  }

  // ========== নট ফাউন্ড ==========
  if (!issue) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <div className="text-7xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">সমস্যা পাওয়া যায়নি</h1>
        <p className="text-gray-500 mb-6">এই সমস্যাটি মুছে ফেলা হয়েছে অথবা লিংকটি ভুল</p>
        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="px-5 py-3 border-2 border-gray-200 rounded-full font-medium"
          >
            ← ফিরে যান
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium"
          >
            হোমে যান
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_CONFIG[issue.status] || STATUS_CONFIG.reported;
  const StatusIcon = statusInfo.icon;
  const categoryInfo = CATEGORY_CONFIG[issue.category] || CATEGORY_CONFIG.other;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* ========== হেডার ========== */}
      <header className="bg-white/95 backdrop-blur border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="font-semibold text-gray-900 text-sm sm:text-base truncate max-w-[50%]">
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

      <div className="max-w-4xl mx-auto">
        {/* ========== ইমেজ গ্যালারি ========== */}
        {issue.images.length > 0 && (
          <div className="relative bg-black">
            {/* মেইন ইমেজ */}
            <div className="relative aspect-video sm:aspect-[21/9] max-h-[500px]">
              <Image
                src={issue.images[activeImage]}
                alt={`${issue.title} - ছবি ${activeImage + 1}`}
                fill
                className="object-contain"
                priority
              />

              {/* নেভিগেশন এরো */}
              {issue.images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setActiveImage((prev) =>
                        prev === 0 ? issue.images.length - 1 : prev - 1
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() =>
                      setActiveImage((prev) =>
                        prev === issue.images.length - 1 ? 0 : prev + 1
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* ইমেজ কাউন্টার */}
              <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
                {activeImage + 1} / {issue.images.length}
              </div>
            </div>

            {/* থাম্বনেইল স্ট্রিপ */}
            {issue.images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto bg-gray-900">
                {issue.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      activeImage === index
                        ? "border-blue-400 opacity-100"
                        : "border-transparent opacity-50 hover:opacity-80"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`থাম্বনেইল ${index + 1}`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="p-4 sm:p-6 space-y-5">
          {/* ========== স্ট্যাটাস ব্যানার ========== */}
          <div className={`flex items-center gap-4 p-4 rounded-2xl border ${statusInfo.bg}`}>
            <StatusIcon className={`w-6 h-6 ${statusInfo.color} ${issue.status === "in-progress" ? "animate-spin" : ""}`} />
            <div>
              <p className={`font-bold ${statusInfo.color}`}>{statusInfo.label}</p>
              <p className="text-sm opacity-80">{statusInfo.description}</p>
            </div>
          </div>

          {/* ========== টাইটেল ও ক্যাটাগরি ========== */}
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full">
                <span>{categoryInfo.icon}</span>
                {categoryInfo.label}
              </span>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                  <Shield className="w-3 h-3" />
                  অ্যাডমিন ভিউ
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
              {issue.title}
            </h1>
          </div>

          {/* ========== বিবরণ ========== */}
          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
              {issue.description}
            </p>
          </div>

          {/* ========== ইনফো কার্ড ========== */}
          <div className="grid grid-cols-2 gap-3">
            {/* লোকেশন */}
            <div className="bg-white p-4 rounded-2xl shadow-sm col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1.5">
                <MapPin className="w-4 h-4" />
                লোকেশন
              </div>
              <p className="text-sm font-medium text-gray-900 line-clamp-2">
                {issue.location?.address || "অনির্ধারিত"}
              </p>
              {issue.location?.lat && (
                <a
                  href={`https://www.google.com/maps?q=${issue.location.lat},${issue.location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-500 text-xs mt-1.5 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  Google Maps-এ দেখুন
                </a>
              )}
            </div>

            {/* তারিখ */}
            <div className="bg-white p-4 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1.5">
                <Calendar className="w-4 h-4" />
                রিপোর্টের তারিখ
              </div>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(issue.created_at)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{timeAgo(issue.created_at)}</p>
            </div>

            {/* রিপোর্টার */}
            <div className="bg-white p-4 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1.5">
                <User className="w-4 h-4" />
                রিপোর্ট করেছেন
              </div>
              <p className="text-sm font-medium text-gray-900">
                {issue.profiles?.full_name || "অজানা ইউজার"}
              </p>
            </div>

            {/* ভিউ কাউন্ট (ডামি) */}
            <div className="bg-white p-4 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1.5">
                <Eye className="w-4 h-4" />
                সর্বশেষ আপডেট
              </div>
              <p className="text-sm font-medium text-gray-900">
                {timeAgo(issue.updated_at)}
              </p>
            </div>
          </div>

          {/* ========== ভোটিং সেকশন ========== */}
          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900">{localVotes}</div>
                <div className="text-sm text-gray-500">জন সমর্থন করেছেন</div>
                {hasVoted && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    আপনি সমর্থন করেছেন
                  </p>
                )}
              </div>
              <button
                onClick={handleVote}
                disabled={hasVoted || !user}
                className={`px-6 py-3.5 rounded-full font-bold text-lg transition-all flex items-center gap-2 ${
                  hasVoted
                    ? "bg-green-100 text-green-600 cursor-default"
                    : !user
                    ? "bg-gray-100 text-gray-400"
                    : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-200"
                }`}
                title={!user ? "ভোট দিতে লগইন করুন" : hasVoted ? "আপনি ভোট দিয়েছেন" : "সমর্থন জানান"}
              >
                {hasVoted ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    সমর্থন করেছেন
                  </>
                ) : (
                  <>
                    <ChevronUp className="w-5 h-5" />
                    সমর্থন জানান
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ========== অ্যাডমিন: স্ট্যাটাস আপডেট ========== */}
          {isAdmin && (
            <div className="bg-white p-5 rounded-2xl shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-500" />
                স্ট্যাটাস আপডেট (অ্যাডমিন)
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(STATUS_CONFIG).map(([key, val]) => {
                  const Icon = val.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => handleStatusUpdate(key)}
                      disabled={issue.status === key || isUpdating}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        issue.status === key
                          ? `${val.bg} ${val.color} border-2`
                          : "bg-gray-50 text-gray-500 hover:bg-gray-100 border-2 border-transparent"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isUpdating && issue.status !== key ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Icon className={`w-4 h-4 ${issue.status === "in-progress" && key === "in-progress" ? "animate-spin" : ""}`} />
                      )}
                      {val.label}
                      {issue.status === key && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========== কমেন্ট সেকশন ========== */}
          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-500" />
              মন্তব্য
              {comments.length > 0 && (
                <span className="text-sm font-normal text-gray-400">
                  ({comments.length})
                </span>
              )}
            </h3>

            {/* কমেন্ট লিস্ট */}
            {comments.length > 0 ? (
              <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className={`flex gap-3 ${
                      c.is_official ? "bg-blue-50/50 -mx-3 px-3 py-3 rounded-xl" : ""
                    }`}
                  >
                    {/* অ্যাভাটার */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                        c.is_official
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {c.profiles?.avatar_url ? (
                        <Image
                          src={c.profiles.avatar_url}
                          alt="avatar"
                          width={36}
                          height={36}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        (c.profiles?.full_name || "U").charAt(0).toUpperCase()
                      )}
                    </div>

                    {/* কমেন্ট বডি */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-gray-900">
                          {c.profiles?.full_name || "ইউজার"}
                        </span>
                        {c.is_official && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                            <Shield className="w-3 h-3" />
                            অফিশিয়াল
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {timeAgo(c.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm mt-1 whitespace-pre-wrap">
                        {c.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 mb-4">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">এখনো কোনো মন্তব্য নেই</p>
                <p className="text-xs">প্রথম মন্তব্যকারী হোন</p>
              </div>
            )}

            {/* কমেন্ট ফর্ম */}
            {user ? (
              <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={
                      isAdmin
                        ? "অফিশিয়াল মন্তব্য লিখুন..."
                        : "আপনার মন্তব্য লিখুন..."
                    }
                    maxLength={500}
                    className="w-full p-3.5 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    {comment.length}/500
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={!comment.trim() || isCommentSubmitting}
                  className="px-5 py-3.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                >
                  {isCommentSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">পাঠান</span>
                </button>
              </form>
            ) : (
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-2">
                  মন্তব্য করতে লগইন প্রয়োজন
                </p>
                <Link
                  href={`/auth/login?next=/issues/${params.id}`}
                  className="inline-flex items-center gap-1.5 text-blue-600 text-sm font-medium hover:underline"
                >
                  <User className="w-4 h-4" />
                  লগইন করুন
                </Link>
              </div>
            )}
          </div>

          {/* ========== ফুটার অ্যাকশন ========== */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => router.back()}
              className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ← ফিরে যান
            </button>
            <Link
              href="/"
              className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-medium text-center hover:bg-gray-800 transition-colors"
            >
              হোমে যান
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== হেল্পার ==========
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("bn-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function timeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "এইমাত্র";
  if (diffMins < 60) return `${diffMins} মিনিট আগে`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ঘণ্টা আগে`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} দিন আগে`;

  return formatDate(date);
}