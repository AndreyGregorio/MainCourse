# Homologação — MainCourse v0.4.0 (R04)

**Projeto:** MC-2026 · MainCourse
**Release:** R04 / versão 0.4.0
**Data da homologação:** ____/____/______
**Responsável pela homologação:** ______________________________
**Aplicação:** <https://andreygregorio.github.io/MainCourse/>
**Repositório:** <https://github.com/AndreyGregorio/MainCourse>

---

## 1. Objetivo

Verificar, em ambiente de homologação, se a Release 4 atende aos requisitos aprovados e se está
apta ao aceite formal. A homologação cobre o fluxo completo (pratos, ingredientes, receitas,
despensa, cardápio, compras e manual) e, em especial, as entregas novas da R04:

- SM-01 — rendimento da receita e embalagem de compra;
- RF03 / SM-02 — itens da despensa na lista de compras;
- RFC07 — manual do usuário na aplicação;
- publicação e regras do Firestore.

## 2. Escopo

| Item | Coberto |
| --- | --- |
| CRUD de pratos | Sim |
| CRUD de ingredientes (unidade e embalagem) | Sim |
| CRUD de receitas (por pessoa e receita inteira) | Sim |
| CRUD de despensa | Sim |
| Cardápio de segunda a sexta | Sim |
| Lista de compras, filtro por dia e resumo | Sim |
| Marcações de compra (ingredientes e despensa) | Sim |
| Manual do usuário | Sim |
| Layout responsivo e modo offline | Sim |
| Segurança das regras do Firestore | Sim |
| Publicação no Firebase Hosting | Sim (quando configurado) |

## 3. Ambiente

Preencher antes da execução:

| Campo | Valor |
| --- | --- |
| URL testada | |
| Navegador e versão | |
| Sistema operacional | |
| Dispositivo (desktop/celular) | |
| Projeto Firebase | |
| Versão publicada | 0.4.0 |
| Regras publicadas | `firestore.rules` da R04 |
| Base de dados | Emulador / homologação / produção |
| Responsável técnico | |

> **Atenção:** não execute a homologação de escrita na base de produção com dados reais. Use o
> emulador do Firebase ou um projeto de homologação dedicado.

## 4. Pré-condições

- [ ] Build 0.4.0 publicado (GitHub Pages e/ou Firebase Hosting).
- [ ] `firestore.rules` da R04 publicado no Firebase.
- [ ] Login anônimo ativo no Firebase Authentication.
- [ ] Domínio da aplicação autorizado em Authentication → Settings → Authorized domains.
- [ ] Pelo menos um prato com receita cadastrado para o roteiro de cardápio.
- [ ] Base limpa ou dados de demonstração identificados.
- [ ] Acesso ao console do navegador para conferir erros.

## 5. Roteiro de testes

Marque **C** (conforme), **NC** (não conforme) ou **NA** (não aplicável).

### H01 — Abertura e navegação

| Passo | Resultado esperado | C/NC/NA |
| --- | --- | --- |
| Abrir a URL | A tela sai de “Conectando...” e mostra o Painel | |
| Conferir as oito abas | Painel, Pratos, Ingredientes, Receitas, Despensa, Cardápio, Compras, Manual | |
| Abrir cada aba | Cada seção monta com título e conteúdo, sem erro no console | |
| Recarregar em uma aba | A rota `#/...` é preservada | |

### H02 — Pratos

| Passo | Resultado esperado | C/NC/NA |
| --- | --- | --- |
| Incluir “Lasanha à bolonhesa” com rendimento 8 | Prato aparece na lista com “rende 8 porções” | |
| Tentar incluir “lasanha à bolonhesa” | O app recusa nome repetido | |
| Buscar por parte do nome | A lista filtra | |
| Renomear para “Lasanha da casa” | Nome atualiza e vínculos são preservados | |
| Excluir um prato sem cardápio | Confirmação e exclusão | |

### H03 — Ingredientes

