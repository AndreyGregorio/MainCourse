# Changelog

Todas as mudanças relevantes do MainCourse. O formato segue
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o versionamento é por release do
projeto (`r01`, `r02`, ...).

## [0.1.0] — 2026-10-27 — Release 1

### Adicionado

- Cadastro de pratos (incluir, consultar com busca, renomear e excluir) — RFS01 a RFS04.
- Cadastro de ingredientes (incluir, consultar por nome/unidade, alterar unidade e excluir) —
  RFS05 a RFS08.
- Identidade visual MainCourse: logo, paleta navy/dourado, ícones, manifest PWA e imagem Open Graph.
- Firebase Authentication anônimo e Cloud Firestore com cache offline persistente.
- Regras do Firestore com autenticação obrigatória e validação de nome/unidade.
- Sincronização em tempo real e indicador de online/offline.
- Tela inicial minimalista de conexão, sem telas de erro visíveis.
- Workflow de deploy no GitHub Pages com `VITE_BASE` automático.
- Documentação de Firebase, GitHub Pages e notas da release.
- Testes E2E em Selenium + pytest (CRUD de pratos e ingredientes) e workflow manual no Actions.

### Segurança

- Acesso ao banco somente com sessão (anônima) criada pelo app.
- Domínio do Pages precisa estar autorizado no Firebase Authentication.
- Nenhuma chave privada no repositório; as chaves públicas vêm de `.env.local`/Secrets.

### Notas

- Receitas, despensa, cardápio e lista de compras ficam para as releases R02 e R03.
- Os testes E2E gravam/apagam registros reais; use uma base de homologação.
