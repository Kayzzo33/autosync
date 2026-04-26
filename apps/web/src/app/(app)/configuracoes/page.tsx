'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Users, 
  Wrench, 
  MessageSquare, 
  Building2, 
  Save, 
  Plus, 
  UserPlus, 
  ShieldCheck, 
  Loader2,
  CheckCircle2,
  Trash2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'sonner';

type Tab = 'oficina' | 'usuarios' | 'mecanicos' | 'whatsapp' | 'catalogo';

interface Tenant {
  id: string;
  nome: string;
  cnpj?: string;
  telefone?: string;
  endereco?: string;
  whatsapp_templates?: Record<string, string>;
}

interface User {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  ativo: boolean;
  created_at: string;
}

interface CatalogoItem {
  id: string;
  nome: string;
  descricao: string;
  preco_padrao: number;
  tipo: 'servico' | 'peca';
  ativo: boolean;
}

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('oficina');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  
  // Modal for new user
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ nome: '', email: '', password: '', perfil: 'atendente' });

  // Catalog State
  const [catalogoItems, setCatalogoItems] = useState<CatalogoItem[]>([]);
  const [showCatalogoModal, setShowCatalogoModal] = useState(false);
  const [newCatalogoItem, setNewCatalogoItem] = useState({ nome: '', descricao: '', preco_padrao: 0, tipo: 'servico' as 'servico' | 'peca' });
  const [catalogoTab, setCatalogoTab] = useState<'servico' | 'peca'>('servico');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'oficina' || activeTab === 'whatsapp') {
        const res = await api.get('/tenants/me');
        setTenant(res.data.tenant);
      } else if (activeTab === 'usuarios') {
        const res = await api.get('/pessoal/usuarios');
        setUsers(res.data.users);
      } else if (activeTab === 'catalogo') {
        const res = await api.get('/catalogo');
        setCatalogoItems(res.data);
      }
    } catch (err) {
      toast.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    setSaving(true);
    try {
      await api.put('/tenants/me', {
        nome: tenant.nome,
        cnpj: tenant.cnpj,
        telefone: tenant.telefone,
        endereco: tenant.endereco
      });
      toast.success('Dados da oficina atualizados!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateWhatsApp = async () => {
    if (!tenant?.whatsapp_templates) return;
    setSaving(true);
    try {
      await api.put('/tenants/whatsapp', {
        templates: tenant.whatsapp_templates
      });
      toast.success('Templates atualizados!');
    } catch (err) {
      toast.error('Erro ao salvar templates.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/pessoal/usuarios', newUser);
      toast.success('Usuário criado!');
      setShowUserModal(false);
      setNewUser({ nome: '', email: '', password: '', perfil: 'atendente' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao criar usuário.');
    } finally {
      setSaving(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/pessoal/usuarios/${userId}/ativo`, { ativo: !currentStatus });
      setUsers(users.map(u => u.id === userId ? { ...u, ativo: !currentStatus } : u));
      toast.success('Status atualizado!');
    } catch (err) {
      toast.error('Erro ao alterar status.');
    }
  };

  const handleCreateCatalogoItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/catalogo', newCatalogoItem);
      toast.success('Item adicionado ao catálogo!');
      setShowCatalogoModal(false);
      setNewCatalogoItem({ nome: '', descricao: '', preco_padrao: 0, tipo: 'servico' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao criar item.');
    } finally {
      setSaving(false);
    }
  };

  const toggleCatalogoStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/catalogo/${id}/ativo`, { ativo: !currentStatus });
      setCatalogoItems(catalogoItems.map(item => item.id === id ? { ...item, ativo: !currentStatus } : item));
      toast.success('Status atualizado!');
    } catch (err) {
      toast.error('Erro ao alterar status.');
    }
  };

  if (loading && !tenant && users.length === 0 && catalogoItems.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Configurações</h1>
        <p className="text-slate-500">Gerencie os dados da sua oficina, sua equipe e comunicações.</p>
      </header>

      {/* Navegação por Abas */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        {[
          { id: 'oficina', label: 'Oficina', icon: Building2 },
          { id: 'usuarios', label: 'Usuários', icon: Users },
          { id: 'mecanicos', label: 'Mecânicos', icon: Wrench },
          { id: 'catalogo', label: 'Catálogo', icon: Settings },
          { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all text-sm font-bold ${
              activeTab === tab.id 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-emerald-500' : ''}`} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        {/* CONTEÚDO: OFICINA */}
        {activeTab === 'oficina' && tenant && (
          <div className="p-8 max-w-2xl">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-500" />
              Dados da Oficina
            </h2>
            <form onSubmit={handleUpdateTenant} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nome da Oficina</label>
                  <input 
                    type="text" 
                    value={tenant.nome}
                    onChange={e => setTenant({...tenant, nome: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">CNPJ</label>
                  <input 
                    type="text" 
                    value={tenant.cnpj || ''}
                    placeholder="00.000.000/0001-00"
                    onChange={e => setTenant({...tenant, cnpj: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Telefone</label>
                  <input 
                    type="text" 
                    value={tenant.telefone || ''}
                    placeholder="(00) 00000-0000"
                    onChange={e => setTenant({...tenant, telefone: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Subdomínio (Slug)</label>
                  <input 
                    type="text" 
                    value={tenant.subdominio}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed font-medium"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Endereço Completo</label>
                <input 
                  type="text" 
                  value={tenant.endereco || ''}
                  placeholder="Rua, Número, Bairro, Cidade - UF"
                  onChange={e => setTenant({...tenant, endereco: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                />
              </div>
              <button 
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar Alterações
              </button>
            </form>
          </div>
        )}

        {/* CONTEÚDO: USUÁRIOS */}
        {activeTab === 'usuarios' && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-500" />
                  Gerenciamento de Usuários
                </h2>
                <p className="text-slate-500 text-sm">Controle quem tem acesso ao painel da oficina.</p>
              </div>
              <button 
                onClick={() => setShowUserModal(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
              >
                <UserPlus className="w-4 h-4" />
                Novo Usuário
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map(user => (
                <div key={user.id} className="p-6 rounded-2xl border border-slate-200 hover:border-emerald-500/30 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-lg">
                      {user.nome[0].toUpperCase()}
                    </div>
                    <button 
                      onClick={() => toggleUserStatus(user.id, user.ativo)}
                      className="text-slate-400 hover:text-emerald-500 transition-all"
                    >
                      {user.ativo ? <ToggleRight className="w-8 h-8 text-emerald-500" /> : <ToggleLeft className="w-8 h-8" />}
                    </button>
                  </div>
                  <h3 className="font-bold text-slate-900">{user.nome}</h3>
                  <p className="text-sm text-slate-500 mb-4">{user.email}</p>
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] uppercase font-black tracking-wider border border-slate-200">
                      {user.perfil}
                    </span>
                    <span className={`text-[10px] font-bold uppercase ${user.ativo ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {user.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONTEÚDO: MECÂNICOS (Simples redirect placeholder or inline list) */}
        {activeTab === 'mecanicos' && (
          <div className="p-8 flex flex-col items-center justify-center text-center py-20">
             <Wrench className="w-12 h-12 text-slate-200 mb-4" />
             <h3 className="text-xl font-bold text-slate-900">Gestão da Equipe Técnica</h3>
             <p className="text-slate-500 max-w-sm mb-6">A configuração de comissões e especialidades dos mecânicos é feita separadamente.</p>
             <button className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold">Ir para Equipe</button>
          </div>
        )}

        {/* CONTEÚDO: CATÁLOGO */}
        {activeTab === 'catalogo' && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-500" />
                  Catálogo de Serviços e Peças
                </h2>
                <p className="text-slate-500 text-sm">Gerencie o catálogo para facilitar a criação de O.S.</p>
              </div>
              <button 
                onClick={() => setShowCatalogoModal(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" />
                Novo Item
              </button>
            </div>

            <div className="flex gap-4 mb-6">
               <button onClick={() => setCatalogoTab('servico')} className={`px-4 py-2 font-bold rounded-lg border transition-all ${catalogoTab === 'servico' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>Serviços</button>
               <button onClick={() => setCatalogoTab('peca')} className={`px-4 py-2 font-bold rounded-lg border transition-all ${catalogoTab === 'peca' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>Peças</button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold tracking-widest">
                     <tr>
                        <th className="px-6 py-4">Nome</th>
                        <th className="px-6 py-4">Descrição</th>
                        <th className="px-6 py-4">Preço Padrão</th>
                        <th className="px-6 py-4 text-center">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {catalogoItems.filter(i => i.tipo === catalogoTab).map(item => (
                        <tr key={item.id} className="hover:bg-slate-50">
                           <td className="px-6 py-4 font-bold text-slate-900">{item.nome}</td>
                           <td className="px-6 py-4 text-sm text-slate-500">{item.descricao || '-'}</td>
                           <td className="px-6 py-4 font-bold text-emerald-600">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco_padrao)}
                           </td>
                           <td className="px-6 py-4 text-center">
                              <button onClick={() => toggleCatalogoStatus(item.id, item.ativo)} className="text-slate-400 hover:text-emerald-500 transition-all">
                                 {item.ativo ? <ToggleRight className="w-8 h-8 text-emerald-500 mx-auto" /> : <ToggleLeft className="w-8 h-8 mx-auto" />}
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
               {catalogoItems.filter(i => i.tipo === catalogoTab).length === 0 && (
                  <div className="p-8 text-center text-slate-500">Nenhum {catalogoTab} cadastrado.</div>
               )}
            </div>
          </div>
        )}

        {/* CONTEÚDO: WHATSAPP */}
        {activeTab === 'whatsapp' && tenant && (
          <div className="p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-500" />
              Notificações WhatsApp
            </h2>
            <p className="text-slate-500 text-sm mb-8">Personalize as mensagens automáticas enviadas para seus clientes.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { key: 'os_aberta', label: 'Mensagem de Abertura de O.S.', desc: 'Enviada assim que a O.S. é criada.' },
                { key: 'os_pronta', label: 'Mensagem de Veículo Pronto', desc: 'Enviada quando o status muda para PRONTA.' },
                { key: 'nps', label: 'Pesquisa de Satisfação (NPS)', desc: 'Enviada 24h após o fechamento da O.S.' },
                { key: 'km_revisao', label: 'Lembrete de Revisão', desc: 'Enviada quando atinge o KM previsto.' },
              ].map(tpl => (
                <div key={tpl.key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-900 uppercase">{tpl.label}</label>
                    <span className="text-[10px] text-slate-400 font-medium">{tpl.desc}</span>
                  </div>
                  <textarea 
                    rows={4}
                    value={tenant.whatsapp_templates?.[tpl.key] || ''}
                    onChange={e => {
                      const newTpls = { ...tenant.whatsapp_templates, [tpl.key]: e.target.value };
                      setTenant({ ...tenant, whatsapp_templates: newTpls });
                    }}
                    className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm font-medium leading-relaxed bg-slate-50/50"
                  />
                  <div className="flex gap-2 flex-wrap">
                    {['{{cliente_nome}}', '{{os_numero}}', '{{veiculo_modelo}}', '{{veiculo_placa}}'].map(tag => (
                      <span key={tag} className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-500 font-mono italic">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 p-8 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center justify-between">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-emerald-200 rounded-full flex items-center justify-center text-emerald-700">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-emerald-900">Salvar alterações</p>
                  <p className="text-emerald-700/70 text-sm">Os modelos de mensagem serão aplicados imediatamente.</p>
                </div>
              </div>
              <button 
                onClick={handleUpdateWhatsApp}
                disabled={saving}
                className="px-10 py-4 bg-emerald-500 text-white rounded-2xl font-black hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Confirmar Atualização'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: NOVO USUÁRIO */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Novo Usuário</h3>
              <p className="text-slate-500 text-sm">Convide um colaborador para o painel.</p>
            </div>
            <form onSubmit={handleCreateUser} className="p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome Completo</label>
                <input 
                  type="text" required
                  value={newUser.nome}
                  onChange={e => setNewUser({...newUser, nome: e.target.value})}
                  className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-medium" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">E-mail de Acesso</label>
                <input 
                  type="email" required
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-medium" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Senha Provisória</label>
                <input 
                  type="password" required
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-medium" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Perfil de Acesso</label>
                <select 
                  value={newUser.perfil}
                  onChange={e => setNewUser({...newUser, perfil: e.target.value})}
                  className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-medium appearance-none bg-white"
                >
                  <option value="admin">Administrador</option>
                  <option value="gerente">Gerente</option>
                  <option value="atendente">Atendente</option>
                  <option value="mecanico">Mecânico</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 py-4 px-6 border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-4 px-6 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50"
                >
                  {saving ? 'Criando...' : 'Criar Acesso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: NOVO CATALOGO ITEM */}
      {showCatalogoModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100">
               <h3 className="text-xl font-bold text-slate-900">Novo Item no Catálogo</h3>
               <p className="text-slate-500 text-sm">Adicione um novo serviço ou peça pré-definida.</p>
            </div>
            <form onSubmit={handleCreateCatalogoItem} className="p-8 space-y-5">
               <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tipo</label>
                 <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                       <input type="radio" checked={newCatalogoItem.tipo === 'servico'} onChange={() => setNewCatalogoItem({...newCatalogoItem, tipo: 'servico'})} className="text-emerald-500 focus:ring-emerald-500" />
                       <span className="font-medium text-slate-700">Serviço</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                       <input type="radio" checked={newCatalogoItem.tipo === 'peca'} onChange={() => setNewCatalogoItem({...newCatalogoItem, tipo: 'peca'})} className="text-emerald-500 focus:ring-emerald-500" />
                       <span className="font-medium text-slate-700">Peça</span>
                    </label>
                 </div>
               </div>
               <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome do Item</label>
                 <input type="text" required value={newCatalogoItem.nome} onChange={e => setNewCatalogoItem({...newCatalogoItem, nome: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-medium" />
               </div>
               <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-500 uppercase ml-1">Descrição Opcional</label>
                 <textarea rows={2} value={newCatalogoItem.descricao} onChange={e => setNewCatalogoItem({...newCatalogoItem, descricao: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-medium" />
               </div>
               <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-500 uppercase ml-1">Preço Padrão (R$)</label>
                 <input type="number" step="0.01" min="0" required value={newCatalogoItem.preco_padrao} onChange={e => setNewCatalogoItem({...newCatalogoItem, preco_padrao: Number(e.target.value)})} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-medium" />
               </div>
               <div className="flex gap-4 pt-4">
                 <button type="button" onClick={() => setShowCatalogoModal(false)} className="flex-1 py-4 px-6 border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all">Cancelar</button>
                 <button type="submit" disabled={saving} className="flex-1 py-4 px-6 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50">{saving ? 'Salvando...' : 'Adicionar Item'}</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
