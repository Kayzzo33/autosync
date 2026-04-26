'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';

function CadastroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    nome_oficina: '',
    nome_usuario: '',
    email: '',
    senha: '',
    confirmar_senha: ''
  });

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }

    // Validar convite
    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/validar-convite?token=${token}`)
      .then(() => setLoading(false))
      .catch(() => router.replace('/login'));
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.senha !== formData.confirmar_senha) {
      setError('As senhas não coincidem');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/cadastro`, {
        token,
        ...formData
      });

      if (data.accessToken) {
        Cookies.set('autosync_token', data.accessToken);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao realizar cadastro');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">Validando convite...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Criar Conta</h1>
          <p className="text-zinc-400 mt-2 text-sm">Bem-vindo ao AutoSync ERP</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400 text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Nome da Oficina</label>
            <input
              required
              value={formData.nome_oficina}
              onChange={e => setFormData({...formData, nome_oficina: e.target.value})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Seu Nome</label>
            <input
              required
              value={formData.nome_usuario}
              onChange={e => setFormData({...formData, nome_usuario: e.target.value})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">E-mail Administrativo</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Senha</label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.senha}
              onChange={e => setFormData({...formData, senha: e.target.value})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Confirmar Senha</label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.confirmar_senha}
              onChange={e => setFormData({...formData, confirmar_senha: e.target.value})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-3 rounded-lg mt-6 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Criando Conta...' : 'Finalizar Cadastro'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CadastroPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">Carregando...</div>}>
      <CadastroForm />
    </Suspense>
  );
}
