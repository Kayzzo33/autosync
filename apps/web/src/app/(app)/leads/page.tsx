'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../../services/api';
import { UserPlus, Save, Loader2, Search, Target, CheckCircle2, TrendingUp, Filter } from 'lucide-react';
import { toast } from 'sonner';
import NewLeadModal from '@/components/modals/NewLeadModal';

type Lead = {
  id: string;
  nome: string;
  telefone: string;
  status: 'novo' | 'em_contato' | 'orcamento_feito' | 'convertido' | 'perdido';
  created_at: string;
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create state
  const [isCreating, setIsCreating] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [origem, setOrigem] = useState('organico');
  
  // Conversion state
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const fetchLeads = async () => {
    try {
      const { data } = await api.get('/comercial/leads');
      setLeads(data.leads);
    } catch (err) {
      toast.error('Erro ao carregar leads');
    } finally {
      setIsLoading(false);
    }
  };

  const searchParams = useSearchParams();
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    if (searchParams.get('acao') === 'novo') {
      setShowNewLeadModal(true);
    }
  }, [searchParams]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await api.post('/comercial/leads', { nome, telefone, origem });
      toast.success('Lead capturado com sucesso!');
      setNome('');
      setTelefone('');
      fetchLeads();
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erro ao criar lead';
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleConvert = async () => {
    if (!leadToConvert) return;
    setIsConverting(true);
    try {
      await api.post(`/comercial/leads/${leadToConvert.id}/converter`);
      toast.success('Lead convertido em cliente com sucesso!');
      setShowConvertModal(false);
      fetchLeads();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao converter lead');
    } finally {
      setIsConverting(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
        case 'novo': return 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
        case 'convertido': return 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
        case 'perdido': return 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20';
        default: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Funil de Leads</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Transforme interessados em clientes ativos da sua oficina.</p>
        </div>
        
        <div className="flex items-center gap-2">
            <div className="px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm text-sm font-bold flex items-center gap-2 dark:text-slate-300">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Conversão: {leads.length > 0 ? Math.round((leads.filter(l => l.status === 'convertido').length / leads.length) * 100) : 0}%
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Formulário de Captura */}
        <div className="lg:col-span-1 border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0a0a0a] p-8 rounded-[32px] shadow-xl shadow-slate-100 dark:shadow-none h-fit">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
                <h2 className="text-lg font-black text-slate-800 dark:text-white leading-none">Captura</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mt-1">Entrada Manual</p>
            </div>
          </div>
          
          <form className="space-y-5" onSubmit={handleCreate}>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">Nome do Lead</label>
              <input 
                required 
                type="text" 
                placeholder="Ex: João da Silva"
                value={nome} 
                onChange={e => setNome(e.target.value)} 
                className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">WhatsApp</label>
              <input 
                required 
                type="text" 
                placeholder="(00) 00000-0000"
                value={telefone} 
                onChange={e => setTelefone(e.target.value)} 
                className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">Canal de Origem</label>
              <select 
                value={origem}
                onChange={e => setOrigem(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-600 dark:text-slate-300 text-sm"
              >
                <option value="organico">Orgânico</option>
                <option value="google">Google Ads</option>
                <option value="instagram">Instagram</option>
                <option value="indicacao">Indicação</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <button 
                disabled={isCreating} 
                type="submit" 
                className="w-full group relative overflow-hidden bg-slate-900 dark:bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              <div className="flex items-center justify-center gap-2">
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 transition-transform group-hover:scale-110" />}
                Cadastrar Lead
              </div>
            </button>
          </form>
        </div>

        {/* Quadro Kanban/Lista de Leads */}
        <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-600">
                    <Filter className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-widest">Todos os Contatos</span>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-700" />
                    <input type="text" placeholder="Filtrar leads..." className="pl-10 pr-4 py-2 border border-slate-200 dark:border-white/5 bg-white dark:bg-white/5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoading && Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-32 bg-slate-50 dark:bg-white/5 rounded-[28px] animate-pulse border border-slate-100 dark:border-white/5" />
                ))}

                {!isLoading && leads.length === 0 && (
                    <div className="col-span-full py-20 bg-slate-50 dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[32px] text-center">
                        <Target className="w-12 h-12 mx-auto mb-4 text-slate-200 dark:text-slate-800" />
                        <p className="font-bold text-slate-400 dark:text-slate-700 uppercase tracking-widest text-xs">Aguardando primeiros leads...</p>
                    </div>
                )}
                
                {leads.map((lead) => (
                    <div key={lead.id} className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 p-6 rounded-[32px] shadow-sm hover:shadow-xl dark:hover:border-blue-500/30 transition-all group overflow-hidden relative">
                    <div className="flex items-start justify-between relative z-10">
                        <div className="space-y-1">
                        <div className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter border ${getStatusStyle(lead.status)}`}>
                            {lead.status.replace('_', ' ')}
                        </div>
                        <p className="font-black text-slate-900 dark:text-white text-lg tracking-tight leading-tight">{lead.nome}</p>
                        <p className="text-slate-500 dark:text-slate-500 font-mono text-xs">{lead.telefone}</p>
                        </div>
                        
                        {lead.status !== 'convertido' ? (
                            <button 
                                onClick={() => {
                                    setLeadToConvert(lead);
                                    setShowConvertModal(true);
                                }}
                                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-100 dark:shadow-none transition-all active:scale-95"
                            >
                                <span className="text-sm font-bold">Converter em Cliente</span>
                            </button>
                        ) : (
                            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                        )}
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase">Entrou em {new Date(lead.created_at).toLocaleDateString()}</span>
                        {lead.status === 'convertido' && (
                            <span className="text-[10px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-widest">Atendimento Ativo</span>
                        )}
                    </div>

                    {/* Background Decorative Gradient (Fixed) */}
                    <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none" />
                    </div>
                ))}
            </div>
        </div>
      </div>

      {showConvertModal && leadToConvert && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto rotate-12 shadow-lg shadow-emerald-50">
                <Target className="w-10 h-10" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Converter Lead?</h3>
                <p className="text-slate-500 text-base leading-relaxed">
                  Você está prestes a transformar <b>{leadToConvert.nome}</b> em um cliente oficial da sua base.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dados de Origem</p>
                <p className="text-sm font-bold text-slate-700">{leadToConvert.telefone}</p>
              </div>

              <div className="flex gap-3">
                <button 
                  disabled={isConverting}
                  onClick={() => setShowConvertModal(false)} 
                  className="flex-1 py-4 border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  disabled={isConverting}
                  onClick={handleConvert} 
                  className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isConverting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <NewLeadModal 
        isOpen={showNewLeadModal} 
        onClose={() => setShowNewLeadModal(false)} 
        onSuccess={fetchLeads} 
      />
    </div>
  );
}
