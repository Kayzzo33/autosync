'use client';

import { useEffect, useState } from 'react';
import { superadminLogout } from '../actions';
import { format } from 'date-fns';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { 
  Users, 
  Wrench, 
  Building2, 
  Activity, 
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Server,
  LogOut,
  Plus,
  Power,
  PowerOff,
  Search,
  X,
  Database,
  Zap,
  ShieldCheck,
  Cpu,
  Monitor
} from 'lucide-react';
import { toast } from 'sonner';

export default function SuperadminDashboard() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);

  // Limite imaginário de consumo (Requisições por mês)
  const GLOBAL_LIMIT = 50000;

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const tenantsRes = await fetch('/api/superadmin/tenants', { cache: 'no-store' });
      const tenantsData = await tenantsRes.json();

      if (!tenantsRes.ok) {
        setError(`${tenantsData.error || 'Erro desconhecido'}`);
        setLoading(false);
        return;
      }

      const logsRes = await fetch('/api/superadmin/logs', { cache: 'no-store' });
      const logsData = await logsRes.json();

      setTenants(Array.isArray(tenantsData) ? tenantsData : []);
      setLogs(Array.isArray(logsData) ? logsData : []);
    } catch (err: any) {
      setError(`Erro de comunicação: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/superadmin/tenants/${id}/suspender`, {
        method: 'PATCH',
      });
      if (res.ok) {
        toast.success('Estado do sistema alterado', {
          description: 'A instância teve seu acesso modificado com sucesso.'
        });
        loadData();
        if (selectedTenant?.id === id) {
          setSelectedTenant({ ...selectedTenant, ativo: !selectedTenant.ativo });
        }
      }
    } catch (err) {
      toast.error('Erro de sincronização');
    }
  };

  const handleCreateInvite = async () => {
    try {
      const res = await fetch('/api/superadmin/convites', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        // Build URL on frontend to avoid "undefined" from backend env
        const inviteUrl = `${window.location.origin}/cadastro?token=${data.token}`;
        navigator.clipboard.writeText(inviteUrl);
        toast.success('Invite link generated!', {
          description: 'Copiado para a área de transferência.'
        });
      }
    } catch (err) {
      toast.error('Failed to generate token');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] bg-[#050505]">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-emerald-500/10 rounded-full"></div>
          <div className="absolute top-0 w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-8 text-zinc-600 font-mono text-[10px] tracking-[0.4em] uppercase animate-pulse">Establishing Secure Connection...</p>
      </div>
    );
  }

  const activeTenants = tenants.filter(t => t.ativo).length;
  const totalUsers = tenants.reduce((acc, t) => acc + parseInt(t.total_usuarios || 0), 0);
  const totalOS = tenants.reduce((acc, t) => acc + parseInt(t.total_os || 0), 0);

  // Mocked global load
  const globalChartData = [
    { time: '00:00', load: 1200 },
    { time: '04:00', load: 800 },
    { time: '08:00', load: 2400 },
    { time: '12:00', load: 4800 },
    { time: '16:00', load: 3900 },
    { time: '20:00', load: 2100 },
    { time: '23:59', load: 1500 },
  ];

  const filteredTenants = tenants.filter(t => 
    t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 font-sans">
      <div className="max-w-[1600px] mx-auto p-10 space-y-12">
        
        {/* Superior Control Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8">
          <div className="space-y-4">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                   <Monitor className="w-5 h-5 text-emerald-500" />
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Control<span className="text-emerald-500">Center</span></h1>
             </div>
             <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                   NETWORK ONLINE
                </div>
                <div>UPTIME: 14D 02H 12M</div>
                <div>NODES: {tenants.length}</div>
             </div>
          </div>
          
          <button 
            onClick={handleCreateInvite}
            className="group flex items-center gap-4 bg-white text-black px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all hover:bg-emerald-500 hover:shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] active:scale-95 shadow-2xl"
          >
            <Plus className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            Provisionar Nova Instância
          </button>
        </div>

        {/* Global Network Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
           {[
             { label: 'Network Instances', val: activeTenants, sub: `/ ${tenants.length}`, icon: Building2, color: 'emerald' },
             { label: 'Global Users', val: totalUsers, sub: 'CONNECTED', icon: Users, color: 'blue' },
             { label: 'Data Flow (OS)', val: totalOS, sub: 'PROCESSED', icon: Zap, color: 'amber' },
             { label: 'Database Sync', val: '99.9%', sub: 'STABLE', icon: Database, color: 'purple' }
           ].map((kpi, i) => (
             <div key={i} className="bg-[#0a0a0a] border border-zinc-900 rounded-[2.5rem] p-10 group relative overflow-hidden transition-all hover:border-zinc-800">
                <div className={`absolute top-0 right-0 w-24 h-24 bg-${kpi.color}-500/5 blur-[40px] -mr-12 -mt-12`}></div>
                <kpi.icon className={`w-5 h-5 text-${kpi.color}-500 mb-6`} />
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">{kpi.label}</p>
                <div className="flex items-baseline gap-2">
                   <h3 className="text-4xl font-black text-white tracking-tighter">{kpi.val}</h3>
                   <span className="text-zinc-700 font-bold text-sm">{kpi.sub}</span>
                </div>
             </div>
           ))}
        </div>

        {/* Aggregate Network Traffic */}
        <div className="bg-[#0a0a0a] border border-zinc-900 rounded-[3rem] p-12 group overflow-hidden relative">
          <div className="flex justify-between items-start mb-12 relative z-10">
             <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Fluxo de Requisições Global</h2>
                <p className="text-zinc-600 text-sm font-medium mt-1">Carga combinada através de todos os pontos de presença</p>
             </div>
             <div className="flex gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 px-4 py-2 rounded-xl text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                   REAL-TIME MONITORING
                </div>
             </div>
          </div>

          <div className="h-[380px] w-full relative z-10">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={globalChartData}>
                   <defs>
                      <linearGradient id="globalGrad" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                         <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="5 5" stroke="#18181b" vertical={false} />
                   <XAxis dataKey="time" stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                   <YAxis stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} />
                   <Tooltip 
                      contentStyle={{ backgroundColor: '#09090b', border: '1px solid #1f1f23', borderRadius: '12px', fontSize: '12px' }}
                      itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                   />
                   <Area type="monotone" dataKey="load" stroke="#10b981" strokeWidth={3} fill="url(#globalGrad)" />
                </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Instances Grid (Premium Cards) */}
        <div className="space-y-10">
           <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-zinc-900 pb-10">
              <div>
                 <h2 className="text-3xl font-black text-white tracking-tighter">Instâncias de Produção</h2>
                 <p className="text-zinc-600 font-medium">Controle de limites e integridade de dados individuais</p>
              </div>
              <div className="relative w-full md:w-[450px]">
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                 <input 
                   type="text" 
                   placeholder="SEARCH CORE ID OR NAME..."
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   className="w-full bg-[#0a0a0a] border border-zinc-900 rounded-full py-5 pl-14 pr-6 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-all uppercase font-bold tracking-widest placeholder:text-zinc-800"
                 />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
              {filteredTenants.map((tenant) => {
                 // Cálculo de "Saúde" baseado em limite imaginário
                 const currentReq = Math.floor(Math.random() * 8000) + 1200; // Mocked
                 const healthPercent = Math.min(Math.round((currentReq / 10000) * 100), 100);
                 const isHealthy = tenant.ativo && healthPercent < 80;

                 return (
                    <div 
                      key={tenant.id} 
                      onClick={() => setSelectedTenant({ ...tenant, currentReq })}
                      className={`group bg-[#0a0a0a] border border-zinc-900 rounded-[2.5rem] p-10 hover:border-zinc-700 transition-all cursor-pointer relative overflow-hidden ${!tenant.ativo ? 'opacity-40' : ''}`}
                    >
                       <div className="flex justify-between items-start mb-12">
                          <div className="flex items-center gap-6">
                             <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl font-black text-zinc-400 group-hover:text-emerald-500 group-hover:border-emerald-500/30 transition-all">
                                {tenant.nome[0].toUpperCase()}
                             </div>
                             <div>
                                <h3 className="text-white font-black text-xl tracking-tight group-hover:text-emerald-400 transition-colors">{tenant.nome}</h3>
                                <p className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest mt-1">INSTANCE_ID: {tenant.id.slice(0, 8)}</p>
                             </div>
                          </div>
                          <button 
                            onClick={(e) => handleToggleStatus(e, tenant.id)}
                            className={`p-4 rounded-2xl transition-all ${tenant.ativo ? 'bg-rose-500/5 text-rose-500/50 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-500'}`}
                          >
                            {tenant.ativo ? <PowerOff className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                          </button>
                       </div>

                       <div className="grid grid-cols-2 gap-4 mb-10">
                          <div className="bg-zinc-950 p-6 rounded-[1.5rem] border border-zinc-900/50">
                             <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-2">Users Connect</p>
                             <p className="text-2xl font-black text-white">{tenant.total_usuarios}</p>
                          </div>
                          <div className="bg-zinc-950 p-6 rounded-[1.5rem] border border-zinc-900/50">
                             <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-2">OS Ledger</p>
                             <p className="text-2xl font-black text-white">{tenant.total_os}</p>
                          </div>
                       </div>

                       <div className="space-y-4">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                             <span className="text-zinc-600">Instance Health</span>
                             <span className={isHealthy ? 'text-emerald-500' : 'text-rose-500'}>{isHealthy ? 'STABLE' : (tenant.ativo ? 'CRITICAL LOAD' : 'OFFLINE')}</span>
                          </div>
                          <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                             <div 
                               className={`h-full transition-all duration-1000 ${isHealthy ? 'bg-emerald-500' : (tenant.ativo ? 'bg-rose-500' : 'bg-zinc-800')}`} 
                               style={{ width: tenant.ativo ? `${healthPercent}%` : '0%' }}
                             ></div>
                          </div>
                       </div>
                    </div>
                 );
              })}
           </div>
        </div>
      </div>

      {/* Instance Detail Panel (Premium Full View) */}
      {selectedTenant && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setSelectedTenant(null)}></div>
          <div className="relative w-full max-w-3xl h-full bg-[#050505] border-l border-zinc-900 p-16 overflow-y-auto animate-in slide-in-from-right duration-500">
             
             <div className="flex justify-between items-center mb-20">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800">
                      <Cpu className="w-6 h-6 text-emerald-500" />
                   </div>
                   <h2 className="text-sm font-black text-zinc-500 uppercase tracking-[0.4em]">Instance Diagnostics</h2>
                </div>
                <button 
                  onClick={() => setSelectedTenant(null)}
                  className="p-4 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-all border border-zinc-800"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
             </div>

             <div className="flex items-center gap-10 mb-20">
                <div className="w-32 h-32 rounded-[2.5rem] bg-zinc-900 border border-zinc-800 flex items-center justify-center text-5xl font-black text-emerald-500 shadow-2xl shadow-emerald-500/10">
                   {selectedTenant.nome[0]}
                </div>
                <div>
                   <h2 className="text-5xl font-black text-white tracking-tighter mb-2 italic uppercase">{selectedTenant.nome}</h2>
                   <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedTenant.ativo ? 'bg-emerald-500 text-black' : 'bg-rose-500 text-white'}`}>
                         {selectedTenant.ativo ? 'ONLINE' : 'SUSPENDED'}
                      </span>
                      <span className="text-zinc-700 font-mono text-xs">{selectedTenant.id}</span>
                   </div>
                </div>
             </div>

             {/* Tenant Specific Real Data */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div className="bg-[#0a0a0a] p-10 rounded-[2.5rem] border border-zinc-900">
                   <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mb-4">Total O.S.</p>
                   <div className="flex items-end gap-3">
                      <h4 className="text-5xl font-black text-white leading-none">{selectedTenant.total_os}</h4>
                      <Wrench className="w-6 h-6 text-zinc-800 mb-1" />
                   </div>
                </div>
                <div className="bg-[#0a0a0a] p-10 rounded-[2.5rem] border border-zinc-900">
                   <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mb-4">Users Ledger</p>
                   <div className="flex items-end gap-3">
                      <h4 className="text-5xl font-black text-white leading-none">{selectedTenant.total_usuarios}</h4>
                      <Users className="w-6 h-6 text-zinc-800 mb-1" />
                   </div>
                </div>
             </div>

             {/* Personal Request Graph */}
             <div className="bg-[#0a0a0a] p-10 rounded-[3rem] border border-zinc-900 mb-12">
                <div className="flex justify-between items-center mb-10">
                   <h3 className="text-xl font-black text-white uppercase tracking-tight">Request Volume (24H)</h3>
                   <span className="text-[10px] font-black text-emerald-500/50">NODE_MONITOR_v1</span>
                </div>
                <div className="h-[250px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={globalChartData.map(d => ({ ...d, load: Math.floor(d.load / 4) }))}>
                         <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                         <Tooltip 
                           contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px' }}
                           itemStyle={{ color: '#10b981' }}
                         />
                         <Area type="monotone" dataKey="load" stroke="#10b981" strokeWidth={3} fill="#10b981" fillOpacity={0.05} />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
             </div>

             {/* Consumption Limit Control */}
             <div className="bg-[#0a0a0a] p-10 rounded-[3rem] border border-zinc-900 space-y-8">
                <div className="flex justify-between items-center">
                   <h3 className="text-xl font-black text-white uppercase tracking-tight">Consumption Limit</h3>
                   <span className="text-[10px] font-black text-zinc-700 tracking-widest italic">IMAGINARY LIMIT: {GLOBAL_LIMIT} REQ</span>
                </div>
                
                <div className="space-y-4">
                   <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      <span>Monthly Usage</span>
                      <span>{Math.round((selectedTenant.currentReq / GLOBAL_LIMIT) * 100)}%</span>
                   </div>
                   <div className="h-3 bg-zinc-950 rounded-full border border-zinc-900 overflow-hidden">
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

             <div className="mt-20 pt-10 border-t border-zinc-900 flex gap-4">
                <button 
                  onClick={(e) => handleToggleStatus(e, selectedTenant.id)}
                  className={`flex-1 py-6 rounded-3xl font-black text-xs uppercase tracking-widest transition-all ${selectedTenant.ativo ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500 text-black shadow-2xl'}`}
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
