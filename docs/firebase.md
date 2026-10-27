# Banco de dados do MainCourse no Firebase

Este guia cria o banco do **MainCourse** do zero, no plano gratuito, e liga o app local e o GitHub
Pages a ele. Tempo estimado: **10 a 15 minutos**.

> **Por que não dá para usar SQLite/MySQL direto no GitHub Pages?**
> O Pages é hospedagem estática: entrega HTML, CSS e JS, mas não executa servidor nem aceita conexão
> de banco. O Firestore é o banco externo que o navegador acessa pelo SDK, com autenticação e regras
> de segurança. É gratuito no plano Spark para o volume deste projeto.

---

## Checklist rápido

- [ ] Criar o projeto no Firebase
- [ ] Criar o banco Cloud Firestore (região São Paulo)
- [ ] Registrar o app Web e copiar as chaves
- [ ] Ativar o login **Anônimo**
- [ ] Autorizar `localhost` e `andreygregorio.github.io`
- [ ] Publicar as regras do `firestore.rules`
- [ ] Preencher o `.env.local` e rodar `npm run dev`
- [ ] Cadastrar os seis secrets no GitHub
- [ ] Rodar o workflow e testar a URL do Pages

---

## 1. Criar o projeto

1. Abra <https://console.firebase.google.com/> com a conta Google que vai administrar o projeto.
2. Clique em **Adicionar projeto**.
3. Nome sugerido: `MainCourse MC-2026`.
4. O ID do projeto é gerado pelo Google (ex.: `maincourse-mc2026`). Anote-o; ele aparece no
   `.env.local` e nos secrets.
5. O Google Analytics é opcional. Pode desativar para simplificar.
6. Clique em **Criar projeto** e aguarde.

> O plano **Spark** é o padrão e não pede cartão de crédito.

## 2. Criar o Cloud Firestore

1. No menu lateral, abra **Build → Firestore Database**.
2. Clique em **Criar banco de dados**.
3. Escolha **Modo de produção**. As regras abertas são substituídas no passo 6.
4. Localização: **`southamerica-east1` (São Paulo)**. Essa escolha não pode ser alterada depois;
   para usuários no Brasil, é a menor latência.
5. Clique em **Ativar**.

As coleções ainda não existem: `pratos` e `ingredientes` são criadas no primeiro cadastro do app.

## 3. Registrar o app Web

1. Na visão geral do projeto, clique no ícone **`</>`** (Web).
2. Apelido do app: `MainCourse Web`.
3. **Não** marque Firebase Hosting (o site fica no GitHub Pages).
4. Clique em **Registrar app**.
5. O console mostra um objeto `firebaseConfig` assim:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "maincourse-mc2026.firebaseapp.com",
  projectId: "maincourse-mc2026",
  storageBucket: "maincourse-mc2026.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456",
  measurementId: "G-XXXXXXXXXX"
};
```

Guarde esses valores. O mapeamento para o projeto é:

| Valor do Firebase | Variável do projeto |
| --- | --- |
| `apiKey` | `VITE_FIREBASE_API_KEY` |
| `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `VITE_FIREBASE_PROJECT_ID` |
| `storageBucket` | `VITE_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `VITE_FIREBASE_APP_ID` |
| `measurementId` | `VITE_FIREBASE_MEASUREMENT_ID` (opcional) |

## 4. Ativar o login anônimo

O app não pede e-mail nem senha: ele cria uma sessão anônima para que as regras do Firestore possam
exigir `request.auth != null`.

1. Menu **Build → Authentication**.
2. Clique em **Começar**.
3. Aba **Sign-in method**.
4. Selecione **Anônimo**.
5. Ative **Ativar** e salve.

Sem esse passo, o app permanece em “Conectando...” e o console mostra
`auth/operation-not-allowed`.

## 5. Autorizar os domínios

1. Ainda em **Authentication**, abra **Settings → Authorized domains**.
2. `localhost` já deve estar na lista.
3. Adicione `andreygregorio.github.io` (sem `https://`, sem barra no final).
4. Se você usar um domínio próprio, adicione-o também.

Se o domínio não estiver autorizado, o login falha com `auth/unauthorized-domain`.

## 6. Publicar as regras do Firestore

1. Abra **Firestore Database → Regras**.
2. Apague o conteúdo padrão e cole o arquivo [`firestore.rules`](../firestore.rules) deste
   repositório.
3. Clique em **Publicar**.

As regras desta release:

- exigem usuário autenticado (anônimo serve);
- permitem apenas as coleções `pratos` e `ingredientes`;
- validam `nome` (2 a 60 caracteres) e `unidade_medida` (`kg`, `L` ou `un`);
- negam todo o resto.

