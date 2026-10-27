import { useCallback, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ToastContext } from './toast-context';
import type { Aviso, TipoToast } from './toast-context';

const ESTILOS: Record<TipoToast, string> = {
  sucesso: 'bg-emerald-700 text-white',
  erro: 'bg-maincourse-red text-white',
  info: 'bg-maincourse-navy text-white',
};

const ICONES: Record<TipoToast, string> = {
  sucesso: '✓',
  erro: '!',
  info: 'i',
};

/**
 * Substitui os `alert()` do navegador: no celular o alerta nativo trava a
 * tela e, em navegador embutido (Instagram/WhatsApp), às vezes nem aparece.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const proximoId = useRef(1);

  const avisar = useCallback((mensagem: string, tipo: TipoToast = 'sucesso') => {
    const id = proximoId.current++;
    setAvisos((atual) => [...atual, { id, tipo, mensagem }]);
    window.setTimeout(
      () => setAvisos((atual) => atual.filter((a) => a.id !== id)),
      tipo === 'erro' ? 7000 : 3500,
    );
  }, []);

  const valor = useMemo(() => ({ avisar }), [avisar]);

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        role="status"
        aria-live="polite"
      >
        {avisos.map((aviso) => (
          <div
            key={aviso.id}
            className={`pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${ESTILOS[aviso.tipo]}`}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 font-bold">
              {ICONES[aviso.tipo]}
            </span>
            <span className="flex-1">{aviso.mensagem}</span>
            <button
              type="button"
              onClick={() => setAvisos((atual) => atual.filter((a) => a.id !== aviso.id))}
              className="shrink-0 rounded px-1 text-white/80 hover:text-white"
              aria-label="Fechar aviso"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
