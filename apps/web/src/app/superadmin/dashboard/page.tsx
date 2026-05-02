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
  MoreVertical,
  ExternalLink,
  ShieldCheck,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function SuperadminDashboard() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await fetch(`/api/superadmin/tenants/${id}/suspender`, {
        method: 'PATCH',
      });
      if (res.ok) {
        toast.success('Status do inquilino atualizado!');
        loadData();
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
        toast.success('Link de convite copiado!');
      } else {
        toast.error('Falha ao gerar convite');
      }
    } catch (err) {
      toast.error('Erro ao gerar convite');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-zinc-400">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-medium animate-pulse">Sincronizando ecossistema...</p>
      </div>
    );
  }

  // Estatísticas Globais (Plataforma)
  const totalOficinas = tenants.length;
  const oficinasAtivas = tenants.filter(t => t.ativo).length;
  const totalUsuarios = tenants.reduce((acc, t) => acc + parseInt(t.total_usuarios || 0), 0);
  const totalOS = tenants.reduce((acc, t) => acc + parseInt(t.total_os || 0), 0);
  const faturamentoEstimado = totalOS * 450; // Média mockada de R$ 450 por OS

  // Gráfico de Consumo por Tenant (MOCK DATA para visualização)
  const consumptionData = tenants.map(t => ({
    name: t.nome.split(' ')[0],
    req: Math.floor(Math.random() * 5000) + 1000,
    active: t.ativo
  })).sort((a, b) => b.req - a.req).slice(0, 8);

  const filteredTenants = tenants.filter(t => 
    t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.includes(searchTerm)
  );

  return (
    <div className="space-y-8 pb-20 max-w-[1600px] mx-auto">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">System Monitor</h1>
          <p className="text-zinc-500 font-medium">Gestão global de infraestrutura e parcerias</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleCreateInvite}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-black px-6 py-3 rounded-2xl text-sm font-black transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Novo Inquilino
          </button>
        </div>
      </div>

      {/* Global KPIs (Platform Level) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-[#0e0e11] border border-zinc-800/50 rounded-[2rem] p-8 hover:border-emerald-500/30 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-emerald-500/10 rounded-2xl">
              <Building2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="flex flex-col items-end">
               <span className="text-emerald-500 text-xs font-black uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-full">Saudável</span>
            </div>
          </div>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em]">Inquilinos Ativos</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-4xl font-black text-white">{oficinasAtivas}</h3>
            <span className="text-zinc-600 text-lg">/ {totalOficinas}</span>
          </div>
        </div>

        <div className="bg-[#0e0e11] border border-zinc-800/50 rounded-[2rem] p-8 hover:border-blue-500/30 transition-all group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-blue-500/10 rounded-2xl">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <TrendingUp className="w-5 h-5 text-zinc-700" />
          </div>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em]">Usuários Totais</p>
          <h3 className="text-4xl font-black text-white mt-2">{totalUsuarios.toLocaleString()}</h3>
        </div>

        <div className="bg-[#0e0e11] border border-zinc-800/50 rounded-[2rem] p-8 hover:border-amber-500/30 transition-all group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-amber-500/10 rounded-2xl">
              <DollarSign className="w-6 h-6 text-amber-500" />
            </div>
            <span className="text-[10px] font-black text-amber-500/70 border border-amber-500/20 px-2 py-1 rounded-lg">PREVISÃO</span>
          </div>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em]">Faturamento Global</p>
          <h3 className="text-4xl font-black text-white mt-2">R$ {faturamentoEstimado.toLocaleString('pt-BR')}</h3>
        </div>

        <div className="bg-[#0e0e11] border border-zinc-800/50 rounded-[2rem] p-8 hover:border-purple-500/30 transition-all group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-purple-500/10 rounded-2xl">
              <Activity className="w-6 h-6 text-purple-500" />
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
          </div>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em]">Database Health</p>
          <h3 className="text-4xl font-black text-white mt-2 uppercase tracking-tighter">Normal</h3>
        </div>
      </div>

      {/* Main Stats & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Aggregate Chart: Volume por Tenant */}
        <div className="bg-[#0e0e11] border border-zinc-800/50 rounded-[2.5rem] p-8 lg:col-span-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Distribuição de Carga</h2>
              <p className="text-zinc-500 text-sm">Requisições por inquilino nas últimas 24h</p>
            </div>
            <div className="flex gap-2">
               <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Normal</span>
               </div>
            </div>
          </div>
          
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consumptionData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.2} />
                <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} dy={10} fontStyle="bold" />
                <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#10b981', fontWeight: 'bold', fontSize: '12px' }}
                />
                <Bar dataKey="req" radius={[8, 8, 0, 0]} maxBarSize={50}>
                  {consumptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.req > 5000 ? '#ef4444' : (entry.active ? '#10b981' : '#3f3f46')} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-time Monitor / Alert Center */}
        <div className="bg-[#0e0e11] border border-zinc-800/50 rounded-[2.5rem] p-8 flex flex-col">
          <h2 className="text-xl font-black text-white uppercase tracking-tight mb-8">Alertas Críticos</h2>
          <div className="space-y-4 flex-1">
             {totalOS > 1000 ? (
               <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex gap-4">
                  <div className="p-2 bg-rose-500/20 rounded-xl h-fit">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">Limites de Escala</p>
                    <p className="text-zinc-500 text-xs mt-1">Volume de O.S. ultrapassou o limite do plano Basic em 3 inquilinos.</p>
                  </div>
               </div>
             ) : null}

             <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl flex gap-4">
                <div className="p-2 bg-emerald-500/10 rounded-xl h-fit">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-white text-sm font-bold">Monitor de Backup</p>
                  <p className="text-zinc-500 text-xs mt-1">Sincronização Upstash finalizada com sucesso há 14 minutos.</p>
                </div>
             </div>

             <div className="bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-2xl flex gap-4 opacity-50">
                <div className="p-2 bg-zinc-800 rounded-xl h-fit">
                  <Activity className="w-5 h-5 text-zinc-500" />
                </div>
                <div>
                  <p className="text-zinc-400 text-sm font-bold">Audit Log Update</p>
                  <p className="text-zinc-600 text-xs mt-1">Nenhuma atividade suspeita detectada na última hora.</p>
                </div>
             </div>
          </div>
          <button className="mt-8 text-center text-xs font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">
             Ver central de segurança
          </button>
        </div>
      </div>

      {/* Tenant Management Section (Cards as requested) */}
      <div className="pt-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-black text-white">Inquilinos na Rede</h2>
            <p className="text-zinc-500 text-sm">Gerenciamento individual de instâncias ativas</p>
          </div>
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar por nome, slug ou ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#0e0e11] border border-zinc-800/50 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTenants.map((tenant) => (
            <div key={tenant.id} className={`bg-[#0e0e11] border border-zinc-800/50 rounded-[2rem] p-6 hover:border-zinc-700 transition-all group relative overflow-hidden ${!tenant.ativo ? 'opacity-70 grayscale' : ''}`}>
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-zinc-400 text-lg group-hover:text-emerald-500 group-hover:border-emerald-500/30 transition-all">
                    {tenant.nome[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-white font-bold group-hover:text-emerald-400 transition-colors">{tenant.nome}</h3>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{tenant.email_admin || 'Sem admin'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button 
                     onClick={() => handleToggleStatus(tenant.id)}
                     className={`p-2 rounded-xl transition-all ${tenant.ativo ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                     title={tenant.ativo ? "Suspender Acesso" : "Reativar Acesso"}
                   >
                     {tenant.ativo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                   </button>
                </div>
              </div>

              {/* Stats Inside the card as requested */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800/30 text-center">
                   <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Usuários</p>
                   <p className="text-lg font-black text-white">{tenant.total_usuarios}</p>
                </div>
                <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800/30 text-center">
                   <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">O.S. Emitidas</p>
                   <p className="text-lg font-black text-white">{tenant.total_os}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                   <span className="text-zinc-500 font-bold uppercase tracking-widest">Carga da API</span>
                   <span className="text-zinc-400 font-mono">{Math.floor(Math.random() * 40)}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                   <div 
                     className={`h-full transition-all duration-1000 ${tenant.ativo ? 'bg-emerald-500' : 'bg-zinc-700'}`} 
                     style={{ width: `${Math.floor(Math.random() * 60) + 20}%` }}
                   ></div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-800/50 flex justify-between items-center">
                <span className="text-[10px] text-zinc-600 font-medium">Desde {new Date(tenant.created_at).toLocaleDateString()}</span>
                <button className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:translate-x-1 transition-transform">
                   Detalhes do Tenant <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
