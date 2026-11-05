import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

/** O Firestore aceita até 500 gravações por lote; deixamos margem de segurança. */
export const TAMANHO_LOTE = 400;

export type Operacao =
  | { tipo: 'set'; colecao: string; id: string; dados: DocumentData }
  | { tipo: 'update'; colecao: string; id: string; dados: DocumentData }
  | { tipo: 'delete'; colecao: string; id: string };

/**
 * Executa um conjunto de gravações em lotes atômicos por lote.
 *
 * Renomear um prato pode tocar o prato, as receitas e (a partir da R03) o
 * cardápio — mais de 500 documentos teoricamente. Dividir em lotes mantém cada
 * commit atômico e evita o limite do Firestore.
 */
export async function executarOperacoes(operacoes: Operacao[]): Promise<void> {
  for (let inicio = 0; inicio < operacoes.length; inicio += TAMANHO_LOTE) {
    const lote = writeBatch(db);
    for (const operacao of operacoes.slice(inicio, inicio + TAMANHO_LOTE)) {
      const referencia = doc(db, operacao.colecao, operacao.id);
      if (operacao.tipo === 'delete') lote.delete(referencia);
      else if (operacao.tipo === 'set') lote.set(referencia, operacao.dados);
      else lote.update(referencia, operacao.dados);
    }
    await lote.commit();
  }
}

/** Busca simples por um campo (índice de campo único, sem composto). */
export async function buscarPorCampo<T>(
  colecao: string,
  campo: string,
  valor: string,
  mapear: (id: string, dados: DocumentData) => T,
): Promise<T[]> {
  const resultado = await getDocs(query(collection(db, colecao), where(campo, '==', valor)));
  return resultado.docs.map((documento) => mapear(documento.id, documento.data()));
}

export function validarNome(nome: string, entidade: string): string {
  const limpo = nome.trim();
  if (limpo.length < 2) {
    throw new Error(`O nome do ${entidade} precisa ter pelo menos 2 caracteres.`);
  }
  if (limpo.length > 60) {
    throw new Error(`O nome do ${entidade} pode ter no máximo 60 caracteres.`);
  }
  return limpo;
}

export function validarQuantidade(
  valor: number,
  opcoes: { rotulo: string; permiteZero: boolean; limite: number },
): number {
  if (!Number.isFinite(valor)) {
    throw new Error(`Informe a ${opcoes.rotulo} com um número válido.`);
  }
  if (valor < 0 || (!opcoes.permiteZero && valor === 0)) {
    throw new Error(
      opcoes.permiteZero
        ? `A ${opcoes.rotulo} não pode ser negativa.`
        : `A ${opcoes.rotulo} precisa ser maior que zero.`,
    );
  }
  if (valor > opcoes.limite) {
    throw new Error(`A ${opcoes.rotulo} pode ser no máximo ${opcoes.limite}.`);
  }
  return valor;
}

export function validarObservacao(observacao: string): string {
  const limpa = observacao.trim();
  if (limpa.length > 120) {
    throw new Error('A observação pode ter no máximo 120 caracteres.');
  }
  return limpa;
}
