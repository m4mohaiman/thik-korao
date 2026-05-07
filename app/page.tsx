// // 

// "use client";

// import { useEffect, useState } from "react";
// import dynamic from "next/dynamic";
// import { useRouter } from "next/navigation";
// import { useIssueStore } from "@/stores/issueStore";
// import IssueDrawer from "@/components/Issue/IssueDrawer";
// import IssueCard from "@/components/Issue/IssueCard";
// import { MapPin, Plus, List, Map as MapIcon } from "lucide-react";
// import Link from "next/link";

// // Leaflet SSR এর কারণে dynamic import করতে হবে
// const MapView = dynamic(() => import("@/components/Map/MapView"), {
//   ssr: false,
//   loading: () => (
//     <div className="h-full w-full flex items-center justify-center bg-gray-100">
//       <div className="text-center">
//         <div className="animate-spin text-3xl mb-2">🗺️</div>
//         <p className="text-gray-500">ম্যাপ লোড হচ্ছে...</p>
//       </div>
//     </div>
//   ),
// });

// export default function HomePage() {
//   const router = useRouter();
//   const { issues, loadIssues, selectedIssue, setSelectedIssue } = useIssueStore();
//   const [viewMode, setViewMode] = useState<"map" | "list">("map");
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     // অ্যাপ লোড হওয়ার সময় IndexedDB থেকে ডেটা নিয়ে আসা
//     const fetchIssues = async () => {
//       await loadIssues();
//       setIsLoading(false);
//     };
//     fetchIssues();
//   }, [loadIssues]);

//   // স্ট্যাটাস অনুযায়ী ফিল্টার করা ইস্যু
//   const activeIssues = issues.filter(
//     (issue) => issue.status !== "resolved" && issue.status !== "rejected"
//   );
//   const resolvedIssues = issues.filter((issue) => issue.status === "resolved");

//   // ========== ইস্যু কার্ড ক্লিক হ্যান্ডলার ==========
//   const handleIssueClick = (issueId: string) => {
//     // সরাসরি ডিটেইল পেজে নিয়ে যাওয়া
//     router.push(`/issues/${issueId}`);
//   };

//   if (isLoading) {
//     return (
//       <div className="h-screen flex items-center justify-center">
//         <div className="text-center">
//           <div className="text-5xl mb-4 animate-bounce">📍</div>
//           <h1 className="text-2xl font-bold text-gray-700">ঠিক করাও</h1>
//           <p className="text-gray-500 mt-2">লোড হচ্ছে...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <main className="h-screen flex flex-col relative">
//       {/* ========== হেডার ========== */}
//       <header className="bg-white border-b shadow-sm z-50">
//         <div className="max-w-7xl mx-auto px-4 py-3">
//           <div className="flex items-center justify-between">
//             {/* লোগো ও স্ট্যাটস */}
//             <div>
//               <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
//                 <MapPin className="w-6 h-6" />
//                 ঠিক করাও
//               </h1>
//               <div className="flex gap-3 text-xs text-gray-500 mt-1">
//                 <span className="bg-green-100 px-2 py-0.5 rounded-full">
//                   🟢 {activeIssues.length} সচল
//                 </span>
//                 <span className="bg-gray-100 px-2 py-0.5 rounded-full">
//                   ✅ {resolvedIssues.length} সমাধান
//                 </span>
//               </div>
//             </div>

//             {/* ভিউ টগল ও রিপোর্ট বাটন */}
//             <div className="flex items-center gap-2">
//               {/* ম্যাপ / লিস্ট ভিউ টগল */}
//               <div className="bg-gray-100 rounded-lg p-1 flex">
//                 <button
//                   onClick={() => setViewMode("map")}
//                   className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
//                     viewMode === "map"
//                       ? "bg-white shadow text-blue-600"
//                       : "text-gray-500 hover:text-gray-700"
//                   }`}
//                 >
//                   <MapIcon className="w-4 h-4 inline mr-1" />
//                   ম্যাপ
//                 </button>
//                 <button
//                   onClick={() => setViewMode("list")}
//                   className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
//                     viewMode === "list"
//                       ? "bg-white shadow text-blue-600"
//                       : "text-gray-500 hover:text-gray-700"
//                   }`}
//                 >
//                   <List className="w-4 h-4 inline mr-1" />
//                   লিস্ট
//                 </button>
//               </div>

