'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, Search, Filter, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/logs', { cache: 'no-store' });
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white">Logs de Auditoria</h1>
          <p className="text-zinc-500 text-sm">Rastreamento de todas as ações administrativas</p>
        </div>
      </div>

      <div className="bg-[#0a0a0a] border border-zinc-900 rounded-[2rem] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900/50 text-zinc-500">
            <tr>
              <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Data / Hora</th>
              <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">IP</th>
              <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Ação</th>
              <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Detalhes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 text-zinc-300">
            {logs.map((log, idx) => (
              <tr key={log.id || idx} className="hover:bg-zinc-900/50 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Clock className="w-3 h-3" />
                    {log.created_at ? format(new Date(log.created_at), "dd/MM HH:mm:ss") : '--'}
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-zinc-500 group-hover:text-zinc-300 transition-colors">
                  {log.ip}
                </td>
                <td className="px-6 py-4">
                  <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                    {log.acao}
                  </span>
                </td>
                <td className="px-6 py-4 max-w-md">
                   <div className="font-mono text-[10px] text-zinc-500 truncate group-hover:text-zinc-400">
                     {JSON.stringify(log.detalhes)}
                   </div>
                </td>
              </tr>
            ))}
            {logs.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center text-zinc-600 italic">
                  Nenhuma atividade registrada no sistema.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
