import { useCallback } from 'react';
import type {
  DiaCardapio,
  DiaSemana,
  Embalagem,
  ItemDespensa,
  ReceitaDetalhada,
  Unidade,
} from '../types';
import * as acoes from '../lib/acoes';
import type { DadosItemDespensa } from '../lib/acoes';
import { idSeguro, listarNomes, mensagemDeErro, pluralizar } from '../lib/utils';
import { useConfirm } from '../components/ui/confirm-context';
import { useToast } from '../components/ui/toast-context';
import type { Dados } from './useDados';

export type Acoes = {
  salvarPrato: (nome: string, porcoesBase: number, nomeOriginal?: string) => Promise<boolean>;
  removerPrato: (nome: string) => Promise<boolean>;
  criarIngrediente: (
    nome: string,
    unidade: Unidade,
    embalagem: Embalagem | null,
  ) => Promise<boolean>;
  atualizarIngrediente: (
    nome: string,
    unidade: Unidade,
    embalagem: Embalagem | null,
  ) => Promise<boolean>;
  removerIngrediente: (nome: string) => Promise<boolean>;
  incluirReceita: (
    pratoId: string,
    ingredienteId: string,
    quantidade: number,
  ) => Promise<boolean>;
  alterarQuantidadeReceita: (receitaId: string, quantidade: number) => Promise<boolean>;
  excluirReceita: (receita: ReceitaDetalhada) => Promise<boolean>;
  incluirItemDespensa: (nome: string, dados: DadosItemDespensa) => Promise<boolean>;
  alterarItemDespensa: (item: ItemDespensa, dados: DadosItemDespensa) => Promise<boolean>;
  excluirItemDespensa: (item: ItemDespensa) => Promise<boolean>;
  incluirDia: (dia: DiaSemana, pratoId: string, pessoas: number) => Promise<boolean>;
  alterarDia: (registro: DiaCardapio, pratoId: string, pessoas: number) => Promise<boolean>;
  excluirDia: (registro: DiaCardapio) => Promise<boolean>;
  marcarComprado: (ingredienteId: string, comprado: boolean) => Promise<boolean>;
  limparMarcacoes: () => Promise<boolean>;
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
    (nome: string, porcoesBase: number, nomeOriginal?: string) => {
      // Só há migração de vínculos quando o nome (que é o id) muda; editar só o
      // rendimento do prato não toca receitas nem cardápio (SM-01).
      const renomeou = Boolean(nomeOriginal) && idSeguro(nomeOriginal!) !== idSeguro(nome);
      const receitas =
        renomeou && nomeOriginal
          ? (dados.receitasPorPrato.get(idSeguro(nomeOriginal))?.length ?? 0)
          : 0;
      const dias =
        renomeou && nomeOriginal
          ? (dados.diasPorPrato.get(idSeguro(nomeOriginal))?.length ?? 0)
          : 0;
      const partes: string[] = [];
      if (receitas > 0) partes.push(pluralizar(receitas, 'receita atualizada', 'receitas atualizadas'));
      if (dias > 0) {
        partes.push(pluralizar(dias, 'dia do cardápio atualizado', 'dias do cardápio atualizados'));
      }
      const mensagem = !nomeOriginal
        ? 'Prato adicionado.'
        : !renomeou
          ? 'Prato atualizado.'
          : partes.length > 0
            ? `Prato renomeado; ${partes.join(' e ')}.`
            : 'Prato renomeado.';
      return executar(() => acoes.salvarPrato(nome, porcoesBase, nomeOriginal), mensagem);
    },
    [dados.diasPorPrato, dados.receitasPorPrato, executar],
  );

  const removerPrato = useCallback(
    async (nome: string) => {
      const dias = dados.diasPorPrato.get(idSeguro(nome)) ?? [];
      if (dias.length > 0) {
        return informarBloqueio(
          `“${nome}” está no cardápio de ${listarNomes(dias)}. Remova ` +
            `${dias.length === 1 ? 'esse dia' : 'esses dias'} antes de excluir o prato.`,
        );
      }

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
    [confirmar, dados.diasPorPrato, dados.receitasPorPrato, executar, informarBloqueio],
  );

  const criarIngrediente = useCallback(
    (nome: string, unidade: Unidade, embalagem: Embalagem | null) =>
      executar(
        () => acoes.criarIngrediente(nome, unidade, embalagem),
        'Ingrediente adicionado.',
      ),
    [executar],
  );

  const atualizarIngrediente = useCallback(
    (nome: string, unidade: Unidade, embalagem: Embalagem | null) => {
      const itensDespensa = dados.despensa.filter(
        (item) => idSeguro(item.nome) === idSeguro(nome),
      ).length;
      const mensagem =
        itensDespensa > 0
          ? `Ingrediente atualizado; a unidade vale também para ${pluralizar(
              itensDespensa,
              'item',
              'itens',
            )} da despensa.`
          : 'Ingrediente atualizado.';
      return executar(
        () => acoes.atualizarIngrediente(nome, unidade, embalagem),
        mensagem,
      );
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
    (pratoId: string, ingredienteId: string, quantidade: number) => {
      const prato = dados.pratosPorId.get(pratoId)?.nome ?? 'prato';
      return executar(
        () => acoes.incluirReceita(pratoId, ingredienteId, quantidade),
        `Ingrediente adicionado à receita de “${prato}”.`,
      );
    },
    [dados.pratosPorId, executar],
  );

  const alterarQuantidadeReceita = useCallback(
    (receitaId: string, quantidade: number) =>
      executar(
        () => acoes.alterarQuantidadeReceita(receitaId, quantidade),
        'Quantidade da receita atualizada.',
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

  const incluirDia = useCallback(
    (dia: DiaSemana, pratoId: string, pessoas: number) => {
      const prato = dados.pratosPorId.get(pratoId)?.nome ?? 'prato';
      return executar(
        () => acoes.incluirDia(dia, pratoId, pessoas),
        `${dia} no cardápio com “${prato}” para ${pluralizar(pessoas, 'pessoa', 'pessoas')}.`,
      );
    },
    [dados.pratosPorId, executar],
  );

  const alterarDia = useCallback(
    (registro: DiaCardapio, pratoId: string, pessoas: number) => {
      const prato = dados.pratosPorId.get(pratoId)?.nome ?? 'prato';
      return executar(
        () => acoes.alterarDia(registro, pratoId, pessoas),
        `${registro.dia} atualizado: “${prato}” para ${pluralizar(pessoas, 'pessoa', 'pessoas')}.`,
      );
    },
    [dados.pratosPorId, executar],
  );

  const excluirDia = useCallback(
    async (registro: DiaCardapio) => {
      const prato = dados.pratosPorId.get(registro.prato_id)?.nome ?? 'o prato';
      const confirmou = await confirmar({
        titulo: `Remover ${registro.dia.toLowerCase()} do cardápio?`,
        descricao: `“${prato}” sai do cardápio e os ingredientes desse dia saem da lista de compras. O prato e a receita continuam cadastrados.`,
        textoConfirmar: 'Remover dia',
        perigoso: true,
      });
      if (!confirmou) return false;
      return executar(() => acoes.excluirDia(registro.id), `${registro.dia} removido do cardápio.`);
    },
    [confirmar, dados.pratosPorId, executar],
  );

  const marcarComprado = useCallback(
    async (ingredienteId: string, comprado: boolean): Promise<boolean> => {
      try {
        await acoes.marcarComprado(ingredienteId, comprado);
        return true;
      } catch (falha) {
        avisar(mensagemDeErro(falha), 'erro');
        return false;
      }
    },
    [avisar],
  );

  const limparMarcacoes = useCallback(async () => {
    const total = dados.comprados.size;
    if (total === 0) return true;

    const confirmou = await confirmar({
      titulo: 'Limpar as marcações de compra?',
      descricao: `Os ${total} itens marcados como comprados voltam a ficar pendentes. A lista em si não muda.`,
      textoConfirmar: 'Limpar marcações',
    });
    if (!confirmou) return false;

    const mensagem = pluralizar(total, 'marcação de compra limpa', 'marcações de compra limpas');
    return executar(() => acoes.limparMarcacoes([...dados.comprados]), mensagem + '.');
  }, [confirmar, dados.comprados, executar]);

  return {
    salvarPrato,
    removerPrato,
    criarIngrediente,
    atualizarIngrediente,
    removerIngrediente,
    incluirReceita,
    alterarQuantidadeReceita,
    excluirReceita,
    incluirItemDespensa,
    alterarItemDespensa,
    excluirItemDespensa,
    incluirDia,
    alterarDia,
    excluirDia,
    marcarComprado,
    limparMarcacoes,
  };
}
