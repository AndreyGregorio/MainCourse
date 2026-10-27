import { createContext, useContext } from 'react';

export type OpcoesConfirmacao = {
  titulo: string;
  descricao?: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  perigoso?: boolean;
};

export type ConfirmContexto = {
  confirmar: (opcoes: OpcoesConfirmacao) => Promise<boolean>;
};

export const ConfirmContext = createContext<ConfirmContexto | null>(null);

export function useConfirm(): ConfirmContexto['confirmar'] {
  const contexto = useContext(ConfirmContext);
  if (!contexto) throw new Error('useConfirm precisa estar dentro de <ConfirmProvider>.');
  return contexto.confirmar;
}
