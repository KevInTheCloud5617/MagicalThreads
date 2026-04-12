"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

export default function MockCheckoutPage() {
  const { items, clearCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const shipping = subtotal >= 120 ? 0 : 5.99;
  const total = subtotal + shipping;

  const handleCompletePurchase = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            id: i.id,
            quantity: i.quantity,
            ...(i.size !== "ONE_SIZE" ? { size: i.size } : {}),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Mock checkout failed");
        return;
      }

      clearCart();
      router.push(`/checkout/success?mock=1&order_id=${encodeURIComponent(data.orderId || "")}`);
    } catch {
      alert("Mock checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-navy mb-2">Mock Checkout</h1>
      <p className="text-text-muted mb-8">Review your order and complete a simulated purchase.</p>

      <div className="bg-white rounded-xl border border-blue-pale p-6 space-y-4">
        {items.length === 0 ? (
          <p className="text-text-muted">Your cart is empty.</p>
        ) : (
          items.map((item) => (
            <div key={item.key} className="flex justify-between text-sm">
              <span>{item.name} {item.size !== "ONE_SIZE" ? `(${item.size})` : ""} × {item.quantity}</span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))
        )}

        <div className="border-t pt-4 space-y-2 text-navy">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>{shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-blue-pale/30 border border-blue-pale rounded-xl p-3">
          <p className="text-sm text-navy">
            Your order ships within 10–12 business days. Keep an eye on your email for tracking info!
          </p>
        </div>

        <button
          onClick={handleCompletePurchase}
          disabled={loading || items.length === 0}
          className="w-full bg-navy text-white py-3 rounded-full disabled:opacity-50"
        >
          {loading ? "Completing..." : "Complete Purchase"}
        </button>
      </div>
    </div>
  );
}
