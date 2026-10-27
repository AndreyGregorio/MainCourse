import { createContext, useContext } from 'react';

export type TipoToast = 'sucesso' | 'erro' | 'info';

export type Aviso = {
  id: number;
  tipo: TipoToast;
  mensagem: string;
};

export type ToastContexto = {
  avisar: (mensagem: string, tipo?: TipoToast) => void;
};

export const ToastContext = createContext<ToastContexto | null>(null);

export function useToast(): ToastContexto {
  const contexto = useContext(ToastContext);
  if (!contexto) throw new Error('useToast precisa estar dentro de <ToastProvider>.');
  return contexto;
}
