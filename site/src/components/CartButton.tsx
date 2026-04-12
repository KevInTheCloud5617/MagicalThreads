"use client";

import { useCart } from "@/context/CartContext";

type CartButtonProps = {
  className?: string;
};

export default function CartButton({ className = "" }: CartButtonProps) {
  const { totalItems, setIsCartOpen } = useCart();
  return (
    <button
      onClick={() => setIsCartOpen(true)}
      className={`relative inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-white/80 hover:text-gold transition-colors ${className}`}
      aria-label="Open cart"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-gold text-navy text-xs font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center">
          {totalItems}
        </span>
      )}
    </button>
  );
}
