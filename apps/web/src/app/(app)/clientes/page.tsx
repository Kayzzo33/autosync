'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/services/api';
import { Users, CarFront, Plus, Loader2, Search, X, ChevronDown, ChevronUp, Save, Clock, DollarSign, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import SendWhatsAppModal from '@/components/SendWhatsAppModal';
import NewClientModal from '@/components/modals/NewClientModal';

type Vehicle = {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  km_atual: number;
};

type Cliente = {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  created_at: string;
  veiculos?: Vehicle[];
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const searchParams = useSearchParams();
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  // Modal State
  const [showVehicleModal, setShowVehicleModal] = useState<string | null>(null); // clientId or null
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [whatsAppTarget, setWhatsAppTarget] = useState<{ id: string; nome: string; telefone: string } | null>(null);
  const [isSavingVehicle, setIsSavingVehicle] = useState(false);
  
  const [newVehicle, setNewVehicle] = useState({
    placa: '',
    marca: '',
    modelo: '',
    ano: new Date().getFullYear(),
    km_atual: 0
  });

  const fetchClientes = async () => {
    try {
      const { data } = await api.get(`/comercial/clientes${search ? `?q=${search}` : ''}`);
      setClientes(data.clientes);
    } catch (err) {
      toast.error('Erro ao carregar clientes');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVehicles = async (clientId: string) => {
    try {
      const { data } = await api.get(`/comercial/veiculos?cliente_id=${clientId}`);
      setClientes(prev => prev.map(c => c.id === clientId ? { ...c, veiculos: data.veiculos || [] } : c));
    } catch (err) {
      toast.error('Erro ao carregar veículos');
    }
  };

  const toggleExpand = (clientId: string) => {
    if (expandedClientId === clientId) {
      setExpandedClientId(null);
    } else {
      setExpandedClientId(clientId);
      const client = clientes.find(c => c.id === clientId);
      if (!client?.veiculos) {
        fetchVehicles(clientId);
      }
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showVehicleModal) return;

    setIsSavingVehicle(true);
    try {
      await api.post('/comercial/veiculos', {
        cliente_id: showVehicleModal,
        ...newVehicle
      });
      toast.success('Veículo cadastrado com sucesso!');
      fetchVehicles(showVehicleModal);
      setShowVehicleModal(null);
      setNewVehicle({ placa: '', marca: '', modelo: '', ano: new Date().getFullYear(), km_atual: 0 });
    } catch (err) {
      toast.error('Erro ao cadastrar veículo');
    } finally {
      setIsSavingVehicle(false);
    }
  };

  };

  useEffect(() => {
    fetchClientes();
  }, [search]);

  useEffect(() => {
    if (searchParams.get('acao') === 'novo') {
      setShowNewClientModal(true);
    }
  }, [searchParams]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Base de Clientes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gestão de contatos e histórico da oficina.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm dark:text-white"
            />
          </div>
          <button 
            onClick={() => setShowNewClientModal(true)}
            className="flex items-center gap-2 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" /> Novo Cliente
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-500 text-xs uppercase tracking-wider">
              <th className="p-4 font-bold">Cliente</th>
              <th className="p-4 font-bold">Contato</th>
              <th className="p-4 font-bold text-center">Veículos</th>
              <th className="p-4 font-bold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
            {isLoading && (
              <tr>
                <td colSpan={4} className="p-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <p>Carregando base de clientes...</p>
                  </div>
                </td>
              </tr>
            )}
            
            {!isLoading && clientes.length === 0 && (
              <tr>
                <td colSpan={4} className="p-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-3">
                    <p className="font-medium text-slate-600 dark:text-slate-400">Nenhum cliente encontrado ou erro na conexão.</p>
                    <button 
                      onClick={() => { setIsLoading(true); fetchClientes(); }}
                      className="text-blue-600 dark:text-blue-400 font-bold hover:underline py-2 px-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl"
                    >
                      Tentar Novamente
                    </button>
                    <p className="text-xs">Dica: Tente ajustar sua busca ou converter um Lead.</p>
                  </div>
                </td>
              </tr>
            )}
            
            {clientes.map((cli) => (
              <React.Fragment key={cli.id}>
                <tr className={`hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer ${expandedClientId === cli.id ? 'bg-blue-50/30 dark:bg-blue-500/10' : ''}`} onClick={() => toggleExpand(cli.id)}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
                        {cli.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white leading-none">{cli.nome}</p>
                        <p className="text-slate-400 dark:text-slate-600 text-xs mt-1">ID: {cli.id.split('-')[0]}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-slate-700 dark:text-slate-300 font-medium leading-none">{cli.telefone}</p>
                    {cli.email && <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">{cli.email}</p>}
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-full text-xs font-bold border border-slate-200 dark:border-white/5">
                      <CarFront className="w-3 h-3 text-blue-500" />
                      {cli.veiculos?.length ?? '...'}
                    </span>
                  </td>
                  <td className="p-4 text-right flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setWhatsAppTarget({ id: cli.id, nome: cli.nome, telefone: cli.telefone });
                      }}
                      title="Enviar mensagem via WhatsApp"
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#25D366] text-white rounded-lg text-xs font-bold hover:bg-[#1DA851] transition-colors shadow-sm"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.374 0 0 5.373 0 12c0 2.117.554 4.103 1.523 5.83L.057 23.246a.5.5 0 0 0 .632.612l5.588-1.43A11.94 11.94 0 0 0 12 24c6.626 0 12-5.373 12-12S18.626 0 12 0zm0 21.818a9.813 9.813 0 0 1-5.003-1.366l-.358-.214-3.719.952.983-3.614-.234-.371A9.799 9.799 0 0 1 2.182 12c0-5.424 4.394-9.818 9.818-9.818 5.424 0 9.818 4.394 9.818 9.818 0 5.424-4.394 9.818-9.818 9.818z"/>
                      </svg>
                      WhatsApp
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); }}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                    >
                      Ver Histórico
                    </button>
                    <button 
                      className="p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10 group"
                      onClick={(e) => { e.stopPropagation(); toggleExpand(cli.id); }}
                    >
                      {expandedClientId === cli.id ? <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-blue-500" /> : <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />}
                    </button>
                  </td>
                </tr>

                {/* Linha Expandida (Veículos) */}
                {expandedClientId === cli.id && (
                  <tr>
                    <td colSpan={4} className="p-6 bg-slate-50/50">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        <div className="col-span-1 lg:col-span-2 bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight flex items-center gap-2">
                              <CarFront className="w-4 h-4 text-blue-500" />
                              Veículos Registrados
                            </h3>
                            <button 
                              onClick={() => setShowVehicleModal(cli.id)}
                              className="flex items-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                            >
                              <Plus className="w-4 h-4" /> Novo Veículo
                            </button>
                          </div>

                          {!cli.veiculos && (
                            <div className="flex justify-center p-4">
                              <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                            </div>
                          )}
                          
                          {cli.veiculos && cli.veiculos.length === 0 && (
                            <div className="text-center p-6 border-2 border-dashed border-slate-100 rounded-xl">
                              <p className="text-slate-400 text-sm">Nenhum veículo cadastrado</p>
                            </div>
                          )}

                          {cli.veiculos && cli.veiculos.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {cli.veiculos.map(v => (
                                <div key={v.id} className="p-4 rounded-xl border border-slate-100 hover:border-blue-100 transition-all bg-slate-50 flex flex-col justify-between">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="font-mono font-black text-sm text-slate-700 bg-white px-2 py-1 rounded shadow-sm border border-slate-200 uppercase">{v.placa}</span>
                                    <span className="text-[10px] font-bold text-slate-400">{v.ano}</span>
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900 leading-none">{v.modelo}</p>
                                    <p className="text-xs text-slate-500 uppercase font-medium mt-1">{v.marca}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="col-span-1 bg-white border border-slate-100 rounded-xl p-6 shadow-sm flex flex-col justify-between gap-4">
                          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight flex items-center gap-2">
                            Resumo Rápido
                          </h3>
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><Wrench className="w-5 h-5"/></div>
                              <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total de O.S.</p>
                                <p className="font-black text-lg text-slate-800">--</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500"><DollarSign className="w-5 h-5"/></div>
                              <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Gasto</p>
                                <p className="font-black text-lg text-slate-800">R$ --,--</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500"><Clock className="w-5 h-5"/></div>
                              <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Última Visita</p>
                                <p className="font-black text-sm text-slate-800">--/--/----</p>
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Novo Veículo */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-lg">Cadastrar Novo Veículo</h3>
              <button onClick={() => setShowVehicleModal(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddVehicle} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Placa</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="ABC-1234"
                    value={newVehicle.placa}
                    onChange={e => setNewVehicle(v => ({ ...v, placa: e.target.value.toUpperCase() }))}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono uppercase"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ano</label>
                  <input 
                    required 
                    type="number" 
                    value={newVehicle.ano}
                    onChange={e => setNewVehicle(v => ({ ...v, ano: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fabricante (Marca)</label>
                <input 
                  required 
                  type="text" 
                  placeholder="Ex: Toyota, Honda..."
                  value={newVehicle.marca}
                  onChange={e => setNewVehicle(v => ({ ...v, marca: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Modelo</label>
                <input 
                  required 
                  type="text" 
                  placeholder="Ex: Corolla XEI 2.0"
                  value={newVehicle.modelo}
                  onChange={e => setNewVehicle(v => ({ ...v, modelo: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kilometragem Atual</label>
                <input 
                  required 
                  type="number" 
                  value={newVehicle.km_atual}
                  onChange={e => setNewVehicle(v => ({ ...v, km_atual: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowVehicleModal(null)}
                  className="flex-1 py-3 px-4 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  disabled={isSavingVehicle}
                  type="submit" 
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSavingVehicle ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> Salvar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Novo Cliente */}
      <NewClientModal
        isOpen={showNewClientModal}
        onClose={() => setShowNewClientModal(false)}
        onSuccess={fetchClientes}
      />
      {/* Modal Enviar WhatsApp */}
      {whatsAppTarget && (
        <SendWhatsAppModal
          cliente={whatsAppTarget}
          onClose={() => setWhatsAppTarget(null)}
        />
      )}
    </div>
  );
}

