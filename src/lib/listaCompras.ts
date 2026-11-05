import type {
  DiaCardapio,
  DiaSemana,
  Embalagem,
  Ingrediente,
  Prato,
  ReceitaDetalhada,
  Unidade,
} from '../types';
import { UNIDADES } from './constants';
import { embalagensParaComprar, porcoesDoPrato, textoEmbalagem } from './receita';
import {
  arredondarQuantidade,
  compararNomes,
  formatarQuantidade,
  ordenarDias,
  pluralizar,
  rotuloDias,
} from './utils';

/** Uma linha da lista de compras da semana (RF01). */
export type ItemLista = {
  ingrediente_id: string;
  ingrediente_nome: string;
  unidade_medida: Unidade;
  /** Necessidade do período: soma, por dia, de `quantidade × pessoas / porções`. */
  quantidade: number;
  dias: DiaSemana[];
  pratos: string[];
  comprado: boolean;
  /** Embalagem cadastrada no ingrediente; `null` quando é comprado a granel. */
  embalagem: Embalagem | null;
  /** Embalagens inteiras a comprar (SM-01); `null` a granel. */
  embalagens: number | null;
  /** Quantidade coberta pelas embalagens inteiras, na unidade do ingrediente. */
  quantidade_compra: number | null;
};

/** Totalização por unidade de medida (RF02). */
export type ResumoUnidade = {
  unidade: Unidade;
  quantidade: number;
  itens: number;
  comprados: number;
};

export type ResultadoLista = {
  itens: ItemLista[];
  resumo: ResumoUnidade[];
  totalItens: number;
  totalComprados: number;
  /** Dias do cardápio que contribuíram com pelo menos um ingrediente. */
  diasComItens: DiaSemana[];
};

export type EntradaLista = {
  cardapio: DiaCardapio[];
  pratos: Prato[];
  receitas: ReceitaDetalhada[];
  ingredientes: Ingrediente[];
  /** Ids dos ingredientes marcados como comprados (RF01). */
  comprados: Set<string>;
  /** `null` = semana inteira; um dia = só o que é usado naquele dia. */
  filtroDia: DiaSemana | null;
};

/**
 * Motor de cálculo da lista de compras (RF01 e RF02).
 *
 * Função pura, sem Firestore e sem estado: a mesma entrada gera exatamente a
 * mesma saída (RNF003). A quantidade de cada ingrediente é a soma, em todos os
 * dias do período, de `quantidade da receita × pessoas do dia / porções do
 * prato`; a unidade vem do ingrediente e os dias/pratos são rastreados para a
 * consulta.
 *
 * Desde a SM-01 o prato pode render mais de uma porção: a receita é informada
 * inteira (ex.: 0,5 kg de massa para 8 porções) e o cálculo distribui isso
 * pelas pessoas do cardápio. Quando o ingrediente tem embalagem, a lista
 * também diz quantas embalagens inteiras comprar.
 *
 * O DRE não manda descontar a despensa: a lista é a necessidade do cardápio,
 * e o RFS16 confirma que a despensa não altera a lista.
 */
