/** Tipos centrais do MainCourse — Release 3. */

/** Unidades de medida aceitas pelo DRE (RFS05, RFS13). */
export type Unidade = 'kg' | 'L' | 'un';

/** Coleção `pratos` — o nome normalizado é o id do documento. */
export type Prato = {
  id: string;
  nome: string;
  /**
   * Quantas porções a receita deste prato rende (SM-01).
   *
   * `1` é o padrão e mantém o comportamento do DRE: a quantidade da receita é
   * por pessoa. Com rendimento maior, a quantidade guardada vale para a receita
   * inteira e o cardápio escala por `pessoas / porcoes_base`.
   */
  porcoes_base: number;
};

/**
 * Embalagem de compra de um ingrediente (SM-01).
 *
 * `quantidade` está sempre na unidade do ingrediente: "pacote 500 g" em um
 * ingrediente `kg` é `{ rotulo: 'pacote 500 g', quantidade: 0.5 }`.
 */
export type Embalagem = {
  rotulo: string;
  quantidade: number;
};

/** Coleção `ingredientes` — o nome normalizado é o id do documento. */
export type Ingrediente = {
  id: string;
  nome: string;
  unidade_medida: Unidade;
  /** `null` = comprado a granel, na própria unidade de medida. */
  embalagem: Embalagem | null;
};

/**
 * Coleção `receitas` — vínculo prato × ingrediente (RFS09 a RFS12).
 *
 * O id composto (`prato_id::ingrediente_id`) garante, sem consulta extra, que
 * um prato não tenha o mesmo ingrediente duas vezes. Prato e ingrediente são
 * imutáveis (RFS11), então a chave usada como id nunca muda; somente a
 * quantidade é editável.
 *
 * A quantidade vale para a receita inteira (o rendimento está em
 * `Prato.porcoes_base`), que é como a receita é escrita na cozinha: "500 g de
 * massa para uma travessa de 8 porções".
 */
export type Receita = {
  id: string;
  prato_id: string;
  ingrediente_id: string;
  quantidade: number;
};

/** Categorias fixas da despensa (RFS13, Tabela 4). */
export type CategoriaDespensa = 'Limpeza' | 'Salada' | 'Temperos' | 'Itens Gerais';

/**
 * Coleção `despensa` — estoque fixo da casa (RFS13 a RFS16).
 *
 * O id composto (`categoria::nome`) garante a unicidade do nome dentro da
 * categoria exigida pelo RFS13; o nome é imutável (RFS15), a categoria pode
 * mudar, e nesse caso o documento é movido de id.
 */
export type ItemDespensa = {
  id: string;
  nome: string;
  categoria: CategoriaDespensa;
  quantidade: number;
  unidade_medida: Unidade;
  observacao: string;
};

/** Receita com os nomes resolvidos para a interface (RFS10). */
export type ReceitaDetalhada = Receita & {
  prato_nome: string;
  ingrediente_nome: string;
  unidade_medida: Unidade;
};

/** Dias do cardápio, na ordem fixa do RFS18. */
export type DiaSemana = 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta';

/**
 * Coleção `cardapio` — um dia da semana com um prato e o número de pessoas
 * (RFS17 a RFS20).
 *
 * O id do documento é o dia normalizado (`segunda`, `terca`…), o que garante
 * "um único registro por dia" sem consulta extra. O dia é imutável (RFS19);
 * prato e pessoas podem ser alterados.
 */
export type DiaCardapio = {
  id: string;
  dia: DiaSemana;
  prato_id: string;
  pessoas: number;
};

/**
 * Coleção `compras` — marcação de item já comprado (RF01/RF02).
 *
 * Um documento por ingrediente marcado; desmarcar apaga o documento. Fica no
 * Firestore (e não só no aparelho) para a marcação acompanhar o usuário entre
 * celular e computador, e para a exclusão do ingrediente limpar a marcação
 * junto, como pede o RFS08.
 */
export type MarcacaoCompra = {
  id: string;
  ingrediente_id: string;
  marcado_em: Date | null;
};
