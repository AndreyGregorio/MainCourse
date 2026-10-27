import type { Ingrediente, Prato, Unidade } from '../types';
import { GestaoPratos } from './painel/GestaoPratos';
import { GestaoIngredientes } from './painel/GestaoIngredientes';

type Props = {
  pratos: Prato[];
  ingredientes: Ingrediente[];
  aoSalvarPrato: (nome: string, nomeOriginal?: string) => Promise<boolean>;
  aoRemoverPrato: (nome: string) => Promise<boolean>;
  aoCriarIngrediente: (nome: string, unidade: Unidade) => Promise<boolean>;
  aoAtualizarUnidade: (nome: string, unidade: Unidade) => Promise<boolean>;
  aoRemoverIngrediente: (nome: string) => Promise<boolean>;
};

function Indicador({ valor, rotulo }: { valor: string | number; rotulo: string }) {
  return (
    <div className="rounded-2xl border border-maincourse-navy/10 bg-white px-4 py-3 text-center shadow-sm">
      <span className="block font-display text-2xl font-bold leading-none text-maincourse-navy">
        {valor}
      </span>
      <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wide text-maincourse-navy/45">
        {rotulo}
      </span>
    </div>
  );
}

export function TelaPainel({
  pratos,
  ingredientes,
  aoSalvarPrato,
  aoRemoverPrato,
  aoCriarIngrediente,
  aoAtualizarUnidade,
  aoRemoverIngrediente,
}: Props) {
  const unidadesEmUso = new Set(ingredientes.map((item) => item.unidade_medida)).size;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="text-center">
        <h1 className="font-display text-3xl font-bold text-maincourse-navy sm:text-4xl">
          Painel de Controle
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-maincourse-navy/55 sm:text-base">
          Cadastre os pratos e os ingredientes da casa
        </p>
      </section>

      <section className="grid grid-cols-3 gap-3" aria-label="Resumo do cadastro">
        <Indicador valor={pratos.length} rotulo="Pratos" />
        <Indicador valor={ingredientes.length} rotulo="Ingredientes" />
        <Indicador valor={unidadesEmUso} rotulo="Unidades em uso" />
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <GestaoPratos pratos={pratos} aoSalvar={aoSalvarPrato} aoRemover={aoRemoverPrato} />
        <GestaoIngredientes
          ingredientes={ingredientes}
          aoCriar={aoCriarIngrediente}
          aoAtualizarUnidade={aoAtualizarUnidade}
          aoRemover={aoRemoverIngrediente}
        />
      </div>
    </div>
  );
}
