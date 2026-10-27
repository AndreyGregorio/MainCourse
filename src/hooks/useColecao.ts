import { useCallback, useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { mensagemDeErro } from '../lib/utils';

export type EstadoColecao<T> = {
  dados: T[];
  /** Ainda não chegou nenhum snapshot (nem do cache local). */
  carregando: boolean;
  erro: string | null;
  /** true quando os dados exibidos vieram do cache offline. */
  daCache: boolean;
  atualizadoEm: Date | null;
  recarregar: () => void;
};

/**
 * Assina uma coleção do Firestore em tempo real.
 *
 * Qualquer mudança feita em outro aparelho aparece aqui na hora; o cache
 * offline do IndexedDB continua atendendo quando não há sinal.
 *
 * `mapear` precisa ser uma referência estável (função de módulo), senão a
 * assinatura é refeita a cada renderização.
 */
export function useColecao<T>(
  nome: string,
  mapear: (id: string, dados: DocumentData) => T,
): EstadoColecao<T> {
  const [dados, setDados] = useState<T[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [daCache, setDaCache] = useState(true);
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let primeira = true;

    const cancelar = onSnapshot(
      collection(db, nome),
      { includeMetadataChanges: true },
      (snapshot) => {
        setDados(snapshot.docs.map((d) => mapear(d.id, d.data())));
        setDaCache(snapshot.metadata.fromCache);
        setErro(null);
        if (primeira) {
          setCarregando(false);
          primeira = false;
        }
        if (!snapshot.metadata.fromCache) setAtualizadoEm(new Date());
      },
      (falha) => {
        setErro(mensagemDeErro(falha));
        setCarregando(false);
      },
    );

    return cancelar;
  }, [nome, mapear, tentativa]);

  const recarregar = useCallback(() => {
    setCarregando(true);
    setErro(null);
    setTentativa((n) => n + 1);
  }, []);

  return { dados, carregando, erro, daCache, atualizadoEm, recarregar };
}

/** Indica se o navegador está com internet. */
export function useOnline(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const ligar = () => setOnline(true);
    const desligar = () => setOnline(false);
    window.addEventListener('online', ligar);
    window.addEventListener('offline', desligar);
    return () => {
      window.removeEventListener('online', ligar);
      window.removeEventListener('offline', desligar);
    };
  }, []);

  return online;
}
