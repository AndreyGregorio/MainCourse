import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { executarOperacoes } from './comum';
import type { Operacao } from './comum';

/**
 * RF01/RF02: marcação de item já comprado.
 *
 * O documento vive em `compras/{ingrediente_id}`. Marcar cria (ou reescreve) o
 * documento; desmarcar apaga. A marcação fica no Firestore para acompanhar o
 * usuário entre aparelhos e para o RFS08 poder removê-la junto com o
 * ingrediente.
 */
export async function marcarComprado(
  ingredienteId: string,
  comprado: boolean,
): Promise<void> {
  const id = ingredienteId.trim();
  if (!id) throw new Error('Ingrediente inválido para a marcação de compra.');

  if (!comprado) {
    await deleteDoc(doc(db, 'compras', id));
    return;
  }

  await setDoc(doc(db, 'compras', id), {
    ingrediente_id: id,
    marcado_em: new Date(),
  });
}

/** RF01: "limpar as marcações" — remove todas as marcações do período. */
export async function limparMarcacoes(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const operacoes: Operacao[] = ids.map((id) => ({
    tipo: 'delete',
    colecao: 'compras',
    id,
  }));
  await executarOperacoes(operacoes);
}
