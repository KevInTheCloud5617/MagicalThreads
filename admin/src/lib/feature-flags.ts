// Feature-flag resolution and helpers (server + client safe).
// Resolution order (first match wins):
//   1. Query override ?ff=name / ?ff=-name (persisted in cookie 'ff-overrides')
//   2. Cookie overrides (set by middleware from earlier ?ff= visits)
//   3. Host-based defaults from FEATURE_FLAGS_BY_HOST env
//   4. Global defaults from FEATURE_FLAGS env
//   5. Off

export type FeatureFlag = "embroidery" | "wholesale" | "ai-recs";

export const FEATURE_FLAG_COOKIE = "ff-overrides";
export const FEATURE_FLAG_COOKIE_MAX_AGE = 60 * 60 * 24; // 24h

export type FeatureContext = {
  host?: string | null;
  searchParams?: URLSearchParams | null;
  cookieOverrides?: Record<string, boolean>;
};

function normaliseHost(host?: string | null): string {
  if (!host) return "";
  return host.split(":")[0].trim().toLowerCase();
}

export function parseGlobalFlags(raw: string | undefined): Set<string> {
  const out = new Set<string>();
  if (!raw) return out;
  for (const part of raw.split(",")) {
    const v = part.trim();
    if (v) out.add(v);
  }
  return out;
}

export function parseHostFlags(raw: string | undefined): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  if (!raw) return map;
  for (const block of raw.split(";")) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const host = trimmed.slice(0, eq).trim().toLowerCase();
    if (!host) continue;
    const flagsRaw = trimmed.slice(eq + 1);
    const set = new Set<string>();
    for (const f of flagsRaw.split(",")) {
      const v = f.trim();
      if (v) set.add(v);
    }
    map.set(host, set);
  }
  return map;
}

export function parseQueryOverrides(searchParams?: URLSearchParams | null): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  if (!searchParams) return out;
  const values = searchParams.getAll("ff");
  for (const raw of values) {
    if (!raw) continue;
    for (const piece of raw.split(",")) {
      const v = piece.trim();
      if (!v) continue;
      if (v.startsWith("-")) out[v.slice(1)] = false;
      else out[v] = true;
    }
  }
  return out;
}

export function parseOverrideCookie(raw: string | undefined): Record<string, boolean> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "boolean") out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export function serializeOverrideCookie(overrides: Record<string, boolean>): string {
  return JSON.stringify(overrides);
}

export function mergeOverrides(
  cookie: Record<string, boolean>,
  query: Record<string, boolean>
): Record<string, boolean> {
  return { ...cookie, ...query };
}

export function isFeatureEnabled(name: FeatureFlag | string, ctx: FeatureContext): boolean {
  // Query takes precedence (already merged into overrides typically)
  if (ctx.searchParams) {
    const queryOverrides = parseQueryOverrides(ctx.searchParams);
    if (name in queryOverrides) return queryOverrides[name];
  }
  if (ctx.cookieOverrides && name in ctx.cookieOverrides) return ctx.cookieOverrides[name];

  const host = normaliseHost(ctx.host);
  const hostMap = parseHostFlags(process.env.FEATURE_FLAGS_BY_HOST);
  if (host && hostMap.has(host)) {
    if (hostMap.get(host)!.has(name)) return true;
  }

  const global = parseGlobalFlags(process.env.FEATURE_FLAGS);
  if (global.has(name)) return true;

  return false;
}

// Server helper using next/headers (App Router only).
export async function getServerFeature(name: FeatureFlag): Promise<boolean> {
  const { headers, cookies } = await import("next/headers");
  const h = await headers();
  const c = await cookies();
  const host =
    (h.get("x-forwarded-host") || "").split(",")[0].trim() || h.get("host") || "";
  const cookieRaw = c.get(FEATURE_FLAG_COOKIE)?.value;
  return isFeatureEnabled(name, {
    host,
    cookieOverrides: parseOverrideCookie(cookieRaw),
  });
}

// Build the initial flag snapshot for a request — useful for SSR layout to inject into client.
export async function getServerFlagSnapshot(): Promise<Record<FeatureFlag, boolean>> {
  const flags: FeatureFlag[] = ["embroidery", "wholesale", "ai-recs"];
  const out = {} as Record<FeatureFlag, boolean>;
  for (const f of flags) out[f] = await getServerFeature(f);
  return out;
}
