# Matriz de rastreabilidade — MainCourse

**Projeto:** MC-2026 · MainCourse
**Versão:** 0.4.0 (Release 4)
**Atualizada em:** 13/11/2026

Esta matriz liga cada requisito à release em que foi entregue, ao código/documento que o implementa
e ao teste que o verifica. Ela é a referência da homologação e do termo de aceite.

---

## 1. Requisitos funcionais de software (RFS)

| ID | Requisito | Release | Implementação | Teste | Situação |
| --- | --- | --- | --- | --- | --- |
| RFS01 | Incluir prato | R01 | `GestaoPratos`, `acoes/pratos.ts` | CT01 | Entregue |
| RFS02 | Consultar prato | R01 | `GestaoPratos` (busca e lista) | CT04 | Entregue |
| RFS03 | Alterar prato (renomear e migrar vínculos) | R01/R02/R03 | `salvarPrato`, lote de receitas e cardápio | CT01, reflexos R02/R03 | Entregue |
| RFS04 | Excluir prato (bloqueio no cardápio) | R01/R03 | `removerPrato`, `useAcoes` | CT02, reflexos R03 | Entregue |
| RFS05 | Incluir ingrediente | R01 | `GestaoIngredientes`, `acoes/ingredientes.ts` | CT05 | Entregue |
| RFS06 | Consultar ingrediente | R01 | `GestaoIngredientes` (busca e filtro) | CT06 | Entregue |
| RFS07 | Alterar ingrediente (unidade/embalagem) | R01/R04 | `atualizarIngrediente`, `validarEmbalagem` | CT07, CT24 | Entregue |
| RFS08 | Excluir ingrediente (bloqueio em receita) | R01/R02 | `removerIngrediente`, `useAcoes` | CT08, reflexos R02 | Entregue |
| RFS09 | Incluir receita | R02 | `GestaoReceitas`, `acoes/receitas.ts` | CT09 | Entregue |
| RFS10 | Consultar receita | R02 | `GestaoReceitas` (grupos e filtros) | CT10 | Entregue |
| RFS11 | Alterar receita | R02/R04 | `alterarQuantidadeReceita` | CT11, CT23 | Entregue |
| RFS12 | Excluir receita | R02 | `excluirReceita` | CT12 | Entregue |
| RFS13 | Incluir item da despensa | R02 | `GestaoDespensa`, `acoes/despensa.ts` | CT13 | Entregue |
| RFS14 | Consultar item da despensa | R02 | `GestaoDespensa` (categorias e busca) | CT14 | Entregue |
| RFS15 | Alterar item da despensa | R02/R04 | `alterarItemDespensa` (move marcação) | CT15 | Entregue |
| RFS16 | Excluir item da despensa | R02/R04 | `excluirItemDespensa` (remove marcação) | CT16, CT26 | Entregue |
| RFS17 | Incluir dia do cardápio | R03 | `GestaoCardapio`, `acoes/cardapio.ts` | CT17 | Entregue |
| RFS18 | Consultar dia do cardápio | R03 | `GestaoCardapio` (semana e filtro) | CT18 | Entregue |
| RFS19 | Alterar dia do cardápio | R03 | `alterarDia` (dia imutável) | CT19 | Entregue |
| RFS20 | Excluir dia do cardápio | R03 | `excluirDia` | CT20 | Entregue |

## 2. Requisitos funcionais de cálculo e lista (RF)

| ID | Requisito | Release | Implementação | Teste | Situação |
| --- | --- | --- | --- | --- | --- |
| RF01 | Lista de compras da semana | R03/R04 | `lib/listaCompras.ts`, `ListaCompras` | CT21, CT23–CT26 | Entregue |
| RF02 | Resumo por unidade | R03 | `calcularLista` (resumo), `ListaCompras` | CT22 | Entregue |
| RF03 | Itens da despensa na lista de compras | R04 | `ListaCompras` (seção), `compras_despensa`, `acoes/compras.ts` | CT26 | Entregue |

## 3. Requisitos complementares de interface (RFC)

| ID | Requisito | Release | Implementação | Teste | Situação |
| --- | --- | --- | --- | --- | --- |
| RFC01 | Seção de pratos | R01 | `GestaoPratos`, rota `#/pratos` | CT01–CT04 | Entregue |
| RFC02 | Seção de ingredientes | R01 | `GestaoIngredientes`, rota `#/ingredientes` | CT05–CT08 | Entregue |
| RFC03 | Seção de receitas | R02 | `GestaoReceitas`, rota `#/receitas` | CT09–CT12 | Entregue |
| RFC04 | Seção de despensa | R02 | `GestaoDespensa`, rota `#/despensa` | CT13–CT16 | Entregue |
| RFC05 | Seção de cardápio | R03 | `GestaoCardapio`, rota `#/cardapio` | CT17–CT20 | Entregue |
| RFC06 | Seção de compras | R03/R04 | `ListaCompras`, rota `#/compras` | CT21–CT22, CT26 | Entregue |
| RFC07 | Manual do usuário na aplicação | R04 | `ManualUsuario`, rota `#/manual` | CT27 | Entregue |

