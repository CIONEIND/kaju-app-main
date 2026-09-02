# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev              # next dev
npm run build            # prisma generate + next build
npm run lint             # biome check  (biome, not eslint)
npm run format           # biome format --write
npm run prisma:generate  # regenerate client into src/generated/prisma
npm run prisma:migrate   # prisma migrate dev
npm run db:seed          # prisma db seed → seeds IBGE UF/Municipio from root CSVs
```

There is no test suite and no test runner configured. Node is pinned to 24.12.0 (`engines`).

The seed ([prisma/seed.ts](prisma/seed.ts)) upserts the IBGE `UF`/`Municipio` tables from CSVs at the repo root; it is idempotent and also runs automatically on `prisma migrate dev`/`reset` (wired via `prisma.config.ts`).

Prisma is driven by `prisma.config.ts` (loads `dotenv` and reads `DATABASE_URL`), not by a `datasource url` in the schema — the `datasource db` block in `prisma/schema.prisma` intentionally has no `url`.

## The two databases

This is the single most important thing to understand. Every feature touches one or both:

1. **PostgreSQL via Prisma** — data this app owns: NextAuth tables, `PurchaseOrder` + items/audits/emails, email recipients & labels, IBGE `UF`/`Municipio`. Accessed through `prisma` from [src/lib/prisma.ts](src/lib/prisma.ts).
2. **"Top Manager" — a legacy SQL Server ERP, via Knex** — the source of truth for clients (`TbCli`/`TbPes`), addresses (`TbLoc`/`TbLgr`/`TbLlg`), products and stock ledger (`TbObj`/`TbLet`). Read/written with raw Knex query builders against Portuguese-abbreviated legacy tables and columns.

The Prisma client is generated to **`src/generated/prisma`**, so imports are `@/generated/prisma/client`, never `@prisma/client`. That directory is excluded from Biome and must be regenerated after any schema change. The schema uses multi-schema (`public` + `dbo`); `TbCli` lives in `dbo` as a partial local mirror of the ERP table with extra app-only columns (`isActive`, `registeredInV2`).

### Top Manager access layers

`src/lib/top-manager/` is strictly layered: `db/` (Knex instances) → `repository/` (query builders, default-export object of functions) → `service/` (zod validation + business rules, default-export class). Repositories and services all take an optional trailing `tsx: Knex = db` parameter so callers can pass a transaction; multi-table writes are wrapped in `db.transaction(...)` at the API route level (see [src/app/api/clients/route.ts](src/app/api/clients/route.ts)).

Two ERP instances exist — `getTopManagerDB("DESE" | "PROD")` from [resolve-db.ts](src/lib/top-manager/db/resolve-db.ts). **Client/address code currently targets `"DESE"` (development instance) while product & stock code imports `topManagerProducao` directly.** That asymmetry is deliberate-in-progress, not a bug to "fix" casually.

Both Knex modules call `requiredEnv()` at **module load**, so importing anything under `top-manager/db` without the `SQL_SERVER_*` env vars throws immediately. `next.config.ts` lists `knex` in `serverExternalPackages` — keep it there.

## Auth and route protection

NextAuth v4, Google provider only, **database** session strategy, Prisma adapter ([src/auth.ts](src/auth.ts)). A `User.blocked` flag gates both `signIn` and `session` callbacks.

Protection is layered, and each layer matters:

- [src/proxy.ts](src/proxy.ts) — Next 16's `middleware.ts` replacement. Only checks for the presence of a session cookie and redirects to `/login`; it does **not** validate the session.
- [src/app/(protected)/layout.tsx](src/app/(protected)/layout.tsx) — the real gate for pages: resolves the session and re-checks `blocked` against the DB.
- `requirePurchaseOrderUser()` in [src/lib/purchase-orders/auth.ts](src/lib/purchase-orders/auth.ts) — the gate for data access; call it at the top of any new purchase-order service function.

Always read sessions via `getCurrentSession()` ([src/lib/session.ts](src/lib/session.ts)), which swallows stale-cookie JWE decryption errors rather than throwing.

## Data-fetching conventions

Two coexisting styles — match whichever the surrounding feature uses:

- **Server actions**: modules under `src/app/services/**` start with `"use server"` and are imported *directly* into client components, often as a TanStack Query `queryFn` (e.g. [src/hooks/useClients.ts](src/hooks/useClients.ts)).
- **Route handlers** under `src/app/api/**`: used for the client CRUD/address flows and purchase orders, with zod `safeParse` at the boundary and Portuguese error messages in `{ error }` JSON.

`Providers` (TanStack Query) is mounted in the protected layout, not the root layout — pages outside `(protected)` have no query client.

## Purchase orders

[src/lib/purchase-orders/service.ts](src/lib/purchase-orders/service.ts) is the whole domain. Notable rules baked in:

- **Three independent status axes** — `orderStatus`, `financialStatus`, `stockStatus` — stored as Portuguese display strings. Never hardcode them: use `ORDER_STATUS` / `FINANCIAL_STATUS` / `STOCK_STATUS` and the `isPurchaseOrder*Status` guards in [constants.ts](src/lib/purchase-orders/constants.ts). Financial and stock changes require `orderStatus === "Confirmado"`.
- Every mutation runs in a `prisma.$transaction` and appends a `PurchaseOrderAudit` row in the same transaction.
- Totals are always recomputed server-side in `buildSnapshot()` from validated input plus live client/product lookups — client-supplied totals are ignored.
- Prisma `Decimal` columns are converted to JS numbers only in the `serialize*` functions at the edge.
- `withdrawPurchaseOrderStock` in [stock-withdrawal-client.ts](src/lib/purchase-orders/stock-withdrawal-client.ts) is a **mock**; the real ERP withdrawal is not implemented.

**Virtual stock** = physical quantity summed from the ERP ledger `TbLet` minus quantities on Postgres orders whose `stockStatus` is "Estoque reservado" (`getSockPositionWithReservations` in [productService.ts](src/app/services/product/productService.ts)). Box size is inferred from the product *name* containing "11,34" (11.34 kg) else 22.68 kg.

## UI

HeroUI **v3** (`@heroui/react` + `@heroui/styles`) with Tailwind v4 (CSS-first, `@import "tailwindcss"` in [globals.css](src/app/globals.css); no tailwind.config). HeroUI v3 uses compound components (`<Tooltip.Trigger>`, `<Tooltip.Content>`) and `onPress` instead of `onClick` — do not write v2-style props. Theme colors are oklch CSS variables in `globals.css`; use the semantic tokens (`bg-surface`, `text-muted`, `bg-accent`, …) rather than raw palette classes.

React Compiler is enabled (`reactCompiler: true`), so avoid adding manual `useMemo`/`useCallback` noise to new components.

Forms use react-hook-form + `zodResolver` with zod v4 schemas in `src/schemas/` or a feature-local `schemas/` folder. User-facing strings and validation messages are **Portuguese (pt-BR)**; code identifiers are mixed Portuguese/English — follow the file you are editing.

## Deployment

`output: "standalone"`. The Docker image installs OpenVPN, and [entrypoint.sh](entrypoint.sh) dials the VPN and waits for `tun0` **before** starting Node — the ERP SQL Server is only reachable through that tunnel. `docker-compose.yml` expects a `config.ovpn` at the repo root (gitignored) plus `VPN_USERNAME`/`VPN_PASSWORD`, and joins an external `database` network.

Env vars are documented in [.env.example](.env.example): `DATABASE_URL`, `NEXTAUTH_*`, `GOOGLE_CLIENT_*`, `SQL_SERVER_PROD_*` / `SQL_SERVER_DEV_*`, `RESEND_API_KEY`, `EMAIL_FROM`, `APP_ENV`.

`APP_ENV` identifies the environment — the dev VPS also runs with `NODE_ENV=production`, so that alone can't tell the two apart. `docker-compose.dev.yml` pins `APP_ENV=dese`; production leaves it unset. Anything that isn't prod counts as dese, and every outgoing email subject is prefixed with `[DESE]` by `applyDeseSubjectPrefix()` in [src/lib/email/subject.ts](src/lib/email/subject.ts) — apply it at the boundary of any new `resend.emails.send` call.
