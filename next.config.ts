/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Supabase ইমেজ allow
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    dangerouslyAllowSVG: true,
  },

  // ✅ পাবলিক এনভ ভেরিয়েবল
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
  },

  experimental: {
    workerThreads: false,
  },
};

module.exports = nextConfig;