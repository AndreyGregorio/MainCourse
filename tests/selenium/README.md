# Testes E2E — Releases 1 a 3 e SM-01 (Selenium)

A suíte cobre o fluxo principal do app contra uma instância publicada:

- a página carrega com a marca e o painel;
- as abas navegam para as sete seções;
- CRUD de prato: criar, renomear, excluir e busca por parte do nome (CT01 a CT04);
- CRUD de ingrediente: criar com `L`, conferir que o nome é somente leitura na edição, trocar para
  `kg` e excluir (CT05 a CT08);
- CRUD de receita: incluir com quantidade por pessoa ou pela receita inteira, impedir o mesmo
  ingrediente duas vezes, consultar com filtros e ordenação, alterar só a quantidade e excluir o
  vínculo (CT09 a CT12 e CT23);
- CRUD de item da despensa: incluir com nome único por categoria, consultar por categoria/nome,
  alterar (nome bloqueado, categoria móvel) e excluir (CT13 a CT16);
- cardápio: incluir dia só com prato que tem receita, consultar a semana em ordem, filtrar por dia,
  alterar prato/pessoas (dia bloqueado) e excluir o dia (CT17 a CT20);
- lista de compras: quantidade por pessoa × pessoas, dias e pratos, filtro por dia e ordem
  alfabética (CT21);
- resumo por unidade e marcações: totais em kg/L/un, itens comprados, texto para compartilhar e
  limpeza das marcações (CT22);
- SM-01: rendimento do prato (0,5 kg para 8 porções → 0,25 kg para 4 pessoas), embalagem de compra
  arredondada (1,5 kg em vidros de 0,68 kg → 3 vidros) e rendimento 1 mantendo a quantidade por
  pessoa (CT23 a CT25);
- reflexos: renomear prato mantém a receita e o cardápio, excluir prato no cardápio é bloqueado com
  os dias, excluir prato leva as receitas e excluir ingrediente usado em receita é bloqueado
  (RFS03, RFS04 e RFS08).

> **Atenção:** os testes gravam e apagam documentos reais no Firestore do build testado. Use o
> emulador do Firebase ou uma base de homologação.

## Estrutura

| Arquivo | Papel |
| --- | --- |
| `conftest.py` | Fixtures `driver` (Chrome headless) e `base_url`. |
| `apoio.py` | Helpers: abrir o app/aba, esperar elementos, criar e limpar registros. |
| `test_r01.py` | Pratos e ingredientes. |
| `test_r02.py` | Receitas, despensa e reflexos nos cadastros. |
| `test_r03.py` | Cardápio, lista de compras, resumo por unidade e marcações. |
| `test_sm01.py` | Rendimento da receita e embalagem de compra (SM-01). |

## Rodar localmente com o emulador (recomendado)

O emulador aplica as mesmas regras do `firestore.rules`, então o teste também valida a segurança.

```bash
# 1. Emuladores (precisa de firebase-tools e Java)
firebase emulators:start --only firestore,auth --project demo-maincourse

# 2. No .env.local, aponte o app para o emulador
echo "VITE_USE_EMULATOR=true" >> .env.local
# Se as portas 8080/9099 estiverem ocupadas, use:
# VITE_EMULATOR_FIRESTORE_PORT=8081
# VITE_EMULATOR_AUTH_PORT=9100

# 3. App em outro terminal
npm run dev

# 4. Testes
python3 -m venv .venv
source .venv/bin/activate
pip install -r tests/selenium/requirements.txt
BASE_URL=http://localhost:5173/ pytest tests/selenium
```

## Rodar localmente com o Firebase real

```bash
npm run dev            # em outro terminal
python3 -m venv .venv
source .venv/bin/activate
pip install -r tests/selenium/requirements.txt
BASE_URL=http://localhost:5173/ pytest tests/selenium
```

Para ver o navegador (sem headless):

```bash
HEADLESS=0 BASE_URL=http://localhost:5173/ pytest tests/selenium
```

Se o Chrome/Chromium estiver fora do caminho padrão, informe o binário:

```bash
CHROME_BIN=/caminho/do/chromium BASE_URL=http://localhost:5173/ pytest tests/selenium
```

## Rodar contra o GitHub Pages

```bash
BASE_URL=https://andreygregorio.github.io/MainCourse/ pytest tests/selenium
```

Lembre-se de publicar o `firestore.rules` da release antes: sem as regras novas, as seções de
cardápio e compras falham com `permission-denied`.

## No GitHub Actions

O workflow **E2E (Selenium)** é manual:

1. Actions → **E2E (Selenium)** → **Run workflow**.
2. Informe a URL (o padrão é a URL do Pages).
3. Acompanhe o resultado.

O workflow não roda a cada push para não escrever no banco de produção sem necessidade.

## Seletores

A interface expõe `data-testid` estáveis (`prato-nome`, `receita-quantidade`, `despensa-item`,
`cardapio-item`, `compras-item`, `confirmar` etc.). As abas usam `aba-<secao>` e cada seção expõe
`data-rota`. O cardápio usa `data-dia` e `data-prato`; a lista usa `data-ingrediente` e
`data-comprado`. Se o layout mudar, ajuste os seletores nos componentes e nos testes juntos.

## Limpeza

Cada teste usa um nome único (`E2E` + UUID) e remove o registro no bloco `finally`. Se um teste
falhar no meio, o registro pode sobrar; apague-o pelo próprio app ou no console do Firestore.
