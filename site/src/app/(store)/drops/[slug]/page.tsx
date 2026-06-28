import { notFound } from "next/navigation";
import Link from "next/link";
import { DROPS, CATEGORIES, getDropBySlug } from "@/lib/catalog";
import prisma from "@/lib/db";

export async function generateStaticParams() {
  return DROPS.map((drop) => ({ slug: drop.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const drop = getDropBySlug(slug);
  if (!drop) return { title: "Drop Not Found" };
  return {
    title: `${drop.name} | Magical Threads`,
    description: drop.description,
  };
}

export default async function DropPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const drop = getDropBySlug(slug);

  if (!drop) {
    notFound();
  }

  // If drop is not active yet, show coming soon
  if (!drop.active) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="text-6xl mb-6">{drop.emoji}</div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl font-bold text-navy mb-4 text-center">
          {drop.name}
        </h1>
        <p className="text-xl text-text-muted mb-2">{drop.tagline}</p>
        <div className="bg-gold/20 text-navy px-6 py-3 rounded-full font-medium mt-4">
          ✨ Coming Soon ✨
        </div>
        <p className="text-text-muted mt-6 max-w-md text-center">
          {drop.description}
        </p>
        <Link
          href="/shop"
          className="mt-8 text-gold hover:underline font-medium"
        >
          ← Browse all products
        </Link>
      </div>
    );
  }

  // Fetch products for this drop
  const products = await prisma.product.findMany({
    where: {
      drop: slug,
      active: true,
    },
    include: {
      sizes: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      {/* Hero Section with drop branding */}
      <section className={`bg-gradient-to-br ${drop.color} py-20 text-center relative overflow-hidden`}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-[10%] text-white/20 text-2xl animate-sparkle">✦</div>
          <div className="absolute bottom-8 right-[15%] text-white/15 text-xl animate-sparkle" style={{ animationDelay: "0.8s" }}>✧</div>
          <div className="absolute top-1/3 right-[8%] text-white/10 text-3xl animate-sparkle" style={{ animationDelay: "1.5s" }}>✨</div>
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <div className="text-5xl mb-4">{drop.emoji}</div>
          <p className="text-white/80 text-xs md:text-sm tracking-[0.35em] uppercase mb-3">
            Collection Drop
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl font-bold text-white mb-4">
            {drop.name}
          </h1>
          <div className="mx-auto mb-4 h-px w-40 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          <p className="text-white/90 text-lg italic">
            {drop.tagline}
          </p>
          <p className="text-white/75 text-base mt-4 max-w-xl mx-auto">
            {drop.description}
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <p className="text-text-muted">
            {products.length} {products.length === 1 ? "item" : "items"} in this drop
          </p>
          <Link href="/shop" className="text-gold hover:underline text-sm font-medium">
            ← Back to all products
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-text-muted text-lg mb-4">
              Products for this drop are coming soon!
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

              return (
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
                    {totalStock <= 0 && (
                      <p className="text-red-500 text-xs font-medium mt-1">Out of Stock</p>
                    )}
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
