"use client";

import { useState, useEffect } from "react";

const SIZE_OPTIONS = ["S", "M", "L", "XL", "2XL", "3XL"] as const;
type SizeKey = (typeof SIZE_OPTIONS)[number];
type SizesMap = Record<SizeKey, string>;

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description: string;
  tag?: string;
  image?: string;
  active: boolean;
  hasSize: boolean;
  sizes?: Array<{ size: string; stock: number }>;
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

  const emptyProduct = { name: "", price: "", stock: "0", category: "crewnecks", description: "", tag: "", image: "", active: true, hasSize: false, sizes: emptySizes() };
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(emptyProduct);

  useEffect(() => { fetchProducts(); }, []);

  const mapSizes = (sizes?: Array<{ size: string; stock: number }>): SizesMap => {
    const mapped = emptySizes();
    for (const size of sizes ?? []) if (SIZE_OPTIONS.includes(size.size as SizeKey)) mapped[size.size as SizeKey] = String(size.stock ?? 0);
    return mapped;
  };

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

    const sizesPayload = Object.fromEntries(SIZE_OPTIONS.map((s) => [s, form.hasSize ? Math.max(0, parseInt(form.sizes[s], 10) || 0) : 0]));
    const method = editing ? "PUT" : "POST";
    const body = editing ? { ...form, id: editing.id, price: priceNum, stock: stockNum, sizes: sizesPayload } : { ...form, price: priceNum, stock: stockNum, sizes: sizesPayload };

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
      body: JSON.stringify({ id: product.id, active: !product.active, sizes: Object.fromEntries(SIZE_OPTIONS.map((s) => [s, Number(product.sizes?.find((x) => x.size === s)?.stock ?? 0)])) }),
    });
    fetchProducts();
  }

  const filtered = filter ? products.filter((p) => p.category === filter) : products;

  return <div className="p-4 md:p-8">
    <div className="flex items-center justify-between mb-8"><div><h1 className="text-2xl font-bold text-navy">Products</h1></div><button onClick={() => { setEditing(null); setForm(emptyProduct); setShowForm(true); }} className="bg-gold text-navy font-semibold px-5 py-2.5 rounded-lg text-sm">+ Add Product</button></div>

    <div className="flex gap-2 mb-6 flex-wrap"><button onClick={() => setFilter(null)} className={`px-4 py-2 rounded-lg text-sm ${filter === null ? "bg-navy text-white" : "bg-white border"}`}>All ({products.length})</button>{CATEGORIES.map((cat) => <button key={cat.slug} onClick={() => setFilter(cat.slug)} className={`px-4 py-2 rounded-lg text-sm ${filter === cat.slug ? "bg-navy text-white" : "bg-white border"}`}>{cat.emoji} {cat.name}</button>)}</div>

    {showForm && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 md:p-4"><div className="bg-white md:rounded-2xl p-6 w-full h-full md:h-auto md:max-w-lg shadow-xl overflow-y-auto"><h3 className="text-lg font-bold mb-4">{editing ? "Edit Product" : "Add Product"}</h3>
      <div className="space-y-4">
        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" placeholder="Product name" />
        <div className="grid grid-cols-3 gap-4"><input type="text" inputMode="decimal" value={form.price} onChange={(e) => { const val = e.target.value; if (val === "" || /^\d+\.?\d{0,2}$/.test(val)) setForm({ ...form, price: val }); }} className="w-full px-3 py-2 rounded-lg border text-sm" placeholder="25.00" />{!form.hasSize && <input type="number" min="0" step="1" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" placeholder="Stock" />}<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm">{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.hasSize} onChange={(e) => setForm({ ...form, hasSize: e.target.checked })} />This product has sizes</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border text-sm" placeholder="Description" />
        {form.hasSize && <div className="border rounded-lg p-3"><p className="text-sm font-semibold mb-2">Size stock</p><div className="grid grid-cols-3 gap-3">{SIZE_OPTIONS.map((s) => <div key={s}><label className="block text-xs mb-1">{s}</label><input type="number" min={0} step={1} value={form.sizes[s]} onChange={(e) => setForm({ ...form, sizes: { ...form.sizes, [s]: e.target.value } })} className="w-full px-2 py-2 rounded-lg border text-sm" /></div>)}</div></div>}

        <div>
          <label className="block text-sm font-medium mb-1">Photo</label>
          {form.image ? (
            <div className="flex items-center gap-3">
              <img src={form.image} alt="Preview" className="w-20 h-20 object-cover rounded-lg border" />
              <button
                type="button"
                onClick={() => setForm({ ...form, image: "" })}
                className="text-sm text-red hover:text-red/70"
              >
                Remove
              </button>
            </div>
          ) : (
            <label className={`flex items-center justify-center gap-2 w-full px-3 py-3 rounded-lg border-2 border-dashed border-gray-200 text-sm cursor-pointer hover:border-gold/50 hover:bg-gold/5 transition-all ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  try {
                    const sku = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "product";
                    const fd = new FormData();
                    fd.append("file", file);
                    fd.append("sku", sku);
                    const res = await fetch("/api/upload", { method: "POST", body: fd });
                    const json = await res.json();
                    if (json.url) setForm((prev) => ({ ...prev, image: json.url }));
                    else alert(json.error || "Upload failed");
                  } catch {
                    alert("Upload failed");
                  } finally {
                    setUploading(false);
                  }
                }}
              />
              {uploading ? "⏳ Uploading..." : "📷 Upload Photo"}
            </label>
          )}
        </div>

        <input type="text" value={form.tag || ""} onChange={(e) => setForm({ ...form, tag: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" placeholder="Tag" />
      </div>
      <div className="flex gap-3 mt-6"><button onClick={handleSave} className="flex-1 bg-navy text-white py-2.5 rounded-lg text-sm">{editing ? "Save Changes" : "Add Product"}</button><button onClick={() => { setShowForm(false); setEditing(null); }} className="px-5 py-2.5 rounded-lg border text-sm">Cancel</button></div>
    </div></div>}

    {loading ? <div className="text-center py-12">Loading...</div> : <div className="bg-white rounded-xl border shadow-sm overflow-hidden"><table className="w-full"><thead><tr className="border-b bg-gray-50/50"><th className="text-left text-xs px-5 py-3">Product</th><th className="text-left text-xs px-5 py-3 hidden md:table-cell">Category</th><th className="text-left text-xs px-5 py-3">Price</th><th className="text-left text-xs px-5 py-3">Stock</th><th className="text-left text-xs px-5 py-3">Status</th><th className="text-right text-xs px-5 py-3">Actions</th></tr></thead><tbody>{filtered.map((product) => <tr key={product.id} className="border-b"><td className="px-5 py-4"><div className="font-medium text-sm">{product.name}</div></td><td className="px-5 py-4 text-sm hidden md:table-cell">{product.category}</td><td className="px-5 py-4 text-sm font-semibold">${product.price.toFixed(2)}</td><td className="px-5 py-4 text-xs">{product.hasSize ? SIZE_OPTIONS.map((s) => `${s}:${product.sizes?.find((x) => x.size === s)?.stock ?? 0}`).join(" • ") : `Qty: ${product.stock}`}</td><td className="px-5 py-4"><button onClick={() => handleToggleActive(product)} className={`text-xs px-2.5 py-1 rounded-full ${product.active ? "bg-green/10 text-green" : "bg-red/10 text-red"}`}>{product.active ? "Active" : "Hidden"}</button></td><td className="px-5 py-4 text-right"><button onClick={() => { setEditing(product); setForm({ ...product, price: product.price.toString(), stock: (product.stock ?? 0).toString(), tag: product.tag || "", image: product.image || "", hasSize: Boolean(product.hasSize), sizes: mapSizes(product.sizes) }); setShowForm(true); }} className="text-sm text-navy mr-3">Edit</button><button onClick={() => handleDelete(product.id)} className="text-sm text-red">Delete</button></td></tr>)}</tbody></table></div>}
  </div>;
}
