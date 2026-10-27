import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { chavesFaltando, obterEnv } from './lib/env';

const firebaseConfig = {
  apiKey: obterEnv('VITE_FIREBASE_API_KEY'),
  authDomain: obterEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: obterEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: obterEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: obterEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: obterEnv('VITE_FIREBASE_APP_ID'),
  ...(obterEnv('VITE_FIREBASE_MEASUREMENT_ID')
    ? { measurementId: obterEnv('VITE_FIREBASE_MEASUREMENT_ID') }
    : {}),
};

const faltando = chavesFaltando();
if (faltando.length > 0) {
  throw new Error(`Firebase sem configuração. Faltam: ${faltando.join(', ')}.`);
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
auth.languageCode = 'pt-BR';

/**
 * Firestore com cache local persistente (IndexedDB).
 *
 * É isso que faz o app abrir e funcionar mesmo sem sinal: a primeira resposta
 * vem do aparelho e, quando a internet volta, o Firestore sincroniza sozinho.
 */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

let promessaLogin: Promise<void> | null = null;

/**
 * Garante uma sessão anônima antes de abrir as coleções.
 *
 * As regras do Firestore exigem `request.auth != null`; sem esperar o login,
 * as primeiras leituras seriam recusadas com permission-denied.
 */
export function garantirLoginAnonimo(): Promise<void> {
  if (!promessaLogin) {
    promessaLogin = (async () => {
      await auth.authStateReady();
      if (!auth.currentUser) await signInAnonymously(auth);
    })().catch((erro) => {
      promessaLogin = null;
      throw erro;
    });
  }

  return promessaLogin;
}
