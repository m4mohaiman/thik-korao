import Link from "next/link";

export default function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center p-4 text-center bg-gray-50">
      <div className="text-7xl mb-4">🔍</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">৪০৪</h1>
      <p className="text-gray-500 mb-6">পেজটি পাওয়া যায়নি</p>
      <Link
        href="/"
        className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
      >
        হোমে ফিরে যান
      </Link>
    </div>
  );
}