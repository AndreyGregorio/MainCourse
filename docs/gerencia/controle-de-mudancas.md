# Controle de mudanças — MainCourse (MC-2026)

**Projeto:** MC-2026 · MainCourse
**Versão de referência:** 0.4.0 (R04)
**Responsável:** Andrey Gregorio
**Última atualização:** 13/11/2026

---

## 1. Objetivo

Registrar como as solicitações de mudança foram identificadas, triadas, analisadas, aprovadas,
implementadas, verificadas e comunicadas. O processo vale para mudanças de escopo, requisitos,
dados, interface e infraestrutura.

## 2. Processo

```text
Solicitação
   ↓
Triagem (é mudança? qual o tipo? qual a urgência?)
   ↓
Análise de impacto (escopo, prazo, qualidade, risco, custo)
   ↓
Decisão (aprovada / rejeitada / adiada)
   ↓
Implementação + testes
   ↓
Verificação e atualização da matriz
   ↓
Comunicação (release notes, changelog, manual, aceite)
   ↓
Encerramento da mudança
```

### 2.1 Critérios de triagem

| Critério | Pergunta |
| --- | --- |
| Necessidade | A mudança resolve um problema real do usuário ou do DRE? |
| Escopo | Altera requisito, modelo de dados, interface ou só documentação? |
| Prazo | Cabe na release corrente sem comprometer a homologação? |
| Qualidade | Exige novos testes, migração ou publicação de regras? |
| Risco | Pode quebrar dados, compatibilidade ou segurança? |
| Rastreabilidade | Precisa de novo ID de requisito e de atualização da matriz? |

### 2.2 Decisões possíveis

- **Aprovada:** entra na release corrente, com escopo e critérios de aceite declarados.
- **Aprovada com restrição:** entra em parte ou em release futura.
- **Adiada:** fica registrada para uma próxima release.
- **Rejeitada:** não será feita; o motivo fica registrado.

## 3. Registro de mudanças

### 3.1 SM-01 — Rendimento da receita e embalagem de compra

| Campo | Registro |
| --- | --- |
| Solicitante | Uso real do produto (caso da lasanha para 8 pessoas) |
| Data | 05/11/2026 |
| Tipo | Mudança de requisito/modelo de dados |
| Descrição | Permitir informar a receita inteira para um rendimento e cadastrar a embalagem de compra, para a lista dizer quantos volumes comprar |
| Requisitos afetados | RFS01, RFS03, RFS05, RFS07, RFS09, RFS11, RF01 |
| Alternativas | (1) só orientação de uso; (2) unidade “porção”; (3) separar rendimento, quantidade da receita e embalagem |
| Decisão | **Aprovada** — alternativa 3 |
| Impacto | Aditivo; compatível com dados da R03; exige novos campos e regras |
| Implementação | `porcoes_base`, `receitas.quantidade`, `ingredientes.embalagem`, cálculo e UI |
| Verificação | CT23–CT25 |
| Comunicação | `docs/releases/sm-01-rendimento-embalagem.md`, `CHANGELOG.md`, `docs/releases/r04.md` |
| Status | Implementada e documentada |

### 3.2 SM-02 — Itens da despensa na lista de compras

| Campo | Registro |
| --- | --- |
| Solicitante | Usuário do produto (pedido de 10/11/2026) |
| Data | 10/11/2026 |
| Tipo | Mudança de requisito/interface |
| Descrição | Mostrar os itens da despensa na tela de Compras para o usuário marcá-los como comprados |
| Requisitos afetados | RF01, RF02, RFS13–RFS16 e novo **RF03** |
| Alternativas | (1) somar a despensa à lista calculada; (2) duplicar itens como ingredientes; (3) seção própria com marcação própria |
| Decisão | **Aprovada** — alternativa 3 |
| Impacto | Nova coleção `compras_despensa`; nova seção e progresso; texto/CSV; sem mudança no cálculo do RF01/RF02 |
| Implementação | `ListaCompras`, `acoes/compras.ts`, `acoes/despensa.ts`, `useDados`, regras |
| Verificação | CT26 |
| Comunicação | `docs/releases/sm-02-despensa-na-lista.md`, `CHANGELOG.md`, `docs/releases/r04.md`, manual |
| Status | Implementada e documentada |

