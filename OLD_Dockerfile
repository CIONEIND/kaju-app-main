# 1. Base Image & Security Patches
FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*

# 2. Builder Stage (Merged to prevent symlink destruction)
FROM base AS builder
WORKDIR /app

# Copy package management files first
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

# Install dependencies DIRECTLY in the builder to preserve symlinks
RUN \
  if [ -f yarn.lock ]; then yarn install; \
  elif [ -f package-lock.json ]; then npm install; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm install; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Copy the rest of your source code
COPY . .

# Build the Next.js application
ENV NEXT_TELEMETRY_DISABLED=1

# Placeholders de BUILD. Nada aqui abre conexão — são exigências de avaliação
# de módulo que quebram o build se faltarem:
#
#   DATABASE_URL      prisma.config.ts resolve env("DATABASE_URL") ao carregar,
#                     antes mesmo do `prisma generate` rodar.
#   SQL_SERVER_*      knex-top-manager-{producao,desenvolvimento}.ts lançam no
#                     import, e o `next build` avalia esses módulos ao coletar
#                     os dados das rotas /api/debug/* e /api/top-manager/*.
#   RESEND_API_KEY    src/lib/email/resend.ts faz `new Resend(...)` no topo do
#                     módulo, e o SDK lança se a chave for undefined.
#
# Os valores vivem só dentro deste RUN — não viram ENV da imagem final, então
# não vazam para runtime. Em runtime quem manda é o `env_file` do compose.
#
# Antes isso "funcionava" porque o .env local do desenvolvedor entrava pelo
# `COPY . .` e era assado dentro da imagem. Não faça isso de novo: o .env voltou
# para o .dockerignore.
RUN \
  export DATABASE_URL="${DATABASE_URL:-postgresql://build:build@127.0.0.1:5432/build}"; \
  export SQL_SERVER_DEV_HOST=build SQL_SERVER_DEV_USER=build SQL_SERVER_DEV_PASS=build SQL_SERVER_DEV_PORT=1433; \
  export SQL_SERVER_PROD_HOST=build SQL_SERVER_PROD_USER=build SQL_SERVER_PROD_PASS=build SQL_SERVER_PROD_PORT=1433; \
  export RESEND_API_KEY=re_build_placeholder; \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# 3. Development Runner Stage (ambiente de desenvolvimento na VPS)
#
# Sem OpenVPN: na VPS de desenvolvimento quem faz a rota até o SQL Server é o
# WireGuard do host (wg0), então o container só precisa sair pela rede bridge.
# Por isso também não há gosu/entrypoint — o processo já sobe como `nextjs`.
#
# IMPORTANTE: este estágio fica ANTES de `runner` de propósito. `runner` precisa
# continuar sendo o último estágio do arquivo, porque o docker-compose.prod.yml
# usa `build: .` sem `target` e o Docker assume o último estágio como padrão.
FROM base AS runner-dev
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
# ENV HOSTNAME="0.0.0.0"

# `fetch` global do Node 22 — evita instalar curl só para o healthcheck.
HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]

# 4. Production Runner Stage
FROM base AS runner
WORKDIR /app

# INSTALL OPENVPN & GOSU
RUN apt-get update && \
    apt-get install -y openvpn gosu iproute2 && \
    rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Setup secure non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public folder and prep cache
COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next

# Copy the standalone output and static files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

# # Switch to secure user
# USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# CMD ["node", "server.js"]
ENTRYPOINT ["./entrypoint.sh"]