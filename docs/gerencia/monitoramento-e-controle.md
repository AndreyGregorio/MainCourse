# Monitoramento e controle — MainCourse (MC-2026)

**Projeto:** MC-2026 · MainCourse
**Versão de referência:** 0.4.0 (R04)
**Período:** agosto a novembro de 2026
**Responsável:** Andrey Gregorio

---

## 1. Objetivo

Registrar as revisões de marcos, os indicadores de andamento, os riscos e as ações corretivas do
projeto, conforme o plano de gerência. O documento é a fonte para a revisão de marcos de agosto,
setembro, outubro e novembro e para o encerramento.

## 2. Cadência e papéis

| Item | Definição |
| --- | --- |
| Cadência | Revisão mensal de marco, com registro escrito |
| Participantes | Desenvolvedor e orientador(a) da disciplina |
| Entradas | Cronograma, backlog de requisitos, notas de release, resultados de teste, mudanças aprovadas |
| Saídas | Situação do marco, decisões, ações corretivas e atualização de riscos |
| Registro | Este documento + [`controle-de-mudancas.md`](controle-de-mudancas.md) |

## 3. Revisões de marcos

### 3.1 Agosto/2026 — Planejamento e baseline

| Campo | Registro |
| --- | --- |
| Foco | DRE, escopo, cronograma, riscos e critérios de aceite |
| Entregas | Baseline de requisitos (RFS01–RFS20, RF01–RF02), arquitetura inicial, identidade do produto |
| Decisões | Aplicação web estática (React + Vite); Firebase Authentication anônimo e Cloud Firestore; releases incrementais R01–R04 |
| Situação | Concluída |
| Ações | Detalhar o modelo de dados e as regras do Firestore antes da R01 |

### 3.2 Setembro/2026 — Arquitetura e protótipo

| Campo | Registro |
| --- | --- |
| Foco | Modelo de dados, navegação, deploy e segurança |
| Entregas | Protótipo navegável, identidade visual, pipeline de deploy no GitHub Pages, regras iniciais |
| Decisões | Nome normalizado como id de prato/ingrediente; rotas no hash; login anônimo; cache offline persistente |
| Situação | Concluída |
| Ações | Iniciar a R01 com o cadastro de pratos e ingredientes |

### 3.3 Outubro/2026 — Release 1

| Campo | Registro |
| --- | --- |
| Foco | Cadastros base e qualidade |
| Entregas | R01 (pratos e ingredientes), regras, testes E2E, deploy no Pages |
| Decisões | Renomear prato é apagar + criar em lote; ingrediente não muda de nome; CI de deploy |
| Situação | Concluída — tag `r01` |
| Ações | Planejar receitas e despensa (R02) e revisar a experiência de navegação |

### 3.4 Novembro/2026 — Releases 2, 3 e 4

| Campo | Registro |
| --- | --- |
| Foco | Fechar o fluxo do produto e encerrar o projeto |
| Entregas | R02 (receitas e despensa), R03 (cardápio e lista), R04 (SM-01, SM-02, manual, hosting, homologação) |
| Decisões | Aprovar SM-01 e SM-02; separar a marcação da despensa em `compras_despensa`; manual dentro do app; publicação também no Firebase Hosting |
| Situação | Concluída — tags `r02`, `r03`, `r04` |
| Ações | Homologar, colher o aceite e registrar as lições aprendidas |

## 4. Indicadores

| Dimensão | Indicador | Situação na R04 |
| --- | --- | --- |
| Escopo | Requisitos planejados entregues | 20 RFS + 3 RF + 7 RFC |
| Escopo | Mudanças aprovadas | 2 (SM-01 e SM-02) |
| Prazo | Releases concluídas | 4 de 4 |
| Qualidade | Build de produção | Passou |
| Qualidade | Lint | Passou sem avisos |
| Qualidade | Casos de teste documentados | 27 (CT01–CT27) |
| Qualidade | Fumaça do site publicado | Workflow configurado |
| Risco | Riscos críticos abertos | Nenhum |
| Comunicação | Notas de release e manual | Publicados |
| Aceite | Termo assinado | Pendente de assinatura |

