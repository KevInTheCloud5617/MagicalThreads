"use client";

export default function ContactPage() {
  return (
    <div>
      <section className="bg-navy py-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-8 left-[15%] text-gold/20 text-xl animate-sparkle">✦</div>
          <div className="absolute bottom-6 right-[20%] text-gold/15 text-lg animate-sparkle" style={{ animationDelay: "1s" }}>✧</div>
        </div>
        <div className="relative z-10">
          <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl font-bold text-white mb-3">
            Contact
          </h1>
          <p className="text-blue-light/80 text-lg">I&apos;d love to hear from you</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-blue-pale/30 rounded-2xl p-8 sm:p-10 border border-blue-pale text-center">
          <span className="text-5xl block mb-4">📬</span>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-navy mb-6">
            Get in Touch
          </h2>

          <div className="space-y-4 text-text-muted text-base sm:text-lg">
            <p>
              Email: {" "}
              <a
                href="mailto:hello@magicalthreadswithmeg.com"
                className="text-gold font-semibold hover:text-gold-light underline underline-offset-4 transition-colors"
              >
                hello@magicalthreadswithmeg.com
              </a>
            </p>
            <p>
              Instagram: {" "}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold font-semibold hover:text-gold-light underline underline-offset-4 transition-colors"
              >
                @magicalthreadswithmeg
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
