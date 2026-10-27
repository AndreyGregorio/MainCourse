import { TAGLINE } from '../lib/constants';
import { formatarAtualizacao } from '../lib/utils';
import { Logo } from './Logo';

type Props = {
  online: boolean;
  daCache: boolean;
  atualizadoEm: Date | null;
};

export function Cabecalho({ online, daCache, atualizadoEm }: Props) {
  const mostrarAviso = !online || daCache;

  return (
    <header className="sticky top-0 z-40 border-b border-maincourse-gold/30 bg-maincourse-navy text-white shadow-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Logo tamanho={52} />
          <div className="min-w-0">
            <span className="block font-display text-xl font-bold leading-none tracking-wide sm:text-2xl">
              <span className="text-white">Main</span>
              <span className="text-maincourse-gold-light">Course</span>
            </span>
            <span className="mt-1 hidden truncate text-xs text-white/55 sm:block">{TAGLINE}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ${
              online
                ? 'bg-emerald-400/10 text-emerald-200'
                : 'bg-maincourse-gold/15 text-maincourse-gold-light'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                online ? 'bg-emerald-300' : 'bg-maincourse-gold-light'
              }`}
            />
            {online ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {mostrarAviso && (
        <div className="bg-maincourse-gold px-4 py-1 text-center text-[11px] font-bold text-maincourse-navy sm:text-xs">
          {online
            ? 'Mostrando dados salvos no aparelho — sincronizando…'
            : 'Sem internet — os dados salvos continuam disponíveis.'}
        </div>
      )}

      {!mostrarAviso && atualizadoEm && (
        <div className="bg-maincourse-navy-soft px-4 py-1 text-center text-[11px] font-medium text-white/60">
          Sincronizado às {formatarAtualizacao(atualizadoEm)}
        </div>
      )}
    </header>
  );
}
