"use client";

import { useState, useEffect } from "react";

interface Drop {
  id: string;
  slug: string;
  name: string;
  tagline?: string | null;
  emoji?: string | null;
  colorFrom?: string | null;
  colorTo?: string | null;
  sortOrder: number;
  active: boolean;
}

const DEFAULT_COLORS = { from: "#92400e", to: "#c2410c" }; // amber-800 to orange-700

export default function DropsPage() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Drop | null>(null);

  const emptyForm = {
    name: "",
    slug: "",
    tagline: "",
    emoji: "",
    colorFrom: DEFAULT_COLORS.from,
    colorTo: DEFAULT_COLORS.to,
    active: true,
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchDrops();
  }, []);

  async function fetchDrops() {
    const res = await fetch("/api/drops");
    const data = await res.json();
    setDrops(data);
    setLoading(false);
  }

  async function handleSave() {
    if (!form.name.trim()) return;

    const method = editing ? "PUT" : "POST";
    const body = editing ? { ...form, id: editing.id } : form;

    const res = await fetch("/api/drops", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Failed to save");
      return;
    }

    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    fetchDrops();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this drop? Products using it will be moved to general catalog.")) return;
    await fetch("/api/drops", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchDrops();
  }

  async function handleToggleActive(drop: Drop) {
    await fetch("/api/drops", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: drop.id, active: !drop.active }),
    });
    fetchDrops();
  }

  async function handleReorder(id: string, direction: -1 | 1) {
    const index = drops.findIndex((d) => d.id === id);
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= drops.length) return;

    const current = drops[index];
    const swap = drops[swapIndex];

    await Promise.all([
      fetch("/api/drops", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: current.id, sortOrder: swap.sortOrder }),
      }),
      fetch("/api/drops", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: swap.id, sortOrder: current.sortOrder }),
      }),
    ]);
    fetchDrops();
  }

  function openEditor(drop: Drop) {
    setEditing(drop);
    setForm({
      name: drop.name,
      slug: drop.slug,
      tagline: drop.tagline || "",
      emoji: drop.emoji || "",
      colorFrom: drop.colorFrom || DEFAULT_COLORS.from,
      colorTo: drop.colorTo || DEFAULT_COLORS.to,
      active: drop.active,
    });
    setShowForm(true);
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">Drops</h1>
          <p className="text-sm text-gray-600 mt-1">Curated collections for the homepage and shop</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setForm(emptyForm);
            setShowForm(true);
          }}
          className="bg-gold text-navy font-semibold px-5 py-2.5 rounded-lg text-sm"
        >
          + Add Drop
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">{editing ? "Edit Drop" : "Add Drop"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  placeholder="Caffeine and Chaos"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Slug (URL)</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm font-mono"
                  placeholder="caffeine-and-chaos (auto-generated if empty)"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Tagline</label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  placeholder="For the moms running on coffee and pure determination"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Emoji</label>
                  <input
                    type="text"
                    value={form.emoji}
                    onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm text-center text-2xl"
                    placeholder="☕"
                    maxLength={4}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Active</label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, active: !form.active })}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${form.active ? "bg-green/10 text-green border-green" : "bg-gray-100 text-gray-500"}`}
                  >
                    {form.active ? "✓ Active" : "Hidden"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-2">Card Gradient Colors</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-500 mb-1">From</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={form.colorFrom}
                        onChange={(e) => setForm({ ...form, colorFrom: e.target.value })}
                        className="w-12 h-10 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={form.colorFrom}
                        onChange={(e) => setForm({ ...form, colorFrom: e.target.value })}
                        className="flex-1 px-2 py-1 rounded border text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-500 mb-1">To</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={form.colorTo}
                        onChange={(e) => setForm({ ...form, colorTo: e.target.value })}
                        className="w-12 h-10 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={form.colorTo}
                        onChange={(e) => setForm({ ...form, colorTo: e.target.value })}
                        className="flex-1 px-2 py-1 rounded border text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
                <div
                  className="mt-3 h-16 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                  style={{ background: `linear-gradient(to bottom right, ${form.colorFrom}, ${form.colorTo})` }}
                >
                  {form.emoji} {form.name || "Preview"}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} className="flex-1 bg-navy text-white py-2.5 rounded-lg text-sm">
                {editing ? "Save Changes" : "Add Drop"}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                className="px-5 py-2.5 rounded-lg border text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : drops.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No drops yet. Add your first collection!
        </div>
      ) : (
        <div className="space-y-3">
          {drops.map((drop, index) => (
            <div
              key={drop.id}
              className="bg-white rounded-xl border shadow-sm p-4 flex items-center gap-4"
            >
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleReorder(drop.id, -1)}
                  disabled={index === 0}
                  className="text-xs px-2 py-1 rounded border disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  onClick={() => handleReorder(drop.id, 1)}
                  disabled={index === drops.length - 1}
                  className="text-xs px-2 py-1 rounded border disabled:opacity-30"
                >
                  ↓
                </button>
              </div>

              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl shrink-0"
                style={{ background: `linear-gradient(to bottom right, ${drop.colorFrom || DEFAULT_COLORS.from}, ${drop.colorTo || DEFAULT_COLORS.to})` }}
              >
                {drop.emoji || "✨"}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-navy">{drop.name}</div>
                <div className="text-xs text-gray-500 truncate">{drop.tagline}</div>
                <div className="text-[10px] text-gray-400 font-mono mt-1">/drops/{drop.slug}</div>
              </div>

              <button
                onClick={() => handleToggleActive(drop)}
                className={`text-xs px-2.5 py-1 rounded-full shrink-0 ${drop.active ? "bg-green/10 text-green" : "bg-red/10 text-red"}`}
              >
                {drop.active ? "Active" : "Hidden"}
              </button>

              <button onClick={() => openEditor(drop)} className="text-sm text-navy">
                Edit
              </button>
              <button onClick={() => handleDelete(drop.id)} className="text-sm text-red">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
