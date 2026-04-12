"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export const MAX_CART_ITEMS = 5;
export const BULK_ORDER_MESSAGE = "For orders of more than 5 items, please email us at meg@magicalthreadswithmeg.com for bulk pricing!";

export interface CartItem {
  id: string;
  size: string;
  key: string;
  name: string;
  price: number;
  quantity: number;
  availableStock?: number;
  image?: string;
  category?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity" | "key">) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  syncItemStocks: (stocks: Array<{ id: string; size: string; availableStock: number }>) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("mt_cart");
    if (saved) {
      try { setItems(JSON.parse(saved)); } catch {}
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem("mt_cart", JSON.stringify(items));
  }, [items, loaded]);

  const addItem = useCallback((item: Omit<CartItem, "quantity" | "key">) => {
    const itemKey = `${item.id}::${item.size}`;
    setItems((prev) => {
      const currentTotal = prev.reduce((sum, i) => sum + i.quantity, 0);
      if (currentTotal >= MAX_CART_ITEMS) {
        alert(BULK_ORDER_MESSAGE);
        return prev;
      }
      const existing = prev.find((i) => i.key === itemKey);
      if (existing) {
        const maxAllowed = typeof existing.availableStock === "number" ? existing.availableStock : Number.POSITIVE_INFINITY;
        return prev.map((i) => i.key === itemKey ? { ...i, quantity: Math.min(i.quantity + 1, maxAllowed) } : i);
      }
      const initialQty = typeof item.availableStock === "number" ? Math.min(1, item.availableStock) : 1;
      if (initialQty <= 0) return prev;
      return [...prev, { ...item, key: itemKey, quantity: initialQty }];
    });
    setIsCartOpen(true);
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.key !== key));
    } else {
      setItems((prev) => {
        const currentTotal = prev.reduce((sum, i) => sum + i.quantity, 0);
        const existing = prev.find((i) => i.key === key);
        const diff = quantity - (existing?.quantity || 0);
        if (diff > 0 && currentTotal + diff > MAX_CART_ITEMS) {
          alert(BULK_ORDER_MESSAGE);
          return prev;
        }
        return prev.map((i) => {
          if (i.key !== key) return i;
          const maxAllowed = typeof i.availableStock === "number" ? i.availableStock : Number.POSITIVE_INFINITY;
          return { ...i, quantity: Math.min(quantity, maxAllowed) };
        });
      });
    }
  }, []);

  const syncItemStocks = useCallback((stocks: Array<{ id: string; size: string; availableStock: number }>) => {
    const byKey = new Map(stocks.map((s) => [`${s.id}::${s.size}`, s.availableStock]));
    setItems((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        const availableStock = byKey.get(item.key);
        if (typeof availableStock !== "number") return item;
        const nextQuantity = Math.min(item.quantity, availableStock);
        if (item.availableStock === availableStock && item.quantity === nextQuantity) return item;
        changed = true;
        return {
          ...item,
          availableStock,
          quantity: nextQuantity,
        };
      });
      return changed ? next : prev;
    });
  }, []);

  const clearCart = useCallback(() => { setItems([]); localStorage.removeItem("mt_cart"); }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, syncItemStocks, clearCart, totalItems, totalPrice, isCartOpen, setIsCartOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
