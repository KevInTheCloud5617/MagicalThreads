"use client";

import { useCart, MAX_CART_ITEMS, BULK_ORDER_MESSAGE } from "@/context/CartContext";

export default function AddToCartButton({ product }: { product: { id: string; name: string; price: number; stock?: number; category?: string; image?: string } }) {
  const { addItem, items } = useCart();

  const stock = product.stock ?? 0;
  const cartQty = items.find((i) => i.id === product.id)?.quantity ?? 0;
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const outOfStock = stock <= 0;
  const atStockLimit = cartQty >= stock;
  const atCartLimit = totalItems >= MAX_CART_ITEMS;
  const disabled = outOfStock || atStockLimit || atCartLimit;

  const handleClick = () => {
    if (atCartLimit) {
      alert(BULK_ORDER_MESSAGE);
      return;
    }
    if (atStockLimit) {
      alert(`Only ${stock} available for ${product.name}`);
      return;
    }
    addItem({ id: product.id, name: product.name, price: product.price, category: product.category, image: product.image });
  };

  const label = outOfStock
    ? "Out of Stock"
    : `Add to Cart — $${product.price.toFixed(2)}`;

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={disabled}
        className="w-full bg-navy hover:bg-navy-light text-white font-semibold py-3.5 rounded-full transition-colors text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {label}
      </button>
      {!outOfStock && stock <= 5 && (
        <p className="text-xs text-amber-600 text-center mt-2">Only {stock} left in stock</p>
      )}
    </div>
  );
}
