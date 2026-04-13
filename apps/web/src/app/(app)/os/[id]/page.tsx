'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar, User, Car, Settings, 
  Plus, Trash2, CheckCircle, Clock, 
  Wrench, Package, DollarSign, Save, ChevronDown,
  Info, AlertCircle, TrendingUp
} from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'sonner';

interface Item {
  id: string;
  os_id: string;
  descricao: string;
  quantidade: number;
  valor: number; // For services
  valor_unit?: number; // For pieces
}

interface OS {
  id: string;
  status: 'aberta' | 'em_andamento' | 'pronta' | 'fechada' | 'cancelada';
  created_at: string;
  cliente_nome: string;
  cliente_telefone: string;
  placa: string;
  modelo: string;
  marca: string;
  mecanico_nome: string;
  km_entrada: number;
  km_saida?: number;
  valor_total: number;
}

export default function OSDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [os, setOs] = useState<OS | null>(null);
  const [servicos, setServicos] = useState<Item[]>([]);
  const [pecas, setPecas] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showServicoModal, setShowServicoModal] = useState(false);
  const [showPecaModal, setShowPecaModal] = useState(false);
  const [showFecharModal, setShowFecharModal] = useState(false);
  
  const [newServico, setNewServico] = useState({ descricao: '', valor: 0 });
  const [newPeca, setNewPeca] = useState({ descricao: '', quantidade: 1, valor_unit: 0 });
  const [kmSaida, setKmSaida] = useState(0);

  const loadData = async () => {
    try {
      const [osRes, itemsRes] = await Promise.all([
        api.get(`/os/${id}`),
        api.get(`/os/${id}/itens`)
      ]);
      setOs(osRes.data.os);
      setServicos(itemsRes.data.servicos);
      setPecas(itemsRes.data.pecas);
      if (osRes.data.os.km_entrada) setKmSaida(osRes.data.os.km_entrada);
    } catch (err) {
      toast.error('Erro ao carregar detalhes da OS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleUpdateStatus = async (status: string) => {
    try {
      await api.patch(`/os/${id}/status`, { status });
      toast.success('Status atualizado!');
      loadData();
    } catch (err) {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleAddServico = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/os/${id}/servicos`, { ...newServico, quantidade: 1 });
      toast.success('Serviço adicionado');
      setShowServicoModal(false);
      setNewServico({ descricao: '', valor: 0 });
      loadData();
    } catch (err) {
      toast.error('Erro ao adicionar serviço');
    }
  };

  const handleAddPeca = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/os/${id}/pecas`, newPeca);
      toast.success('Peça adicionada');
      setShowPecaModal(false);
      setNewPeca({ descricao: '', quantidade: 1, valor_unit: 0 });
      loadData();
    } catch (err) {
      toast.error('Erro ao adicionar peça');
    }
  };

  const handleDeleteItem = async (type: 'servicos' | 'pecas', itemId: string) => {
    try {
      await api.delete(`/os/${id}/${type}/${itemId}`);
      toast.success('Item removido');
      loadData();
    } catch (err) {
      toast.error('Erro ao remover item');
    }
  };

  const handleFecharOS = async () => {
    try {
      if (kmSaida < (os?.km_entrada || 0)) {
        toast.error('KM de saída não pode ser menor que entrada');
        return;
      }
      await api.patch(`/os/${id}/fechar`, { km_saida: kmSaida });
      toast.success('OS Fechada com sucesso!');
      router.push('/os');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao fechar OS');
    }
  };

  if (loading) return <div className="p-8">Carregando O.S...</div>;
  if (!os) return <div className="p-8">O.S. não encontrada.</div>;

  const subtotalServicos = servicos.reduce((acc, s) => acc + (Number(s.valor) * s.quantidade), 0);
  const subtotalPecas = pecas.reduce((acc, p) => acc + (Number(p.valor_unit) * (p.quantidade || 1)), 0);
  const totalGeral = subtotalServicos + subtotalPecas;

  const statusColors = {
    aberta: 'bg-slate-100 text-slate-700',
    em_andamento: 'bg-indigo-100 text-indigo-700',
    pronta: 'bg-emerald-100 text-emerald-700',
    fechada: 'bg-blue-100 text-blue-700',
    cancelada: 'bg-rose-100 text-rose-700'
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Top Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-white rounded-xl bg-slate-50 transition-all border border-slate-100 shadow-sm">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black tracking-tight text-slate-900">O.S. #{os.id.split('-')[0].toUpperCase()}</h1>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[os.status]}`}>
                {os.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-slate-500">Aberta em {new Date(os.created_at).toLocaleDateString('pt-BR')} às {new Date(os.created_at).toLocaleTimeString('pt-BR')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {os.status !== 'fechada' && os.status !== 'cancelada' && (
            <>
              <div className="relative group">
                <button className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
                  Alterar Status <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute top-[calc(100%-4px)] right-0 pt-2 w-48 hidden group-hover:block z-20 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl p-2">
                    {['aberta', 'em_andamento', 'pronta', 'cancelada'].map(s => (
                    <button 
                      key={s} 
                      onClick={() => handleUpdateStatus(s)}
                      className="w-full text-left px-4 py-2 rounded-lg hover:bg-slate-50 text-xs font-bold uppercase tracking-tight text-slate-600 hover:text-indigo-600 transition-colors"
                    >
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                  </div>
                </div>
              </div>
              
              {os.status === 'pronta' && (
                <button 
                  onClick={() => setShowFecharModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-black shadow-lg shadow-emerald-100 transition-all active:scale-95"
                >
                  Fechar O.S.
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Basic Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-slate-400">Cliente</p>
            <h3 className="font-bold text-slate-900">{os.cliente_nome}</h3>
            <p className="text-xs text-slate-500">{os.cliente_telefone}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-slate-400">Veículo</p>
            <h3 className="font-bold text-slate-900">{os.marca} {os.modelo}</h3>
            <span className="bg-slate-900 text-white font-mono px-2 py-0.5 rounded text-[10px] uppercase">{os.placa}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-slate-400">Responsável</p>
            <h3 className="font-bold text-slate-900">{os.mecanico_nome || 'N/A'}</h3>
            <p className="text-xs text-slate-500">Técnico designado</p>
          </div>
        </div>
      </div>

      {/* Main Content: Services & Parts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Services */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-indigo-600" /> Serviços
              </h2>
              {os.status !== 'fechada' && (
                <button 
                  onClick={() => setShowServicoModal(true)}
                  className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-black hover:bg-indigo-100 transition-all"
                >
                  + Adicionar Serviço
                </button>
              )}
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400">
                <tr>
                  <th className="px-6 py-3">Descrição</th>
                  <th className="px-6 py-3 text-right">Valor</th>
                  <th className="px-6 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {servicos.map(s => (
                  <tr key={s.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700">{s.descricao}</td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">R$ {Number(s.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-right">
                      {os.status !== 'fechada' && (
                        <button 
                          onClick={() => handleDeleteItem('servicos', s.id)}
                          className="text-slate-200 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {servicos.length === 0 && (
                  <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-300 italic text-sm">Nenhum serviço adicionado.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Parts */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" /> Peças e Peças de Reposição
              </h2>
              {os.status !== 'fechada' && (
                <button 
                  onClick={() => setShowPecaModal(true)}
                  className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-black hover:bg-amber-100 transition-all"
                >
                  + Adicionar Peça
                </button>
              )}
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400">
                <tr>
                  <th className="px-6 py-3">Descrição</th>
                  <th className="px-6 py-3 text-center">Qtd</th>
                  <th className="px-6 py-3 text-right">Unitário</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pecas.map(p => (
                  <tr key={p.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700">{p.descricao}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-600">{p.quantidade}</td>
                    <td className="px-6 py-4 text-right text-slate-500">R$ {Number(p.valor_unit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">R$ {(Number(p.valor_unit) * (p.quantidade || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-right">
                      {os.status !== 'fechada' && (
                        <button 
                          onClick={() => handleDeleteItem('pecas', p.id)}
                          className="text-slate-200 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {pecas.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-300 italic text-sm">Nenhuma peça adicionada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar: Totals & KM */}
        <div className="space-y-8">
          <div className="bg-indigo-700 p-8 rounded-3xl shadow-2xl shadow-indigo-100 text-white space-y-8">
            <h2 className="text-xl font-black">Resumo Financeiro</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between text-indigo-100 text-sm">
                <span>Serviços</span>
                <span className="font-bold">R$ {subtotalServicos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-indigo-100 text-sm">
                <span>Peças</span>
                <span className="font-bold">R$ {subtotalPecas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="pt-4 border-t border-indigo-500 flex justify-between items-end">
                <span className="text-xs uppercase font-black text-indigo-200">Total Geral</span>
                <span className="text-3xl font-black tracking-tighter">R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="bg-indigo-900/30 p-4 rounded-2xl border border-indigo-400/20 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-4 h-4 text-indigo-300" />
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Lucratividade</span>
              </div>
              <p className="text-xs text-indigo-100 leading-relaxed">
                Este valor será enviado para o fluxo de caixa assim que a O.S. for fechada.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-indigo-600" /> Controle de Kilometragem
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Entrada</p>
                <p className="text-lg font-black text-slate-800 font-mono">{os.km_entrada} <span className="text-xs font-normal">km</span></p>
              </div>
              <div className={`p-4 rounded-xl border ${os.km_saida ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Saída</p>
                <p className="text-lg font-black text-slate-800 font-mono">{os.km_saida || '---'} <span className="text-xs font-normal">km</span></p>
              </div>
            </div>
            {os.status === 'fechada' && (
              <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl text-emerald-800 text-xs leading-relaxed">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>O KM de saída foi atualizado automaticamente no cadastro do veículo.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modality: Modals */}
      {showServicoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">Adicionar Serviço</h3>
              <button onClick={() => setShowServicoModal(false)}><ArrowLeft className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddServico} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Descrição do Serviço</label>
                <input required className="w-full mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" value={newServico.descricao} onChange={e => setNewServico(p => ({ ...p, descricao: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Valor (R$)</label>
                <input required type="number" step="0.01" className="w-full mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" value={newServico.valor} onChange={e => setNewServico(p => ({ ...p, valor: Number(e.target.value) }))} />
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100">Adicionar à O.S.</button>
            </form>
          </div>
        </div>
      )}

      {showPecaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">Adicionar Peça</h3>
              <button onClick={() => setShowPecaModal(false)}><ArrowLeft className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddPeca} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Descrição da Peça</label>
                <input required className="w-full mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" value={newPeca.descricao} onChange={e => setNewPeca(p => ({ ...p, descricao: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Quantidade</label>
                  <input required type="number" className="w-full mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" value={newPeca.quantidade} onChange={e => setNewPeca(p => ({ ...p, quantidade: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Valor Unit. (R$)</label>
                  <input required type="number" step="0.01" className="w-full mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" value={newPeca.valor_unit} onChange={e => setNewPeca(p => ({ ...p, valor_unit: Number(e.target.value) }))} />
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-lg shadow-amber-100">Adicionar à O.S.</button>
            </form>
          </div>
        </div>
      )}

      {showFecharModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">Finalizar Ordem de Serviço</h3>
                <p className="text-slate-500 mt-2 leading-relaxed">Confirme a kilometragem final de saída do veículo para encerrar os trabalhos e gerar a cobrança.</p>
              </div>
              
              <div className="text-left bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Atenção: KM de Saída</label>
                  <input 
                    required 
                    type="number" 
                    className="w-full mt-2 px-4 py-4 bg-white border border-slate-200 rounded-xl font-black text-2xl text-slate-900 font-mono focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
                    placeholder="0"
                    value={kmSaida}
                    onChange={e => setKmSaida(Number(e.target.value))}
                  />
                  <p className="text-[10px] text-slate-400 mt-2 font-bold flex items-center gap-1">
                    <Info className="w-3 h-3 text-indigo-400" /> KM de entrada registrado: {os.km_entrada} km
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowFecharModal(false)} className="flex-1 py-4 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors">Voltar</button>
                <button onClick={handleFecharOS} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 active:scale-95 transition-all">Encerrar & Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
