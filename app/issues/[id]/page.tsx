"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useIssueStore } from "@/stores/issueStore";
import { useAuthStore } from "@/stores/authStore";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
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
} from "lucide-react";

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
  const [comments, setComments] = useState<any[]>([]);

  const issue = selectedIssue;

  // ফেচ ইস্যু
  useEffect(() => {
    const loadIssue = async () => {
      setIsLoading(true);
      await fetchIssueById(params.id as string);
      
      // কমেন্ট আলাদা করে ফেচ
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
  }, [params.id, fetchIssueById]);

  // ভোট
  const handleVote = async () => {
    if (!issue || !user) {
      router.push("/auth/login");
      return;
    }
    await voteIssue(issue.id, user.id);
  };

  // স্ট্যাটাস আপডেট
  const handleStatusUpdate = async (newStatus: string) => {
    if (!issue) return;
    setIsUpdating(true);
    await updateStatus(issue.id, newStatus as any);
    setIsUpdating(false);
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

  // কমেন্ট সাবমিট
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !user) return;

    const { data, error } = await supabase.from("comments").insert({
      issue_id: params.id,
      user_id: user.id,
      text: comment.trim(),
      is_official: isAdmin,
    }).select(`
      *,
      profiles:user_id (
        full_name,
        avatar_url
      )
    `).single();

    if (!error && data) {
      setComments([...comments, data]);
    }
    
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">সমস্যা পাওয়া যায়নি</h1>
        <Link href="/" className="px-6 py-3 bg-blue-600 text-white rounded-full">
          হোমে ফিরে যান
        </Link>
      </div>
    );
  }

  const hasVoted = user ? issue.voted_by.includes(user.id) : true;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* হেডার */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="font-semibold text-gray-900">ইস্যু ডিটেইল</h1>
          <button onClick={handleShare} className="p-2 hover:bg-gray-100 rounded-full">
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-5 space-y-6">
        {/* ইমেজ */}
        {issue.images.length > 0 && (
          <img
            src={issue.images[activeImage]}
            alt={issue.title}
            className="w-full aspect-video object-cover rounded-2xl"
          />
        )}

        {/* টাইটেল */}
        <h2 className="text-2xl font-bold">{issue.title}</h2>
        <p className="text-gray-700">{issue.description}</p>

        {/* ভোটিং */}
        <div className="bg-white p-5 rounded-2xl flex items-center justify-between">
          <div className="text-3xl font-bold">{issue.votes}</div>
          <button
            onClick={handleVote}
            disabled={hasVoted}
            className={`px-6 py-3 rounded-full font-bold text-lg ${
              hasVoted ? "bg-green-100 text-green-600" : "bg-blue-600 text-white"
            }`}
          >
            {hasVoted ? "✅ সমর্থন করেছেন" : "👍 সমর্থন জানান"}
          </button>
        </div>

        {/* কমেন্ট */}
        <div className="bg-white p-5 rounded-2xl">
          <h3 className="font-semibold mb-4">
            <MessageCircle className="w-5 h-5 inline mr-2" />
            মন্তব্য ({comments.length})
          </h3>

          <div className="space-y-4 mb-6">
            {comments.map((c, i) => (
              <div key={c.id || i} className="flex gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {c.profiles?.full_name || "ইউজার"}
                    {c.is_official && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        অফিশিয়াল
                      </span>
                    )}
                  </p>
                  <p className="text-gray-700">{c.text}</p>
                  <p className="text-xs text-gray-400">{timeAgo(c.created_at)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* কমেন্ট ফর্ম */}
          {user ? (
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="মন্তব্য লিখুন..."
                className="flex-1 p-3 bg-gray-50 border rounded-xl"
              />
              <button
                type="submit"
                disabled={!comment.trim()}
                className="px-5 py-3 bg-blue-600 text-white rounded-xl font-medium"
              >
                পাঠান
              </button>
            </form>
          ) : (
            <Link href="/auth/login" className="text-blue-600 text-sm">
              মন্তব্য করতে লগইন করুন
            </Link>
          )}
        </div>

        {/* অ্যাডমিন: স্ট্যাটাস আপডেট */}
        {isAdmin && (
          <div className="bg-white p-5 rounded-2xl">
            <h3 className="font-semibold mb-3">স্ট্যাটাস আপডেট</h3>
            <div className="flex flex-wrap gap-2">
              {["reported", "acknowledged", "in-progress", "resolved", "rejected"].map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusUpdate(status)}
                    disabled={issue.status === status}
                    className={`px-4 py-2 rounded-xl text-sm ${
                      issue.status === status
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100"
                    }`}
                  >
                    {status}
                  </button>
                )
              )}
            </div>
          </div>
        )}
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
  if (diffMins < 60) return `${diffMins} মিনিট আগে`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ঘণ্টা আগে`;
  return then.toLocaleDateString("bn-BD");
}