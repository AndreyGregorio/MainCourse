/** Rotas da aplicação (hash) e o rótulo de cada seção. */
export type RotaId =
  | 'inicio'
  | 'pratos'
  | 'ingredientes'
  | 'receitas'
  | 'despensa'
  | 'cardapio'
  | 'compras';

export type Rota = {
  id: RotaId;
  rotulo: string;
};

export const ROTAS: Rota[] = [
  { id: 'inicio', rotulo: 'Painel' },
  { id: 'pratos', rotulo: 'Pratos' },
  { id: 'ingredientes', rotulo: 'Ingredientes' },
  { id: 'receitas', rotulo: 'Receitas' },
  { id: 'despensa', rotulo: 'Despensa' },
  { id: 'cardapio', rotulo: 'Cardápio' },
  { id: 'compras', rotulo: 'Compras' },
];

export const ROTA_PADRAO: RotaId = 'inicio';

export function rotaValida(valor: string): valor is RotaId {
  return ROTAS.some((rota) => rota.id === valor);
}
