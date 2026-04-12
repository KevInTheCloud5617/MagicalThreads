import ClientProviders from "@/components/ClientProviders";
import Navbar from "@/components/Navbar";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientProviders>
      <Navbar />
      <main className="flex-1">{children}</main>
    </ClientProviders>
  );
}
