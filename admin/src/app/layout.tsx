import type { Metadata } from "next";
import { Inter, Dancing_Script, Bebas_Neue, Black_Ops_One, Allura, Playfair_Display } from "next/font/google";
import "./globals.css";

import { APP_VERSION } from "../lib/version";
import Sidebar from "@/components/Sidebar";
import AdminFlagsProvider from "@/components/AdminFlagsProvider";
import { getServerFlagSnapshot } from "@/lib/feature-flags";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fontScript = Dancing_Script({ variable: "--font-script", subsets: ["latin"], display: "swap", weight: "700" });
const fontBlock = Bebas_Neue({ variable: "--font-block", subsets: ["latin"], display: "swap", weight: "400" });
const fontVarsity = Black_Ops_One({ variable: "--font-varsity", subsets: ["latin"], display: "swap", weight: "400" });
const fontCursive = Allura({ variable: "--font-cursive", subsets: ["latin"], display: "swap", weight: "400" });
const fontSerif = Playfair_Display({ variable: "--font-serif-display", subsets: ["latin"], display: "swap", weight: "700" });

export const metadata: Metadata = {
  title: "Admin | Magical Threads with Meg",
  description: "Product and order management for Magical Threads with Meg",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const flags = await getServerFlagSnapshot();
  return (
    <html lang="en">
      <body className={`${inter.variable} ${fontScript.variable} ${fontBlock.variable} ${fontVarsity.variable} ${fontCursive.variable} ${fontSerif.variable} font-[family-name:var(--font-inter)] antialiased min-h-screen`}>
        <AdminFlagsProvider flags={flags}>
          <Sidebar />
          <main className="pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-0 md:ml-64 min-h-screen">
            {children}
          </main>
          <div className="fixed bottom-2 right-2 z-50 pointer-events-none text-[11px] opacity-35 text-navy/80 select-none">
            v{APP_VERSION}
          </div>
        </AdminFlagsProvider>
      </body>
    </html>
  );
}
