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
  Plus
} from 'lucide-react';
import Link from 'next/link';

export default function SuperadminDashboard() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const handleLogout = async () => {
    await superadminLogout();
    window.location.href = '/superadmin/login';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-400">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p>Sincronizando dados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 max-w-lg text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  // Estatísticas Principais
  const totalOficinas = tenants.length;
  const oficinasAtivas = tenants.filter(t => t.ativo).length;
  const totalUsuarios = tenants.reduce((acc, t) => acc + parseInt(t.total_usuarios || 0), 0);
  const totalOS = tenants.reduce((acc, t) => acc + parseInt(t.total_os || 0), 0);

  // Top 5 Tenants
  const topTenantsOS = [...tenants].sort((a, b) => parseInt(b.total_os || 0) - parseInt(a.total_os || 0)).slice(0, 5);

  // Mocked Data para o gráfico principal
  const areaChartData = [
    { name: '01 Fev', req: 1200 },
    { name: '04 Fev', req: 3000 },
    { name: '07 Fev', req: 1500 },
    { name: '10 Fev', req: 4000 },
    { name: '13 Fev', req: 2800 },
    { name: '16 Fev', req: 8500 },
    { name: '19 Fev', req: 4200 },
    { name: '22 Fev', req: 6000 },
    { name: '25 Fev', req: 5100 },
    { name: '28 Fev', req: 9800 },
    { name: '01 Mar', req: 7000 },
  ];

  return (
    <div className="space-y-6 pb-12 bg-[#0a0a0a] min-h-screen p-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white">Visão Geral</h1>
          <p className="text-sm text-zinc-500 mt-1">Métricas de crescimento e saúde da plataforma</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-[#0e0e11] border border-zinc-800/50 rounded-2xl p-5 hover:border-emerald-500/30 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Building2 className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="flex items-center text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
              <ArrowUpRight className="w-3 h-3 mr-1" /> +12%
            </span>
          </div>
          <p className="text-zinc-500 text-sm font-medium">Oficinas Ativas</p>
          <h3 className="text-3xl font-bold text-white mt-1">{oficinasAtivas} <span className="text-sm text-zinc-600 font-normal">/ {totalOficinas}</span></h3>
        </div>

        <div className="bg-[#0e0e11] border border-zinc-800/50 rounded-2xl p-5 hover:border-blue-500/30 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <span className="flex items-center text-xs font-medium text-blue-500 bg-blue-500/10 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3 mr-1" /> +5.4%
            </span>
          </div>
          <p className="text-zinc-500 text-sm font-medium">Usuários Ativos</p>
          <h3 className="text-3xl font-bold text-white mt-1">{totalUsuarios}</h3>
        </div>

        <div className="bg-[#0e0e11] border border-zinc-800/50 rounded-2xl p-5 hover:border-purple-500/30 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Wrench className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <p className="text-zinc-500 text-sm font-medium">OS Emitidas</p>
          <h3 className="text-3xl font-bold text-white mt-1">{totalOS}</h3>
        </div>

        <div className="bg-[#0e0e11] border border-zinc-800/50 rounded-2xl p-5 hover:border-yellow-500/30 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Server className="w-5 h-5 text-yellow-500" />
            </div>
            <span className="flex items-center text-xs font-medium text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full">
              99.9% Uptime
            </span>
          </div>
          <p className="text-zinc-500 text-sm font-medium">Saúde do Banco</p>
          <h3 className="text-3xl font-bold text-white mt-1 text-yellow-500">Normal</h3>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="bg-[#0e0e11] border border-zinc-800/50 rounded-2xl p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-white font-semibold">Volume de Requisições</h2>
              <p className="text-zinc-500 text-sm">Uso geral da API neste mês</p>
            </div>
            <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-medium border border-emerald-500/20">
              Total: 49.3k
            </div>
          </div>
          
          <div className="h-[280px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                  itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="req" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorReq)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0e0e11] border border-zinc-800/50 rounded-2xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-white font-semibold">Top 5 Inquilinos</h2>
            <span className="text-xs text-zinc-500">Por volume</span>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            {topTenantsOS.map((tenant, index) => (
              <div key={tenant.id} className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 flex items-center justify-between hover:bg-zinc-900 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0a0a0a] border border-zinc-800 flex items-center justify-center font-bold text-zinc-400 text-xs">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white truncate max-w-[120px]">{tenant.nome}</p>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                      <Wrench className="w-3 h-3" /> {tenant.total_os} OS
                    </div>
          <span className="text-xs text-zinc-500 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Mostrando os últimos {logs.length} eventos (Limpeza automática ativada)
          </span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950 text-zinc-400">
              <tr>
                <th className="px-6 py-3 font-medium">Data/Hora</th>
                <th className="px-6 py-3 font-medium">IP</th>
                <th className="px-6 py-3 font-medium">Ação</th>
                <th className="px-6 py-3 font-medium">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-zinc-300">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-zinc-800/50">
                  <td className="px-6 py-3 whitespace-nowrap text-zinc-400">
                    {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}
                  </td>
                  <td className="px-6 py-3 font-mono text-xs">{log.ip}</td>
                  <td className="px-6 py-3 font-medium text-yellow-500">
                    <span className="bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded text-xs">
                      {log.acao}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-zinc-500">
                    {JSON.stringify(log.detalhes)}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-center text-zinc-600 italic">
                    Nenhum log de auditoria disponível ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

