'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { 
  Clock, 
  Car, 
  Wrench, 
  CheckCircle2, 
  AlertCircle,
  Timer
} from 'lucide-react';

// Using a custom axios instance for public routes to avoid auth interceptors
const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL
});

interface OS {
  id: string;
  status: 'aberta' | 'em_andamento' | 'aguardando_peca' | 'pronta';
  created_at: string;
  placa: string;
  modelo: string;
  marca: string;
  mecanico_nome: string | null;
}

export default function PublicTVPage() {
  const { tenantSlug } = useParams();
  const [ordens, setOrdens] = useState<OS[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const fetchData = async () => {
    try {
      const { data } = await publicApi.get(`/tv/public/patio/${tenantSlug}`);
      setOrdens(data.ordens);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Erro ao carregar dados da TV:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      fetchData();
      const interval = setInterval(fetchData, 30000); // 30s refresh
      return () => clearInterval(interval);
    }
  }, [isMounted, tenantSlug]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pronta':
        return { 
          label: 'PRONTA', 
          color: 'bg-emerald-500', 
          text: 'text-emerald-500', 
          icon: <CheckCircle2 className="w-8 h-8" /> 
        };
      case 'em_andamento':
        return { 
          label: 'EM EXECUÇÃO', 
          color: 'bg-blue-500', 
          text: 'text-blue-500', 
          icon: <Wrench className="w-8 h-8 animate-pulse" /> 
        };
      case 'aguardando_peca':
        return { 
          label: 'AGUARD. PEÇA', 
          color: 'bg-amber-500', 
          text: 'text-amber-500', 
          icon: <Clock className="w-8 h-8" /> 
        };
      default:
        return { 
          label: 'AGUARDANDO', 
          color: 'bg-slate-500', 
          text: 'text-slate-500', 
          icon: <AlertCircle className="w-8 h-8" /> 
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-blue-500 font-bold tracking-widest animate-pulse">CARREGANDO MONITOR...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f18] text-white p-8 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-12 border-b border-slate-800 pb-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
            <Car className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Status do Pátio</h1>
            <p className="text-slate-500 font-bold flex items-center gap-2">
              <Clock className="w-4 h-4" /> ATUALIZADO EM {lastUpdate ? lastUpdate.toLocaleTimeString() : '--:--:--'}
            </p>
          </div>
        </div>

        <div className="flex gap-8">
          <div className="text-center px-8 border-r border-slate-800">
            <p className="text-4xl font-black text-emerald-500">{ordens.filter(o => o.status === 'pronta').length}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Prontas</p>
          </div>
          <div className="text-center px-8">
            <p className="text-4xl font-black text-blue-500">{ordens.filter(o => o.status === 'em_andamento').length}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Em Serviço</p>
          </div>
        </div>
      </div>

      {/* Grid de Veículos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {ordens.map((os) => {
          const config = getStatusConfig(os.status);
          
          return (
            <div 
              key={os.id} 
              className={`bg-slate-900/40 border-2 ${os.status === 'pronta' ? 'border-emerald-500/50 shadow-emerald-500/5 shadow-2xl' : 'border-slate-800'} rounded-[32px] p-8 relative overflow-hidden group transition-all duration-500 hover:scale-[1.02]`}
            >
              {/* Overlay suave para status prontos */}
              {os.status === 'pronta' && (
                <div className="absolute inset-0 bg-emerald-500/5 animate-pulse pointer-events-none" />
              )}

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="bg-slate-950 px-6 py-2 rounded-xl border border-slate-700 shadow-xl group-hover:border-slate-500 transition-colors">
                  <p className="text-2xl font-black tracking-widest text-slate-200">{os.placa.toUpperCase()}</p>
                </div>
                <div className={config.text}>
                  {config.icon}
                </div>
              </div>

              <div className="space-y-4 mb-8 relative z-10">
                <h3 className="text-3xl font-bold tracking-tight line-clamp-1">{os.modelo}</h3>
                <p className="text-slate-400 font-medium text-lg uppercase tracking-wide">{os.marca}</p>
              </div>

              <div className="border-t border-slate-800 pt-6 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Responsável</p>
                    <p className="font-bold text-slate-200">{os.mecanico_nome || 'A definir'}</p>
                  </div>
                </div>
                
                <div className={`px-4 py-2 rounded-lg font-black text-xs tracking-tighter ${config.color} text-white shadow-lg`}>
                  {config.label}
                </div>
              </div>

              {/* Tempo decorrido (exemplo visual) */}
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Timer className="w-24 h-24" />
              </div>
            </div>
          );
        })}

        {ordens.length === 0 && (
          <div className="col-span-full py-32 text-center">
            <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-800">
              <Car className="w-12 h-12 text-slate-700" />
            </div>
            <h2 className="text-2xl font-bold text-slate-500 tracking-tight">NENHUMA ORDEM NO PÁTIO</h2>
            <p className="text-slate-600 mt-2 font-medium uppercase text-sm tracking-widest">As novas ordens aparecerão aqui automaticamente</p>
          </div>
        )}
      </div>

      {/* Footer / Brand */}
      <div className="fixed bottom-8 right-8 flex items-center gap-3 px-6 py-3 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
        <span className="text-sm font-black tracking-widest text-slate-400">AUTOSYNC <span className="text-blue-500">SYSTEM</span></span>
      </div>
    </div>
  );
}
