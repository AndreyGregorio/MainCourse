import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { TelaCarregando } from './components/TelaCarregando';

const raiz = createRoot(document.getElementById('root')!);

raiz.render(
  <StrictMode>
    <TelaCarregando mensagem="Conectando..." />
  </StrictMode>,
);

import('./App')
  .then(({ default: App }) => {
    raiz.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  })
  .catch((falha: unknown) => {
    console.error('Falha ao carregar o MainCourse', falha);
  });
