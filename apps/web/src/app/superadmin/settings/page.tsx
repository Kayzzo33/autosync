'use client';

import { Settings, Shield, Server, Bell, Globe } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Configurações do Sistema</h1>
        <p className="text-zinc-500 text-sm">Parâmetros globais e chaves de API</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0a0a0a] border border-zinc-900 rounded-[2rem] p-8 space-y-6">
          <div className="flex items-center gap-3 text-emerald-500 mb-4">
             <Shield className="w-5 h-5" />
             <h2 className="font-black uppercase tracking-widest text-sm">Segurança & API</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Admin API Key</label>
              <input 
                type="password" 
                value="••••••••••••••••" 
                disabled 
                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-sm text-zinc-500 font-mono"
              />
            </div>
            <button className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest transition-colors">
               Rotacionar Chave de Segurança
            </button>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-zinc-900 rounded-[2rem] p-8 space-y-6 opacity-50">
          <div className="flex items-center gap-3 text-zinc-500 mb-4">
             <Bell className="w-5 h-5" />
             <h2 className="font-black uppercase tracking-widest text-sm">Notificações</h2>
          </div>
          <p className="text-sm text-zinc-600">Configuração de Webhooks e alertas de sistema (Em breve)</p>
        </div>
      </div>
    </div>
  );
}
