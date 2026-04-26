'use client';

import React, { useState } from 'react';
import { api } from '@/services/api';
import { X, Save, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

type NewLeadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function NewLeadModal({ isOpen, onClose, onSuccess }: NewLeadModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [origem, setOrigem] = useState('organico');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await api.post('/comercial/leads', { nome, telefone, origem });
      toast.success('Lead capturado com sucesso!');
      setNome('');
      setTelefone('');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erro ao criar lead';
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <UserPlus className="w-4 h-4" />
            </div>
            <h3 className="font-black text-slate-900 text-lg">Novo Lead</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form className="p-6 space-y-5" onSubmit={handleCreate}>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Lead</label>
            <input 
              required 
              type="text" 
              placeholder="Ex: João da Silva"
              value={nome} 
              onChange={e => setNome(e.target.value)} 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">WhatsApp</label>
            <input 
              required 
              type="text" 
              placeholder="(00) 00000-0000"
              value={telefone} 
              onChange={e => setTelefone(e.target.value)} 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Canal de Origem</label>
            <select 
              value={origem}
              onChange={e => setOrigem(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-600 text-sm"
            >
              <option value="organico">Orgânico</option>
              <option value="google">Google Ads</option>
              <option value="instagram">Instagram</option>
              <option value="indicacao">Indicação</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div className="pt-2 flex gap-3">
             <button 
                type="button" 
                onClick={onClose}
                className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
             >
                Cancelar
             </button>
             <button 
                disabled={isCreating} 
                type="submit" 
                className="flex-[2] group relative overflow-hidden bg-slate-900 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
             >
                <div className="flex items-center justify-center gap-2">
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 transition-transform group-hover:scale-110" />}
                  Cadastrar Lead
                </div>
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
