<p align="center">
  <img src="assets/logo-maincourse-banner.png" alt="MainCourse" width="340" />
</p>

<h1 align="center">MainCourse</h1>

<p align="center">
  Cardápio, compras e despensa da semana · projeto <strong>MC-2026</strong>
</p>

<p align="center">
  <a href="https://andreygregorio.github.io/MainCourse/"><strong>▶ Aplicação publicada</strong></a>
  ·
  <a href="docs/firebase.md">Guia do Firebase</a>
  ·
  <a href="docs/github-pages.md">Guia do GitHub Pages</a>
  ·
  <a href="docs/releases/r01.md">Notas da Release 1</a>
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" />
  <img alt="Firebase" src="https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black" />
  <img alt="GitHub Pages" src="https://img.shields.io/badge/GitHub%20Pages-online-0F1E36?logo=github&logoColor=white" />
</p>

---

## Sobre

O **MainCourse** organiza o cardápio da semana, a lista de compras e a despensa de uma casa. A
entrega é incremental, uma release por vez, como no cronograma da disciplina **SDES06 – Gerência de
Projetos de Software** (2026/2).

Esta é a **Release 1 (R01)**: cadastro de **pratos** e **ingredientes**. As receitas, a despensa, o
cardápio e a lista de compras entram nas releases R02 e R03.

<p align="center">
  <img src="docs/assets/preview.png" alt="Prévia do painel do MainCourse na Release 1" width="900" />
</p>

<p align="center"><em>Prévia da Release 1.</em></p>

## O que já funciona (R01)

| Requisito | Entrega |
| --- | --- |
| **RFS01 a RFS04** | Incluir, consultar com busca, renomear e excluir pratos (com confirmação). |
| **RFS05 a RFS08** | Incluir, consultar por nome/unidade, alterar a unidade e excluir ingredientes. |
| **RNF001, RNF002** | Interface simples, responsiva e navegável por teclado/leitor de tela. |
| **RNF003, RNF004** | Dados em tempo real no Firestore e cache offline no aparelho. |
| **RNF007** | Escrita autenticada: o app cria uma sessão anônima antes de acessar o banco. |
| **RNF009** | Build estático publicado no GitHub Pages. |
| **RNF012** | Testes E2E com Selenium cobrindo o CRUD de pratos e ingredientes. |

Também fazem parte da release:

- identidade visual MainCourse (logo, paleta, ícones e manifest PWA);
- workflow de deploy no GitHub Pages com as chaves vindas dos Secrets;
- regras do Firestore que exigem autenticação e validam os campos.

### O que ainda **não** entra na R01

Receitas, despensa, cardápio da semana, lista de compras, relatórios e compartilhamento. Esses itens
estão no roadmap (R02–R04) e não aparecem na interface desta release de propósito.

## Testes

A Release 1 tem uma suíte E2E em **Selenium + pytest** (`tests/selenium/`). Ela valida o fluxo de
criar, renomear e excluir pratos, e o fluxo de ingredientes com a regra de que o nome não pode ser
alterado. Os testes rodam contra uma instância já publicada e **gravam/apagam registros reais** no
Firestore.

```bash
npm run dev                                    # app rodando
pip install -r tests/selenium/requirements.txt
BASE_URL=http://localhost:5173/ pytest tests/selenium
```

Contra o Pages:

```bash
BASE_URL=https://andreygregorio.github.io/MainCourse/ pytest tests/selenium
```

O workflow manual **E2E (Selenium)** (`.github/workflows/e2e.yml`) executa a suíte no Actions. Ele
não roda a cada push para não escrever no banco de produção sem necessidade.

## Stack

- **React 19 + TypeScript** com **Vite 8**;
- **Tailwind CSS 3** para o layout;
- **Firebase Authentication** (login anônimo) + **Cloud Firestore** com cache persistente;
- **GitHub Actions + GitHub Pages** para publicar o site estático.

### Por que Firebase? (e não um banco dentro do GitHub Pages)

O GitHub Pages só entrega **arquivos estáticos** (HTML, CSS, JS). Ele não executa backend, não abre
conexão com MySQL/Postgres e não guarda dados. Por isso o banco precisa ser um serviço externo.

O Firebase resolve as três necessidades do projeto sem servidor próprio:

1. **Firestore** é o banco de documentos, com atualização em tempo real;

2. o SDK funciona direto no navegador e mantém **cache offline** no IndexedDB;

