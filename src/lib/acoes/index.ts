/**
 * Ações de escrita no Firestore, organizadas por domínio (RNF012).
 *
 * A interface importa tudo deste barril (`import * as acoes from '../lib/acoes'`)
 * e cada domínio fica em seu próprio módulo: pratos, ingredientes, receitas e
 * despensa.
 */

export * from './pratos';
export * from './ingredientes';
export * from './receitas';
export * from './despensa';
