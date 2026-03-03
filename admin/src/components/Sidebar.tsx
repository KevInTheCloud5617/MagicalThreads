"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/products", label: "Products", icon: "🧵" },
  { href: "/inquiries", label: "Inquiries", icon: "💬" },
  { href: "/orders", label: "Orders", icon: "📦" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-navy min-h-screen flex flex-col fixed left-0 top-0">
      {/* Brand */}
      <div className="p-6 border-b border-navy-light">
        <div className="flex items-center gap-2">
          <span className="text-xl">✨</span>
          <div>
            <h1 className="text-white font-bold text-sm">Magical Threads</h1>
            <p className="text-blue-light/50 text-xs">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
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

      {/* External Links */}
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
  );
}
