import type { CategoriaDespensa, Unidade } from '../types';
import { CASAS_QUANTIDADE } from './constants';

const FATOR_QUANTIDADE = 10 ** CASAS_QUANTIDADE;

/**
 * Id de documento do Firestore.
 *
 * O nome é o identificador do registro (DRE, RFS01/RFS05), então usamos uma
 * versão em minúsculas para que "Lasanha" e "lasanha" sejam o mesmo registro.
 * O Firestore não aceita "/" em ids; ":" é reservado para os ids compostos das
 * coleções `receitas` e `despensa`.
 */
export function idSeguro(nome: string): string {
  return nome.trim().toLowerCase().replace(/[/:]/g, '-');
}

/** Minúsculo e sem acento, para busca e comparação. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function compararNomes(a: string, b: string): number {
  return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
}

/** Unifica 'un', 'unidades', 'UN', 'kg', 'L' e afins vindos do banco. */
export function normalizarUnidade(valor: unknown): Unidade {
  const v = String(valor ?? '').trim().toLowerCase();
  if (v === 'kg' || v === 'kilo' || v === 'quilo' || v === 'quilograma') return 'kg';
  if (v === 'l' || v === 'lt' || v === 'litro' || v === 'litros') return 'L';
  return 'un';
}

/** Categoria da despensa normalizada; qualquer valor estranho cai em "Itens Gerais". */
export function normalizarCategoria(valor: unknown): CategoriaDespensa {
  const v = normalizar(String(valor ?? ''));
  if (v === 'limpeza') return 'Limpeza';
  if (v === 'salada') return 'Salada';
  if (v === 'temperos') return 'Temperos';
  return 'Itens Gerais';
}

/** Parte usada no id composto de um item da despensa: "itens-gerais". */
export function slugCategoria(categoria: CategoriaDespensa): string {
  return normalizar(categoria).replace(/\s+/g, '-');
}

/** Id composto das coleções `receitas` e `despensa`. */
export function idComposto(primeiro: string, segundo: string): string {
  return `${primeiro}::${segundo}`;
}

export function idReceita(pratoId: string, ingredienteId: string): string {
  return idComposto(pratoId, ingredienteId);
}

export function idItemDespensa(categoria: CategoriaDespensa, nome: string): string {
  return idComposto(slugCategoria(categoria), idSeguro(nome));
}

/** Arredonda para as casas usadas no domínio, evitando ruído de ponto flutuante. */
export function arredondarQuantidade(valor: number): number {
  return Math.round((valor + Number.EPSILON) * FATOR_QUANTIDADE) / FATOR_QUANTIDADE;
}

/** Converte o texto digitado ("1,5" ou "1.5") em número; null quando inválido. */
export function analisarQuantidade(texto: string): number | null {
  const limpo = texto.trim().replace(/\s/g, '').replace(',', '.');
  if (!limpo) return null;
  const valor = Number(limpo);
  if (!Number.isFinite(valor)) return null;
  return arredondarQuantidade(valor);
}

/** "1 prato" / "2 pratos" — plural simples para os contadores da interface. */
export function pluralizar(quantidade: number, singular: string, plural: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}

/** Une nomes em lista legível: "A, B e C". */
export function listarNomes(nomes: string[]): string {
  if (nomes.length === 0) return '';
  if (nomes.length === 1) return nomes[0];
  return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`;
}

/** Exibe a quantidade no padrão brasileiro, sem zeros à direita (0,5 / 2 / 1,25). */
export function formatarQuantidade(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: CASAS_QUANTIDADE,
  }).format(arredondarQuantidade(valor));
}

/** Quantidade com a unidade: "1,5 kg". */
export function formatarQuantidadeComUnidade(valor: number, unidade: Unidade): string {
  return `${formatarQuantidade(valor)} ${unidade}`;
}

/** "12:31" ou "ontem"? Hora local e, quando não for hoje, dia/mês. */
export function formatarAtualizacao(data: Date | null): string {
  if (!data) return '';
  const agora = new Date();
  const mesmoDia = data.toDateString() === agora.toDateString();
  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return mesmoDia
    ? hora
    : `${data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${hora}`;
}

/** Mensagem amigável para erros do Firebase e do app. */
export function mensagemDeErro(erro: unknown): string {
  const codigo = String((erro as { code?: string } | null)?.code ?? '');

  if (codigo.includes('permission-denied')) {
    return 'O banco recusou a operação. Confira se o login anônimo está ativo e se as regras do Firestore foram publicadas.';
  }
  if (codigo.includes('unavailable') || codigo.includes('network')) {
    return 'Sem conexão com o banco. O app continua funcionando com os dados salvos no aparelho.';
  }
  if (codigo.includes('failed-precondition')) {
    return 'O banco recusou a consulta. Pode faltar um índice no Firestore.';
  }
  if (codigo.includes('auth/operation-not-allowed') || codigo.includes('admin-restricted-operation')) {
    return 'O login anônimo está desativado no Firebase. Ative o provedor "Anônimo" em Authentication.';
  }
  if (codigo.includes('auth/unauthorized-domain')) {
    return 'Este domínio não está autorizado no Firebase Authentication. Adicione o domínio do GitHub Pages em Authentication → Settings → Authorized domains.';
  }
  if (codigo.includes('auth/network-request-failed')) {
    return 'Não foi possível falar com o Firebase Authentication. Verifique a conexão e tente de novo.';
  }
  if (codigo.includes('auth/invalid-api-key') || codigo.includes('invalid-api-key')) {
    return 'A chave do Firebase está inválida. Confira as variáveis VITE_FIREBASE_* no build.';
  }
  if (codigo.includes('configuration-not-found')) {
    return 'O Firebase Authentication não está configurado neste projeto. Ative o login anônimo no console.';
  }
  if (erro instanceof Error && erro.message) return erro.message;
  return 'Algo deu errado. Tente novamente.';
}
