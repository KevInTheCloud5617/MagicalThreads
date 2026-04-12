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

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((prods) => {
        setProducts(prods);
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

  const stats = [
    { label: "Total Products", value: products.length, icon: "🧵", color: "bg-blue-pale" },
    { label: "Active Products", value: activeProducts, icon: "✅", color: "bg-green/10" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
        <p className="text-text-muted text-sm mt-1">Welcome back! Here&apos;s what&apos;s happening.</p>
      </div>

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
      </div>
    </div>
  );
}
