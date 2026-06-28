"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CATEGORIES } from "@/lib/catalog";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  drop?: string | null;
  description: string;
  slug: string;
  tag?: string;
  image?: string;
  stock?: number;
  hasSize?: boolean;
  sizes?: Array<{ size: string; stock: number }>;
  active: boolean;
}

interface Drop {
  id: string;
  slug: string;
  name: string;
  emoji: string | null;
}

export default function ShopPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeDrop, setActiveDrop] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Read initial filters from URL
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    const dropParam = searchParams.get("drop");
    if (categoryParam) setActiveCategory(categoryParam);
    if (dropParam) setActiveDrop(dropParam);
  }, [searchParams]);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/drops").then((r) => r.json()),
    ]).then(([productsData, dropsData]) => {
      setProducts(productsData);
      setDrops(dropsData);
      setLoading(false);
    });
  }, []);

  const filtered = products.filter((p) => {
    if (activeCategory && p.category !== activeCategory) return false;
    if (activeDrop && p.drop !== activeDrop) return false;
    return true;
  });

  return (
    <div>
      {/* Header */}
      <section className="bg-navy py-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-8 left-[15%] text-gold/20 text-xl animate-sparkle">✦</div>
          <div className="absolute bottom-6 right-[20%] text-gold/15 text-lg animate-sparkle" style={{ animationDelay: "1s" }}>✧</div>
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <p className="text-gold/85 text-xs md:text-sm tracking-[0.35em] uppercase mb-3">Our Collection</p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl font-bold text-white mb-4">
            Shop the Magic
          </h1>
          <div className="mx-auto mb-4 h-px w-40 bg-gradient-to-r from-transparent via-gold/80 to-transparent" />
          <p className="text-blue-light/90 text-lg">
            Each piece handcrafted with love and a touch of magic ✨
          </p>
        </div>
      </section>

      {/* Filters + Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Drop Filters */}
        {drops.length > 0 && (
          <div className="mb-6">
            <p className="text-sm text-text-muted mb-2 text-center">Shop by Drop</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => setActiveDrop(null)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  activeDrop === null
                    ? "bg-gold text-navy shadow-md"
                    : "bg-white text-navy border border-blue-pale hover:border-gold/50"
                }`}
              >
                All Drops
              </button>
              {drops.map((drop) => (
                <button
                  key={drop.slug}
                  onClick={() => setActiveDrop(drop.slug)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                    activeDrop === drop.slug
                      ? "bg-gold text-navy shadow-md"
                      : "bg-white text-navy border border-blue-pale hover:border-gold/50"
                  }`}
                >
                  {drop.emoji} {drop.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category Filters */}
        <div className="mb-10">
          <p className="text-sm text-text-muted mb-2 text-center">Filter by Category</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === null
                  ? "bg-navy text-white shadow-md"
                  : "bg-white text-navy border border-blue-pale hover:border-navy/30"
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.slug
                    ? "bg-navy text-white shadow-md"
                    : "bg-white text-navy border border-blue-pale hover:border-navy/30"
                }`}
              >
                {cat.emoji} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Active Filters Summary */}
        {(activeCategory || activeDrop) && (
          <div className="text-center mb-6">
            <span className="text-text-muted text-sm">
              Showing{" "}
              {activeDrop && (
                <span className="font-medium text-navy">
                  {drops.find((d) => d.slug === activeDrop)?.name}
                </span>
              )}
              {activeDrop && activeCategory && " → "}
              {activeCategory && (
                <span className="font-medium text-navy">
                  {CATEGORIES.find((c) => c.slug === activeCategory)?.name}
                </span>
              )}
            </span>
            <button
              onClick={() => {
                setActiveCategory(null);
                setActiveDrop(null);
              }}
              className="ml-3 text-sm text-gold hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Product Grid */}
        {loading ? (
          <div className="text-center py-16 text-text-muted">Loading products...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((product) => (
              <Link
                href={`/shop/${product.slug}`}
                key={product.id}
                className="group bg-white rounded-2xl overflow-hidden border border-blue-pale hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="aspect-square bg-gradient-to-br from-blue-pale to-blue-light/20 flex items-center justify-center relative overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-5xl opacity-25">
                      {CATEGORIES.find((c) => c.slug === product.category)?.emoji || "🧵"}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-[family-name:var(--font-display)] font-semibold text-navy group-hover:text-gold transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-text-muted text-sm mt-1 line-clamp-2">
                    {product.description}
                  </p>
                  <p className="text-gold font-semibold mt-2">
                    ${product.price.toFixed(2)}
                  </p>
                  {(product.hasSize ? (product.sizes ?? []).reduce((sum: number, s: { stock: number }) => sum + s.stock, 0) <= 0 : (product.stock ?? 0) <= 0) && (
                    <p className="text-red-500 text-xs font-medium mt-1">Out of Stock</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-text-muted text-lg">No products match your filters. Try adjusting your selection!</p>
          </div>
        )}
      </section>
    </div>
  );
}
