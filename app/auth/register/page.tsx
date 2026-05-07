"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import Link from "next/link";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const signUp = useAuthStore((state) => state.signUp);
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await signUp(email, password, fullName);
      alert("রেজিস্ট্রেশন সফল! ইমেইল ভেরিফাই করে লগইন করুন।");
      router.push("/auth/login");
    } catch (err: any) {
      setError(err.message || "রেজিস্ট্রেশন ব্যর্থ হয়েছে");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">📍</div>
          <h1 className="text-2xl font-bold text-gray-900">রেজিস্টার</h1>
          <p className="text-gray-500 mt-1">নতুন অ্যাকাউন্ট তৈরি করুন</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              নাম
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="আপনার নাম"
              required
              className="w-full p-3 border rounded-xl focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ইমেইল
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              className="w-full p-3 border rounded-xl focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              পাসওয়ার্ড
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="কমপক্ষে ৬ অক্ষর"
                required
                minLength={6}
                className="w-full p-3 border rounded-xl pr-12 focus:outline-none focus:border-blue-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
            রেজিস্টার
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          অ্যাকাউন্ট আছে?{" "}
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            লগইন করুন
          </Link>
        </p>

        <Link
          href="/"
          className="block text-center text-sm text-gray-400 mt-4 hover:text-gray-600"
        >
          ← হোমে ফিরে যান
        </Link>
      </div>
    </div>
  );
}