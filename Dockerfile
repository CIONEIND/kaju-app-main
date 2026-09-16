# 1. Base Image & Security Patches
FROM node:24-bookworm-slim AS base
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*


# 2. Builder Stage
FROM base AS builder
WORKDIR /app

# 1) Instala as dependências (lockfile determinístico)
COPY package.json package-lock.json ./
RUN npm ci

# 2) Copia o resto do código
COPY . .

# 3) Generate + build no MESMO RUN dos placeholders:
#    o prisma.config.ts resolve env("DATABASE_URL") ao carregar,
#    então a variável precisa existir ANTES do `prisma generate`.
RUN export DATABASE_URL="postgresql://build:build@127.0.0.1:5433/build" && \
    export SQL_SERVER_DEV_HOST=build SQL_SERVER_DEV_USER=build SQL_SERVER_DEV_PASS=build SQL_SERVER_DEV_PORT=1433 && \
    export SQL_SERVER_PROD_HOST=build SQL_SERVER_PROD_USER=build SQL_SERVER_PROD_PASS=build SQL_SERVER_PROD_PORT=1433 && \
    export RESEND_API_KEY=re_build_placeholder && \
    npx prisma generate && \
    npm run build
# 3. Runner Stage (produção e dev — sem VPN, sem entrypoint)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3002


HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3002)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]

