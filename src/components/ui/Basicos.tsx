import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react';

/* ------------------------------------------------------------------ */
/* Botão                                                               */
/* ------------------------------------------------------------------ */

type Variante = 'primario' | 'secundario' | 'perigo' | 'dourado' | 'fantasma';

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-maincourse-navy text-white hover:bg-maincourse-navy-soft',
  secundario:
    'border border-maincourse-navy/25 bg-white/70 text-maincourse-navy hover:bg-maincourse-navy/5',
  perigo: 'bg-maincourse-red/10 text-maincourse-red hover:bg-maincourse-red/15',
  dourado: 'bg-maincourse-gold text-maincourse-navy hover:bg-maincourse-gold-light',
  fantasma: 'text-maincourse-navy hover:bg-maincourse-navy/5',
};

type PropsBotao = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  carregando?: boolean;
};

export function Botao({
  variante = 'primario',
  carregando = false,
  className = '',
  children,
  disabled,
  ...resto
}: PropsBotao) {
  return (
    <button
      {...resto}
      disabled={disabled || carregando}
      className={`inline-flex touch-manipulation items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 sm:text-base ${VARIANTES[variante]} ${className}`}
    >
      {carregando && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Campos                                                              */
/* ------------------------------------------------------------------ */

const CLASSE_CAMPO =
  'w-full rounded-xl border border-maincourse-navy/15 bg-white p-3 text-base text-maincourse-navy outline-none transition placeholder:text-maincourse-navy/35 focus:border-maincourse-gold focus:ring-2 focus:ring-maincourse-gold/25 disabled:cursor-not-allowed disabled:bg-maincourse-navy/5';

type PropsCampo = {
  rotulo: string;
  dica?: string;
  children: ReactNode;
  className?: string;
};

export function Campo({ rotulo, dica, children, className = '' }: PropsCampo) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-semibold text-maincourse-navy/75">{rotulo}</span>
      {children}
      {dica && <span className="mt-1 block text-xs text-maincourse-navy/45">{dica}</span>}
    </label>
  );
}

export function Entrada({ className = '', ...resto }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...resto} className={`${CLASSE_CAMPO} ${className}`} />;
}

export function Selecao({
  className = '',
  children,
  ...resto
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...resto} className={`${CLASSE_CAMPO} ${className}`}>
      {children}
    </select>
  );
}

/* ------------------------------------------------------------------ */
/* Diversos                                                            */
/* ------------------------------------------------------------------ */

export function EstadoVazio({
  titulo,
  detalhe,
  icone = '📭',
}: {
  titulo: string;
  detalhe?: string;
  icone?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-maincourse-navy/20 bg-maincourse-cream/60 p-8 text-center">
      <div className="mb-2 text-3xl" aria-hidden="true">
        {icone}
      </div>
      <p className="font-semibold text-maincourse-navy">{titulo}</p>
      {detalhe && <p className="mt-1 text-sm text-maincourse-navy/50">{detalhe}</p>}
    </div>
  );
}

export function Selo({
  children,
  tom = 'navy',
}: {
  children: ReactNode;
  tom?: 'navy' | 'gold' | 'cinza';
}) {
  const tons = {
    navy: 'bg-maincourse-navy/8 text-maincourse-navy',
    gold: 'bg-maincourse-gold/20 text-maincourse-navy',
    cinza: 'bg-maincourse-navy/5 text-maincourse-navy/55',
  } as const;

  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${tons[tom]}`}>{children}</span>
  );
}

export function SecaoCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-maincourse-navy/10 bg-white p-5 shadow-soft sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}
