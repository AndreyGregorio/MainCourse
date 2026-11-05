import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { idReceita, idSeguro } from '../utils';
import { executarOperacoes, validarNome } from './comum';
import type { Operacao } from './comum';
import { receitasDoPrato } from './receitas';

/**
 * RFS01 e RFS03: cria um prato ou renomeia um existente.
 *
 * O nome é o identificador do registro, então renomear é apagar o documento
 * antigo e criar o novo. Como as receitas carregam o id do prato, a renomeação
 * migra os vínculos no mesmo lote — exatamente o que o RFS03 exige ("o sistema
 * atualiza as receitas e o cardápio que usam esse prato").
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

  const receitas = await receitasDoPrato(idOriginal!);
  const operacoes: Operacao[] = [
    { tipo: 'delete', colecao: 'pratos', id: idOriginal! },
    { tipo: 'set', colecao: 'pratos', id: novoId, dados: { nome: nomeLimpo } },
  ];

  for (const receita of receitas) {
    operacoes.push(
      { tipo: 'delete', colecao: 'receitas', id: receita.id },
      {
        tipo: 'set',
        colecao: 'receitas',
        id: idReceita(novoId, receita.ingrediente_id),
        dados: {
          prato_id: novoId,
          ingrediente_id: receita.ingrediente_id,
          quantidade_por_pessoa: receita.quantidade_por_pessoa,
        },
      },
    );
  }

  await executarOperacoes(operacoes);
}

/**
 * RFS04: exclui o prato e, junto, as receitas dele.
 *
 * O bloqueio por cardápio entra na R03 (a entidade ainda não existe aqui).
 */
export async function removerPrato(nome: string): Promise<void> {
  const id = idSeguro(nome);
  const receitas = await receitasDoPrato(id);

  const operacoes: Operacao[] = receitas.map((receita) => ({
    tipo: 'delete',
    colecao: 'receitas',
    id: receita.id,
  }));
  operacoes.push({ tipo: 'delete', colecao: 'pratos', id });

  await executarOperacoes(operacoes);
}
