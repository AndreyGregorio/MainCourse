import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { executarOperacoes } from './comum';
import type { Operacao } from './comum';

/**
 * RF01: marcação de item já comprado.
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

/**
 * RF03: marcação de item da despensa comprado.
 *
 * A coleção `compras_despensa` é separada de `compras` porque o id de um item
 * da despensa é composto (`categoria::nome`) e pode coincidir com o id de um
 * ingrediente. Marcar cria o documento; desmarcar apaga.
 */
export async function marcarCompradoDespensa(
  itemId: string,
  comprado: boolean,
): Promise<void> {
  const id = itemId.trim();
  if (!id) throw new Error('Item da despensa inválido para a marcação de compra.');

  if (!comprado) {
    await deleteDoc(doc(db, 'compras_despensa', id));
    return;
  }

  await setDoc(doc(db, 'compras_despensa', id), {
    item_id: id,
    marcado_em: new Date(),
  });
}

/** RF01/RF03: "limpar as marcações" — remove as dos ingredientes e as da despensa. */
export async function limparMarcacoes(
  ingredientes: string[],
  despensa: string[] = [],
): Promise<void> {
  const operacoes: Operacao[] = [
    ...ingredientes.map<Operacao>((id) => ({ tipo: 'delete', colecao: 'compras', id })),
    ...despensa.map<Operacao>((id) => ({
      tipo: 'delete',
      colecao: 'compras_despensa',
      id,
    })),
  ];
  await executarOperacoes(operacoes);
}
