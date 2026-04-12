"use client";

import { useState, useEffect } from "react";

const SIZE_OPTIONS = ["S", "M", "L", "XL", "2XL", "3XL"] as const;
type SizeKey = (typeof SIZE_OPTIONS)[number];

type SizesMap = Record<SizeKey, string>;

interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  category: string;
  description: string;
  tag?: string;
  image?: string;
  active: boolean;
  stock: number;
  hasSize: boolean;
  sizes?: Array<{ size: string; stock: number }>;
  isExample?: boolean;
}

const CATEGORIES = [
  { slug: "crewnecks", name: "Embroidered Crewnecks", emoji: "🧵" },
  { slug: "totes", name: "Tote Bags", emoji: "👜" },
  { slug: "cups", name: "Glass Cups", emoji: "🥤" },
  { slug: "vinyl", name: "Vinyl & Decals", emoji: "✂️" },
];

const emptySizes = (): SizesMap => ({ S: "0", M: "0", L: "0", XL: "0", "2XL": "0", "3XL": "0" });

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  const emptyProduct = {
    name: "",
    price: "",
    category: "crewnecks",
    description: "",
    tag: "",
    image: "",
    sku: "",
    active: true,
    stock: "0",
    hasSize: false,
    sizes: emptySizes(),
  };

  const [form, setForm] = useState(emptyProduct);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  }

  const mapSizes = (sizes?: Array<{ size: string; stock: number }>): SizesMap => {
    const mapped = emptySizes();
    for (const size of sizes ?? []) {
      if (SIZE_OPTIONS.includes(size.size as SizeKey)) mapped[size.size as SizeKey] = String(size.stock ?? 0);
    }
    return mapped;
  };

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sku", form.sku);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) setForm((prev) => ({ ...prev, image: data.url }));
      else alert(data.error || "Upload failed");
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    const priceNum = parseFloat(form.price);
    const stockNum = parseInt(form.stock, 10);
    if (!form.name || !priceNum || isNaN(priceNum) || isNaN(stockNum) || stockNum < 0) return;

    const sizesPayload = Object.fromEntries(SIZE_OPTIONS.map((s) => [s, form.hasSize ? Math.max(0, parseInt(form.sizes[s], 10) || 0) : 0]));
    const method = editing ? "PUT" : "POST";
    const body = editing
      ? { ...form, id: editing.id, price: priceNum, stock: stockNum, sizes: sizesPayload }
      : { ...form, price: priceNum, stock: stockNum, sizes: sizesPayload };

    await fetch("/api/admin/products", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setShowForm(false);
    setEditing(null);
    setForm(emptyProduct);
    fetchProducts();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    await fetch("/api/admin/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchProducts();
  }

  async function handleToggleActive(product: Product) {
    await fetch("/api/admin/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: product.id, active: !product.active, sizes: Object.fromEntries(SIZE_OPTIONS.map((s) => [s, Number(product.sizes?.find((x) => x.size === s)?.stock ?? 0)])) }),
    });
    fetchProducts();
  }

  const filtered = filter ? products.filter((p) => p.category === filter) : products;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">Products</h1>
          <p className="text-text-muted text-sm mt-1">{products.length} total products • {products.filter(p => p.active).length} active</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ ...emptyProduct, sku: crypto.randomUUID() }); setShowForm(true); }} className="bg-gold hover:bg-gold/90 text-navy font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm">+ Add Product</button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setFilter(null)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === null ? "bg-navy text-white" : "bg-white text-navy border border-gray-200 hover:border-gray-300"}`}>All ({products.length})</button>
        {CATEGORIES.map((cat) => {
          const count = products.filter((p) => p.category === cat.slug).length;
          return <button key={cat.slug} onClick={() => setFilter(cat.slug)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === cat.slug ? "bg-navy text-white" : "bg-white text-navy border border-gray-200 hover:border-gray-300"}`}>{cat.emoji} {cat.name} ({count})</button>;
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-navy mb-4">{editing ? "Edit Product" : "Add Product"}</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2"><span className="text-xs font-medium text-text-muted">SKU</span><code className="text-xs text-navy font-mono">{form.sku}</code></div>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="Product name" />
              <div className="grid grid-cols-3 gap-4">
                <input type="text" inputMode="decimal" value={form.price} onChange={(e) => { const val = e.target.value; if (val === "" || /^\d+\.?\d{0,2}$/.test(val)) setForm({ ...form, price: val }); }} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="Price" />
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm">{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
                {!form.hasSize && <input type="number" min={0} step={1} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="Stock" />}
              </div>
              <label className="flex items-center gap-2 text-sm text-navy">
                <input type="checkbox" checked={form.hasSize} onChange={(e) => setForm({ ...form, hasSize: e.target.checked })} />
                This product has sizes
              </label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="Product description" />

              {form.hasSize && <div className="border border-gray-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-navy mb-2">Sizes stock</p>
                <div className="grid grid-cols-3 gap-3">
                  {SIZE_OPTIONS.map((size) => (
                    <div key={size}>
                      <label className="block text-xs text-text-muted mb-1">{size}</label>
                      <input type="number" min={0} step={1} value={form.sizes[size]} onChange={(e) => setForm({ ...form, sizes: { ...form.sizes, [size]: e.target.value } })} className="w-full px-2 py-2 rounded-lg border border-gray-200 text-sm" />
                    </div>
                  ))}
                </div>
              </div>}

              <input type="text" value={form.tag || ""} onChange={(e) => setForm({ ...form, tag: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="Tag (optional)" />

              <div>
                {form.image && <div className="mb-2 relative inline-block"><img src={form.image} alt="Preview" className="w-24 h-24 object-cover rounded-lg border border-gray-200" /><button type="button" onClick={() => setForm({ ...form, image: "" })} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs">×</button></div>}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageUpload} disabled={uploading} className="w-full text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} className="flex-1 bg-navy hover:bg-navy-light text-white font-medium py-2.5 rounded-lg text-sm">{editing ? "Save Changes" : "Add Product"}</button>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <div className="text-center py-12 text-text-muted">Loading...</div> : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50"><th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Product</th><th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Category</th><th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Price</th><th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Stock</th><th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Status</th><th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Actions</th></tr></thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4"><div className="font-medium text-navy text-sm">{product.name}</div><div className="text-xs text-text-muted mt-0.5 line-clamp-1 max-w-xs">{product.description}</div></td>
                  <td className="px-5 py-4 text-sm text-text-muted">{CATEGORIES.find((c) => c.slug === product.category)?.emoji} {CATEGORIES.find((c) => c.slug === product.category)?.name}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-navy">${product.price.toFixed(2)}</td>
                  <td className="px-5 py-4 text-xs text-text-muted">{product.hasSize ? SIZE_OPTIONS.map((s) => `${s}:${product.sizes?.find((x) => x.size === s)?.stock ?? 0}`).join(" • ") : `Qty: ${product.stock}`}</td>
                  <td className="px-5 py-4"><button onClick={() => handleToggleActive(product)} className={`text-xs font-medium px-2.5 py-1 rounded-full ${product.active ? "bg-green/10 text-green" : "bg-red/10 text-red"}`}>{product.active ? "Active" : "Hidden"}</button></td>
                  <td className="px-5 py-4 text-right"><button onClick={() => { setEditing(product); setForm({ ...product, price: product.price.toString(), stock: String(product.stock ?? 0), image: product.image || "", sku: product.sku, tag: product.tag || "", hasSize: Boolean(product.hasSize), sizes: mapSizes(product.sizes) }); setShowForm(true); }} className="text-sm text-navy hover:text-gold mr-3">Edit</button><button onClick={() => handleDelete(product.id)} className="text-sm text-red">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
