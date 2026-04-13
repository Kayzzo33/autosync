'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import { api } from '@/services/api';
import { Users, CarFront, Plus, Loader2, Search, X, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { toast } from 'sonner';

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
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  // Modal State
  const [showVehicleModal, setShowVehicleModal] = useState<string | null>(null); // clientId or null
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [isSavingVehicle, setIsSavingVehicle] = useState(false);
  const [isSavingClient, setIsSavingClient] = useState(false);
  
  const [newVehicle, setNewVehicle] = useState({
    placa: '',
    marca: '',
    modelo: '',
    ano: new Date().getFullYear(),
    km_atual: 0
  });

  const [newClient, setNewClient] = useState({
    nome: '',
    telefone: '',
    email: '',
    cpf: ''
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

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingClient(true);
    try {
      await api.post('/comercial/clientes', newClient);
      toast.success('Cliente cadastrado com sucesso!');
      setShowNewClientModal(false);
      setNewClient({ nome: '', telefone: '', email: '', cpf: '' });
      fetchClientes();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao cadastrar cliente. Verifique os dados.');
    } finally {
      setIsSavingClient(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, [search]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Base de Clientes</h1>
          <p className="text-slate-500 mt-1">Gestão de contatos e histórico da oficina.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={() => setShowNewClientModal(true)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" /> Novo Cliente
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
              <th className="p-4 font-bold">Cliente</th>
              <th className="p-4 font-bold">Contato</th>
              <th className="p-4 font-bold text-center">Veículos</th>
              <th className="p-4 font-bold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
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
                    <p className="font-medium text-slate-600">Nenhum cliente encontrado ou erro na conexão.</p>
                    <button 
                      onClick={() => { setIsLoading(true); fetchClientes(); }}
                      className="text-blue-600 font-bold hover:underline py-2 px-4 bg-blue-50 rounded-xl"
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
                <tr className={`hover:bg-slate-50 transition-colors cursor-pointer ${expandedClientId === cli.id ? 'bg-blue-50/30' : ''}`} onClick={() => toggleExpand(cli.id)}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
                        {cli.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{cli.nome}</p>
                        <p className="text-slate-400 text-xs">ID: {cli.id.split('-')[0]}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-slate-700 font-medium">{cli.telefone}</p>
                    {cli.email && <p className="text-slate-400 text-xs">{cli.email}</p>}
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs font-bold border border-slate-200">
                      <CarFront className="w-3 h-3" />
                      {cli.veiculos?.length ?? '...'}
                    </span>
                  </td>
                  <td className="p-4 text-right flex items-center justify-end gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); router.push(`/clientes/${cli.id}`); }}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                    >
                      Perfil
                    </button>
                    <button 
                      className="p-2 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-200 group"
                      onClick={(e) => { e.stopPropagation(); toggleExpand(cli.id); }}
                    >
                      {expandedClientId === cli.id ? <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-blue-500" /> : <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />}
                    </button>
                  </td>
                </tr>

                {/* Linha Expandida (Veículos) */}
                {expandedClientId === cli.id && (
                  <tr>
                    <td colSpan={4} className="p-4 bg-slate-50/50">
                      <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-inner space-y-4">
                        <div className="flex items-center justify-between">
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
                          <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-lg">
                            <p className="text-slate-400 text-sm">Este cliente ainda não possui veículos cadastrados.</p>
                          </div>
                        )}

                        {cli.veiculos && cli.veiculos.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {cli.veiculos.map(v => (
                              <div key={v.id} className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-all group relative">
                                <div className="flex items-start justify-between mb-2">
                                  <span className="bg-slate-900 text-white font-mono px-2 py-0.5 rounded text-[10px] uppercase shadow-sm border border-slate-700">
                                    {v.placa}
                                  </span>
                                  <span className="text-[10px] text-slate-400 uppercase font-bold">{v.marca}</span>
                                </div>
                                <h4 className="font-bold text-slate-800 text-lg">{v.modelo}</h4>
                                <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                                  <span>Ano {v.ano}</span>
                                  <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">{v.km_atual.toLocaleString()} KM</span>
                                </div>
                                <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-300 hover:text-red-500">
                                  {/* Delete placeholder */}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
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
      {showNewClientModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-lg">Cadastrar Novo Cliente</h3>
              <button onClick={() => setShowNewClientModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateClient} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo *</label>
                <input 
                  required 
                  type="text" 
                  placeholder="Ex: João da Silva"
                  value={newClient.nome}
                  onChange={e => setNewClient(v => ({ ...v, nome: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone / WhatsApp *</label>
                <input 
                  required 
                  type="text" 
                  placeholder="Ex: 11988887777"
                  value={newClient.telefone}
                  onChange={e => setNewClient(v => ({ ...v, telefone: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email (Opcional)</label>
                <input 
                  type="email" 
                  placeholder="joao@email.com"
                  value={newClient.email}
                  onChange={e => setNewClient(v => ({ ...v, email: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CPF (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="000.000.000-00"
                  value={newClient.cpf}
                  onChange={e => setNewClient(v => ({ ...v, cpf: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowNewClientModal(false)}
                  className="flex-1 py-3 px-4 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  disabled={isSavingClient}
                  type="submit" 
                  className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSavingClient ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> Salvar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

