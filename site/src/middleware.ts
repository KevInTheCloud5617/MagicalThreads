import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Allow root landing page
  if (path === "/") return NextResponse.next();

  // Allow all admin routes
  if (path.startsWith("/admin")) return NextResponse.next();

  // Allow admin API routes
  if (path.startsWith("/api/admin")) return NextResponse.next();

  // Allow Next.js internals and static assets
  if (path.startsWith("/_next") || path.startsWith("/favicon") || path.endsWith(".png") || path.endsWith(".jpg") || path.endsWith(".ico")) return NextResponse.next();

  // Block everything else — redirect to home
  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
