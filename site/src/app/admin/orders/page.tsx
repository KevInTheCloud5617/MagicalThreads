"use client";

import { useEffect, useState } from "react";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  size?: string | null;
  color?: string | null;
  product: { name: string };
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  shippingStatus: "pending" | "shipped" | "delivered";
  trackingNumber: string;
  items: OrderItem[];
  createdAt: string;
  archived?: boolean;
}

const SHIPPING_STATUSES: Array<Order["shippingStatus"]> = ["pending", "shipped", "delivered"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function loadOrders() {
    const res = await fetch("/api/admin/orders");
    const data = await res.json();
    setOrders(data);
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function updateOrder(id: string, updates: Partial<Pick<Order, "status" | "trackingNumber" | "shippingStatus">>) {
    setSavingId(id);
    const payload: Record<string, unknown> = { id };

    if (updates.shippingStatus) {
      payload.status = updates.shippingStatus;
    }
    if (updates.status) {
      payload.status = updates.status;
    }
    if (updates.trackingNumber !== undefined) {
      payload.trackingNumber = updates.trackingNumber;
    }

    await fetch("/api/admin/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await loadOrders();
    setSavingId(null);
  }

  function setDraftTracking(id: string, tracking: string) {
    setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, trackingNumber: tracking } : order)));
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">Orders</h1>
          <p className="text-text-muted text-sm mt-1">All active + archived orders</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/api/admin/orders/export"
            className="bg-green hover:bg-green/90 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            Download CSV
          </a>
          <a
            href="https://dashboard.stripe.com/payments"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-navy hover:bg-navy-light text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            View in Stripe ↗
          </a>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-bold text-navy text-sm">Orders ({orders.length})</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-text-muted">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No orders yet.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Customer</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Items</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Total</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Shipping</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Tracking</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-4">
                    <div className="text-sm font-medium text-navy">{order.customerName}</div>
                    <div className="text-xs text-text-muted">{order.customerEmail}</div>
                    {order.archived ? <div className="text-[10px] text-text-muted mt-1">Archived</div> : null}
                  </td>
                  <td className="px-5 py-4 text-sm text-text-muted max-w-xs">
                    {order.items.map((i) => `${i.product.name}${i.color ? ` [${i.color}]` : ""}${i.size ? ` (${i.size})` : ""}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`).join(", ")}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-navy">${order.total.toFixed(2)}</td>
                  <td className="px-5 py-4">
                    <select
                      value={order.shippingStatus || "pending"}
                      onChange={(e) => updateOrder(order.id, { shippingStatus: e.target.value as Order["shippingStatus"] })}
                      className="text-xs px-2 py-1 rounded border border-gray-200"
                      disabled={savingId === order.id}
                    >
                      {SHIPPING_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <input
                        value={order.trackingNumber || ""}
                        onChange={(e) => setDraftTracking(order.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded px-2 py-1 w-40"
                        placeholder="Tracking #"
                      />
                      <button
                        onClick={() => updateOrder(order.id, { trackingNumber: order.trackingNumber || "" })}
                        className="text-xs bg-navy text-white rounded px-2 py-1"
                        disabled={savingId === order.id}
                      >
                        Save
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-text-muted">{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
