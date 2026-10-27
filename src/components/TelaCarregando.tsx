import { Logo } from './Logo';

type Props = {
  mensagem?: string;
};

export function TelaCarregando({ mensagem = 'Conectando...' }: Props) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-maincourse-cream p-6 text-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Logo tamanho={64} />
      <div className="h-1 w-40 overflow-hidden rounded-full bg-maincourse-navy/10">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-maincourse-gold" />
      </div>
      <p className="font-display text-lg font-bold text-maincourse-navy">{mensagem}</p>
    </div>
  );
}
