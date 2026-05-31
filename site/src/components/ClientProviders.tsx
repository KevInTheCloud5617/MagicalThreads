"use client";

import { CartProvider } from "@/context/CartContext";
import CartDrawer from "./CartDrawer";
import FloatingCartButton from "./FloatingCartButton";
import { FeatureFlagsProvider } from "@/lib/useFeature";
import type { FeatureFlag } from "@/lib/feature-flags";

export default function ClientProviders({
  children,
  flags,
}: {
  children: React.ReactNode;
  flags?: Partial<Record<FeatureFlag, boolean>>;
}) {
  return (
    <FeatureFlagsProvider initial={flags ?? {}}>
      <CartProvider>
        {children}
        <FloatingCartButton />
        <CartDrawer />
      </CartProvider>
    </FeatureFlagsProvider>
  );
}
