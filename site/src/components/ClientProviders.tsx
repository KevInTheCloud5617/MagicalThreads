"use client";

import { CartProvider } from "@/context/CartContext";
import CartDrawer from "./CartDrawer";
import FloatingCartButton from "./FloatingCartButton";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <FloatingCartButton />
      <CartDrawer />
    </CartProvider>
  );
}
