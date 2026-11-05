import type { CategoriaDespensa, Unidade } from '../types';

/** Unidades de medida do DRE (RFS05/RFS06/RFS13). */
export const UNIDADES: Unidade[] = ['kg', 'L', 'un'];

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

/** Casas decimais usadas na exibição e no cálculo das quantidades. */
export const CASAS_QUANTIDADE = 3;

export const NOME_APP = 'MainCourse';
export const TAGLINE = 'Cardápio, compras e despensa da semana';
export const VERSAO = '0.2.0';

export const URL_REPOSITORIO = 'https://github.com/AndreyGregorio/MainCourse';
export const URL_PAGES = 'https://andreygregorio.github.io/MainCourse/';
