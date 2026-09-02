# Kaju

Aplicação [Next.js](https://nextjs.org) da Cione. Usa Postgres (banco próprio da
aplicação, via Prisma) e o ERP TopManager em SQL Server (consultado via Knex).

---

## Pré-requisitos


| Ferramenta | Versão | Observação |
| --- | --- | --- |
| Node.js | 24.12.0 | Definido em `engines` no `package.json`. Recomenda-se usar `nvm`/`fnm`/`asdf`. |
| npm | 10+ | Vem junto com o Node 24. |
| Docker + Docker Compose | v2+ | Usado para subir o Postgres local. |
| Cliente OpenVPN | — | Necessário **somente** para acessar o ERP TopManager. |

---

## Passo a passo

### 1. Instalar as dependências

```bash
git clone <url-do-repositorio>
cd kaju-app
npm install
```

### 2. Criar o arquivo `.env`

```bash
cp .env.example .env
```

Abra o `.env` e preencha os valores. Os padrões do Postgres já funcionam com o
container do passo 3; os demais precisam ser preenchidos:

| Variável | Como obter |
| --- | --- |
| `NEXTAUTH_SECRET` | Gere com `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Credenciais OAuth do projeto no Google Cloud — peça ao time |
| `SQL_SERVER_DEV_*` / `SQL_SERVER_PROD_*` | Credenciais do TopManager — peça ao DBA. Os bancos do ERP ficam atrás da VPN e não sobem localmente |
| `RESEND_API_KEY` | Painel do [Resend](https://resend.com) — peça ao time |

> O `.env` está no `.gitignore`. **Nunca** faça commit dele.

### 3. Subir o Postgres

O `docker-compose.yml` da raiz contém **apenas a infraestrutura de
desenvolvimento** — a aplicação em si roda nativamente com `npm run dev`, o que
preserva hot reload, source maps e o debugger.

```bash
docker compose up -d
```

Isso sobe um Postgres 17 em `localhost:5432` com usuário `postgres`, senha
`postgres` e banco `kaju`, persistindo os dados no volume `pgdata`.

Para conferir se subiu:

```bash
docker compose ps
```

> ⚠️ O `docker-compose.prod.yml` é o arquivo de **produção** (túnel VPN + rede
> externa `database` gerenciada pelo DBA). Não use ele localmente.

### 4. Gerar o Prisma Client

```bash
npm run prisma:generate
```

Gera o Prisma Client em `src/generated/prisma`. Essa pasta não é versionada, então
rode esse comando também sempre que um `git pull` alterar o `prisma/schema.prisma`.

### 5. Aplicar as migrations do Prisma

```bash
npx prisma migrate dev
```

Cria os schemas `public` e `dbo` e aplica todas as migrations no banco que subiu
no passo 3. As tabelas ficam criadas, porém vazias.

### 6. Popular as tabelas de UF e Município

```bash
npm run db:seed
```

Esse passo é **obrigatório** no primeiro setup: o `migrate dev` do passo anterior
não dispara o seed sozinho, então sem ele as tabelas `UF` e `Municipio` ficam
vazias e os formulários de endereço não carregam nada.

O script [`prisma/seed.ts`](prisma/seed.ts) lê `unidades-federativas.csv`
(27 UFs) e `municipios.csv` (5.570 municípios) da raiz do repositório e grava com
`upsert` — pode ser executado quantas vezes quiser sem duplicar dados. Rode de
novo sempre que algum dos dois CSVs for atualizado.

Para conferir se deu certo:

```bash
docker compose exec postgres psql -U postgres -d kaju \
  -c 'select count(*) from "UF";' \
  -c 'select count(*) from "Municipio";'
```

Deve retornar 27 e 5570.

### 7. Rodar a aplicação

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) e faça login com o Google.
Esse primeiro login cria o seu usuário no banco (necessário para o passo 8).

### 8. Configurar papéis e o primeiro administrador (RBAC)

```bash
npm run db:seed:rbac
```

Cria os papéis **Administrador**, **Legado** e **Novo usuário** e migra as contas
já existentes (sem papel) para **Legado**. Assim como o seed do passo 6, o
`migrate` **não** dispara esse seed sozinho. O script
[`prisma/seed-rbac.ts`](prisma/seed-rbac.ts) é idempotente — pode rodar quantas
vezes quiser.

Para se tornar administrador:

1. Faça login no app ao menos uma vez (passo 7).
2. No `.env`, defina `BOOTSTRAP_ADMIN_EMAIL` com o seu e-mail de login Google
   (pode listar vários, separados por vírgula).
3. Rode `npm run db:seed:rbac` novamente.

Feito isso, o item **Administração** aparece na barra lateral e você gerencia
papéis, permissões e usuários em `/administracao`.

## Controle de acesso (RBAC)

O acesso é controlado por **papéis** (roles), cada um com um conjunto de
**permissões**. O catálogo de permissões é fixo no código
([`src/lib/rbac/permissions.ts`](src/lib/rbac/permissions.ts)) — só a atribuição
de permissões aos papéis é dinâmica (feita pelo admin na tela `/administracao`).

Três papéis são criados pelo seed:

| Papel | Permissões | Atribuído a |
| --- | --- | --- |
| **Administrador** | Todas (superusuário, papel de sistema — não editável/excluível) | Definido via `BOOTSTRAP_ADMIN_EMAIL` |
| **Legado** | Todas, **exceto** administração | Contas que já existiam antes do RBAC |
| **Novo usuário** | Somente leitura básica (pedidos, estoque, clientes) | **Toda conta nova**, automaticamente no primeiro login |

Regras importantes:

- Uma **conta nova** nunca nasce com acesso total: recebe o papel **Novo
  usuário** automaticamente ([`src/auth.ts`](src/auth.ts)). Usuários sem papel
  também caem nesse mesmo nível de leitura básica.
- O papel **Administrador** é superusuário: ganha automaticamente qualquer
  permissão nova que for adicionada ao catálogo, sem precisar re-seedar.
- Há uma proteção que impede remover o **último** administrador do sistema.

### RBAC em produção

Diferente do desenvolvimento, em produção **não** se usa `migrate dev`/seed
automático, e a imagem Docker `standalone` não contém o Prisma CLI nem a pasta
`prisma/`. Portanto, migration e seed rodam **de fora** do container (pela
pipeline de deploy ou de uma máquina com o repositório e a `DATABASE_URL` de
produção):

```bash
# 1. Aplica as migrations (nunca `migrate dev` em produção)
DATABASE_URL="<prod>" npx prisma migrate deploy

# 2. Cria os papéis, migra as contas existentes para "Legado"
#    e promove o BOOTSTRAP_ADMIN_EMAIL a administrador
DATABASE_URL="<prod>" BOOTSTRAP_ADMIN_EMAIL="voce@empresa.com" npm run db:seed:rbac
```

O usuário indicado em `BOOTSTRAP_ADMIN_EMAIL` precisa ter feito login no app de
produção ao menos uma vez antes de rodar o seed.

## Notas do projeto

- Último cliente cadastrado em `TbCli`: **1825 — FIEC (Federação das Indústrias
  do Estado do Ceará)**. Os registros posteriores são todos de teste.
