'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  User, Phone, Mail, MapPin, 
  Car, History, DollarSign, TrendingUp, 
  Plus, ArrowLeft, Calendar, ShieldCheck
} from 'lucide-react';
import { api } from '@/services/api';

interface Client {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
}

interface Vehicle {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  km_atual: number;
  km_proxima_revisao: number;
}

interface OS {
  id: string;
  created_at: string;
  veiculo_id: string;
  status: string;
  valor_total: number;
  placa?: string;
}

export default function ClienteProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [resumo, setResumo] = useState<any>(null);
  const [veiculos, setVeiculos] = useState<Vehicle[]>([]);
  const [historico, setHistorico] = useState<OS[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [clientRes, resumoRes, veiculosRes, osRes] = await Promise.all([
          api.get(`/comercial/clientes`), // We'll filter in JS if no specific GET /clientes/:id exists, but I should have one.
          api.get(`/comercial/clientes/${id}/resumo`),
          api.get(`/comercial/veiculos/cliente/${id}`),
          api.get(`/os?cliente_id=${id}`)
        ]);

        const targetClient = clientRes.data.clientes.find((c: any) => c.id === id);
        setClient(targetClient);
        setResumo(resumoRes.data);
        setVeiculos(veiculosRes.data.veiculos);
        setHistorico(osRes.data.ordens);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) return <div className="p-8">Carregando...</div>;
  if (!client) return <div className="p-8">Cliente não encontrado.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">{client.nome}</h1>
            <p className="text-slate-500">Perfil do Cliente & Histórico</p>
          </div>
        </div>
        <button className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm">
          Editar Cadastro
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Esquerda: Dados e Resumo */}
        <div className="space-y-8">
          {/* Dados do Cliente */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-500" /> Dados Pessoais
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-600">
                <Phone className="w-4 h-4" />
                <span>{client.telefone}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Mail className="w-4 h-4" />
                <span>{client.email || 'Nenhum e-mail cadastrado'}</span>
              </div>
            </div>
          </div>

          {/* Resumo Financeiro */}
          <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg shadow-indigo-100 text-white space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Resumo de Fidelidade
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 p-4 rounded-xl">
                <p className="text-indigo-100 text-xs uppercase font-bold">Total Gasto</p>
                <p className="text-2xl font-black">R$ {resumo?.total_gasto?.toLocaleString('pt-BR') || '0,00'}</p>
              </div>
              <div className="bg-white/10 p-4 rounded-xl">
                <p className="text-indigo-100 text-xs uppercase font-bold">Visitas</p>
                <p className="text-2xl font-black">{resumo?.total_visitas || 0}</p>
              </div>
            </div>
            <div className="bg-white/10 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-xs uppercase font-bold">Última Visita</p>
                <p className="font-bold">{resumo?.última_visita ? new Date(resumo.última_visita).toLocaleDateString('pt-BR') : 'Nunca'}</p>
              </div>
              <Calendar className="w-8 h-8 opacity-20" />
            </div>
          </div>
        </div>

        {/* Coluna Central/Direita: Veículos e Histórico */}
        <div className="lg:col-span-2 space-y-8">
          {/* Veículos */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Car className="w-5 h-5 text-indigo-500" /> Veículos Vinculados
              </h2>
              <button className="text-indigo-600 text-sm font-bold flex items-center gap-1 hover:underline">
                <Plus className="w-4 h-4" /> Novo Veículo
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {veiculos.map(v => (
                <div key={v.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50 hover:border-indigo-200 transition-colors group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-white border-2 border-slate-900 px-2 py-0.5 rounded font-mono text-sm font-bold">
                      {v.placa}
                    </span>
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h3 className="font-bold text-slate-900">{v.marca} {v.modelo}</h3>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <div>
                      <p>KM ATUAL</p>
                      <p className="font-bold text-slate-700">{v.km_atual} km</p>
                    </div>
                    <div>
                      <p>PRÓX. REVISÃO</p>
                      <p className="font-bold text-indigo-600">{v.km_proxima_revisao} km</p>
                    </div>
                  </div>
                </div>
              ))}
              {veiculos.length === 0 && <p className="text-slate-400 text-sm italic">Nenhum veículo cadastrado.</p>}
            </div>
          </div>

          {/* Histórico de OS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-500" /> Histórico de Serviços
            </h2>
            <div className="overflow-hidden border border-slate-100 rounded-xl">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                  <tr>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Veículo</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historico.map(os => (
                    <tr 
                      key={os.id} 
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/os/${os.id}`)}
                    >
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {new Date(os.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-900 font-mono">
                        {os.placa || 'Veículo'}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          os.status === 'fechada' ? 'bg-emerald-100 text-emerald-700' : 
                          os.status === 'cancelada' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {os.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-right font-bold text-slate-900">
                        R$ {os.valor_total?.toLocaleString('pt-BR') || '0,00'}
                      </td>
                    </tr>
                  ))}
                  {historico.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm">
                        Nenhuma ordem de serviço encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
