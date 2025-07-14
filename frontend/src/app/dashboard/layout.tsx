import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />

      <div className="flex flex-col flex-1 bg-white overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
