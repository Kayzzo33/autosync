'use client';

import { useEffect, useState } from 'react';
import { superadminLogout } from '../actions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
    return <div className="min-h-screen flex items-center justify-center text-white">Carregando...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 bg-zinc-950">
        <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-6 max-w-lg w-full text-center">
          <p className="text-red-400 font-bold mb-2">Erro de autenticação</p>
          <p className="text-red-300 text-sm font-mono break-all">{error}</p>
        </div>
        <button onClick={() => window.location.href = '/superadmin/login'} className="text-zinc-400 hover:text-white text-sm underline">
          Voltar para o login
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Superadmin Dashboard</h1>
          <p className="text-zinc-400 mt-1">Gerenciamento global de inquilinos (Oficinas)</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleGenerateInvite}
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + Gerar Convite
          </button>
          <button 
            onClick={handleLogout}
            className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Sair
          </button>
        </div>
      </div>

      {inviteUrl && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 flex flex-col gap-2">
          <h3 className="text-yellow-500 font-semibold">Convite Gerado com Sucesso!</h3>
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

      <div>
        <h2 className="text-xl font-bold text-white mb-4">Oficinas Cadastradas</h2>
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
                  <td className="px-6 py-4 font-medium text-white">{tenant.nome}</td>
                  <td className="px-6 py-4">{tenant.email_admin}</td>
                  <td className="px-6 py-4">
                    {format(new Date(tenant.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                  </td>
                  <td className="px-6 py-4">{tenant.total_usuarios}</td>
                  <td className="px-6 py-4">{tenant.total_os}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tenant.ativo ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
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

      <div>
        <h2 className="text-xl font-bold text-white mb-4">Log de Auditoria</h2>
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
                  <td className="px-6 py-3 whitespace-nowrap">
                    {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}
                  </td>
                  <td className="px-6 py-3">{log.ip}</td>
                  <td className="px-6 py-3 font-medium text-yellow-500">{log.acao}</td>
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
