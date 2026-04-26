export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  // Esse layout garante que o painel do superadmin fique isolado (sem as sidebars das oficinas)
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-yellow-500/30">
      {children}
    </div>
  );
}
