"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: { name: string };
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  trackingNumber: string | null;
  notes: string;
  items: OrderItem[];
  createdAt: string;
}

const statusConfig: Record<string, { label: string; style: string }> = {
  "pending-payment": { label: "Pending Payment", style: "bg-gold/20 text-gold" },
  "paid": { label: "Paid", style: "bg-green/10 text-green" },
  "in-production": { label: "In Production", style: "bg-blue-light/20 text-navy" },
  "ready-to-ship": { label: "Ready to Ship", style: "bg-blue-pale text-navy" },
  "shipped": { label: "Shipped", style: "bg-green/10 text-green" },
  "delivered": { label: "Delivered", style: "bg-gray-100 text-text-muted" },
};

const pipeline = [
  { status: "pending-payment", label: "Pending Payment", icon: "💳" },
  { status: "paid", label: "Paid", icon: "✅" },
  { status: "in-production", label: "In Production", icon: "🧵" },
  { status: "ready-to-ship", label: "Ready to Ship", icon: "📫" },
  { status: "shipped", label: "Shipped", icon: "📦" },
  { status: "delivered", label: "Delivered", icon: "🏠" },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => { setOrders(data); setLoading(false); });
  }, []);

  async function updateStatus(id: string, status: string) {
    await fetch("/api/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const res = await fetch("/api/orders");
    setOrders(await res.json());
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">Orders</h1>
          <p className="text-text-muted text-sm mt-1">Track production and shipping</p>
        </div>
        <a
          href="https://dashboard.stripe.com/payments"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-navy hover:bg-navy-light text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors inline-flex items-center gap-2"
        >
          💳 View in Stripe ↗
        </a>
      </div>

      {/* Order Pipeline */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {pipeline.map((stage) => {
          const count = orders.filter((o) => o.status === stage.status).length;
          return (
            <div key={stage.status} className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <span className="text-xl block mb-1">{stage.icon}</span>
              <p className="text-lg font-bold text-navy">{count}</p>
              <p className="text-xs text-text-muted">{stage.label}</p>
            </div>
          );
        })}
      </div>

      {/* Stripe Connection Banner */}
      <div className="bg-gold/10 border border-gold/30 rounded-xl p-5 mb-6 flex items-center gap-4">
        <span className="text-2xl">⚡</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-navy">Connect Stripe to see real orders</p>
          <p className="text-xs text-text-muted mt-0.5">
            Once connected, orders will automatically appear here when customers complete checkout.
          </p>
        </div>
        <Link href="/settings" className="bg-gold hover:bg-gold/90 text-navy text-sm font-medium px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap">
          Connect Stripe
        </Link>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-bold text-navy text-sm">Orders ({orders.length})</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-text-muted">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No orders yet. They&apos;ll appear here once Stripe is connected and customers start checking out.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Customer</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Items</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Total</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-4">
                    <div className="text-sm font-medium text-navy">{order.customerName}</div>
                    <div className="text-xs text-text-muted">{order.customerEmail}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-text-muted">
                    {order.items.map((i) => `${i.product.name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`).join(", ")}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-navy">${order.total.toFixed(2)}</td>
                  <td className="px-5 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer ${statusConfig[order.status]?.style || "bg-gray-100"}`}
                    >
                      {pipeline.map((s) => (
                        <option key={s.status} value={s.status}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-sm text-text-muted">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
