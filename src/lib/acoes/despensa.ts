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
 * RFS15: altera o item da despensa. O nome é imutável; a categoria pode mudar
 * (o item é movido para o id da nova categoria) e a quantidade é ajustada
 * quando o item é reposto ou consumido.
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

  const operacoes: Operacao[] = [
    { tipo: 'delete', colecao: 'despensa', id: item.id },
    { tipo: 'set', colecao: 'despensa', id: novoId, dados: { nome: item.nome, ...normalizados } },
  ];
  await executarOperacoes(operacoes);
}

/** RFS16: exclui o item da despensa. A lista de compras não é alterada. */
export async function excluirItemDespensa(id: string): Promise<void> {
  await executarOperacoes([{ tipo: 'delete', colecao: 'despensa', id }]);
}
