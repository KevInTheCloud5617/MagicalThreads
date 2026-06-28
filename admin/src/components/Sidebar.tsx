"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/products", label: "Products", icon: "🧵" },
  { href: "/drops", label: "Drops", icon: "🎁" },
  { href: "/orders", label: "Orders", icon: "📦" },
  { href: "/settings/personalization", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden md:flex w-64 bg-navy min-h-screen flex-col fixed left-0 top-0">
        <div className="p-6 border-b border-navy-light">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <div>
              <h1 className="text-white font-bold text-sm">Magical Threads</h1>
              <p className="text-blue-light/50 text-xs">Admin Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-white/10 text-white font-medium"
                    : "text-blue-light/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-navy-light space-y-1">
          <a
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-blue-light/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span>💳</span>
            Stripe Dashboard ↗
          </a>
          <a
            href={process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-blue-light/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span>🌐</span>
            View Site ↗
          </a>
        </div>
      </aside>

      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed inset-x-0 bottom-0 z-[60] border-t border-navy-light bg-navy/98 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-5">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-14 touch-manipulation flex-col items-center justify-center px-1 text-[11px] leading-tight transition-colors ${
                  isActive
                    ? "text-gold font-medium"
                    : "text-blue-light/70 active:text-white"
                }`}
              >
                <span className="mb-0.5 text-lg leading-none" aria-hidden="true">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
