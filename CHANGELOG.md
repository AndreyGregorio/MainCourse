# Changelog

Todas as mudanças relevantes do MainCourse. O formato segue
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o versionamento é por release do
projeto (`r01`, `r02`, ...).

## [0.4.0] — 2026-11-13 — Release 4

### Adicionado

- **Itens da despensa na lista de compras (RF03/SM-02):** seção própria em Compras, com categoria,
  quantidade, unidade, observação e o selo “Em falta”; caixa de seleção e progresso separados,
  persistidos na coleção `compras_despensa`.
- **Manual do usuário na aplicação (RFC07):** aba **Manual** (`#/manual`) com índice, passo a passo,
  dicas, glossário, problemas comuns e privacidade; o mesmo conteúdo em
  `docs/manual-do-usuario.md`.
- **Publicação no Firebase Hosting:** `hosting` no `firebase.json`, workflow manual
  `firebase-hosting.yml` e guia `docs/firebase-hosting.md`.
- **Homologação, aceite e encerramento:** roteiro em `docs/homologacao.md`, termo em
  `docs/termo-de-aceite.md`, relatório final e lições aprendidas em `docs/encerramento.md`.
- **Monitoramento e controle de mudanças:** revisões de marcos de agosto a novembro e registro das
  mudanças SM-01, SM-02 e RFC07 em `docs/gerencia/`.
- **Matriz de rastreabilidade** em `docs/matriz-de-rastreabilidade.md`.
- **Rendimento do prato** (`porcoes_base`): a receita pode ser informada pela receita inteira
  ("0,5 kg de massa para 8 porções") em vez de só por pessoa — SM-01.
- **Modo de quantidade** no formulário de receitas: *Por pessoa* ou *Receita inteira*; a conversão
  para o rendimento do prato é feita pelo app.
- **Embalagem de compra** no ingrediente (rótulo + quantidade na unidade), opcional, e o
  arredondamento da compra para embalagens inteiras na lista: "comprar 2 × pacote 500 g (1 kg)".
- Texto para compartilhar e CSV com a informação de compra por embalagem (coluna `Comprar`).
- Testes E2E CT23 a CT25 em `tests/selenium/test_sm01.py` e helpers de rendimento/embalagem em
  `apoio.py`; CT26 e CT27 em `tests/selenium/test_r04.py`.
- Fumaça E2E automática depois do deploy: o workflow do Pages roda `tests/selenium/test_fumaca.py`
  contra a URL publicada, sem gravar dados, e guarda relatório JUnit e capturas como artefatos.
- Suíte E2E completa no emulador do Firebase: o workflow **E2E (Selenium)** sobe Firestore/Auth,
  compila o app apontando para `127.0.0.1` e roda todos os testes em push, pull request ou manual.
  A suíte exige base limpa e agora falha com mensagem explícita se o cardápio já tiver dias
  planejados.

### Alterado

- `limparMarcações` passou a limpar as marcações de ingredientes **e** de itens da despensa.
- Excluir um item da despensa remove também a marcação de compra dele; mudar de categoria move a
  marcação para o novo id.
- O texto compartilhado ganhou o bloco **Despensa** e o CSV ganhou a coluna `Origem`
  (`Cardápio`/`Despensa`); o resumo por unidade continua só com os ingredientes.
- O contador de **Compras** do painel passou a somar os itens da despensa.
- O rodapé ganhou o link para o **Manual**.
- `receitas.quantidade_por_pessoa` passou a `receitas.quantidade` (quantidade da receita inteira).
  A leitura aceita o campo antigo; a primeira edição grava o novo e apaga o antigo.
- Pratos e ingredientes ganharam campos novos, validados no `firestore.rules`
  (`porcoes_base` inteiro de 1 a 99 e `embalagem` com rótulo de até 40 caracteres e quantidade > 0).
- Editar um prato permite ajustar o rendimento sem migrar receitas nem cardápio; a migração em lote
  continua acontecendo só quando o nome (o id) muda.
- Regras do Firestore ganharam `compras_despensa`, com `item_id` e `marcado_em`.
- Documentação da mudança em `docs/releases/sm-01-rendimento-embalagem.md` e
  `docs/releases/sm-02-despensa-na-lista.md`; README, firebase.md, github-pages.md e
  tests/selenium/README.md atualizados.

### Notas

- Publicar o app novo **antes** do `firestore.rules`: a versão anterior do app grava campos que as
  regras novas recusam.
- A marcação da despensa só funciona depois que as regras da R04 (`compras_despensa`) forem
  publicadas.
- O Firebase Hosting é opcional e usa o workflow manual; o GitHub Pages continua como deploy
  contínuo.
- A R04 encerra o escopo do projeto: 4 releases, 27 casos de teste, manual, homologação, aceite e
  lições aprendidas.
- O DRE continua sendo a fonte dos requisitos; a SM-01 entra como mudança rastreável da R04, com
  impacto declarado em RFS01, RFS03, RFS05, RFS07, RFS09, RFS11 e RF01.

## [0.3.0] — 2026-11-12 — Release 3

### Adicionado

- Cardápio da semana: um prato com receita e o número de pessoas por dia, de segunda a sexta, com
  filtro por dia e a lista de ingredientes de cada dia — RFS17 a RFS20.
