import Link from "next/link";
import { DROPS } from "@/lib/catalog";

export const metadata = {
  title: "Drops | Magical Threads",
  description: "Explore our curated collection drops — themed releases featuring handcrafted pieces made with love.",
};

export default function DropsPage() {
  const activeDrops = DROPS.filter((d) => d.active);
  const comingSoonDrops = DROPS.filter((d) => !d.active);

  return (
    <div>
      {/* Header */}
      <section className="bg-navy py-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-8 left-[15%] text-gold/20 text-xl animate-sparkle">✦</div>
          <div className="absolute bottom-6 right-[20%] text-gold/15 text-lg animate-sparkle" style={{ animationDelay: "1s" }}>✧</div>
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <p className="text-gold/85 text-xs md:text-sm tracking-[0.35em] uppercase mb-3">Collection Drops</p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl font-bold text-white mb-4">
            Shop by Drop
          </h1>
          <div className="mx-auto mb-4 h-px w-40 bg-gradient-to-r from-transparent via-gold/80 to-transparent" />
          <p className="text-blue-light/90 text-lg">
            Curated collections designed around moments, moods, and magic ✨
          </p>
        </div>
      </section>

      {/* Active Drops */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeDrops.map((drop) => (
            <Link
              key={drop.slug}
              href={`/drops/${drop.slug}`}
              className={`group relative rounded-2xl overflow-hidden bg-gradient-to-br ${drop.color} p-8 md:p-10 min-h-[250px] flex flex-col justify-end hover:shadow-xl transition-all hover:-translate-y-1`}
            >
              <div className="absolute top-6 right-6 text-5xl opacity-30 group-hover:opacity-50 transition-opacity">
                {drop.emoji}
              </div>
              <div className="relative z-10">
                <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-white mb-2">
                  {drop.name}
                </h2>
                <p className="text-white/80 text-sm md:text-base italic mb-3">
                  {drop.tagline}
                </p>
                <span className="inline-flex items-center text-white/90 text-sm font-medium group-hover:translate-x-1 transition-transform">
                  Shop this drop →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Coming Soon */}
      {comingSoonDrops.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-navy font-semibold mb-6 text-center">
            Coming Soon
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comingSoonDrops.map((drop) => (
              <div
                key={drop.slug}
                className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${drop.color} p-8 md:p-10 min-h-[200px] flex flex-col justify-end opacity-75`}
              >
                <div className="absolute top-4 right-4 bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Coming Soon
                </div>
                <div className="absolute top-6 right-16 text-5xl opacity-20">
                  {drop.emoji}
                </div>
                <div className="relative z-10">
                  <h3 className="font-[family-name:var(--font-display)] text-xl md:text-2xl font-bold text-white mb-2">
                    {drop.name}
                  </h3>
                  <p className="text-white/70 text-sm italic">
                    {drop.tagline}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-blue-pale/30 border-y border-blue-pale py-12 text-center">
        <p className="text-text-muted mb-4">Want to see everything?</p>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center rounded-full bg-gold text-navy px-8 py-3 text-sm font-semibold uppercase tracking-[0.15em] hover:bg-gold/90 transition-colors"
        >
          Browse All Products
        </Link>
      </section>
    </div>
  );
}
