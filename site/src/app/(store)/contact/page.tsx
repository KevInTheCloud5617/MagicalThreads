"use client";

export default function ContactPage() {
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
            Contact
          </h1>
          <p className="text-blue-light/80 text-lg">I&apos;d love to hear from you</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Contact Info */}
          <div className="md:col-span-2">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-navy mb-6">
              Let&apos;s Connect
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-navy text-sm uppercase tracking-wider mb-2">Follow Along</h3>
                <div className="space-y-2">
                  <a href="#" className="flex items-center gap-2 text-text-muted hover:text-gold transition-colors text-sm">
                    📸 Instagram
                  </a>
                  <a href="#" className="flex items-center gap-2 text-text-muted hover:text-gold transition-colors text-sm">
                    👤 Facebook
                  </a>
                  <a href="#" className="flex items-center gap-2 text-text-muted hover:text-gold transition-colors text-sm">
                    🎵 TikTok
                  </a>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-navy text-sm uppercase tracking-wider mb-2">Response Time</h3>
                <p className="text-text-muted text-sm">
                  I typically respond within 24–48 hours. For urgent inquiries, DM me on Instagram!
                </p>
              </div>
              <div className="bg-blue-pale/50 rounded-xl p-5 border border-blue-pale">
                <p className="text-navy text-sm font-medium">
                  ✨ Looking for a custom order? Include as many details as possible — item type, colors, text, and any inspiration images!
                </p>
              </div>
            </div>
          </div>

          {/* Contact Email */}
          <div className="md:col-span-3">
            <div className="bg-blue-pale/30 rounded-2xl p-8 sm:p-10 border border-blue-pale text-center">
              <span className="text-5xl block mb-4">📬</span>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-navy mb-3">
                Get in Touch
              </h2>
              <p className="text-text-muted text-base sm:text-lg leading-relaxed">
                For inquiries, please email us at{" "}
                <a
                  href="mailto:hello@magicalthreadswithmeg.com"
                  className="text-gold font-semibold hover:text-gold-light underline underline-offset-4 transition-colors"
                >
                  hello@magicalthreadswithmeg.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
