'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../services/api';
import { 
  TrendingUp, 
  Users, 
  Wrench, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  Clock,
  CarFront,
  MessageSquare,
  FileText,
  UserPlus,
  Target
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  faturamento_mes: number;
  os_abertas: number;
  total_clientes: number;
  os_em_atraso: number;
}

interface OSItem {
  id: string;
  status: string;
  valor_total: number;
  placa: string;
  modelo: string;
  mecanico_nome: string | null;
  created_at: string;
}

interface CRMAlert {
  id: string;
  nome: string;
  telefone: string;
  ultima_visita: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOS, setRecentOS] = useState<OSItem[]>([]);
  const [alerts, setAlerts] = useState<CRMAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [resStats, resOS, resAlerts] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/os?limit=5'),
        api.get('/comercial/clientes/alertas')
      ]);

      setStats(resStats.data);
      setRecentOS(resOS.data.ordens);
      setAlerts(resAlerts.data.alertas);
    } catch (err) {
      toast.error('Erro ao carregar dados do dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 italic">AutoSync Dashboard</h1>
        <p className="text-slate-500 mt-1 font-medium">Desempenho da oficina em tempo real.</p>
      </header>

      {/* Ações Rápidas */}
      <div className="flex flex-wrap gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl shadow-slate-900/10">
        <button 
          onClick={() => router.push('/os?acao=novo')}
          className="flex-1 min-w-[200px] h-[60px] flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.02]"
        >
          <FileText className="w-6 h-6" />
          <span className="text-xl font-bold">+ Nova O.S.</span>
        </button>
        <button 
          onClick={() => router.push('/clientes?acao=novo')}
          className="flex-1 min-w-[200px] h-[60px] flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-6 rounded-2xl transition-all hover:scale-[1.02]"
        >
          <UserPlus className="w-6 h-6" />
          <span className="text-xl font-bold">+ Novo Cliente</span>
        </button>
        <button 
          onClick={() => router.push('/leads?acao=novo')}
          className="flex-1 min-w-[200px] h-[60px] flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-6 rounded-2xl transition-all hover:scale-[1.02]"
        >
          <Target className="w-6 h-6" />
          <span className="text-xl font-bold">+ Novo Lead</span>
        </button>
      </div>

      {/* Métricas de Alto Nível */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Faturamento */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Faturamento Mês</span>
            <div className="p-3 bg-emerald-500 text-white rounded-2xl group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
              {formatCurrency(stats?.faturamento_mes || 0)}
            </h3>
            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              +12% em relação ao mês anterior
            </p>
          </div>
        </div>

        {/* O.S. Ativas */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm group hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">O.S. Ativas</span>
            <div className="p-3 bg-blue-500 text-white rounded-2xl group-hover:scale-110 transition-transform">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stats?.os_abertas || 0}</h3>
            <p className="text-xs font-bold text-slate-500">Veículos no pátio agora</p>
          </div>
        </div>

        {/* Clientes */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm group hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Base de Clientes</span>
            <div className="p-3 bg-purple-500 text-white rounded-2xl group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stats?.total_clientes || 0}</h3>
            <p className="text-xs font-bold text-slate-500">Cadastros ativos</p>
          </div>
        </div>

        {/* Atrasos */}
        <div className={`p-6 rounded-[2rem] border transition-all duration-300 ${
          (stats?.os_em_atraso || 0) > 0 
            ? 'bg-rose-50 border-rose-200 shadow-rose-100 shadow-lg' 
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs font-black uppercase tracking-widest ${
              (stats?.os_em_atraso || 0) > 0 ? 'text-rose-400' : 'text-slate-400'
            }`}>
              Em Atraso
            </span>
            <div className={`p-3 rounded-2xl ${
              (stats?.os_em_atraso || 0) > 0 ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400'
            }`}>
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className={`text-4xl font-black tracking-tighter ${
              (stats?.os_em_atraso || 0) > 0 ? 'text-rose-700' : 'text-slate-900'
            }`}>
              {stats?.os_em_atraso || 0}
            </h3>
            <p className={`text-xs font-bold ${
              (stats?.os_em_atraso || 0) > 0 ? 'text-rose-600' : 'text-slate-500'
            }`}>
              { (stats?.os_em_atraso || 0) > 0 ? 'Excedendo 3 dias sem fechar' : 'Fluxo dentro do prazo' }
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tabela de Ultimas O.S */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Últimas Atividades</h2>
            <Link href="/os" className="text-xs font-black uppercase text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-all">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Veículo</th>
                  <th className="px-6 py-4">Responsável</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {recentOS.map((os) => (
                  <tr key={os.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                          <CarFront className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 uppercase leading-none">{os.placa}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{os.modelo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                           {os.mecanico_nome?.[0] || '?'}
                         </div>
                         <span className="font-medium text-slate-600">{os.mecanico_nome || 'A definir'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        os.status === 'aberta' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        os.status === 'em_andamento' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {os.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right font-black text-slate-900">
                      {formatCurrency(os.valor_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CRM / Alertas Pró-ativos */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            CRM: Alertas de Retorno
            <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded-md text-[10px] font-black uppercase">Fazer Contato</span>
          </h2>
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 text-center">
                 <p className="text-slate-400 text-sm font-medium">Nenhum cliente com retorno pendente hoje.</p>
              </div>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm hover:shadow-md transition-all group">
                   <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 leading-none">{alert.nome}</h4>
                          <p className="text-[10px] font-bold text-slate-400 mt-1">{alert.telefone}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-md uppercase">
                        +90 Dias
                      </span>
                   </div>
                   <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px] font-bold">Última OS: {new Date(alert.ultima_visita).toLocaleDateString()}</span>
                      </div>
                      <button className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-110 transition-all">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              ))
            )}

            <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden">
               <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
               <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Dica de Gestão</p>
               <p className="text-sm font-medium leading-relaxed">
                 Clientes que não voltam há 3 meses têm 80% de chance de churn. Use o botão do WhatsApp ao lado para oferecer um check-up gratuito!
               </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
