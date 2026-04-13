'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { toast } from 'sonner';

export default function WhatsAppDashboard() {
  const [configs, setConfigs] = useState({
    osAberta: true,
    osPronta: true,
    nps: true,
    revisao: false,
  });

  const [logs] = useState([
    { id: 1, tipo: 'os_aberta', destinatario: '119***1234', status: 'enviado', data: 'Há 5 minutos' },
    { id: 2, tipo: 'manual', destinatario: '219***5555', status: 'falha', data: 'Há 1 hora' },
    { id: 3, tipo: 'nps', destinatario: '319***7777', status: 'enviado', data: 'Há 2 dias' },
  ]);

  // Carregar configurações iniciais
  useEffect(() => {
    async function loadConfigs() {
      try {
        const response = await api.get('/tenants/me');
        const tenant = response.data.tenant;
        if (tenant) {
          setConfigs({
            osAberta: !!tenant.conf_whatsapp_os_aberta,
            osPronta: !!tenant.conf_whatsapp_os_pronta,
            nps: !!tenant.conf_whatsapp_nps,
            revisao: !!tenant.conf_whatsapp_revisao,
          });
        }
      } catch (error) {
        console.error('Erro ao carregar configs:', error);
      }
    }
    loadConfigs();
  }, []);

  const toggleConfig = async (key: keyof typeof configs) => {
    const newValue = !configs[key];
    
    // Mapeamento para o backend (camelCase -> snake_case)
    const apiKeyMap: Record<string, string> = {
      osAberta: 'os_aberta',
      osPronta: 'os_pronta',
      nps: 'nps',
      revisao: 'revisao'
    };

    // Otimista: atualiza UI primeiro
    setConfigs(prev => ({ ...prev, [key]: newValue }));

    try {
      await api.patch('/tenants/whatsapp/status', {
        [apiKeyMap[key]]: newValue
      });
      toast.success('Configuração atualizada!');
    } catch (error) {
      // Reverte em caso de erro
      setConfigs(prev => ({ ...prev, [key]: !newValue }));
      toast.error('Erro ao salvar configuração');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-emerald-500 p-3 rounded-2xl shadow-lg shadow-emerald-500/30">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900">Mensageria Meta</h1>
            </div>
            <p className="text-slate-500 font-medium">WhatsApp WAHA API e Disparos em Fila via BullMQ</p>
          </div>
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-xl shadow-emerald-500/20 transition-all font-bold flex items-center gap-2">
            + Nova Mensagem Manual
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Automações */}
          <div className="lg:col-span-1 space-y-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Automações Ativas</h2>
            <div className="bg-white border text-sm border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800">Criação de O.S</h3>
                  <p className="text-slate-500 text-xs mt-1">"Olá João, recebemos seu veículo..."</p>
                </div>
                <button onClick={() => toggleConfig('osAberta')} className={`w-14 h-8 rounded-full transition-colors relative ${configs.osAberta ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform ${configs.osAberta ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800">O.S Pronta</h3>
                  <p className="text-slate-500 text-xs mt-1">"Seu veículo está pronto! Acesse: URL..."</p>
                </div>
                <button onClick={() => toggleConfig('osPronta')} className={`w-14 h-8 rounded-full transition-colors relative ${configs.osPronta ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform ${configs.osPronta ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800">Pesquisa NPS (24h)</h3>
                  <p className="text-slate-500 text-xs mt-1">"Como foi o serviço? Nota de 0 a 10..."</p>
                </div>
                <button onClick={() => toggleConfig('nps')} className={`w-14 h-8 rounded-full transition-colors relative ${configs.nps ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform ${configs.nps ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800">Revisão por KM</h3>
                  <p className="text-slate-500 text-xs mt-1">Alerta se a KM for atingida (Cron)</p>
                </div>
                <button onClick={() => toggleConfig('revisao')} className={`w-14 h-8 rounded-full transition-colors relative ${configs.revisao ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform ${configs.revisao ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>

            </div>
          </div>

          {/* Log de Disparos */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800 mb-6">Log de Disparos (LGPD)</h2>
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                    <th className="p-4 font-semibold uppercase tracking-wider">Gatilho</th>
                    <th className="p-4 font-semibold uppercase tracking-wider">Destinatário Máscara</th>
                    <th className="p-4 font-semibold uppercase tracking-wider">Status</th>
                    <th className="p-4 font-semibold uppercase tracking-wider">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg uppercase tracking-widest">{log.tipo}</span>
                      </td>
                      <td className="p-4 font-bold text-slate-700 tracking-widest">
                        {log.destinatario}
                      </td>
                      <td className="p-4">
                        {log.status === 'enviado' ? (
                          <span className="flex items-center gap-2 text-sm font-bold text-emerald-600">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Enviado
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-sm font-bold text-red-600">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span> Falha WAHA
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-slate-500 font-medium">
                        {log.data}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-slate-400 font-medium">Nenhum log registrado ainda.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
