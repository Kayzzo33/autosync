'use client';

import { useEffect, useState } from 'react';
import { 
  DollarSign, TrendingUp, ArrowDownRight, 
  ArrowUpRight, Calendar, Filter, Plus, 
  Search, CheckCircle, Clock, ChevronRight,
  TrendingDown, Loader2
} from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Movimentacao {
  id: string;
  data: string;
  descricao: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  os_id?: string;
}

interface ContaReceber {
  id: string;
  created_at: string;
  cliente_nome: string;
  os_numero: string;
  valor: number;
  status: 'pendente' | 'pago';
}

export default function FinanceiroPage() {
  const [resumo, setResumo] = useState({ faturamento_mes: 0, total_receber: 0, total_recebido: 0 });
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'fluxo' | 'receber'>('fluxo');
  const [showManualModal, setShowManualModal] = useState(false);
  const [newManual, setNewManual] = useState({ tipo: 'entrada', descricao: '', valor: 0 });
  const [chartData, setChartData] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [resumoRes, movsRes, contasRes] = await Promise.all([
        api.get('/financeiro/resumo'),
        api.get('/financeiro/movimentacoes'),
        api.get('/financeiro/contas-receber')
      ]);
      setResumo(resumoRes.data);
      const movs = movsRes.data.movimentacoes;
      setMovimentacoes(movs);
      setContasReceber(contasRes.data.contas);
      
      // Process chart data (Group by date)
      const grouped = movs.reduce((acc: any, curr: any) => {
        const dateStr = new Date(curr.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (!acc[dateStr]) acc[dateStr] = { name: dateStr, entrada: 0, saida: 0 };
        if (curr.tipo === 'entrada') acc[dateStr].entrada += Number(curr.valor);
        if (curr.tipo === 'saida') acc[dateStr].saida += Number(curr.valor);
        return acc;
      }, {});
      
      // Sort by date roughly (since it's recent 20 it might be mostly sorted desc, we reverse to asc for chart)
      setChartData(Object.values(grouped).reverse());
      
    } catch (err) {
      toast.error('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/financeiro/movimentacoes', newManual);
      toast.success('Lançamento realizado!');
      setShowManualModal(false);
      setNewManual({ tipo: 'entrada', descricao: '', valor: 0 });
      loadData();
    } catch (err) {
      toast.error('Erro ao realizar lançamento');
    }
  };

  const handlePay = async (id: string) => {
    try {
      await api.patch(`/financeiro/contas-receber/${id}/pagar`);
      toast.success('Baixa realizada com sucesso!');
      await loadData();
    } catch (err) {
      toast.error('Erro ao processar pagamento');
    }
  };

  if (loading) return <div className="p-8 flex flex-col items-center gap-4"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /><p className="text-slate-500">Acessando cofre...</p></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Financeiro</h1>
          <p className="text-slate-500 mt-1">Gestão de caixa, faturamento e recebíveis.</p>
        </div>
        <button 
          onClick={() => setShowManualModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus className="w-4 h-4" /> Lançamento Manual
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-black px-2 py-1 rounded-full uppercase tracking-widest">Este Mês</span>
          </div>
          <div className="pt-2">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Faturamento Realizado</p>
            <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">R$ {resumo.faturamento_mes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div className="pt-2">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total a Receber</p>
            <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">R$ {resumo.total_receber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div className="pt-2">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Recebido (Geral)</p>
            <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">R$ {resumo.total_recebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>
      </div>
      
      {/* Chart Section */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Resumo Visual (Últimas Movimentações)</h3>
        <div className="h-64 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid rgba(128, 128, 128, 0.2)', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: 'var(--card, #fff)',
                    color: 'var(--foreground, #171717)'
                  }}
                  itemStyle={{ color: 'var(--foreground, #171717)' }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="entrada" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="saida" name="Saídas" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">
              Sem dados suficientes para exibir o gráfico.
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 p-2 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-fit mb-4">
        <button 
          onClick={() => setActiveTab('fluxo')}
          className={`px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'fluxo' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Fluxo de Caixa
        </button>
        <button 
          onClick={() => setActiveTab('receber')}
          className={`px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'receber' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Contas a Receber ({contasReceber.length})
        </button>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'fluxo' && (
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <tr>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1a1a1a] text-sm">
              {movimentacoes.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {new Date(m.data).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">
                    {m.descricao}
                    {m.os_id && <span className="ml-2 bg-slate-100 text-[10px] px-1.5 py-0.5 rounded text-slate-400 font-mono">#{m.os_id.split('-')[0]}</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1 font-black text-[10px] uppercase ${m.tipo === 'entrada' ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {m.tipo === 'entrada' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {m.tipo}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-black ${m.tipo === 'entrada' ? 'text-slate-900' : 'text-rose-600'}`}>
                    {m.tipo === 'saida' && '- '}R$ {Number(m.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              {movimentacoes.length === 0 && (
                <tr><td colSpan={4} className="p-10 text-center text-slate-300 italic">Nenhuma movimentação registrada.</td></tr>
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'receber' && (
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <tr>
                <th className="px-6 py-4">OS #</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Data Vecto.</th>
                <th className="px-6 py-4 text-right">Valor Perto</th>
                <th className="px-6 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1a1a1a] text-sm">
              {contasReceber.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                    #{c.os_numero?.split('-')[0].toUpperCase()}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">{c.cliente_nome}</td>
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {new Date(c.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-900">
                    R$ {Number(c.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handlePay(c.id)}
                      className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-xs font-black hover:bg-emerald-100 transition-all border border-emerald-100"
                    >
                      Baxar Pagamento
                    </button>
                  </td>
                </tr>
              ))}
              {contasReceber.length === 0 && (
                <tr><td colSpan={5} className="p-10 text-center text-slate-300 italic">Tudo em dia! Nenhuma conta a receber pendente.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Manual Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-lg">Lançamento Manual</h3>
            </div>
            
            <form onSubmit={handleManualEntry} className="p-6 space-y-4">
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button 
                  type="button"
                  onClick={() => setNewManual(prev => ({ ...prev, tipo: 'entrada' }))}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${newManual.tipo === 'entrada' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                >
                  Entrada
                </button>
                <button 
                  type="button"
                  onClick={() => setNewManual(prev => ({ ...prev, tipo: 'saida' }))}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${newManual.tipo === 'saida' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400'}`}
                >
                  Saída
                </button>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">Descrição</label>
                <input 
                  required
                  placeholder="Ex: Compra de Ferramentas, Aluguel..."
                  className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={newManual.descricao}
                  onChange={e => setNewManual(v => ({ ...v, descricao: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">Valor (R$)</label>
                <input 
                  required
                  type="number"
                  step="0.01"
                  className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={newManual.valor}
                  onChange={e => setNewManual(v => ({ ...v, valor: Number(e.target.value) }))}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100"
                >
                  Lançar Agora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
