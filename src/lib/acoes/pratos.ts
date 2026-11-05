import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { LIMITE_PORCOES } from '../constants';
import { idReceita, idSeguro, listarNomes } from '../utils';
import { executarOperacoes, validarNome } from './comum';
import type { Operacao } from './comum';
import { receitasDoPrato } from './receitas';
import { diasDoPrato } from './cardapio';

/** SM-01: o rendimento é um inteiro na mesma faixa de pessoas do cardápio. */
function validarPorcoes(valor: number): number {
  if (!Number.isInteger(valor) || valor < 1 || valor > LIMITE_PORCOES) {
    throw new Error(
      `O rendimento do prato precisa ser um número inteiro entre 1 e ${LIMITE_PORCOES}.`,
    );
  }
  return valor;
}

/**
 * RFS01 e RFS03: cria um prato ou renomeia um existente.
 *
 * O nome é o identificador do registro, então renomear é apagar o documento
 * antigo e criar o novo. Como as receitas carregam o id do prato, a renomeação
 * migra os vínculos no mesmo lote — exatamente o que o RFS03 exige ("o sistema
 * atualiza as receitas e o cardápio que usam esse prato").
 *
 * `porcoesBase` é o rendimento da receita (SM-01): 1 mantém as quantidades por
 * pessoa; acima disso, a quantidade de cada receita vale para a receita inteira.
 * Renomear preserva o rendimento e as quantidades.
 */
export async function salvarPrato(
  nome: string,
  porcoesBase: number,
  nomeOriginal?: string,
): Promise<void> {
  const nomeLimpo = validarNome(nome, 'prato');
  const porcoes = validarPorcoes(porcoesBase);
  const novoId = idSeguro(nomeLimpo);
  const idOriginal = nomeOriginal ? idSeguro(nomeOriginal) : null;
  const mudouId = idOriginal !== null && idOriginal !== novoId;

  const existente = await getDoc(doc(db, 'pratos', novoId));
  if (existente.exists() && (!idOriginal || mudouId)) {
    const nomeExistente = String(existente.data().nome ?? nomeLimpo);
    throw new Error(`Já existe um prato chamado “${nomeExistente}”.`);
  }

  if (!mudouId) {
    await setDoc(doc(db, 'pratos', novoId), { nome: nomeLimpo, porcoes_base: porcoes });
    return;
  }

  const [receitas, dias] = await Promise.all([
    receitasDoPrato(idOriginal!),
    diasDoPrato(idOriginal!),
  ]);
  const operacoes: Operacao[] = [
    { tipo: 'delete', colecao: 'pratos', id: idOriginal! },
    {
      tipo: 'set',
      colecao: 'pratos',
      id: novoId,
      dados: { nome: nomeLimpo, porcoes_base: porcoes },
    },
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
          quantidade: receita.quantidade,
        },
      },
    );
  }

  // RFS03: o cardápio que usa o prato acompanha o novo nome (o prato_id muda).
  for (const dia of dias) {
    operacoes.push({
      tipo: 'update',
      colecao: 'cardapio',
      id: dia.id,
      dados: { prato_id: novoId },
    });
  }

  await executarOperacoes(operacoes);
}

/**
 * RFS04: exclui o prato e, junto, as receitas dele.
 *
 * Se o prato estiver no cardápio, a exclusão é impedida e o sistema informa os
 * dias — o usuário precisa liberar esses dias antes (RFS04).
 */
export async function removerPrato(nome: string): Promise<void> {
  const id = idSeguro(nome);
  const [receitas, dias] = await Promise.all([receitasDoPrato(id), diasDoPrato(id)]);

  if (dias.length > 0) {
    const rotulo = listarNomes(dias.map((dia) => dia.dia));
    throw new Error(
      `O prato “${nome.trim()}” está no cardápio de ${rotulo}. ` +
        `Remova ${dias.length === 1 ? 'esse dia' : 'esses dias'} antes de excluir o prato.`,
    );
  }

  const operacoes: Operacao[] = receitas.map((receita) => ({
    tipo: 'delete',
    colecao: 'receitas',
    id: receita.id,
  }));
  operacoes.push({ tipo: 'delete', colecao: 'pratos', id });

  await executarOperacoes(operacoes);
}