export function calcularLista({
  cardapio,
  pratos,
  receitas,
  ingredientes,
  comprados,
  filtroDia,
}: EntradaLista): ResultadoLista {
  const pratosPorId = new Map(pratos.map((prato) => [prato.id, prato]));
  const ingredientesPorId = new Map(
    ingredientes.map((ingrediente) => [ingrediente.id, ingrediente]),
  );
  const receitasPorPrato = new Map<string, ReceitaDetalhada[]>();
  for (const receita of receitas) {
    const lista = receitasPorPrato.get(receita.prato_id) ?? [];
    lista.push(receita);
    receitasPorPrato.set(receita.prato_id, lista);
  }

  const quantidades = new Map<string, number>();
  const diasPorIngrediente = new Map<string, Set<DiaSemana>>();
  const pratosPorIngrediente = new Map<string, Set<string>>();
  const diasComItens = new Set<DiaSemana>();

  for (const registro of cardapio) {
    if (filtroDia && registro.dia !== filtroDia) continue;

    const prato = pratosPorId.get(registro.prato_id);
    if (!prato) continue;

    const porcoes = porcoesDoPrato(prato);
    const receitasDoPrato = receitasPorPrato.get(registro.prato_id) ?? [];
    for (const receita of receitasDoPrato) {
      const ingrediente = ingredientesPorId.get(receita.ingrediente_id);
      if (!ingrediente) continue;

      const quantidade = (receita.quantidade * registro.pessoas) / porcoes;
      quantidades.set(
        ingrediente.id,
        (quantidades.get(ingrediente.id) ?? 0) + quantidade,
      );

      const dias = diasPorIngrediente.get(ingrediente.id) ?? new Set<DiaSemana>();
      dias.add(registro.dia);
      diasPorIngrediente.set(ingrediente.id, dias);

      const nomes = pratosPorIngrediente.get(ingrediente.id) ?? new Set<string>();
      nomes.add(prato.nome);
      pratosPorIngrediente.set(ingrediente.id, nomes);

      diasComItens.add(registro.dia);
    }
  }

  const itens: ItemLista[] = [...quantidades.entries()]
    .map(([ingredienteId, quantidade]) => {
      const ingrediente = ingredientesPorId.get(ingredienteId)!;
      const embalagem = ingrediente.embalagem;
      const embalagens = embalagensParaComprar(quantidade, embalagem);
      return {
        ingrediente_id: ingredienteId,
        ingrediente_nome: ingrediente.nome,
        unidade_medida: ingrediente.unidade_medida,
        quantidade: arredondarQuantidade(quantidade),
        dias: ordenarDias([...(diasPorIngrediente.get(ingredienteId) ?? [])]),
        pratos: [...(pratosPorIngrediente.get(ingredienteId) ?? [])].sort(compararNomes),
        comprado: comprados.has(ingredienteId),
        embalagem,
        embalagens,
        quantidade_compra:
          embalagens !== null && embalagem
            ? arredondarQuantidade(embalagens * embalagem.quantidade)
            : null,
      };
    })
    .sort((a, b) => compararNomes(a.ingrediente_nome, b.ingrediente_nome));

  const resumo: ResumoUnidade[] = UNIDADES.map((unidade) => {
    const doGrupo = itens.filter((item) => item.unidade_medida === unidade);
    return {
      unidade,
      quantidade: arredondarQuantidade(
        doGrupo.reduce((total, item) => total + item.quantidade, 0),
      ),
      itens: doGrupo.length,
      comprados: doGrupo.filter((item) => item.comprado).length,
    };
  });

  return {
    itens,
    resumo,
    totalItens: itens.length,
    totalComprados: itens.filter((item) => item.comprado).length,
    diasComItens: ordenarDias([...diasComItens]),
  };
}

/**
 * Texto pronto para compartilhar (RF02): resumo por unidade e itens com
 * quantidade, dias, pratos e a marcação de comprado.
 */
export function textoDaLista(
  itens: ItemLista[],
  resumo: ResumoUnidade[],
  periodo: string,
): string {
  const linhas: string[] = [];
  const comprados = itens.filter((item) => item.comprado).length;

  linhas.push('Lista de compras — MainCourse');
  linhas.push(
    `${periodo} · ${pluralizar(itens.length, 'item', 'itens')} · ${pluralizar(
      comprados,
      'comprado',
      'comprados',
    )}`,
  );
  linhas.push('');

  for (const unidade of resumo) {
    linhas.push(
      `${unidade.unidade}: ${formatarQuantidade(unidade.quantidade)} ${unidade.unidade} em ${pluralizar(
        unidade.itens,
        'item',
        'itens',
      )} · ${pluralizar(unidade.comprados, 'comprado', 'comprados')}`,
    );
  }

  linhas.push('');

  for (const item of itens) {
    const marca = item.comprado ? '[x]' : '[ ]';
    const dias = rotuloDias(item.dias);
    const pratos = item.pratos.join(', ');
    const compra =
      item.embalagens !== null && item.embalagem
        ? ` — comprar ${textoEmbalagem(item.embalagens, item.embalagem, item.unidade_medida)}`
        : '';
    linhas.push(
      `${marca} ${item.ingrediente_nome} — ${formatarQuantidade(item.quantidade)} ${item.unidade_medida}${compra} — ${dias} — ${pratos}`,
    );
  }

  return linhas.join('\n');
}

/** CSV da lista (compatível com Excel pt-BR: ponto e vírgula e vírgula decimal). */
export function csvDaLista(itens: ItemLista[]): string {
  const campo = (valor: string) => {
    if (/[";\n]/.test(valor)) return `"${valor.replace(/"/g, '""')}"`;
    return valor;
  };

  const linhas = ['Ingrediente;Quantidade;Unidade;Dias;Pratos;Comprar;Comprado'];
  for (const item of itens) {
    const compra =
      item.embalagens !== null && item.embalagem
        ? textoEmbalagem(item.embalagens, item.embalagem, item.unidade_medida)
        : '';
    linhas.push(
      [
        campo(item.ingrediente_nome),
        formatarQuantidade(item.quantidade),
        item.unidade_medida,
        campo(rotuloDias(item.dias)),
        campo(item.pratos.join(' / ')),
        campo(compra),
        item.comprado ? 'Sim' : 'Não',
      ].join(';'),
    );
  }

  return linhas.join('\n');
}