- Lista de compras calculada a partir do cardápio e das receitas, com quantidade total por
  ingrediente, unidade, dias e pratos — RF01.
- Filtro da lista por dia da semana e quantidades recalculadas para o período escolhido.
- Marcação de itens já comprados, progresso, limpeza das marcações e resumo por unidade (`kg`, `L`
  e `un`) com total de itens e de comprados — RF01 e RF02.
- Texto pronto para compartilhar e exportação em CSV da lista.
- Coleções `cardapio` (um documento por dia) e `compras` (uma marcação por ingrediente), com regras
  do Firestore validando dia, pessoas, referência e timestamp.
- Navegação para **Cardápio** e **Compras** e painel com seis contadores.
- Testes E2E CT17 a CT22 em `tests/selenium/test_r03.py` e helpers de cardápio/compras em
  `apoio.py`.

### Alterado

- Renomear um prato passa a migrar também os dias do cardápio no mesmo lote (RFS03).
- Excluir um prato usado no cardápio é bloqueado com a lista dos dias (RFS04).
- Excluir um ingrediente remove a marcação de compra dele junto (RFS08).
- Excluir ou alterar uma receita recalcula a lista de compras automaticamente (RFS11/RFS12).
- O modo emulador aceita portas configuráveis por `VITE_EMULATOR_FIRESTORE_PORT` e
  `VITE_EMULATOR_AUTH_PORT`, útil quando a 8080/9099 já está em uso.
- Documentação da release, guias do Firebase/Pages e README atualizados para a R03.

### Notas

- Publicar o `firestore.rules` desta release é obrigatório para Cardápio e Compras funcionarem.
- O RF02 estava previsto no Plano de Projeto para a R04, mas o cronograma aprovado o coloca na R03;
  ele foi entregue junto com a lista.
- A R04 fica para homologação, manual do usuário e termo de aceite.

## [0.2.0] — 2026-11-05 — Release 2

### Adicionado

- Receitas: vínculo prato × ingrediente com quantidade por pessoa, incluindo, consulta, alteração
  e exclusão — RFS09 a RFS12.
- Despensa: itens por categoria (Limpeza, Salada, Temperos e Itens Gerais), com quantidade, unidade e
  observação — RFS13 a RFS16.
- Navegação por seções com rota no hash (`#/pratos`, `#/receitas`, `#/despensa`…), incluindo atalho
  da lista de pratos direto para a receita do prato.
- Painel inicial com os contadores de pratos, ingredientes, receitas e despensa.
- Aviso de banco indisponível com botão de nova tentativa, para quando as regras do Firestore ainda
  não foram publicadas.
- Modo emulador (`VITE_USE_EMULATOR`) para rodar os testes sem tocar no banco de produção.
- Testes E2E em Selenium para receitas e despensa (CT09 a CT16) e reorganização dos helpers em
  `tests/selenium/apoio.py`.
- Regras do Firestore para `receitas` e `despensa`, com validação de campos e campos imutáveis.

### Alterado

- Renomear um prato agora migra as receitas que apontam para ele (RFS03); excluir o prato leva as
  receitas junto (RFS04).
- Trocar a unidade de um ingrediente acompanha os itens de despensa com o mesmo nome (RFS07).
- Excluir ingrediente usado em receita é bloqueado com o nome dos pratos (RFS08).
- Os testes E2E da Release 1 passam a navegar pelas abas.
- Avisos de sucesso/erro limitados a três por vez na tela.

### Corrigido

- O erro `permission-denied` deixa de deixar a tela em "Conectando...": agora aparece um aviso com a
  orientação de publicar as regras.
- Números e quantidades na interface usam plural e o padrão brasileiro (vírgula decimal).

### Notas

- Publicar o `firestore.rules` desta release é obrigatório para as novas seções funcionarem.
- Cardápio, lista de compras e relatórios continuam na Release 3.

## [0.1.0] — 2026-10-27 — Release 1

### Adicionado

- Cadastro de pratos (incluir, consultar com busca, renomear e excluir) — RFS01 a RFS04.
- Cadastro de ingredientes (incluir, consultar por nome/unidade, alterar unidade e excluir) —
  RFS05 a RFS08.
- Identidade visual MainCourse: logo, paleta navy/dourado, ícones, manifest PWA e imagem Open Graph.
- Firebase Authentication anônimo e Cloud Firestore com cache offline persistente.
- Regras do Firestore com autenticação obrigatória e validação de nome/unidade.
- Sincronização em tempo real e indicador de online/offline.
- Tela inicial minimalista de conexão, sem telas de erro visíveis.
- Workflow de deploy no GitHub Pages com `VITE_BASE` automático.
- Documentação de Firebase, GitHub Pages e notas da release.
- Testes E2E em Selenium + pytest (CRUD de pratos e ingredientes) e workflow manual no Actions.

### Segurança

- Acesso ao banco somente com sessão (anônima) criada pelo app.
- Domínio do Pages precisa estar autorizado no Firebase Authentication.
- Nenhuma chave privada no repositório; as chaves públicas vêm de `.env.local`/Secrets.

### Notas

- Receitas, despensa, cardápio e lista de compras ficam para as releases R02 e R03.
- Os testes E2E gravam/apagam registros reais; use uma base de homologação.
