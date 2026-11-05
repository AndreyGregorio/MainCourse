import { useCallback } from 'react';
import type { ItemDespensa, ReceitaDetalhada, Unidade } from '../types';
import * as acoes from '../lib/acoes';
import type { DadosItemDespensa } from '../lib/acoes';
import { idSeguro, listarNomes, mensagemDeErro, pluralizar } from '../lib/utils';
import { useConfirm } from '../components/ui/confirm-context';
import { useToast } from '../components/ui/toast-context';
import type { Dados } from './useDados';

export type Acoes = {
  salvarPrato: (nome: string, nomeOriginal?: string) => Promise<boolean>;
  removerPrato: (nome: string) => Promise<boolean>;
  criarIngrediente: (nome: string, unidade: Unidade) => Promise<boolean>;
  atualizarUnidade: (nome: string, unidade: Unidade) => Promise<boolean>;
  removerIngrediente: (nome: string) => Promise<boolean>;
  incluirReceita: (
    pratoId: string,
    ingredienteId: string,
    quantidadePorPessoa: number,
  ) => Promise<boolean>;
  alterarQuantidadeReceita: (receitaId: string, quantidade: number) => Promise<boolean>;
  excluirReceita: (receita: ReceitaDetalhada) => Promise<boolean>;
  incluirItemDespensa: (nome: string, dados: DadosItemDespensa) => Promise<boolean>;
  alterarItemDespensa: (item: ItemDespensa, dados: DadosItemDespensa) => Promise<boolean>;
  excluirItemDespensa: (item: ItemDespensa) => Promise<boolean>;
};

/**
 * Liga as ações de escrita ao diálogo de confirmação e aos avisos.
 *
 * Os bloqueios de negócio aparecem antes da confirmação (o usuário vê o motivo
 * sem abrir o diálogo) e são revalidados na camada de ações, para o caso de os
 * dados da tela estarem desatualizados.
 */
