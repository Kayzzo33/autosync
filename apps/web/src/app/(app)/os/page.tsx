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
  
  // New OS States
  const [showNewOS, setShowNewOS] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([]);
  const [step, setStep] = useState(1);
  const [isCreatingOS, setIsCreatingOS] = useState(false);
  
  const [formData, setFormData] = useState({
    clientId: '',
    vehicleId: '',
    mecanicoId: '',
    descricao: '',
    kmEntrada: 0
  });

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

  const fetchClients = async () => {
    const { data } = await api.get('/comercial/clientes');
    setClients(data.clientes);
  };

  const fetchVehiclesByClient = async (clientId: string) => {
    try {
      const { data } = await api.get(`/comercial/veiculos?cliente_id=${clientId}`);
      setVehicles(data.veiculos || []);
    } catch {
      setVehicles([]);
      toast.error('Erro ao carregar veículos');
    }
  };

  const fetchMecanicos = async () => {
    try {
      const { data } = await api.get('/mecanicos');
      setMecanicos(data.mecanicos.filter((m: any) => m.ativo));
    } catch {
      setMecanicos([]);
    }
  };

  useEffect(() => {
    fetchOS();
  }, []);

  const handleCreateOS = async () => {
    setIsCreatingOS(true);
    try {
      const { data } = await api.post('/os', {
        veiculo_id: formData.vehicleId,
        mecanico_id: formData.mecanicoId,
        descricao: formData.descricao,
        km_entrada: formData.kmEntrada
      });
      toast.success('OS criada com sucesso!');
      setShowNewOS(false);
      setStep(1);
      setFormData({ clientId: '', vehicleId: '', mecanicoId: '', descricao: '', kmEntrada: 0 });
      router.push(`/os/${data.os.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao abrir OS');
    } finally {
      setIsCreatingOS(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberta': return 'bg-slate-100 text-slate-700';
      case 'em_andamento': return 'bg-indigo-100 text-indigo-700';
      case 'pronta': return 'bg-emerald-100 text-emerald-700';
      case 'fechada': return 'bg-blue-100 text-blue-700';
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
            onClick={() => { setShowNewOS(true); fetchClients(); fetchMecanicos(); }}
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
              <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{os.modelo}</h3>
              <div className="flex items-center gap-3">
                <span className="bg-slate-900 text-white font-mono font-bold px-2 py-0.5 rounded text-[10px] shadow-sm uppercase">{os.placa}</span>
                <span className="text-xs text-slate-400 font-bold uppercase">{os.marca}</span>
              </div>
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
                <p className="text-lg font-black text-slate-900 tracking-tighter">
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

      {/* Modal Nova OS: 4 Passos */}
      {showNewOS && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
             {/* Stepper Header */}
             <div className="bg-slate-50 px-10 py-8 border-b border-slate-200">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-black text-slate-900 text-2xl tracking-tighter">Abertura de O.S.</h3>
                  <button onClick={() => { setShowNewOS(false); setStep(1); }} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                   {[1, 2, 3, 4].map(s => (
                     <React.Fragment key={s}>
                       <div className={`h-2 rounded-full flex-1 transition-all duration-500 ${step >= s ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                     </React.Fragment>
                   ))}
                </div>
                <div className="flex justify-between mt-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span className={step === 1 ? 'text-indigo-600' : ''}>Cliente</span>
                  <span className={step === 2 ? 'text-indigo-600' : ''}>Veículo</span>
                  <span className={step === 3 ? 'text-indigo-600' : ''}>Mecânico</span>
                  <span className={step === 4 ? 'text-indigo-600' : ''}>Finalizar</span>
                </div>
             </div>

             <div className="p-10">
                {/* Passo 1: Cliente */}
                {step === 1 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        placeholder="Pesquisar cliente..."
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[20px] outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold"
                      />
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {clients.map(c => (
                        <button 
                          key={c.id}
                          onClick={() => { setFormData(prev => ({ ...prev, clientId: c.id })); fetchVehiclesByClient(c.id); setStep(2); }}
                          className={`w-full flex items-center justify-between p-5 rounded-[20px] border transition-all hover:border-indigo-300 hover:bg-indigo-50/30 ${formData.clientId === c.id ? 'border-indigo-600 bg-indigo-50 shadow-md ring-2 ring-indigo-200' : 'border-slate-100'}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-500">{c.nome[0]}</div>
                            <span className="font-bold text-slate-800 text-lg">{c.nome}</span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Passo 2: Veículo */}
                {step === 2 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <h4 className="text-xl font-black text-slate-900">Qual veículo do cliente?</h4>
                    <div className="grid grid-cols-1 gap-4">
                        {vehicles.map(v => (
                            <button 
                                key={v.id}
                                onClick={() => { setFormData(prev => ({ ...prev, vehicleId: v.id })); setStep(3); }}
                                className={`p-6 rounded-[24px] border transition-all text-left flex items-center justify-between group ${formData.vehicleId === v.id ? 'border-indigo-600 bg-indigo-50 shadow-md ring-2 ring-indigo-200' : 'border-slate-200 hover:border-indigo-300'}`}
                            >
                                <div>
                                  <p className="font-black text-slate-900 text-xl tracking-tighter group-hover:text-indigo-600">{v.placa}</p>
                                  <p className="text-xs text-slate-400 uppercase font-black tracking-widest">{v.marca} {v.modelo}</p>
                                </div>
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100"><Car className="w-5 h-5 text-indigo-500" /></div>
                            </button>
                        ))}
                        {vehicles.length === 0 && (
                          <div className="text-center py-10">
                            <AlertCircle className="w-10 h-10 mx-auto mb-4 text-amber-500" />
                            <p className="font-bold text-slate-600">Este cliente não tem veículos.</p>
                            <button onClick={() => setStep(1)} className="text-indigo-600 font-bold mt-2">Escolher outro cliente</button>
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {/* Passo 3: Mecânico */}
                {step === 3 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <h4 className="text-xl font-black text-slate-900">Designar Mecânico Responsável</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {mecanicos.map(m => (
                        <button 
                          key={m.id}
                          onClick={() => { setFormData(prev => ({ ...prev, mecanicoId: m.id })); setStep(4); }}
                          className={`p-5 rounded-[20px] border transition-all flex items-center gap-4 ${formData.mecanicoId === m.id ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 hover:bg-slate-50'}`}
                        >
                          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-black">
                            {m.nome[0].toUpperCase()}
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-slate-900">{m.nome}</p>
                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{m.especialidade || 'Geral'}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setStep(4)} className="w-full text-slate-400 text-xs font-bold py-2">Pular designação por enquanto</button>
                  </div>
                )}

                {/* Passo 4: Detalhes Finais */}
                {step === 4 && (
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sintomas e Observações</label>
                        <textarea 
                            rows={3}
                            placeholder="Descreva o que o cliente relatou..."
                            style={{ resize: 'none' }}
                            value={formData.descricao}
                            onChange={e => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                            className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[24px] focus:ring-4 focus:ring-indigo-100 outline-none text-sm font-medium text-slate-700 transition-all placeholder:text-slate-300"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KM de Entrada</label>
                        <input 
                            type="number"
                            value={formData.kmEntrada}
                            onChange={e => setFormData(prev => ({ ...prev, kmEntrada: parseInt(e.target.value) }))}
                            className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none text-2xl font-black text-slate-900 transition-all font-mono"
                        />
                      </div>
                      <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 flex flex-col justify-center">
                        <p className="text-[10px] font-black text-amber-600 uppercase mb-1">Dica de Revisão</p>
                        <p className="text-xs text-amber-700 font-medium leading-tight">O sistema irá sugerir a próxima revisão com +5.000km.</p>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button 
                            onClick={() => setStep(3)}
                            className="flex-1 py-5 border border-slate-200 text-slate-600 rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all"
                        >
                            Voltar
                        </button>
                        <button 
                            onClick={handleCreateOS}
                            disabled={isCreatingOS || !formData.vehicleId}
                            className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-xs shadow-2xl shadow-indigo-200 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isCreatingOS ? <Loader2 className="w-5 h-5 animate-spin"/> : <><Save className="w-5 h-5" /> Abrir Atendimento</>}
                        </button>
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

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
