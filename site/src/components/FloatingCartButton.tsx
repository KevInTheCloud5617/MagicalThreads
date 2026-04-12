"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";

export default function FloatingCartButton() {
  const { totalItems, setIsCartOpen } = useCart();
  const prevTotalRef = useRef(totalItems);
  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    const wasEmpty = prevTotalRef.current === 0;
    const hasItemsNow = totalItems > 0;

    if (wasEmpty && hasItemsNow) {
      setIsEntering(true);
      const timeout = setTimeout(() => setIsEntering(false), 240);
      return () => clearTimeout(timeout);
    }

    prevTotalRef.current = totalItems;
  }, [totalItems]);

  useEffect(() => {
    prevTotalRef.current = totalItems;
  }, [totalItems]);

  if (totalItems <= 0) return null;

  return (
    <button
      onClick={() => setIsCartOpen(true)}
      aria-label="Open cart"
      className={`fixed bottom-6 right-4 md:bottom-8 md:right-8 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-[0_10px_25px_rgba(0,0,0,0.32)] hover:brightness-105 active:scale-95 transition-all duration-200 flex items-center justify-center ${
        isEntering ? "opacity-0 scale-90 animate-[fabIn_240ms_ease-out_forwards]" : "opacity-100 scale-100"
      }`}
    >
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.9}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5.4 5M7 13l-1 5h13m-9 0a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2z" />
      </svg>

      <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[11px] font-bold leading-none flex items-center justify-center shadow-sm">
        {totalItems}
      </span>
    </button>
  );
}
