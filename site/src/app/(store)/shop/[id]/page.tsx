import { getProductBySlug, getProducts, categories } from "@/data/products";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductBySlug(id);

  if (!product) return notFound();

  const allProducts = await getProducts();
  const categoryInfo = categories.find((c) => c.slug === product.category);
  const related = allProducts.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 3);

  return (
    <div>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/shop" className="text-text-muted hover:text-navy transition-colors text-sm inline-flex items-center gap-1 mb-8">
          ← Back to Shop
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-square bg-gradient-to-br from-blue-pale to-blue-light/20 rounded-2xl flex items-center justify-center relative">
            <span className="text-8xl opacity-25">{categoryInfo?.emoji || "🧵"}</span>
            {product.tag && (
              <span className="absolute top-4 right-4 bg-gold text-navy text-sm font-semibold px-4 py-1.5 rounded-full">{product.tag}</span>
            )}
          </div>

          <div className="flex flex-col justify-center">
            <div className="text-sm text-text-muted mb-2 uppercase tracking-wider">
              {categoryInfo?.emoji} {categoryInfo?.name}
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold text-navy mb-4">{product.name}</h1>
            <p className="text-gold text-2xl font-semibold mb-6">${product.price.toFixed(2)}</p>
            <p className="text-text-muted leading-relaxed mb-8">{product.description}</p>

            <div className="space-y-3">
              <button className="w-full bg-navy hover:bg-navy-light text-white font-semibold py-3.5 rounded-full transition-colors text-sm uppercase tracking-wider">
                Add to Cart — Coming Soon
              </button>
              <Link href="/custom" className="block w-full text-center border-2 border-gold text-gold hover:bg-gold hover:text-navy font-medium py-3.5 rounded-full transition-all text-sm uppercase tracking-wider">
                Request Custom Version
              </Link>
            </div>

            <p className="text-text-muted/60 text-xs mt-4 text-center">
              ✨ Handcrafted with love • Made to order • Ships in 5–7 business days
            </p>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-navy mb-6">You Might Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {related.map((p) => (
              <Link href={`/shop/${p.slug}`} key={p.id} className="group bg-white rounded-2xl overflow-hidden border border-blue-pale hover:shadow-lg transition-all">
                <div className="aspect-square bg-gradient-to-br from-blue-pale to-blue-light/20 flex items-center justify-center">
                  <span className="text-4xl opacity-25">{categories.find(c => c.slug === p.category)?.emoji || "🧵"}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-[family-name:var(--font-display)] font-semibold text-navy text-sm group-hover:text-gold transition-colors">{p.name}</h3>
                  <p className="text-gold font-semibold text-sm mt-1">${p.price.toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
