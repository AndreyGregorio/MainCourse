import { useEffect, useState } from 'react';
import { Aplicacao } from './components/Aplicacao';
import { ConfirmProvider } from './components/ui/ConfirmProvider';
import { ToastProvider } from './components/ui/ToastProvider';
import { TelaCarregando } from './components/TelaCarregando';
import { garantirLoginAnonimo } from './firebaseConfig';

export default function App() {
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    let ativo = true;
    let timer: number | undefined;
    let registrouErro = false;

    const tentar = async () => {
      try {
        await garantirLoginAnonimo();
        if (ativo) setPronto(true);
      } catch (erro) {
        if (!registrouErro) {
          console.error('Falha ao conectar ao Firebase', erro);
          registrouErro = true;
        }
        if (ativo) timer = window.setTimeout(() => void tentar(), 4000);
      }
    };

    void tentar();

    return () => {
      ativo = false;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  if (!pronto) {
    return <TelaCarregando mensagem="Conectando..." />;
  }

  return (
    <ToastProvider>
      <ConfirmProvider>
        <Aplicacao />
      </ConfirmProvider>
    </ToastProvider>
  );
}
