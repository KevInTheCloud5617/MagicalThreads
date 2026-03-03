"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/products", label: "Products", icon: "🧵" },
  { href: "/admin/inquiries", label: "Inquiries", icon: "💬" },
  { href: "/admin/orders", label: "Orders", icon: "📦" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-navy min-h-screen flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-white/10">
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
            (item.href !== "/admin" && pathname.startsWith(item.href));
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

      <div className="p-4 border-t border-white/10 space-y-1">
        <a
          href="https://dashboard.stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-blue-light/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          <span>💳</span>
          Stripe Dashboard ↗
        </a>
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-blue-light/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          <span>🌐</span>
          View Site
        </Link>
      </div>
    </aside>
  );
}
