import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-navy text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">✨</span>
              <span className="font-[family-name:var(--font-display)] text-lg font-semibold">
                Magical Threads with Meg
              </span>
            </div>
            <p className="text-sm text-blue-light/80 leading-relaxed">
              Handcrafted embroidery, custom vinyl, and lovingly made gifts — each piece stitched with a touch of magic.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-gold text-sm font-semibold uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <div className="space-y-2">
              <Link href="/shop" className="block text-sm text-blue-light/80 hover:text-gold transition-colors">Shop</Link>
              <Link href="/about" className="block text-sm text-blue-light/80 hover:text-gold transition-colors">About Meg</Link>
              <Link href="/custom" className="block text-sm text-blue-light/80 hover:text-gold transition-colors">Custom Orders</Link>
              <Link href="/contact" className="block text-sm text-blue-light/80 hover:text-gold transition-colors">Contact</Link>
            </div>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-gold text-sm font-semibold uppercase tracking-wider mb-4">
              Connect
            </h3>
            <div className="space-y-2">
              <a href="#" className="block text-sm text-blue-light/80 hover:text-gold transition-colors">Instagram</a>
              <a href="#" className="block text-sm text-blue-light/80 hover:text-gold transition-colors">Facebook</a>
              <a href="#" className="block text-sm text-blue-light/80 hover:text-gold transition-colors">TikTok</a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-navy-light text-center">
          <p className="text-sm text-blue-light/60">
            © {new Date().getFullYear()} Magical Threads with Meg. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
