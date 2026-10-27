import { NOME_APP } from '../lib/constants';

type Props = {
  tamanho?: number;
  className?: string;
};

/**
 * Ícone oficial do MainCourse.
 *
 * `BASE_URL` mantém o caminho correto tanto em `/` quanto em
 * `/MainCourse/` (GitHub Pages).
 */
export function Logo({ tamanho = 44, className = '' }: Props) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}logo-96.png`}
      alt={`Logo ${NOME_APP}`}
      width={tamanho}
      height={tamanho}
      className={`shrink-0 rounded-xl bg-maincourse-cream object-contain p-0.5 shadow-sm ${className}`}
      style={{ width: tamanho, height: tamanho }}
    />
  );
}
