'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { 
  Wrench, Plus, Loader2, Search, X, 
  ChevronRight, Calendar, User, Car, 
  CheckCircle2, Clock, AlertCircle, 
  DollarSign, Package, Settings, Save, ArrowRight,
  TrendingUp, UserCheck
} from 'lucide-react';
import { toast } from 'sonner';
import NewOSModal from '@/components/modals/NewOSModal';

type OS = {
  id: string;
  veiculo_id: string;
  mecanico_id: string;
  status: 'aberta' | 'em_andamento' | 'aguardando_peca' | 'pronta' | 'fechada' | 'cancelada';
  descricao: string;
  valor_total: number;
  km_entrada: number;
  created_at: string;
  placa: string;
  modelo: string;
  marca: string;
  mecanico_nome?: string;
  total_geral?: number;
};

type Client = { id: string; nome: string };
type Vehicle = { id: string; placa: string; modelo: string; marca: string };
type Mecanico = { id: string; nome: string; especialidade: string };

export default function OSPage() {
  const router = useRouter();
  const [ordens, setOrdens] = useState<OS[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [showNewOS, setShowNewOS] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('acao') === 'novo') {
        setShowNewOS(true);
      }
    }
  }, []);

  const fetchOS = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/os');
      setOrdens(data.ordens);
    } catch (_err) {
      toast.error('Erro ao carregar ordens de serviço');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOS();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberta': return 'bg-[#1e3a5f] text-white';
      case 'em_andamento': return 'bg-[#7c3a00] text-white';
      case 'pronta': return 'bg-[#14532d] text-white';
      case 'fechada': return 'bg-[#374151] text-white';
      case 'cancelada': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const filteredOrdens = ordens.filter(o => 
    o.placa.toLowerCase().includes(search.toLowerCase()) || 
    o.modelo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Operacional</h1>
          <p className="text-slate-500 mt-1">Gestão de Ordens de Serviço e Pátio.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              placeholder="Buscar placa ou modelo..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowNewOS(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-xl shadow-indigo-100 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" /> Abrir Nova O.S.
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && (
          <div className="col-span-full py-20 text-center">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500 mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Sincronizando pátio...</p>
          </div>
        )}

        {filteredOrdens.map(os => (
          <div 
            key={os.id} 
            onClick={() => router.push(`/os/${os.id}`)}
            className="group bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${getStatusColor(os.status)}`}>
                {os.status.replace('_', ' ')}
              </span>
              <p className="text-[10px] text-slate-300 font-bold">#{os.id.split('-')[0].toUpperCase()}</p>
            </div>

            <div className="space-y-1 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-slate-900 text-white font-mono font-black px-3 py-1 rounded-md text-lg shadow-sm uppercase">{os.placa}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-tight">{os.marca} {os.modelo}</h3>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 border border-slate-200">
                  {os.mecanico_nome ? os.mecanico_nome[0] : '?'}
                </div>
                <p className="text-xs text-slate-600 font-bold">{os.mecanico_nome || 'A definir'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total</p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter">
                  R$ {(Number(os.total_geral) || Number(os.valor_total) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Deco background */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-3xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
        ))}

        {!isLoading && filteredOrdens.length === 0 && (
          <div className="col-span-full bg-white border-2 border-dashed border-slate-200 rounded-[40px] p-20 text-center">
            <Wrench className="w-16 h-16 mx-auto mb-6 text-slate-200" />
            <h3 className="text-xl font-black text-slate-900">Nenhum atendimento em curso</h3>
            <p className="text-slate-500 mt-2">Clique em "Abrir Nova O.S." para começar um atendimento agora.</p>
          </div>
        )}
      </div>

      <NewOSModal 
        isOpen={showNewOS} 
        onClose={() => setShowNewOS(false)} 
        onSuccess={fetchOS} 
      />

      {/* Styles for scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
