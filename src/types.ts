/** Tipos centrais do MainCourse — Release 2. */

/** Unidades de medida aceitas pelo DRE (RFS05, RFS13). */
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

/**
 * Coleção `receitas` — vínculo prato × ingrediente (RFS09 a RFS12).
 *
 * O id composto (`prato_id::ingrediente_id`) garante, sem consulta extra, que
 * um prato não tenha o mesmo ingrediente duas vezes. Prato e ingrediente são
 * imutáveis (RFS11), então a chave usada como id nunca muda; somente a
 * quantidade por pessoa é editável.
 */
export type Receita = {
  id: string;
  prato_id: string;
  ingrediente_id: string;
  quantidade_por_pessoa: number;
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
