"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_PRESETS,
  FONT_PRESETS,
  PLACEMENT_PRESETS,
  type PersonalizationPresets,
  type CustomizationColor,
} from "@/lib/customization";

const FONT_FAMILY: Record<string, string> = {
  Script: 'var(--font-script), "Brush Script MT", cursive',
  Block: 'var(--font-block), "Arial Black", Impact, sans-serif',
  Varsity: 'var(--font-varsity), Impact, "Arial Black", sans-serif',
  Cursive: 'var(--font-cursive), "Snell Roundhand", cursive',
  Serif: 'var(--font-serif-display), Georgia, "Times New Roman", serif',
};

type SaveState = "idle" | "saving" | "saved" | "error";

export default function PersonalizationSettingsPage() {
  const [presets, setPresets] = useState<PersonalizationPresets>(DEFAULT_PRESETS);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings/personalization")
      .then((r) => r.json())
      .then((data) => { if (data && !data.error) setPresets({ ...DEFAULT_PRESETS, ...data }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = (partial: Partial<PersonalizationPresets>) => setPresets((p) => ({ ...p, ...partial }));

  const updateColor = (idx: number, partial: Partial<CustomizationColor>) => {
    const next = [...presets.colors];
    next[idx] = { ...next[idx], ...partial };
    update({ colors: next });
  };

  async function handleSave() {
    setSaveState("saving");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/settings/personalization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(presets),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Save failed");
      }
      const saved = await res.json();
      setPresets({ ...DEFAULT_PRESETS, ...saved });
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch (err) {
      setSaveState("error");
      setErrorMsg(err instanceof Error ? err.message : "Save failed");
    }
  }

  if (loading) return <div className="p-4 md:p-8">Loading…</div>;

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Personalization</h1>
          <p className="text-sm text-gray-500">Shared color, font, and placement library used by all products that don&apos;t opt out.</p>
        </div>
      </div>

      <div className="space-y-6">
        <section className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">Color Library</h2>
            <button type="button" onClick={() => update({ colors: [...presets.colors, { name: "", hex: "#000000" }] })} className="text-xs px-2 py-1 rounded border">+ Add Color</button>
          </div>
          {presets.colors.length === 0 && <p className="text-xs text-gray-500">No colors yet.</p>}
          <div className="space-y-2">
            {presets.colors.map((c, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input type="text" value={c.name} placeholder="Color name" onChange={(e) => updateColor(idx, { name: e.target.value })} className="flex-1 px-2 py-1 rounded border text-sm" />
                <input type="color" value={c.hex} onChange={(e) => updateColor(idx, { hex: e.target.value })} className="w-10 h-8 border rounded" />
                <button type="button" onClick={() => update({ colors: presets.colors.filter((_, i) => i !== idx) })} className="text-xs px-2 py-1 rounded border text-red">Remove</button>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border rounded-xl p-4">
          <h2 className="font-semibold text-sm mb-3">Fonts</h2>
          <div className="flex flex-wrap gap-4">
            {FONT_PRESETS.map((f) => (
              <label key={f} className="text-sm flex items-center gap-1">
                <input type="checkbox" checked={presets.fonts.includes(f)} onChange={(e) => update({ fonts: e.target.checked ? [...presets.fonts, f] : presets.fonts.filter((x) => x !== f) })} />
                <span style={{ fontFamily: FONT_FAMILY[f] }}>{f}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="bg-white border rounded-xl p-4">
          <h2 className="font-semibold text-sm mb-3">Placements</h2>
          <div className="flex flex-wrap gap-4">
            {PLACEMENT_PRESETS.map((p) => (
              <label key={p} className="text-sm flex items-center gap-1">
                <input type="checkbox" checked={presets.placements.includes(p)} onChange={(e) => update({ placements: e.target.checked ? [...presets.placements, p] : presets.placements.filter((x) => x !== p) })} />
                {p}
              </label>
            ))}
          </div>
        </section>

        <section className="bg-white border rounded-xl p-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Default max characters</label>
            <input type="number" min={1} max={50} value={presets.defaultMaxChars} onChange={(e) => update({ defaultMaxChars: Math.max(1, Math.min(50, parseInt(e.target.value || "0", 10) || 1)) })} className="w-28 px-2 py-1 rounded border text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Default upcharge ($)</label>
            <input type="number" min={0} step={0.01} value={presets.defaultUpcharge} onChange={(e) => update({ defaultUpcharge: Math.max(0, parseFloat(e.target.value || "0") || 0) })} className="w-28 px-2 py-1 rounded border text-sm" />
          </div>
        </section>

        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saveState === "saving"} className="bg-navy text-white px-5 py-2.5 rounded-lg text-sm disabled:opacity-50">
            {saveState === "saving" ? "Saving…" : "Save"}
          </button>
          {saveState === "saved" && <span className="text-sm text-green">Saved ✓</span>}
          {saveState === "error" && <span className="text-sm text-red">{errorMsg ?? "Save failed"}</span>}
        </div>
      </div>
    </div>
  );
}
