"use client";

import { useState, useEffect } from "react";
import { useFeature } from "@/lib/useFeature";
import {
  FONT_PRESETS,
  PLACEMENT_PRESETS,
  DEFAULT_PRESETS,
  type CustomizationOptions,
  type PersonalizationPresets,
} from "@/lib/customization";

const SIZE_OPTIONS = ["S", "M", "L", "XL", "2XL", "3XL"] as const;
type SizeKey = (typeof SIZE_OPTIONS)[number];
type SizesMap = Record<SizeKey, string>;
type AdditionalImage = { url: string; alt?: string; sortOrder: number };
type ProductColorOption = { name: string; hex: string; sortOrder: number };

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  drop?: string | null;
  description: string;
  tag?: string;
  image?: string;
  images?: Array<{ id?: string; url: string; alt?: string | null; sortOrder: number }>;
  active: boolean;
  hasSize: boolean;
  hasColor: boolean;
  sizes?: Array<{ size: string; stock: number }>;
  colors?: Array<{ name: string; hex: string; sortOrder: number }>;
  customizationOptions?: CustomizationOptions | null;
}

import { CATEGORIES } from "@/lib/catalog";

interface Drop {
  id: string;
  slug: string;
  name: string;
  emoji: string | null;
}

const emptySizes = (): SizesMap => ({ S: "0", M: "0", L: "0", XL: "0", "2XL": "0", "3XL": "0" });

const defaultCustomizationOptions = (): CustomizationOptions => ({
  enabled: false,
  types: [],
  maxChars: 15,
  colors: [],
  fonts: [],
  placements: [],
  upcharge: 0,
  showText: false,
  showColors: false,
  showFonts: false,
  showPlacements: false,
});

