import { headers, cookies } from "next/headers";

/**
 * Get the user's first name from Cloudflare Access headers/JWT.
 * Returns null if no auth info available (local dev).
 */
export async function getUserFirstName(): Promise<string | null> {
  // Try JWT first for the best name
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
  } catch {
    // ignore decode errors
  }

  // Fallback: extract from email header
  try {
    const headerStore = await headers();
    const email = headerStore.get("cf-access-authenticated-user-email");
    if (email) {
      const local = email.split("@")[0];
      const firstName = local.split(/[._\-0-9]/)[0];
      return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    }
  } catch {
    // ignore
  }

  return null;
}
