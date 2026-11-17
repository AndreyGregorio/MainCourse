# SM-02 — Itens da despensa na lista de compras

**Projeto:** MC-2026 · MainCourse
**Data:** 10/11/2026
**Versão alvo:** 0.4.0 (R04)
**Requisitos afetados:** RF01, RF02, RFS13 a RFS16 e o novo **RF03**
**Testes:** CT26 (`tests/selenium/test_r04.py`)

---

## Contexto

A R03 fechou o fluxo cardápio → lista de compras com a lista calculada a partir das receitas. A
**despensa** ficou como consulta separada: itens fixos da casa, organizados em Limpeza, Salada,
Temperos e Itens Gerais, com quantidade, unidade e observação.

Na prática, a compra da semana não é feita só de ingredientes de receita. Detergente, papel, sal,
alface e itens gerais também entram no carrinho. O usuário precisava abrir a despensa em outra aba
para lembrar desses itens e não tinha como marcá-los como comprados.

## Problema

A lista de compras não representa a compra inteira:

- os itens da despensa não aparecem junto com os ingredientes;
- não é possível marcar um item da despensa como comprado;
- a única forma de conferir a compra é alternar entre **Despensa** e **Compras**;
- a despensa tem id composto (`categoria::nome`), que pode coincidir com o id de um ingrediente,
  então não basta reaproveitar a coleção `compras`.

## Alternativas avaliadas

1. **Somar a despensa à lista calculada.** Errado do ponto de vista de domínio: a quantidade da
   despensa é o estoque atual, não a necessidade do cardápio. Isso contaminaria o resumo por unidade
   e a conta do RF01.
2. **Duplicar os itens da despensa como ingredientes.** Criaria dado duplicado, acoplaria a despensa
   ao cadastro de ingredientes e obrigaria o usuário a manter dois nomes e duas unidades.
3. **Seção própria na tela de Compras, com marcação própria.** Escolhida. Preserva o cálculo do
   RF01/RF02, mantém a despensa como está e acrescenta o checklist que faltava.

## Solução

### Modelo de dados

Nova coleção `compras_despensa`, um documento por item marcado:

```text
compras_despensa/{item_id}
  item_id: string       // o mesmo id de `despensa` (`categoria::nome`)
  marcado_em: timestamp
```

Marcar cria o documento; desmarcar apaga. A coleção é separada de `compras` para evitar colisão de
ids e para deixar a regra do Firestore simples.

### Interface

- A tela de **Compras** ganha a seção **Itens da despensa**, depois da lista de ingredientes.
- Cada linha mostra nome, categoria, quantidade, unidade, observação e o selo **Em falta** quando a
  quantidade é zero.
- A caixa de seleção é independente da caixa dos ingredientes.
- A seção tem o próprio progresso (“X de Y itens marcados”).
- O botão **Limpar marcações** limpa as duas listas.
- O texto compartilhado e o CSV incluem a despensa, com a origem `Despensa`.
- O **resumo por unidade** continua somando apenas os ingredientes do cardápio (RF02).

### Integridade das marcações

- **Excluir um item da despensa** remove a marcação dele junto.
- **Mudar a categoria** de um item move a marcação para o novo id, para o item não “desmarcar” sem
  o usuário pedir.
- Se as regras novas ainda não estiverem publicadas, a edição do item continua funcionando; a
  marcação pode ficar para trás e é recriada na próxima vez que o usuário marcar.

### Cálculo

O motor `calcularLista` não muda. A despensa é renderizada a partir da coleção `despensa`, que já
chega ordenada por categoria e nome. A única soma nova é a de itens marcados, para o progresso da
seção.

## Compatibilidade

- Nenhuma migração: `compras_despensa` nasce vazia.
- A versão anterior do app ignora a coleção nova; a R04 funciona com os mesmos dados da R03.
- Publicar o app novo **antes** das regras novas mantém a compatibilidade do SM-01; a marcação da
  despensa só passa a funcionar depois que as regras da R04 forem publicadas.
- O texto e o CSV antigos continuam válidos; o CSV ganhou a coluna `Origem` e as linhas de despensa.

## Impacto nos requisitos

| Requisito | Impacto |
| --- | --- |
| **RF01** | A lista de ingredientes continua igual; a tela passa a ter também a seção da despensa. |
| **RF02** | O resumo por unidade não muda e não inclui a despensa. |
| **RFS13–RFS16** | A despensa continua igual; excluir item remove a marcação e mudar categoria move a marcação. |
| **RF03 (novo)** | Itens da despensa visíveis e marcáveis na lista de compras, com texto e CSV próprios. |
| **RFC06** | A tela de compras ganha a seção e o progresso da despensa. |
| **RFC07 (novo)** | O manual do usuário explica a seção e a diferença entre estoque e necessidade. |

## Critérios de aceite

- **CT26** — Um item da despensa cadastrado aparece em Compras com categoria, quantidade e unidade;
  a marcação persiste ao sair e voltar; **Limpar marcações** desmarca o item; excluir o item remove
  a linha e a marcação.
- O item aparece mesmo quando o cardápio está vazio.
- O resumo por unidade continua mostrando apenas os ingredientes.
- O texto compartilhado e o CSV distinguem `Cardápio` e `Despensa`.

## Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| Usuário achar que a quantidade da despensa é a quantidade a comprar | Texto da seção e manual explicam que é estoque; o resumo não inclui a despensa. |
| Marcação órfã ao mudar categoria ou excluir item | A ação move ou apaga a marcação no mesmo lote. |
| Regras antigas recusando a coleção nova | Publicar o `firestore.rules` da R04; a suíte E2E valida a coleção no emulador. |
| Duplicidade de nomes entre ingrediente e despensa | Coleções separadas e ids independentes; a interface identifica a origem. |
| Lista muito longa em casas com muitos itens | A seção fica no fim, com progresso próprio e botão para gerenciar a despensa. |

## Publicação

1. Fazer o deploy do app 0.4.0 (GitHub Pages e/ou Firebase Hosting).
2. Publicar o `firestore.rules` da R04 (inclui `compras_despensa`).
3. Rodar `pytest tests/selenium/test_r04.py` no emulador.
4. Conferir o roteiro de homologação em [`docs/homologacao.md`](../homologacao.md).

## Decisão

Mudança **aprovada** para a R04 em 10/11/2026, com impacto de escopo declarado e implementação
rastreável. O registro completo do processo está em
[`docs/gerencia/controle-de-mudancas.md`](../gerencia/controle-de-mudancas.md).
