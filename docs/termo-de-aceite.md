# Termo de aceite — MainCourse v0.4.0 (R04)

**Projeto:** MC-2026 · MainCourse — cardápio, compras e despensa da semana
**Release:** R04 · versão 0.4.0
**Disciplina:** Gerência de Projetos de Software
**Desenvolvedor:** Andrey Gregorio
**Instituição:** ______________________________
**Data:** ____/____/______

---

## 1. Objeto

Este termo registra o aceite da Release 4 do MainCourse, aplicação web para planejamento de
cardápio, lista de compras e despensa doméstica, desenvolvida como projeto da disciplina de Gerência
de Projetos de Software.

O objeto do aceite é o conjunto formado por:

- aplicação publicada (GitHub Pages e/ou Firebase Hosting);
- código-fonte no repositório <https://github.com/AndreyGregorio/MainCourse>;
- manual do usuário na aplicação (aba Manual) e em `docs/manual-do-usuario.md`;
- documentação de release, homologação, encerramento e gerência;
- regras do Firestore da R04;
- suíte de testes automatizados.

## 2. Escopo entregue

| Item | Entrega | Situação |
| --- | --- | --- |
| R01 | Pratos e ingredientes | Entregue |
| R02 | Receitas e despensa | Entregue |
| R03 | Cardápio, lista de compras e resumo por unidade | Entregue |
| R04 / SM-01 | Rendimento da receita e embalagem de compra | Entregue |
| R04 / RF03 | Itens da despensa na lista de compras, com marcação | Entregue |
| R04 / RFC07 | Manual do usuário na aplicação | Entregue |
| R04 | Publicação no Firebase Hosting (configuração e workflow) | Entregue, pendente de credenciais do projeto |
| R04 | Homologação e termo de aceite | Este documento |
| R04 | Encerramento e lições aprendidas | Entregue em `docs/encerramento.md` |
| R04 | Monitoramento de marcos e controle de mudanças | Entregue em `docs/gerencia/` |

## 3. Requisitos verificados

A verificação segue a matriz de rastreabilidade
([`docs/matriz-de-rastreabilidade.md`](matriz-de-rastreabilidade.md)) e o roteiro de homologação
([`docs/homologacao.md`](homologacao.md)).

- RFS01 a RFS20 — cadastros, receitas, despensa e cardápio.
- RF01 e RF02 — lista de compras e resumo por unidade.
- RF03 — itens da despensa na lista de compras.
- RFC01 a RFC07 — seções da interface e manual do usuário.
- SM-01 — rendimento da receita e embalagem de compra.
- SM-02 — mudança aprovada da despensa na lista.

## 4. Critérios de aceite

O aceite é concedido quando:

1. O roteiro de homologação H01–H12 estiver conforme nos itens aplicáveis.
2. Não houver defeito crítico ou alto aberto.
3. As regras do Firestore da R04 estiverem publicadas.
4. A suíte E2E tiver passado no emulador ou no CI.
5. O manual do usuário estiver disponível na aplicação e em documento.
6. Este termo estiver assinado pelas partes.

## 5. Restrições e pendências

| Item | Situação | Responsável | Prazo |
| --- | --- | --- | --- |
| Configurar as credenciais do Firebase Hosting (service account) | Pendente, se o deploy automático for usado | Desenvolvedor | |
| Publicar o `firestore.rules` da R04 no projeto de produção | Obrigatório antes do uso real | Desenvolvedor | |
| Autorizar o domínio do Hosting no Authentication | Obrigatório se o Hosting for usado | Desenvolvedor | |
| Anexar evidências da homologação | A preencher | Responsável pela homologação | |
| Assinaturas | A preencher | Partes | |

## 6. Limitações aceitas

- O cardápio cobre segunda a sexta, um prato por dia, sem datas nem refeições separadas.
- A lista não desconta automaticamente o estoque da despensa.
- As marcações são por item, não por semana.
- O login é anônimo e único; não há perfis por morador.
- O plano gratuito do Firebase não tem backup automático.
- Os testes E2E gravam e apagam dados; devem rodar no emulador ou em base de homologação.

## 7. Declaração de aceite

Declaro que a Release 4 do MainCourse foi entregue, homologada e aceita nos termos deste documento,
ressalvadas as pendências e limitações registradas nas seções 5 e 6.

| Parte | Nome | Assinatura | Data |
| --- | --- | --- | --- |
| Desenvolvedor | Andrey Gregorio | | |
| Responsável pela homologação | | | |
| Professor(a) / cliente | | | |

## 8. Anexos

1. [`docs/matriz-de-rastreabilidade.md`](matriz-de-rastreabilidade.md)
2. [`docs/homologacao.md`](homologacao.md)
3. [`docs/releases/r04.md`](releases/r04.md)
4. [`docs/manual-do-usuario.md`](manual-do-usuario.md)
5. [`docs/encerramento.md`](encerramento.md)
6. [`docs/gerencia/controle-de-mudancas.md`](gerencia/controle-de-mudancas.md)
