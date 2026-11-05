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

Cada release é um commit + uma tag + uma GitHub Release com as notas do arquivo
`docs/releases/rXX.md`. A R01 já foi publicada assim:

```bash
git tag -a r01 -m "Release 1 — Pratos e ingredientes"
git push origin r01
gh release create r01 --title "Release 1 — Pratos e ingredientes" \
  --notes-file docs/releases/r01.md
```

Para a **R03** (cardápio e lista de compras):

```bash
git add -A
git commit -m "feat(r03): cardápio da semana e lista de compras"
git tag -a r03 -m "Release 3 — Cardápio e lista de compras"
git push origin main
git push origin r03
gh release create r03 --title "Release 3 — Cardápio e lista de compras" \
  --notes-file docs/releases/r03.md
```

Antes do push, confirme que o `firestore.rules` desta release foi publicado no Firebase
(Firestore → Regras). O deploy do Pages não publica regras.

As notas ficam em [`docs/releases/r01.md`](releases/r01.md),
[`docs/releases/r02.md`](releases/r02.md) e [`docs/releases/r03.md`](releases/r03.md), no formato de
release notes.

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
| Deploy verde, mas site antigo | Pages ainda em **Deploy from a branch** ou novo deploy do **mesmo commit**. | Em **Settings → Pages**, use **GitHub Actions**; faça um commit novo (o Pages pode ignorar um redeploy do mesmo SHA). |
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
- [ ] Tag `r03` e GitHub Release criadas
- [ ] Regras do Firestore da R03 publicadas
- [ ] Cardápio da semana e lista de compras testados no site publicado
