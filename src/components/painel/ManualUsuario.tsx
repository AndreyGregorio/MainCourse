import type { ReactNode } from 'react';
import type { RotaId } from '../../lib/rotas';
import { VERSAO, URL_REPOSITORIO } from '../../lib/constants';
import { Botao, SecaoCard, Selo } from '../ui/Basicos';
import {
  IconeCardapio,
  IconeCompras,
  IconeDespensa,
  IconeManual,
  IconeSeta,
} from '../ui/Icones';

type Props = {
  irPara: (rota: RotaId) => void;
};

const TOPICOS = [
  { id: 'visao-geral', titulo: 'Visão geral' },
  { id: 'painel', titulo: 'Painel' },
  { id: 'pratos', titulo: 'Pratos' },
  { id: 'ingredientes', titulo: 'Ingredientes' },
  { id: 'receitas', titulo: 'Receitas' },
  { id: 'despensa', titulo: 'Despensa' },
  { id: 'cardapio', titulo: 'Cardápio' },
  { id: 'compras', titulo: 'Compras' },
  { id: 'dicas', titulo: 'Dicas de uso' },
  { id: 'problemas', titulo: 'Problemas comuns' },
  { id: 'privacidade', titulo: 'Privacidade e dados' },
  { id: 'versao', titulo: 'Versão e suporte' },
] as const;

function Topico({
  id,
  titulo,
  children,
}: {
  id: string;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section
      id={`manual-${id}`}
      aria-labelledby={`manual-${id}-titulo`}
      className="scroll-mt-32 border-t border-maincourse-navy/10 pt-6 first:border-t-0 first:pt-0"
    >
      <h2
        id={`manual-${id}-titulo`}
        className="font-display text-xl font-bold text-maincourse-navy"
      >
        {titulo}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-maincourse-navy/70">
        {children}
      </div>
    </section>
  );
}

function Passos({ children }: { children: ReactNode }) {
  return (
    <ol className="list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-maincourse-gold">
      {children}
    </ol>
  );
}

function Dica({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-maincourse-gold/40 bg-maincourse-gold/10 px-3 py-2 text-sm text-maincourse-navy/75">
      {children}
    </p>
  );
}

function Pergunta({ pergunta, children }: { pergunta: string; children: ReactNode }) {
  return (
    <details className="rounded-xl border border-maincourse-navy/10 bg-maincourse-cream/40 p-3">
      <summary className="cursor-pointer select-none font-semibold text-maincourse-navy">
        {pergunta}
      </summary>
      <div className="mt-2 text-sm leading-relaxed text-maincourse-navy/65">{children}</div>
    </details>
  );
}