## 5. Riscos

| ID | Risco | Probabilidade | Impacto | Resposta | Status |
| --- | --- | --- | --- | --- | --- |
| R01 | Regras do Firestore desatualizadas no deploy | Média | Alto | Checklist de publicação e testes no emulador | Mitigado |
| R02 | Perda de dados por falta de backup no plano Spark | Baixa | Alto | Exportação CSV e orientação de backup manual | Aceito |
| R03 | Estouro de escopo por mudanças de última hora | Média | Médio | Triagem e aprovação formal (SM-01/SM-02) | Mitigado |
| R04 | Suíte E2E frágil por dados remanescentes | Média | Médio | Emulador limpo, nomes únicos e limpeza em `finally` | Mitigado |
| R05 | Dependência de serviços gratuitos e limites de quota | Baixa | Médio | Monitorar uso no console; volume doméstico | Aceito |
| R06 | Divergência entre manual e app | Baixa | Baixo | Manual no app e em documento, atualizados na R04 | Mitigado |
| R07 | Credenciais do Firebase Hosting não configuradas | Média | Baixo | Deploy manual pela CLI e guia passo a passo | Aberto (operacional) |

## 6. Decisões registradas

| Data | Decisão | Justificativa | Impacto |
| --- | --- | --- | --- |
| Ago/2026 | Stack React + Vite + Firebase | Entrega estática, tempo real e cache offline com baixo custo | Base de todas as releases |
| Set/2026 | Nome normalizado como id | Unicidade sem consulta extra | Renomear exige migração em lote |
| Out/2026 | Rotas no hash | Compatível com hospedagem estática | Sem router adicional |
| Nov/2026 | SM-01 aprovada | Caso real de receita por rendimento e embalagem | R04 |
| Nov/2026 | SM-02 aprovada | Compra da casa inclui itens fixos da despensa | R04 |
| Nov/2026 | Manual dentro do app | Ajuda offline e no mesmo lugar do uso | Aba Manual + documento |
| Nov/2026 | Firebase Hosting opcional | Atende ao cronograma sem remover o Pages | Workflow manual + guia |

## 7. Ações corretivas e preventivas

| Ação | Origem | Responsável | Prazo | Status |
| --- | --- | --- | --- | --- |
| Publicar o `firestore.rules` da R04 | Checklist de release | Desenvolvedor | Antes do uso real | Pendente |
| Configurar o secret `FIREBASE_SERVICE_ACCOUNT` | Publicação no Hosting | Desenvolvedor | Antes do deploy automático | Pendente |
| Rodar a suíte E2E no emulador/CI | Qualidade | Desenvolvedor | Homologação | Pendente |
| Anexar evidências da homologação | Aceite | Responsável pela homologação | Homologação | Pendente |
| Assinar o termo de aceite | Encerramento | Partes | Encerramento | Pendente |
| Registrar horas por atividade | Lições aprendidas | Desenvolvedor | Próximo projeto | Recomendado |

## 8. Critérios de saída do marco

- [ ] Escopo da release concluído e testado.
- [ ] `firestore.rules` publicado.
- [ ] Build e lint verdes.
- [ ] Suíte E2E executada no emulador.
- [ ] Notas de release e manual atualizados.
- [ ] Riscos revisados.
- [ ] Aceite registrado.

## 9. Links

- Release notes: [`docs/releases/r04.md`](../releases/r04.md)
- Matriz: [`docs/matriz-de-rastreabilidade.md`](../matriz-de-rastreabilidade.md)
- Homologação: [`docs/homologacao.md`](../homologacao.md)
- Controle de mudanças: [`controle-de-mudancas.md`](controle-de-mudancas.md)
- Encerramento: [`docs/encerramento.md`](../encerramento.md)
