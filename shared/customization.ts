// Shared types + validators for embroidery customization.
// customizationOptions / customization are stored as JSON-encoded strings
// (Azure SQL Server has no native JSON column type).
//
// NOTE: This file is the source of truth. Mirrored in
//   admin/src/lib/customization.ts
//   site/src/lib/customization.ts
// Keep all three in sync.

export type CustomizationType = "text" | "name" | "monogram" | "word";
export const CUSTOMIZATION_TYPES: CustomizationType[] = ["text", "name", "monogram", "word"];
export const FONT_PRESETS = ["Script", "Block", "Varsity", "Cursive", "Serif"];
export const PLACEMENT_PRESETS = ["Chest", "Sleeve", "Back", "Hem"];

export type CustomizationColor = { name: string; hex: string };

export type CustomizationOptions = {
  enabled: boolean;
  types: CustomizationType[];
  maxChars: number;
  colors: CustomizationColor[];
  fonts: string[];
  placements: string[];
  upcharge: number;
  // When true, the corresponding array is product-specific; when false/undefined
  // the storefront falls back to the global PersonalizationPresets library.
  colorsOverride?: boolean;
  fontsOverride?: boolean;
  placementsOverride?: boolean;
};

export type Customization = {
  text: string;
  color: CustomizationColor;
  font: string;
  placement: string;
  upcharge: number;
};

export type PersonalizationPresets = {
  colors: CustomizationColor[];
  fonts: string[];      // subset of FONT_PRESETS
  placements: string[]; // subset of PLACEMENT_PRESETS
  defaultMaxChars: number;
  defaultUpcharge: number;
};

export const DEFAULT_PRESETS: PersonalizationPresets = {
  colors: [],
  fonts: [...FONT_PRESETS],
  placements: [...PLACEMENT_PRESETS],
  defaultMaxChars: 15,
  defaultUpcharge: 0,
};

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function parseCustomizationOptions(raw: unknown): CustomizationOptions | null {
  if (raw == null) return null;
  let obj: unknown = raw;
  if (typeof raw === "string") {
    if (!raw.trim()) return null;
    try {
      obj = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  const enabled = Boolean(o.enabled);
  const types = Array.isArray(o.types)
    ? (o.types.filter((t) => typeof t === "string" && CUSTOMIZATION_TYPES.includes(t as CustomizationType)) as CustomizationType[])
    : [];
  const maxChars = clampInt(o.maxChars, 1, 50, 15);
  const colors = parseColorList(o.colors);
  const fonts = Array.isArray(o.fonts)
    ? (o.fonts.filter((f) => typeof f === "string" && FONT_PRESETS.includes(f)) as string[])
    : [];
  const placements = Array.isArray(o.placements)
    ? (o.placements.filter((p) => typeof p === "string" && PLACEMENT_PRESETS.includes(p)) as string[])
    : [];
  const upcharge = Number(o.upcharge);
  const out: CustomizationOptions = {
    enabled,
    types,
    maxChars,
    colors,
    fonts,
    placements,
    upcharge: Number.isFinite(upcharge) && upcharge >= 0 ? Math.round(upcharge * 100) / 100 : 0,
  };
  if (typeof o.colorsOverride === "boolean") out.colorsOverride = o.colorsOverride;
  if (typeof o.fontsOverride === "boolean") out.fontsOverride = o.fontsOverride;
  if (typeof o.placementsOverride === "boolean") out.placementsOverride = o.placementsOverride;
  return out;
}

function parseColorList(raw: unknown): CustomizationColor[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c) => {
      if (!c || typeof c !== "object") return null;
      const cc = c as Record<string, unknown>;
      const name = typeof cc.name === "string" ? cc.name.trim().slice(0, 40) : "";
      const hex = typeof cc.hex === "string" ? cc.hex.trim() : "";
      if (!name || !HEX_RE.test(hex)) return null;
      return { name, hex } as CustomizationColor;
    })
    .filter((c): c is CustomizationColor => Boolean(c));
}

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

