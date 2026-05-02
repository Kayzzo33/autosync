'use client';

import { useEffect, useState } from 'react';
import { Building2, Search, Power, PowerOff, ArrowUpRight, Plus, Users, Wrench } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadTenants = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/tenants', { cache: 'no-store' });
      const data = await res.json();
      setTenants(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Erro ao carregar inquilinos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await fetch(`/api/superadmin/tenants/${id}/suspender`, {
        method: 'PATCH',
      });
      if (res.ok) {
        toast.success('Status atualizado!');
        loadTenants();
      }
    } catch (err) {
      toast.error('Erro ao processar');
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white">Gestão de Inquilinos</h1>
          <p className="text-zinc-500 text-sm">Controle total sobre as instâncias da plataforma</p>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input 
            type="text" 
            placeholder="Buscar oficina..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredTenants.map((tenant) => (
          <div key={tenant.id} className="bg-[#0a0a0a] border border-zinc-900 rounded-2xl p-6 flex items-center justify-between hover:border-zinc-800 transition-all group">
            <div className="flex items-center gap-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${tenant.ativo ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-zinc-900 text-zinc-600 border border-zinc-800'}`}>
                {tenant.nome[0]}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-white font-bold">{tenant.nome}</h3>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${tenant.ativo ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {tenant.ativo ? 'Ativo' : 'Suspenso'}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-1">{tenant.email_admin} • ID: {tenant.id.slice(0, 8)}</p>
              </div>
            </div>

            <div className="flex items-center gap-12">
              <div className="flex gap-8">
                <div className="text-center">
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Usuários</p>
                  <p className="text-white font-bold">{tenant.total_usuarios}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">OS</p>
                  <p className="text-white font-bold">{tenant.total_os}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleToggleStatus(tenant.id)}
                  className={`p-2.5 rounded-xl transition-all ${tenant.ativo ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                >
                  {tenant.ativo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                </button>
                <button className="p-2.5 bg-zinc-900 text-zinc-400 rounded-xl hover:text-white border border-zinc-800 transition-all">
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredTenants.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-zinc-900 rounded-[2.5rem]">
            <Building2 className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-500 font-medium">Nenhum inquilino encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
