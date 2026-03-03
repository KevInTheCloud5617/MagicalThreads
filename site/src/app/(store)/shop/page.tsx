"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  slug: string;
  tag?: string;
  image?: string;
  active: boolean;
}

const categories = [
  { slug: "crewnecks", name: "Embroidered Crewnecks", emoji: "🧵" },
  { slug: "totes", name: "Tote Bags", emoji: "👜" },
  { slug: "cups", name: "Glass Cups", emoji: "🥤" },
  { slug: "vinyl", name: "Vinyl & Decals", emoji: "✂️" },
];

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  const filtered = activeCategory
    ? products.filter((p) => p.category === activeCategory)
    : products;

  return (
    <div>
      {/* Header */}
      <section className="bg-navy py-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-8 left-[15%] text-gold/20 text-xl animate-sparkle">✦</div>
          <div className="absolute bottom-6 right-[20%] text-gold/15 text-lg animate-sparkle" style={{ animationDelay: "1s" }}>✧</div>
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl font-bold text-white mb-3">
            Shop
          </h1>
          <p className="text-blue-light/80 text-lg">
            Browse handcrafted pieces, each made with love and a touch of magic
          </p>
        </div>
      </section>

      {/* Filters + Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-3 justify-center mb-10">
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
          {categories.map((cat) => (
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
                <div className="aspect-square bg-gradient-to-br from-blue-pale to-blue-light/20 flex items-center justify-center relative">
                  <span className="text-5xl opacity-25">
                    {categories.find((c) => c.slug === product.category)?.emoji || "🧵"}
                  </span>
                  {product.tag && (
                    <span className="absolute top-3 right-3 bg-gold text-navy text-xs font-semibold px-3 py-1 rounded-full">
                      {product.tag}
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
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-text-muted text-lg">No products in this category yet. Check back soon!</p>
          </div>
        )}
      </section>

      {/* Custom Orders CTA */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-blue-pale/50 rounded-2xl p-8 text-center border border-blue-pale">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-navy mb-3">
            Don&apos;t See What You&apos;re Looking For?
          </h2>
          <p className="text-text-muted mb-6">
            I love bringing custom ideas to life! Tell me your vision and I&apos;ll make it happen.
          </p>
          <Link
            href="/custom"
            className="bg-gold hover:bg-gold-light text-navy font-semibold px-8 py-3 rounded-full transition-all hover:shadow-lg text-sm uppercase tracking-wider inline-block"
          >
            Request a Custom Order
          </Link>
        </div>
      </section>
    </div>
  );
}
