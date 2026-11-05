# SM-01 — Rendimento da receita e embalagem de compra

**Projeto:** MC-2026 · MainCourse
**Data:** 05/11/2026
**Versão alvo:** 0.4.0 (R04)
**Requisitos afetados:** RFS01, RFS03, RFS05, RFS07, RFS09, RFS11 e RF01
**Testes:** CT23 a CT25 (`tests/selenium/test_sm01.py`)

---

## Contexto

A R03 fechou o fluxo cardápio → lista de compras com a regra do DRE: a quantidade de cada
ingrediente é `quantidade_por_pessoa × pessoas do dia` (RF01). A regra é correta para o que escala
linearmente, mas o uso real mostrou que ela não cobre três situações comuns:

1. **Receita escrita por rendimento.** Ninguém escreve "0,0625 kg de massa por pessoa"; escreve
   "1 pacote de massa para uma travessa de 8 pessoas".
2. **Item comprado em embalagem fechada.** A necessidade de 0,75 kg de molho não responde "quantos
   vidros eu levo".
3. **Item que não escala.** Sal, louro e uma pitada de pimenta não dobram quando dobram as pessoas.

O caso que abriu a mudança foi uma lasanha para 8 pessoas: a carne moída fechava a conta em
0,1 kg/pessoa, mas a massa e o molho não — e o número "0,25" não dizia se eram 2,4 vidros, 2,4 kg
ou 2,4 litros.

## Problema

O modelo da R03 guarda um único número por ingrediente e uma unidade global no cadastro do
ingrediente (RFS05). Isso mistura três conceitos em uma linha de receita:

| Conceito | Onde deveria morar |
| --- | --- |
| Quanto o ingrediente consome por porção | na receita |
| Quantas porções a receita inteira rende | no prato |
| Como o ingrediente é comprado | no ingrediente |

O efeito prático, para 8 pessoas:

| O que se digita | O que o app calcula | Problema |
| --- | --- | --- |
| Massa `1 un` por pessoa | 8 pacotes (~4 kg) | `un` significa "pacote", e um pacote serve a travessa toda |
| Massa `0,3 kg` por pessoa | 2,4 kg | 300 g de massa seca por pessoa é ~3× uma porção |
| Molho `0,25 un` por pessoa | 2 vidros | certo — mas só se o vidro for de 680 g |
| Molho `0,3 un` por pessoa | 2,4 vidros | depende do vidro: 1,6 kg (680 g) ou 0,8 kg (340 g) |
| Carne `0,1 kg` por pessoa | 0,8 kg | certo: aqui o item é linear e a granel |

O mesmo número está certo em um item e errado no outro porque "por pessoa" é uma **métrica
derivada** — o app exige que o usuário divida pelo rendimento ao cadastrar e multiplique de volta ao
comprar, sem guardar nenhuma das duas informações que ele realmente tem.

## Alternativas avaliadas

1. **Só ajuda de uso (sem código):** cadastrar o ingrediente já na embalagem e usar `1 ÷ rendimento`
   por pessoa (1 pacote ÷ 8 = 0,125 `un`/pessoa). Funciona, mas mantém a divisão e o arredondamento
   na mão do usuário e não indica quantos pacotes comprar.
2. **Criar uma unidade "porção" (`Unidade` novo valor):** não resolve a embalagem e mexe em
   RFS05/RFS07 e na despensa, que compartilham a unidade do ingrediente.
3. **Separar rendimento, quantidade da receita e embalagem** — escolhida. É aditiva, não quebra os
   dados da R03 e mantém o cálculo do DRE como caso particular (rendimento 1).

## Solução

### Modelo de dados

- `pratos.porcoes_base` (inteiro 1–99, padrão 1): quantas porções a receita inteira serve.
- `receitas.quantidade`: quantidade do ingrediente **na receita inteira** (antes,
  `quantidade_por_pessoa`).
- `ingredientes.embalagem` (opcional): `{ rotulo, quantidade }`, com a quantidade na unidade do
  ingrediente — `{ "rotulo": "pacote 500 g", "quantidade": 0.5 }` em um ingrediente `kg`.

### Cálculo