## 4. Requisitos não funcionais verificáveis

| ID | Requisito | Como foi tratado | Evidência | Situação |
| --- | --- | --- | --- | --- |
| RNF003 | Mesma entrada, mesma saída no cálculo | `calcularLista` é função pura, sem Firestore/estado | Testes de cálculo e verificação direta do motor | Atendido |
| RNF006 | Resposta rápida para o volume de uma casa | Cálculo no cliente, sem consultas por item; dados pequenos | Build e uso local; sem carga formal | Atendido por inspeção |
| RNF012 | Organização das ações de escrita | Um módulo por domínio em `src/lib/acoes` | Estrutura do código | Atendido |

> Requisitos não funcionais sem métrica formal no DRE foram tratados por inspeção e decisões de
> projeto; a homologação registra a verificação funcional correspondente.

## 5. Casos de teste

| ID | Caso | Arquivo | Situação |
| --- | --- | --- | --- |
| CT01 | Incluir/renomear prato | `tests/selenium/test_r01.py` | Automatizado |
| CT02 | Excluir prato | `tests/selenium/test_r01.py` | Automatizado |
| CT03 | Consultar prato | `tests/selenium/test_r01.py` | Automatizado |
| CT04 | Buscar prato por parte do nome | `tests/selenium/test_r01.py` | Automatizado |
| CT05 | Incluir ingrediente com unidade | `tests/selenium/test_r01.py` | Automatizado |
| CT06 | Filtrar ingrediente | `tests/selenium/test_r01.py` | Automatizado |
| CT07 | Alterar unidade | `tests/selenium/test_r01.py` | Automatizado |
| CT08 | Excluir ingrediente e bloqueio em receita | `tests/selenium/test_r01.py` / `test_r02.py` | Automatizado |
| CT09 | Incluir receita | `tests/selenium/test_r02.py` | Automatizado |
| CT10 | Consultar receitas | `tests/selenium/test_r02.py` | Automatizado |
| CT11 | Alterar quantidade da receita | `tests/selenium/test_r02.py` | Automatizado |
| CT12 | Excluir vínculo de receita | `tests/selenium/test_r02.py` | Automatizado |
| CT13 | Incluir item da despensa | `tests/selenium/test_r02.py` | Automatizado |
| CT14 | Consultar despensa | `tests/selenium/test_r02.py` | Automatizado |
| CT15 | Alterar item da despensa | `tests/selenium/test_r02.py` | Automatizado |
| CT16 | Excluir item da despensa | `tests/selenium/test_r02.py` | Automatizado |
| CT17 | Incluir dia do cardápio | `tests/selenium/test_r03.py` | Automatizado |
| CT18 | Consultar cardápio | `tests/selenium/test_r03.py` | Automatizado |
| CT19 | Alterar dia do cardápio | `tests/selenium/test_r03.py` | Automatizado |
| CT20 | Excluir dia do cardápio | `tests/selenium/test_r03.py` | Automatizado |
| CT21 | Lista de compras e filtro por dia | `tests/selenium/test_r03.py` | Automatizado |
| CT22 | Resumo por unidade e marcações | `tests/selenium/test_r03.py` | Automatizado |
| CT23 | Rendimento da receita | `tests/selenium/test_sm01.py` | Automatizado |
| CT24 | Embalagem de compra | `tests/selenium/test_sm01.py` | Automatizado |
| CT25 | Rendimento 1 mantém por pessoa | `tests/selenium/test_sm01.py` | Automatizado |
| CT26 | Despensa na lista, marcação e limpeza | `tests/selenium/test_r04.py` | Automatizado |
| CT27 | Manual do usuário | `tests/selenium/test_r04.py` | Automatizado |

Além dos 27 casos, a fumaça `tests/selenium/test_fumaca.py` valida o site publicado sem gravar
dados.

## 6. Como manter esta matriz

1. Todo requisito novo entra com ID, release, implementação, teste e situação.
2. Toda mudança aprovada atualiza a linha correspondente e o
   [`controle-de-mudancas.md`](gerencia/controle-de-mudancas.md).
3. Na homologação, a coluna “Situação” é conferida contra as evidências de
   [`homologacao.md`](homologacao.md).
4. O aceite formal usa esta matriz como anexo.
