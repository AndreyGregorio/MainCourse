import { useEffect, useState } from 'react';
import { Aplicacao } from './components/Aplicacao';
import { JanelaTermos } from './components/JanelaTermos';
import { ConfirmProvider } from './components/ui/ConfirmProvider';
import { ToastProvider } from './components/ui/ToastProvider';
import { TelaCarregando } from './components/TelaCarregando';
import { garantirLoginAnonimo } from './firebaseConfig';
import { aceiteTermosValido, lerAceiteTermos } from './lib/termos';
import type { AceiteTermos } from './lib/termos';

export default function App() {
  const [aceite, setAceite] = useState<AceiteTermos | null>(() => lerAceiteTermos());
  const [termosAbertos, setTermosAbertos] = useState(false);
  const [pronto, setPronto] = useState(false);
  const liberado = aceiteTermosValido(aceite);

  useEffect(() => {
    if (!liberado) return;

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
  }, [liberado]);

  if (!liberado) {
    return <JanelaTermos aceite={null} aoAceitar={setAceite} />;
  }

  if (!pronto) {
    return <TelaCarregando mensagem="Conectando..." />;
  }

  return (
    <>
      <ToastProvider>
        <ConfirmProvider>
          <Aplicacao aoAbrirTermos={() => setTermosAbertos(true)} />
        </ConfirmProvider>
      </ToastProvider>

      {termosAbertos && (
        <JanelaTermos
          aceite={aceite}
          aoAceitar={setAceite}
          aoFechar={() => setTermosAbertos(false)}
        />
      )}
    </>
  );
}
