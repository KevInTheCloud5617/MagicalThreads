import ClientProviders from "@/components/ClientProviders";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientProviders>
      <main className="flex-1">{children}</main>
    </ClientProviders>
  );
}
