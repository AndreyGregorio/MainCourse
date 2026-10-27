import type { Unidade } from '../types';

/**
 * Id de documento do Firestore.
 *
 * O nome é o identificador do registro (DRE, RFS01/RFS05), então usamos uma
 * versão em minúsculas para que "Lasanha" e "lasanha" sejam o mesmo registro.
 * O Firestore não aceita "/" em ids; trocamos por "-".
 */
export function idSeguro(nome: string): string {
  return nome.trim().toLowerCase().replace(/\//g, '-');
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
