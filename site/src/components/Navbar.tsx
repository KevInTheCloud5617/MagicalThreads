"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import CartButton from "./CartButton";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-navy/95 backdrop-blur-md shadow-[0_4px_30px_rgba(27,42,74,0.4)]"
          : "bg-navy shadow-lg"
      }`}
    >
      {/* Gold accent line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <span className="text-3xl group-hover:animate-spin transition-transform duration-700">
              ✨
            </span>
            <div className="flex flex-col">
              <span className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-wider text-white group-hover:text-gold transition-colors duration-300">
                Magical Threads
              </span>
              <span className="text-[10px] tracking-[0.3em] uppercase text-gold/60 font-light">
                Every stitch tells a story
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { href: "/", label: "Home" },
              { href: "/shop", label: "Shop" },
              { href: "/about", label: "About" },
              { href: "/custom", label: "Custom Orders" },
              { href: "/contact", label: "Contact" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors duration-300 group"
              >
                {link.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-gold/0 via-gold to-gold/0 group-hover:w-3/4 transition-all duration-300" />
              </Link>
            ))}
            {/* CTA button */}
            <Link
              href="/shop"
              className="ml-4 px-5 py-2 bg-gradient-to-r from-gold to-gold-light text-navy text-sm font-semibold rounded-full hover:shadow-[0_0_20px_rgba(201,169,110,0.4)] hover:scale-105 transition-all duration-300"
            >
              Shop Now ✨
            </Link>
            <CartButton />
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white/80 hover:text-gold transition-colors p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
            >
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-400 ease-in-out ${
          isOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-navy-dark/90 backdrop-blur-md border-t border-gold/20 px-4 py-4 space-y-1">
          {[
            { href: "/", label: "Home" },
            { href: "/shop", label: "Shop" },
            { href: "/about", label: "About" },
            { href: "/custom", label: "Custom Orders" },
            { href: "/contact", label: "Contact" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2.5 px-3 text-sm text-white/80 hover:text-gold hover:bg-white/5 rounded-lg transition-all duration-200"
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/shop"
            className="block mt-3 text-center py-2.5 bg-gradient-to-r from-gold to-gold-light text-navy text-sm font-semibold rounded-full"
            onClick={() => setIsOpen(false)}
          >
            Shop Now ✨
          </Link>
        </div>
      </div>
    </nav>
  );
}
