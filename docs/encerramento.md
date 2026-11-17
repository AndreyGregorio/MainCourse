# Encerramento do projeto — MainCourse (MC-2026)

**Projeto:** MC-2026 · MainCourse — cardápio, compras e despensa da semana
**Versão final:** 0.4.0 (Release 4)
**Data de encerramento:** ____/____/______
**Desenvolvedor:** Andrey Gregorio
**Disciplina:** Gerência de Projetos de Software

---

## 1. Resultado final

O MainCourse foi entregue como aplicação web estática (React + TypeScript + Vite) com Firebase
Authentication anônimo, Cloud Firestore, cache offline, regras de segurança, testes E2E, manual do
usuário e documentação de gerência.

O projeto começou na R01 com o cadastro de pratos e ingredientes, evoluiu para receitas e despensa
(R02), fechou o fluxo de cardápio e lista de compras (R03) e concluiu com rendimento/embalagem,
despensa na lista, manual, publicação, homologação e aceite (R04).

**Situação:** concluído, com aceite formal registrado em
[`docs/termo-de-aceite.md`](termo-de-aceite.md).

## 2. Entregas

### 2.1 Produto

| Release | Entrega | Versão |
| --- | --- | --- |
| R01 | Pratos e ingredientes | 0.1.0 |
| R02 | Receitas e despensa | 0.2.0 |
| R03 | Cardápio, lista de compras e resumo | 0.3.0 |
| R04 | Rendimento/embalagem, despensa na lista, manual e publicação | 0.4.0 |

### 2.2 Documentos

- Notas de release: `docs/releases/r01.md` a `r04.md`.
- Mudanças: `docs/releases/sm-01-rendimento-embalagem.md` e
  `docs/releases/sm-02-despensa-na-lista.md`.
- Manual: [`docs/manual-do-usuario.md`](manual-do-usuario.md) e aba Manual no app.
- Homologação: [`docs/homologacao.md`](homologacao.md).
- Aceite: [`docs/termo-de-aceite.md`](termo-de-aceite.md).
- Matriz: [`docs/matriz-de-rastreabilidade.md`](matriz-de-rastreabilidade.md).
- Monitoramento: [`docs/gerencia/monitoramento-e-controle.md`](gerencia/monitoramento-e-controle.md).
- Mudanças: [`docs/gerencia/controle-de-mudancas.md`](gerencia/controle-de-mudancas.md).
- Publicação: [`docs/firebase.md`](firebase.md), [`docs/github-pages.md`](github-pages.md) e
  [`docs/firebase-hosting.md`](firebase-hosting.md).

### 2.3 Código e testes

- 20 requisitos funcionais de software (RFS01–RFS20).
- 3 requisitos de lista/cálculo (RF01–RF03).
- 7 requisitos complementares de interface (RFC01–RFC07).
- 27 casos de teste documentados (CT01–CT27) e fumaça do site publicado.
- Workflows: Deploy no GitHub Pages, E2E no emulador e Deploy no Firebase Hosting.
- Regras do Firestore cobrindo todas as coleções da release.

## 3. Métricas

| Indicador | Valor |
| --- | --- |
| Releases entregues | 4 |
| Versão final | 0.4.0 |
| Requisitos funcionais de software | 20 |
| Requisitos de lista/cálculo | 3 |
| Requisitos complementares de interface | 7 |
| Casos de teste documentados | 27 |
| Testes E2E no emulador | 30 passed (execução local em 10/11/2026) |
| Arquivos de teste E2E | 6 (`r01`, `r02`, `r03`, `sm01`, `r04`, `fumaca`) |
| Coleções no Firestore | 7 (`pratos`, `ingredientes`, `receitas`, `despensa`, `cardapio`, `compras`, `compras_despensa`) |
| Mudanças aprovadas | 2 (SM-01 e SM-02) |

> Métricas de esforço (horas) e custo não foram registradas de forma contínua; o projeto é
> acadêmico e sem orçamento financeiro.

## 4. Lições aprendidas

### 4.1 O que funcionou bem

