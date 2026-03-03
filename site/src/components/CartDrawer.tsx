"use client";

import { useCart } from "@/context/CartContext";
import { useState } from "react";

export default function CartDrawer() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, isCartOpen, setIsCartOpen, clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  if (!isCartOpen) return null;

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity, priceId: (i as unknown as Record<string, unknown>).priceId })) }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Checkout failed. Make sure Stripe is configured.");
      }
    } catch {
      alert("Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsCartOpen(false)} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-cream z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-navy/10">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-navy">
            Your Cart ({totalItems})
          </h2>
          <button onClick={() => setIsCartOpen(false)} className="text-navy/60 hover:text-navy text-2xl">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <p className="text-text-muted text-center py-12">Your cart is empty</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 bg-white rounded-xl p-4 border border-blue-pale">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-pale to-blue-light/20 rounded-lg flex items-center justify-center text-2xl opacity-30">🧵</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-navy text-sm truncate">{item.name}</h3>
                  <p className="text-gold font-semibold text-sm">${item.price.toFixed(2)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 rounded bg-navy/10 text-navy text-xs flex items-center justify-center hover:bg-navy/20">−</button>
                    <span className="text-sm text-navy">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 rounded bg-navy/10 text-navy text-xs flex items-center justify-center hover:bg-navy/20">+</button>
                    <button onClick={() => removeItem(item.id)} className="ml-auto text-red-400 hover:text-red-600 text-xs">Remove</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-navy/10 space-y-3">
            <div className="flex justify-between text-navy font-semibold">
              <span>Total</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-navy hover:bg-navy-light text-white font-semibold py-3 rounded-full transition-colors text-sm uppercase tracking-wider disabled:opacity-50"
            >
              {loading ? "Processing..." : "Checkout"}
            </button>
            <button onClick={clearCart} className="w-full text-text-muted hover:text-navy text-sm py-2 transition-colors">
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
