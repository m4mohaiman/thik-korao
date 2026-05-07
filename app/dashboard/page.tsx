"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useIssueStore } from "@/stores/issueStore";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  ArrowLeft,
  Filter,
  Download,
  Search,
  ChevronDown,
  RefreshCw,
  PieChart,
  Shield,
} from "lucide-react";

// ========== টাইপ ==========
type TimeFilter = "today" | "week" | "month" | "all";
type StatusFilter =
  | "all"
  | "reported"
  | "acknowledged"
  | "in-progress"
  | "resolved"
  | "rejected";
type CategoryFilter =
  | "all"
  | "road"
  | "electricity"
  | "water"
  | "garbage"
  | "drainage"
  | "other";

export default function DashboardPage() {
  const { issues, loadIssues } = useIssueStore();
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const profile = useAuthStore((state) => state.profile);

  useEffect(() => {
    const fetchData = async () => {
      await loadIssues();
      setIsLoading(false);
    };
    fetchData();
  }, [loadIssues]);

  // ========== ফিল্টার করা ডেটা ==========
  const filteredIssues = useMemo(() => {
    let result = [...issues];

    // টাইম ফিল্টার
    if (timeFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();
      if (timeFilter === "today") filterDate.setHours(0, 0, 0, 0);
      if (timeFilter === "week") filterDate.setDate(now.getDate() - 7);
      if (timeFilter === "month") filterDate.setMonth(now.getMonth() - 1);
      result = result.filter((i) => new Date(i.created_at) >= filterDate);
    }

    // স্ট্যাটাস ফিল্টার
    if (statusFilter !== "all") {
      result = result.filter((i) => i.status === statusFilter);
    }

    // ক্যাটাগরি ফিল্টার
    if (categoryFilter !== "all") {
      result = result.filter((i) => i.category === categoryFilter);
    }

    // সার্চ
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(query) ||
          i.description.toLowerCase().includes(query) ||
          (i.location.address &&
            i.location.address.toLowerCase().includes(query)),
      );
    }

    return result;
  }, [issues, timeFilter, statusFilter, categoryFilter, searchQuery]);

  // ========== স্ট্যাটিস্টিক্স ==========
  const stats = useMemo(() => {
    const total = issues.length;
    const resolved = issues.filter((i) => i.status === "resolved").length;
    const inProgress = issues.filter((i) => i.status === "in-progress").length;
    const reported = issues.filter((i) => i.status === "reported").length;
    const acknowledged = issues.filter(
      (i) => i.status === "acknowledged",
    ).length;
    const rejected = issues.filter((i) => i.status === "rejected").length;
    const totalVotes = issues.reduce((sum, i) => sum + i.votes, 0);

    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    // ক্যাটাগরি ভিত্তিক কাউন্ট
    const categoryCount: Record<string, number> = {};
    issues.forEach((i) => {
      categoryCount[i.category] = (categoryCount[i.category] || 0) + 1;
    });

    // দিন ভিত্তিক রিপোর্ট (গত ৭ দিন)
    const last7Days: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("bn-BD", {
        weekday: "short",
        day: "numeric",
      });
      const count = issues.filter((issue) => {
        const issueDate = new Date(issue.created_at);
        return (
          issueDate.getDate() === d.getDate() &&
          issueDate.getMonth() === d.getMonth() &&
          issueDate.getFullYear() === d.getFullYear()
        );
      }).length;
      last7Days.push({ date: dateStr, count });
    }

    return {
      total,
      resolved,
      inProgress,
      reported,
      acknowledged,
      rejected,
      totalVotes,
      resolutionRate,
      categoryCount,
      last7Days,
    };
  }, [issues]);

  // ========== এক্সপোর্ট ==========
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(filteredIssues, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `thik-korao-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Title",
      "Category",
      "Status",
      "Votes",
      "Date",
      "Location",
    ];
    const rows = filteredIssues.map((i) => [
      i.id,
      `"${i.title.replace(/"/g, '""')}"`,
      i.category,
      i.status,
      i.votes,
      new Date(i.created_at).toLocaleDateString(),
      `"${(i.location.address || "").replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `thik-korao-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-4" />
          <p className="text-gray-500">ড্যাশবোর্ড লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ========== হেডার ========== */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                  ড্যাশবোর্ড
                </h1>
                <p className="text-sm text-gray-500">
                  মোট {stats.total} টি রিপোর্ট
                </p>
              </div>
            </div>

            {/* এক্সপোর্ট বাটন */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                এক্সপোর্ট
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white border rounded-xl shadow-lg overflow-hidden z-50 min-w-[160px]">
                  <button
                    onClick={handleExportJSON}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm flex items-center gap-2"
                  >
                    <span className="text-orange-500">📄</span> JSON
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm flex items-center gap-2"
                  >
                    <span className="text-green-500">📊</span> CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm mb-6 flex items-center gap-4">
          <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
            <Shield className="w-7 h-7 text-purple-600" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-gray-900">
              স্বাগতম, {profile?.full_name || "অ্যাডমিন"} 👋
            </h2>
            <p className="text-sm text-purple-600 font-medium">
              🔑 অ্যাডমিন অ্যাক্সেস
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* ========== স্ট্যাট কার্ড ========== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<AlertCircle className="w-5 h-5" />}
            label="জমা পড়েছে"
            value={stats.reported}
            color="text-orange-600"
            bgColor="bg-orange-50"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="কাজ চলছে"
            value={stats.inProgress}
            color="text-purple-600"
            bgColor="bg-purple-50"
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            label="সমাধান"
            value={stats.resolved}
            color="text-green-600"
            bgColor="bg-green-50"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="মোট ভোট"
            value={stats.totalVotes}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
        </div>

        {/* ========== প্রগ্রেস বার ========== */}
        <div className="bg-white p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">সমাধানের হার</h3>
            <span className="text-2xl font-bold text-green-600">
              {stats.resolutionRate}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-1000"
              style={{ width: `${stats.resolutionRate}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>০%</span>
            <span>
              {stats.resolved}/{stats.total} সমাধান
            </span>
            <span>১০০%</span>
          </div>
        </div>

        {/* ========== চার্ট সেকশন ========== */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* গত ৭ দিনের ট্রেন্ড */}
          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              গত ৭ দিনের রিপোর্ট
            </h3>
            <BarChart data={stats.last7Days} />
          </div>

          {/* ক্যাটাগরি ডিস্ট্রিবিউশন */}
          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-500" />
              ক্যাটাগরি ভিত্তিক
            </h3>
            <CategoryDistribution
              data={stats.categoryCount}
              total={stats.total}
            />
          </div>
        </div>

        {/* ========== ফিল্টার বার ========== */}
        <div className="bg-white p-4 rounded-2xl shadow-sm space-y-3">
          {/* সার্চ */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="শিরোনাম, বিবরণ বা লোকেশন অনুযায়ী সার্চ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* ফিল্টার রো */}
          <div className="flex flex-wrap gap-2">
            {/* টাইম ফিল্টার */}
            <FilterGroup
              label="সময়"
              options={TIME_FILTERS}
              value={timeFilter}
              onChange={(v) => setTimeFilter(v as TimeFilter)}
            />

            {/* স্ট্যাটাস ফিল্টার */}
            <FilterGroup
              label="স্ট্যাটাস"
              options={STATUS_FILTERS}
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as StatusFilter)}
            />

            {/* ক্যাটাগরি ফিল্টার */}
            <FilterGroup
              label="ক্যাটাগরি"
              options={CATEGORY_FILTERS}
              value={categoryFilter}
              onChange={(v) => setCategoryFilter(v as CategoryFilter)}
            />
          </div>

          {/* রেজাল্ট কাউন্ট */}
          <p className="text-sm text-gray-400">
            {filteredIssues.length} টি ফলাফল দেখানো হচ্ছে
          </p>
        </div>

        {/* ========== ইস্যু টেবিল ========== */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left p-4 text-sm font-medium text-gray-500">
                    সমস্যা
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500 hidden md:table-cell">
                    ক্যাটাগরি
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500">
                    স্ট্যাটাস
                  </th>
                  <th className="text-center p-4 text-sm font-medium text-gray-500 hidden sm:table-cell">
                    ভোট
                  </th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500 hidden md:table-cell">
                    তারিখ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredIssues.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="w-8 h-8 opacity-50" />
                        <p>কোনো ফলাফল পাওয়া যায়নি</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredIssues
                    .sort(
                      (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime(),
                    )
                    .map((issue) => (
                      <tr
                        key={issue.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-4">
                          <Link
                            href={`/issues/${issue.id}`}
                            className="font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-1"
                          >
                            {issue.title}
                          </Link>
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                            {issue.location.address || "লোকেশন নেই"}
                          </p>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <span className="text-sm px-2 py-1 bg-gray-100 rounded-full">
                            {getCategoryIcon(issue.category)}{" "}
                            {getCategoryName(issue.category)}
                          </span>
                        </td>
                        <td className="p-4">
                          <StatusBadge status={issue.status} />
                        </td>
                        <td className="p-4 text-center hidden sm:table-cell">
                          <span className="font-medium text-sm">
                            👍 {issue.votes}
                          </span>
                        </td>
                        <td className="p-4 text-right text-sm text-gray-500 hidden md:table-cell">
                          {new Date(issue.created_at).toLocaleDateString(
                            "bn-BD",
                            {
                              day: "numeric",
                              month: "short",
                            },
                          )}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ======================== সাব-কম্পোনেন্ট ========================

// স্ট্যাট কার্ড
function StatCard({
  icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm">
      <div
        className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center ${color} mb-3`}
      >
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900">
        {value.toLocaleString()}
      </div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

// স্ট্যাটাস ব্যাজ (ছোট)
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    reported: {
      label: "জমা পড়েছে",
      className: "bg-orange-100 text-orange-700",
    },
    acknowledged: { label: "গৃহীত", className: "bg-blue-100 text-blue-700" },
    "in-progress": {
      label: "কাজ চলছে",
      className: "bg-purple-100 text-purple-700",
    },
    resolved: { label: "সমাধান", className: "bg-green-100 text-green-700" },
    rejected: { label: "বাতিল", className: "bg-red-100 text-red-700" },
  };
  const c = config[status] || config.reported;

  return (
    <span
      className={`text-xs px-2 py-1 rounded-full font-medium ${c.className}`}
    >
      {c.label}
    </span>
  );
}