3. o plano **Spark é gratuito** (sem cartão) para o volume de uma casa e de uma disciplina.

O passo a passo completo, do zero, está em [`docs/firebase.md`](docs/firebase.md). O resumo é:
criar o projeto no console, ativar o Firestore, habilitar o login **Anônimo**, publicar
[`firestore.rules`](firestore.rules) e colar as chaves no `.env.local` (ou nos Secrets do GitHub).

## Rodando localmente

Pré-requisitos: **Node.js 22.12+** e uma conta Google para o Firebase.

```bash
git clone https://github.com/AndreyGregorio/MainCourse.git
cd MainCourse
npm install
cp .env.example .env.local
# edite o .env.local com as chaves do seu app Web no Firebase
npm run dev
```

Abra `http://localhost:5173`. Sem as chaves (ou sem o login anônimo ativo), o app permanece em
“Conectando...” e o detalhe técnico aparece apenas no console do navegador.

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento com HMR. |
| `npm run build` | Type-check (`tsc -b`) + build de produção em `dist/`. |
| `npm run preview` | Serve o `dist/` localmente. |
| `npm run lint` | ESLint. |
| `pytest tests/selenium` | E2E (com `BASE_URL` apontando para o app rodando). |

## Banco de dados no Firebase

1. Crie um projeto em <https://console.firebase.google.com/> (sugestão: `MainCourse MC-2026`).
2. **Firestore Database** → criar banco em modo de produção, região `southamerica-east1` (São Paulo).
3. **Authentication** → *Sign-in method* → ativar **Anônimo**.
4. **Authentication** → *Settings* → *Authorized domains* → adicionar `andreygregorio.github.io`
   (e `localhost`, que já vem).
5. **Firestore** → *Regras* → colar o conteúdo de [`firestore.rules`](firestore.rules) → publicar.
6. **Configurações do projeto** → *Seus apps* → app Web → copiar as chaves.

As coleções `pratos` e `ingredientes` são criadas sozinhas no primeiro cadastro. O modelo desta
release é:

```text
pratos/{id}          → { nome: string }
ingredientes/{id}    → { nome: string, unidade_medida: 'kg' | 'L' | 'un' }
```

O `id` é o nome em minúsculas (o nome é o identificador do registro no DRE). Exemplo:
`pratos/lasanha à bolonhesa` e `ingredientes/queijo mussarela`.

> **Guia detalhado, com solução de problemas e limites do plano gratuito:**
> [`docs/firebase.md`](docs/firebase.md).

## Publicando no GitHub Pages

O repositório precisa ser **público** para usar o GitHub Pages gratuitamente.

1. Crie o repositório `MainCourse` no GitHub.
2. Envie o código para a branch `main`.
3. Em **Settings → Pages → Build and deployment**, escolha **GitHub Actions** como source.
4. Em **Settings → Secrets and variables → Actions**, cadastre os seis secrets obrigatórios:

| Secret | Onde encontrar no Firebase |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | `apiKey` do app Web |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `measurementId` (opcional) |

5. Rode o workflow **Deploy no GitHub Pages** (Actions → Run workflow) ou faça um push na `main`.
6. A URL fica `https://andreygregorio.github.io/MainCourse/`.

O workflow [`deploy.yml`](.github/workflows/deploy.yml) calcula sozinho a subpasta do Pages
(`VITE_BASE=/MainCourse/`), roda `npm ci`, injeta os secrets no build e publica o `dist/`. Se o
repositório tiver outro nome, a base é recalculada a partir de `GITHUB_REPOSITORY`.

> **Passo a passo com tags, releases e erros comuns:**
> [`docs/github-pages.md`](docs/github-pages.md).

### Release como commit + tag

Cada entrega é um commit na `main` e uma tag `rXX`:

```bash
git add -A
git commit -m "feat(r01): CRUD de pratos e ingredientes + identidade MainCourse"
git tag -a r01 -m "Release 1 — Pratos e ingredientes"
git push origin main
git push origin r01
gh release create r01 --title "Release 1 — Pratos e ingredientes" \
  --notes-file docs/releases/r01.md
```

## Estrutura

