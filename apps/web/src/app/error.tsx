'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Next.js Error Boundary caught an error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-slate-900">
      <div className="max-w-md w-full bg-white rounded-[2rem] p-8 border border-slate-200 shadow-xl text-center space-y-6">
        <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-3xl flex items-center justify-center mx-auto">
          <AlertTriangle className="w-10 h-10" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-black italic tracking-tight">Ops! Erro no Sistema.</h1>
          <p className="text-slate-500 font-medium leading-relaxed">
            Não conseguimos processar esta página. Isso geralmente acontece quando o servidor principal (API) está instável ou desconectado.
          </p>
        </div>

        <div className="pt-4 space-y-3">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          >
            <RefreshCw className="w-5 h-5" />
            Tentar Novamente
          </button>
          
          <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest pt-2">
            Código do Erro: {error.digest || '500_INTERNAL_SERVER_ERROR'}
          </p>
        </div>
      </div>
    </div>
  );
}
