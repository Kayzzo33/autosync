'use client';

import { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Trash2, 
  Settings, UserCheck, UserMinus, Loader2 
} from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'sonner';

interface Mecanico {
  id: string;
  nome: string;
  telefone: string | null;
  especialidade: string | null;
  ativo: boolean;
}

export default function MecanicosConfigPage() {
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newMecanico, setNewMecanico] = useState({
    nome: '',
    telefone: '',
    especialidade: ''
  });

  const fetchMecanicos = async () => {
    try {
      const { data } = await api.get('/mecanicos');
      setMecanicos(data.mecanicos);
    } catch (err) {
      toast.error('Erro ao carregar mecânicos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMecanicos();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/mecanicos', newMecanico);
      toast.success('Mecânico cadastrado!');
      setShowModal(false);
      setNewMecanico({ nome: '', telefone: '', especialidade: '' });
      fetchMecanicos();
    } catch (err) {
      toast.error('Erro ao cadastrar mecânico');
    }
  };

  const toggleAtivo = async (id: string, current: boolean) => {
    try {
      await api.patch(`/mecanicos/${id}/ativo`, { ativo: !current });
      toast.success(`Mecânico ${!current ? 'ativado' : 'desativado'}`);
      fetchMecanicos();
    } catch (err) {
      toast.error('Erro ao atualizar status');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-none">Equipe Técnica</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Gestão de mecânicos e especialistas da sua oficina.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 dark:bg-blue-600 hover:bg-indigo-700 dark:hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-100 dark:shadow-none active:scale-95"
        >
          <Plus className="w-4 h-4" /> Novo Mecânico
        </button>
      </div>

      <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-500 text-xs uppercase tracking-wider font-black">
              <th className="p-4">Nome</th>
              <th className="p-4">Especialidade</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
            {isLoading && (
              <tr>
                <td colSpan={4} className="p-12 text-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                </td>
              </tr>
            )}
            {mecanicos.map(m => (
              <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold overflow-hidden shadow-inner ${m.ativo ? 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/20' : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-white/5'}`}>
                      {m.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white leading-none">{m.nome}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{m.telefone || 'Sem telefone'}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 px-2 py-1 rounded text-[10px] font-black uppercase tracking-tight border border-slate-200 dark:border-white/5">
                    {m.especialidade || 'Geral'}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase border ${m.ativo ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200/50 dark:border-rose-500/20'}`}>
                    {m.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => toggleAtivo(m.id, m.ativo)}
                    className={`p-2 rounded-lg transition-all ${m.ativo ? 'hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-400 dark:text-rose-500/60 hover:text-rose-600 dark:hover:text-rose-400' : 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-400 dark:text-emerald-500/60 hover:text-emerald-600 dark:hover:text-emerald-400'}`}
                    title={m.ativo ? 'Desativar' : 'Ativar'}
                  >
                    {m.ativo ? <UserMinus className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                  </button>
                </td>
              </tr>
            ))}
            {mecanicos.length === 0 && !isLoading && (
              <tr>
                <td colSpan={4} className="p-12 text-center text-slate-400 dark:text-slate-600 font-bold uppercase text-xs tracking-widest">
                  Nenhum mecânico cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Cadastro */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">Novo Mecânico</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400"><Trash2 className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Nome Completo</label>
                <input 
                  required
                  className="w-full mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newMecanico.nome}
                  onChange={e => setNewMecanico(prev => ({ ...prev, nome: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Telefone</label>
                <input 
                  className="w-full mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newMecanico.telefone}
                  onChange={e => setNewMecanico(prev => ({ ...prev, telefone: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Especialidade</label>
                <input 
                  className="w-full mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newMecanico.especialidade}
                  onChange={e => setNewMecanico(prev => ({ ...prev, especialidade: e.target.value }))}
                />
              </div>
              <button 
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl mt-4"
              >
                Cadastrar Mecânico
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
