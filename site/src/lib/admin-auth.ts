import { cookies } from "next/headers";

const ADMIN_COOKIE = "mt_admin_session";
const ADMIN_TOKEN = "authenticated";

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === ADMIN_TOKEN;
}

export function getAdminCookieName() {
  return ADMIN_COOKIE;
}

export function getAdminToken() {
  return ADMIN_TOKEN;
}
