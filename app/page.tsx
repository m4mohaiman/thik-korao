// 

"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useIssueStore } from "@/stores/issueStore";
import IssueDrawer from "@/components/Issue/IssueDrawer";
import IssueCard from "@/components/Issue/IssueCard";
import { MapPin, Plus, List, Map as MapIcon } from "lucide-react";
import Link from "next/link";

// Leaflet SSR এর কারণে dynamic import করতে হবে
const MapView = dynamic(() => import("@/components/Map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin text-3xl mb-2">🗺️</div>
        <p className="text-gray-500">ম্যাপ লোড হচ্ছে...</p>
      </div>
    </div>
  ),
});

export default function HomePage() {
  const router = useRouter();
  const { issues, loadIssues, selectedIssue, setSelectedIssue } = useIssueStore();
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // অ্যাপ লোড হওয়ার সময় IndexedDB থেকে ডেটা নিয়ে আসা
    const fetchIssues = async () => {
      await loadIssues();
      setIsLoading(false);
    };
    fetchIssues();
  }, [loadIssues]);

  // স্ট্যাটাস অনুযায়ী ফিল্টার করা ইস্যু
  const activeIssues = issues.filter(
    (issue) => issue.status !== "resolved" && issue.status !== "rejected"
  );
  const resolvedIssues = issues.filter((issue) => issue.status === "resolved");

  // ========== ইস্যু কার্ড ক্লিক হ্যান্ডলার ==========
  const handleIssueClick = (issueId: string) => {
    // সরাসরি ডিটেইল পেজে নিয়ে যাওয়া
    router.push(`/issues/${issueId}`);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">📍</div>
          <h1 className="text-2xl font-bold text-gray-700">ঠিক করাও</h1>
          <p className="text-gray-500 mt-2">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="h-screen flex flex-col relative">
      {/* ========== হেডার ========== */}
      <header className="bg-white border-b shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* লোগো ও স্ট্যাটস */}
            <div>
              <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
                <MapPin className="w-6 h-6" />
                ঠিক করাও
              </h1>
              <div className="flex gap-3 text-xs text-gray-500 mt-1">
                <span className="bg-green-100 px-2 py-0.5 rounded-full">
                  🟢 {activeIssues.length} সচল
                </span>
                <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                  ✅ {resolvedIssues.length} সমাধান
                </span>
              </div>
            </div>

            {/* ভিউ টগল ও রিপোর্ট বাটন */}
            <div className="flex items-center gap-2">
              {/* ম্যাপ / লিস্ট ভিউ টগল */}
              <div className="bg-gray-100 rounded-lg p-1 flex">
                <button
                  onClick={() => setViewMode("map")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === "map"
                      ? "bg-white shadow text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <MapIcon className="w-4 h-4 inline mr-1" />
                  ম্যাপ
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === "list"
                      ? "bg-white shadow text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <List className="w-4 h-4 inline mr-1" />
                  লিস্ট
                </button>
              </div>

              {/* রিপোর্ট বাটন */}
              <Link
                href="/report"
                className="bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-1.5 hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">রিপোর্ট</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ========== মেইন কন্টেন্ট ========== */}
      <div className="flex-1 relative overflow-hidden">
        {/* ম্যাপ ভিউ */}
        {viewMode === "map" && (
          <div className="h-full w-full">
            <MapView />
          </div>
        )}

        {/* লিস্ট ভিউ */}
        {viewMode === "list" && (
          <div className="h-full overflow-y-auto pb-20">
            {issues.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="max-w-2xl mx-auto p-4 space-y-4">
                {issues
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )
                  .map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      onClick={() => handleIssueClick(issue.id)}
                    />
                  ))}
              </div>
            )}
          </div>
        )}

        {/* সিলেক্টেড ইস্যু ড্রয়ার (মোবাইলে নিচ থেকে, ডেস্কটপে সাইডবার) */}
        {selectedIssue && (
          <IssueDrawer
            issue={selectedIssue}
            onClose={() => setSelectedIssue(null)}
          />
        )}
      </div>

      {/* ========== ফ্লোটিং অ্যাকশন বাটন (মোবাইল) ========== */}
      <Link
        href="/report"
        className="md:hidden fixed bottom-24 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </main>
  );
}

// ========== এম্পটি স্টেট (কোনো ইস্যু নেই) ==========
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="text-6xl mb-4">🏙️</div>
      <h2 className="text-xl font-bold text-gray-700 mb-2">
        কোনো সমস্যা রিপোর্ট করা হয়নি
      </h2>
      <p className="text-gray-500 mb-6 max-w-md">
        আপনার এলাকার সমস্যা প্রথম রিপোর্টকারী হোন। সবার আগে জানান, দ্রুত
        সমাধান পান।
      </p>
      <Link
        href="/report"
        className="bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
      >
        প্রথম রিপোর্ট করুন ✊
      </Link>
    </div>
  );
}