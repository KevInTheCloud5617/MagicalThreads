import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const ADMIN_COOKIE = "mt_admin_session";

// In-memory session store
const activeSessions = new Map<string, { createdAt: number }>();

function cleanSessions() {
  const maxAge = 24 * 60 * 60 * 1000;
  const now = Date.now();
  for (const [token, session] of activeSessions) {
    if (now - session.createdAt > maxAge) activeSessions.delete(token);
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  cleanSessions();
  return activeSessions.has(token);
}

export function createAdminSession(): string {
  cleanSessions();
  const token = randomUUID();
  activeSessions.set(token, { createdAt: Date.now() });
  return token;
}

export function getAdminCookieName() {
  return ADMIN_COOKIE;
}

/**
 * Get the user's first name from Cloudflare Access headers/JWT.
 */
export async function getUserFirstName(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const jwt = cookieStore.get("CF_Authorization")?.value;
    if (jwt) {
      const payload = JSON.parse(
        Buffer.from(jwt.split(".")[1], "base64").toString("utf-8")
      );
      if (payload.given_name) return payload.given_name;
      if (payload.name) return payload.name.split(" ")[0];
    }
  } catch {}

  try {
    const { headers } = await import("next/headers");
    const headerStore = await headers();
    const email = headerStore.get("cf-access-authenticated-user-email");
    if (email) {
      const local = email.split("@")[0];
      const firstName = local.split(/[._\-0-9]/)[0];
      return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    }
  } catch {}

  return null;
}
