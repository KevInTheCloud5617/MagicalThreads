"use client";

import { useCart } from "@/context/CartContext";

export default function AddToCartButton({ product }: { product: { id: string; name: string; price: number; category?: string; image?: string } }) {
  const { addItem } = useCart();

  return (
    <button
      onClick={() => addItem({ id: product.id, name: product.name, price: product.price, category: product.category, image: product.image })}
      className="w-full bg-navy hover:bg-navy-light text-white font-semibold py-3.5 rounded-full transition-colors text-sm uppercase tracking-wider"
    >
      Add to Cart — ${product.price.toFixed(2)}
    </button>
  );
}
