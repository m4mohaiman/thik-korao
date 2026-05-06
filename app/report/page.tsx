"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import { useIssueStore } from "@/stores/issueStore";
import { getCurrentPosition, reverseGeocode } from "@/lib/location";
import { compressImage } from "@/lib/image";
import CameraCapture from "@/components/UI/Camera";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  ArrowLeft,
  Camera as CameraIcon,
  MapPin,
  X,
  Upload,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Navigation,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ========== ক্যাটাগরি ==========
const CATEGORIES = [
  {
    id: "road",
    label: "রাস্তা",
    icon: "🛣️",
    description: "ভাঙা রাস্তা, গর্ত, নির্মাণ সমস্যা",
    color: "border-orange-400 bg-orange-50",
    activeColor: "border-orange-500 bg-orange-100 ring-2 ring-orange-200",
  },
  {
    id: "electricity",
    label: "বিদ্যুৎ",
    icon: "💡",
    description: "নষ্ট স্ট্রিটলাইট, বিদ্যুতের তার",
    color: "border-yellow-400 bg-yellow-50",
    activeColor: "border-yellow-500 bg-yellow-100 ring-2 ring-yellow-200",
  },
  {
    id: "water",
    label: "পানি",
    icon: "💧",
    description: "পানি জমা, পানি সরবরাহ সমস্যা",
    color: "border-blue-400 bg-blue-50",
    activeColor: "border-blue-500 bg-blue-100 ring-2 ring-blue-200",
  },
  {
    id: "garbage",
    label: "ময়লা",
    icon: "🗑️",
    description: "ময়লা জমা, পরিষ্কারের অভাব",
    color: "border-gray-400 bg-gray-50",
    activeColor: "border-gray-500 bg-gray-100 ring-2 ring-gray-200",
  },
  {
    id: "drainage",
    label: "ড্রেনেজ",
    icon: "🌊",
    description: "নর্দমার সমস্যা, পানি নিষ্কাশন",
    color: "border-cyan-400 bg-cyan-50",
    activeColor: "border-cyan-500 bg-cyan-100 ring-2 ring-cyan-200",
  },
  {
    id: "other",
    label: "অন্যান্য",
    icon: "📌",
    description: "অন্যান্য স্থানীয় সমস্যা",
    color: "border-purple-400 bg-purple-50",
    activeColor: "border-purple-500 bg-purple-100 ring-2 ring-purple-200",
  },
];

// ========== স্টেপ ডেফিনেশন ==========
const STEPS = [
  { id: 1, label: "ক্যাটাগরি", icon: "📂" },
  { id: 2, label: "বিবরণ", icon: "✍️" },
  { id: 3, label: "ছবি", icon: "📸" },
  { id: 4, label: "লোকেশন", icon: "📍" },
];

