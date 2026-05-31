// Global personalization presets — read/written via the Setting table.
// Source of truth; mirrored in admin/src/lib/personalization-presets.ts and
// site/src/lib/personalization-presets.ts.

import {
  DEFAULT_PRESETS,
  FONT_PRESETS,
  PLACEMENT_PRESETS,
  parsePersonalizationPresets,
  serializePersonalizationPresets,
  type CustomizationColor,
  type CustomizationOptions,
  type PersonalizationPresets,
} from "./customization";

export const PERSONALIZATION_PRESETS_KEY = "personalization_presets";

// Minimal structural prisma surface — avoids hard import from generated client.
type PrismaLike = {
  setting: {
    findUnique(args: { where: { key: string } }): Promise<{ key: string; value: string } | null>;
    upsert(args: {
      where: { key: string };
      update: { value: string };
      create: { key: string; value: string };
    }): Promise<unknown>;
  };
  product: {
    findMany(args?: { select?: { customizationOptions?: true } }): Promise<Array<{ customizationOptions: string | null }>>;
  };
};

function dedupeColors(colors: CustomizationColor[]): CustomizationColor[] {
  const seen = new Map<string, CustomizationColor>();
  for (const c of colors) {
    const key = c.name.toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    seen.set(key, c);
  }
  return Array.from(seen.values());
}

async function seedFromProducts(prisma: PrismaLike): Promise<PersonalizationPresets> {
  const rows = await prisma.product.findMany({ select: { customizationOptions: true } });
  const colors: CustomizationColor[] = [];
  const fontSet = new Set<string>();
  const placementSet = new Set<string>();
  let maxChars = 0;
  const upchargeCounts = new Map<number, number>();

  for (const row of rows) {
    const parsed = parsePersonalizationPresets(null); // placeholder, not used
    void parsed;
    const opts = parseCustomizationOptionsLocal(row.customizationOptions);
    if (!opts) continue;
    for (const c of opts.colors) colors.push(c);
    for (const f of opts.fonts) if (FONT_PRESETS.includes(f)) fontSet.add(f);
    for (const p of opts.placements) if (PLACEMENT_PRESETS.includes(p)) placementSet.add(p);
    if (opts.maxChars > maxChars) maxChars = opts.maxChars;
    upchargeCounts.set(opts.upcharge, (upchargeCounts.get(opts.upcharge) ?? 0) + 1);
  }

  let defaultUpcharge = 0;
  let bestCount = 0;
  for (const [val, count] of upchargeCounts) {
    if (count > bestCount) {
      bestCount = count;
      defaultUpcharge = val;
    }
  }

  const fonts = fontSet.size ? FONT_PRESETS.filter((f) => fontSet.has(f)) : [...DEFAULT_PRESETS.fonts];
  const placements = placementSet.size
    ? PLACEMENT_PRESETS.filter((p) => placementSet.has(p))
    : [...DEFAULT_PRESETS.placements];

  return {
    colors: dedupeColors(colors),
    fonts,
    placements,
    defaultMaxChars: maxChars > 0 ? maxChars : DEFAULT_PRESETS.defaultMaxChars,
    defaultUpcharge,
  };
}

// Tiny local re-implementation to avoid a cycle: only the bits we use here.
function parseCustomizationOptionsLocal(raw: string | null) {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (!o || typeof o !== "object") return null;
    const colorsRaw = Array.isArray(o.colors) ? o.colors : [];
    const colors: CustomizationColor[] = [];
    for (const c of colorsRaw) {
      if (!c || typeof c !== "object") continue;
      const cc = c as Record<string, unknown>;
      const name = typeof cc.name === "string" ? cc.name.trim() : "";
      const hex = typeof cc.hex === "string" ? cc.hex.trim() : "";
      if (!name || !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)) continue;
      colors.push({ name, hex });
    }
    const fonts = Array.isArray(o.fonts) ? (o.fonts.filter((f) => typeof f === "string") as string[]) : [];
    const placements = Array.isArray(o.placements)
      ? (o.placements.filter((p) => typeof p === "string") as string[])
      : [];
    const mc = Number(o.maxChars);
    const maxChars = Number.isFinite(mc) ? Math.floor(mc) : 15;
    const up = Number(o.upcharge);
    const upcharge = Number.isFinite(up) && up >= 0 ? Math.round(up * 100) / 100 : 0;
    return { colors, fonts, placements, maxChars, upcharge };
  } catch {
    return null;
  }
}

export async function getPersonalizationPresets(prisma: PrismaLike): Promise<PersonalizationPresets> {
  const row = await prisma.setting.findUnique({ where: { key: PERSONALIZATION_PRESETS_KEY } });
  if (row) {
    const parsed = parsePersonalizationPresets(row.value);
    if (parsed) return parsed;
  }
  const seeded = await seedFromProducts(prisma);
  await prisma.setting.upsert({
    where: { key: PERSONALIZATION_PRESETS_KEY },
    update: { value: serializePersonalizationPresets(seeded) },
    create: { key: PERSONALIZATION_PRESETS_KEY, value: serializePersonalizationPresets(seeded) },
  });
  return seeded;
}

export async function savePersonalizationPresets(
  prisma: PrismaLike,
  presets: PersonalizationPresets
): Promise<void> {
  const parsed = parsePersonalizationPresets(presets) ?? DEFAULT_PRESETS;
  const value = serializePersonalizationPresets(parsed);
  await prisma.setting.upsert({
    where: { key: PERSONALIZATION_PRESETS_KEY },
    update: { value },
    create: { key: PERSONALIZATION_PRESETS_KEY, value },
  });
}

/**
 * Returns a new CustomizationOptions where colors/fonts/placements arrays come
 * from the global presets unless the product opts into its own list via the
 * corresponding *Override flag. Returns null if disabled / missing.
 */
export function resolveCustomizationOptions(
  productOpts: CustomizationOptions | null,
  presets: PersonalizationPresets
): CustomizationOptions | null {
  if (!productOpts || !productOpts.enabled) return null;
  return {
    ...productOpts,
    colors: productOpts.colorsOverride ? productOpts.colors : presets.colors,
    fonts: productOpts.fontsOverride ? productOpts.fonts : presets.fonts,
    placements: productOpts.placementsOverride ? productOpts.placements : presets.placements,
  };
}
