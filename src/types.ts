/** Tipos centrais do MainCourse — Release 1. */

/** Unidades de medida aceitas pelo DRE (RFS05). */
export type Unidade = 'kg' | 'L' | 'un';

/** Coleção `pratos` — o nome normalizado é o id do documento. */
export type Prato = {
  id: string;
  nome: string;
};

/** Coleção `ingredientes` — o nome normalizado é o id do documento. */
export type Ingrediente = {
  id: string;
  nome: string;
  unidade_medida: Unidade;
};
