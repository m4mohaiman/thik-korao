import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // ✅ এনভায়রনমেন্ট ভেরিয়েবল চেক
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // এনভ না থাকলে middleware skip
  if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ Supabase credentials missing in middleware");
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Get user (error-safe)
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    console.error("Middleware auth error:", error);
  }

  // Protected routes (লগইন required)
  const protectedPaths = ["/report", "/dashboard"];

  if (
    !user &&
    protectedPaths.some((path) =>
      request.nextUrl.pathname.startsWith(path)
    )
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Admin-only routes
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch (error) {
      console.error("Profile fetch error in middleware:", error);
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Auth callback handling
  if (request.nextUrl.pathname.startsWith("/auth/callback")) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";

    if (code) {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          return NextResponse.redirect(`${origin}${next}`);
        }
      } catch (error) {
        console.error("Code exchange error:", error);
      }
    }

    return NextResponse.redirect(`${origin}/auth/login`);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/report",
    "/dashboard",
    "/dashboard/:path*",
    "/auth/callback",
  ],
};