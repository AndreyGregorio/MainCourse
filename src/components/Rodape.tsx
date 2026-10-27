import { NOME_APP, URL_REPOSITORIO, VERSAO } from '../lib/constants';

export function Rodape() {
  return (
    <footer className="border-t border-maincourse-navy/10 bg-maincourse-cream">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-center text-xs text-maincourse-navy/45 sm:flex-row sm:px-6 sm:text-left">
        <p>
          <span className="font-semibold text-maincourse-navy/65">{NOME_APP}</span> · MC-2026 · v{VERSAO}
        </p>
        <p>
          React + Firebase ·{' '}
          <a
            href={URL_REPOSITORIO}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-maincourse-navy/65 underline decoration-maincourse-gold/50 underline-offset-2 transition hover:text-maincourse-navy"
          >
            GitHub
          </a>{' '}
          · GitHub Pages
        </p>
      </div>
    </footer>
  );
}
