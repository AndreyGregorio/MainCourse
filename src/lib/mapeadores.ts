import type { DocumentData } from 'firebase/firestore';
import type { Ingrediente, ItemDespensa, Prato, Receita } from '../types';
import { normalizarCategoria, normalizarUnidade } from './utils';

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

export function mapearReceita(id: string, dados: DocumentData): Receita {
  const [prato_id, ingrediente_id] = id.split('::');
  return {
    id,
    prato_id: String(dados.prato_id ?? prato_id ?? ''),
    ingrediente_id: String(dados.ingrediente_id ?? ingrediente_id ?? ''),
    quantidade_por_pessoa: Number(dados.quantidade_por_pessoa ?? 0),
  };
}

export function mapearItemDespensa(id: string, dados: DocumentData): ItemDespensa {
  return {
    id,
    nome: String(dados.nome ?? id),
    categoria: normalizarCategoria(dados.categoria),
    quantidade: Number(dados.quantidade ?? 0),
    unidade_medida: normalizarUnidade(dados.unidade_medida),
    observacao: String(dados.observacao ?? ''),
  };
}
