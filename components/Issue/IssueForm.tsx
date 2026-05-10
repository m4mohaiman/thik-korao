// src/components/Issue/IssueForm.tsx
"use client";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Camera, MapPin } from "lucide-react";
import { useIssueStore } from "@/stores/issueStore";
import { getCurrentPosition, reverseGeocode } from "@/lib/location";
import { compressImage } from "@/lib/image";
import { useRouter } from "next/navigation";
import Image from 'next/image'

const CATEGORIES = [
  { id: "road", label: "রাস্তা", icon: "🛣️" },
  { id: "electricity", label: "বিদ্যুৎ", icon: "💡" },
  { id: "water", label: "পানি", icon: "💧" },
  { id: "garbage", label: "ময়লা", icon: "🗑️" },
  { id: "drainage", label: "ড্রেনেজ", icon: "🌊" },
  { id: "other", label: "অন্যান্য", icon: "📌" },
];

export default function IssueForm() {
  const router = useRouter();
  const { addIssue } = useIssueStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const compressedImages = await Promise.all(
        Array.from(files).map(compressImage)
      );
      setImages([...images, ...compressedImages]);
    }
  };

  const handleGetLocation = async () => {
    setIsLocating(true);
    try {
      const position = await getCurrentPosition();
      const { latitude: lat, longitude: lng } = position.coords;
      const address = await reverseGeocode(lat, lng);
      setLocation({ lat, lng, address });
    } catch (error) {
      alert("লোকেশন পাওয়া যায়নি। দয়া করে লোকেশন পারমিশন দিন।");
    }
    setIsLocating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!location) {
    alert("দয়া করে লোকেশন নির্বাচন করুন");
    return;
  }

  setIsSubmitting(true);
  const deviceId = localStorage.getItem("deviceId") || uuidv4();
  localStorage.setItem("deviceId", deviceId);

  const issue = {
    id: uuidv4(),
    title,
    description,
    // ✅ এক লাইনে টাইপ কাস্ট:
    category: (
      ["road", "electricity", "water", "garbage", "drainage", "other"].includes(category) 
        ? category 
        : "other"
    ) as "road" | "electricity" | "water" | "garbage" | "drainage" | "other",
    images,
    location,
    status: "reported" as const,
    votes: 1,
    voted_by: [deviceId],
    created_by: deviceId,
    created_at: new Date(),
    updated_at: new Date(),
    comments: [],
  };

  await addIssue(issue);
  setIsSubmitting(false);
  router.push("/");
};

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">সমস্যা রিপোর্ট করুন</h1>

      {/* Category Selection */}
      <div className="grid grid-cols-3 gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={`p-4 rounded-lg border-2 transition-all ${
              category === cat.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-blue-300"
            }`}
          >
            <div className="text-2xl">{cat.icon}</div>
            <div className="text-sm mt-1">{cat.label}</div>
          </button>
        ))}
      </div>

      {/* Title */}
      <input
        type="text"
        placeholder="সমস্যার শিরোনাম"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-3 border rounded-lg"
        required
      />

      {/* Description */}
      <textarea
        placeholder="বিস্তারিত বর্ণনা লিখুন..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full p-3 border rounded-lg h-32"
        required
      />

      {/* Image Upload */}
      <div>
        <label className="flex items-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-blue-400">
          <Camera className="w-5 h-5" />
          <span>ছবি তুলুন বা আপলোড করুন</span>
          <input
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={handleImageCapture}
            className="hidden"
          />
        </label>
        {images.length > 0 && (
          <div className="flex gap-2 mt-3 overflow-x-auto">
            {images.map((img, i) => (
              <Image
                width={300}
                height={300}
                key={i}
                src={img}
                alt={`Preview ${i + 1}`}
                className="w-20 h-20 object-cover rounded-lg"
              />
            ))}
          </div>
        )}
      </div>

      {/* Location */}
      <button
        type="button"
        onClick={handleGetLocation}
        disabled={isLocating}
        className="w-full p-3 border-2 rounded-lg flex items-center justify-center gap-2 hover:border-green-400 disabled:opacity-50"
      >
        <MapPin className="w-5 h-5" />
        {isLocating
          ? "লোকেশন নেওয়া হচ্ছে..."
          : location
          ? `📍 ${location.address?.slice(0, 50)}...`
          : "বর্তমান লোকেশন যোগ করুন"}
      </button>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? "জমা দেওয়া হচ্ছে..." : "রিপোর্ট জমা দিন"}
      </button>
    </form>
  );
}