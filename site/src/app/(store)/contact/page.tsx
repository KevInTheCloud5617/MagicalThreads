"use client";

import { useState } from "react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

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

          {/* Form */}
          <div className="md:col-span-3">
            {submitted ? (
              <div className="bg-blue-pale/30 rounded-2xl p-10 text-center border border-blue-pale">
                <span className="text-5xl block mb-4">✨</span>
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-navy mb-3">
                  Message Sent!
                </h2>
                <p className="text-text-muted">
                  Thank you for reaching out! I&apos;ll get back to you as soon as I can.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">Name</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-blue-pale bg-white focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold text-sm text-navy"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">Email</label>
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-blue-pale bg-white focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold text-sm text-navy"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">Subject</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-blue-pale bg-white focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold text-sm text-navy"
                  >
                    <option>General Inquiry</option>
                    <option>Custom Order Request</option>
                    <option>Order Status</option>
                    <option>Collaboration</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">Message</label>
                  <textarea
                    required
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-blue-pale bg-white focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold text-sm text-navy resize-none"
                    placeholder="Tell me what you're looking for..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gold hover:bg-gold-light text-navy font-semibold py-3.5 rounded-full transition-all hover:shadow-lg text-sm uppercase tracking-wider"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
