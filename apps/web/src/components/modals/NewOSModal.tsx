'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { X, Search, ChevronRight, Car, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Client = { id: string; nome: string };
type Vehicle = { id: string; placa: string; modelo: string; marca: string };
type Mecanico = { id: string; nome: string; especialidade: string };

type NewOSModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function NewOSModal({ isOpen, onClose, onSuccess }: NewOSModalProps) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([]);
  const [step, setStep] = useState(1);
  const [isCreatingOS, setIsCreatingOS] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  const [formData, setFormData] = useState({
    clientId: '',
    vehicleId: '',
    mecanicoId: '',
    descricao: '',
    kmEntrada: 0
  });

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData({ clientId: '', vehicleId: '', mecanicoId: '', descricao: '', kmEntrada: 0 });
      fetchClientsAndMecanicos();
    }
  }, [isOpen]);

  const fetchClientsAndMecanicos = async () => {
    setIsLoadingData(true);
    try {
      const [clientsRes, mecanicosRes] = await Promise.all([
        api.get('/comercial/clientes'),
        api.get('/mecanicos').catch(() => ({ data: { mecanicos: [] } }))
      ]);
      setClients(clientsRes.data.clientes || []);
      setMecanicos((mecanicosRes.data.mecanicos || []).filter((m: any) => m.ativo));
    } catch (err) {
      toast.error('Erro ao carregar dados iniciais');
    } finally {
      setIsLoadingData(false);
    }
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
      onClose();
      if (onSuccess) onSuccess();
      router.push(`/os/${data.os.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao abrir OS');
    } finally {
      setIsCreatingOS(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Stepper Header */}
        <div className="bg-slate-50 px-10 py-8 border-b border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-900 text-2xl tracking-tighter">Abertura de O.S.</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
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
          {isLoadingData && step === 1 ? (
             <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
          ) : (
            <>
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
                    {clients.length === 0 && (
                      <div className="text-center py-6">
                        <p className="text-slate-500 font-bold">Nenhum cliente encontrado.</p>
                      </div>
                    )}
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
                  <h4 className="text-xl font-black text-slate-900">Quem será o mecânico?</h4>
                  <div className="grid grid-cols-2 gap-4">
                      <button 
                          onClick={() => { setFormData(prev => ({ ...prev, mecanicoId: '' })); setStep(4); }}
                          className={`p-5 rounded-[24px] border transition-all text-center ${!formData.mecanicoId ? 'border-indigo-600 bg-indigo-50 shadow-md ring-2 ring-indigo-200' : 'border-slate-200 hover:border-indigo-300'}`}
                      >
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100 font-bold text-slate-400">?</div>
                          <p className="font-black text-slate-900">A Definir</p>
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Designar depois</p>
                      </button>
                      {mecanicos.map(m => (
                          <button 
                              key={m.id}
                              onClick={() => { setFormData(prev => ({ ...prev, mecanicoId: m.id })); setStep(4); }}
                              className={`p-5 rounded-[24px] border transition-all text-center ${formData.mecanicoId === m.id ? 'border-indigo-600 bg-indigo-50 shadow-md ring-2 ring-indigo-200' : 'border-slate-200 hover:border-indigo-300'}`}
                          >
                              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100 font-black text-indigo-600">{m.nome[0]}</div>
                              <p className="font-black text-slate-900">{m.nome.split(' ')[0]}</p>
                              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">{m.especialidade || 'Mecânico'}</p>
                          </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Passo 4: Detalhes Finais */}
              {step === 4 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <h4 className="text-xl font-black text-slate-900">Detalhes Iniciais</h4>
                  
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Sintoma / Relato do Cliente</label>
                    <textarea 
                      placeholder="O que está acontecendo com o veículo?"
                      value={formData.descricao}
                      onChange={e => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                      rows={3}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[24px] focus:ring-4 focus:ring-indigo-100 outline-none transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">KM Atual (Opcional)</label>
                    <input 
                      type="number"
                      placeholder="Ex: 54000"
                      value={formData.kmEntrada || ''}
                      onChange={e => setFormData(prev => ({ ...prev, kmEntrada: parseInt(e.target.value) || 0 }))}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[20px] focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-mono text-lg"
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                      <button onClick={() => setStep(3)} className="px-6 py-4 rounded-[20px] border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors">Voltar</button>
                      <button 
                          disabled={isCreatingOS}
                          onClick={handleCreateOS} 
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[20px] font-black text-lg shadow-xl shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                          {isCreatingOS ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Abertura'}
                      </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
