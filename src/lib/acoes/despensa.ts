import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import type { CategoriaDespensa, ItemDespensa, Unidade } from '../../types';
import { CATEGORIAS_DESPENSA, LIMITE_QUANTIDADE } from '../constants';
import {
  idItemDespensa,
  normalizarCategoria,
  normalizarUnidade,
} from '../utils';
import {
  executarOperacoes,
  validarNome,
  validarObservacao,
  validarQuantidade,
} from './comum';
import type { Operacao } from './comum';

export type DadosItemDespensa = {
  categoria: CategoriaDespensa;
  quantidade: number;
  unidade_medida: Unidade;
  observacao: string;
};

function validarCategoria(valor: unknown): CategoriaDespensa {
  const categoria = normalizarCategoria(valor);
  if (!CATEGORIAS_DESPENSA.includes(categoria)) {
    throw new Error(`A categoria precisa ser ${CATEGORIAS_DESPENSA.join(', ')}.`);
  }
  return categoria;
}

function normalizarDados(dados: DadosItemDespensa) {
  return {
    categoria: validarCategoria(dados.categoria),
    quantidade: validarQuantidade(dados.quantidade, {
      rotulo: 'quantidade',
      permiteZero: true,
      limite: LIMITE_QUANTIDADE,
    }),
    unidade_medida: normalizarUnidade(dados.unidade_medida),
    observacao: validarObservacao(dados.observacao ?? ''),
  };
}

/**
 * RFS13: inclui um item na despensa.
 *
 * O id `categoria::nome` garante a regra "o mesmo nome não pode repetir dentro
 * da mesma categoria"; o mesmo nome em outra categoria é permitido.
 */
export async function incluirItemDespensa(
  nome: string,
  dados: DadosItemDespensa,
): Promise<void> {
  const nomeLimpo = validarNome(nome, 'item da despensa');
  const normalizados = normalizarDados(dados);
  const id = idItemDespensa(normalizados.categoria, nomeLimpo);

  const existente = await getDoc(doc(db, 'despensa', id));
  if (existente.exists()) {
    throw new Error(
      `Já existe um item “${nomeLimpo}” na categoria ${normalizados.categoria}.`,
    );
  }

  await setDoc(doc(db, 'despensa', id), {
    nome: nomeLimpo,
    ...normalizados,
  });
}

/**
 * RFS15 + RF03: altera o item da despensa. O nome é imutável; a categoria pode
 * mudar (o item é movido para o id da nova categoria) e a quantidade é ajustada
 * quando o item é reposto ou consumido.
 *
 * Quando a categoria muda, a marcação de compra (se existir) acompanha o item:
 * o id do documento muda de `categoria antiga::nome` para `categoria nova::nome`.
 */
export async function alterarItemDespensa(
  item: ItemDespensa,
  dados: DadosItemDespensa,
): Promise<void> {
  const normalizados = normalizarDados(dados);
  const novoId = idItemDespensa(normalizados.categoria, item.nome);

  if (novoId === item.id) {
    await updateDoc(doc(db, 'despensa', item.id), normalizados);
    return;
  }

  const destino = await getDoc(doc(db, 'despensa', novoId));
  if (destino.exists()) {
    throw new Error(
      `Já existe um item “${item.nome}” na categoria ${normalizados.categoria}.`,
    );
  }

  // A leitura da marcação é opcional: se as regras desta release ainda não
  // foram publicadas, a edição do item continua funcionando (a marcação fica
  // para trás, mas não bloqueia a alteração).
  let marcadoEm: unknown = null;
  try {
    const marcacao = await getDoc(doc(db, 'compras_despensa', item.id));
    if (marcacao.exists()) marcadoEm = marcacao.data().marcado_em ?? new Date();
  } catch {
    marcadoEm = null;
  }

  const operacoes: Operacao[] = [
    { tipo: 'delete', colecao: 'despensa', id: item.id },
    { tipo: 'set', colecao: 'despensa', id: novoId, dados: { nome: item.nome, ...normalizados } },
  ];

  if (marcadoEm) {
    operacoes.push(
      { tipo: 'delete', colecao: 'compras_despensa', id: item.id },
      {
        tipo: 'set',
        colecao: 'compras_despensa',
        id: novoId,
        dados: { item_id: novoId, marcado_em: marcadoEm },
      },
    );
  }

  await executarOperacoes(operacoes);
}

/**
 * RFS16 + RF03: exclui o item da despensa. A lista de compras de ingredientes
 * não é alterada, mas a marcação de compra do item sai junto.
 */
export async function excluirItemDespensa(id: string): Promise<void> {
  await executarOperacoes([
    { tipo: 'delete', colecao: 'despensa', id },
    { tipo: 'delete', colecao: 'compras_despensa', id },
  ]);
}
