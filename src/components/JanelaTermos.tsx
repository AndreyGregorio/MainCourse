import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { URL_REPOSITORIO, VERSAO } from '../lib/constants';
import {
  VERSAO_TERMOS,
  aceiteTermosValido,
  formatarDataAceite,
  registrarAceiteTermos,
} from '../lib/termos';
import type { AceiteTermos } from '../lib/termos';
import { Logo } from './Logo';
import { Botao } from './ui/Basicos';

type Props = {
  aceite: AceiteTermos | null;
  aoAceitar: (aceite: AceiteTermos) => void;
  aoFechar?: () => void;
};

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-base font-bold text-maincourse-navy">{titulo}</h2>
      <div className="mt-1 space-y-2">{children}</div>
    </section>
  );
}

/**
 * Janela de aceite dos termos.
 *
 * Sem um aceite válido ela é obrigatória e não pode ser fechada; depois do
 * aceite, o rodapé abre a mesma janela apenas para leitura.
 */
export function JanelaTermos({ aceite, aoAceitar, aoFechar }: Props) {
  const obrigatoria = !aceiteTermosValido(aceite);
  const [marcado, setMarcado] = useState(false);

  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = anterior;
    };
  }, []);

  useEffect(() => {
    if (obrigatoria || !aoFechar) return;

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') aoFechar();
    };

    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [obrigatoria, aoFechar]);

  function aceitar() {
    if (!marcado) return;
    aoAceitar(registrarAceiteTermos());
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-maincourse-navy/60 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(evento) => {
        if (!obrigatoria && evento.target === evento.currentTarget) aoFechar?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="termos-titulo"
        aria-describedby="termos-intro"
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-center gap-3 border-b border-maincourse-navy/10 px-5 py-4">
          <Logo tamanho={44} />
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-maincourse-gold">
              MainCourse · v{VERSAO}
            </p>
            <h1
              id="termos-titulo"
              className="font-display text-2xl font-bold leading-tight text-maincourse-navy"
            >
              Termos de uso
            </h1>
          </div>
        </header>

        <div className="space-y-4 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-maincourse-navy/70">
          <p id="termos-intro">
            Antes de usar o MainCourse, leia os termos abaixo. Eles explicam para que serve o app,
            como os seus dados são tratados e quais são as responsabilidades de cada lado.
          </p>

          <Secao titulo="1. Sobre o app">
            <p>
              O MainCourse organiza pratos, receitas, cardápio, lista de compras e despensa. É um
              projeto educacional da disciplina de Gerência de Projetos de Software, oferecido de
              graça e no estado em que se encontra, sem garantia de disponibilidade ou de adequação
              a um objetivo específico.
            </p>
            <p>
              O código-fonte está disponível em{' '}
              <a
                href={URL_REPOSITORIO}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-maincourse-navy underline decoration-maincourse-gold/60 underline-offset-2"
              >
                github.com/AndreyGregorio/MainCourse
              </a>
              .
            </p>
          </Secao>

          <Secao titulo="2. Uso responsável">
            <p>
              Use o app apenas para fins pessoais e lícitos. Você é responsável pelas informações
              que cadastrar e pelo acesso ao seu dispositivo. Não cadastre dados sensíveis, como
              documentos, senhas, dados bancários ou informações de terceiros sem autorização.
            </p>
          </Secao>

          <Secao titulo="3. Privacidade e dados">
            <p>
              O acesso é feito por uma sessão anônima do Firebase: não pedimos nome, e-mail nem
              senha. Os dados cadastrados ficam no Cloud Firestore e podem ser acessados por quem
              tiver acesso ao sistema. Não vendemos dados nem usamos publicidade.
            </p>
          </Secao>

          <Secao titulo="4. Armazenamento no navegador">
            <p>
              O navegador guarda o aceite destes termos e um cache dos dados para o app funcionar
              offline. Você pode apagar esses dados nas configurações do navegador; isso também
              remove o aceite e fará esta janela aparecer novamente.
            </p>
          </Secao>

          <Secao titulo="5. Disponibilidade e limitações">
            <p>
              O app é um projeto acadêmico e pode mudar, ficar indisponível ou ser encerrado sem
              aviso. A lista de compras é uma ajuda para o planejamento: confira quantidades,
              validade e restrições alimentares antes de comprar ou consumir.
            </p>
          </Secao>

          <Secao titulo="6. Aceite">
            <p>
              Ao marcar a caixa e clicar em “Aceitar e continuar”, você declara que leu e concorda
              com estes termos. Se não concordar, não use o sistema. Se os termos mudarem, um novo
              aceite será solicitado.
            </p>
          </Secao>

          <p className="rounded-xl bg-maincourse-cream px-3 py-2 text-xs text-maincourse-navy/50">
            Termos versão {VERSAO_TERMOS} · atualizados em novembro de 2026.
          </p>
        </div>

        <footer className="border-t border-maincourse-navy/10 bg-maincourse-cream/40 px-5 py-4">
          {obrigatoria ? (
            <>
              <label className="flex cursor-pointer items-start gap-3 text-sm font-medium text-maincourse-navy/80">
                <input
                  type="checkbox"
                  checked={marcado}
                  onChange={(evento) => setMarcado(evento.target.checked)}
                  autoFocus
                  className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-maincourse-navy"
                />
                <span>
                  Li e concordo com os termos de uso e com o tratamento dos meus dados descrito
                  acima.
                </span>
              </label>

              <Botao
                type="button"
                className="mt-4 w-full"
                disabled={!marcado}
                onClick={aceitar}
              >
                Aceitar e continuar
              </Botao>
              <p className="mt-2 text-center text-[11px] text-maincourse-navy/45">
                O aceite fica salvo neste navegador.
              </p>
            </>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-maincourse-navy/55">
                {aceite && formatarDataAceite(aceite.aceitoEm) ? (
                  <>
                    Aceito em <strong>{formatarDataAceite(aceite.aceitoEm)}</strong>.
                  </>
                ) : (
                  'Estes termos ainda não foram aceitos.'
                )}
              </p>
              <Botao type="button" variante="secundario" onClick={aoFechar} autoFocus>
                Fechar
              </Botao>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
