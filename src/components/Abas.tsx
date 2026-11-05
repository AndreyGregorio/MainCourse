import type { ComponentType } from 'react';
import type { RotaId } from '../lib/rotas';
import { ROTAS } from '../lib/rotas';
import {
  IconeCardapio,
  IconeCompras,
  IconeDespensa,
  IconeIngrediente,
  IconeInicio,
  IconePrato,
  IconeReceita,
} from './ui/Icones';

type Props = {
  rota: RotaId;
  contadores?: Partial<Record<RotaId, number>>;
};

const ICONES: Partial<Record<RotaId, ComponentType<{ className?: string }>>> = {
  inicio: IconeInicio,
  pratos: IconePrato,
  ingredientes: IconeIngrediente,
  receitas: IconeReceita,
  despensa: IconeDespensa,
  cardapio: IconeCardapio,
  compras: IconeCompras,
};

export function Abas({ rota, contadores = {} }: Props) {
  return (
    <nav
      aria-label="Seções do MainCourse"
      className="border-b border-maincourse-navy/10 bg-white/85 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-0 px-2 py-1 sm:flex-nowrap sm:justify-start sm:gap-x-1 sm:overflow-x-auto sm:px-6 sm:py-0">
        {ROTAS.map((item) => {
          const ativa = item.id === rota;
          const Icone = ICONES[item.id] ?? IconeInicio;
          const contador = contadores[item.id];
          return (
            <li key={item.id} className="w-1/4 sm:w-auto">
              <a
                href={`#/${item.id}`}
                aria-current={ativa ? 'page' : undefined}
                data-testid={`aba-${item.id}`}
                className={`flex w-full flex-col items-center justify-center gap-0.5 whitespace-nowrap border-b-2 px-1 py-1.5 text-[11px] font-bold transition sm:w-auto sm:flex-row sm:gap-2 sm:px-4 sm:py-3 sm:text-sm ${
                  ativa
                    ? 'border-maincourse-gold text-maincourse-navy'
                    : 'border-transparent text-maincourse-navy/55 hover:bg-maincourse-navy/5 hover:text-maincourse-navy'
                }`}
              >
                <span className={ativa ? 'text-maincourse-gold' : 'text-maincourse-navy/45'}>
                  <Icone className="h-[18px] w-[18px]" />
                </span>
                {item.rotulo}
                {typeof contador === 'number' && contador > 0 && (
                  <span
                    className={`hidden rounded-full px-1.5 py-0.5 text-[11px] font-bold sm:inline ${
                      ativa
                        ? 'bg-maincourse-gold/25 text-maincourse-navy'
                        : 'bg-maincourse-navy/10 text-maincourse-navy/60'
                    }`}
                  >
                    {contador}
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
