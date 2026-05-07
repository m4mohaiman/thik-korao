// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;
// next.config.js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Leaflet CSS সাপোর্ট
  transpilePackages: ["react-leaflet", "leaflet"],
  
  // ✅ ইমেজ রিমোট
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

module.exports = nextConfig;