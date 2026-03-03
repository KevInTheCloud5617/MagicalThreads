import Link from "next/link";

export default function CustomOrdersPage() {
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
            Custom Orders
          </h1>
          <p className="text-blue-light/80 text-lg">Your vision, handcrafted into reality</p>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-navy text-center mb-12">
          How It Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { step: "1", emoji: "💬", title: "Tell Me Your Idea", desc: "Send me a message with your vision — colors, text, style, anything!" },
            { step: "2", emoji: "🎨", title: "Design Together", desc: "I'll create a mockup and we'll refine it until it's perfect." },
            { step: "3", emoji: "🧵", title: "Handcraft It", desc: "I get to work bringing your piece to life with care and detail." },
            { step: "4", emoji: "📦", title: "Ship to You", desc: "Your custom creation arrives at your door, ready to love." },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">{s.emoji}</span>
              </div>
              <div className="text-gold font-semibold text-xs uppercase tracking-wider mb-1">Step {s.step}</div>
              <h3 className="font-[family-name:var(--font-display)] font-semibold text-navy mb-1">{s.title}</h3>
              <p className="text-text-muted text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What I Can Make */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-navy text-center mb-8">
            What I Can Customize
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              "Embroidered sweatshirts & crewnecks",
              "Personalized tote bags",
              "Custom vinyl glass cups & tumblers",
              "Vinyl decals & stickers",
              "Gifts for bridesmaids, teachers, moms",
              "Book-themed & fandom items",
              "Baby & kids personalized items",
              "Holiday & seasonal gifts",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 p-4 bg-blue-pale/30 rounded-xl border border-blue-pale">
                <span className="text-gold text-lg">✦</span>
                <span className="text-navy text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-navy mb-4">
          Ready to Create Something Magical?
        </h2>
        <p className="text-text-muted mb-8 leading-relaxed">
          Send me a message with your idea and I&apos;ll get back to you within 24–48 hours with a quote. 
          No idea is too big or too small!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/contact"
            className="bg-gold hover:bg-gold-light text-navy font-semibold px-8 py-3 rounded-full transition-all hover:shadow-lg text-sm uppercase tracking-wider"
          >
            Get in Touch
          </Link>
          <a
            href="#"
            className="border-2 border-navy text-navy hover:bg-navy hover:text-white font-medium px-8 py-3 rounded-full transition-all text-sm uppercase tracking-wider"
          >
            DM on Instagram
          </a>
        </div>

        <div className="mt-10 bg-blue-pale/50 rounded-2xl p-6 border border-blue-pale text-left">
          <h3 className="font-[family-name:var(--font-display)] font-semibold text-navy mb-3">💡 Good to Know</h3>
          <ul className="space-y-2 text-text-muted text-sm">
            <li>• Custom orders typically take <strong>7–14 business days</strong></li>
            <li>• Rush orders may be available — just ask!</li>
            <li>• A 50% deposit is required to start your order</li>
            <li>• I&apos;ll send photos for approval before shipping</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