export default function ReportPage() {
  const router = useRouter();
  const { addIssue } = useIssueStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ========== স্টেট ==========
  const [currentStep, setCurrentStep] = useState(1);
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
  } | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const LocationPicker = dynamic(
    () => import("@/components/UI/LocationPicker"),
    { ssr: false },
  );

  // ========== ভ্যালিডেশন ==========
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!category)
          newErrors.category = "দয়া করে একটি ক্যাটাগরি নির্বাচন করুন";
        break;
      case 2:
        if (!title.trim()) newErrors.title = "শিরোনাম প্রয়োজন";
        else if (title.trim().length < 5)
          newErrors.title = "শিরোনাম কমপক্ষে ৫ অক্ষরের হতে হবে";
        if (!description.trim()) newErrors.description = "বিবরণ প্রয়োজন";
        else if (description.trim().length < 10)
          newErrors.description = "বিবরণ কমপক্ষে ১০ অক্ষরের হতে হবে";
        break;
      case 3:
        // ছবি optional
        break;
      case 4:
        if (!location) newErrors.location = "লোকেশন নির্বাচন করুন";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ========== নেভিগেশন ==========
  // নেক্সট স্টেপ
  const handleNext = () => {
    if (validateStep(currentStep)) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      window.scrollTo({ top: 0, behavior: "smooth" });

      // অটো-লোকেশন যখন স্টেপ ৪ এ পৌঁছায়
      if (nextStep === 4 && !location && !isLocating) {
        handleGetLocation();
      }
    }
  };

  // প্রিভিয়াস স্টেপ
  const handlePrev = () => {
    const prevStep = currentStep - 1;
    setCurrentStep(prevStep);
    window.scrollTo({ top: 0, behavior: "smooth" });

    // ব্যাক করেও স্টেপ ৪ এ এলে লোকেশন নিন (যদি না থাকে)
    if (prevStep === 4 && !location && !isLocating) {
      handleGetLocation();
    }
  };

  // স্টেপ ইন্ডিকেটরে ক্লিক করে আগের স্টেপে যাওয়া
  const goToStep = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: "smooth" });

      if (step === 4 && !location && !isLocating) {
        handleGetLocation();
      }
    }
  };

  // ========== লোকেশন হ্যান্ডলিং ==========
  const handleGetLocation = async () => {
    setIsLocating(true);
    setLocationError("");

    try {
      const position = await getCurrentPosition();
      const { latitude: lat, longitude: lng } = position.coords;
      const address = await reverseGeocode(lat, lng);
      setLocation({ lat, lng, address });
    } catch (error: any) {
      setLocationError(
        "লোকেশন পাওয়া যায়নি। দয়া করে লোকেশন পারমিশন দিন অথবা ম্যানুয়ালি লোকেশন সার্চ করুন।",
      );
    }

    setIsLocating(false);
  };

  // ========== ইমেজ হ্যান্ডলিং ==========

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };


  // ========== সাবমিট ==========
  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    if (!location) {
      setLocationError("লোকেশন প্রয়োজন");
      return;
    }

    setIsSubmitting(true);

    const deviceId = localStorage.getItem("deviceId") || uuidv4();
    localStorage.setItem("deviceId", deviceId);

    const issue = {
      id: uuidv4(),
      title: title.trim(),
      description: description.trim(),
      category: category || "other",
      images,
      location,
      status: "reported" as const,
      votes: 1,
      votedBy: [deviceId],
      createdBy: deviceId,
      createdAt: new Date(),
      updatedAt: new Date(),
      comments: [],
    };

    try {
      await addIssue(issue);
      setShowSuccess(true);

      // ২ সেকেন্ড পর হোমে রিডাইরেক্ট
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      alert("সাবমিট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    }

    setIsSubmitting(false);
  };

  // ========== অটো-লোকেশন (স্টেপ ৪ এ গেলেই) ==========
  //   useEffect(() => {
  //     if (currentStep === 4 && !location) {
  //       handleGetLocation();
  //     }
  //   }, [currentStep]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ========== হেডার ========== */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="font-semibold text-gray-900">সমস্যা রিপোর্ট</h1>
          <div className="w-9" /> {/* Spacer */}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* ========== সাকসেস স্টেট ========== */}
        {showSuccess ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              রিপোর্ট জমা হয়েছে!
            </h2>
            <p className="text-gray-500 mb-2">
              আপনার রিপোর্ট সফলভাবে জমা দেওয়া হয়েছে
            </p>
            <p className="text-sm text-gray-400 mb-6">
              হোম পেজে ফিরিয়ে নেওয়া হচ্ছে...
            </p>
            <div className="w-48 h-1.5 bg-gray-200 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-green-500 rounded-full animate-progress" />
            </div>
          </div>
        ) : (
          <>
            {/* ========== স্টেপ ইন্ডিকেটর ========== */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {STEPS.map((step, index) => (
                  <div key={step.id} className="flex items-center flex-1">
                    <button
                      onClick={() => goToStep(step.id)}
                      disabled={step.id > currentStep}
                      className="flex flex-col items-center disabled:cursor-not-allowed"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
                          currentStep > step.id
                            ? "bg-green-500 text-white"
                            : currentStep === step.id
                              ? "bg-blue-600 text-white ring-4 ring-blue-100"
                              : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        {currentStep > step.id ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          step.icon
                        )}
                      </div>
                      <span
                        className={`text-xs mt-1.5 font-medium hidden sm:block ${
                          currentStep >= step.id
                            ? "text-gray-900"
                            : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </span>
                    </button>

                    {index < STEPS.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 ${
                          currentStep > step.id ? "bg-green-500" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ========== স্টেপ ১: ক্যাটাগরি নির্বাচন ========== */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    সমস্যার ধরন নির্বাচন করুন
                  </h2>
                  <p className="text-gray-500 text-sm">
                    কোন ধরনের সমস্যা রিপোর্ট করতে চান?
                  </p>
                </div>

                {errors.category && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {errors.category}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategory(cat.id);
                        setErrors({});
                      }}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        category === cat.id
                          ? cat.activeColor
                          : `${cat.color} hover:shadow-md`
                      }`}
                    >
                      <div className="text-3xl mb-2">{cat.icon}</div>
                      <div className="font-semibold text-gray-900">
                        {cat.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {cat.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ========== স্টেপ ২: বিবরণ ========== */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    সমস্যার বিবরণ দিন
                  </h2>
                  <p className="text-gray-500 text-sm">
                    সমস্যাটি বিস্তারিত বর্ণনা করুন যাতে দ্রুত সমাধান করা যায়
                  </p>
                </div>

                {/* শিরোনাম */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    শিরোনাম <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: রাস্তায় বড় গর্ত, নষ্ট স্ট্রিটলাইট..."
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (errors.title) setErrors({});
                    }}
                    maxLength={100}
                    className={`w-full p-3.5 border-2 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none transition-colors ${
                      errors.title
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200 focus:border-blue-400"
                    }`}
                  />
                  {errors.title && (
                    <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-1 text-right">
                    {title.length}/100
                  </p>
                </div>

                {/* বিবরণ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    বিস্তারিত বিবরণ <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="সমস্যাটি কোথায়, কতদিন ধরে, কী সমস্যা হচ্ছে..."
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (errors.description) setErrors({});
                    }}
                    rows={5}
                    maxLength={500}
                    className={`w-full p-3.5 border-2 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none resize-none transition-colors ${
                      errors.description
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200 focus:border-blue-400"
                    }`}
                  />
                  {errors.description && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.description}
                    </p>
                  )}
                  <p className="text-gray-400 text-xs mt-1 text-right">
                    {description.length}/500
                  </p>
                </div>
              </div>
            )}

            {/* ========== স্টেপ ৩: ছবি ========== */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    ছবি যোগ করুন
                  </h2>
                  <p className="text-gray-500 text-sm">
                    সমস্যার ছবি দিলে বোঝা সহজ হয় (অপশনাল, সর্বোচ্চ ৫টি)
                  </p>
                </div>

                {/* ইমেজ প্রিভিউ */}
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {images.map((img, index) => (
                      <div
                        key={index}
                        className="relative aspect-square rounded-xl overflow-hidden group"
                      >
                        <Image
                          width={300}
                          height={300}
                          src={img}
                          alt={`ছবি ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {images.length < 5 && (
                      <button
                        onClick={() => setShowCamera(true)}
                        className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                      >
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          আরও যোগ করুন
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {/* ক্যামেরা বাটন (কোনো ছবি না থাকলে) */}
                {images.length === 0 && (
                  <button
                    onClick={() => setShowCamera(true)}
                    className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-10 flex flex-col items-center gap-3 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <CameraIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">
                        ছবি তুলুন বা আপলোড করুন
                      </p>
                      <p className="text-sm text-gray-400">
                        ক্যামেরা বা গ্যালারি থেকে
                      </p>
                    </div>
                  </button>
                )}

                {/* ক্যামেরা মোডাল */}
                {showCamera && (
                  <CameraCapture
                    onCapture={(newImages) => {
                      setImages([...images, ...newImages]);
                      setShowCamera(false);
                    }}
                    onClose={() => setShowCamera(false)}
                    maxImages={5}
                    currentCount={images.length}
                  />
                )}

                {/* টিপস */}
                <div className="bg-blue-50 p-4 rounded-xl">
                  <p className="text-sm text-blue-700 font-medium mb-1">
                    💡 ভালো ছবির টিপস
                  </p>
                  <ul className="text-xs text-blue-600 space-y-1">
                    <li>
                      • সমস্যাটি ক্লিয়ারভাবে দেখা যাচ্ছে কিনা নিশ্চিত করুন
                    </li>
                    <li>• আশেপাশের পরিবেশও দেখান (লোকেশন বোঝার জন্য)</li>
                    <li>• দিনের আলোতে ছবি তুলুন</li>
                  </ul>
                </div>
              </div>
            )}
            {/* ========== স্টেপ ৪: লোকেশন ========== */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    লোকেশন নির্বাচন করুন
                  </h2>
                  <p className="text-gray-500 text-sm">
                    সঠিক লোকেশন ছাড়া সমস্যার সমাধান করা কঠিন
                  </p>
                </div>

                {/* লোকেশন কার্ড */}
                {location ? (
                  <div className="border-2 border-green-300 bg-green-50 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-800">
                          লোকেশন সিলেক্ট করা হয়েছে
                        </p>
                        <p className="text-xs text-green-600">
                          {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 bg-white p-3 rounded-xl">
                      📍 {location.address || "ঠিকানা লোড হচ্ছে..."}
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">
                      এখনো লোকেশন নির্বাচন করা হয়নি
                    </p>
                  </div>
                )}

                {/* লোকেশন পিকার খোলার বাটন */}
                <button
                  type="button"
                  onClick={() => setShowLocationPicker(true)}
                  className="w-full flex items-center justify-center gap-2 p-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                >
                  <MapPin className="w-5 h-5" />
                  {location ? "লোকেশন পরিবর্তন করুন" : "লোকেশন নির্বাচন করুন"}
                </button>

                {/* লোকেশন পিকার মোডাল */}
                {showLocationPicker && (
                  <LocationPicker
                    onSelect={(loc) => {
                      setLocation(loc);
                      setLocationError("");
                      setErrors({});
                      setShowLocationPicker(false);
                    }}
                    onClose={() => setShowLocationPicker(false)}
                    initialLocation={location}
                  />
                )}

                <p className="text-xs text-gray-400 text-center">
                  ⚠️ সঠিক লোকেশন নির্বাচন করুন — ম্যাপে ট্যাপ করে বা সার্চ করে
                </p>
              </div>
            )}

            {/* ========== নেভিগেশন বাটন ========== */}
            <div className="flex gap-3 mt-8">
              {/* ব্যাক বাটন */}
              {currentStep > 1 && (
                <button
                  onClick={handlePrev}
                  className="flex-1 py-3.5 border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  আগে
                </button>
              )}

              {/* নেক্সট / সাবমিট বাটন */}
              {currentStep < 4 ? (
                <button
                  onClick={handleNext}
                  className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                >
                  পরবর্তী
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-200 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      জমা দেওয়া হচ্ছে...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      রিপোর্ট জমা দিন
                    </>
                  )}
                </button>
              )}
            </div>

            {/* স্টেপ ইন্ডিকেটর ডটস (মোবাইল) */}
            <div className="flex justify-center gap-2 mt-6 sm:hidden">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentStep === step.id
                      ? "bg-blue-600 w-6"
                      : currentStep > step.id
                        ? "bg-green-500"
                        : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
