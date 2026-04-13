import { Sidebar } from "../../components/Sidebar";
import { Header } from "../../components/Header";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Sidebar />
      <div className="flex flex-col lg:pl-64 min-h-screen transition-all duration-300">
        <Header />
        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
