"use client";

import { useCart } from "@/context/CartContext";

export default function CartButton() {
  const { totalItems, setIsCartOpen } = useCart();
  return (
    <button
      onClick={() => setIsCartOpen(true)}
      className="relative p-2 text-white/80 hover:text-white transition-colors"
      aria-label="Open cart"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-gold text-navy text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {totalItems}
        </span>
      )}
    </button>
  );
}