```ts
const porcoes = prato.porcoes_base || 1;
const necessidade = receita.quantidade * pessoas / porcoes;
const embalagens = embalagem
  ? Math.ceil(necessidade / embalagem.quantidade - 1e-9)
  : null;
```

- `porcoes_base = 1` reproduz exatamente a conta da R03 (`quantidade × pessoas`).
- O arredondamento é feito **no total do ingrediente**, depois de somar os dias do período. Se fosse
  por dia, 0,125 kg em dois dias + 0,125 kg em três dias viraria 1 + 1 = 2 pacotes em vez de 1.
- A folga de `1e-9` evita que `0,5 / 0,5` vire `1,0000000000000002` e arredonde para 2.

### Interface

- **Pratos:** campo "Rende (porções)" com 1 como padrão; a lista mostra "rende 8 porções" quando o
  rendimento passa de 1. Renomear o prato preserva o rendimento.
- **Ingredientes:** campos opcionais "Embalagem" e "Qtd. da embalagem (kg/L/un)". Trocar a unidade
  limpa a embalagem, porque a quantidade dela é medida na unidade antiga.
- **Receitas:** seletor "Informar: Por pessoa | Receita inteira" e a quantidade convertida para o
  rendimento do prato antes de gravar. A linha da receita mostra "0,5 kg · na receita · rende 8
  porções" (ou "/ pessoa" quando o rendimento é 1).
- **Lista de compras:** a necessidade continua sendo o número principal; ao lado aparece
  "comprar 2 × pacote 500 g (1 kg)". O texto para compartilhar e o CSV levam a mesma informação.

### Compatibilidade

- Documento antigo de prato sem `porcoes_base` é lido como 1.
- Documento antigo de receita com `quantidade_por_pessoa` é lido como `quantidade`; na primeira
  edição o app grava `quantidade` e apaga o campo antigo (`deleteField`).
- Nenhuma migração manual: o conjunto de dados da R03 continua produzindo a mesma lista.

## Impacto nos requisitos

| Requisito | Impacto |
| --- | --- |
| **RFS01** | O cadastro de prato ganha o rendimento (campo opcional com padrão 1). |
| **RFS03** | Renomear continua migrando receitas e cardápio; o rendimento acompanha. Editar só o rendimento não migra nada. |
| **RFS05 / RFS07** | O ingrediente ganha a embalagem opcional; a troca de unidade limpa a embalagem e continua acompanhando a despensa. |
| **RFS09 / RFS11** | A quantidade passa a ser a da receita inteira (renderização do rendimento). Prato e ingrediente continuam imutáveis na edição. |
| **RF01** | A necessidade passa a ser `quantidade × pessoas / porções`; a compra é arredondada para embalagens inteiras. |
| **RF02** | O resumo por unidade continua somando a **necessidade** (conferência), não a compra arredondada. |

## Critérios de aceite

- **CT23** — Lasanha que rende 8 porções com 0,5 kg de massa: 4 pessoas no cardápio geram
  "0,25 kg" no dia e na lista.
- **CT24** — Molho de 1,5 kg em vidros de 0,68 kg: a lista mostra "comprar 3 × vidro 680 g
  (2,04 kg)".
- **CT25** — Prato com rendimento 1 continua "por pessoa": 0,15 kg × 6 = 0,9 kg, com embalagem de
  1 kg a lista mostra "comprar 1 × pacote 1 kg".

## Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| Usuário digitar a quantidade da receita inteira achando que é por pessoa (ou o contrário) | O modo é explícito, o rótulo do campo muda e o rendimento aparece no formulário e na lista. |
| Embalagem com quantidade na unidade errada depois de trocar `kg` → `un` | A embalagem é limpa na troca de unidade. |
| Versão antiga do app gravando campos que as regras novas recusam | Publicar o app e depois as regras; a ordem está no CHANGELOG e no README. |
| Documentos antigos sem os campos novos | Leitura tolerante (padrão 1 e campo legado) e gravação do formato novo na primeira edição. |

## Publicação

1. Fazer o deploy do app (0.4.0) pelo workflow do GitHub Pages.
2. Publicar o `firestore.rules` desta versão no Console do Firebase.
3. Conferir uma receita antiga: deve continuar com a mesma quantidade na lista.
4. Rodar `pytest tests/selenium` (ou só `test_sm01.py`) contra o emulador.
