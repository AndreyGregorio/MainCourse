import { deleteDoc, doc, getDoc, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import type { Unidade } from '../types';
import { idSeguro, normalizarUnidade } from './utils';

/* ------------------------------------------------------------------ */
/* Validações compartilhadas (RFS01 / RFS05)                           */
/* ------------------------------------------------------------------ */

function validarNome(nome: string, entidade: 'prato' | 'ingrediente'): string {
  const limpo = nome.trim();
  if (limpo.length < 2) {
    throw new Error(`O nome do ${entidade} precisa ter pelo menos 2 caracteres.`);
  }
  if (limpo.length > 60) {
    throw new Error(`O nome do ${entidade} pode ter no máximo 60 caracteres.`);
  }
  return limpo;
}

function validarUnidade(unidade: Unidade): Unidade {
  return normalizarUnidade(unidade);
}

/* ------------------------------------------------------------------ */
/* Pratos — RFS01 a RFS04                                              */
/* ------------------------------------------------------------------ */

/**
 * Cria um prato ou renomeia um existente.
 *
 * O nome é o identificador, então renomear é apagar o documento antigo e
 * criar o novo. Nesta release ainda não há receitas nem cardápio apontando
 * para o prato; a partir da R02, o rename também atualizará as referências.
 */
export async function salvarPrato(nome: string, nomeOriginal?: string): Promise<void> {
  const nomeLimpo = validarNome(nome, 'prato');
  const novoId = idSeguro(nomeLimpo);
  const idOriginal = nomeOriginal ? idSeguro(nomeOriginal) : null;
  const mudouId = idOriginal !== null && idOriginal !== novoId;

  const existente = await getDoc(doc(db, 'pratos', novoId));
  if (existente.exists() && (!idOriginal || mudouId)) {
    const nomeExistente = String(existente.data().nome ?? nomeLimpo);
    throw new Error(`Já existe um prato chamado “${nomeExistente}”.`);
  }

  if (!mudouId) {
    await setDoc(doc(db, 'pratos', novoId), { nome: nomeLimpo });
    return;
  }

  const lote = writeBatch(db);
  lote.delete(doc(db, 'pratos', idOriginal!));
  lote.set(doc(db, 'pratos', novoId), { nome: nomeLimpo });
  await lote.commit();
}

export async function removerPrato(nome: string): Promise<void> {
  await deleteDoc(doc(db, 'pratos', idSeguro(nome)));
}

/* ------------------------------------------------------------------ */
/* Ingredientes — RFS05 a RFS08                                        */
/* ------------------------------------------------------------------ */

/** Cria um ingrediente. O nome não pode repetir (sem diferenciar maiúsculas). */
export async function criarIngrediente(nome: string, unidade: Unidade): Promise<void> {
  const nomeLimpo = validarNome(nome, 'ingrediente');
  const unidadeLimpa = validarUnidade(unidade);
  const id = idSeguro(nomeLimpo);

  const existente = await getDoc(doc(db, 'ingredientes', id));
  if (existente.exists()) {
    const nomeExistente = String(existente.data().nome ?? nomeLimpo);
    throw new Error(`Já existe um ingrediente chamado “${nomeExistente}”.`);
  }

  await setDoc(doc(db, 'ingredientes', id), {
    nome: nomeLimpo,
    unidade_medida: unidadeLimpa,
  });
}

/**
 * RFS07: o nome do ingrediente não pode ser alterado (é a chave usada pelas
 * receitas); somente a unidade de medida.
 */
export async function atualizarUnidadeIngrediente(nome: string, unidade: Unidade): Promise<void> {
  const unidadeLimpa = validarUnidade(unidade);
  await updateDoc(doc(db, 'ingredientes', idSeguro(nome)), {
    unidade_medida: unidadeLimpa,
  });
}

export async function removerIngrediente(nome: string): Promise<void> {
  await deleteDoc(doc(db, 'ingredientes', idSeguro(nome)));
}
