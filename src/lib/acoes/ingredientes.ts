import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import type { Unidade } from '../../types';
import { idSeguro, listarNomes, normalizarUnidade } from '../utils';
import { executarOperacoes, validarNome } from './comum';
import type { Operacao } from './comum';
import { receitasDoIngrediente } from './receitas';

/** RFS05: cria um ingrediente. O nome não pode repetir (sem diferenciar maiúsculas). */
export async function criarIngrediente(nome: string, unidade: Unidade): Promise<void> {
  const nomeLimpo = validarNome(nome, 'ingrediente');
  const unidadeLimpa = normalizarUnidade(unidade);
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
 *
 * Pelo DRE, a unidade vale para todas as receitas e para os itens de despensa
 * que usam o ingrediente. As receitas não guardam unidade (herdam a do
 * ingrediente), então só os itens de despensa homônimos precisam acompanhar.
 */
export async function atualizarUnidadeIngrediente(nome: string, unidade: Unidade): Promise<void> {
  const unidadeLimpa = normalizarUnidade(unidade);
  const nomeLimpo = nome.trim();

  const itens = await getDocs(
    query(collection(db, 'despensa'), where('nome', '==', nomeLimpo)),
  );

  const operacoes: Operacao[] = [
    {
      tipo: 'update',
      colecao: 'ingredientes',
      id: idSeguro(nomeLimpo),
      dados: { unidade_medida: unidadeLimpa },
    },
  ];

  for (const item of itens.docs) {
    operacoes.push({
      tipo: 'update',
      colecao: 'despensa',
      id: item.id,
      dados: { unidade_medida: unidadeLimpa },
    });
  }

  await executarOperacoes(operacoes);
}

/**
 * RFS08: exclui o ingrediente, desde que nenhuma receita o use.
 *
 * O DRE exige que o sistema informe os pratos e não exclua; o bloqueio é
 * revalidado no banco (e não só na tela) para o caso de dados desatualizados.
 */
export async function removerIngrediente(nome: string): Promise<void> {
  const id = idSeguro(nome);
  const receitas = await receitasDoIngrediente(id);

  if (receitas.length > 0) {
    const idsPratos = [...new Set(receitas.map((receita) => receita.prato_id))];
    const nomes = await Promise.all(
      idsPratos.map(async (pratoId) => {
        const prato = await getDoc(doc(db, 'pratos', pratoId));
        return prato.exists() ? String(prato.data().nome ?? pratoId) : pratoId;
      }),
    );
    throw new Error(
      `O ingrediente “${nome.trim()}” é usado nas receitas de ${listarNomes(nomes)}. ` +
        'Remova-o dessas receitas antes de excluir.',
    );
  }

  await executarOperacoes([{ tipo: 'delete', colecao: 'ingredientes', id }]);
}
