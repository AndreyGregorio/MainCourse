import type { DocumentData } from 'firebase/firestore';
import type { Ingrediente, Prato } from '../types';
import { normalizarUnidade } from './utils';

/**
 * Conversores Firestore -> tipos da aplicação.
 *
 * Ficam no nível do módulo de propósito: são referências estáveis, então o
 * useEffect do hook `useColecao` não reassina a conexão em tempo real a cada
 * renderização.
 */

export function mapearPrato(id: string, dados: DocumentData): Prato {
  return {
    id,
    nome: String(dados.nome ?? id),
  };
}

export function mapearIngrediente(id: string, dados: DocumentData): Ingrediente {
  return {
    id,
    nome: String(dados.nome ?? id),
    unidade_medida: normalizarUnidade(dados.unidade_medida),
  };
}
