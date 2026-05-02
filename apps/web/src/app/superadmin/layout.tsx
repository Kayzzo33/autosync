'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  ShieldAlert,
  LogOut
} from 'lucide-react';
import { superadminLogout } from './actions';

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/superadmin/login';

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-emerald-500/30">
        {children}
      </div>
    );
  }

  const handleLogout = async () => {
    await superadminLogout();
    window.location.href = '/superadmin/login';
  };

  const menuItems = [
    { name: 'Dashboard', href: '/superadmin/dashboard', icon: LayoutDashboard },
    { name: 'Inquilinos', href: '/superadmin/tenants', icon: Users },
    { name: 'Logs de Auditoria', href: '/superadmin/logs', icon: ShieldAlert },
    { name: 'Configurações', href: '/superadmin/settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-emerald-500/30">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-zinc-900 bg-[#0a0a0a]">
        <div className="p-6 flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-zinc-900 flex items-center justify-center">
            <Image 
              src="/ghostsync.png" 
              alt="GhostSync Logo" 
              width={32} 
              height={32} 
              className="object-contain"
            />
          </div>
          <span className="text-white font-bold tracking-tight text-lg">AutoSync<span className="text-emerald-500">.</span></span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-zinc-800/50 text-white font-medium' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-500' : ''}`} />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-900">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 w-full transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Sair do painel</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-h-screen overflow-y-auto">
        {/* Top Header / Nav */}
        <header className="h-16 border-b border-zinc-900/50 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-10 flex items-center px-8">
          <div className="flex-1">
            <h2 className="text-white font-medium">Painel Superadmin</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <ShieldAlert className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
        </header>

        <div className="p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
