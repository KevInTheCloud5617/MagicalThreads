import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "0.2.1";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Magical Threads with Meg | Handcrafted Embroidery & Custom Crafts",
  description: "Handcrafted embroidered crewnecks, custom tote bags, glass cups, and vinyl crafts. Each piece made with love and a touch of magic.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${inter.variable} font-[family-name:var(--font-inter)] antialiased min-h-screen flex flex-col`}>
        {(process.env.NEXT_PUBLIC_STRIPE_MODE || "mock").toLowerCase() === "mock" && (
          <div className="bg-amber-300 text-amber-900 text-center text-sm font-semibold py-2 px-4">
            ⚠️ TEST MODE — No real payments are processed | v3.0-stripe
          </div>
        )}
        {children}
        <div className="fixed bottom-2 right-2 z-50 pointer-events-none text-[11px] opacity-35 text-navy/80 select-none">
          v{APP_VERSION}
        </div>
      </body>
    </html>
  );
}
