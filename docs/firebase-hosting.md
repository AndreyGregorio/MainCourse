# Publicar o MainCourse no Firebase Hosting

Este guia publica o build de produção do MainCourse no **Firebase Hosting**, usado como entrega
oficial da Release 4. O GitHub Pages continua disponível como deploy contínuo; os dois podem
conviver.

O projeto já está preparado:

- [`firebase.json`](../firebase.json) tem o bloco `hosting` apontando para `dist`;
- o build do Hosting usa `VITE_BASE=/` (raiz do domínio);
- existe o workflow manual **Deploy no Firebase Hosting**;
- as regras do Firestore continuam em [`firestore.rules`](../firestore.rules).

---

## 1. Pré-requisitos

- Conta Google com acesso ao projeto Firebase do MainCourse.
- Firebase CLI instalada (`npm install -g firebase-tools`).
- Projeto com **Hosting** habilitado no console (Build → Hosting → Começar).
- Chaves do app Web no `.env.local` (veja [`docs/firebase.md`](firebase.md)).
- Regras do Firestore da R04 publicadas (ou publicação logo após o deploy).

## 2. Configurar o projeto local

Na raiz do repositório:

```bash
firebase login
cp .firebaserc.example .firebaserc
```

Edite `.firebaserc` com o ID do projeto:

```json
{
  "projects": {
    "default": "SEU_PROJECT_ID"
  }
}
```

Ou use o assistente:

```bash
firebase use --add
```

O `.firebaserc` fica no `.gitignore`? **Não** — se ele contiver apenas o ID público do projeto, pode
ser versionado. Se preferir não versionar, adicione ao `.gitignore`. O workflow do GitHub Actions não
depende dele: recebe o `projectId` pelos secrets.

## 3. Gerar o build para o Hosting

O `vite.config.ts` usa `/MainCourse/` como base padrão de produção (para o GitHub Pages). No
Firebase Hosting o app fica na raiz, então **defina `VITE_BASE=/`**:

```bash
VITE_BASE=/ npm run build
```

Confira se `dist/index.html` referencia os assets em `/assets/...` e não em `/MainCourse/assets/...`.

> O workflow já define `VITE_BASE=/`; o comando acima é para o deploy manual.

## 4. Publicar

```bash
firebase deploy --only hosting
```

A CLI mostra a URL:

```text
Hosting URL: https://SEU_PROJECT_ID.web.app
```

Também funciona em:

```text
https://SEU_PROJECT_ID.firebaseapp.com
```

## 5. Publicar as regras do Firestore

O deploy do Hosting **não** publica regras. Faça:

```bash
firebase deploy --only firestore:rules
```

Ou cole o [`firestore.rules`](../firestore.rules) em **Firestore Database → Regras → Publicar**.

A R04 inclui a coleção `compras_despensa`; sem ela, a marcação dos itens da despensa é recusada.

## 6. Autorizar o domínio no Authentication

1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**.
2. Adicione:
   - `SEU_PROJECT_ID.web.app`
   - `SEU_PROJECT_ID.firebaseapp.com`
3. Salve.

Sem isso, o login anônimo falha com `auth/unauthorized-domain` e o app fica em “Conectando...”.

## 7. Deploy automático pelo GitHub Actions

O workflow [`firebase-hosting.yml`](../.github/workflows/firebase-hosting.yml) é manual
(`workflow_dispatch`) e usa uma service account.

### 7.1 Criar a service account

1. Abra o **Google Cloud Console** do projeto.
2. **IAM & Admin → Service Accounts → Create service account**.
3. Nome: `maincourse-hosting-deploy`.
4. Conceda a permissão **Firebase Hosting Admin**.
5. Crie a chave **JSON** e baixe o arquivo.

> Guarde o JSON com cuidado: ele dá acesso de deploy ao projeto. Não comite o arquivo.

### 7.2 Cadastrar os secrets no GitHub

No repositório: **Settings → Secrets and variables → Actions → New repository secret**.

| Secret | Valor |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT` | Conteúdo completo do JSON da service account |
| `VITE_FIREBASE_PROJECT_ID` | ID do projeto (já usado pelo Pages) |

Os demais secrets `VITE_FIREBASE_*` já são usados pelo workflow do Pages; confira se estão
cadastrados.

### 7.3 Rodar

1. **Actions → Deploy no Firebase Hosting → Run workflow**.
2. Acompanhe o job `deploy`.
3. Abra a URL `https://SEU_PROJECT_ID.web.app`.

O workflow compila com `VITE_BASE=/` e publica no canal `live`.

## 8. Verificação

- [ ] `https://SEU_PROJECT_ID.web.app` abre o app.
- [ ] O painel sai de “Conectando...” e mostra os contadores.
- [ ] As oito abas abrem, incluindo **Manual**.
- [ ] Um item da despensa aparece em **Compras** e pode ser marcado.
- [ ] As regras da R04 estão publicadas.
- [ ] O domínio está autorizado no Authentication.
- [ ] A fumaça `pytest tests/selenium/test_fumaca.py` passa contra a URL.

## 9. Rollback

Se o deploy novo apresentar problema:

1. **Console → Hosting → Release history** e escolha uma versão anterior; ou
2. faça checkout do commit anterior e rode `VITE_BASE=/ npm run build && firebase deploy --only hosting`.

As regras do Firestore não são revertidas automaticamente; se necessário, publique a versão anterior
do arquivo pelo console.

## 10. Problemas comuns

| Sintoma | Causa | Solução |
| --- | --- | --- |
| Assets 404 | Build sem `VITE_BASE=/` | Gere o build com `VITE_BASE=/` ou use o workflow. |
| `Hosting site not found` | Hosting não habilitado no projeto | Firebase Console → Hosting → Começar. |
| `Permission denied` no deploy | Service account sem papel de Hosting | Conceda **Firebase Hosting Admin**. |
| App em “Conectando...” | Domínio não autorizado ou regras ausentes | Autorize o domínio e publique as regras. |
| `compras_despensa` recusada | Regras antigas | Publique o `firestore.rules` da R04. |
| Deploy antigo | Cache do navegador | Aba anônima ou Ctrl+Shift+R. |

## 11. Checklist

- [ ] `.firebaserc` configurado (ou `firebase use --add`).
- [ ] `VITE_BASE=/` no build.
- [ ] `firebase deploy --only hosting` concluído.
- [ ] `firebase deploy --only firestore:rules` concluído.
- [ ] Domínios `web.app` e `firebaseapp.com` autorizados.
- [ ] Service account e secret `FIREBASE_SERVICE_ACCOUNT` configurados (se usar Actions).
- [ ] Workflow **Deploy no Firebase Hosting** verde.
- [ ] Fumaça contra a URL publicada.
- [ ] URL registrada nas notas da R04 e no termo de aceite.

## 12. Links

- Firebase Hosting: <https://firebase.google.com/docs/hosting>
- Ação de deploy: <https://github.com/FirebaseExtended/action-hosting-deploy>
- Guia do Firestore: [`docs/firebase.md`](firebase.md)
- Guia do GitHub Pages: [`docs/github-pages.md`](github-pages.md)
- Notas da R04: [`docs/releases/r04.md`](releases/r04.md)