| Lição | Evidência |
| --- | --- |
| **Entregas incrementais por release** reduziram o risco de fechar tudo no fim. | R01 a R04, cada uma com escopo e testes próprios. |
| **Documentar a decisão junto com o código** evitou retrabalho e facilitou a homologação. | Notas de release, SM-01/SM-02, matriz e manual. |
| **Testes E2E no emulador** permitiram validar as regras do Firestore sem tocar na produção. | Workflow E2E e `tests/selenium`. |
| **IDs determinísticos** (nome normalizado, `prato::ingrediente`, `categoria::nome`, dia) simplificaram a unicidade e a migração. | R01 a R04. |
| **Cache offline e tempo real** deram uma experiência robusta para uso doméstico. | Firestore com `persistentLocalCache` e `onSnapshot`. |
| **Mudanças com análise de impacto** mantiveram o escopo controlado. | SM-01 e SM-02 aprovadas com alternativas e critérios. |

### 4.2 O que pode melhorar

| Lição | Recomendação |
| --- | --- |
| **Datas do cronograma e do repositório divergiram** em alguns momentos. | Registrar a data real de cada entrega e revisar o cronograma na revisão de marcos. |
| **A suíte E2E depende de base limpa** e grava dados reais. | Usar sempre o emulador e manter o workflow como porta de qualidade. |
| **A ordem de publicação (app × regras)** é uma armadilha operacional. | Transformar a ordem em checklist obrigatório de release. |
| **O login anônimo é único**, sem separação por morador. | Para evolução futura, avaliar autenticação e perfis. |
| **A despensa não desconta a lista.** | Avaliar uma “necessidade líquida” como evolução, se o DRE permitir. |
| **Métricas de esforço não foram coletadas.** | Registrar horas por atividade nas próximas releases. |
| **O manual e o app podem divergir.** | Atualizar os dois no mesmo commit de release. |

### 4.3 O que começar a fazer

- Checklist de release com ordem de deploy, regras, testes e aceite.
- Registro de horas e de riscos em cada revisão de marco.
- Teste de acessibilidade automatizado (teclado, contraste, leitor de tela).
- Backup periódico dos dados de produção.
- Monitoramento de uso do plano gratuito do Firebase.

## 5. Riscos encerrados

| Risco | Status | Observação |
| --- | --- | --- |
| Estouro de escopo por mudanças | Mitigado | SM-01 e SM-02 passaram por triagem e aprovação. |
| Regras do Firestore desatualizadas | Mitigado | Checklist de publicação e testes no emulador. |
| Perda de dados | Aceito | Plano gratuito sem backup automático; CSV e exportação manual. |
| Dependência de serviços gratuitos | Aceito | Limites do Spark documentados em `docs/firebase.md`. |
| Testes E2E frágeis | Mitigado | Seletores `data-testid`, nomes únicos e limpeza em `finally`. |
| Divergência entre manual e app | Mitigado | Manual no app e em documento, atualizados na R04. |

## 6. Arquivo do projeto

| Item | Onde |
| --- | --- |
| Código-fonte | Repositório GitHub |
| Build de produção | `dist/` (gerado; não versionado) |
| Regras | `firestore.rules` |
| Testes | `tests/selenium/` |
| Documentação | `docs/` |
| Manual | `docs/manual-do-usuario.md` e aba Manual |
| Release notes | `docs/releases/` |
| Gerência | `docs/gerencia/` |

## 7. Encerramento formal

Declaro encerrado o projeto MainCourse MC-2026 na versão 0.4.0, com as entregas, ressalvas e
lições aprendidas registradas neste documento.

- [ ] Todas as releases publicadas e versionadas.
- [ ] Manual do usuário disponível.
- [ ] Homologação concluída.
- [ ] Termo de aceite assinado.
- [ ] Repositório e documentação arquivados.
- [ ] Lições aprendidas registradas.

| Parte | Nome | Assinatura | Data |
| --- | --- | --- | --- |
| Desenvolvedor | Andrey Gregorio | | |
| Professor(a) / cliente | | | |

## 8. Links

- Aplicação: <https://andreygregorio.github.io/MainCourse/>
- Repositório: <https://github.com/AndreyGregorio/MainCourse>
- Notas da R04: [`docs/releases/r04.md`](releases/r04.md)
- Homologação: [`docs/homologacao.md`](homologacao.md)
- Termo de aceite: [`docs/termo-de-aceite.md`](termo-de-aceite.md)
