import type { Metadata } from "next";
import { Playfair_Display, Inter, Dancing_Script, Bebas_Neue, Black_Ops_One, Allura } from "next/font/google";
import "./globals.css";

import { APP_VERSION } from "../lib/version";

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

// Personalization preview fonts — matched to admin font presets.
// Playfair Display (above) doubles as --font-serif-display.
const fontScript = Dancing_Script({ variable: "--font-script", subsets: ["latin"], display: "swap", weight: "700" });
const fontBlock = Bebas_Neue({ variable: "--font-block", subsets: ["latin"], display: "swap", weight: "400" });
const fontVarsity = Black_Ops_One({ variable: "--font-varsity", subsets: ["latin"], display: "swap", weight: "400" });
const fontCursive = Allura({ variable: "--font-cursive", subsets: ["latin"], display: "swap", weight: "400" });

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
      <body className={`${playfair.variable} ${inter.variable} ${fontScript.variable} ${fontBlock.variable} ${fontVarsity.variable} ${fontCursive.variable} font-[family-name:var(--font-inter)] antialiased min-h-screen flex flex-col`}>
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
