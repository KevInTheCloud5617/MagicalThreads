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
  const [firstName, setFirstName] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  async function loadDashboard() {
    setLoading(true);

    const authRes = await fetch("/api/auth/me", { cache: "no-store" });
    if (authRes.status === 401) {
      setNeedsLogin(true);
      setLoading(false);
      return;
    }

    const auth = await authRes.json();
    const prodsRes = await fetch("/api/products", { cache: "no-store" });
    const prodsData = await prodsRes.json();

    setProducts(Array.isArray(prodsData) ? prodsData : []);
    setFirstName(auth?.firstName ?? null);
    setNeedsLogin(false);
    setLoading(false);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      setLoginError("Invalid password");
      return;
    }

    setPassword("");
    await loadDashboard();
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <p className="text-text-muted">Loading...</p>
      </div>
    );
  }

  if (needsLogin) {
    return (
      <div className="p-4 md:p-8 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h1 className="text-2xl font-bold text-navy mb-2">Admin Sign In</h1>
          <p className="text-sm text-text-muted mb-6">Enter your admin password to continue.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-11 rounded-lg border border-gray-200 px-3 py-2.5"
                required
              />
            </div>
            {loginError && <p className="text-sm text-red-600">{loginError}</p>}
            <button
              type="submit"
              className="w-full min-h-11 bg-navy hover:bg-navy-light text-white font-medium px-4 py-2.5 rounded-lg"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    );
  }

  const activeProducts = products.filter((p) => p.active).length;

  const stats = [
    { label: "Total Products", value: products.length, icon: "🧵", color: "bg-blue-pale" },
    { label: "Active Products", value: activeProducts, icon: "✅", color: "bg-green/10" },
  ];

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
        <p className="text-text-muted text-sm mt-1">{firstName ? `Welcome back, ${firstName}!` : "Welcome back!"} Here&apos;s what&apos;s happening.</p>
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
              href="/products"
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
              href="/orders"
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