```text
.
├─ .github/workflows/deploy.yml   # build + deploy no GitHub Pages
├─ assets/                        # logo original e derivados
├─ docs/
│  ├─ firebase.md                 # criar o banco do zero
│  ├─ github-pages.md             # publicar, tags e releases
│  └─ releases/r01.md             # notas da Release 1
├─ public/                        # ícones, manifest, 404, .nojekyll
├─ tests/selenium/                # E2E: pytest + Selenium
├─ src/
│  ├─ App.tsx                     # login anônimo + providers
│  ├─ firebaseConfig.ts           # Firebase via variáveis de ambiente
│  ├─ components/
│  │  ├─ Aplicacao.tsx            # dados + ações + layout
│  │  ├─ Cabecalho.tsx
│  │  ├─ TelaPainel.tsx
│  │  ├─ TelaCarregando.tsx
│  │  ├─ Logo.tsx
│  │  ├─ Rodape.tsx
│  │  ├─ painel/
│  │  │  ├─ GestaoPratos.tsx
│  │  │  └─ GestaoIngredientes.tsx
│  │  └─ ui/                     # botão, campo, toast, confirmação
│  ├─ hooks/useColecao.ts        # onSnapshot + online/offline
│  ├─ lib/
│  │  ├─ acoes.ts                # escritas no Firestore
│  │  ├─ constants.ts
│  │  ├─ env.ts                  # validação das variáveis do Firebase
│  │  ├─ mapeadores.ts
│  │  └─ utils.ts
│  └─ types.ts
├─ firestore.rules
├─ firebase.json
├─ .env.example
└─ vite.config.ts
```

## Segurança

- As regras do Firestore exigem `request.auth != null`; o app cria uma sessão **anônima** ao abrir.
- O domínio do Pages precisa estar em **Authorized domains** no Authentication.
- A `apiKey` do Firebase é pública por natureza (vai no bundle); a proteção real são as regras e o
  domínio autorizado. Nunca coloque service account, senha ou chave privada no front-end.
- **Limitação consciente:** qualquer pessoa com a URL consegue criar uma sessão anônima e escrever.
  Para um trabalho acadêmico com URL restrita, é aceitável. Em produção, o próximo passo seria
  Firebase App Check, autenticação por e-mail/link ou uma coleção por casa com `uid` no documento.

## Roadmap

| Release | Escopo | Status |
| --- | --- | --- |
| **R01** | Pratos e ingredientes (RFS01–RFS08) | ✅ esta entrega |
| **R02** | Receitas e despensa (RFS09–RFS16) | ⏳ próxima |
| **R03** | Cardápio da semana e lista de compras (RFS17–RFS20, RF01) | ⏳ planejada |
| **R04** | Relatórios RF02, compartilhamento e ajustes de homologação | ⏳ planejada |

## Solução de problemas

| Sintoma | Causa provável | Solução |
| --- | --- | --- |
| Site fica em “Conectando...” | Build sem as variáveis `VITE_FIREBASE_*`, login anônimo desligado ou banco inacessível. | Preencha o `.env.local` ou os Secrets, ative o login anônimo e gere um novo build/deploy. |
| `auth/operation-not-allowed` | Login anônimo desativado. | Authentication → Sign-in method → Anônimo → ativar. |
| `auth/unauthorized-domain` | Domínio fora da lista. | Authentication → Settings → Authorized domains → adicionar `andreygregorio.github.io`. |
| `permission-denied` | Regras não publicadas ou sessão ainda não criada. | Publique `firestore.rules` e recarregue. |
| Página branca no Pages | Caminho de base errado ou erro de JS. | Abra o console; confira `VITE_BASE` e os logs do workflow. |
| Ícones/JS 404 no Pages | Build feito com `VITE_BASE=/`. | Use o workflow oficial; ele define `/MainCourse/`. |
| `npm ci` falha no Actions | `package-lock.json` desatualizado. | Rode `npm install`, commit o lock e envie. |

## Equipe e disciplina

Projeto da disciplina **SDES06 – Gerência de Projetos de Software** (2026/2), modelo SWFactory.

- **Andrey Gregorio** — gerente do projeto e desenvolvimento;
- **Lucas Oliveira** — análise;
- **Felipe Melo** e **Luiz Felipe** — desenvolvimento e QA.

Os artefatos da Release 0 (DRE, EST, CRO, MRB e Plano de Projeto) estão no repositório de documentos
do projeto, fora deste repositório de código.

## Licença

Projeto acadêmico e de uso pessoal. A marca e a logo **MainCourse** pertencem ao projeto; não
redistribua a identidade visual sem autorização.
