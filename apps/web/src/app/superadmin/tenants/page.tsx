'use client';

import { useEffect, useState } from 'react';
import { Building2, Search, Power, PowerOff, ArrowUpRight, Plus, Users, Wrench, X, Cpu, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { AreaChart, Area, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);

  const GLOBAL_LIMIT = 50000;

  const globalChartData = [
    { time: '00:00', load: 1200 },
    { time: '04:00', load: 800 },
    { time: '08:00', load: 2400 },
    { time: '12:00', load: 4800 },
    { time: '16:00', load: 3900 },
    { time: '20:00', load: 2100 },
    { time: '23:59', load: 1500 },
  ];

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

  const handleToggleStatus = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/superadmin/tenants/${id}/suspender`, {
        method: 'PATCH',
      });
      if (res.ok) {
        toast.success('Status atualizado!');
        loadTenants();
        if (selectedTenant?.id === id) {
          setSelectedTenant({ ...selectedTenant, ativo: !selectedTenant.ativo });
        }
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
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Gestão de Instâncias</h1>
          <p className="text-zinc-500 text-sm font-medium">Controle total sobre as instâncias da plataforma</p>
        </div>
        <div className="relative w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
          <input 
            type="text" 
            placeholder="BUSCAR OFICINA..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-full py-3 pl-12 pr-4 text-xs text-white focus:outline-none focus:border-emerald-500/50 uppercase tracking-widest transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredTenants.map((tenant) => {
          const currentReq = Math.floor(Math.random() * 8000) + 1200; // Mocked
          
          return (
          <div 
            key={tenant.id} 
            onClick={() => setSelectedTenant({ ...tenant, currentReq })}
            className="bg-[#0a0a0a] border border-zinc-900 rounded-3xl p-6 flex items-center justify-between hover:border-zinc-700 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black ${tenant.ativo ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_15px_#10b98122]' : 'bg-zinc-900 text-zinc-600 border border-zinc-800'}`}>
                {tenant.nome[0]}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-white font-black text-lg tracking-tight group-hover:text-emerald-400 transition-colors">{tenant.nome}</h3>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest ${tenant.ativo ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                    {tenant.ativo ? 'ONLINE' : 'SUSPENSO'}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-zinc-600 mt-1">{tenant.email_admin} • ID: {tenant.id.slice(0, 8)}</p>
              </div>
            </div>

            <div className="flex items-center gap-12">
              <div className="flex gap-8">
                <div className="text-center">
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Users</p>
                  <p className="text-white font-bold">{tenant.total_usuarios}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Total O.S.</p>
                  <p className="text-white font-bold">{tenant.total_os}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={(e) => handleToggleStatus(e, tenant.id)}
                  className={`p-3 rounded-xl transition-all ${tenant.ativo ? 'bg-rose-500/5 text-rose-500/50 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                >
                  {tenant.ativo ? <PowerOff className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                </button>
                <button className="p-3 bg-zinc-900 text-zinc-400 rounded-xl group-hover:bg-zinc-800 hover:text-white border border-zinc-800 transition-all">
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )})}

        {filteredTenants.length === 0 && !loading && (
          <div className="py-20 text-center border-2 border-dashed border-zinc-900 rounded-[2.5rem]">
            <Building2 className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-500 font-medium">Nenhum inquilino encontrado</p>
          </div>
        )}
      </div>

      {/* Instance Detail Panel (Copied from Dashboard) */}
      {selectedTenant && (
        <div className="fixed inset-0 z-[9999] bg-[#050505] overflow-y-auto animate-in fade-in zoom-in-95 duration-300">
          <div className="max-w-[1600px] mx-auto p-10 min-h-screen flex flex-col">
             
             <div className="flex justify-between items-center mb-16">
                <div className="flex items-center gap-4">
                   <div className="p-4 bg-zinc-900/80 rounded-2xl border border-zinc-800">
                      <Cpu className="w-8 h-8 text-emerald-500" />
                   </div>
                   <h2 className="text-xl font-black text-zinc-500 uppercase tracking-[0.4em]">Instance Diagnostics</h2>
                </div>
                <button 
                  onClick={() => setSelectedTenant(null)}
                  className="p-5 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-all border border-zinc-800 group"
                >
                  <X className="w-8 h-8 text-zinc-400 group-hover:text-white transition-colors" />
                </button>
             </div>

             <div className="flex items-center gap-12 mb-20">
                <div className="w-40 h-40 rounded-[3rem] bg-zinc-900 border border-zinc-800 flex items-center justify-center text-7xl font-black text-emerald-500 shadow-2xl shadow-emerald-500/10">
                   {selectedTenant.nome[0]}
                </div>
                <div>
                   <h2 className="text-7xl font-black text-white tracking-tighter mb-4 italic uppercase">{selectedTenant.nome}</h2>
                   <div className="flex items-center gap-4">
                      <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${selectedTenant.ativo ? 'bg-emerald-500 text-black' : 'bg-rose-500 text-white'}`}>
                         {selectedTenant.ativo ? 'ONLINE' : 'SUSPENDED'}
                      </span>
                      <span className="text-zinc-600 font-mono text-sm tracking-widest">{selectedTenant.id}</span>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                <div className="bg-[#0a0a0a] p-12 rounded-[3rem] border border-zinc-900 flex flex-col justify-between">
                   <p className="text-xs font-black text-zinc-600 uppercase tracking-[0.3em] mb-8">Total O.S.</p>
                   <div className="flex items-end justify-between">
                      <h4 className="text-7xl font-black text-white leading-none">{selectedTenant.total_os}</h4>
                      <Wrench className="w-10 h-10 text-zinc-800 mb-2" />
                   </div>
                </div>
                <div className="bg-[#0a0a0a] p-12 rounded-[3rem] border border-zinc-900 flex flex-col justify-between">
                   <p className="text-xs font-black text-zinc-600 uppercase tracking-[0.3em] mb-8">Users Ledger</p>
                   <div className="flex items-end justify-between">
                      <h4 className="text-7xl font-black text-white leading-none">{selectedTenant.total_usuarios}</h4>
                      <Users className="w-10 h-10 text-zinc-800 mb-2" />
                   </div>
                </div>
                {/* Consumption Limit Control */}
                <div className="bg-[#0a0a0a] p-12 rounded-[3rem] border border-zinc-900 flex flex-col justify-between">
                   <div className="flex justify-between items-start mb-8">
                      <p className="text-xs font-black text-zinc-600 uppercase tracking-[0.3em]">Consumption Limit</p>
                      <span className="text-[10px] font-black text-zinc-700 tracking-widest italic">MAX: {GLOBAL_LIMIT}</span>
                   </div>
                   
                   <div className="space-y-6">
                      <div className="flex justify-between text-xs font-black text-zinc-500 uppercase tracking-widest">
                         <span>Monthly Usage</span>
                         <span className="text-white">{Math.round((selectedTenant.currentReq / GLOBAL_LIMIT) * 100)}%</span>
                      </div>
                      <div className="h-4 bg-zinc-950 rounded-full border border-zinc-900 overflow-hidden">
                         <div 
                           className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_15px_#10b98155]" 
                           style={{ width: `${Math.round((selectedTenant.currentReq / GLOBAL_LIMIT) * 100)}%` }}
                         ></div>
                      </div>
                      <div className="flex justify-between text-[10px] font-medium text-zinc-700">
                         <span>{selectedTenant.currentReq} REQS TODAY</span>
                         <span>MAX HEALTHY: 85%</span>
                      </div>
                   </div>
                </div>
             </div>

             {/* Personal Request Graph */}
             <div className="bg-[#0a0a0a] p-12 rounded-[3.5rem] border border-zinc-900 mb-16 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-12">
                   <h3 className="text-2xl font-black text-white uppercase tracking-tight">Request Volume (24H)</h3>
                   <span className="text-xs font-black text-emerald-500/50 tracking-widest">NODE_MONITOR_v1</span>
                </div>
                <div className="flex-1 w-full min-h-[300px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={globalChartData.map(d => ({ ...d, load: Math.floor(d.load / 4) }))}>
                         <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                         <Tooltip 
                           contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '16px', padding: '16px' }}
                           itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                         />
                         <Area type="monotone" dataKey="load" stroke="#10b981" strokeWidth={4} fill="#10b981" fillOpacity={0.05} />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
             </div>

             <div className="pt-10 border-t border-zinc-900/50 flex gap-6">
                <button 
                  onClick={(e) => handleToggleStatus(e, selectedTenant.id)}
                  className={`px-16 py-8 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 ${selectedTenant.ativo ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500 text-black shadow-2xl shadow-emerald-500/20'}`}
                >
                  {selectedTenant.ativo ? 'SUSPEND INSTANCE' : 'RESTORE ACCESS'}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
