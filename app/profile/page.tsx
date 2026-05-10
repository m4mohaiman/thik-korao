"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Edit3,
  Check,
  X,
  Camera,
  Loader2,
  LogOut,
  LayoutDashboard,
  MapPin,
} from "lucide-react";
import Image from "next/image";

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, isAdmin, signOut, refreshProfile } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  // const [fullName, setFullName] = useState(profile?.full_name || "");
  // const [phone, setPhone] = useState(profile?.phone || "");
  const [fullName, setFullName] = useState(profile?.full_name || "");
const [phone, setPhone] = useState(profile?.phone || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // প্রোফাইল লোড না থাকলে রিফ্রেশ
  useEffect(() => {
    if (!profile && user) {
      refreshProfile();
    }
  }, [profile, user, refreshProfile]);


  // লগইন না থাকলে রিডাইরেক্ট
  useEffect(() => {
    if (!user) {
      router.push("/auth/login?next=/profile");
    }
  }, [user, router]);

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // ========== প্রোফাইল সেভ ==========
  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage("");

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      await refreshProfile();
      setIsEditing(false);
      setSaveMessage("প্রোফাইল আপডেট সফল হয়েছে!");

      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error: any) {
      setSaveMessage("সেভ করতে সমস্যা হয়েছে");
    }

    setIsSaving(false);
  };

  // ========== সাইন আউট ==========
  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  // ========== অ্যাভাটার আপলোড ==========
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // পুরনো অ্যাভাটার ডিলিট (যদি থাকে)
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split("/").pop();
        if (oldPath) {
          await supabase.storage.from("avatars").remove([oldPath]);
        }
      }

      // নতুন অ্যাভাটার আপলোড
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // পাবলিক URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // প্রোফাইল আপডেট
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      await refreshProfile();
    } catch (error) {
      console.error("Avatar upload error:", error);
      alert("ছবি আপলোড করতে সমস্যা হয়েছে");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ========== হেডার ========== */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="font-semibold text-gray-900">প্রোফাইল</h1>
          {isEditing ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Edit3 className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* ========== সাকসেস মেসেজ ========== */}
        {saveMessage && (
          <div
            className={`p-4 rounded-xl text-sm font-medium ${
              saveMessage.includes("সফল")
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {saveMessage}
          </div>
        )}

        {/* ========== প্রোফাইল কার্ড ========== */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* কভার / ব্যাকগ্রাউন্ড */}
          <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600 relative">
            {isAdmin && (
              <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                ADMIN
              </div>
            )}
          </div>

  
          <div className="px-5 pb-5">
            <div className="flex items-end">
              <div className="relative group">
                {profile.avatar_url ? (
                  <Image
                    width={100}
                    height={100}
                    src={profile.avatar_url}
                    alt={profile.full_name || "User"}
                    className="w-20 h-20 rounded-full border-4 border-white shadow-md object-cover"
                  />
                ) : (
                  <div
                    className={`w-20 h-20 rounded-full border-4 border-white shadow-md flex items-center justify-center text-2xl font-bold ${
                      isAdmin
                        ? "bg-purple-100 text-purple-600"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {profile.full_name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}

                {/* আপলোড ওভারলে */}
                <label className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* নাম + ইমেইল */}
              <div className="ml-4 mb-1">
                <h2 className="text-xl font-bold text-gray-900">
                  {profile.full_name || "ইউজার"}
                </h2>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========== ইনফো সেকশন ========== */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-5">
          <h3 className="font-semibold text-gray-900">তথ্য</h3>

          {/* নাম */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1 block">
              নাম
            </label>
            {isEditing ? (
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
                placeholder="আপনার নাম"
              />
            ) : (
              <p className="text-gray-900 font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                {profile.full_name || "নেই"}
              </p>
            )}
          </div>

          {/* ইমেইল (read-only) */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1 block">
              ইমেইল
            </label>
            <p className="text-gray-900 font-medium flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              {user.email}
            </p>
          </div>

          {/* ফোন */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1 block">
              ফোন নাম্বার
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
                placeholder="০১XXXXXXXXX"
              />
            ) : (
              <p className="text-gray-900 font-medium flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                {profile.phone || "নেই"}
              </p>
            )}
          </div>

          {/* রোল */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1 block">
              রোল
            </label>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                isAdmin
                  ? "bg-purple-100 text-purple-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {isAdmin ? (
                <Shield className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )}
              {isAdmin ? "অ্যাডমিন" : "ইউজার"}
            </span>
          </div>

          {/* জয়েনড ডেট */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1 block">
              জয়েনড
            </label>
            <p className="text-gray-500 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              {new Date(
                profile.created_at || user.created_at,
              ).toLocaleDateString("bn-BD", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* ========== কুইক লিংক ========== */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* অ্যাডমিন: ড্যাশবোর্ড */}
          {isAdmin && (
            <Link
              href="/dashboard"
              className="flex items-center justify-between p-4 hover:bg-purple-50 transition-colors border-b"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-purple-600" />
                </div>
                <span className="font-medium text-gray-900">ড্যাশবোর্ড</span>
              </div>
              <span className="text-gray-400">→</span>
            </Link>
          )}

          {/* হোম */}
          <Link
            href="/"
            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-gray-600" />
              </div>
              <span className="font-medium text-gray-900">হোম পেজ</span>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
        </div>

        {/* ========== সাইন আউট ========== */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-50 text-red-600 rounded-2xl font-medium hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          সাইন আউট
        </button>

        <div className="h-8" />
      </div>
    </div>
  );
}
