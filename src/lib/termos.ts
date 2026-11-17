/** Versão dos termos. Aumente este número para pedir um novo aceite. */
export const VERSAO_TERMOS = 1;

/** Chave usada no armazenamento local do navegador. */
export const CHAVE_ACEITE_TERMOS = 'maincourse:termos-de-uso';

export type AceiteTermos = {
  versao: number;
  aceitoEm: string;
};

/** Lê o aceite salvo no navegador, ignorando valores inválidos ou antigos. */
export function lerAceiteTermos(): AceiteTermos | null {
  if (typeof window === 'undefined') return null;

  try {
    const bruto = window.localStorage.getItem(CHAVE_ACEITE_TERMOS);
    if (!bruto) return null;

    const dados: unknown = JSON.parse(bruto);
    if (typeof dados !== 'object' || dados === null) return null;

    const { versao, aceitoEm } = dados as Partial<AceiteTermos>;
    if (versao !== VERSAO_TERMOS || typeof aceitoEm !== 'string') return null;
    if (Number.isNaN(Date.parse(aceitoEm))) return null;

    return { versao, aceitoEm };
  } catch {
    return null;
  }
}

/** Salva o aceite com a data e devolve o registro para o estado do app. */
export function registrarAceiteTermos(): AceiteTermos {
  const aceite: AceiteTermos = {
    versao: VERSAO_TERMOS,
    aceitoEm: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(CHAVE_ACEITE_TERMOS, JSON.stringify(aceite));
  } catch {
    // Navegador em modo privado ou sem espaço: o aceite vale para esta sessão.
  }

  return aceite;
}

/** Confere se o aceite existe e corresponde à versão atual dos termos. */
export function aceiteTermosValido(aceite: AceiteTermos | null): aceite is AceiteTermos {
  return aceite?.versao === VERSAO_TERMOS && !Number.isNaN(Date.parse(aceite.aceitoEm));
}

/** Data do aceite no formato brasileiro, usada na janela de leitura. */
export function formatarDataAceite(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(data);
}
