'use client';

import React, { useState } from 'react';
import { api } from '@/services/api';
import { X, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type NewClientModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function NewClientModal({ isOpen, onClose, onSuccess }: NewClientModalProps) {
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [newClient, setNewClient] = useState({
    nome: '',
    telefone: '',
    email: '',
    cpf: ''
  });

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingClient(true);
    try {
      await api.post('/comercial/clientes', newClient);
      toast.success('Cliente cadastrado com sucesso!');
      setNewClient({ nome: '', telefone: '', email: '', cpf: '' });
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao cadastrar cliente. Verifique os dados.');
    } finally {
      setIsSavingClient(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-black text-slate-900 text-lg">Cadastrar Novo Cliente</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
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
              onClick={onClose}
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
  );
}
