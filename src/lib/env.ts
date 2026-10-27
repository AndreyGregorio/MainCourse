/** Nomes das variáveis de ambiente usadas pelo Firebase. */
export const VARIAVEIS_FIREBASE = [
  { chave: 'VITE_FIREBASE_API_KEY', rotulo: 'API key' },
  { chave: 'VITE_FIREBASE_AUTH_DOMAIN', rotulo: 'Auth domain' },
  { chave: 'VITE_FIREBASE_PROJECT_ID', rotulo: 'Project ID' },
  { chave: 'VITE_FIREBASE_STORAGE_BUCKET', rotulo: 'Storage bucket' },
  { chave: 'VITE_FIREBASE_MESSAGING_SENDER_ID', rotulo: 'Messaging sender ID' },
  { chave: 'VITE_FIREBASE_APP_ID', rotulo: 'App ID' },
] as const;

export function obterEnv(chave: string): string {
  return String(import.meta.env[chave] ?? '').trim();
}

/** Lista das variáveis obrigatórias que ainda não foram definidas no build. */
export function chavesFaltando(): string[] {
  return VARIAVEIS_FIREBASE.filter(({ chave }) => !obterEnv(chave)).map(({ chave }) => chave);
}
