import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import type { Embalagem, Unidade } from '../../types';
import { LIMITE_EMBALAGEM, LIMITE_QUANTIDADE } from '../constants';
import { arredondarQuantidade, idSeguro, listarNomes, normalizarUnidade } from '../utils';
import { executarOperacoes, validarNome } from './comum';
import type { Operacao } from './comum';
import { receitasDoIngrediente } from './receitas';

/**
 * SM-01: valida a embalagem de compra.
 *
 * O rótulo é livre ("pacote 500 g", "vidro 680 g", "dúzia"), mas a quantidade
 * precisa estar na unidade do ingrediente — é ela que a lista usa para
 * arredondar a compra para embalagens inteiras.
 */
function validarEmbalagem(embalagem: Embalagem | null): Embalagem | null {
  if (!embalagem) return null;

  const rotulo = embalagem.rotulo.trim();
  const quantidade = Number(embalagem.quantidade);

  if (!rotulo) {
    throw new Error('Informe o rótulo da embalagem (ex.: pacote 500 g).');
  }
  if (rotulo.length > LIMITE_EMBALAGEM) {
    throw new Error(`O rótulo da embalagem pode ter no máximo ${LIMITE_EMBALAGEM} caracteres.`);
  }
  if (!Number.isFinite(quantidade) || quantidade <= 0) {
    throw new Error('A quantidade da embalagem precisa ser um número maior que zero.');
  }
  if (quantidade > LIMITE_QUANTIDADE) {
    throw new Error(`A quantidade da embalagem pode ser no máximo ${LIMITE_QUANTIDADE}.`);
  }

  return { rotulo, quantidade: arredondarQuantidade(quantidade) };
}

/** RFS05: cria um ingrediente. O nome não pode repetir (sem diferenciar maiúsculas). */
export async function criarIngrediente(
  nome: string,
  unidade: Unidade,
  embalagem: Embalagem | null = null,
): Promise<void> {
  const nomeLimpo = validarNome(nome, 'ingrediente');
  const unidadeLimpa = normalizarUnidade(unidade);
  const embalagemLimpa = validarEmbalagem(embalagem);
  const id = idSeguro(nomeLimpo);

  const existente = await getDoc(doc(db, 'ingredientes', id));
  if (existente.exists()) {
    const nomeExistente = String(existente.data().nome ?? nomeLimpo);
    throw new Error(`Já existe um ingrediente chamado “${nomeExistente}”.`);
  }

  await setDoc(doc(db, 'ingredientes', id), {
    nome: nomeLimpo,
    unidade_medida: unidadeLimpa,
    embalagem: embalagemLimpa,
  });
}

/**
 * RFS07 + SM-01: o nome do ingrediente não pode ser alterado (é a chave usada
 * pelas receitas); unidade de medida e embalagem podem.
 *
 * Pelo DRE, a unidade vale para todas as receitas e para os itens de despensa
 * que usam o ingrediente. As receitas não guardam unidade (herdam a do
 * ingrediente), então só os itens de despensa homônimos precisam acompanhar.
 *
 * A embalagem é medida na unidade do ingrediente; se a unidade muda (de `kg`
 * para `un`, por exemplo), a embalagem antiga deixa de fazer sentido e é
 * apagada em vez de virar um número errado.
 */
export async function atualizarIngrediente(
  nome: string,
  unidade: Unidade,
  embalagem: Embalagem | null = null,
): Promise<void> {
  const unidadeLimpa = normalizarUnidade(unidade);
  const nomeLimpo = nome.trim();
  const id = idSeguro(nomeLimpo);

  const atual = await getDoc(doc(db, 'ingredientes', id));
  const unidadeAnterior = atual.exists()
    ? normalizarUnidade(atual.data().unidade_medida)
    : unidadeLimpa;
  const embalagemLimpa =
    unidadeAnterior === unidadeLimpa ? validarEmbalagem(embalagem) : null;

  const itens = await getDocs(
    query(collection(db, 'despensa'), where('nome', '==', nomeLimpo)),
  );

  const operacoes: Operacao[] = [
    {
      tipo: 'update',
      colecao: 'ingredientes',
      id,
      dados: { unidade_medida: unidadeLimpa, embalagem: embalagemLimpa },
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

  // RFS08: as marcações de compra do ingrediente são removidas junto.
  await executarOperacoes([
    { tipo: 'delete', colecao: 'ingredientes', id },
    { tipo: 'delete', colecao: 'compras', id },
  ]);
}