export function useAcoes(dados: Dados): Acoes {
  const { avisar } = useToast();
  const confirmar = useConfirm();

  const executar = useCallback(
    async (acao: () => Promise<void>, sucesso: string): Promise<boolean> => {
      try {
        await acao();
        avisar(sucesso);
        return true;
      } catch (falha) {
        avisar(mensagemDeErro(falha), 'erro');
        return false;
      }
    },
    [avisar],
  );

  const informarBloqueio = useCallback(
    (mensagem: string) => {
      avisar(mensagem, 'erro');
      return false;
    },
    [avisar],
  );

  const salvarPrato = useCallback(
    (nome: string, nomeOriginal?: string) => {
      const receitas = nomeOriginal
        ? (dados.receitasPorPrato.get(idSeguro(nomeOriginal))?.length ?? 0)
        : 0;
      const mensagem = !nomeOriginal
        ? 'Prato adicionado.'
        : receitas > 0
          ? `Prato renomeado e ${pluralizar(receitas, 'receita atualizada', 'receitas atualizadas')}.`
          : 'Prato atualizado.';
      return executar(() => acoes.salvarPrato(nome, nomeOriginal), mensagem);
    },
    [dados.receitasPorPrato, executar],
  );

  const removerPrato = useCallback(
    async (nome: string) => {
      const receitas = dados.receitasPorPrato.get(idSeguro(nome))?.length ?? 0;
      const confirmou = await confirmar({
        titulo: `Excluir “${nome}”?`,
        descricao:
          receitas > 0
            ? `As ${receitas} receita(s) deste prato também serão excluídas. Esta ação não pode ser desfeita.`
            : 'O prato sai do cadastro. Esta ação não pode ser desfeita.',
        textoConfirmar: 'Excluir prato',
        perigoso: true,
      });
      if (!confirmou) return false;
      return executar(() => acoes.removerPrato(nome), 'Prato excluído.');
    },
    [confirmar, dados.receitasPorPrato, executar],
  );

  const criarIngrediente = useCallback(
    (nome: string, unidade: Unidade) =>
      executar(() => acoes.criarIngrediente(nome, unidade), 'Ingrediente adicionado.'),
    [executar],
  );

  const atualizarUnidade = useCallback(
    (nome: string, unidade: Unidade) => {
      const itensDespensa = dados.despensa.filter(
        (item) => idSeguro(item.nome) === idSeguro(nome),
      ).length;
      const mensagem =
        itensDespensa > 0
          ? `Unidade atualizada no ingrediente e em ${pluralizar(
              itensDespensa,
              'item',
              'itens',
            )} da despensa.`
          : 'Unidade atualizada.';
      return executar(() => acoes.atualizarUnidadeIngrediente(nome, unidade), mensagem);
    },
    [dados.despensa, executar],
  );

  const removerIngrediente = useCallback(
    async (nome: string) => {
      const usos = dados.receitasPorIngrediente.get(idSeguro(nome)) ?? [];
      if (usos.length > 0) {
        const pratos = [...new Set(usos.map((receita) => receita.prato_nome))];
        return informarBloqueio(
          `“${nome}” está nas receitas de ${listarNomes(pratos)}. Remova-o dessas receitas antes de excluir.`,
        );
      }

      const confirmou = await confirmar({
        titulo: `Excluir “${nome}”?`,
        descricao: 'O ingrediente sai do cadastro. Esta ação não pode ser desfeita.',
        textoConfirmar: 'Excluir ingrediente',
        perigoso: true,
      });
      if (!confirmou) return false;
      return executar(() => acoes.removerIngrediente(nome), 'Ingrediente excluído.');
    },
    [confirmar, dados.receitasPorIngrediente, executar, informarBloqueio],
  );

  const incluirReceita = useCallback(
    (pratoId: string, ingredienteId: string, quantidadePorPessoa: number) => {
      const prato = dados.pratosPorId.get(pratoId)?.nome ?? 'prato';
      return executar(
        () => acoes.incluirReceita(pratoId, ingredienteId, quantidadePorPessoa),
        `Ingrediente adicionado à receita de “${prato}”.`,
      );
    },
    [dados.pratosPorId, executar],
  );

  const alterarQuantidadeReceita = useCallback(
    (receitaId: string, quantidade: number) =>
      executar(
        () => acoes.alterarQuantidadeReceita(receitaId, quantidade),
        'Quantidade por pessoa atualizada.',
      ),
    [executar],
  );

  const excluirReceita = useCallback(
    async (receita: ReceitaDetalhada) => {
      const confirmou = await confirmar({
        titulo: `Remover “${receita.ingrediente_nome}” da receita de “${receita.prato_nome}”?`,
        descricao: 'O prato e o ingrediente continuam cadastrados. Esta ação não pode ser desfeita.',
        textoConfirmar: 'Remover ingrediente',
        perigoso: true,
      });
      if (!confirmou) return false;
      return executar(() => acoes.excluirReceita(receita.id), 'Ingrediente removido da receita.');
    },
    [confirmar, executar],
  );

  const incluirItemDespensa = useCallback(
    (nome: string, item: DadosItemDespensa) =>
      executar(() => acoes.incluirItemDespensa(nome, item), 'Item adicionado à despensa.'),
    [executar],
  );

  const alterarItemDespensa = useCallback(
    (item: ItemDespensa, alteracoes: DadosItemDespensa) =>
      executar(
        () => acoes.alterarItemDespensa(item, alteracoes),
        'Item da despensa atualizado.',
      ),
    [executar],
  );

  const excluirItemDespensa = useCallback(
    async (item: ItemDespensa) => {
      const confirmou = await confirmar({
        titulo: `Excluir “${item.nome}”?`,
        descricao: 'O item sai da despensa. A lista de compras não é alterada.',
        textoConfirmar: 'Excluir item',
        perigoso: true,
      });
      if (!confirmou) return false;
      return executar(() => acoes.excluirItemDespensa(item.id), 'Item excluído da despensa.');
    },
    [confirmar, executar],
  );

  return {
    salvarPrato,
    removerPrato,
    criarIngrediente,
    atualizarUnidade,
    removerIngrediente,
    incluirReceita,
    alterarQuantidadeReceita,
    excluirReceita,
    incluirItemDespensa,
    alterarItemDespensa,
    excluirItemDespensa,
  };
}
