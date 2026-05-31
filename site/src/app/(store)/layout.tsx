import ClientProviders from "@/components/ClientProviders";
import Navbar from "@/components/Navbar";
import { getServerFlagSnapshot } from "@/lib/feature-flags";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const flags = await getServerFlagSnapshot();
  return (
    <ClientProviders flags={flags}>
      <Navbar />
      <main className="flex-1">{children}</main>
    </ClientProviders>
  );
}
