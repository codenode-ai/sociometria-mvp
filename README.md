# Sociometria MVP

Aplicacao full-stack para administrar colaboradoras, casas, testes psicologicos e avaliacoes sociometricas.

## Visao geral

- **Client** em React + Vite.
- **API** Express com endpoints REST para funcionarios, casas, testes e autenticacao.
- **Banco** Supabase (Postgres + Auth). Os scripts SQL estao em `server/sql`.
- **Autenticacao** com diferenca de papeis:
  - `admin`: pode criar/editar testes e acessar funcoes de administracao.
  - `user`: acessa recursos de operacao (visualizacao, distribuicao etc.).

## Requisitos

- Node.js 20+
- npm 10+
- Conta Supabase com projeto configurado.

## Setup

1. Instale dependencias:
   ```bash
   npm install
   ```
2. Copie `server/server.env` (ou crie) com as variaveis:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_DB_URL` (se necessario para scripts)
3. Execute, na base do Supabase, os arquivos de `server/sql/` na seguinte ordem sugerida:
   1. `auth-and-roles.sql`
   2. `tests-functions.sql`
   3. Outros scripts de dados auxiliares (se houver).
4. Para garantir o admin padrao:
   ```sql
   -- rodar no Supabase
   \i server/sql/admin-seed.sql
   ```
   Isso cria/promove `contato@codenode.com.br` com papel `admin`.

## Execucao

```bash
npm run dev      # modo desenvolvimento (client + API com Vite)
npm run build    # build de producao (client + server bundle)
npm run start    # executa dist/index.js
```

Por padrao a API sobe em `http://localhost:5001`. Use a variavel `PORT` para alterar.

## Scripts uteis

| Script | Descricao |
| --- | --- |
| `server/sql/admin-seed.sql` | Cria/atualiza o admin `contato@codenode.com.br` |
| `server/sql/reset-users.sql` | Remove usuarios e perfis (executar com role de servico) |

## Diferencas por papel

- **Admin**
  - Cria, edita e remove testes.
  - Acessa as funcoes de gerencia em todo o painel.
- **User (empresa)**
  - Visualiza testes, funcionarios, casas, relatorios.
  - Distribuicao de avaliacoes se atualiza automaticamente conforme links e respostas (sem botao manual).

## Fluxos principais

- **Funcionarias e Casas**: listagem com filtros, cadastro via modais, integracao com Supabase.
- **Testes**: CRUD completo via hooks que acessam a API; apenas admin visualiza botoes de criacao/edicao.
- **Avaliacoes**:
  - Criacao e duplicacao de avaliacoes.
  - Geracao de links, renovacao e expiracao.
  - Distribuicao (assignments) atualizada pelo backend com base em links/sessoes; nao ha adicao manual.
- **Sociometria**: preferencias e evitacoes salvam direto em employees.
  - Graficos exibem pares fortes/conflitos com base nas respostas atuais.

## Testes / verificacoes

Nao ha suite automatica ainda; utilize:

```bash
npm run check   # tsc
npm run build   # garante que o bundle gera sem erros
```

## Contribuindo

1. Crie uma branch.
2. Aplique as modificacoes.
3. Rode `npm run check` e `npm run build`.
4. Abra um PR descrevendo o fluxo impactado (admin x user).

## Contato

Para duvidas sobre configuracao do Supabase ou scripts de banco, utilize o usuario admin padrao `contato@codenode.com.br` ou atualize conforme a necessidade da equipe.