| Passo | Resultado esperado | C/NC/NA |
| --- | --- | --- |
| Incluir “Massa” em `kg` com embalagem “pacote 500 g” e quantidade 0,5 | Ingrediente aparece com a embalagem | |
| Incluir “Molho” em `kg` com embalagem “vidro 680 g” e quantidade 0,68 | Ingrediente aparece com a embalagem | |
| Editar a unidade de “Massa” para `un` | A embalagem é limpa | |
| Tentar excluir ingrediente usado em receita | Bloqueio com o nome do prato | |

### H04 — Receitas e SM-01

| Passo | Resultado esperado | C/NC/NA |
| --- | --- | --- |
| Incluir massa na lasanha em “Receita inteira”, 0,5 kg | Linha mostra “0,5 kg · na receita · rende 8 porções” | |
| Incluir molho em “Receita inteira”, 1,5 kg | Linha mostra a quantidade da receita inteira | |
| Editar a quantidade | Só a quantidade muda; prato/ingrediente ficam bloqueados | |
| Excluir o vínculo | Remove só a receita, sem apagar prato/ingrediente | |

### H05 — Despensa

| Passo | Resultado esperado | C/NC/NA |
| --- | --- | --- |
| Incluir “Detergente” (Limpeza, 2 un) | Item aparece na categoria Limpeza | |
| Incluir “Alface” (Salada, 0 un) | Item aparece com o selo “Em falta” | |
| Repetir “Detergente” em Limpeza | O app recusa nome repetido na categoria | |
| Mover “Detergente” para Itens Gerais | O item muda de grupo | |
| Excluir “Alface” | Item sai da despensa | |

### H06 — Cardápio

| Passo | Resultado esperado | C/NC/NA |
| --- | --- | --- |
| Planejar segunda com lasanha para 4 pessoas | Dia aparece com prato, pessoas e ingredientes | |
| Conferir a massa do dia | 0,25 kg (0,5 kg ÷ 8 × 4) | |
| Editar o dia para 8 pessoas | Quantidade do dia passa a 0,5 kg; o dia não muda | |
| Excluir o dia | Dia volta a “Livre” e sai da lista | |

### H07 — Compras (ingredientes)

| Passo | Resultado esperado | C/NC/NA |
| --- | --- | --- |
| Abrir Compras com o cardápio planejado | Lista mostra massa, molho e demais ingredientes | |
| Conferir a massa | 0,25 kg e “comprar 1 × pacote 500 g (0,5 kg)” | |
| Conferir o molho | 1,5 kg e “comprar 3 × vidro 680 g (2,04 kg)” | |
| Filtrar por segunda | Quantidade recalculada para o dia | |
| Marcar dois itens | Progresso e resumo por unidade atualizados | |
| Copiar o resumo | Texto contém os itens e as marcações | |
| Baixar o CSV | Arquivo abre no Excel com `;` e vírgula decimal | |
| Limpar marcações | Itens voltam a pendente | |

### H08 — Compras (despensa / RF03)

| Passo | Resultado esperado | C/NC/NA |
| --- | --- | --- |
| Abrir Compras | Seção “Itens da despensa” aparece abaixo dos ingredientes | |
| Conferir o detergente | Nome, categoria Limpeza, quantidade 2 un e observação | |
| Marcar o detergente | Linha riscada e progresso “1 de 1 item marcado” | |
| Sair de Compras e voltar | A marcação continua | |
| Abrir o texto compartilhado | Bloco “Despensa” com `[x]` no detergente | |
| Baixar o CSV | Linha com origem `Despensa` e coluna `Comprado = Sim` | |
| Limpar marcações | Ingredientes e despensa voltam a pendente | |
| Excluir o detergente na Despensa | A linha desaparece de Compras e a marcação é removida | |
| Com o cardápio vazio, cadastrar um item | O item aparece em Compras mesmo sem cardápio | |

### H09 — Manual do usuário (RFC07)