### 3.3 RFC07 — Manual do usuário na aplicação

| Campo | Registro |
| --- | --- |
| Solicitante | Cronograma da R04 |
| Data | 10/11/2026 |
| Tipo | Escopo planejado (não é mudança de escopo) |
| Descrição | Aba com o manual do usuário dentro do app |
| Requisitos afetados | Novo RFC07 |
| Decisão | **Aprovada** — já prevista no cronograma |
| Implementação | `ManualUsuario`, rota `#/manual`, `docs/manual-do-usuario.md` |
| Verificação | CT27 |
| Comunicação | Release notes, manual, README |
| Status | Implementada e documentada |

## 4. Análise de impacto da SM-02

| Área | Antes | Depois | Risco | Mitigação |
| --- | --- | --- | --- | --- |
| Lista de compras | Só ingredientes do cardápio | Ingredientes + seção da despensa | Usuário confundir estoque com necessidade | Texto explicativo, resumo separado, manual |
| Marcação | `compras/{ingrediente}` | `compras` + `compras_despensa/{item}` | Colisão de ids | Coleções separadas |
| Resumo por unidade | Só ingredientes | Sem mudança | Expectativa de incluir a despensa | Nota na tela e no manual |
| Exclusão de item | Só a despensa | Remove a marcação também | Marcação órfã | Exclusão em lote |
| Categoria do item | Move o item | Move o item e a marcação | Item “desmarcar” | Migração da marcação no mesmo lote |
| CSV/texto | Só ingredientes | Inclui a despensa com origem | Planilhas antigas | Coluna `Origem` documentada |
| Regras | 6 coleções | 7 coleções | Deploy fora de ordem | Checklist de publicação |

## 5. Aprovação

| Mudança | Aprovada por | Data | Observação |
| --- | --- | --- | --- |
| SM-01 | Desenvolvedor + orientação | 05/11/2026 | Dentro da R04 |
| SM-02 | Desenvolvedor + orientação | 10/11/2026 | Dentro da R04 |
| RFC07 | Cronograma | 10/11/2026 | Escopo planejado |

> As assinaturas formais ficam no [`termo-de-aceite.md`](../termo-de-aceite.md).

## 6. Comunicação

| Público | Canal | Conteúdo |
| --- | --- | --- |
| Usuário | Aba Manual e `docs/manual-do-usuario.md` | Como usar a despensa na lista, marcações e limpeza |
| Avaliador | `docs/releases/r04.md` e `CHANGELOG.md` | Escopo, decisões, testes e limitações |
| Equipe | `docs/gerencia/` e matriz | Status, riscos, mudanças e rastreabilidade |
| Repositório | Commit/tag `r04` e GitHub Release | Versão 0.4.0 |

## 7. Encerramento das mudanças

- [x] SM-01 implementada, testada e documentada.
- [x] SM-02 implementada, testada e documentada.
- [x] RFC07 implementado e documentado.
- [x] Matriz de rastreabilidade atualizada.
- [x] Release notes e changelog atualizados.
- [x] Manual atualizado.
- [ ] Evidências de homologação anexadas.
- [ ] Termo de aceite assinado.

## 8. Links

- SM-01: [`docs/releases/sm-01-rendimento-embalagem.md`](../releases/sm-01-rendimento-embalagem.md)
- SM-02: [`docs/releases/sm-02-despensa-na-lista.md`](../releases/sm-02-despensa-na-lista.md)
- Release 4: [`docs/releases/r04.md`](../releases/r04.md)
- Matriz: [`docs/matriz-de-rastreabilidade.md`](../matriz-de-rastreabilidade.md)
- Monitoramento: [`monitoramento-e-controle.md`](monitoramento-e-controle.md)
