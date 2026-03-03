import Link from "next/link";

export default function AboutPage() {
  return (
    <div>
      {/* Header */}
      <section className="bg-navy py-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-8 left-[15%] text-gold/20 text-xl animate-sparkle">✦</div>
          <div className="absolute bottom-6 right-[20%] text-gold/15 text-lg animate-sparkle" style={{ animationDelay: "1s" }}>✧</div>
        </div>
        <div className="relative z-10">
          <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl font-bold text-white mb-3">
            About Meg
          </h1>
          <p className="text-blue-light/80 text-lg">The maker behind the magic</p>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 items-start">
          {/* Photo placeholder */}
          <div className="md:col-span-2">
            <div className="aspect-[3/4] bg-gradient-to-br from-blue-pale to-blue-light/30 rounded-2xl flex items-center justify-center">
              <span className="text-6xl opacity-30">👩‍🎨</span>
            </div>
          </div>

          {/* Bio */}
          <div className="md:col-span-3">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-navy mb-6">
              Every Stitch Tells a Story
            </h2>
            <div className="space-y-4 text-text-muted leading-relaxed">
              <p>
                Hi, I&apos;m Meg! Welcome to my little corner of the crafting world. 
                What started as a hobby — making personalized gifts for friends and family — 
                has grown into something truly magical.
              </p>
              <p>
                I specialize in custom embroidery, vinyl work, and Cricut crafts. From cozy 
                crewnecks with hand-stitched designs to personalized glass cups and tote bags, 
                every piece I create is made with care, attention to detail, and a whole lot of love.
              </p>
              <p>
                I&apos;m inspired by fairytales, books, and the little things that make everyday 
                life feel special. I believe that something handmade carries a warmth that 
                mass-produced items just can&apos;t replicate.
              </p>
              <p>
                When I&apos;m not at my embroidery machine or cutting vinyl, you can probably 
                find me curled up with a good book, rewatching a Disney movie, or dreaming up 
                new designs.
              </p>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/shop"
                className="bg-gold hover:bg-gold-light text-navy font-semibold px-8 py-3 rounded-full transition-all text-sm uppercase tracking-wider text-center"
              >
                Shop My Creations
              </Link>
              <Link
                href="/custom"
                className="border-2 border-navy text-navy hover:bg-navy hover:text-white font-medium px-8 py-3 rounded-full transition-all text-sm uppercase tracking-wider text-center"
              >
                Custom Orders
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-navy text-center mb-12">
            What Makes It Magical
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                emoji: "✨",
                title: "Handcrafted with Love",
                desc: "Every piece is made by hand, one at a time. No mass production — just genuine craft and care.",
              },
              {
                emoji: "🎨",
                title: "Truly Custom",
                desc: "Your ideas, your colors, your names. I work with you to create something uniquely yours.",
              },
              {
                emoji: "📖",
                title: "Story-Driven Design",
                desc: "Inspired by fairytales, books, and the magic of everyday moments. Each design has a story.",
              },
            ].map((v) => (
              <div key={v.title} className="text-center p-6">
                <span className="text-4xl block mb-4">{v.emoji}</span>
                <h3 className="font-[family-name:var(--font-display)] font-semibold text-navy text-lg mb-2">
                  {v.title}
                </h3>
                <p className="text-text-muted text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
