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

export const revalidate = 60; // Revalidate every minute

export default async function Home() {
  const instagramHandle = process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE || "magicalthreadswithmeg";

  const drops: Drop[] = await prisma.drop.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="bg-cream">
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-[10%] text-gold/25 text-lg animate-sparkle">✦</div>
          <div className="absolute top-20 right-[15%] text-gold/20 text-2xl animate-sparkle" style={{ animationDelay: "0.8s" }}>✨</div>
          <div className="absolute bottom-12 left-[20%] text-gold/15 text-xl animate-sparkle" style={{ animationDelay: "1.4s" }}>✧</div>
          <div className="absolute bottom-8 right-[12%] text-gold/20 text-lg animate-sparkle" style={{ animationDelay: "1s" }}>✦</div>
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-4 py-20 md:py-28 text-center">
          <p className="text-gold/85 text-xs md:text-sm tracking-[0.35em] uppercase mb-4">
            Magical Threads with Meg
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
            Handcrafted with Love &amp; a Touch of Magic
          </h1>
          <p className="font-[family-name:var(--font-inter)] text-blue-light/90 text-base md:text-xl max-w-3xl mx-auto mb-10">
            Discover Megan&apos;s handmade embroidery and custom crafts — from cozy sweatshirts and tote bags to drinkware and accessories made to bring fairytale charm to everyday moments.
          </p>

          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded-full bg-gold text-navy px-9 py-4 text-sm md:text-base font-semibold uppercase tracking-[0.2em] hover:bg-gold/90 transition-colors shadow-lg"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* Featured Drops */}
      {drops.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl text-navy font-semibold mb-3">
              Shop by Drop
            </h2>
            <p className="font-[family-name:var(--font-inter)] text-text-muted max-w-2xl mx-auto">
              Curated collections designed around moments, moods, and magic.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {drops.map((drop) => (
              <Link
                key={drop.slug}
                href={`/drops/${drop.slug}`}
                className="group relative rounded-2xl overflow-hidden p-6 md:p-8 min-h-[180px] flex flex-col justify-end hover:shadow-xl transition-all hover:-translate-y-1"
                style={{
                  background: `linear-gradient(to bottom right, ${drop.colorFrom || "#92400e"}, ${drop.colorTo || "#c2410c"})`,
                }}
              >
                <div className="absolute top-4 right-4 text-4xl opacity-30 group-hover:opacity-50 transition-opacity">
                  {drop.emoji || "✨"}
                </div>
                <div className="relative z-10">
                  <h3 className="font-[family-name:var(--font-display)] text-xl md:text-2xl font-bold text-white mb-1">
                    {drop.name}
                  </h3>
                  <p className="text-white/75 text-sm italic">
                    {drop.tagline}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/drops" className="text-gold hover:underline font-medium">
              View all drops →
            </Link>
          </div>
        </section>
      )}

      {/* Category Quick Links */}
      <section className="bg-blue-pale/30 border-y border-blue-pale py-12 md:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-navy font-semibold mb-6 text-center">
            Shop by Category
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/shop?category=${cat.slug}`}
                className="px-5 py-2.5 rounded-full bg-white text-navy border border-blue-pale hover:border-gold hover:shadow-md transition-all text-sm font-medium"
              >
                {cat.emoji} {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16 text-center">
        <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl text-navy font-semibold mb-4">
          Made by Megan, Just for You
        </h2>
        <p className="font-[family-name:var(--font-inter)] text-text-muted text-base md:text-lg leading-relaxed mb-6">
          Magical Threads with Meg began with a love for creating one-of-a-kind pieces that feel personal and meaningful. Every stitch, press, and detail is handcrafted to help you celebrate your style, your story, and the little moments that matter most.
        </p>
        <Link href="/about" className="text-navy font-medium underline underline-offset-4 hover:text-gold transition-colors">
          Learn More About Megan
        </Link>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 text-center">
        <p className="font-[family-name:var(--font-inter)] text-text-muted mb-4">
          Ready to find your next favorite handmade piece?
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center rounded-full bg-gold text-navy px-8 py-3 text-sm md:text-base font-semibold uppercase tracking-[0.2em] hover:bg-gold/90 transition-colors"
        >
          Shop the Collection
        </Link>

        <p className="font-[family-name:var(--font-inter)] text-sm text-text-muted mt-6">
          Follow along on{" "}
          <a
            href={`https://instagram.com/${instagramHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-navy hover:text-gold underline underline-offset-2 transition-colors font-medium"
          >
            @{instagramHandle}
          </a>{" "}
          for new drops, custom orders, and behind-the-scenes magic ✨
        </p>
      </section>
    </div>
  );
}
