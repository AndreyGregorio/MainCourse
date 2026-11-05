import { useCallback, useMemo } from 'react';
import type {
  CategoriaDespensa,
  DiaCardapio,
  DiaSemana,
  Ingrediente,
  ItemDespensa,
  Prato,
  ReceitaDetalhada,
} from '../types';
import { CATEGORIAS_DESPENSA, DIAS_SEMANA } from '../lib/constants';
import {
  mapearDiaCardapio,
  mapearIngrediente,
  mapearItemDespensa,
  mapearMarcacaoCompra,
  mapearPrato,
  mapearReceita,
} from '../lib/mapeadores';
import { compararNomes, ordenarDias } from '../lib/utils';
import { useColecao } from './useColecao';

export type Dados = {
  pratos: Prato[];
  ingredientes: Ingrediente[];
  /** Receitas com os nomes de prato e ingrediente já resolvidos (RFS10). */
  receitas: ReceitaDetalhada[];
  despensa: ItemDespensa[];
  /** Dias do cardápio, de segunda a sexta (RFS18). */
  cardapio: DiaCardapio[];
  /** Consulta rápida do dia preenchido (RFS17). */
  cardapioPorDia: Map<DiaSemana, DiaCardapio>;
  /** Pratos que podem ser escolhidos no cardápio (RFS17). */
  pratosComReceita: Prato[];
  /** Dias em que cada prato aparece — usado no bloqueio da exclusão (RFS04). */
  diasPorPrato: Map<string, DiaSemana[]>;
  /** Ids dos ingredientes marcados como comprados (RF01). */
  comprados: Set<string>;
  pratosPorId: Map<string, Prato>;
  ingredientesPorId: Map<string, Ingrediente>;
  receitasPorPrato: Map<string, ReceitaDetalhada[]>;
  receitasPorIngrediente: Map<string, ReceitaDetalhada[]>;
  despensaPorCategoria: Map<CategoriaDespensa, ItemDespensa[]>;
  carregando: boolean;
  daCache: boolean;
  atualizadoEm: Date | null;
  erro: string | null;
  recarregar: () => void;
};

const ORDEM_CATEGORIA = new Map(CATEGORIAS_DESPENSA.map((categoria, indice) => [categoria, indice]));
const ORDEM_DIA = new Map(DIAS_SEMANA.map((dia, indice) => [dia, indice]));

/**
 * Assina as coleções da release e entrega os dados já ordenados e agrupados.
 *
 * A ordenação segue o DRE: pratos e ingredientes em ordem alfabética, receitas
 * por prato e, dentro dele, por ingrediente (RFS10), e despensa pela ordem fixa
 * das categorias (RFS14).
 */