Ao chegar na R02/R03, acrescente as novas coleções ao arquivo e publique de novo.

## 7. Configurar o ambiente local

Na raiz do projeto:

```bash
cp .env.example .env.local
```

Abra o `.env.local` e preencha:

```dotenv
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=maincourse-mc2026.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=maincourse-mc2026
VITE_FIREBASE_STORAGE_BUCKET=maincourse-mc2026.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

O `.env.local` está no `.gitignore` e **não** vai para o GitHub.

Rode:

```bash
npm run dev
```

Abra `http://localhost:5173`, cadastre um prato e confira em **Firestore Database → Dados** se o
documento apareceu em `pratos`.

## 8. Cadastrar os secrets no GitHub

No repositório do GitHub:

**Settings → Secrets and variables → Actions → New repository secret**

Cadastre, com os mesmos valores:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID` (opcional)

Depois rode o workflow **Deploy no GitHub Pages** (Actions → Run workflow) ou faça um push na
`main`. O build injeta os secrets e o site passa a acessar o banco.

> **A `apiKey` é pública?** Sim. Ela identifica o projeto, não autoriza escrita sozinha. A proteção
> vem das regras do Firestore e do domínio autorizado. O que nunca pode ir para o front-end é uma
> service account ou chave privada.

## Modelo de dados da Release 1

```text
pratos/{id}
  nome: string

ingredientes/{id}
  nome: string
  unidade_medida: "kg" | "L" | "un"
```

O `id` é o nome normalizado (minúsculo, `/` trocado por `-`). O nome é o identificador do registro
no DRE, então `Lasanha` e `lasanha` apontam para o mesmo documento. O nome exibido é o que o usuário
digitou.

Exemplo:

```json
// pratos/lasanha à bolonhesa
{ "nome": "Lasanha à bolonhesa" }

// ingredientes/queijo mussarela
{ "nome": "Queijo mussarela", "unidade_medida": "kg" }
```

## Limites do plano gratuito (Spark)

| Recurso | Limite gratuito |
| --- | --- |
| Leituras no Firestore | 50.000 por dia |
| Gravações no Firestore | 20.000 por dia |
| Exclusões no Firestore | 20.000 por dia |
| Armazenamento | 1 GiB |
| Transferência de saída | 10 GiB por mês |
| Authentication anônimo | Gratuito |

Para uma casa e uma disciplina, sobra bastante. Se o app viralizar, o console mostra o uso em
**Firestore → Uso** e dá para definir um orçamento de alerta.

## Backup e exportação

O plano Spark não tem backup automático. Para guardar uma cópia:

1. **Firestore → Dados** permite exportar uma coleção pelo menu (quando disponível), ou
2. use a CLI com um bucket do Cloud Storage (requer plano Blaze), ou
3. mantenha um JSON dos dados importantes no repositório de documentos do projeto.

Para um trabalho acadêmico, a opção 3 é suficiente.

## Usando a CLI do Firebase (opcional)

O console já resolve tudo. Se preferir terminal:

```bash
npm install -g firebase-tools
firebase login
cp .firebaserc.example .firebaserc   # edite o SEU_PROJECT_ID
firebase use --add
firebase deploy --only firestore:rules
```

O `firebase.json` deste repositório já aponta para `firestore.rules`.

## Problemas comuns

| Mensagem | Causa | Correção |
| --- | --- | --- |
| Site fica em “Conectando...” | Build sem as variáveis, login anônimo desligado ou banco inacessível. | Preencha `.env.local`/Secrets, ative o login anônimo e gere o build de novo; o erro detalhado aparece no console. |
| `auth/operation-not-allowed` | Login anônimo desligado. | Authentication → Sign-in method → Anônimo. |
| `auth/unauthorized-domain` | Domínio fora da lista. | Authentication → Settings → Authorized domains. |
| `permission-denied` | Regras não publicadas ou leitura antes do login. | Publique as regras e recarregue; o app espera a sessão antes de ler. |
| `failed-precondition` | Falta índice (não deve ocorrer na R01). | Crie o índice indicado no link do erro. |
| App abre, mas não grava | Regras antigas ou domínio errado. | Confira as regras publicadas e o console do navegador. |
| `auth/invalid-api-key` | Chave truncada/colada errada. | Revise o secret e o `.env.local`. |

## Checklist final

- [ ] Firestore criado em `southamerica-east1`
- [ ] App Web registrado e chaves copiadas
- [ ] Login anônimo ativo
- [ ] `andreygregorio.github.io` autorizado
- [ ] Regras publicadas
- [ ] `.env.local` preenchido e `npm run dev` funcionando
- [ ] Secrets cadastrados no GitHub
- [ ] Workflow executado sem erro
- [ ] App no Pages cadastrando pratos e ingredientes
