"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useIssueStore } from "@/stores/issueStore";
import { useAuthStore } from "@/stores/authStore";
import IssueList from "@/components/Issue/IssueList";
import {
  MapPin,
  Plus,
  List,
  Map as MapIcon,
  LogIn,
  LogOut,
  User,
  Shield,
  LayoutDashboard,
  Grid3X3,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";

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
  const { issues, loadIssues } = useIssueStore();

  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const signOut = useAuthStore((state) => state.signOut);

  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [listLayout, setListLayout] = useState<"list" | "grid">("list");
  const [isLoading, setIsLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // ফিল্টার স্টেট
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "most_votes" | "least_votes">("newest");
  const [filterStatus, setFilterStatus] = useState<"all" | "reported" | "acknowledged" | "in-progress" | "resolved" | "rejected">("all");
  const [filterCategory, setFilterCategory] = useState<"all" | "road" | "electricity" | "water" | "garbage" | "drainage" | "other">("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchIssues = async () => {
      await loadIssues();
      setIsLoading(false);
    };
    fetchIssues();
  }, [loadIssues]);

  // ফিল্টার + সর্ট
  const filteredIssues = issues
    .filter((issue) => {
      if (filterStatus !== "all" && issue.status !== filterStatus) return false;
      if (filterCategory !== "all" && issue.category !== filterCategory) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "most_votes":
          return b.votes - a.votes;
        case "least_votes":
          return a.votes - b.votes;
        default:
          return 0;
      }
    });

  const activeIssues = issues.filter(
    (issue) => issue.status !== "resolved" && issue.status !== "rejected"
  );
  const resolvedIssues = issues.filter((issue) => issue.status === "resolved");

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
    router.push("/");
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

            {/* কন্ট্রোল */}
            <div className="flex items-center gap-2">
              {/* ম্যাপ / লিস্ট টগল */}
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

              {/* অ্যাডমিন ড্যাশবোর্ড */}
              {isAdmin && (
                <Link
                  href="/dashboard"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden md:inline">ড্যাশবোর্ড</span>
                </Link>
              )}

              {/* ইউজার মেনু */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {isAdmin ? (
                      <Shield className="w-4 h-4 text-purple-600" />
                    ) : (
                      <User className="w-4 h-4 text-gray-600" />
                    )}
                    <span className="text-sm font-medium text-gray-700 hidden sm:inline max-w-[100px] truncate">
                      {profile?.full_name || "ইউজার"}
                    </span>
                    {isAdmin && (
                      <span className="hidden sm:inline text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-bold">
                        Admin
                      </span>
                    )}
                  </button>

                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border z-20 overflow-hidden">
                        <div className="p-3 border-b bg-gray-50">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {profile?.full_name || "ইউজার"}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                          {isAdmin && (
                            <span className="inline-block mt-1 text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                              🔑 অ্যাডমিন
                            </span>
                          )}
                        </div>
                        <div className="p-1">
                          {isAdmin && (
                            <Link
                              href="/dashboard"
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                            >
                              <LayoutDashboard className="w-4 h-4" />
                              ড্যাশবোর্ড
                            </Link>
                          )}
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              router.push("/profile");
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <User className="w-4 h-4" />
                            প্রোফাইল
                          </button>
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            সাইন আউট
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">লগইন</span>
                </Link>
              )}

              {/* রিপোর্ট বাটন */}
              {user && (
                <Link
                  href="/report"
                  className="bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-1.5 hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">রিপোর্ট</span>
                </Link>
              )}
            </div>
          </div>

          {/* ========== ফিল্টার বার (শুধু লিস্ট ভিউতে) ========== */}
          {viewMode === "list" && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              {/* লেআউট টগল */}
              <div className="bg-gray-100 rounded-lg p-1 flex">
                <button
                  onClick={() => setListLayout("list")}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    listLayout === "list"
                      ? "bg-white shadow text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <List className="w-3.5 h-3.5 inline mr-1" />
                  লিস্ট
                </button>
                <button
                  onClick={() => setListLayout("grid")}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    listLayout === "grid"
                      ? "bg-white shadow text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Grid3X3 className="w-3.5 h-3.5 inline mr-1" />
                  গ্রিড
                </button>
              </div>

              {/* সর্ট */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs bg-gray-100 border-0 rounded-lg px-3 py-1.5 text-gray-700 font-medium"
              >
                <option value="newest">🆕 নতুন আগে</option>
                <option value="oldest">📅 পুরাতন আগে</option>
                <option value="most_votes">🔥 বেশি ভোট</option>
                <option value="least_votes">👍 কম ভোট</option>
              </select>

              {/* ফিল্টার টগল */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  showFilters || filterStatus !== "all" || filterCategory !== "all"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                ফিল্টার
                {(filterStatus !== "all" || filterCategory !== "all") && (
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                )}
              </button>
            </div>
          )}

          {/* ========== এক্সপান্ডেড ফিল্টার ========== */}
          {viewMode === "list" && showFilters && (
            <div className="flex gap-3 mt-3 flex-wrap">
              {/* স্ট্যাটাস ফিল্টার */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] text-gray-400 mr-1">স্ট্যাটাস:</span>
                {[
                  { value: "all", label: "সব" },
                  { value: "reported", label: "জমা" },
                  { value: "acknowledged", label: "গৃহীত" },
                  { value: "in-progress", label: "চলছে" },
                  { value: "resolved", label: "সমাধান" },
                  { value: "rejected", label: "বাতিল" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterStatus(opt.value as any)}
                    className={`text-[10px] px-2 py-1 rounded-full font-medium transition-all ${
                      filterStatus === opt.value
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* ক্যাটাগরি ফিল্টার */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] text-gray-400 mr-1">ক্যাটাগরি:</span>
                {[
                  { value: "all", label: "সব", icon: "📂" },
                  { value: "road", label: "রাস্তা", icon: "🛣️" },
                  { value: "electricity", label: "বিদ্যুৎ", icon: "💡" },
                  { value: "water", label: "পানি", icon: "💧" },
                  { value: "garbage", label: "ময়লা", icon: "🗑️" },
                  { value: "drainage", label: "ড্রেনেজ", icon: "🌊" },
                  { value: "other", label: "অন্যান্য", icon: "📌" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterCategory(opt.value as any)}
                    className={`text-[10px] px-2 py-1 rounded-full font-medium transition-all ${
                      filterCategory === opt.value
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
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
          <div className="h-full overflow-y-auto pb-20 px-4 pt-4">
            <IssueList
              issues={filteredIssues}
              layout={listLayout}
              isLoading={false}
              emptyMessage="কোনো সমস্যা পাওয়া যায়নি"
              emptySubMessage={
                filterStatus !== "all" || filterCategory !== "all"
                  ? "ফিল্টার পরিবর্তন করে দেখুন"
                  : user
                  ? "আপনার এলাকার সমস্যা প্রথম রিপোর্টকারী হোন!"
                  : "রিপোর্ট করতে লগইন করুন"
              }
              emptyActionHref={
                filterStatus !== "all" || filterCategory !== "all"
                  ? undefined
                  : user
                  ? "/report"
                  : "/auth/login"
              }
              emptyActionLabel={
                filterStatus !== "all" || filterCategory !== "all"
                  ? undefined
                  : user
                  ? "প্রথম রিপোর্ট করুন ✊"
                  : "লগইন করে রিপোর্ট করুন 🔐"
              }
            />
          </div>
        )}
      </div>

      {/* ========== ফ্লোটিং বাটন ========== */}
      {user ? (
        <Link
          href="/report"
          className="md:hidden fixed bottom-24 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        >
          <Plus className="w-6 h-6" />
        </Link>
      ) : (
        <Link
          href="/auth/login"
          className="md:hidden fixed bottom-24 right-4 bg-gray-800 text-white p-4 rounded-full shadow-lg hover:bg-gray-900 transition-colors z-50"
        >
          <LogIn className="w-6 h-6" />
        </Link>
      )}
    </main>
  );
}