export default function ProductsPage() {
  const embroideryOn = useFeature("embroidery");
  const [products, setProducts] = useState<Product[]>([]);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [presets, setPresets] = useState<PersonalizationPresets>(DEFAULT_PRESETS);

  const emptyProduct = { name: "", price: "", stock: "0", category: "totes", drop: "" as string, description: "", tag: "", image: "", additionalImages: [] as AdditionalImage[], active: true, hasSize: false, sizes: emptySizes(), hasColor: false, colors: [] as ProductColorOption[], customizationOptions: defaultCustomizationOptions() };
  const [uploading, setUploading] = useState(false);
  const [uploadingAdditional, setUploadingAdditional] = useState(false);
  const [form, setForm] = useState(emptyProduct);

  useEffect(() => { fetchProducts(); fetchDrops(); }, []);

  async function fetchDrops() {
    const res = await fetch("/api/drops");
    const data = await res.json();
    setDrops(data);
  }

  useEffect(() => {
    if (!embroideryOn) return;
    fetch("/api/settings/personalization")
      .then((r) => r.json())
      .then((data) => { if (data && !data.error) setPresets({ ...DEFAULT_PRESETS, ...data }); })
      .catch(() => {});
  }, [embroideryOn]);

  const mapSizes = (sizes?: Array<{ size: string; stock: number }>): SizesMap => {
    const mapped = emptySizes();
    for (const size of sizes ?? []) if (SIZE_OPTIONS.includes(size.size as SizeKey)) mapped[size.size as SizeKey] = String(size.stock ?? 0);
    return mapped;
  };

  const normalizeAdditionalImages = (images: AdditionalImage[]) => images
    .filter((img) => img.url?.trim())
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((img, index) => ({ ...img, sortOrder: index }));

  async function fetchProducts() {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  }

  async function handleSave() {
    const priceNum = parseFloat(form.price);
    const stockNum = parseInt(form.stock, 10);
    if (!form.name || !priceNum || isNaN(priceNum)) return;
    if (isNaN(stockNum) || stockNum < 0) { alert("Stock quantity is required and must be 0 or more"); return; }
    if (form.hasColor) {
      const cleanColors = form.colors.filter((c) => c.name.trim() && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c.hex));
      if (cleanColors.length === 0) {
        alert("Add at least one color (with a name and a swatch) or uncheck \"This product has colors\".");
        return;
      }
    }

    const sizesPayload = Object.fromEntries(SIZE_OPTIONS.map((s) => [s, form.hasSize ? Math.max(0, parseInt(form.sizes[s], 10) || 0) : 0]));
    const additionalImages = normalizeAdditionalImages(form.additionalImages);
    const colorsPayload = form.hasColor
      ? form.colors
          .filter((c) => c.name.trim() && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c.hex))
          .map((c, index) => ({ name: c.name.trim(), hex: c.hex, sortOrder: index }))
      : [];
    const method = editing ? "PUT" : "POST";
    const body = editing
      ? { ...form, id: editing.id, price: priceNum, stock: stockNum, sizes: sizesPayload, additionalImages, colors: colorsPayload }
      : { ...form, price: priceNum, stock: stockNum, sizes: sizesPayload, additionalImages, colors: colorsPayload };

    await fetch("/api/products", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

    setShowForm(false);
    setEditing(null);
    setForm(emptyProduct);
    fetchProducts();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    await fetch("/api/products", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    fetchProducts();
  }

  async function handleToggleActive(product: Product) {
    await fetch("/api/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: product.id, active: !product.active, additionalImages: (product.images ?? []).map((img, index) => ({ url: img.url, alt: img.alt ?? undefined, sortOrder: index })), sizes: Object.fromEntries(SIZE_OPTIONS.map((s) => [s, Number(product.sizes?.find((x) => x.size === s)?.stock ?? 0)])) }),
    });
    fetchProducts();
  }

  async function uploadPhoto(file: File): Promise<string | null> {
    const sku = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "product";
    const fd = new FormData();
    fd.append("file", file);
    fd.append("sku", sku);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const json = await res.json();
    if (json.url) return json.url;
    alert(json.error || "Upload failed");
    return null;
  }

  const moveAdditionalImage = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= form.additionalImages.length) return;
    const next = [...form.additionalImages];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setForm((prev) => ({ ...prev, additionalImages: next.map((img, idx) => ({ ...img, sortOrder: idx })) }));
  };

  const filtered = filter ? products.filter((p) => p.category === filter) : products;

  return <div className="p-4 md:p-8">
    <div className="flex items-center justify-between mb-8"><div><h1 className="text-2xl font-bold text-navy">Products</h1></div><button onClick={() => { setEditing(null); setForm({ ...emptyProduct, customizationOptions: { ...defaultCustomizationOptions(), maxChars: presets.defaultMaxChars, upcharge: presets.defaultUpcharge } }); setShowForm(true); }} className="bg-gold text-navy font-semibold px-5 py-2.5 rounded-lg text-sm">+ Add Product</button></div>

    <div className="flex gap-2 mb-6 flex-wrap"><button onClick={() => setFilter(null)} className={`px-4 py-2 rounded-lg text-sm ${filter === null ? "bg-navy text-white" : "bg-white border"}`}>All ({products.length})</button>{CATEGORIES.map((cat) => <button key={cat.slug} onClick={() => setFilter(cat.slug)} className={`px-4 py-2 rounded-lg text-sm ${filter === cat.slug ? "bg-navy text-white" : "bg-white border"}`}>{cat.emoji} {cat.name}</button>)}</div>

    {showForm && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 md:p-4"><div className="bg-white md:rounded-2xl p-6 pb-[calc(env(safe-area-inset-bottom)+6rem)] md:pb-6 w-full h-full md:h-auto md:max-h-[90vh] md:max-w-lg shadow-xl overflow-y-auto"><h3 className="text-lg font-bold mb-4">{editing ? "Edit Product" : "Add Product"}</h3>
      <div className="space-y-4">
        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" placeholder="Product name" />
        <div className="grid grid-cols-3 gap-4"><input type="text" inputMode="decimal" value={form.price} onChange={(e) => { const val = e.target.value; if (val === "" || /^\d+\.?\d{0,2}$/.test(val)) setForm({ ...form, price: val }); }} className="w-full px-3 py-2 rounded-lg border text-sm" placeholder="25.00" />{!form.hasSize && <input type="number" min="0" step="1" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" placeholder="Stock" />}<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm">{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></div>
        <div>
          <label className="block text-xs font-medium mb-1 text-gray-600">Drop (Collection)</label>
          <select value={form.drop || ""} onChange={(e) => setForm({ ...form, drop: e.target.value || "" })} className="w-full px-3 py-2 rounded-lg border text-sm">
            <option value="">No drop (general catalog)</option>
            {drops.map((d) => <option key={d.slug} value={d.slug}>{d.emoji} {d.name}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.hasSize} onChange={(e) => setForm({ ...form, hasSize: e.target.checked })} />This product has sizes</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.hasColor} onChange={(e) => setForm({ ...form, hasColor: e.target.checked, colors: e.target.checked && form.colors.length === 0 ? [{ name: "", hex: "#000000", sortOrder: 0 }] : form.colors })} />This product comes in multiple colors</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border text-sm" placeholder="Description" />
        {form.hasSize && <div className="border rounded-lg p-3"><p className="text-sm font-semibold mb-2">Size stock</p><div className="grid grid-cols-3 gap-3">{SIZE_OPTIONS.map((s) => <div key={s}><label className="block text-xs mb-1">{s}</label><input type="number" min={0} step={1} value={form.sizes[s]} onChange={(e) => setForm({ ...form, sizes: { ...form.sizes, [s]: e.target.value } })} className="w-full px-2 py-2 rounded-lg border text-sm" /></div>)}</div></div>}

        {form.hasColor && <div className="border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">Colors</p>
            <button type="button" onClick={() => setForm({ ...form, colors: [...form.colors, { name: "", hex: "#000000", sortOrder: form.colors.length }] })} className="text-xs px-2 py-1 rounded border">+ Add color</button>
          </div>
          <p className="text-[11px] text-gray-500 mb-2">Buyer will pick one of these from a dropdown on the product page. The name shows on the order so you know what to make.</p>
          {form.colors.length === 0 ? (
            <p className="text-xs text-gray-500">No colors yet — click "Add color".</p>
          ) : (
            <div className="space-y-2">
              {form.colors.map((c, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input type="text" value={c.name} placeholder="Color name (e.g. Pink)" onChange={(e) => { const next = [...form.colors]; next[idx] = { ...next[idx], name: e.target.value }; setForm({ ...form, colors: next }); }} className="flex-1 px-2 py-1.5 rounded border text-sm" />
                  <input type="color" value={c.hex} onChange={(e) => { const next = [...form.colors]; next[idx] = { ...next[idx], hex: e.target.value }; setForm({ ...form, colors: next }); }} className="w-10 h-8 border rounded" />
                  <div className="flex flex-col gap-1">
                    <button type="button" disabled={idx === 0} onClick={() => { if (idx === 0) return; const next = [...form.colors]; [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]; setForm({ ...form, colors: next.map((c, i) => ({ ...c, sortOrder: i })) }); }} className="text-xs px-2 py-0.5 rounded border disabled:opacity-30">↑</button>
                    <button type="button" disabled={idx === form.colors.length - 1} onClick={() => { if (idx === form.colors.length - 1) return; const next = [...form.colors]; [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]]; setForm({ ...form, colors: next.map((c, i) => ({ ...c, sortOrder: i })) }); }} className="text-xs px-2 py-0.5 rounded border disabled:opacity-30">↓</button>
                  </div>
                  <button type="button" onClick={() => setForm({ ...form, colors: form.colors.filter((_, i) => i !== idx).map((c, i) => ({ ...c, sortOrder: i })) })} className="text-xs px-2 py-1 rounded border text-red">Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>}

        <div>
          <label className="block text-sm font-medium mb-1">Primary Photo (Hero)</label>
          {form.image ? (
            <div className="flex items-center gap-3">
              <img src={form.image} alt="Primary preview" className="w-20 h-20 object-cover rounded-lg border" />
              <button type="button" onClick={() => setForm({ ...form, image: "" })} className="text-sm text-red hover:text-red/70">Remove</button>
            </div>
          ) : (
            <label className={`flex items-center justify-center gap-2 w-full px-3 py-3 rounded-lg border-2 border-dashed border-gray-200 text-sm cursor-pointer hover:border-gold/50 hover:bg-gold/5 transition-all ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                try {
                  const url = await uploadPhoto(file);
                  if (url) setForm((prev) => ({ ...prev, image: url }));
                } catch {
                  alert("Upload failed");
                } finally {
                  setUploading(false);
                }
              }} />
              {uploading ? "⏳ Uploading..." : "📷 Upload Hero Photo"}
            </label>
          )}
        </div>

        <div className="border rounded-lg p-3">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium">Additional Photos</label>
            <label className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-xs cursor-pointer ${uploadingAdditional ? "opacity-50 pointer-events-none" : "hover:bg-gray-50"}`}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingAdditional(true);
                  try {
                    const url = await uploadPhoto(file);
                    if (url) {
                      setForm((prev) => ({
                        ...prev,
                        additionalImages: [...prev.additionalImages, { url, sortOrder: prev.additionalImages.length }],
                      }));
                    }
                  } catch {
                    alert("Upload failed");
                  } finally {
                    setUploadingAdditional(false);
                  }
                }}
              />
              {uploadingAdditional ? "⏳ Uploading..." : "+ Add Photo"}
            </label>
          </div>

          {form.additionalImages.length === 0 ? (
            <p className="text-xs text-gray-500">No additional photos yet.</p>
          ) : (
            <div className="space-y-2">
              {form.additionalImages.map((img, index) => (
                <div key={`${img.url}-${index}`} className="flex items-center gap-3 border rounded-lg p-2">
                  <img src={img.url} alt={img.alt || `Additional ${index + 1}`} className="w-16 h-16 object-cover rounded-md border" />
                  <input
                    type="text"
                    value={img.alt || ""}
                    placeholder="Alt text (optional)"
                    onChange={(e) => {
                      const next = [...form.additionalImages];
                      next[index] = { ...next[index], alt: e.target.value };
                      setForm((prev) => ({ ...prev, additionalImages: next }));
                    }}
                    className="flex-1 px-2 py-1.5 rounded border text-xs"
                  />
                  <div className="flex flex-col gap-1">
                    <button type="button" onClick={() => moveAdditionalImage(index, -1)} className="text-xs px-2 py-1 rounded border disabled:opacity-30" disabled={index === 0}>↑</button>
                    <button type="button" onClick={() => moveAdditionalImage(index, 1)} className="text-xs px-2 py-1 rounded border disabled:opacity-30" disabled={index === form.additionalImages.length - 1}>↓</button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, additionalImages: prev.additionalImages.filter((_, i) => i !== index).map((x, idx) => ({ ...x, sortOrder: idx })) }))}
                    className="text-xs px-2 py-1 rounded border text-red"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <input type="text" value={form.tag || ""} onChange={(e) => setForm({ ...form, tag: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" placeholder="Tag" />

        {embroideryOn && (() => {
          const co = form.customizationOptions;
          const setCO = (partial: Partial<CustomizationOptions>) => setForm((prev) => ({ ...prev, customizationOptions: { ...prev.customizationOptions, ...partial } }));
          const fontFamilyMap: Record<string, string> = {
            Script: 'var(--font-script), "Brush Script MT", cursive',
            Block: 'var(--font-block), "Arial Black", Impact, sans-serif',
            Varsity: 'var(--font-varsity), Impact, "Arial Black", sans-serif',
            Cursive: 'var(--font-cursive), "Snell Roundhand", cursive',
            Serif: 'var(--font-serif-display), Georgia, "Times New Roman", serif',
          };
          const overrideToggle = (label: string, on: boolean, onChange: (next: boolean) => void) => (
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold">{label}</label>
              <button
                type="button"
                onClick={() => onChange(!on)}
                className={`text-[11px] px-2 py-0.5 rounded border ${on ? "bg-gold/20 border-gold text-navy" : "text-gray-600"}`}
              >
                {on ? "Customize for this product" : "Using global"}
              </button>
            </div>
          );
          const anyOn = Boolean(co.showText || co.showColors || co.showFonts || co.showPlacements);
          // Keep `enabled` in sync — server-side validators key off it.
          if (co.enabled !== anyOn) {
            // Defer the update to avoid setState during render in React's strict mode.
            setTimeout(() => setCO({ enabled: anyOn }), 0);
          }
          const sectionToggle = (label: string, on: boolean, onChange: (next: boolean) => void) => (
            <label className="flex items-center justify-between gap-2 text-sm py-1.5 border-b last:border-b-0">
              <span className="font-medium text-navy">{label}</span>
              <input
                type="checkbox"
                checked={on}
                onChange={(e) => onChange(e.target.checked)}
                className="w-4 h-4"
              />
            </label>
          );
          return (
            <details className="border rounded-lg p-3" open={anyOn}>
              <summary className="text-sm font-semibold cursor-pointer">Personalization</summary>
              <div className="mt-3 space-y-3">
                <div className="bg-gray-50/60 border rounded p-2">
                  {sectionToggle("Text input", Boolean(co.showText), (next) => setCO({ showText: next }))}
                  {sectionToggle("Thread color", Boolean(co.showColors), (next) => setCO({ showColors: next }))}
                  {sectionToggle("Font", Boolean(co.showFonts), (next) => setCO({ showFonts: next }))}
                  {sectionToggle("Placement", Boolean(co.showPlacements), (next) => setCO({ showPlacements: next }))}
                </div>
                {!anyOn && (
                  <p className="text-xs text-gray-500">Turn on at least one option above to enable personalization for this product.</p>
                )}
                {anyOn && (
                  <div className="space-y-3">
                    {co.showText && (
                    <div>
                      <label className="block text-xs font-semibold mb-1">Max characters</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={co.maxChars}
                        onChange={(e) => setCO({ maxChars: Math.max(1, Math.min(50, parseInt(e.target.value || "0", 10) || 1)) })}
                        className="w-24 px-2 py-1 rounded border text-sm"
                      />
                      <p className="text-[11px] text-gray-500 mt-1">Global default: {presets.defaultMaxChars}</p>
                    </div>
                    )}

                    {co.showColors && (
                    <div>
                      {overrideToggle("Colors", Boolean(co.colorsOverride), (next) => {
                        if (next) setCO({ colorsOverride: true, colors: co.colors.length ? co.colors : presets.colors });
                        else setCO({ colorsOverride: false });
                      })}
                      {co.colorsOverride ? (
                        <div className="space-y-2">
                          <div className="flex justify-end">
                            <button type="button" className="text-xs px-2 py-0.5 rounded border" onClick={() => setCO({ colors: [...co.colors, { name: "", hex: "#000000" }] })}>+ Add Color</button>
                          </div>
                          {co.colors.map((c, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <input type="text" value={c.name} placeholder="Color name" onChange={(e) => { const next = [...co.colors]; next[idx] = { ...next[idx], name: e.target.value }; setCO({ colors: next }); }} className="flex-1 px-2 py-1 rounded border text-sm" />
                              <input type="color" value={c.hex} onChange={(e) => { const next = [...co.colors]; next[idx] = { ...next[idx], hex: e.target.value }; setCO({ colors: next }); }} className="w-10 h-8 border rounded" />
                              <button type="button" className="text-xs px-2 py-1 rounded border text-red" onClick={() => setCO({ colors: co.colors.filter((_, i) => i !== idx) })}>Remove</button>
                            </div>
                          ))}
                          {co.colors.length === 0 && <p className="text-xs text-gray-500">No colors yet.</p>}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex flex-wrap gap-2">
                            {presets.colors.length === 0 && <span className="text-gray-500">No global colors configured.</span>}
                            {presets.colors.map((c) => (
                              <span key={c.name} className="inline-flex items-center gap-1 px-2 py-0.5 border rounded">
                                <span className="inline-block w-3 h-3 rounded-full border" style={{ background: c.hex }} />
                                {c.name}
                              </span>
                            ))}
                          </div>
                          <p className="text-[11px] text-gray-500">Managed in Settings → Personalization</p>
                        </div>
                      )}
                    </div>
                    )}

                    {co.showFonts && (
                    <div>
                      {overrideToggle("Fonts", Boolean(co.fontsOverride), (next) => {
                        if (next) setCO({ fontsOverride: true, fonts: co.fonts.length ? co.fonts : presets.fonts });
                        else setCO({ fontsOverride: false });
                      })}
                      {co.fontsOverride ? (
                        <div className="flex flex-wrap gap-3">
                          {FONT_PRESETS.map((f) => (
                            <label key={f} className="text-sm flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={co.fonts.includes(f)}
                                onChange={(e) => setCO({ fonts: e.target.checked ? [...co.fonts, f] : co.fonts.filter((x) => x !== f) })}
                              />
                              <span style={{ fontFamily: fontFamilyMap[f] }}>{f}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-600">
                          <div className="flex flex-wrap gap-2">
                            {presets.fonts.length === 0 && <span className="text-gray-500">No global fonts configured.</span>}
                            {presets.fonts.map((f) => (
                              <span key={f} className="px-2 py-0.5 border rounded" style={{ fontFamily: fontFamilyMap[f] }}>{f}</span>
                            ))}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1">Managed in Settings → Personalization</p>
                        </div>
                      )}
                    </div>
                    )}

                    {co.showPlacements && (
                    <div>
                      {overrideToggle("Placements", Boolean(co.placementsOverride), (next) => {
                        if (next) setCO({ placementsOverride: true, placements: co.placements.length ? co.placements : presets.placements });
                        else setCO({ placementsOverride: false });
                      })}
                      {co.placementsOverride ? (
                        <div className="flex flex-wrap gap-3">
                          {PLACEMENT_PRESETS.map((p) => (
                            <label key={p} className="text-xs flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={co.placements.includes(p)}
                                onChange={(e) => setCO({ placements: e.target.checked ? [...co.placements, p] : co.placements.filter((x) => x !== p) })}
                              />
                              {p}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-600">
                          <div className="flex flex-wrap gap-2">
                            {presets.placements.length === 0 && <span className="text-gray-500">No global placements configured.</span>}
                            {presets.placements.map((p) => <span key={p} className="px-2 py-0.5 border rounded">{p}</span>)}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1">Managed in Settings → Personalization</p>
                        </div>
                      )}
                    </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold mb-1">Upcharge ($)</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={co.upcharge}
                        onChange={(e) => setCO({ upcharge: Math.max(0, parseFloat(e.target.value || "0") || 0) })}
                        className="w-28 px-2 py-1 rounded border text-sm"
                      />
                      <p className="text-[11px] text-gray-500 mt-1">Global default: ${presets.defaultUpcharge.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>
            </details>
          );
        })()}
      </div>
      <div className="flex gap-3 mt-6"><button onClick={handleSave} className="flex-1 bg-navy text-white py-2.5 rounded-lg text-sm">{editing ? "Save Changes" : "Add Product"}</button><button onClick={() => { setShowForm(false); setEditing(null); }} className="px-5 py-2.5 rounded-lg border text-sm">Cancel</button></div>
    </div></div>}

    {loading ? <div className="text-center py-12">Loading...</div> : <div className="bg-white rounded-xl border shadow-sm overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[640px]"><thead><tr className="border-b bg-gray-50/50"><th className="text-left text-xs px-5 py-3">Product</th><th className="text-left text-xs px-5 py-3 hidden md:table-cell">Category</th><th className="text-left text-xs px-5 py-3">Price</th><th className="text-left text-xs px-5 py-3">Stock</th><th className="text-left text-xs px-5 py-3">Status</th><th className="text-right text-xs px-5 py-3">Actions</th></tr></thead><tbody>{filtered.map((product) => {
      const openEditor = () => { setEditing(product); setForm({ ...product, price: product.price.toString(), stock: (product.stock ?? 0).toString(), drop: product.drop || "", tag: product.tag || "", image: product.image || "", additionalImages: (product.images ?? []).sort((a, b) => a.sortOrder - b.sortOrder).map((img, index) => ({ url: img.url, alt: img.alt ?? undefined, sortOrder: index })), hasSize: Boolean(product.hasSize), sizes: mapSizes(product.sizes), hasColor: Boolean(product.hasColor), colors: (product.colors ?? []).map((c, index) => ({ name: c.name, hex: c.hex, sortOrder: c.sortOrder ?? index })), customizationOptions: (product.customizationOptions ?? defaultCustomizationOptions()) as CustomizationOptions }); setShowForm(true); };
      return <tr key={product.id} className="border-b hover:bg-gray-50/50"><td className="px-5 py-4 cursor-pointer" onClick={openEditor}><div className="font-medium text-sm text-navy underline-offset-2 hover:underline">{product.name}</div><div className="text-[11px] text-gray-500 md:hidden mt-0.5">Tap to edit</div></td><td className="px-5 py-4 text-sm hidden md:table-cell">{product.category}</td><td className="px-5 py-4 text-sm font-semibold">${product.price.toFixed(2)}</td><td className="px-5 py-4 text-xs">{product.hasSize ? SIZE_OPTIONS.map((s) => `${s}:${product.sizes?.find((x) => x.size === s)?.stock ?? 0}`).join(" • ") : `Qty: ${product.stock}`}</td><td className="px-5 py-4"><button onClick={() => handleToggleActive(product)} className={`text-xs px-2.5 py-1 rounded-full ${product.active ? "bg-green/10 text-green" : "bg-red/10 text-red"}`}>{product.active ? "Active" : "Hidden"}</button></td><td className="px-5 py-4 text-right whitespace-nowrap"><button onClick={openEditor} className="text-sm text-navy mr-3">Edit</button><button onClick={() => handleDelete(product.id)} className="text-sm text-red">Delete</button></td></tr>;
    })}</tbody></table></div></div>}
  </div>;
}
