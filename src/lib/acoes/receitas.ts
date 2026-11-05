import { deleteField, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import type { Receita } from '../../types';
import { idReceita } from '../utils';
import { mapearReceita } from '../mapeadores';
import {
  buscarPorCampo,
  executarOperacoes,
  validarQuantidade,
} from './comum';

/** Quantidade da receita (receita inteira): maior que zero (Tabela 3 do DRE). */
export function validarQuantidadeReceita(valor: number): number {
  return validarQuantidade(valor, {
    rotulo: 'quantidade da receita',
    permiteZero: false,
    limite: 99999,
  });
}

function dadosReceita(pratoId: string, ingredienteId: string, quantidade: number) {
  return {
    prato_id: pratoId,
    ingrediente_id: ingredienteId,
    quantidade,
  };
}

/** Receitas de um prato (usado pela exclusão/renomeação do prato — RFS03/RFS04). */
export function receitasDoPrato(pratoId: string): Promise<Receita[]> {
  return buscarPorCampo('receitas', 'prato_id', pratoId, mapearReceita);
}

/** Receitas que usam um ingrediente (bloqueio do RFS08). */
export function receitasDoIngrediente(ingredienteId: string): Promise<Receita[]> {
  return buscarPorCampo('receitas', 'ingrediente_id', ingredienteId, mapearReceita);
}

/**
 * RFS09: inclui um ingrediente na receita de um prato.
 *
 * A quantidade é a da receita inteira, para o rendimento do prato (SM-01). O id
 * composto garante a regra "um prato não pode ter o mesmo ingrediente duas
 * vezes"; prato e ingrediente precisam existir de fato.
 */
export async function incluirReceita(
  pratoId: string,
  ingredienteId: string,
  quantidade: number,
): Promise<void> {
  const valor = validarQuantidadeReceita(quantidade);

  const [prato, ingrediente] = await Promise.all([
    getDoc(doc(db, 'pratos', pratoId)),
    getDoc(doc(db, 'ingredientes', ingredienteId)),
  ]);
  if (!prato.exists()) throw new Error('O prato escolhido não está mais cadastrado.');
  if (!ingrediente.exists()) throw new Error('O ingrediente escolhido não está mais cadastrado.');

  const id = idReceita(pratoId, ingredienteId);
  const existente = await getDoc(doc(db, 'receitas', id));
  if (existente.exists()) {
    throw new Error('Esse prato já tem esse ingrediente na receita. Altere a quantidade na lista.');
  }

  await setDoc(doc(db, 'receitas', id), dadosReceita(pratoId, ingredienteId, valor));
}

/**
 * RFS11: somente a quantidade muda; prato e ingrediente são fixos.
 *
 * `quantidade_por_pessoa` é o campo antigo (antes da SM-01): ao editar, o
 * documento passa a ter só `quantidade`, sem exigir migração dos dados.
 */
export async function alterarQuantidadeReceita(
  receitaId: string,
  quantidade: number,
): Promise<void> {
  const valor = validarQuantidadeReceita(quantidade);
  await updateDoc(doc(db, 'receitas', receitaId), {
    quantidade: valor,
    quantidade_por_pessoa: deleteField(),
  });
}

/** RFS12: exclui apenas o vínculo; prato e ingrediente continuam cadastrados. */
export async function excluirReceita(receitaId: string): Promise<void> {
  await executarOperacoes([{ tipo: 'delete', colecao: 'receitas', id: receitaId }]);
}
