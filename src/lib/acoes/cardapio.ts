import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import type { DiaCardapio, DiaSemana } from '../../types';
import { LIMITE_PESSOAS } from '../constants';
import { mapearDiaCardapio } from '../mapeadores';
import { idDia, normalizarDia } from '../utils';
import { buscarPorCampo } from './comum';

/** RFS17: o dia precisa ser um dos cinco dias úteis. */
export function validarDia(valor: unknown): DiaSemana {
  const dia = normalizarDia(valor);
  if (!dia) {
    throw new Error('Escolha um dia entre segunda e sexta.');
  }
  return dia;
}

/** RFS17: número inteiro de pessoas, maior ou igual a 1. */
export function validarPessoas(valor: number): number {
  if (!Number.isInteger(valor) || valor < 1) {
    throw new Error('Informe a quantidade de pessoas com um número inteiro maior ou igual a 1.');
  }
  if (valor > LIMITE_PESSOAS) {
    throw new Error(`A quantidade de pessoas pode ser no máximo ${LIMITE_PESSOAS}.`);
  }
  return valor;
}

function mensagemSemReceita(nome: string): string {
  return `O prato “${nome}” ainda não tem ingredientes na receita. Inclua ao menos um ingrediente antes de usá-lo no cardápio.`;
}

/**
 * RFS17: um dia só aceita prato cadastrado e com pelo menos um ingrediente na
 * receita. A checagem fica na camada de escrita para valer mesmo com a tela
 * desatualizada.
 */
async function exigirPratoComReceita(pratoId: string): Promise<void> {
  const prato = await getDoc(doc(db, 'pratos', pratoId));
  if (!prato.exists()) {
    throw new Error('O prato escolhido não está mais cadastrado.');
  }

  const receitas = await getDocs(
    query(collection(db, 'receitas'), where('prato_id', '==', pratoId), limit(1)),
  );
  if (receitas.empty) {
    throw new Error(mensagemSemReceita(String(prato.data().nome ?? pratoId)));
  }
}

/** Dias do cardápio em que um prato aparece (RFS03/RFS04). */
export function diasDoPrato(pratoId: string): Promise<DiaCardapio[]> {
  return buscarPorCampo('cardapio', 'prato_id', pratoId, mapearDiaCardapio);
}

/**
 * RFS17: inclui um dia no cardápio.
 *
 * O id é o dia normalizado (`segunda`, `terca`…), então incluir o mesmo dia
 * duas vezes é barrado pelo próprio documento; a checagem devolve uma mensagem
 * clara em vez do erro genérico do Firestore.
 */
export async function incluirDia(
  dia: DiaSemana,
  pratoId: string,
  pessoas: number,
): Promise<void> {
  const diaLimpo = validarDia(dia);
  const pessoasLimpas = validarPessoas(pessoas);
  const id = idDia(diaLimpo);

  const existente = await getDoc(doc(db, 'cardapio', id));
  if (existente.exists()) {
    throw new Error(
      `O ${diaLimpo.toLowerCase()} já está no cardápio. Altere o dia existente para trocar o prato ou as pessoas.`,
    );
  }

  await exigirPratoComReceita(pratoId);
  await setDoc(doc(db, 'cardapio', id), {
    dia: diaLimpo,
    prato_id: pratoId,
    pessoas: pessoasLimpas,
  });
}

/**
 * RFS19: somente prato e quantidade de pessoas mudam; o dia é imutável.
 * Trocar qualquer um dos dois recalcula a lista de compras, que é derivada.
 */
export async function alterarDia(
  registro: DiaCardapio,
  pratoId: string,
  pessoas: number,
): Promise<void> {
  const pessoasLimpas = validarPessoas(pessoas);
  await exigirPratoComReceita(pratoId);
  await updateDoc(doc(db, 'cardapio', registro.id), {
    prato_id: pratoId,
    pessoas: pessoasLimpas,
  });
}

/** RFS20: exclui o dia; ele volta a ficar livre e sai do cálculo da lista. */
export async function excluirDia(id: string): Promise<void> {
  await deleteDoc(doc(db, 'cardapio', id));
}