export function serializeCustomizationOptions(opts: CustomizationOptions | null): string | null {
  if (!opts) return null;
  return JSON.stringify(opts);
}

export function parsePersonalizationPresets(raw: unknown): PersonalizationPresets | null {
  if (raw == null) return null;
  let obj: unknown = raw;
  if (typeof raw === "string") {
    if (!raw.trim()) return null;
    try {
      obj = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  const colors = parseColorList(o.colors);
  const fonts = Array.isArray(o.fonts)
    ? (o.fonts.filter((f) => typeof f === "string" && FONT_PRESETS.includes(f)) as string[])
    : [...FONT_PRESETS];
  const placements = Array.isArray(o.placements)
    ? (o.placements.filter((p) => typeof p === "string" && PLACEMENT_PRESETS.includes(p)) as string[])
    : [...PLACEMENT_PRESETS];
  const defaultMaxChars = clampInt(o.defaultMaxChars, 1, 50, 15);
  const upRaw = Number(o.defaultUpcharge);
  const defaultUpcharge = Number.isFinite(upRaw) && upRaw >= 0 ? Math.round(upRaw * 100) / 100 : 0;
  return { colors, fonts, placements, defaultMaxChars, defaultUpcharge };
}

export function serializePersonalizationPresets(p: PersonalizationPresets): string {
  return JSON.stringify(p);
}

export type CustomizationValidationResult =
  | { ok: true; value: Customization }
  | { ok: false; error: string };

export function validateCustomizationAgainstOptions(
  rawInput: unknown,
  options: CustomizationOptions | null
): CustomizationValidationResult {
  if (rawInput == null) return { ok: false, error: "No customization provided" };
  if (!options || !options.enabled) return { ok: false, error: "Personalization not allowed for this product" };

  let obj: unknown = rawInput;
  if (typeof rawInput === "string") {
    try {
      obj = JSON.parse(rawInput);
    } catch {
      return { ok: false, error: "Invalid customization payload" };
    }
  }
  if (!obj || typeof obj !== "object") return { ok: false, error: "Invalid customization payload" };
  const o = obj as Record<string, unknown>;

  const text = typeof o.text === "string" ? o.text.trim() : "";
  if (!text) return { ok: false, error: "Personalization text is required" };
  if (text.length > options.maxChars) return { ok: false, error: `Text exceeds ${options.maxChars} characters` };

  const colorIn = o.color && typeof o.color === "object" ? (o.color as Record<string, unknown>) : null;
  const colorName = colorIn && typeof colorIn.name === "string" ? colorIn.name : "";
  const allowedColor = options.colors.find((c) => c.name === colorName);
  if (!allowedColor) return { ok: false, error: "Invalid color selection" };

  const font = typeof o.font === "string" ? o.font : "";
  if (!options.fonts.includes(font)) return { ok: false, error: "Invalid font selection" };

  const placement = typeof o.placement === "string" ? o.placement : "";
  if (!options.placements.includes(placement)) return { ok: false, error: "Invalid placement selection" };

  return {
    ok: true,
    value: {
      text,
      color: allowedColor,
      font,
      placement,
      upcharge: options.upcharge,
    },
  };
}

export function parseCustomization(raw: unknown): Customization | null {
  if (raw == null) return null;
  let obj: unknown = raw;
  if (typeof raw === "string") {
    if (!raw.trim()) return null;
    try {
      obj = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  const text = typeof o.text === "string" ? o.text : "";
  const color = o.color as CustomizationColor | undefined;
  const font = typeof o.font === "string" ? o.font : "";
  const placement = typeof o.placement === "string" ? o.placement : "";
  const upcharge = Number(o.upcharge ?? 0);
  if (!text || !color?.name || !color?.hex) return null;
  return { text, color, font, placement, upcharge: Number.isFinite(upcharge) ? upcharge : 0 };
}

export function serializeCustomization(c: Customization | null): string | null {
  if (!c) return null;
  return JSON.stringify(c);
}
