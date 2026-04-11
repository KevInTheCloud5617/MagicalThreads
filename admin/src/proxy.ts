import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function applySecurityHeaders(response: NextResponse) {
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' https: data: blob:; connect-src 'self' https:; form-action 'self'; upgrade-insecure-requests"
  );
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  response.headers.set("X-Frame-Options", "DENY");

  return response;
}

function isAuthenticated(request: NextRequest) {
  return Boolean(
    request.cookies.get("CF_Authorization")?.value ||
      request.cookies.get("mt_admin_session")?.value
  );
}

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isStaticAsset =
    path.startsWith("/_next") ||
    path.startsWith("/favicon") ||
    /\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map|txt|xml)$/i.test(path);

  if (!isStaticAsset) {
    const response = applySecurityHeaders(NextResponse.next());
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");

    const isAuthRoute = path.startsWith("/api/auth/login");
    const isPublicPage = path === "/";

    if (!isPublicPage && !isAuthRoute && !isAuthenticated(request)) {
      if (path.startsWith("/api/")) {
        const unauthorized = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        unauthorized.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
        return applySecurityHeaders(unauthorized);
      }
      return applySecurityHeaders(NextResponse.redirect(new URL("/", request.url)));
    }

    return response;
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
