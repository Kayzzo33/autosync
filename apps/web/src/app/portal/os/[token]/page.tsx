'use client';

import { useEffect, useState } from 'react';

type OrdemPublica = {
  id: string;
  status: string;
  valor_estimado: string;
  placa: string;
  modelo: string;
  marca: string;
  oficina_nome: string;
  servicos: { nome: string; valor: string }[];
};

export default function PortalClienteOS({ params }: { params: { token: string } }) {
  const [os, setOs] = useState<OrdemPublica | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPortal = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/operacional/os/portal/${params.token}`);
        if (!res.ok) {
          setError('Ordem de serviço não encontrada ou link inválido.');
          return;
        }
        const data = await res.json();
        setOs(data.ordem);
      } catch(err) {
        setError('Falha de conexão.');
      } finally {
        setLoading(false);
      }
    };
    fetchPortal();
  }, [params.token]);

  if (loading) return <div className="min-h-screen text-white bg-slate-900 flex justify-center items-center font-sans tracking-wide text-2xl">Carregando portal...</div>;
  if (error || !os) return <div className="min-h-screen text-white bg-slate-900 flex justify-center items-center font-sans text-xl">{error}</div>;

  const StatusBandeja = () => {
    const isAtivo = (estado: string) => os.status === estado;

    return (
      <div className="w-full bg-slate-800 p-2 md:p-6 rounded-3xl mt-8 mb-12 shadow-inner border border-slate-700/50">
        <h3 className="text-xl md:text-2xl font-light text-slate-400 mb-8 px-4">Progresso do Serviço</h3>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative">
          
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-slate-700 -z-10 transform -translate-y-1/2"></div>

          <div className={`flex flex-col items-center gap-3 w-full md:w-auto bg-slate-800 p-2 rounded-xl transition-all ${isAtivo('aberta') ? 'opacity-100 scale-110' : 'opacity-40'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${isAtivo('aberta') ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50' : 'bg-slate-700 text-slate-400'}`}>1</div>
            <span className="text-sm font-medium tracking-wider uppercase">Diagnóstico</span>
          </div>

          <div className={`flex flex-col items-center gap-3 w-full md:w-auto bg-slate-800 p-2 rounded-xl transition-all ${isAtivo('em_andamento') || isAtivo('aguardando_peca') ? 'opacity-100 scale-110' : 'opacity-40'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${isAtivo('em_andamento') ? 'bg-yellow-500 text-slate-900 shadow-lg shadow-yellow-500/50' : isAtivo('aguardando_peca') ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-400'}`}>2</div>
            <span className="text-sm font-medium tracking-wider uppercase text-center">Oficina <br/><span className="text-xs text-slate-500">{isAtivo('aguardando_peca') ? '(Peça pendente)' : ''}</span></span>
          </div>

          <div className={`flex flex-col items-center gap-3 w-full md:w-auto bg-slate-800 p-2 rounded-xl transition-all ${isAtivo('pronta') || isAtivo('fechada') ? 'opacity-100 scale-110' : 'opacity-40'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${(isAtivo('pronta') || isAtivo('fechada')) ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50' : 'bg-slate-700 text-slate-400'}`}>3</div>
            <span className="text-sm font-medium tracking-wider uppercase">Liberado</span>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8 lg:p-16">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-white mb-2">{os.oficina_nome}</h1>
            <p className="text-slate-500 text-lg md:text-xl font-light">Portal de Acompanhamento</p>
          </div>
          <div className="mt-6 md:mt-0 px-6 py-3 bg-slate-800 rounded-2xl border border-slate-700/50 flex flex-col items-end">
            <span className="text-slate-400 text-sm font-semibold tracking-widest uppercase mb-1">Veículo</span>
            <span className="text-2xl font-bold tracking-widest text-white">{os.placa}</span>
            <span className="text-sm text-slate-500">{os.marca} {os.modelo}</span>
          </div>
        </header>

        <StatusBandeja />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-light text-white mb-6 tracking-tight">Detalhamento de Serviços</h2>
            {os.servicos.length > 0 ? (
              <ul className="space-y-4">
                {os.servicos.map((s, idx) => (
                  <li key={idx} className="flex justify-between items-center py-4 border-b border-slate-800/50 last:border-0">
                    <span className="text-lg text-slate-300 font-medium">{s.nome}</span>
                    <span className="text-lg text-emerald-400 font-mono tracking-widest">R$ {Number(s.valor).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
                O orçamento detalhado ainda não foi inserido pelos mecânicos.
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-blue-900 to-slate-900 border border-blue-800/50 rounded-3xl p-8 shadow-2xl flex flex-col justify-center relative overflow-hidden">
             <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl"></div>
             
             <span className="text-blue-300/80 uppercase tracking-widest font-bold text-sm mb-4">Valor Estimado</span>
             <span className="text-5xl font-black text-white tracking-tighter shadow-sm mb-4">R$ {parseFloat(os.valor_estimado as any || 0).toFixed(2)}</span>
             
             <p className="text-blue-200/60 text-sm mt-4 leading-relaxed font-light">
               * O valor final pode sofrer leves alterações dependendo do diagnóstico mecânico final.
             </p>
          </div>
        </div>

      </div>
    </div>
  );
}
