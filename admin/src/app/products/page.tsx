"use client";

import { useState, useEffect } from "react";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  tag?: string;
  image?: string;
  active: boolean;
  isExample?: boolean;
}

const CATEGORIES = [
  { slug: "crewnecks", name: "Embroidered Crewnecks", emoji: "🧵" },
  { slug: "totes", name: "Tote Bags", emoji: "👜" },
  { slug: "cups", name: "Glass Cups", emoji: "🥤" },
  { slug: "vinyl", name: "Vinyl & Decals", emoji: "✂️" },
];

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
    active: true,
  };

  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState(emptyProduct);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  }

  async function handleSave() {
    const priceNum = parseFloat(form.price);
    if (!form.name || !priceNum || isNaN(priceNum)) return;
    const method = editing ? "PUT" : "POST";
    const body = editing ? { ...form, id: editing.id, price: priceNum } : { ...form, price: priceNum };

    await fetch("/api/products", {
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
    await fetch("/api/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchProducts();
  }

  async function handleToggleActive(product: Product) {
    await fetch("/api/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: product.id, active: !product.active }),
    });
    fetchProducts();
  }

  const filtered = filter ? products.filter((p) => p.category === filter) : products;

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">Products</h1>
          <p className="text-text-muted text-sm mt-1">{products.length} total products • {products.filter(p => p.active).length} active</p>
        </div>
        <button
          onClick={() => { setEditing(null); setForm(emptyProduct); setShowForm(true); }}
          className="bg-gold hover:bg-gold/90 text-navy font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
        >
          + Add Product
        </button>
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilter(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === null ? "bg-navy text-white" : "bg-white text-navy border border-gray-200 hover:border-gray-300"
          }`}
        >
          All ({products.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = products.filter((p) => p.category === cat.slug).length;
          return (
            <button
              key={cat.slug}
              onClick={() => setFilter(cat.slug)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === cat.slug ? "bg-navy text-white" : "bg-white text-navy border border-gray-200 hover:border-gray-300"
              }`}
            >
              {cat.emoji} {cat.name} ({count})
            </button>
          );
        })}
      </div>


      {/* Example products banner */}
      {products.some(p => p.isExample) && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Demo Products</p>
            <p className="text-sm text-amber-700">Products marked <span className="inline-flex items-center bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-300">EXAMPLE</span> are demo data and can be deleted once you add your own.</p>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white md:rounded-2xl p-6 w-full h-full md:h-auto md:max-w-lg shadow-xl overflow-y-auto">
            <h3 className="text-lg font-bold text-navy mb-4">
              {editing ? "Edit Product" : "Add Product"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
                  placeholder="Product name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy mb-1">Price ($)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.price}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d+\.?\d{0,2}$/.test(val)) {
                        setForm({ ...form, price: val });
                      }
                    }}
                    onBlur={() => {
                      const num = parseFloat(form.price);
                      if (!isNaN(num) && num > 0) {
                        setForm({ ...form, price: num.toFixed(2) });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
                    placeholder="25.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.slug} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none"
                  placeholder="Product description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Photo</label>
                {form.image ? (
                  <div className="flex items-center gap-3">
                    <img src={form.image} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image: "" })}
                      className="text-sm text-red hover:text-red/70 transition-colors"
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
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Tag (optional)</label>
                <input
                  type="text"
                  value={form.tag || ""}
                  onChange={(e) => setForm({ ...form, tag: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
                  placeholder="e.g. Bestseller, New, Popular"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                className="flex-1 bg-navy hover:bg-navy-light text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                {editing ? "Save Changes" : "Add Product"}
              </button>
              <button
                onClick={() => { setShowForm(false); setEditing(null); }}
                className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-text-muted">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Product</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3 hidden md:table-cell">Category</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Price</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3 hidden md:table-cell">Tag</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-navy text-sm flex items-center gap-2">{product.image && <img src={product.image} alt="" className="w-10 h-10 object-cover rounded-lg border border-gray-100 flex-shrink-0" />}{product.name}{product.isExample && <span className="inline-flex items-center bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-300">EXAMPLE</span>}</div>
                    <div className="text-xs text-text-muted mt-0.5 line-clamp-1 max-w-xs">{product.description}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-text-muted hidden md:table-cell">
                    {CATEGORIES.find((c) => c.slug === product.category)?.emoji}{" "}
                    {CATEGORIES.find((c) => c.slug === product.category)?.name}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-navy">${product.price.toFixed(2)}</td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    {product.tag && (
                      <span className="bg-gold/20 text-gold text-xs font-medium px-2.5 py-1 rounded-full">{product.tag}</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleToggleActive(product)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                        product.active ? "bg-green/10 text-green hover:bg-green/20" : "bg-red/10 text-red hover:bg-red/20"
                      }`}
                    >
                      {product.active ? "Active" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => { setEditing(product); setForm({ ...product, price: product.price.toString(), tag: product.tag || "", image: product.image || "" }); setShowForm(true); }}
                      className="text-sm text-navy hover:text-gold transition-colors mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-sm text-red hover:text-red/70 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
