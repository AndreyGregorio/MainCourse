import type { CategoriaDespensa, DiaSemana, Unidade } from '../types';

/** Unidades de medida do DRE (RFS05/RFS06/RFS13). */
export const UNIDADES: Unidade[] = ['kg', 'L', 'un'];

/** Dias do cardápio, na ordem fixa do RFS18. */
export const DIAS_SEMANA: DiaSemana[] = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

/** Abreviações usadas na lista de compras e nos resumos. */
export const DIA_ABREVIADO: Record<DiaSemana, string> = {
  Segunda: 'Seg',
  Terça: 'Ter',
  Quarta: 'Qua',
  Quinta: 'Qui',
  Sexta: 'Sex',
};

/** Categorias da despensa, na ordem fixa do RFS14. */
export const CATEGORIAS_DESPENSA: CategoriaDespensa[] = [
  'Limpeza',
  'Salada',
  'Temperos',
  'Itens Gerais',
];

/** Limite de texto do DRE para nomes de pratos, ingredientes e itens. */
export const LIMITE_NOME = 60;

/** Limite da observação do item da despensa (RFS13, Tabela 4). */
export const LIMITE_OBSERVACAO = 120;

/** Raia de valores aceita nas quantidades (receita: > 0; despensa: >= 0). */
export const LIMITE_QUANTIDADE = 99999;

/**
 * Limite de pessoas por dia do cardápio. O DRE exige inteiro maior ou igual a
 * 1; o teto de 99 evita um número absurdo digitado por engano.
 */
export const LIMITE_PESSOAS = 99;

/**
 * Rendimento padrão de um prato (SM-01): 1 porção equivale às quantidades
 * "por pessoa" do DRE. Quem informa a receita inteira troca esse rendimento.
 */
export const PORCOES_PADRAO = 1;

/** Limite de porções de uma receita, na mesma faixa de pessoas do cardápio. */
export const LIMITE_PORCOES = 99;

/** Limite do rótulo da embalagem de compra (SM-01), ex.: "pacote 500 g". */
export const LIMITE_EMBALAGEM = 40;

/** Casas decimais usadas na exibição e no cálculo das quantidades. */
export const CASAS_QUANTIDADE = 3;

export const NOME_APP = 'MainCourse';
export const TAGLINE = 'Cardápio, compras e despensa da semana';
export const VERSAO = '0.4.0';

export const URL_REPOSITORIO = 'https://github.com/AndreyGregorio/MainCourse';
export const URL_PAGES = 'https://andreygregorio.github.io/MainCourse/';
