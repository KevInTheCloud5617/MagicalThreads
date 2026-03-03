"use client";

import { useState, useEffect } from "react";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  notes: string;
}

const STATUS_OPTIONS = ["new", "replied", "in-progress", "completed", "archived"];

const statusStyles: Record<string, string> = {
  new: "bg-gold/20 text-gold",
  replied: "bg-blue-pale text-navy",
  "in-progress": "bg-blue-light/20 text-navy",
  completed: "bg-green/10 text-green",
  archived: "bg-gray-100 text-text-muted",
};

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchInquiries();
  }, []);

  async function fetchInquiries() {
    const res = await fetch("/api/admin/inquiries");
    const data = await res.json();
    setInquiries(data);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/inquiries", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchInquiries();
    if (selected?.id === id) {
      setSelected((prev) => prev ? { ...prev, status } : null);
    }
  }

  async function updateNotes(id: string, notes: string) {
    await fetch("/api/inquiries", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, notes }),
    });
    fetchInquiries();
  }

  const filtered = filterStatus
    ? inquiries.filter((i) => i.status === filterStatus)
    : inquiries;

  const newCount = inquiries.filter((i) => i.status === "new").length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Inquiries</h1>
        <p className="text-text-muted text-sm mt-1">
          {inquiries.length} total • {newCount} new
        </p>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilterStatus(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            !filterStatus ? "bg-navy text-white" : "bg-white text-navy border border-gray-200"
          }`}
        >
          All
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              filterStatus === s ? "bg-navy text-white" : "bg-white text-navy border border-gray-200"
            }`}
          >
            {s.replace("-", " ")}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-1 space-y-2">
          {loading ? (
            <div className="text-center py-8 text-text-muted">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-text-muted bg-white rounded-xl border border-gray-100 p-6">
              No inquiries found
            </div>
          ) : (
            filtered.map((inq) => (
              <button
                key={inq.id}
                onClick={() => setSelected(inq)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selected?.id === inq.id
                    ? "bg-navy text-white border-navy"
                    : "bg-white border-gray-100 hover:border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${selected?.id === inq.id ? "text-white" : "text-navy"}`}>
                    {inq.name}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selected?.id === inq.id ? "bg-white/20 text-white" : statusStyles[inq.status] || "bg-gray-100"
                  }`}>
                    {inq.status}
                  </span>
                </div>
                <p className={`text-xs ${selected?.id === inq.id ? "text-white/70" : "text-text-muted"}`}>
                  {inq.subject}
                </p>
                <p className={`text-xs mt-1 ${selected?.id === inq.id ? "text-white/50" : "text-text-muted/60"}`}>
                  {new Date(inq.createdAt).toLocaleDateString()}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="p-6 border-b border-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-navy">{selected.name}</h2>
                  <select
                    value={selected.status}
                    onChange={(e) => updateStatus(selected.id, e.target.value)}
                    className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold/50"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s} className="capitalize">{s.replace("-", " ")}</option>
                    ))}
                  </select>
                </div>
                <p className="text-sm text-text-muted">{selected.email}</p>
                <p className="text-xs text-text-muted/60 mt-1">
                  {selected.subject} • {new Date(selected.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="p-6 border-b border-gray-50">
                <h3 className="text-sm font-semibold text-navy mb-2">Message</h3>
                <p className="text-sm text-text-muted leading-relaxed whitespace-pre-wrap">
                  {selected.message}
                </p>
              </div>

              <div className="p-6">
                <h3 className="text-sm font-semibold text-navy mb-2">Internal Notes</h3>
                <textarea
                  defaultValue={selected.notes}
                  onBlur={(e) => updateNotes(selected.id, e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none"
                  placeholder="Add internal notes about this inquiry..."
                />
                <p className="text-xs text-text-muted/50 mt-1">Notes auto-save when you click away</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <span className="text-4xl block mb-3">💬</span>
              <p className="text-text-muted">Select an inquiry to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
