import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "./utils/supabase/middleware";

const handleI18nRouting = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Do not run next-intl on auth callbacks or api routes
  if (
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/api") ||
    pathname.includes("/auth/callback")
  ) {
    const { supabaseResponse } = await updateSession(request);
    return supabaseResponse;
  }

  // Handle i18n routing
  const response = handleI18nRouting(request);

  // Then update supabase session and sync cookies
  const { supabaseResponse } = await updateSession(request);

  // Merge cookies if any were updated by Supabase
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value, cookie);
  });

  return response;
}

export const config = {
  matcher: [
    "/",
    "/(ka|en)/:path*",
    "/((?!_next|_vercel|api|auth/callback|.*\\..*).*)",
  ],
};