export function useDados(): Dados {
  const colecaoPratos = useColecao('pratos', mapearPrato);
  const colecaoIngredientes = useColecao('ingredientes', mapearIngrediente);
  const colecaoReceitas = useColecao('receitas', mapearReceita);
  const colecaoDespensa = useColecao('despensa', mapearItemDespensa);
  const colecaoCardapio = useColecao('cardapio', mapearDiaCardapio);
  const colecaoCompras = useColecao('compras', mapearMarcacaoCompra);

  const pratos = useMemo(
    () => [...colecaoPratos.dados].sort((a, b) => compararNomes(a.nome, b.nome)),
    [colecaoPratos.dados],
  );

  const ingredientes = useMemo(
    () => [...colecaoIngredientes.dados].sort((a, b) => compararNomes(a.nome, b.nome)),
    [colecaoIngredientes.dados],
  );

  const pratosPorId = useMemo(
    () => new Map(pratos.map((prato) => [prato.id, prato])),
    [pratos],
  );

  const ingredientesPorId = useMemo(
    () => new Map(ingredientes.map((ingrediente) => [ingrediente.id, ingrediente])),
    [ingredientes],
  );

  const receitas = useMemo<ReceitaDetalhada[]>(() => {
    return colecaoReceitas.dados
      .map((receita) => ({
        ...receita,
        prato_nome: pratosPorId.get(receita.prato_id)?.nome ?? receita.prato_id,
        ingrediente_nome:
          ingredientesPorId.get(receita.ingrediente_id)?.nome ?? receita.ingrediente_id,
        unidade_medida: ingredientesPorId.get(receita.ingrediente_id)?.unidade_medida ?? 'un',
      }))
      .sort(
        (a, b) =>
          compararNomes(a.prato_nome, b.prato_nome) ||
          compararNomes(a.ingrediente_nome, b.ingrediente_nome),
      );
  }, [colecaoReceitas.dados, pratosPorId, ingredientesPorId]);

  const receitasPorPrato = useMemo(() => {
    const mapa = new Map<string, ReceitaDetalhada[]>();
    for (const receita of receitas) {
      const lista = mapa.get(receita.prato_id) ?? [];
      lista.push(receita);
      mapa.set(receita.prato_id, lista);
    }
    return mapa;
  }, [receitas]);

  const receitasPorIngrediente = useMemo(() => {
    const mapa = new Map<string, ReceitaDetalhada[]>();
    for (const receita of receitas) {
      const lista = mapa.get(receita.ingrediente_id) ?? [];
      lista.push(receita);
      mapa.set(receita.ingrediente_id, lista);
    }
    return mapa;
  }, [receitas]);

  const despensa = useMemo(
    () =>
      [...colecaoDespensa.dados].sort(
        (a, b) =>
          (ORDEM_CATEGORIA.get(a.categoria) ?? 99) - (ORDEM_CATEGORIA.get(b.categoria) ?? 99) ||
          compararNomes(a.nome, b.nome),
      ),
    [colecaoDespensa.dados],
  );

  const cardapio = useMemo(
    () =>
      [...colecaoCardapio.dados].sort(
        (a, b) => (ORDEM_DIA.get(a.dia) ?? 99) - (ORDEM_DIA.get(b.dia) ?? 99),
      ),
    [colecaoCardapio.dados],
  );

  const cardapioPorDia = useMemo(
    () => new Map(cardapio.map((registro) => [registro.dia, registro])),
    [cardapio],
  );

  const pratosComReceita = useMemo(
    () => pratos.filter((prato) => (receitasPorPrato.get(prato.id)?.length ?? 0) > 0),
    [pratos, receitasPorPrato],
  );

  const diasPorPrato = useMemo(() => {
    const mapa = new Map<string, DiaSemana[]>();
    for (const registro of cardapio) {
      const dias = mapa.get(registro.prato_id) ?? [];
      dias.push(registro.dia);
      mapa.set(registro.prato_id, ordenarDias(dias));
    }
    return mapa;
  }, [cardapio]);

  const comprados = useMemo(
    () => new Set(colecaoCompras.dados.map((marcacao) => marcacao.ingrediente_id)),
    [colecaoCompras.dados],
  );

  const despensaPorCategoria = useMemo(() => {
    const mapa = new Map<CategoriaDespensa, ItemDespensa[]>();
    for (const categoria of CATEGORIAS_DESPENSA) mapa.set(categoria, []);
    for (const item of despensa) {
      const lista = mapa.get(item.categoria) ?? [];
      lista.push(item);
      mapa.set(item.categoria, lista);
    }
    return mapa;
  }, [despensa]);

  const colecoes = [
    colecaoPratos,
    colecaoIngredientes,
    colecaoReceitas,
    colecaoDespensa,
    colecaoCardapio,
    colecaoCompras,
  ];

  const datas = colecoes
    .map((colecao) => colecao.atualizadoEm)
    .filter((data): data is Date => data instanceof Date);

  const recarregar = useCallback(() => {
    for (const colecao of [
      colecaoPratos,
      colecaoIngredientes,
      colecaoReceitas,
      colecaoDespensa,
      colecaoCardapio,
      colecaoCompras,
    ]) {
      colecao.recarregar();
    }
  }, [
    colecaoPratos,
    colecaoIngredientes,
    colecaoReceitas,
    colecaoDespensa,
    colecaoCardapio,
    colecaoCompras,
  ]);

  return {
    pratos,
    ingredientes,
    receitas,
    despensa,
    cardapio,
    cardapioPorDia,
    pratosComReceita,
    diasPorPrato,
    comprados,
    pratosPorId,
    ingredientesPorId,
    receitasPorPrato,
    receitasPorIngrediente,
    despensaPorCategoria,
    carregando: colecoes.some((colecao) => colecao.carregando),
    daCache: colecoes.some((colecao) => colecao.daCache),
    atualizadoEm: datas.length === 0 ? null : new Date(Math.max(...datas.map((d) => d.getTime()))),
    erro: colecoes.find((colecao) => colecao.erro)?.erro ?? null,
    recarregar,
  };
}
