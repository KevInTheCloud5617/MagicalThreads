"use client";

import { useMemo, useState } from "react";
import { useCart, MAX_CART_ITEMS, BULK_ORDER_MESSAGE } from "@/context/CartContext";
import type { Customization } from "@/lib/customization";

type ProductSize = { size: string; stock: number };

export default function AddToCartButton({ product, customization, customizationRequired, onRequireCustomization, variantColor, variantColorRequired }: { product: { id: string; name: string; price: number; stock?: number; hasSize?: boolean; category?: string; image?: string; sizes?: ProductSize[] }; customization?: Customization | null; customizationRequired?: boolean; onRequireCustomization?: () => void; variantColor?: string; variantColorRequired?: boolean }) {
  const { addItem, items } = useCart();

  const hasSize = Boolean(product.hasSize);
  const availableSizes = useMemo(
    () => (product.sizes ?? []).filter((s) => s.stock > 0),
    [product.sizes]
  );
  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0]?.size ?? "");

  const selectedSizeStock = availableSizes.find((s) => s.size === selectedSize)?.stock ?? 0;
  const stock = product.stock ?? 0;
  const cartLookupSize = hasSize ? selectedSize : "ONE_SIZE";
  const cartQty = items
    .filter((i) => i.id === product.id && i.size === cartLookupSize && (i.color ?? null) === (variantColor ?? null))
    .reduce((sum, i) => sum + i.quantity, 0);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  const outOfStock = hasSize ? availableSizes.length === 0 : stock <= 0;
  const noSizeSelected = hasSize ? !selectedSize : false;
  const noColorSelected = Boolean(variantColorRequired) && !variantColor;
  const atStockLimit = hasSize ? (selectedSize ? cartQty >= selectedSizeStock : false) : cartQty >= stock;
  const atCartLimit = totalItems >= MAX_CART_ITEMS;
  const disabled = outOfStock || noSizeSelected || noColorSelected || atStockLimit || atCartLimit;

  const handleClick = () => {
    if (atCartLimit) {
      alert(BULK_ORDER_MESSAGE);
      return;
    }
    if (hasSize && !selectedSize) {
      alert("Please select a size");
      return;
    }
    if (variantColorRequired && !variantColor) {
      alert("Please select a color");
      return;
    }

    const availableForSelection = hasSize ? selectedSizeStock : stock;
    if (cartQty + 1 > availableForSelection) {
      alert(hasSize ? `Only ${selectedSizeStock} available for ${product.name} (${selectedSize})` : `Only ${stock} available for ${product.name}`);
      return;
    }

    if (customizationRequired && !customization) {
      onRequireCustomization?.();
      alert("Please complete personalization before adding to cart");
      return;
    }

    addItem({
      id: product.id,
      size: hasSize ? selectedSize : "ONE_SIZE",
      name: product.name,
      price: product.price,
      availableStock: availableForSelection,
      category: product.category,
      image: product.image,
      ...(variantColor ? { color: variantColor } : {}),
      ...(customization ? { customization } : {}),
    });
  };

  const effectivePrice = product.price + (customization?.upcharge ?? 0);
  const label = outOfStock ? "Out of Stock" : `Add to Cart — $${effectivePrice.toFixed(2)}`;

  return (
    <div className="space-y-3">
      {hasSize && <div>
        <label className="block text-xs uppercase tracking-wider text-text-muted mb-2">Size</label>
        <select
          value={selectedSize}
          onChange={(e) => setSelectedSize(e.target.value)}
          disabled={outOfStock}
          className="w-full px-3 py-3 rounded-full border border-blue-pale bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 disabled:opacity-50"
        >
          {outOfStock ? (
            <option value="">No sizes available</option>
          ) : (
            availableSizes.map((s) => (
              <option key={s.size} value={s.size}>{s.size}</option>
            ))
          )}
        </select>
      </div>}
      <button
        onClick={handleClick}
        disabled={disabled}
        className="w-full bg-navy hover:bg-navy-light text-white font-semibold py-3.5 rounded-full transition-colors text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {label}
      </button>

      {!outOfStock && hasSize && selectedSizeStock > 0 && selectedSizeStock <= 5 && (
        <p className="text-xs text-amber-600 text-center">Only {selectedSizeStock} left in size {selectedSize}</p>
      )}
      {!outOfStock && !hasSize && stock > 0 && stock <= 5 && (
        <p className="text-xs text-amber-600 text-center">Only {stock} left</p>
      )}
    </div>
  );
}