//               {/* রিপোর্ট বাটন */}
//               <Link
//                 href="/report"
//                 className="bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-1.5 hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
//               >
//                 <Plus className="w-4 h-4" />
//                 <span className="hidden sm:inline">রিপোর্ট</span>
//               </Link>
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* ========== মেইন কন্টেন্ট ========== */}
//       <div className="flex-1 relative overflow-hidden">
//         {/* ম্যাপ ভিউ */}
//         {viewMode === "map" && (
//           <div className="h-full w-full">
//             <MapView />
//           </div>
//         )}

//         {/* লিস্ট ভিউ */}
//         {viewMode === "list" && (
//           <div className="h-full overflow-y-auto pb-20">
//             {issues.length === 0 ? (
//               <EmptyState />
//             ) : (
//               <div className="max-w-2xl mx-auto p-4 space-y-4">
//                 {issues
//                   .sort(
//                     (a, b) =>
//                       new Date(b.created_at).getTime() -
//                       new Date(a.created_at).getTime()
//                   )
//                   .map((issue) => (
//                     <IssueCard
//                       key={issue.id}
//                       issue={issue}
//                       onClick={() => handleIssueClick(issue.id)}
//                     />
//                   ))}
//               </div>
//             )}
//           </div>
//         )}

//         {/* সিলেক্টেড ইস্যু ড্রয়ার (মোবাইলে নিচ থেকে, ডেস্কটপে সাইডবার) */}
//         {selectedIssue && (
//           <IssueDrawer
//             issue={selectedIssue}
//             onClose={() => setSelectedIssue(null)}
//           />
//         )}
//       </div>

//       {/* ========== ফ্লোটিং অ্যাকশন বাটন (মোবাইল) ========== */}
//       <Link
//         href="/report"
//         className="md:hidden fixed bottom-24 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
//       >
//         <Plus className="w-6 h-6" />
//       </Link>
//     </main>
//   );
// }

// // ========== এম্পটি স্টেট (কোনো ইস্যু নেই) ==========
// function EmptyState() {
//   return (
//     <div className="flex flex-col items-center justify-center h-full text-center p-8">
//       <div className="text-6xl mb-4">🏙️</div>
//       <h2 className="text-xl font-bold text-gray-700 mb-2">
//         কোনো সমস্যা রিপোর্ট করা হয়নি
//       </h2>
//       <p className="text-gray-500 mb-6 max-w-md">
//         আপনার এলাকার সমস্যা প্রথম রিপোর্টকারী হোন। সবার আগে জানান, দ্রুত
//         সমাধান পান।
//       </p>
//       <Link
//         href="/report"
//         className="bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
//       >
//         প্রথম রিপোর্ট করুন ✊
//       </Link>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useIssueStore } from "@/stores/issueStore";
import { useAuthStore } from "@/stores/authStore";
import IssueDrawer from "@/components/Issue/IssueDrawer";
import IssueCard from "@/components/Issue/IssueCard";
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
} from "lucide-react";
import Link from "next/link";

