# Changelog

Todas as mudanças relevantes do MainCourse. O formato segue
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o versionamento é por release do
projeto (`r01`, `r02`, ...).

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
