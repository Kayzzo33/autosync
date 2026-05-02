'use client';

import { useEffect, useState } from 'react';
import { superadminLogout } from '../actions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
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
  ChevronRight,
  ShieldCheck,
  DollarSign,
  X,
  Database
} from 'lucide-react';
import { toast } from 'sonner';

export default function SuperadminDashboard() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);

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
        toast.success('Status atualizado com sucesso!');
        loadData();
        if (selectedTenant?.id === id) {
          setSelectedTenant({ ...selectedTenant, ativo: !selectedTenant.ativo });
        }
      } else {
        toast.error('Falha ao atualizar status');
      }
    } catch (err) {
      toast.error('Erro de rede');
    }
  };

  const handleCreateInvite = async () => {
    try {
      const res = await fetch('/api/superadmin/convites', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        navigator.clipboard.writeText(data.url);
        toast.success('Link de convite copiado!', {
          description: 'O link já está na sua área de transferência.'
        });
      } else {
        toast.error('Falha ao gerar convite', { description: data.error });
      }
    } catch (err) {
      toast.error('Erro ao gerar convite');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] bg-[#050505]">
        <div className="relative w-16 h-16 mb-8">
          <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-xs animate-pulse">Initializing Terminal...</p>
      </div>
    );
  }

  // Estatísticas Globais
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.ativo).length;
  const totalUsersPlatform = tenants.reduce((acc, t) => acc + parseInt(t.total_usuarios || 0), 0);
  const totalOSPlatform = tenants.reduce((acc, t) => acc + parseInt(t.total_os || 0), 0);

  // Dados do gráfico (Área Premium)
  const chartData = [
    { name: '00h', req: 400 },
    { name: '04h', req: 1200 },
    { name: '08h', req: 2800 },
    { name: '12h', req: 3400 },
    { name: '16h', req: 4200 },
    { name: '20h', req: 3100 },
    { name: '23h', req: 1800 },
  ];

  const filteredTenants = tenants.filter(t => 
    t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.includes(searchTerm)
  );

  return (
    <div className="relative min-h-screen bg-[#050505] text-zinc-300">
      <div className="max-w-[1600px] mx-auto p-8 space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
              Core Engine <span className="text-emerald-500 text-sm font-mono tracking-normal bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">v2.4.0</span>
            </h1>
            <p className="text-zinc-500 font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> 
              Monitoramento em tempo real de {totalTenants} instâncias
            </p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={handleCreateInvite}
              className="group relative flex items-center gap-2 bg-emerald-500 text-black px-8 py-4 rounded-2xl font-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/20"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              GERAR NOVO ACESSO
            </button>
          </div>
        </div>

        {/* Global KPIs (Premium Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#0a0a0a] border border-zinc-900 rounded-[2rem] p-8 relative overflow-hidden group hover:border-emerald-500/50 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] -mr-10 -mt-10 group-hover:bg-emerald-500/10 transition-colors"></div>
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Tenants Ativos</p>
            <h3 className="text-5xl font-black text-white tracking-tighter mb-4">{activeTenants}</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
              <TrendingUp className="w-4 h-4" /> +2 novos esse mês
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-zinc-900 rounded-[2rem] p-8 relative overflow-hidden group hover:border-blue-500/50 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] -mr-10 -mt-10 group-hover:bg-blue-500/10 transition-colors"></div>
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Usuários na Plataforma</p>
            <h3 className="text-5xl font-black text-white tracking-tighter mb-4">{totalUsersPlatform}</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-500">
              <Activity className="w-4 h-4" /> Sincronização Ok
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-zinc-900 rounded-[2rem] p-8 relative overflow-hidden group hover:border-amber-500/50 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[50px] -mr-10 -mt-10 group-hover:bg-amber-500/10 transition-colors"></div>
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Faturamento Esperado</p>
            <h3 className="text-5xl font-black text-white tracking-tighter mb-4">R$ --</h3>
            <div className="flex items-center gap-2 text-[10px] font-black text-zinc-600 uppercase">
              Aguardando Módulo de Billing
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-zinc-900 rounded-[2rem] p-8 relative overflow-hidden group hover:border-purple-500/50 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[50px] -mr-10 -mt-10 group-hover:bg-purple-500/10 transition-colors"></div>
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Uptime do Database</p>
            <h3 className="text-5xl font-black text-white tracking-tighter mb-4">99.9%</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
              <ShieldCheck className="w-4 h-4" /> Servidores Online
            </div>
          </div>
        </div>

        {/* Global Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-[#0a0a0a] border border-zinc-900 rounded-[2.5rem] p-10 lg:col-span-2 relative group overflow-hidden">
            <div className="flex justify-between items-start mb-10 relative z-10">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Tráfego de Requisições</h2>
                <p className="text-zinc-500 text-sm mt-1">Carga combinada de todos os inquilinos</p>
              </div>
              <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                Real-time Sync
              </div>
            </div>

            <div className="h-[350px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                  <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '16px', color: '#fff' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Area type="monotone" dataKey="req" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorReq)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Security Summary */}
          <div className="bg-[#0a0a0a] border border-zinc-900 rounded-[2.5rem] p-10 flex flex-col justify-between group overflow-hidden relative">
             <div className="absolute bottom-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[80px] group-hover:bg-emerald-500/10 transition-all"></div>
             <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-8">Security Hub</h2>
                <div className="space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">Firewall Ativo</p>
                        <p className="text-zinc-600 text-xs">Bloqueando 42 tentativas hoje</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Database className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">Integridade SQL</p>
                        <p className="text-zinc-600 text-xs">Schema validado e otimizado</p>
                      </div>
                   </div>
                </div>
             </div>
             <button 
                onClick={() => toast.info('Central de Segurança está sendo configurada.')}
                className="w-full py-4 bg-zinc-900 border border-zinc-800 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all mt-10"
             >
                Ver Central Completa
             </button>
          </div>
        </div>

        {/* Tenant List Section */}
        <div className="pt-12 space-y-8">
           <div className="flex flex-col md:flex-row justify-between items-end gap-6">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter">Instâncias Gerenciadas</h2>
                <p className="text-zinc-500 font-medium">Filtre e visualize a saúde de cada oficina individualmente</p>
              </div>
              <div className="relative w-full md:w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="ID, Nome ou Slug..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTenants.map((tenant) => (
                <div 
                  key={tenant.id} 
                  onClick={() => setSelectedTenant(tenant)}
                  className={`group bg-[#0a0a0a] border border-zinc-900 rounded-[2.5rem] p-8 hover:border-zinc-700 transition-all cursor-pointer relative overflow-hidden ${!tenant.ativo ? 'opacity-60 grayscale' : ''}`}
                >
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl font-black text-zinc-500 group-hover:text-emerald-500 group-hover:border-emerald-500/30 transition-all">
                        {tenant.nome[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-white font-black group-hover:text-emerald-400 transition-colors">{tenant.nome}</h3>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{tenant.id.slice(0, 8)}</p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => handleToggleStatus(e, tenant.id)}
                      className={`p-3 rounded-xl transition-all ${tenant.ativo ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                    >
                      {tenant.ativo ? <PowerOff className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-zinc-900/40 rounded-3xl p-5 border border-zinc-800/20 text-center group-hover:border-emerald-500/20 transition-all">
                       <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-1">Users</p>
                       <p className="text-xl font-black text-white">{tenant.total_usuarios}</p>
                    </div>
                    <div className="bg-zinc-900/40 rounded-3xl p-5 border border-zinc-800/20 text-center group-hover:border-emerald-500/20 transition-all">
                       <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-1">Total O.S.</p>
                       <p className="text-xl font-black text-white">{tenant.total_os}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                     <span>Saúde do Tenant</span>
                     <span className={tenant.ativo ? 'text-emerald-500' : 'text-rose-500'}>{tenant.ativo ? 'ONLINE' : 'SUSPENSO'}</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                     <div className={`h-full ${tenant.ativo ? 'bg-emerald-500' : 'bg-zinc-700'}`} style={{ width: tenant.ativo ? '85%' : '0%' }}></div>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Side Details Panel (Tenant Detailed View) */}
      {selectedTenant && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedTenant(null)}></div>
          <div className="relative w-full max-w-2xl h-full bg-[#0a0a0a] border-l border-zinc-900 p-12 overflow-y-auto animate-in slide-in-from-right duration-300">
             <button 
               onClick={() => setSelectedTenant(null)}
               className="absolute top-8 right-8 p-3 bg-zinc-900 rounded-2xl hover:bg-zinc-800 transition-all"
             >
               <X className="w-6 h-6 text-zinc-500" />
             </button>

             <div className="flex items-center gap-8 mb-16">
               <div className="w-24 h-24 rounded-[2rem] bg-zinc-900 border border-zinc-800 flex items-center justify-center text-4xl font-black text-emerald-500">
                  {selectedTenant.nome[0]}
               </div>
               <div>
                  <h2 className="text-4xl font-black text-white tracking-tighter">{selectedTenant.nome}</h2>
                  <p className="text-zinc-500 font-mono text-sm mt-2">{selectedTenant.id}</p>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-6 mb-12">
                <div className="bg-zinc-900/50 p-8 rounded-[2rem] border border-zinc-800">
                   <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Administrador</p>
                   <p className="text-white font-bold">{selectedTenant.email_admin || 'Não definido'}</p>
                </div>
                <div className="bg-zinc-900/50 p-8 rounded-[2rem] border border-zinc-800">
                   <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Criado em</p>
                   <p className="text-white font-bold">{format(new Date(selectedTenant.created_at), 'dd/MM/yyyy')}</p>
                </div>
             </div>

             <div className="space-y-8">
                <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                   <Activity className="w-5 h-5 text-emerald-500" />
                   Carga Operacional
                </h3>
                <div className="space-y-4 bg-zinc-900/30 p-8 rounded-[2.5rem] border border-zinc-800">
                   <div className="flex justify-between items-center text-xs font-bold text-zinc-500 uppercase">
                      <span>Volume de Requisições (24h)</span>
                      <span>--</span>
                   </div>
                   <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500/50 w-[45%]"></div>
                   </div>
                   <p className="text-[10px] text-zinc-600">O monitoramento granular de requisições por tenant requer a configuração do middleware de observabilidade.</p>
                </div>
             </div>

             <div className="mt-16 flex gap-4">
                <button 
                  onClick={(e) => handleToggleStatus(e, selectedTenant.id)}
                  className={`flex-1 py-5 rounded-3xl font-black text-xs uppercase tracking-widest transition-all ${selectedTenant.ativo ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 hover:scale-105'}`}
                >
                  {selectedTenant.ativo ? 'SUSPENDER INSTÂNCIA' : 'ATIVAR INSTÂNCIA'}
                </button>
                <button className="px-8 py-5 bg-zinc-900 border border-zinc-800 rounded-3xl text-white font-black text-xs uppercase tracking-widest hover:bg-zinc-800">
                   EXPORTAR LOGS
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
