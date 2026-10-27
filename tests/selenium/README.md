# Testes E2E — Release 1 (Selenium)

Cobrem o fluxo principal da R01 contra uma instância publicada do app:

- a página carrega com a marca e o painel;
- CRUD de prato: criar, renomear e excluir;
- CRUD de ingrediente: criar com `L`, conferir que o nome é somente leitura na edição,
  trocar para `kg` e excluir.

> **Atenção:** os testes gravam e apagam documentos reais no Firestore do build testado. Use a URL do
> projeto de testes ou uma base sem dados importantes.

## Rodar localmente

O app precisa estar rodando e configurado com um Firebase válido:

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

## Rodar contra o GitHub Pages

```bash
BASE_URL=https://andreygregorio.github.io/MainCourse/ pytest tests/selenium
```

## No GitHub Actions

O workflow **E2E (Selenium)** é manual:

1. Actions → **E2E (Selenium)** → **Run workflow**.
2. Informe a URL (o padrão é a URL do Pages).
3. Acompanhe o resultado.

O workflow não roda a cada push para não escrever no banco de produção sem necessidade.

## Seletores

A interface expõe `data-testid` estáveis (`prato-nome`, `prato-adicionar`, `prato-item`,
`ingrediente-unidade`, `confirmar` etc.). Se o layout mudar, ajuste os seletores nos componentes e
nos testes juntos.

## Limpeza

Cada teste usa um nome único (`E2E` + UUID) e remove o registro no bloco `finally`. Se um teste
falhar no meio, o registro pode sobrar; apague-o pelo próprio app ou no console do Firestore.