// Leaflet SSR এর কারণে dynamic import
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
  const { issues, loadIssues, selectedIssue, setSelectedIssue } =
    useIssueStore();

  // ✅ Auth Store
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const signOut = useAuthStore((state) => state.signOut);

  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [isLoading, setIsLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

useEffect(() => {
  const fetchIssues = async () => {
    console.log("HomePage: loading issues...");
    await loadIssues();
    console.log("HomePage: issues loaded");
    setIsLoading(false);
  };
  fetchIssues();
}, [loadIssues]);

// ইস্যু কাউন্ট দেখতে:
console.log("Total issues in store:", issues.length);

  const activeIssues = issues.filter(
    (issue) => issue.status !== "resolved" && issue.status !== "rejected"
  );
  const resolvedIssues = issues.filter(
    (issue) => issue.status === "resolved"
  );

  // ইস্যু কার্ড ক্লিক
  const handleIssueClick = (issueId: string) => {
    router.push(`/issues/${issueId}`);
  };

  // সাইন আউট
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

            {/* ডান পাশের কন্ট্রোল */}
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

              {/* ========== অ্যাডমিন: ড্যাশবোর্ড লিংক ========== */}
              {isAdmin && (
                <Link
                  href="/dashboard"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden md:inline">ড্যাশবোর্ড</span>
                </Link>
              )}

              {/* ========== ইউজার মেনু / লগইন ========== */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {/* অ্যাডমিন ব্যাজ */}
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

                  {/* ড্রপডাউন মেনু */}
                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border z-20 overflow-hidden">
                        {/* ইউজার ইনফো */}
                        <div className="p-3 border-b bg-gray-50">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {profile?.full_name || "ইউজার"}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {user.email}
                          </p>
                          {isAdmin && (
                            <span className="inline-block mt-1 text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                              🔑 অ্যাডমিন
                            </span>
                          )}
                        </div>

                        {/* মেনু আইটেম */}
                        <div className="p-1">
                          {/* ড্যাশবোর্ড (অ্যাডমিন) */}
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

                          {/* প্রোফাইল */}
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

                          {/* সাইন আউট */}
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

              {/* রিপোর্ট বাটন (শুধু লগইন করা ইউজার) */}
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
              <EmptyState isLoggedIn={!!user} />
            ) : (
              <div className="max-w-2xl mx-auto p-4 space-y-4">
                {issues
                  .sort(
                    (a, b) =>
                      new Date(b.created_at).getTime() -
                      new Date(a.created_at).getTime()
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

        {/* ইস্যু ড্রয়ার */}
        {selectedIssue && (
          <IssueDrawer
            issue={selectedIssue}
            onClose={() => setSelectedIssue(null)}
          />
        )}
      </div>

      {/* ========== ফ্লোটিং রিপোর্ট বাটন (মোবাইল, শুধু লগইন) ========== */}
      {user && (
        <Link
          href="/report"
          className="md:hidden fixed bottom-24 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        >
          <Plus className="w-6 h-6" />
        </Link>
      )}

      {/* ========== ফ্লোটিং লগইন বাটন (মোবাইল, গেস্ট) ========== */}
      {!user && (
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

// ========== এম্পটি স্টেট ==========
function EmptyState({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="text-6xl mb-4">🏙️</div>
      <h2 className="text-xl font-bold text-gray-700 mb-2">
        কোনো সমস্যা রিপোর্ট করা হয়নি
      </h2>
      <p className="text-gray-500 mb-6 max-w-md">
        {isLoggedIn
          ? "আপনার এলাকার সমস্যা প্রথম রিপোর্টকারী হোন। সবার আগে জানান, দ্রুত সমাধান পান।"
          : "রিপোর্ট করতে লগইন করুন। আপনার এলাকার সমস্যা জানিয়ে সাহায্য করুন।"}
      </p>
      {isLoggedIn ? (
        <Link
          href="/report"
          className="bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          প্রথম রিপোর্ট করুন ✊
        </Link>
      ) : (
        <Link
          href="/auth/login"
          className="bg-gray-800 text-white px-6 py-3 rounded-full font-medium hover:bg-gray-900 transition-colors shadow-lg"
        >
          লগইন করে রিপোর্ট করুন 🔐
        </Link>
      )}
    </div>
  );
}