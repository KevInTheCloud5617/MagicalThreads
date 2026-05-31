import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function applySecurityHeaders(response: NextResponse) {
  const isProd = process.env.NODE_ENV === "production";
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' https: data: blob:",
    "connect-src 'self' https:",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  response.headers.set("X-Frame-Options", "DENY");

  return response;
}

function getHosts(request: NextRequest) {
  const previewHost = (process.env.PREVIEW_HOST || "preview.magicalthreadswithmeg.com").toLowerCase();
  const forwardedHost = (request.headers.get("x-forwarded-host") || "").split(",")[0].trim();
  const hostHeader = request.headers.get("host") || "";
  const reqHost = (forwardedHost || hostHeader).split(":")[0].toLowerCase();
  return { previewHost, reqHost, isPreviewHost: reqHost === previewHost };
}

function checkPreviewAuth(request: NextRequest): NextResponse | null {
  const previewMode = process.env.PREVIEW_MODE === "true";
  if (!previewMode) return null;

  const { isPreviewHost } = getHosts(request);
  if (!isPreviewHost) return null;

  const username = process.env.PREVIEW_USERNAME || "preview";
  const password = process.env.PREVIEW_PASSWORD || "preview";

  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const [scheme, encoded] = authHeader.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = atob(encoded);
      const [u, p] = decoded.split(":");
      if (u === username && p === password) return null;
    }
  }

  return applySecurityHeaders(
    new NextResponse("Authentication required for preview", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Preview"' },
    })
  );
}

function applyFeatureFlagOverrides(request: NextRequest, response: NextResponse) {
  const ffValues = request.nextUrl.searchParams.getAll("ff");
  if (ffValues.length === 0) return response;

  const existingRaw = request.cookies.get("ff-overrides")?.value;
  let overrides: Record<string, boolean> = {};
  if (existingRaw) {
    try {
      const parsed = JSON.parse(existingRaw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === "boolean") overrides[k] = v;
        }
      }
    } catch {
      /* ignore */
    }
  }

  for (const raw of ffValues) {
    for (const piece of raw.split(",")) {
      const v = piece.trim();
      if (!v) continue;
      if (v.startsWith("-")) overrides[v.slice(1)] = false;
      else overrides[v] = true;
    }
  }

  response.cookies.set("ff-overrides", JSON.stringify(overrides), {
    maxAge: 60 * 60 * 24,
    path: "/",
    httpOnly: false,
    sameSite: "lax",
  });

  return response;
}

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const { isPreviewHost } = getHosts(request);

  if (path.startsWith("/admin")) return applySecurityHeaders(NextResponse.next());
  if (path.startsWith("/api/admin")) return applySecurityHeaders(NextResponse.next());
  if (path.startsWith("/api/webhooks/stripe")) return applySecurityHeaders(NextResponse.next());

  if (
    path.startsWith("/_next") ||
    path.startsWith("/favicon") ||
    path.endsWith(".png") ||
    path.endsWith(".jpg") ||
    path.endsWith(".ico")
  ) {
    return applySecurityHeaders(NextResponse.next());
  }

  const authResponse = checkPreviewAuth(request);
  if (authResponse) return authResponse;

  if (isPreviewHost && path === "/") {
    return applyFeatureFlagOverrides(request, applySecurityHeaders(NextResponse.rewrite(new URL("/shop", request.url))));
  }

  return applyFeatureFlagOverrides(request, applySecurityHeaders(NextResponse.next()));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
