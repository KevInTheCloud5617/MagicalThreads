import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = {
  title: "Admin | Magical Threads with Meg",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "#F8FAFC" }}>
      <AdminSidebar />
      <main className="ml-64 min-h-screen">{children}</main>
    </div>
  );
}
