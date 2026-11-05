import { useRota } from '../hooks/useRota';
import { useDados } from '../hooks/useDados';
import { useAcoes } from '../hooks/useAcoes';
import { useOnline } from '../hooks/useColecao';
import { Abas } from './Abas';
import { Cabecalho } from './Cabecalho';
import { Rodape } from './Rodape';
import { TelaCarregando } from './TelaCarregando';
import { TelaPainel } from './TelaPainel';
import { Botao } from './ui/Basicos';

function AvisoBanco({ erro, aoRecarregar }: { erro: string; aoRecarregar: () => void }) {
  return (
    <div
      role="alert"
      data-testid="aviso-banco"
      className="mx-auto mb-6 max-w-6xl rounded-xl border border-maincourse-red/30 bg-maincourse-red/5 px-4 py-3 text-sm text-maincourse-navy"
    >
      <p className="font-bold text-maincourse-red">O banco de dados não respondeu como esperado</p>
      <p className="mt-1 leading-relaxed text-maincourse-navy/70">{erro}</p>
      <p className="mt-1 leading-relaxed text-maincourse-navy/60">
        Se você acabou de atualizar o projeto, publique o <code>firestore.rules</code> desta release
        no Firebase Console (Firestore → Regras).
      </p>
      <Botao type="button" variante="secundario" className="mt-3" onClick={aoRecarregar}>
        Tentar de novo
      </Botao>
    </div>
  );
}

export function Aplicacao() {
  const { rota, parametros, irPara } = useRota();
  const dados = useDados();
  const acoes = useAcoes(dados);
  const online = useOnline();

  if (dados.carregando) {
    return <TelaCarregando mensagem="Conectando..." />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-maincourse-cream">
      <Cabecalho online={online} daCache={dados.daCache} atualizadoEm={dados.atualizadoEm} />

      <Abas
        rota={rota}
        contadores={{
          pratos: dados.pratos.length,
          ingredientes: dados.ingredientes.length,
          receitas: dados.receitas.length,
          despensa: dados.despensa.length,
        }}
      />

      <main className="flex-1 px-4 py-6 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-8">
        {dados.erro && <AvisoBanco erro={dados.erro} aoRecarregar={dados.recarregar} />}
        <TelaPainel
          rota={rota}
          parametros={parametros}
          irPara={irPara}
          dados={dados}
          acoes={acoes}
        />
      </main>

      <Rodape />
    </div>
  );
}
