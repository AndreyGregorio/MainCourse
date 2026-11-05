import type { ReactNode } from 'react';
import type { RotaId } from '../../lib/rotas';
import type { Dados } from '../../hooks/useDados';
import { IconeDespensa, IconeIngrediente, IconePrato, IconeReceita, IconeSeta } from '../ui/Icones';

type Props = {
  dados: Dados;
  irPara: (rota: RotaId) => void;
};

function Indicador({
  valor,
  rotulo,
  aoAbrir,
  icone,
}: {
  valor: number;
  rotulo: string;
  aoAbrir: () => void;
  icone: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={aoAbrir}
      className="group rounded-2xl border border-maincourse-navy/10 bg-white px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-maincourse-gold/50 hover:shadow-soft"
      aria-label={`Abrir ${rotulo}`}
    >
      <span className="flex items-center justify-between text-maincourse-navy/40">
        {icone}
        <IconeSeta className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
      </span>
      <span className="mt-2 block font-display text-3xl font-bold leading-none text-maincourse-navy">
        {valor}
      </span>
      <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wide text-maincourse-navy/45">
        {rotulo}
      </span>
    </button>
  );
}

export function PainelInicio({ dados, irPara }: Props) {
  const { pratos, ingredientes, receitas, despensa } = dados;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <h1 className="text-center font-display text-3xl font-bold text-maincourse-navy sm:text-4xl">
        Painel de Controle
      </h1>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Resumo do cadastro">
        <Indicador
          valor={pratos.length}
          rotulo="Pratos"
          icone={<IconePrato className="h-5 w-5" />}
          aoAbrir={() => irPara('pratos')}
        />
        <Indicador
          valor={ingredientes.length}
          rotulo="Ingredientes"
          icone={<IconeIngrediente className="h-5 w-5" />}
          aoAbrir={() => irPara('ingredientes')}
        />
        <Indicador
          valor={receitas.length}
          rotulo="Receitas"
          icone={<IconeReceita className="h-5 w-5" />}
          aoAbrir={() => irPara('receitas')}
        />
        <Indicador
          valor={despensa.length}
          rotulo="Despensa"
          icone={<IconeDespensa className="h-5 w-5" />}
          aoAbrir={() => irPara('despensa')}
        />
      </section>
    </div>
  );
}
