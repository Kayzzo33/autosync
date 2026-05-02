'use client';

import { useEffect, useState } from 'react';
import { 
  Users, Clock, Car, ChevronRight, 
  AlertCircle, CheckCircle, RefreshCcw, Monitor
} from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

type StatusEnum = 'aberta' | 'em_andamento' | 'pronta' | 'aguardando_peca';

interface KanbanOS {
  id: string;
  status: StatusEnum;
  placa: string;
  modelo: string;
  marca: string;
  cliente_nome: string;
  mecanico_nome: string;
  created_at: string;
}

export default function PatioDashboard() {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const [board, setBoard] = useState<KanbanOS[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const fetchBoard = async () => {
    if (!user?.tenant_id) {
       console.log('[PATIO] Tentando carregar, mas tenant_id está ausente. User:', user);
       return;
    }
    
    try {
      console.log('[PATIO] Buscando ordens para tenant:', user.tenant_id);
      const { data } = await api.get(`/tv/ordens?tenant_id=${user.tenant_id}`);
      setBoard(data.ordens);
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('[PATIO] Erro ao carregar monitor de pátio:', err.response?.data || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && user?.tenant_id) {
      fetchBoard();
      const interval = setInterval(fetchBoard, 30000); // Atualiza a cada 30s
      return () => clearInterval(interval);
    }
  }, [isMounted, user?.tenant_id]);

  if (!isMounted || isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="font-black uppercase tracking-widest animate-pulse">Sincronizando Sessão...</span>
      </div>
    );
  }

  const StatusCol = ({ title, statusId, items, color }: { title: string, statusId: StatusEnum, items: KanbanOS[], color: string }) => (
    <div className="flex flex-col h-full bg-slate-100/50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm p-4 ring-1 ring-slate-200/50 dark:ring-white/5">
      <div className="flex items-center justify-between mb-6 px-2">
        <h3 className="font-black text-slate-800 dark:text-slate-200 text-sm uppercase tracking-widest flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${color}`}></div>
          {title}
        </h3>
        <span className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 text-[10px] font-black py-0.5 px-2.5 rounded-full shadow-sm">
          {items.length}
        </span>
      </div>
      
      <div className="flex-1 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
        {items.map(os => (
          <div key={os.id} className="bg-white dark:bg-[#0f0f0f] p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 hover:shadow-xl dark:hover:border-indigo-500/30 transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <span className="font-black text-slate-900 dark:text-white tracking-wider bg-slate-900 dark:bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px] font-mono shadow-md uppercase">
                {os.placa}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-tighter">#{os.id.split('-')[0]}</span>
            </div>
            
            <h4 className="text-slate-900 dark:text-white font-black text-lg leading-tight mb-1">{os.modelo}</h4>
            <p className="text-slate-500 dark:text-slate-500 text-xs font-bold uppercase tracking-tight mb-4">{os.marca} • {os.cliente_nome}</p>
            
            <div className="flex justify-between items-center pt-4 border-t border-slate-50 dark:border-white/5">
               <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs border border-indigo-100 dark:border-indigo-500/20 shadow-inner">
                   {os.mecanico_nome ? os.mecanico_nome[0].toUpperCase() : '?'}
                 </div>
                 <div>
                   <p className="text-[10px] text-slate-400 dark:text-slate-600 font-black uppercase leading-none">Técnico</p>
                   <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">{os.mecanico_nome || 'A definir'}</p>
                 </div>
               </div>
               
               <div className="text-right">
                  <p className="text-[10px] text-slate-400 dark:text-slate-600 font-black uppercase leading-none">Tempo</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />
                    {Math.floor((new Date().getTime() - new Date(os.created_at).getTime()) / 60000)}m
                  </p>
               </div>
            </div>

            {/* Subtle Gradient Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/20 dark:bg-indigo-500/5 rounded-full blur-2xl -z-10 group-hover:bg-indigo-50/40 dark:group-hover:bg-indigo-500/10 transition-all"></div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="h-40 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-3xl flex flex-col items-center justify-center text-slate-400 dark:text-slate-700 gap-2 opacity-60">
            <div className="w-10 h-10 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center">
              <Car className="w-5 h-5 text-slate-300 dark:text-slate-600" />
            </div>
            <span className="text-xs font-bold tracking-tight">Sem atividades</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-black flex flex-col gap-6 p-4 md:p-6 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white dark:bg-[#0a0a0a] p-6 rounded-[32px] border border-slate-200 dark:border-[#1a1a1a] shadow-xl shadow-slate-200/50 dark:shadow-none">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 dark:bg-indigo-600 rounded-[24px] flex items-center justify-center text-white shadow-2xl shadow-slate-900/20">
            <Monitor className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Monitor de Pátio</h1>
              <div className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-inner">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                Ao Vivo
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-bold text-lg">Visão operacional em tempo real da oficina.</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2 text-right">
          <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-white/5 px-3 py-1 rounded-full border border-slate-100 dark:border-white/10">
            Última atualização: {lastUpdate ? lastUpdate.toLocaleTimeString() : '--:--:--'}
          </div>
          <button 
            onClick={() => { setIsLoading(true); fetchBoard(); }}
            className="group flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-sm hover:text-indigo-800 transition-all"
          >
            <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            Atualizar Agora
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 flex-1">
        <StatusCol title="Aguardando" statusId="aberta" items={board.filter(i => i.status === 'aberta')} color="bg-slate-400" />
        <StatusCol title="Em Execução" statusId="em_andamento" items={board.filter(i => i.status === 'em_andamento')} color="bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
        <StatusCol title="Aguardando Peça" statusId="aguardando_peca" items={board.filter(i => i.status === 'aguardando_peca' as any)} color="bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
        <StatusCol title="Finalizado" statusId="pronta" items={board.filter(i => i.status === 'pronta')} color="bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
