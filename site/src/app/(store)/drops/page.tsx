import Link from "next/link";
import prisma from "@/lib/db";

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

export const metadata = {
  title: "Drops | Magical Threads",
  description: "Explore our curated collection drops — themed releases designed around moments, moods, and magic.",
};

export default async function DropsPage() {
  const drops: Drop[] = await prisma.drop.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="bg-cream min-h-screen">
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="text-center mb-10 md:mb-14">
          <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl text-navy font-bold mb-4">
            Shop by Drop
          </h1>
          <p className="font-[family-name:var(--font-inter)] text-text-muted max-w-2xl mx-auto text-lg">
            Curated collections designed around moments, moods, and magic. Each drop is a themed release of handcrafted items — limited runs, thoughtful designs, made with love.
          </p>
        </div>

        {drops.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            No drops available right now. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drops.map((drop) => (
              <Link
                key={drop.slug}
                href={`/drops/${drop.slug}`}
                className="group relative rounded-2xl overflow-hidden p-8 min-h-[220px] flex flex-col justify-end hover:shadow-2xl transition-all hover:-translate-y-1"
                style={{
                  background: `linear-gradient(to bottom right, ${drop.colorFrom || "#92400e"}, ${drop.colorTo || "#c2410c"})`,
                }}
              >
                <div className="absolute top-6 right-6 text-5xl opacity-25 group-hover:opacity-40 transition-opacity">
                  {drop.emoji || "✨"}
                </div>
                <div className="relative z-10">
                  <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-white mb-2">
                    {drop.name}
                  </h2>
                  <p className="text-white/80 text-sm italic mb-3">
                    {drop.tagline}
                  </p>
                  <span className="inline-flex items-center text-white/90 text-sm font-medium group-hover:underline">
                    Shop this drop →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded-full bg-navy text-white px-8 py-3 text-sm font-semibold uppercase tracking-[0.15em] hover:bg-navy/90 transition-colors"
          >
            Browse All Products
          </Link>
        </div>
      </section>
    </div>
  );
}
