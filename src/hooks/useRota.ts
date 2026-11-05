import { useCallback, useEffect, useState } from 'react';
import type { RotaId } from '../lib/rotas';
import { ROTA_PADRAO, rotaValida } from '../lib/rotas';

export type Parametros = Record<string, string>;

type Hash = {
  rota: RotaId;
  parametros: Parametros;
};

function lerHash(): Hash {
  if (typeof window === 'undefined') return { rota: ROTA_PADRAO, parametros: {} };

  const bruto = window.location.hash.replace(/^#\/?/, '');
  const [caminho, consulta = ''] = bruto.split('?');
  const parametros: Parametros = {};
  new URLSearchParams(consulta).forEach((valor, chave) => {
    if (valor) parametros[chave] = valor;
  });

  return { rota: rotaValida(caminho) ? caminho : ROTA_PADRAO, parametros };
}

/**
 * Navegação por hash (`#/receitas?prato=lasanha`).
 *
 * O hash mantém o endereço compartilhável e o botão "voltar" funcionando sem
 * precisar de um roteador — o app continua sendo um único HTML estático, como
 * o GitHub Pages exige. Os parâmetros carregam o contexto de uma seção para
 * outra (por exemplo, abrir as receitas já filtradas por um prato).
 */
export function useRota() {
  const [hash, setHash] = useState<Hash>(lerHash);

  useEffect(() => {
    const aoMudar = () => setHash(lerHash());
    window.addEventListener('hashchange', aoMudar);
    return () => window.removeEventListener('hashchange', aoMudar);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [hash.rota]);

  const irPara = useCallback((destino: RotaId, parametros?: Parametros) => {
    const consulta = new URLSearchParams(parametros ?? {}).toString();
    const novo = `#/${destino}${consulta ? `?${consulta}` : ''}`;
    if (window.location.hash !== novo) window.location.hash = novo;
    setHash({ rota: destino, parametros: parametros ?? {} });
  }, []);

  return { rota: hash.rota, parametros: hash.parametros, irPara };
}
