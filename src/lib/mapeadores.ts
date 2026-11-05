import type { DocumentData } from 'firebase/firestore';
import type {
  DiaCardapio,
  Embalagem,
  Ingrediente,
  ItemDespensa,
  MarcacaoCompra,
  Prato,
  Receita,
} from '../types';
import { normalizarCategoria, normalizarDia, normalizarUnidade } from './utils';

/**
 * Conversores Firestore -> tipos da aplicação.
 *
 * Ficam no nível do módulo de propósito: são referências estáveis, então o
 * useEffect do hook `useColecao` não reassina a conexão em tempo real a cada
 * renderização.
 */

export function mapearPrato(id: string, dados: DocumentData): Prato {
  const porcoes = Number(dados.porcoes_base);
  return {
    id,
    nome: String(dados.nome ?? id),
    porcoes_base:
      Number.isFinite(porcoes) && porcoes >= 1 ? Math.floor(porcoes) : 1,
  };
}

/**
 * Embalagem vinda do banco; qualquer formato estranho vira `null` (a granel),
 * para um dado antigo ou editado à mão não quebrar a lista de compras.
 */
function mapearEmbalagem(valor: unknown): Embalagem | null {
  if (!valor || typeof valor !== 'object') return null;
  const dados = valor as { rotulo?: unknown; quantidade?: unknown };
  const rotulo = String(dados.rotulo ?? '').trim();
  const quantidade = Number(dados.quantidade ?? 0);
  if (!rotulo || !Number.isFinite(quantidade) || quantidade <= 0) return null;
  return { rotulo, quantidade };
}

export function mapearIngrediente(id: string, dados: DocumentData): Ingrediente {
  return {
    id,
    nome: String(dados.nome ?? id),
    unidade_medida: normalizarUnidade(dados.unidade_medida),
    embalagem: mapearEmbalagem(dados.embalagem),
  };
}

export function mapearReceita(id: string, dados: DocumentData): Receita {
  const [prato_id, ingrediente_id] = id.split('::');
  return {
    id,
    prato_id: String(dados.prato_id ?? prato_id ?? ''),
    ingrediente_id: String(dados.ingrediente_id ?? ingrediente_id ?? ''),
    // `quantidade_por_pessoa` é o nome antigo: sem migração, a quantidade
    // antiga vira "receita inteira" de um prato que rende 1 porção.
    quantidade: Number(dados.quantidade ?? dados.quantidade_por_pessoa ?? 0),
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

export function mapearDiaCardapio(id: string, dados: DocumentData): DiaCardapio {
  const dia = normalizarDia(dados.dia) ?? normalizarDia(id) ?? 'Segunda';
  return {
    id,
    dia,
    prato_id: String(dados.prato_id ?? ''),
    pessoas: Number(dados.pessoas ?? 1),
  };
}

export function mapearMarcacaoCompra(id: string, dados: DocumentData): MarcacaoCompra {
  const campo = dados.marcado_em;
  return {
    id,
    ingrediente_id: String(dados.ingrediente_id ?? id),
    marcado_em: typeof campo?.toDate === 'function' ? campo.toDate() : null,
  };
}
