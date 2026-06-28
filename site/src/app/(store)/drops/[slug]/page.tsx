import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/db";
import { CATEGORIES } from "@/lib/catalog";

interface Drop {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  emoji: string | null;
  colorFrom: string | null;
  colorTo: string | null;
  active: boolean;
}

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const drop: Drop | null = await prisma.drop.findUnique({ where: { slug } });

  if (!drop) return { title: "Drop Not Found | Magical Threads" };

  return {
    title: `${drop.name} | Magical Threads`,
    description: drop.tagline || `Shop the ${drop.name} collection at Magical Threads`,
  };
}

export default async function DropPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const drop: Drop | null = await prisma.drop.findUnique({ where: { slug } });
  if (!drop || !drop.active) notFound();

  const products = await prisma.product.findMany({
    where: { drop: slug, active: true },
    include: { sizes: true },
    orderBy: { createdAt: "desc" },
  });

  const colorFrom = drop.colorFrom || "#92400e";
  const colorTo = drop.colorTo || "#c2410c";

  return (
    <div className="bg-cream min-h-screen">
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(to bottom right, ${colorFrom}, ${colorTo})` }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-[10%] text-white/10 text-4xl">✦</div>
          <div className="absolute top-20 right-[15%] text-white/10 text-5xl">{drop.emoji || "✨"}</div>
          <div className="absolute bottom-12 left-[20%] text-white/10 text-3xl">✧</div>
          <div className="absolute bottom-8 right-[12%] text-white/10 text-4xl">✦</div>
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-4 py-16 md:py-24 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl font-bold text-white leading-tight mb-4">
            {drop.name}
          </h1>
          {drop.tagline && (
            <p className="font-[family-name:var(--font-inter)] text-white/85 text-lg md:text-xl max-w-2xl mx-auto italic">
              {drop.tagline}
            </p>
          )}
        </div>
      </section>

      {/* Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex items-center justify-between mb-8">
          <Link href="/drops" className="text-navy hover:text-gold transition-colors text-sm">
            ← Back to all drops
          </Link>
          <span className="text-sm text-text-muted">
            {products.length} {products.length === 1 ? "item" : "items"}
          </span>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-text-muted text-lg mb-6">
              No products in this drop yet. Check back soon!
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-full bg-gold text-navy px-8 py-3 text-sm font-semibold uppercase tracking-[0.15em] hover:bg-gold/90 transition-colors"
            >
              Shop All Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product: typeof products[number]) => {
              const totalStock = product.hasSize
                ? product.sizes.reduce((sum: number, s: { stock: number }) => sum + s.stock, 0)
                : product.stock;
              const category = CATEGORIES.find((c) => c.slug === product.category);

              return (
                <Link
                  key={product.id}
                  href={`/shop/${product.slug}`}
                  className="group bg-white rounded-2xl border border-blue-pale overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5"
                >
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
                        {category?.emoji || "✨"}
                      </div>
                    )}
                    {totalStock === 0 && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-white text-navy px-4 py-1.5 rounded-full text-sm font-semibold">
                          Sold Out
                        </span>
                      </div>
                    )}
                    {product.tag && totalStock > 0 && (
                      <span className="absolute top-3 left-3 bg-gold text-navy px-3 py-1 rounded-full text-xs font-semibold">
                        {product.tag}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-navy group-hover:text-gold transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-lg font-bold text-navy">
                        ${product.price.toFixed(2)}
                      </span>
                      {category && (
                        <span className="text-xs text-text-muted">
                          {category.emoji} {category.name}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
