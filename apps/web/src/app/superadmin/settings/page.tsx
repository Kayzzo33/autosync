'use client';

import { Settings, Shield, Bell, Key, Database, Globe } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Platform Config</h1>
        <p className="text-zinc-500 text-sm font-medium">Controle de chaves e parâmetros globais da infraestrutura</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#0a0a0a] border border-zinc-900 rounded-[2.5rem] p-10 space-y-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16"></div>
          <div className="flex items-center gap-4 text-emerald-500">
             <div className="p-2 bg-emerald-500/10 rounded-xl">
               <Shield className="w-6 h-6" />
             </div>
             <h2 className="font-black uppercase tracking-[0.2em] text-sm">Security & Access</h2>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-widest">Painel de Controle</label>
              <div className="relative group/key">
                <div className="absolute inset-0 bg-emerald-500/5 blur-xl group-hover/key:bg-emerald-500/10 transition-all"></div>
                <div className="relative bg-zinc-950 border border-zinc-900 rounded-2xl px-6 py-4 flex items-center justify-between">
                   <span className="text-emerald-500 font-mono text-sm tracking-widest">Acesso Seguro Autenticado</span>
                   <Shield className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
              <p className="text-[10px] text-zinc-600 italic">A infraestrutura usa chaves mantidas exclusivamente no lado do servidor para máxima segurança, sem exposição ao cliente.</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-zinc-900 rounded-[2.5rem] p-10 space-y-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -mr-16 -mt-16"></div>
          <div className="flex items-center gap-4 text-blue-500">
             <div className="p-2 bg-blue-500/10 rounded-xl">
               <Database className="w-6 h-6" />
             </div>
             <h2 className="font-black uppercase tracking-[0.2em] text-sm">Database Sync</h2>
          </div>
          
          <div className="space-y-4">
             <div className="flex justify-between items-center py-3 border-b border-zinc-900">
                <span className="text-xs font-bold text-zinc-500">Auto-Backup</span>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Ativo</span>
             </div>
             <div className="flex justify-between items-center py-3 border-b border-zinc-900">
                <span className="text-xs font-bold text-zinc-500">Região</span>
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">AWS-US-EAST-1</span>
             </div>
          </div>
          <p className="text-[10px] text-zinc-600 mt-4 leading-relaxed">
            As configurações de infraestrutura são sincronizadas automaticamente com o cluster Upstash.
          </p>
        </div>

        <div className="bg-[#0a0a0a] border border-zinc-900 rounded-[2.5rem] p-10 space-y-6 opacity-30 cursor-not-allowed">
          <div className="flex items-center gap-3 text-zinc-500 mb-4">
             <Bell className="w-6 h-6" />
             <h2 className="font-black uppercase tracking-[0.2em] text-sm">Webhooks</h2>
          </div>
          <p className="text-sm text-zinc-600">Disparo de eventos em tempo real para sistemas externos.</p>
        </div>
      </div>
    </div>
  );
}
