import { useMemo } from 'react';
import type { Dados } from '../hooks/useDados';
import type { Acoes } from '../hooks/useAcoes';
import type { Parametros } from '../hooks/useRota';
import type { RotaId } from '../lib/rotas';
import { ROTAS } from '../lib/rotas';
import { PainelInicio } from './painel/PainelInicio';
import { GestaoPratos } from './painel/GestaoPratos';
import { GestaoIngredientes } from './painel/GestaoIngredientes';
import { GestaoReceitas } from './painel/GestaoReceitas';
import { GestaoDespensa } from './painel/GestaoDespensa';

type Props = {
  rota: RotaId;
  parametros: Parametros;
  irPara: (rota: RotaId, parametros?: Parametros) => void;
  dados: Dados;
  acoes: Acoes;
};

export function TelaPainel({ rota, parametros, irPara, dados, acoes }: Props) {
  const receitasPorPrato = useMemo(
    () =>
      new Map(
        [...dados.receitasPorPrato.entries()].map(([pratoId, receitas]) => [
          pratoId,
          receitas.length,
        ]),
      ),
    [dados.receitasPorPrato],
  );

  const usosPorIngrediente = useMemo(
    () =>
      new Map(
        [...dados.receitasPorIngrediente.entries()].map(([ingredienteId, receitas]) => [
          ingredienteId,
          receitas.length,
        ]),
      ),
    [dados.receitasPorIngrediente],
  );

  const pratoInicial = rota === 'receitas' ? parametros.prato : undefined;
  const tituloRota = ROTAS.find((item) => item.id === rota)?.rotulo ?? '';

  return (
    <div data-rota={rota} className="pb-4">
      <span className="sr-only" aria-live="polite">
        {tituloRota}
      </span>

      {rota === 'inicio' && <PainelInicio dados={dados} irPara={irPara} />}

      {rota === 'pratos' && (
        <GestaoPratos
          pratos={dados.pratos}
          receitasPorPrato={receitasPorPrato}
          aoSalvar={acoes.salvarPrato}
          aoRemover={acoes.removerPrato}
          aoAbrirReceitas={(pratoId) => irPara('receitas', { prato: pratoId })}
        />
      )}

      {rota === 'ingredientes' && (
        <GestaoIngredientes
          ingredientes={dados.ingredientes}
          usosPorIngrediente={usosPorIngrediente}
          aoCriar={acoes.criarIngrediente}
          aoAtualizarUnidade={acoes.atualizarUnidade}
          aoRemover={acoes.removerIngrediente}
        />
      )}

      {rota === 'receitas' && (
        <GestaoReceitas
          key={pratoInicial ?? 'todas'}
          pratos={dados.pratos}
          ingredientes={dados.ingredientes}
          receitas={dados.receitas}
          receitasPorPrato={dados.receitasPorPrato}
          aoIncluir={acoes.incluirReceita}
          aoAlterar={acoes.alterarQuantidadeReceita}
          aoExcluir={acoes.excluirReceita}
          irPara={irPara}
          pratoInicial={pratoInicial}
        />
      )}

      {rota === 'despensa' && (
        <GestaoDespensa
          itens={dados.despensa}
          porCategoria={dados.despensaPorCategoria}
          aoIncluir={acoes.incluirItemDespensa}
          aoAlterar={acoes.alterarItemDespensa}
          aoExcluir={acoes.excluirItemDespensa}
        />
      )}
    </div>
  );
}
