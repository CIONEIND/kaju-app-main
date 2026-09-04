#!/usr/bin/env bash
# ============================================================================
# setup-admin.sh — Kaju · promove o primeiro administrador (RBAC)
# ----------------------------------------------------------------------------
# Rode DEPOIS que o usuário fizer login pelo menos uma vez no app.
# O login cria o registro na tabela User; este script então:
#   1. Confere se o usuário do BOOTSTRAP_ADMIN_EMAIL existe no banco
#   2. Roda o seed de RBAC (cria papéis + promove o admin)
#   3. Opcional: roda o seed de endereços (27 UFs + 5.570 municípios)
#
# Uso:
#   ./setup-admin.sh                # RBAC apenas
#   ./setup-admin.sh --seed         # RBAC + seed de endereços
#   ./setup-admin.sh --email=fulano@empresa.com   # admin diferente do .env
# ============================================================================
set -euo pipefail

ENV_FILE=".env"
COMPOSE_FILE="docker-compose.yml"
DC=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")

DO_SEED=false
ADMIN_EMAIL=""

for arg in "$@"; do
  case "$arg" in
    --seed)        DO_SEED=true ;;
    --email=*)     ADMIN_EMAIL="${arg#*=}" ;;
    *)
      echo "Uso: ./setup-admin.sh [--seed] [--email=EMAIL]"
      exit 1
      ;;
  esac
done

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
ok()  { printf '\033[1;32m    ✔ %s\033[0m\n' "$*"; }
err() { printf '\033[1;31m    ✘ %s\033[0m\n' "$*" >&2; exit 1; }

# ------------------------------------------------------------- preflight --
[ -f "$ENV_FILE" ] || err "Arquivo $ENV_FILE não encontrado."

# Se o e-mail não veio por flag, usa o BOOTSTRAP_ADMIN_EMAIL do .env
if [ -z "$ADMIN_EMAIL" ]; then
  ADMIN_EMAIL=$(grep -E '^BOOTSTRAP_ADMIN_EMAIL=' "$ENV_FILE" | cut -d'=' -f2- | tr -d '"')
fi
[ -n "$ADMIN_EMAIL" ] || err "BOOTSTRAP_ADMIN_EMAIL não definido no .env (ou use --email=)."

# ------------------------------------------------- usuário já logou? ----
log "Conferindo se o usuário $ADMIN_EMAIL já existe no banco..."
USER_COUNT=$("${DC[@]}" exec -T postgres psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-kaju}" \
  -tAc "SELECT COUNT(*) FROM \"User\" WHERE email = '$ADMIN_EMAIL';" 2>/dev/null || echo "0")

if [ "$USER_COUNT" = "0" ]; then
  err "Usuário $ADMIN_EMAIL ainda não existe. Faça login no app com essa conta Google primeiro."
fi
ok "Usuário encontrado no banco."

# -------------------------------------------------------------- RBAC ----
log "Rodando o seed de RBAC (papéis + promoção a Administrador)..."
"${DC[@]}" run --rm migrate npm run db:seed:rbac
ok "RBAC aplicado — $ADMIN_EMAIL agora tem papel de Administrador."

# ------------------------------------------------------- seed opcional ----
if [ "$DO_SEED" = true ]; then
  log "Rodando o seed de endereços (27 UFs + 5.570 municípios — idempotente)..."
  "${DC[@]}" run --rm migrate npx prisma db seed
  ok "Seed de endereços concluído."
fi

echo
ok "Pronto. Faça login de novo no app — o painel de administração deve estar liberado."



# 1. Dê permissão de execução
#chmod +x setup-admin.sh

# 2. Faça login no app com a conta do BOOTSTRAP_ADMIN_EMAIL (uma vez)

# 3. Rode o script
#./setup-admin.sh

# Se ainda não rodou o seed de endereços, use:
#./setup-admin.sh --seed

# Se quiser promover outro e-mail sem mexer no .env:
#./setup-admin.sh --email=outro@cione.com.br


#!/bin/bash