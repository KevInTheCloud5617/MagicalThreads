"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  tag?: string;
  active: boolean;
}

interface Inquiry {
  id: string;
  name: string;
  subject: string;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([
      fetch("/api/admin/products").then((r) => r.json()),
      fetch("/api/admin/inquiries").then((r) => r.json()),
    ]).then(([prods, inqs]) => {
      setProducts(prods);
      setInquiries(inqs);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <p className="text-text-muted">Loading...</p>
      </div>
    );
  }

  const activeProducts = products.filter((p) => p.active).length;
  const newInquiries = inquiries.filter((i) => i.status === "new").length;
  const recentInquiries = inquiries.slice(0, 5);

  const stats = [
    { label: "Total Products", value: products.length, icon: "🧵", color: "bg-blue-pale" },
    { label: "Active Products", value: activeProducts, icon: "✅", color: "bg-green/10" },
    { label: "New Inquiries", value: newInquiries, icon: "💬", color: "bg-gold/10" },
    { label: "Total Inquiries", value: inquiries.length, icon: "📬", color: "bg-blue-pale" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
        <p className="text-text-muted text-sm mt-1">Welcome back! Here&apos;s what&apos;s happening.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className={`${stat.color} rounded-xl p-5 border border-gray-100`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className="text-3xl font-bold text-navy">{stat.value}</p>
            <p className="text-sm text-text-muted mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Inquiries */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-50">
            <h2 className="font-bold text-navy">Recent Inquiries</h2>
            <Link href="/admin/inquiries" className="text-sm text-gold hover:text-gold/80 transition-colors">
              View All →
            </Link>
          </div>
          {recentInquiries.length === 0 ? (
            <div className="p-5 text-center text-text-muted text-sm">No inquiries yet</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentInquiries.map((inq) => (
                <div key={inq.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-navy">{inq.name}</p>
                    <p className="text-xs text-text-muted">{inq.subject}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    inq.status === "new" ? "bg-gold/20 text-gold" :
                    inq.status === "replied" ? "bg-green/10 text-green" :
                    "bg-gray-100 text-text-muted"
                  }`}>
                    {inq.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-50">
            <h2 className="font-bold text-navy">Quick Actions</h2>
          </div>
          <div className="p-5 space-y-3">
            <Link
              href="/admin/products"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-100 hover:border-gold/30 hover:bg-gold/5 transition-all"
            >
              <span className="text-xl">➕</span>
              <div>
                <p className="text-sm font-medium text-navy">Add New Product</p>
                <p className="text-xs text-text-muted">Create a new product listing</p>
              </div>
            </Link>
            <Link
              href="/admin/inquiries"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-100 hover:border-gold/30 hover:bg-gold/5 transition-all"
            >
              <span className="text-xl">💬</span>
              <div>
                <p className="text-sm font-medium text-navy">View Inquiries</p>
                <p className="text-xs text-text-muted">{newInquiries} new {newInquiries === 1 ? "inquiry" : "inquiries"} waiting</p>
              </div>
            </Link>
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-100 hover:border-gold/30 hover:bg-gold/5 transition-all"
            >
              <span className="text-xl">💳</span>
              <div>
                <p className="text-sm font-medium text-navy">Stripe Dashboard</p>
                <p className="text-xs text-text-muted">View payments and orders</p>
              </div>
            </a>
            <Link
              href="/admin/orders"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-100 hover:border-gold/30 hover:bg-gold/5 transition-all"
            >
              <span className="text-xl">📦</span>
              <div>
                <p className="text-sm font-medium text-navy">Order Tracker</p>
                <p className="text-xs text-text-muted">Manage production & shipping</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Stripe Integration Status */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm lg:col-span-2">
          <div className="p-5 border-b border-gray-50">
            <h2 className="font-bold text-navy">Stripe Integration</h2>
          </div>
          <div className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💳</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-navy">Stripe is not connected yet</p>
              <p className="text-xs text-text-muted mt-0.5">
                Connect your Stripe account to enable payments, sync products, and track orders.
              </p>
            </div>
            <Link
              href="/admin/settings"
              className="bg-navy hover:bg-navy-light text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              Connect Stripe
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
