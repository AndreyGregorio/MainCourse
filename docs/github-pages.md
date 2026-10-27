# Publicar o MainCourse no GitHub Pages

O deploy é feito por **GitHub Actions**: o workflow compila o React/Vite, injeta as chaves do
Firebase e publica o `dist/` no Pages. Não é preciso enviar a pasta `dist/` para o repositório.

> O repositório precisa ser **público** para usar o GitHub Pages gratuitamente. Com repositório
> privado, o Pages exige um plano pago (GitHub Pro/Team/Enterprise).

---

## 1. Criar o repositório

No GitHub: **New repository** →

- nome: `MainCourse`;
- visibilidade: **Public**;
- **não** marque README, `.gitignore` ou licença (o projeto já tem).

## 2. Enviar o código

Na pasta do projeto:

```bash
git init
git branch -M main
git add -A
git commit -m "feat(r01): CRUD de pratos e ingredientes + identidade MainCourse"
git remote add origin https://github.com/AndreyGregorio/MainCourse.git
git push -u origin main
```

Se o repositório já foi criado com o commit inicial do GitHub, use `git pull --rebase origin main`
antes do push (ou `git push --force-with-lease` se o histórico local for o definitivo).

## 3. Ativar o Pages

1. No repositório: **Settings → Pages**.
2. Em **Build and deployment → Source**, escolha **GitHub Actions**.
3. Não escolha “Deploy from a branch”; o workflow oficial cuida do build.

O workflow [`deploy.yml`](../.github/workflows/deploy.yml) já tem as permissões necessárias
(`pages: write`, `id-token: write`) e roda em push na `main` ou manualmente.

## 4. Cadastrar os secrets

**Settings → Secrets and variables → Actions → New repository secret**

| Secret | Valor |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `measurementId` (opcional) |

Os valores saem do app Web no Firebase Console — veja
[`docs/firebase.md`](firebase.md#3-registrar-o-app-web).

Enquanto os secrets não estiverem cadastrados, o site permanece em “Conectando...” e o painel não
carrega. O build não quebra; o detalhe do erro fica no console do navegador.

## 5. Rodar o deploy

Duas opções:

1. **Push na `main`** — o workflow roda sozinho.
2. **Actions → Deploy no GitHub Pages → Run workflow**.

Acompanhe em **Actions**. O job `build` instala, compila e empacota; o job `deploy` publica.

## 6. Abrir o site

A URL padrão de projeto é:

```text
https://andreygregorio.github.io/MainCourse/
```

O workflow calcula a subpasta automaticamente:

- repositório `MainCourse` → `VITE_BASE=/MainCourse/`;
- repositório `AndreyGregorio.github.io` → `VITE_BASE=/`.

Se o repositório tiver outro nome, nada precisa ser alterado no código: a base vem de
`GITHUB_REPOSITORY`. Só atualize os links fixos em `src/lib/constants.ts` (rodapé e guias).

### Primeiro deploy: 404 ou site antigo

- **404**: confirme que **Settings → Pages → Source** está em **GitHub Actions** e que o workflow
  terminou verde. O primeiro deploy pode levar 1–2 minutos.
- **Site antigo**: aba anônima ou Ctrl+Shift+R; o GitHub Pages tem cache.
- **Assets 404**: o build foi feito sem `VITE_BASE`; use o workflow, não um `npm run build` local
  seguido de upload manual.

## 7. Autorizar o domínio no Firebase

Não esqueça: **Authentication → Settings → Authorized domains** precisa ter
`andreygregorio.github.io`. Sem isso, o app publica, mas o login anônimo falha.

## 8. Tags e GitHub Releases

Cada release é um commit + uma tag. Para a R01:

```bash
git add -A
git commit -m "feat(r01): CRUD de pratos e ingredientes + identidade MainCourse"
git tag -a r01 -m "Release 1 — Pratos e ingredientes"
git push origin main
git push origin r01
```

Crie a Release no GitHub (interface ou CLI):

```bash
gh release create r01 \
  --title "Release 1 — Pratos e ingredientes" \
  --notes-file docs/releases/r01.md
```

O arquivo [`docs/releases/r01.md`](releases/r01.md) já está no formato de notas de release.

## 9. Domínio próprio (opcional)

1. **Settings → Pages → Custom domain**, digite o domínio.
2. No DNS, crie um `CNAME` apontando para `andreygregorio.github.io` (ou os registros `A` do Pages
   para um domínio raiz).
3. Marque **Enforce HTTPS**.
4. Adicione o domínio em **Authorized domains** no Firebase.
5. O workflow continua igual; a base `/MainCourse/` só muda se o site passar a ser servido na raiz.

## 10. O que o workflow faz

```text
push na main
  └─ checkout
  └─ Node 22 + cache do npm
  └─ VITE_BASE=/MainCourse/ (calculado do nome do repositório)
  └─ npm ci
  └─ npm run build   (tsc -b && vite build, com os secrets)
  └─ configure-pages
  └─ upload-pages-artifact (dist/)
  └─ deploy-pages
```

O `public/.nojekyll` evita que o Jekyll processe os arquivos e o `public/404.html` devolve o
visitante para a raiz.

## Problemas comuns

| Sintoma | Causa | Solução |
| --- | --- | --- |
| Workflow nem aparece | Actions desabilitadas no repositório. | Settings → Actions → Allow all actions. |
| `Resource not accessible by integration` | Faltam permissões no workflow. | Confira o bloco `permissions` (`pages: write`, `id-token: write`). |
| `npm ci` falha | `package-lock.json` desatualizado. | Rode `npm install`, commit o lock e envie. |
| Build passa, site em branco | Falta de secrets ou erro de JS. | Abra o console; veja os logs do build e confira as variáveis. |
| 404 ao atualizar uma rota | O app não usa router; só a raiz existe. | Use a URL raiz. O `404.html` redireciona. |
| Login falha no Pages | Domínio não autorizado. | Adicione `andreygregorio.github.io` no Firebase Authentication. |
| CSS/JS 404 | Base errada. | Use o workflow; confira `VITE_BASE` nos logs. |

## Checklist

- [ ] Repositório público criado
- [ ] Código na `main`
- [ ] Pages com source **GitHub Actions**
- [ ] Secrets cadastrados
- [ ] Workflow verde
- [ ] `https://andreygregorio.github.io/MainCourse/` abre o app
- [ ] Domínio autorizado no Firebase
- [ ] Tag `r01` e GitHub Release criadas
- [ ] Cadastro de prato e ingrediente testado no site publicado
