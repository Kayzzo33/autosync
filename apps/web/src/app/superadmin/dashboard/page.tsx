'use client';

import { useEffect, useState } from 'react';
import { superadminLogout } from '../actions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Users, 
  Wrench, 
  Building2, 
  Activity, 
  AlertTriangle,
  LogOut,
  Plus
} from 'lucide-react';

export default function SuperadminDashboard() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');

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

  const handleGenerateInvite = async () => {
    const res = await fetch('/api/superadmin/tenants'); // placeholder — será /api/superadmin/invite
    alert('Em breve: geração de convite via Route Handler');
  };

  const handleToggleStatus = async (id: string) => {
    if (!confirm('Tem certeza que deseja alterar o status desta oficina?')) return;
    try {
      const res = await fetch(`/api/superadmin/tenants`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) loadData();
      else alert('Erro ao alterar status');
    } catch {
      alert('Erro ao alterar status');
    }
  };

  const handleLogout = async () => {
    await superadminLogout();
    window.location.href = '/superadmin/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400 font-medium">Carregando painel de controle...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 bg-zinc-950">
        <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-6 max-w-lg w-full text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 font-bold mb-2">Erro de autenticação</p>
          <p className="text-red-300 text-sm font-mono break-all">{error}</p>
        </div>
        <button onClick={() => window.location.href = '/superadmin/login'} className="text-zinc-400 hover:text-white text-sm underline">
          Voltar para o login
        </button>
      </div>
    );
  }

  // Cálculos para Dashboard
  const totalOficinas = tenants.length;
  const oficinasAtivas = tenants.filter(t => t.ativo).length;
  const totalUsuarios = tenants.reduce((acc, t) => acc + parseInt(t.total_usuarios || 0), 0);
  const totalOS = tenants.reduce((acc, t) => acc + parseInt(t.total_os || 0), 0);

  // Top 5 Oficinas por OS
  const topTenantsOS = [...tenants].sort((a, b) => parseInt(b.total_os || 0) - parseInt(a.total_os || 0)).slice(0, 5).map(t => ({
    name: t.nome.substring(0, 15) + (t.nome.length > 15 ? '...' : ''),
    os: parseInt(t.total_os || 0)
  }));

  const COLORS = ['#eab308', '#f59e0b', '#d97706', '#b45309', '#78350f'];
  const pieData = [
    { name: 'Ativas', value: oficinasAtivas },
    { name: 'Suspensas', value: totalOficinas - oficinasAtivas }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-yellow-500" />
            Superadmin
          </h1>
          <p className="text-zinc-400 mt-1 ml-11">Gestão global e saúde do sistema</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleGenerateInvite}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Tenant
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </div>

      {inviteUrl && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 flex flex-col gap-2 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-yellow-500 font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4" /> Convite Gerado com Sucesso!
          </h3>
          <p className="text-zinc-300 text-sm mb-2">Envie este link para a nova oficina. Ele expira em 48h e só pode ser usado uma vez.</p>
          <div className="flex items-center gap-2">
            <input 
              readOnly 
              value={inviteUrl} 
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white flex-1 outline-none"
            />
            <button 
              onClick={() => { navigator.clipboard.writeText(inviteUrl); alert('Copiado!'); }}
              className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-white transition-colors"
            >
              Copiar
            </button>
          </div>
        </div>
      )}

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Building2 className="w-16 h-16 text-yellow-500" />
          </div>
          <p className="text-zinc-400 text-sm font-medium">Total de Oficinas</p>
          <p className="text-3xl font-bold text-white mt-2">{totalOficinas}</p>
          <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            {oficinasAtivas} Ativas
          </p>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users className="w-16 h-16 text-blue-500" />
          </div>
          <p className="text-zinc-400 text-sm font-medium">Usuários Ativos</p>
          <p className="text-3xl font-bold text-white mt-2">{totalUsuarios}</p>
          <p className="text-xs text-zinc-500 mt-2">Em todo o sistema</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wrench className="w-16 h-16 text-purple-500" />
          </div>
          <p className="text-zinc-400 text-sm font-medium">OS Geradas</p>
          <p className="text-3xl font-bold text-white mt-2">{totalOS}</p>
          <p className="text-xs text-zinc-500 mt-2">Volume total</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 border border-yellow-500/20 rounded-xl p-6">
          <p className="text-yellow-500 text-sm font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Status do Banco
          </p>
          <p className="text-2xl font-bold text-white mt-2">Saudável</p>
          <p className="text-xs text-yellow-200 mt-2">
            Tudo operacional. {logs.length} eventos registrados.
          </p>
        </div>
      </div>

      {/* Seção de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-white mb-6">Top 5 Oficinas (por volume de OS)</h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topTenantsOS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#27272a' }}
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#eab308' }}
                />
                <Bar dataKey="os" fill="#eab308" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center">
          <h2 className="text-lg font-bold text-white w-full text-left mb-2">Saúde de Assinaturas</h2>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-sm text-zinc-400">Ativas</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-sm text-zinc-400">Suspensas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Tenants */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Gerenciamento de Inquilinos</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950 text-zinc-400">
              <tr>
                <th className="px-6 py-4 font-medium">Oficina</th>
                <th className="px-6 py-4 font-medium">E-mail Admin</th>
                <th className="px-6 py-4 font-medium">Data Cadastro</th>
                <th className="px-6 py-4 font-medium">Usuários</th>
                <th className="px-6 py-4 font-medium">Total OS</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-zinc-300">
              {tenants.map(tenant => (
                <tr key={tenant.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-zinc-400" />
                    </div>
                    {tenant.nome}
                  </td>
                  <td className="px-6 py-4 text-zinc-400">{tenant.email_admin}</td>
                  <td className="px-6 py-4 text-zinc-400">
                    {format(new Date(tenant.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                  </td>
                  <td className="px-6 py-4 text-center font-medium">
                    <span className="bg-zinc-800 px-2.5 py-1 rounded-md text-zinc-300">
                      {tenant.total_usuarios}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-medium">
                    <span className="bg-zinc-800 px-2.5 py-1 rounded-md text-zinc-300">
                      {tenant.total_os}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5 ${tenant.ativo ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${tenant.ativo ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      {tenant.ativo ? 'Ativo' : 'Suspenso'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleToggleStatus(tenant.id)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${tenant.ativo ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}
                    >
                      {tenant.ativo ? 'Suspender' : 'Reativar'}
                    </button>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">
                    Nenhuma oficina encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log de Auditoria */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Log de Auditoria</h2>
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

