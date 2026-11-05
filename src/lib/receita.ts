import type { Embalagem, Prato, Unidade } from '../types';
import { arredondarQuantidade, formatarQuantidade } from './utils';

/**
 * Regras de escalonamento da receita (SM-01).
 *
 * A quantidade da receita é guardada para a receita inteira (`porcoes_base`),
 * não por pessoa: é assim que a receita é escrita e é o único jeito de um item
 * comprado em embalagem fechar a conta sem fração de pacote.
 */

/** Rendimento do prato; valor ausente ou inválido cai em 1 (por pessoa). */
export function porcoesDoPrato(prato?: Pick<Prato, 'porcoes_base'> | null): number {
  const valor = Number(prato?.porcoes_base ?? 1);
  return Number.isFinite(valor) && valor >= 1 ? Math.floor(valor) : 1;
}

/** Quantidade do ingrediente para servir `pessoas` pessoas. */
export function quantidadeParaPessoas(
  quantidade: number,
  porcoes: number,
  pessoas: number,
): number {
  return arredondarQuantidade((quantidade * pessoas) / (porcoes > 0 ? porcoes : 1));
}

/**
 * Embalagens inteiras necessárias para cobrir a necessidade.
 *
 * `null` quando o item é comprado a granel (sem embalagem cadastrada). A folga
 * de 1e-9 evita que 0,5 / 0,5 vire 1,0000000000000002 e arredonde para 2.
 */
export function embalagensParaComprar(
  necessidade: number,
  embalagem: Embalagem | null,
): number | null {
  if (!embalagem || embalagem.quantidade <= 0) return null;
  return Math.ceil(necessidade / embalagem.quantidade - 1e-9);
}

/** "2 × pacote 500 g (1 kg)" — usado na lista, no texto e no CSV. */
export function textoEmbalagem(
  embalagens: number,
  embalagem: Embalagem,
  unidade: Unidade,
): string {
  const total = arredondarQuantidade(embalagens * embalagem.quantidade);
  return `${embalagens} × ${embalagem.rotulo} (${formatarQuantidade(total)} ${unidade})`;
}
