import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const ADMIN_COOKIE = "mt_admin_session";

// In-memory session store. Tokens are random UUIDs, not guessable.
const activeSessions = new Map<string, { createdAt: number }>();

// Clean sessions older than 24h
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
