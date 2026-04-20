'use client';

import { useState } from 'react';
import { MessageSquare, X, Send, Loader2, Phone } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'sonner';

type Cliente = {
  id: string;
  nome: string;
  telefone: string;
};

type Props = {
  cliente: Cliente;
  onClose: () => void;
};

const DEFAULT_MESSAGE = (nome: string) =>
  `Olá ${nome}! Tudo bem? 😊\n\nEntramos em contato para informar sobre o status do seu veículo.\n\nQualquer dúvida, estamos à disposição!`;

export default function SendWhatsAppModal({ cliente, onClose }: Props) {
  const [content, setContent] = useState(DEFAULT_MESSAGE(cliente.nome.split(' ')[0]));
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!content.trim()) {
      toast.error('Digite uma mensagem antes de enviar.');
      return;
    }

    setIsSending(true);
    try {
      const { data } = await api.post('/messages/send-manual', {
        client_id: cliente.id,
        content: content.trim(),
      });

      // Abre a URL do WhatsApp em nova aba
      window.open(data.waUrl, '_blank', 'noopener,noreferrer');

      toast.success(`Redirecionando para WhatsApp de ${data.clientNome}!`);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Erro ao preparar envio.';
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  const charCount = content.length;
  const isOverLimit = charCount > 4096;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">Enviar Mensagem</h3>
              <p className="text-green-100 text-xs">{cliente.nome}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Info do cliente */}
          <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
            <Phone className="w-4 h-4 text-green-600 shrink-0" />
            <div>
              <p className="text-xs text-green-700 font-bold uppercase tracking-wide">Destino (wa.me)</p>
              <p className="text-sm font-mono text-green-800 font-semibold">
                {cliente.telefone || 'Sem telefone'}
              </p>
            </div>
          </div>

          {/* Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Mensagem
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all resize-none text-sm text-slate-700 leading-relaxed ${
                isOverLimit ? 'border-red-300 bg-red-50' : 'border-slate-200'
              }`}
              placeholder="Digite a mensagem..."
            />
            <p className={`text-right text-xs mt-1 ${isOverLimit ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
              {charCount}/4096
            </p>
          </div>

          {/* Aviso modo manual */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
            <span className="text-amber-500 text-base mt-0.5">⚡</span>
            <p className="text-xs text-amber-700 leading-relaxed">
              <strong>Modo Manual:</strong> Você será redirecionado para o WhatsApp Web com a mensagem preenchida. 
              Basta clicar em <em>Enviar</em> no WhatsApp.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="flex-1 py-3 px-4 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || isOverLimit || !content.trim()}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Abrir WhatsApp
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