export function ManualUsuario({ irPara }: Props) {
  function irParaTopico(id: string) {
    document
      .getElementById(`manual-${id}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-maincourse-gold">RFC07</p>
        <h1 className="font-display text-3xl font-bold text-maincourse-navy">Manual do usuário</h1>
        <p className="mt-1 text-sm text-maincourse-navy/55">
          Um guia rápido para planejar a semana, montar a lista de compras e cuidar da despensa.
        </p>
      </header>

      <SecaoCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-maincourse-gold/20 text-maincourse-navy"
              aria-hidden="true"
            >
              <IconeManual className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-bold text-maincourse-navy">
                Como usar este manual
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-maincourse-navy/55">
                Você pode ler na ordem ou ir direto ao assunto pelo índice. Cada seção mostra o
                caminho na tela e as regras que o app aplica.
              </p>
            </div>
          </div>
          <Selo tom="gold">v{VERSAO}</Selo>
        </div>

        <nav aria-label="Índice do manual" className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {TOPICOS.map((topico) => (
            <button
              key={topico.id}
              type="button"
              onClick={() => irParaTopico(topico.id)}
              className="flex items-center justify-between gap-2 rounded-xl border border-maincourse-navy/10 bg-maincourse-cream/40 px-3 py-2 text-left text-sm font-semibold text-maincourse-navy transition hover:border-maincourse-gold/50 hover:bg-white"
            >
              {topico.titulo}
              <IconeSeta className="h-3.5 w-3.5 shrink-0 text-maincourse-navy/35" />
            </button>
          ))}
        </nav>
      </SecaoCard>

      <SecaoCard className="space-y-6">
        <Topico id="visao-geral" titulo="Visão geral">
          <p>
            O <strong className="text-maincourse-navy">MainCourse</strong> organiza o que a casa
            vai comer na semana e o que precisa ser comprado. Tudo fica salvo no Firebase e
            sincroniza entre celular e computador; sem internet, o app continua abrindo com os
            dados do aparelho.
          </p>
          <p>O fluxo recomendado é:</p>
          <Passos>
            <li>Cadastre os <strong>ingredientes</strong> com unidade e, se quiser, embalagem.</li>
            <li>Cadastre os <strong>pratos</strong> e o rendimento de cada receita.</li>
            <li>Monte as <strong>receitas</strong> ligando cada prato aos ingredientes.</li>
            <li>Planeje o <strong>cardápio</strong> de segunda a sexta com o número de pessoas.</li>
            <li>Abra <strong>Compras</strong>, marque o que já comprou e compartilhe a lista.</li>
          </Passos>
          <Dica>
            A <strong>Despensa</strong> é uma lista à parte, de itens fixos da casa. Na R04, esses
            itens também aparecem no fim da tela de Compras para serem marcados.
          </Dica>
        </Topico>

        <Topico id="painel" titulo="Painel">
          <p>
            O painel mostra quantos pratos, ingredientes, receitas, itens de despensa, dias de
            cardápio e itens de compra existem. Clique em qualquer cartão para abrir a seção
            correspondente.
          </p>
          <p>
            No topo, o indicador <strong>Online/Offline</strong> avisa quando o app está usando os
            dados salvos no aparelho. Quando a conexão volta, o Firestore sincroniza sozinho.
          </p>
        </Topico>

        <Topico id="pratos" titulo="Pratos">
          <p>
            Um prato é o nome que aparece no cardápio. O nome não pode repetir (maiúsculas e
            minúsculas não diferenciam) e o campo <strong>Rende (porções)</strong> diz quantas
            porções a receita inteira serve.
          </p>
          <Passos>
            <li>Abra <strong>Pratos</strong> e digite o nome, por exemplo “Lasanha à bolonhesa”.</li>
            <li>Informe o rendimento: 8 para uma travessa que serve 8 pessoas; 1 para receitas escritas por pessoa.</li>
            <li>Clique em <strong>Adicionar</strong>.</li>
            <li>Use a busca para filtrar e os botões <strong>Receita</strong>, <strong>Editar</strong> e <strong>Excluir</strong> em cada linha.</li>
          </Passos>
          <Dica>
            Renomear um prato atualiza as receitas e os dias do cardápio que usam esse prato. A
            exclusão é bloqueada se o prato estiver no cardápio.
          </Dica>
        </Topico>

        <Topico id="ingredientes" titulo="Ingredientes">
          <p>
            Cada ingrediente tem um nome, uma unidade (<code>kg</code>, <code>L</code> ou{' '}
            <code>un</code>) e, opcionalmente, uma <strong>embalagem de compra</strong> — por
            exemplo, “pacote 500 g” com quantidade <code>0,5</code> em um ingrediente medido em{' '}
            <code>kg</code>.
          </p>
          <Passos>
            <li>Abra <strong>Ingredientes</strong> e digite o nome.</li>
            <li>Escolha a unidade usada na receita.</li>
            <li>Se comprar em embalagem fechada, preencha o rótulo e a quantidade da embalagem.</li>
            <li>Clique em <strong>Adicionar</strong>.</li>
          </Passos>
          <p>
            O nome é a chave do cadastro e não muda na edição; só a unidade e a embalagem podem ser
            alteradas. Trocar a unidade limpa a embalagem, porque a quantidade antiga deixaria de
            fazer sentido.
          </p>
          <Dica>
            Excluir um ingrediente usado em receita é bloqueado; o app mostra os pratos que o usam.
          </Dica>
        </Topico>

        <Topico id="receitas" titulo="Receitas">
          <p>
            A receita liga um prato a um ingrediente e guarda a quantidade. Você pode informar a
            quantidade <strong>por pessoa</strong> ou a quantidade da <strong>receita inteira</strong>,
            conforme o rendimento do prato.
          </p>
          <Passos>
            <li>Abra <strong>Receitas</strong> e escolha o prato.</li>
            <li>Escolha o ingrediente; ele não pode repetir no mesmo prato.</li>
            <li>Escolha <strong>Por pessoa</strong> ou <strong>Receita inteira</strong> e digite a quantidade.</li>
            <li>Clique em <strong>Adicionar</strong>.</li>
          </Passos>
          <p>
            Na lista, cada linha mostra a quantidade, o modo e o rendimento do prato. Para corrigir,
            use <strong>Editar</strong> (só a quantidade muda) ou <strong>Excluir</strong> (remove o
            vínculo, sem apagar prato nem ingrediente).
          </p>
          <Dica>
            Exemplo: uma lasanha rende 8 porções e leva 0,5 kg de massa. Informando “receita
            inteira”, o cardápio para 4 pessoas usa 0,25 kg.
          </Dica>
        </Topico>

        <Topico id="despensa" titulo="Despensa">
          <p>
            A despensa guarda os itens fixos da casa nas categorias <strong>Limpeza</strong>,{' '}
            <strong>Salada</strong>, <strong>Temperos</strong> e <strong>Itens Gerais</strong>. Ela
            serve para consulta e, a partir da R04, também aparece na tela de Compras para ser
            marcada.
          </p>
          <Passos>
            <li>Abra <strong>Despensa</strong> e informe nome, categoria, quantidade e unidade.</li>
            <li>Use observação para marca, validade ou onde o item fica guardado.</li>
            <li>Quantidade zero aparece como <strong>Em falta</strong>.</li>
            <li>Edite para repor ou consumir; o nome não muda, mas a categoria pode.</li>
          </Passos>
          <Dica>
            A quantidade da despensa é o estoque atual. Ela não é descontada da lista de compras e
            não entra no resumo por unidade; serve como checklist de reposição.
          </Dica>
        </Topico>

        <Topico id="cardapio" titulo="Cardápio">
          <p>
            O cardápio cobre de segunda a sexta, com um prato por dia e o número de pessoas. Só
            aparecem na escolha os pratos que têm pelo menos um ingrediente na receita.
          </p>
          <Passos>
            <li>Abra <strong>Cardápio</strong> e escolha o dia e o prato.</li>
            <li>Informe quantas pessoas vão comer naquele dia.</li>
            <li>Clique em <strong>Planejar</strong>.</li>
            <li>Use <strong>Editar</strong> para trocar prato/pessoas; o dia não muda.</li>
            <li>Use <strong>Excluir</strong> para liberar o dia e tirar os ingredientes da lista.</li>
          </Passos>
          <Dica>
            Se um prato ficar sem receita depois de já estar no cardápio, o dia continua lá, mas não
            gera itens na lista até você ajustar a receita ou trocar o prato.
          </Dica>
        </Topico>

        <Topico id="compras" titulo="Compras">
          <p>
            A lista de ingredientes é calculada a partir do cardápio e das receitas. Cada linha
            mostra a quantidade total, a unidade, os dias e os pratos em que o ingrediente é usado.
            Com embalagem cadastrada, o app também diz quantas embalagens comprar.
          </p>
          <Passos>
            <li>Abra <strong>Compras</strong> e confira a lista da semana.</li>
            <li>Use o filtro por dia para ver só o que é usado naquele dia.</li>
            <li>Marque a caixa de cada item já comprado; o progresso e o resumo por unidade acompanham.</li>
            <li>Use <strong>Copiar resumo</strong> ou <strong>Baixar CSV</strong> para compartilhar.</li>
            <li>No fim da tela, marque também os <strong>itens da despensa</strong> que já comprou.</li>
          </Passos>
          <p>
            Os itens da despensa têm uma caixa de seleção própria, separada dos ingredientes, porque
            a quantidade deles é o estoque da casa e não a necessidade calculada pelo cardápio. Eles
            entram no texto compartilhado e no CSV, mas não no resumo por unidade.
          </p>
          <p>
            O botão <strong>Limpar marcações</strong> desmarca de uma vez os ingredientes e os itens
            da despensa. A lista em si não muda.
          </p>
          <Dica>
            A lista não desconta automaticamente o que já existe na despensa. Se quiser considerar o
            estoque, ajuste a quantidade na hora de comprar ou use a observação do item.
          </Dica>
        </Topico>

        <Topico id="dicas" titulo="Dicas de uso">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Cadastre a embalagem (pacote, vidro, lata) para a lista dizer quantos volumes comprar.</li>
            <li>Use o rendimento do prato para receitas escritas para a travessa inteira.</li>
            <li>Itens com quantidade zero na despensa aparecem como “Em falta” e podem ser marcados na compra.</li>
            <li>Em celular, o layout se adapta e as abas ficam em duas linhas.</li>
            <li>Sem internet, o app abre com o cache; as alterações são sincronizadas quando a conexão volta.</li>
            <li>Abra o app em outro aparelho com a mesma URL para ver os dados atualizados em tempo real.</li>
          </ul>
        </Topico>

        <Topico id="problemas" titulo="Problemas comuns">
          <div className="space-y-2">
            <Pergunta pergunta="Não consigo excluir um prato">
              <p>
                Se ele estiver no cardápio, remova os dias primeiro. Se tiver receitas, a exclusão
                do prato leva as receitas junto e o app avisa antes.
              </p>
            </Pergunta>
            <Pergunta pergunta="Não consigo excluir um ingrediente">
              <p>
                Ele está sendo usado em uma receita. O app mostra os pratos; remova o ingrediente
                dessas receitas antes de excluir.
              </p>
            </Pergunta>
            <Pergunta pergunta="O botão de marcar não responde">
              <p>
                Pode ser uma falha momentânea de conexão. O app avisa no rodapé; tente de novo quando
                o indicador voltar para Online.
              </p>
            </Pergunta>
          </div>
        </Topico>

        <Topico id="privacidade" titulo="Privacidade e dados">
          <p>
            O acesso usa uma sessão anônima do Firebase Authentication: o app não pede nome, e-mail
            nem senha. Os dados ficam no Cloud Firestore do projeto e são compartilhados por quem
            tem a URL e a sessão do app. Não há perfis separados por usuário nesta versão.
          </p>
          <p>
            Para guardar uma cópia, use a exportação em CSV da lista ou faça backup pelo console do
            Firebase. O plano gratuito não tem backup automático.
          </p>
        </Topico>

        <Topico id="versao" titulo="Versão e suporte">
          <p>
            Código-fonte e documentação:{' '}
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
          <p>
            Para suporte, contate o grupo <strong>MainCourse</strong> pelo link do GitHub acima.
          </p>
          <p>
            Para reportar um problema, anote a tela, a ação e a mensagem exibida. Se possível, tire
            uma captura de tela antes de recarregar a página. Envie o relato aos desenvolvedores do
            projeto pelo GitHub.
          </p>
        </Topico>
      </SecaoCard>

      <SecaoCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-maincourse-navy">
              Precisa de um atalho?
            </h2>
            <p className="mt-1 text-sm text-maincourse-navy/55">
              Vá direto para a seção que você quer usar agora.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Botao type="button" variante="secundario" onClick={() => irPara('cardapio')}>
              <IconeCardapio />
              Cardápio
            </Botao>
            <Botao type="button" variante="secundario" onClick={() => irPara('compras')}>
              <IconeCompras />
              Compras
            </Botao>
            <Botao type="button" variante="secundario" onClick={() => irPara('despensa')}>
              <IconeDespensa />
              Despensa
            </Botao>
          </div>
        </div>
      </SecaoCard>
    </div>
  );
}
