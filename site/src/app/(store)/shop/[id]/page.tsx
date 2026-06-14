import { getProductBySlug, getProducts, categories } from "@/data/products";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductPurchasePanel from "@/components/ProductPurchasePanel";
import ProductImageGallery from "@/components/ProductImageGallery";
import { parseCustomizationOptions, type CustomizationOptions } from "@/lib/customization";

type ProductView = {
  id: string;
  slug: string;
  name: string;
  price: number;
  category: string;
  description: string;
  image?: string | null;
  stock?: number | null;
  hasSize?: boolean | null;
  hasColor?: boolean | null;
  sizes?: Array<{ size: string; stock: number }>;
  images?: Array<{ url: string; alt?: string | null; sortOrder: number }>;
  colors?: Array<{ name: string; hex: string; sortOrder: number }>;
  customizationOptions?: string | null;
};

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = (await getProductBySlug(id)) as ProductView | null;

  if (!product) return notFound();

  const customizationOptions: CustomizationOptions | null = parseCustomizationOptions(product.customizationOptions ?? null);
  const allProducts = (await getProducts()) as ProductView[];
  const categoryInfo = categories.find((c) => c.slug === product.category);
  const related = allProducts.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 3);

  return (
    <div>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/shop" className="text-text-muted hover:text-navy transition-colors text-sm inline-flex items-center gap-1 mb-8">
          ← Back to Shop
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <ProductImageGallery
            primaryImage={product.image}
            additionalImages={(product.images ?? []).sort((a, b) => a.sortOrder - b.sortOrder)}
            productName={product.name}
            fallbackEmoji={categoryInfo?.emoji || "🧵"}
          />

          <div className="flex flex-col justify-center">
            <div className="text-sm text-text-muted mb-2 uppercase tracking-wider">
              {categoryInfo?.emoji} {categoryInfo?.name}
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold text-navy mb-4">{product.name}</h1>
            <p className="text-gold text-2xl font-semibold mb-6">${product.price.toFixed(2)}</p>
            <p className="text-text-muted leading-relaxed mb-8">{product.description}</p>

            <div className="space-y-3">
              {Boolean(product.hasSize) && <p className="text-xs text-text-muted">
                Available sizes: {(product.sizes ?? []).filter((s) => s.stock > 0).map((s) => s.size).join(", ") || "None"}
              </p>}
              <ProductPurchasePanel product={{ id: product.id, name: product.name, price: product.price, stock: product.stock ?? 0, hasSize: Boolean(product.hasSize), hasColor: Boolean(product.hasColor), category: product.category, image: product.image ?? undefined, sizes: product.sizes ?? [], colors: product.colors ?? [], customizationOptions }} />
            </div>

            <p className="text-text-muted/60 text-xs mt-4 text-center">
              ✨ Handcrafted with love • Made to order
            </p>
            <p className="text-text-muted/80 text-xs mt-1 text-center">
              Orders typically ship within 10–12 business days.
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
                <div className="aspect-square bg-gradient-to-br from-blue-pale to-blue-light/20 flex items-center justify-center overflow-hidden">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-4xl opacity-25">{categories.find(c => c.slug === p.category)?.emoji || "🧵"}</span>
                  )}
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