| Passo | Resultado esperado | C/NC/NA |
| --- | --- | --- |
| Abrir a aba Manual | Título “Manual do usuário” e índice | |
| Clicar em “Compras” no índice | A página rola até o tópico de Compras | |
| Conferir o tópico de Compras | Explica lista, marcações e seção da despensa | |
| Conferir o tópico de Privacidade | Explica login anônimo e dados | |
| Testar em celular | Índice e conteúdo legíveis, sem rolagem horizontal | |

### H10 — Responsividade e offline

| Passo | Resultado esperado | C/NC/NA |
| --- | --- | --- |
| Abrir em viewport de celular | Abas em duas linhas, formulários empilhados | |
| Desligar a internet e recarregar | App abre com o cache e indicador Offline | |
| Religar a internet | Indicador volta a Online e os dados sincronizam | |
| Abrir em outro navegador/dispositivo | Dados e marcações aparecem | |

### H11 — Segurança e regras

| Passo | Resultado esperado | C/NC/NA |
| --- | --- | --- |
| Abrir o console do navegador | Sem `permission-denied` nas coleções da R04 | |
| Tentar gravar sem sessão (se possível) | As regras recusam | |
| Conferir `compras_despensa` no console | Documento com `item_id` e `marcado_em` | |
| Conferir coleções fora do escopo | Acesso negado | |

### H12 — Publicação

| Passo | Resultado esperado | C/NC/NA |
| --- | --- | --- |
| Abrir a URL publicada | App carrega e autentica | |
| Firebase Hosting (se usado) | URL `*.web.app` responde e o domínio está autorizado | |
| Rodar a fumaça | `pytest tests/selenium/test_fumaca.py` passa | |
| Conferir versão no rodapé | `v0.4.0` | |

## 6. Evidências

Anexar ou registrar:

- capturas de tela das telas principais (Painel, Compras com a despensa, Manual);
- relatório JUnit da suíte E2E (`relatorios/e2e.xml`);
- captura da aba Network/Console sem erros;
- URL publicada e data/hora da verificação;
- versão do build e hash do commit.

## 7. Registro de defeitos

| ID | Descrição | Severidade | Status | Correção |
| --- | --- | --- | --- | --- |
| D01 | | | | |
| D02 | | | | |
| D03 | | | | |

Critério de bloqueio: defeito **crítico** ou **alto** em requisito da R04 impede o aceite até a
correção e nova verificação.

## 8. Critérios de aceite

A Release 4 é aceita quando:

- [ ] Todos os itens H01–H12 aplicáveis estão **conformes**.
- [ ] Não há defeito crítico ou alto aberto.
- [ ] O `firestore.rules` da R04 está publicado.
- [ ] A suíte E2E passou no emulador ou no CI.
- [ ] O manual do usuário está acessível na aba Manual e em `docs/manual-do-usuario.md`.
- [ ] O termo de aceite foi assinado.

## 9. Conclusão

| Resultado | Marcar |
| --- | --- |
| Aprovado sem restrições | [ ] |
| Aprovado com restrições (listar abaixo) | [ ] |
| Reprovado (corrigir e rehomologar) | [ ] |

Restrições/observações:

```text
______________________________________________________________________________
______________________________________________________________________________
______________________________________________________________________________
```

**Responsável pela homologação:** ______________________________
**Data:** ____/____/______

**Aceite formal:** ver [`termo-de-aceite.md`](termo-de-aceite.md).

## 10. Anexo — suíte automatizada

```bash
# Emulador limpo
firebase emulators:start --only firestore,auth --project demo-maincourse

# App apontando para o emulador
VITE_USE_EMULATOR=true npm run dev

# Suíte completa (30 testes)
BASE_URL=http://localhost:5173/ pytest tests/selenium

# Só a R04
BASE_URL=http://localhost:5173/ pytest tests/selenium/test_r04.py
```

Execução de referência no emulador local, em 10/11/2026: **30 testes passaram** (`30 passed`),
incluindo os casos novos CT26 e CT27. A suíte grava e apaga documentos; use o emulador ou uma base
de homologação dedicada.