// ফিল্টার গ্রুপ (বাটন সেগমেন্ট)
function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = options.find((o) => o.value === value)?.label || "সব";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors"
      >
        <Filter className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-gray-600">{label}:</span>
        <span className="font-medium text-gray-800">{selectedLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 bg-white border rounded-xl shadow-lg z-20 min-w-[140px] overflow-hidden">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                  value === option.value
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// বার চার্ট (গত ৭ দিন)
function BarChart({ data }: { data: { date: string; count: number }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((item, index) => (
        <div
          key={index}
          className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
        >
          <span className="text-xs font-medium text-gray-700">
            {item.count > 0 ? item.count : ""}
          </span>
          <div
            className="w-full bg-blue-500 rounded-t-md transition-all duration-500 hover:bg-blue-600 min-h-[4px]"
            style={{
              height: `${Math.max((item.count / maxCount) * 100, 4)}%`,
            }}
          />
          <span className="text-[10px] text-gray-400 mt-1">{item.date}</span>
        </div>
      ))}
    </div>
  );
}

// ক্যাটাগরি ডিস্ট্রিবিউশন
function CategoryDistribution({
  data,
  total,
}: {
  data: Record<string, number>;
  total: number;
}) {
  const categories = [
    { key: "road", label: "রাস্তা", color: "bg-orange-500" },
    { key: "electricity", label: "বিদ্যুৎ", color: "bg-yellow-500" },
    { key: "water", label: "পানি", color: "bg-blue-500" },
    { key: "garbage", label: "ময়লা", color: "bg-gray-500" },
    { key: "drainage", label: "ড্রেনেজ", color: "bg-cyan-500" },
    { key: "other", label: "অন্যান্য", color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-3">
      {categories.map((cat) => {
        const count = data[cat.key] || 0;
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={cat.key}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">
                {getCategoryIcon(cat.key)} {cat.label}
              </span>
              <span className="text-gray-900 font-medium">
                {count} ({percentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${cat.color} rounded-full transition-all duration-500`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ======================== কনস্ট্যান্টস ========================

const TIME_FILTERS = [
  { value: "all", label: "সব সময়" },
  { value: "today", label: "আজ" },
  { value: "week", label: "এই সপ্তাহ" },
  { value: "month", label: "এই মাস" },
];

const STATUS_FILTERS = [
  { value: "all", label: "সব স্ট্যাটাস" },
  { value: "reported", label: "জমা পড়েছে" },
  { value: "acknowledged", label: "গৃহীত" },
  { value: "in-progress", label: "কাজ চলছে" },
  { value: "resolved", label: "সমাধান" },
  { value: "rejected", label: "বাতিল" },
];

const CATEGORY_FILTERS = [
  { value: "all", label: "সব ক্যাটাগরি" },
  { value: "road", label: "🛣️ রাস্তা" },
  { value: "electricity", label: "💡 বিদ্যুৎ" },
  { value: "water", label: "💧 পানি" },
  { value: "garbage", label: "🗑️ ময়লা" },
  { value: "drainage", label: "🌊 ড্রেনেজ" },
  { value: "other", label: "📌 অন্যান্য" },
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
