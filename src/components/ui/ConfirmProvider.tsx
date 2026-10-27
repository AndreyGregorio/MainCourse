import { useCallback, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ConfirmContext } from './confirm-context';
import type { OpcoesConfirmacao } from './confirm-context';

type Pendente = OpcoesConfirmacao & { resolver: (valor: boolean) => void };

/**
 * Diálogo de confirmação próprio, no lugar do `window.confirm`.
 * O nativo é feio no celular e some quando o app roda dentro de um WebView.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pendente, setPendente] = useState<Pendente | null>(null);
  const ultimoFoco = useRef<HTMLElement | null>(null);

  const confirmar = useCallback(
    (opcoes: OpcoesConfirmacao) =>
      new Promise<boolean>((resolver) => {
        ultimoFoco.current = document.activeElement as HTMLElement | null;
        setPendente({ ...opcoes, resolver });
      }),
    [],
  );

  const responder = useCallback((valor: boolean) => {
    setPendente((atual) => {
      atual?.resolver(valor);
      return null;
    });
    ultimoFoco.current?.focus?.();
  }, []);

  const valor = useMemo(() => ({ confirmar }), [confirmar]);

  return (
    <ConfirmContext.Provider value={valor}>
      {children}
      {pendente && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-maincourse-navy/50 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={pendente.titulo}
          onKeyDown={(e) => {
            if (e.key === 'Escape') responder(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="font-display text-lg font-bold text-maincourse-navy">
              {pendente.titulo}
            </h2>
            {pendente.descricao && (
              <p className="mt-2 text-sm leading-relaxed text-maincourse-navy/60">
                {pendente.descricao}
              </p>
            )}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                autoFocus
                onClick={() => responder(false)}
                data-testid="cancelar"
                className="rounded-xl border border-maincourse-navy/20 px-5 py-3 font-semibold text-maincourse-navy/70 transition hover:bg-maincourse-navy/5"
              >
                {pendente.textoCancelar ?? 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={() => responder(true)}
                data-testid="confirmar"
                className={`rounded-xl px-5 py-3 font-bold text-white transition ${
                  pendente.perigoso
                    ? 'bg-maincourse-red hover:bg-maincourse-red/85'
                    : 'bg-maincourse-navy hover:bg-maincourse-navy-soft'
                }`}
              >
                {pendente.textoConfirmar ?? 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
