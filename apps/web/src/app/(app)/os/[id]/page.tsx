'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, User, Car, Settings,
  Plus, Trash2, CheckCircle,
  Wrench, Package, ChevronDown,
  Info, AlertCircle, TrendingUp, Printer, UserCog, X
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
  status: 'aberta' | 'em_andamento' | 'pronta' | 'fechada' | 'cancelada' | 'aguardando_peca';
  created_at: string;
  cliente_nome: string;
  cliente_telefone: string;
  placa: string;
  modelo: string;
  marca: string;
  mecanico_nome: string;
  tenant_name?: string;
  km_entrada: number;
  km_saida?: number;
  valor_total: number;
}

interface Mecanico { id: string; nome: string; especialidade: string | null; ativo: boolean; }

export default function OSDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [os, setOs] = useState<OS | null>(null);
  const [servicos, setServicos] = useState<Item[]>([]);
  const [pecas, setPecas] = useState<Item[]>([]);
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([]);
  const [catalogo, setCatalogo] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showServicoModal, setShowServicoModal] = useState(false);
  const [showPecaModal, setShowPecaModal] = useState(false);
  const [showFecharModal, setShowFecharModal] = useState(false);
  const [showTrocarMecModal, setShowTrocarMecModal] = useState(false);
  const [showNotaFiscal, setShowNotaFiscal] = useState(false);
  const [mecSelecionado, setMecSelecionado] = useState('');
  
  // Usar string para evitar o bug do zero fixo nos inputs
  const [newServico, setNewServico] = useState({ descricao: '', valor: '' });
  const [newPeca, setNewPeca] = useState({ descricao: '', quantidade: '1', valor_unit: '' });
  const [kmSaida, setKmSaida] = useState('');

  const loadData = async () => {
    try {
      const [osRes, itemsRes, mecRes, catRes] = await Promise.all([
        api.get(`/os/${id}`),
        api.get(`/os/${id}/itens`),
        api.get('/mecanicos'),
        api.get('/catalogo')
      ]);
      setOs(osRes.data.os);
      setServicos(itemsRes.data.servicos);
      setPecas(itemsRes.data.pecas);
      setMecanicos(mecRes.data.mecanicos || []);
      setCatalogo(catRes.data || []);
      if (osRes.data.os.km_entrada) setKmSaida(String(osRes.data.os.km_entrada));
    } catch (err) {
      toast.error('Erro ao carregar detalhes da OS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

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
    const valorNum = parseFloat(String(newServico.valor).replace(',', '.'));
    if (isNaN(valorNum) || valorNum <= 0) { toast.error('Informe um valor válido'); return; }
    try {
      await api.post(`/os/${id}/servicos`, { descricao: newServico.descricao, valor: valorNum, quantidade: 1 });
      toast.success('Serviço adicionado!');
      setShowServicoModal(false);
      setNewServico({ descricao: '', valor: '' });
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao adicionar serviço');
    }
  };

  const handleAddPeca = async (e: React.FormEvent) => {
    e.preventDefault();
    const valorNum = parseFloat(String(newPeca.valor_unit).replace(',', '.'));
    const qtd = parseInt(String(newPeca.quantidade)) || 1;
    if (isNaN(valorNum) || valorNum <= 0) { toast.error('Informe um valor válido'); return; }
    try {
      await api.post(`/os/${id}/pecas`, { descricao: newPeca.descricao, quantidade: qtd, valor_unit: valorNum });
      toast.success('Peça adicionada!');
      setShowPecaModal(false);
      setNewPeca({ descricao: '', quantidade: '1', valor_unit: '' });
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao adicionar peça');
    }
  };

  const handleTrocarMecanico = async () => {
    if (!mecSelecionado) { toast.error('Selecione um mecânico'); return; }
    try {
      await api.patch(`/os/${id}/mecanico`, { mecanico_id: mecSelecionado });
      toast.success('Responsável atualizado!');
      setShowTrocarMecModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao trocar mecânico');
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
    const kmNum = parseInt(String(kmSaida)) || 0;
    if (kmNum < (os?.km_entrada || 0)) {
      toast.error('KM de saída não pode ser menor que entrada');
      return;
    }
    try {
      await api.patch(`/os/${id}/fechar`, { km_saida: kmNum });
      toast.success('OS Fechada com sucesso!');
      setShowFecharModal(false);
      await loadData();
      setShowNotaFiscal(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao fechar OS');
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>Recibo</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            body { font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; }
          </style>
        </head>
        <body class="bg-white">
          <div class="p-8">
            ${printRef.current.innerHTML}
          </div>
          <script>
            // Wait for Tailwind to process classes before printing
            setTimeout(() => {
              window.print();
            }, 800);
          </script>
        </body>
      </html>
    `);
    w.document.close();
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
    cancelada: 'bg-rose-100 text-rose-700',
    aguardando_peca: 'bg-amber-100 text-amber-700'
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
        <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm space-y-4">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500">Cliente</p>
            <h3 className="font-bold text-slate-900 dark:text-white">{os.cliente_nome}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{os.cliente_telefone}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm space-y-4">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500">Veículo</p>
            <h3 className="font-bold text-slate-900 dark:text-white">{os.marca} {os.modelo}</h3>
            <span className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-mono px-2 py-0.5 rounded text-[10px] uppercase">{os.placa}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm space-y-3">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600">
              <Settings className="w-5 h-5" />
            </div>
            {os.status !== 'fechada' && (
              <button
                onClick={() => { setMecSelecionado(''); setShowTrocarMecModal(true); }}
                className="flex items-center gap-1 text-[10px] font-black uppercase text-indigo-500 hover:text-indigo-700 transition-colors"
              >
                <UserCog className="w-3 h-3" /> Trocar
              </button>
            )}
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500">Responsável</p>
            <h3 className="font-bold text-slate-900 dark:text-white">{os.mecanico_nome || 'Não designado'}</h3>
            <p className="text-xs text-slate-500">Técnico designado</p>
          </div>
        </div>
      </div>

      {/* Main Content: Services & Parts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Services */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
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
              <thead className="bg-slate-50 dark:bg-white/5 text-[10px] uppercase font-black text-slate-400 dark:text-slate-500">
                <tr>
                  <th className="px-6 py-3">Descrição</th>
                  <th className="px-6 py-3 text-right">Valor</th>
                  <th className="px-6 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                {servicos.map(s => (
                  <tr key={s.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{s.descricao}</td>
                    <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white">R$ {Number(s.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
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
          <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
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
              <thead className="bg-slate-50 dark:bg-white/5 text-[10px] uppercase font-black text-slate-400 dark:text-slate-500">
                <tr>
                  <th className="px-6 py-3">Descrição</th>
                  <th className="px-6 py-3 text-center">Qtd</th>
                  <th className="px-6 py-3 text-right">Unitário</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                {pecas.map(p => (
                  <tr key={p.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{p.descricao}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-600 dark:text-slate-400">{p.quantidade}</td>
                    <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400">R$ {Number(p.valor_unit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white">R$ {(Number(p.valor_unit) * (p.quantidade || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
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
          <div className="bg-indigo-700 p-8 rounded-3xl text-white space-y-8">
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

          <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm space-y-6">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-indigo-600" /> Controle de Kilometragem
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/10">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Entrada</p>
                <p className="text-lg font-black text-slate-800 dark:text-white font-mono">{os.km_entrada} <span className="text-xs font-normal">km</span></p>
              </div>
              <div className={`p-4 rounded-xl border ${os.km_saida ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10'}`}>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Saída</p>
                <p className="text-lg font-black text-slate-800 dark:text-white font-mono">{os.km_saida || '---'} <span className="text-xs font-normal">km</span></p>
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
            <div className="p-6">
              <div className="mb-4">
                 <label className="text-xs font-bold text-slate-500 uppercase">Buscar do Catálogo</label>
                 <select 
                    className="w-full mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300"
                    onChange={e => {
                       const item = catalogo.find(c => c.id === e.target.value);
                       if (item) setNewServico({ descricao: item.nome, valor: item.preco_padrao.toString() });
                    }}
                 >
                    <option value="">-- Inserção Manual --</option>
                    {catalogo.filter(c => c.tipo === 'servico' && c.ativo).map(c => (
                       <option key={c.id} value={c.id}>{c.nome} (R$ {Number(c.preco_padrao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</option>
                    ))}
                 </select>
              </div>
              <form onSubmit={handleAddServico} className="space-y-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Descrição do Serviço</label>
                  <input required className="w-full mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300" value={newServico.descricao} onChange={e => setNewServico(p => ({ ...p, descricao: e.target.value }))} placeholder="Ex: Troca de óleo" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Valor (R$)</label>
                  <input required type="text" inputMode="decimal" placeholder="0,00" className="w-full mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300" value={newServico.valor} onChange={e => setNewServico(p => ({ ...p, valor: e.target.value }))} />
                </div>
                <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100">Adicionar à O.S.</button>
              </form>
            </div>
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
            <div className="p-6">
              <div className="mb-4">
                 <label className="text-xs font-bold text-slate-500 uppercase">Buscar do Catálogo</label>
                 <select 
                    className="w-full mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-300"
                    onChange={e => {
                       const item = catalogo.find(c => c.id === e.target.value);
                       if (item) setNewPeca({ descricao: item.nome, quantidade: '1', valor_unit: item.preco_padrao.toString() });
                    }}
                 >
                    <option value="">-- Inserção Manual --</option>
                    {catalogo.filter(c => c.tipo === 'peca' && c.ativo).map(c => (
                       <option key={c.id} value={c.id}>{c.nome} (R$ {Number(c.preco_padrao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</option>
                    ))}
                 </select>
              </div>
              <form onSubmit={handleAddPeca} className="space-y-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Descrição da Peça</label>
                  <input required className="w-full mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" value={newPeca.descricao} onChange={e => setNewPeca(p => ({ ...p, descricao: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Quantidade</label>
                    <input required type="text" inputMode="numeric" placeholder="1" className="w-full mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-300" value={newPeca.quantidade} onChange={e => setNewPeca(p => ({ ...p, quantidade: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Valor Unit. (R$)</label>
                    <input required type="text" inputMode="decimal" placeholder="0,00" className="w-full mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-300" value={newPeca.valor_unit} onChange={e => setNewPeca(p => ({ ...p, valor_unit: e.target.value }))} />
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-lg shadow-amber-100">Adicionar à O.S.</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showFecharModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111] rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Finalizar Ordem de Serviço</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">Confirme a kilometragem final de saída do veículo para encerrar os trabalhos e gerar a cobrança.</p>
              </div>
              
              <div className="text-left bg-slate-50 dark:bg-white/5 p-6 rounded-2xl border border-slate-100 dark:border-white/10 space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Atenção: KM de Saída</label>
                  <input 
                    required 
                    type="text"
                    inputMode="numeric"
                    className="w-full mt-2 px-4 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl font-black text-2xl text-slate-900 dark:text-white font-mono focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/50 outline-none transition-all"
                    placeholder={String(os.km_entrada || 0)}
                    value={kmSaida}
                    onChange={e => setKmSaida(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-400 mt-2 font-bold flex items-center gap-1">
                    <Info className="w-3 h-3 text-indigo-400" /> KM de entrada registrado: {os.km_entrada} km
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowFecharModal(false)} className="flex-1 py-4 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">Voltar</button>
                <button onClick={handleFecharOS} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 dark:shadow-emerald-900/20 active:scale-95 transition-all">Encerrar & Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Trocar Mecânico */}
      {showTrocarMecModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111] rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2"><UserCog className="w-5 h-5 text-indigo-500" /> Trocar Responsável</h3>
              <button onClick={() => setShowTrocarMecModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Selecione o novo mecânico responsável por esta O.S.</p>
              <select
                className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 dark:text-white"
                value={mecSelecionado}
                onChange={e => setMecSelecionado(e.target.value)}
              >
                <option value="">-- Selecione --</option>
                {mecanicos.filter(m => m.ativo).map(m => (
                  <option key={m.id} value={m.id}>{m.nome}{m.especialidade ? ` — ${m.especialidade}` : ''}</option>
                ))}
              </select>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowTrocarMecModal(false)} className="flex-1 py-3 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">Cancelar</button>
                <button onClick={handleTrocarMecanico} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all active:scale-95">Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nota Fiscal */}
      {showNotaFiscal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 my-4">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><Printer className="w-5 h-5 text-emerald-600" /> Nota de Serviço</h3>
              <div className="flex gap-2">
                <button onClick={handlePrint} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all">
                  <Printer className="w-4 h-4" /> Imprimir / PDF
                </button>
                <button onClick={() => { setShowNotaFiscal(false); router.push('/os'); }} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>
            {/* Área de Impressão */}
            <div ref={printRef} className="p-10 space-y-8 text-[12px] text-slate-800 bg-white">
              {/* Cabeçalho Profissional */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 leading-none mb-1">{os.tenant_name || 'AutoSync'}</h1>
                  <p className="text-slate-500 font-bold uppercase tracking-tighter">Comprovante de Ordem de Serviço</p>
                </div>
                <div className="text-right">
                  <div className="bg-slate-900 text-white px-4 py-2 rounded-lg inline-block mb-1">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Número da O.S.</p>
                    <p className="text-xl font-black leading-none">#{os.id.split('-')[0].toUpperCase()}</p>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold">{new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
                </div>
              </div>

              {/* Informações Alinhadas (Estilo solicitado pelo usuário) */}
              <div className="space-y-2 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-black uppercase text-slate-400 text-[10px]">Cliente:</span>
                  <span className="font-bold text-slate-900">{os.cliente_nome}</span>
                  <span className="text-slate-300">|</span>
                  <span className="font-black uppercase text-slate-400 text-[10px]">Contato:</span>
                  <span className="font-bold text-slate-900">{os.cliente_telefone}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-black uppercase text-slate-400 text-[10px]">Veículo:</span>
                  <span className="font-bold text-slate-900 uppercase">{os.marca} {os.modelo}</span>
                  <span className="text-slate-300">|</span>
                  <span className="font-black uppercase text-slate-400 text-[10px]">Placa:</span>
                  <span className="font-mono font-bold text-slate-900">{os.placa}</span>
                </div>

                <div className="flex items-center gap-2 text-sm pt-1">
                  <span className="font-black uppercase text-slate-400 text-[10px]">Responsável Técnico:</span>
                  <span className="font-bold text-indigo-600 uppercase">{os.mecanico_nome || 'A DEFINIR'}</span>
                  <span className="text-slate-300">|</span>
                  <span className="font-black uppercase text-slate-400 text-[10px]">KM Entrada:</span>
                  <span className="font-bold text-slate-900">{os.km_entrada} km</span>
                  <span className="text-slate-300">|</span>
                  <span className="font-black uppercase text-slate-400 text-[10px]">KM Saída:</span>
                  <span className="font-bold text-slate-900">{os.km_saida || '—'} km</span>
                </div>
              </div>

              {/* Tabela de Serviços e Peças (Unificada e Limpa) */}
              <div className="space-y-6">
                {servicos.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-black text-slate-900 uppercase tracking-widest text-[10px] flex items-center gap-2">
                      <div className="w-1 h-3 bg-indigo-500"></div> Serviços Realizados
                    </h3>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b-2 border-slate-200">
                          <th className="py-2 text-left font-black uppercase text-slate-400 text-[9px]">Descrição do Serviço</th>
                          <th className="py-2 text-right font-black uppercase text-slate-400 text-[9px]">Valor Bruto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {servicos.map(s => (
                          <tr key={s.id}>
                            <td className="py-3 text-slate-700 font-medium">{s.descricao}</td>
                            <td className="py-3 text-right font-bold text-slate-900">R$ {Number(s.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {pecas.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-black text-slate-900 uppercase tracking-widest text-[10px] flex items-center gap-2">
                      <div className="w-1 h-3 bg-amber-500"></div> Peças e Materiais
                    </h3>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b-2 border-slate-200">
                          <th className="py-2 text-left font-black uppercase text-slate-400 text-[9px]">Item / Descrição</th>
                          <th className="py-2 text-center font-black uppercase text-slate-400 text-[9px]">Qtd</th>
                          <th className="py-2 text-right font-black uppercase text-slate-400 text-[9px]">V. Unit</th>
                          <th className="py-2 text-right font-black uppercase text-slate-400 text-[9px]">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pecas.map(p => (
                          <tr key={p.id}>
                            <td className="py-3 text-slate-700 font-medium">{p.descricao}</td>
                            <td className="py-3 text-center text-slate-500 font-bold">{p.quantidade}</td>
                            <td className="py-3 text-right text-slate-500">R$ {Number(p.valor_unit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="py-3 text-right font-bold text-slate-900">R$ {(Number(p.valor_unit) * p.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Resumo de Valores Alinhado à Direita */}
              <div className="flex justify-end pt-4">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-slate-500 font-bold uppercase text-[10px]">
                    <span>Total em Serviços</span>
                    <span>R$ {subtotalServicos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-bold uppercase text-[10px]">
                    <span>Total em Peças</span>
                    <span>R$ {subtotalPecas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t-2 border-slate-900 mt-2">
                    <span className="font-black text-slate-900 uppercase tracking-widest text-xs">VALOR TOTAL</span>
                    <span className="text-xl font-black text-slate-900">R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Área de Assinatura (Ajustada com linha) */}
              <div className="pt-20 grid grid-cols-2 gap-20">
                <div className="text-center space-y-2">
                  <div className="border-b border-slate-900 w-full mx-auto"></div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Assinatura do Técnico</p>
                  <p className="font-bold text-slate-900 uppercase">{os.mecanico_nome || '—'}</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="border-b border-slate-900 w-full mx-auto"></div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Assinatura do Cliente</p>
                  <p className="font-bold text-slate-900 uppercase">{os.cliente_nome}</p>
                </div>
              </div>

              <div className="pt-10 text-center border-t border-slate-100">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">Documento gerado eletronicamente via AutoSync ERP</p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl text-center">
              <p className="text-xs text-slate-400">Você pode reimprimir esta nota a qualquer momento abrindo a O.S. finalizada.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
