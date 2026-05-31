"use client";

import { useCart, MAX_CART_ITEMS } from "@/context/CartContext";
import { useEffect, useMemo, useState } from "react";

export default function CartDrawer() {
  const { items, removeItem, updateQuantity, syncItemStocks, totalItems, totalPrice, isCartOpen, setIsCartOpen, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const shipping = totalPrice >= 120 ? 0 : 5.99;
  const checkoutTotal = totalPrice + shipping;

  const itemSignature = useMemo(
    () => items.map((i) => `${i.id}:${i.size}:${i.quantity}`).sort().join("|"),
    [items]
  );

  useEffect(() => {
    if (!isCartOpen || items.length === 0) return;
    let cancelled = false;

    const syncStock = async () => {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        if (!res.ok) return;
        const products = await res.json();
        if (!Array.isArray(products) || cancelled) return;

        const updates = items.map((item) => {
          const product = products.find((p: { id: string; stock?: number; sizes?: Array<{ size: string; stock: number }> }) => p.id === item.id);
          if (!product) return null;

          if (item.size !== "ONE_SIZE") {
            const sizeRow = Array.isArray(product.sizes)
              ? product.sizes.find((s: { size: string; stock: number }) => s.size === item.size)
              : null;
            return { id: item.id, size: item.size, availableStock: Math.max(0, sizeRow?.stock ?? 0) };
          }

          return { id: item.id, size: "ONE_SIZE", availableStock: Math.max(0, product.stock ?? 0) };
        }).filter(Boolean) as Array<{ id: string; size: string; availableStock: number }>;

        if (!cancelled && updates.length > 0) {
          syncItemStocks(updates);
        }
      } catch {
        // Ignore stock sync failures; checkout validation still protects inventory.
      }
    };

    syncStock();

    return () => {
      cancelled = true;
    };
  }, [isCartOpen, itemSignature, items, syncItemStocks]);

  if (!isCartOpen) return null;

  const handleCheckout = async () => {
    const mode = (process.env.NEXT_PUBLIC_STRIPE_MODE || "mock").toLowerCase();
    if (mode === "mock") {
      window.location.href = "/checkout/mock";
      return;
    }

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
            ...(i.customization ? { customization: i.customization } : {}),
          })),
        }),
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
              <div key={item.key} className="flex gap-4 bg-white rounded-xl p-4 border border-blue-pale">
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-blue-pale/70 bg-gradient-to-br from-blue-pale to-blue-light/20 flex items-center justify-center">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl opacity-30">🧵</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-navy text-sm truncate">{item.name}</h3>
                  <p className="text-gold font-semibold text-sm">${item.price.toFixed(2)}</p>
                  {item.size !== "ONE_SIZE" && <p className="text-text-muted text-xs">Size: {item.size}</p>}
                  {item.customization && (() => {
                    const fontFamily = ({
                      Script: 'var(--font-script), "Brush Script MT", cursive',
                      Block: 'var(--font-block), "Arial Black", Impact, sans-serif',
                      Varsity: 'var(--font-varsity), Impact, "Arial Black", sans-serif',
                      Cursive: 'var(--font-cursive), "Snell Roundhand", cursive',
                      Serif: 'var(--font-playfair), Georgia, "Times New Roman", serif',
                    } as Record<string, string>)[item.customization.font] || 'inherit';
                    return (
                      <div className="mt-0.5 text-[11px] leading-snug">
                        <div className="text-text-muted">
                          Personalization (
                          <span style={{ fontFamily, color: item.customization.color.hex }} className="text-base align-middle">
                            {item.customization.text}
                          </span>
                          ) — {item.customization.color.name} {item.customization.font}, {item.customization.placement}
                          {item.customization.upcharge > 0 ? ` (+$${item.customization.upcharge.toFixed(2)})` : ""}
                        </div>
                      </div>
                    );
                  })()}
                  <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => updateQuantity(item.key, item.quantity - 1)} className="w-6 h-6 rounded bg-navy/10 text-navy text-xs flex items-center justify-center hover:bg-navy/20">−</button>
                    <span className="text-sm text-navy">{item.quantity}</span>
                    {(() => {
                      const atStockLimit = typeof item.availableStock === "number" && item.quantity >= item.availableStock;
                      const atCartLimit = totalItems >= MAX_CART_ITEMS;
                      const plusDisabled = atStockLimit || atCartLimit;
                      return (
                        <>
                          <button
                            onClick={() => updateQuantity(item.key, item.quantity + 1)}
                            disabled={plusDisabled}
                            title={atStockLimit ? "Maximum available stock reached" : atCartLimit ? "Cart limit reached" : "Increase quantity"}
                            className={`w-6 h-6 rounded text-xs flex items-center justify-center ${plusDisabled ? "bg-navy/5 text-navy/30 cursor-not-allowed" : "bg-navy/10 text-navy hover:bg-navy/20"}`}
                          >
                            +
                          </button>
                          {atStockLimit && <span className="text-[10px] text-text-muted">(max)</span>}
                        </>
                      );
                    })()}
                    <button onClick={() => removeItem(item.key)} className="ml-auto text-red-400 hover:text-red-600 text-xs">Remove</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (() => {
          const personalizationTotal = items.reduce((sum, i) => sum + (i.customization?.upcharge ?? 0) * i.quantity, 0);
          const baseSubtotal = totalPrice - personalizationTotal;
          return (
          <div className="p-6 border-t border-navy/10 space-y-3">
            <div className="flex justify-between text-sm text-text-muted">
              <span>Subtotal</span>
              <span>${baseSubtotal.toFixed(2)}</span>
            </div>
            {personalizationTotal > 0 && (
              <div className="flex justify-between text-sm text-text-muted">
                <span>Personalization</span>
                <span>+${personalizationTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-text-muted">
              <span>Shipping</span>
              <span>{shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-navy font-semibold">
              <span>Total</span>
              <span>${checkoutTotal.toFixed(2)}</span>
            </div>
            <p className="text-xs text-text-muted">Free shipping on orders over $120! Orders ship within 10-12 business days.</p>
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
          );
        })()}
      </div>
    </>
  );
}
