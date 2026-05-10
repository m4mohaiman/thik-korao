"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // ✅ SSR/Prerender-এ কল হলে ক্র্যাশ না করে ডামি রিটার্ন
  if (!supabaseUrl || !supabaseKey) {
    if (typeof window !== "undefined") {
      console.error("❌ Supabase credentials missing!");
    }
    // ডামি ক্লায়েন্ট (build ক্র্যাশ করবে না)
    return createBrowserClient(
      "https://placeholder.supabase.co",
      "placeholder-key"
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}