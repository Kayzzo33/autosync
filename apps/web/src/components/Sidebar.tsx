'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Wrench, 
  DollarSign, 
  MessageCircle, 
  Settings,
  Blocks,
  CarFront,
  ClipboardList,
  Monitor,
  Moon,
  Sun
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'O.S.', href: '/os', icon: ClipboardList },
  { name: 'Pátio', href: '/patio', icon: Monitor, target: '_blank' },
  { name: 'Financeiro', href: '/financeiro', icon: DollarSign },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Equipe', href: '/configuracoes/mecanicos', icon: Wrench },
  { name: 'Leads', href: '/leads', icon: UserPlus },
  { name: 'WhatsApp', href: '/whatsapp', icon: MessageCircle },
  { name: 'Integrações', href: '/integracoes', icon: Blocks },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 text-slate-300">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl tracking-tight">
          <CarFront className="w-6 h-6 text-emerald-500" />
          <span>AutoSync</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Menu Principal
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              target={item.target ? item.target : undefined}
              className={`flex items-center gap-4 px-4 py-3 rounded-r-xl transition-all text-base font-bold mb-1 ${
                isActive 
                  ? 'bg-slate-800 text-white border-l-4 border-emerald-500 shadow-md shadow-slate-900' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border-l-4 border-transparent hover:border-slate-600'
              }`}
            >
              <item.icon className={`w-6 h-6 ${isActive ? 'text-emerald-500' : 'text-slate-500'}`} />
              {item.name}
            </Link>
          );
        })}

        {/* Link Dinâmico para TV/CRM */}
        {user?.tenantSlug && (
          <div className="pt-4 mt-4 border-t border-slate-800">
            <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Visualização
            </div>
            <Link
              href={`/tv/${user.tenantSlug}`}
              target="_blank"
              className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium text-slate-400 hover:text-white hover:bg-emerald-500/10 hover:text-emerald-400 group"
            >
              <CarFront className="w-5 h-5 text-slate-500 group-hover:text-emerald-400" />
              Monitor de Pátio (TV)
            </Link>
          </div>
        )}
      </nav>

      <div className="p-4 space-y-4 border-t border-slate-800">
        <button 
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all group"
        >
          <div className="flex items-center gap-3">
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
            <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">
              {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            </span>
          </div>
          <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-600'}`}>
            <div className={`w-3 h-3 bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`}></div>
          </div>
        </button>

        <div className="flex items-center gap-3 bg-slate-800 rounded-lg p-3">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.[0] || 'AD'}
          </div>
          <div className="flex flex-col text-sm overflow-hidden">
            <span className="text-white font-medium truncate">{user?.name || 'Admin'}</span>
            <span className="text-slate-500 text-xs truncate">Oficina Matriz</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
