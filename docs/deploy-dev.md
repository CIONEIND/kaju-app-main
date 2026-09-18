# Ambiente de desenvolvimento na VPS

Runbook do CI/CD que publica a branch `develop` na VPS.

Produção **não** é tocada por este pipeline: ela continua sendo deploy manual
com `docker-compose.prod.yml` (túnel OpenVPN + rede externa `database`).

---

## Como funciona

```
push em develop
      │
      ▼
Github.com dispara o pipeline
      │
      ▼
Github Runner self-hosted (executor shell) — roda DENTRO da própria VPS
      │
      ├─ lint      docker run kaju-app:builder npm run lint      (não bloqueia)
      ├─ build     docker compose build  →  kaju-app:dev-latest
      │                                  →  kaju-app:dev-<sha>   (para rollback)
      ├─ migrate   docker compose run --rm migrate  (migrate deploy + db seed)
      ├─ deploy    docker compose up -d app         (127.0.0.1:3001)
      └─ verify    curl http://127.0.0.1:3003/api/health
                          │
                          ▼
                   reverse proxy do host  →  https://dev.SEU-DOMINIO
```

Não há registry nem SSH: o runner constrói e sobe a stack na mesma máquina.

### O que a stack contém

| Serviço | Container | Porta | Observação |
| --- | --- | --- | --- |
| `app` | `kaju-dev-app` | `127.0.0.1:3003` | Estágio `runner-dev` do Dockerfile — **sem** OpenVPN |
| `postgres` | `kaju-dev-postgres` | `127.0.0.1:5433` | Volume `kaju-dev-pgdata`, exclusivo do dev |
| `migrate` | one-shot | — | Estágio `builder`; só roda via `compose run --rm` |

Rede Docker `kaju-dev`, subnet fixa **`172.28.10.0/24`** (a regra do WireGuard
depende dela — ver adiante). Projeto compose `kaju-dev`, isolado dos containers
de produção.

---

## 1. Pré-requisitos na VPS

```bash
docker --version            # 24+ com o plugin `docker compose` v2
sudo systemctl is-active docker
ip -br addr show wg0        # o hub WireGuard precisa estar UP
curl --version
```

Confirme também que a porta 3001 e o volume `kaju-dev-pgdata` estão livres:

```bash
sudo ss -ltnp | grep -E ':(3001|5433)\b'   # não deve retornar nada
docker volume ls | grep kaju
docker ps --format '{{.Names}}\t{{.Ports}}'
```

---

## 2. Instalar e registrar o GitLab Runner

### 2.1 Instalar

```bash
curl -L "https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh" | sudo bash
sudo apt-get install -y gitlab-runner
```

### 2.2 Dar acesso ao Docker

O executor `shell` roda como o usuário `gitlab-runner`, que precisa falar com o
daemon do Docker:

```bash
sudo usermod -aG docker gitlab-runner
sudo systemctl restart gitlab-runner
sudo -u gitlab-runner docker ps      # tem que funcionar sem sudo
```

> ⚠️ Estar no grupo `docker` equivale a root na máquina. Como o runner já
> constrói e sobe containers nessa VPS, isso é inerente ao modelo escolhido —
> mantenha o acesso ao projeto no GitLab restrito a quem pode mexer no servidor.

### 2.3 Criar o token no GitLab

No GitLab: **projeto `cione/kaju-app` → Settings → CI/CD → Runners → New project runner**

- Tags: `kaju-vps`
- **Desmarque** "Run untagged jobs"
- Marque "Lock to current projects"

Copie o token gerado (`glrt-...`).

### 2.4 Registrar

```bash
sudo gitlab-runner register \
  --non-interactive \
  --url "https://gitlab.com" \
  --token "glrt-jS7XHlMMYgUjxjR0XjpFdWM6MQpvOjEKcDoxY2doOGQKdDozCnU6Y3h5enoc.01.1o1x0gyew" \
  --executor "shell" \
  --shell "bash" \
  --description "kaju-vps-dev"

sudo gitlab-runner verify
```

### 2.5 Serializar as execuções

Deploys concorrentes na mesma máquina se atropelam. O pipeline já usa
`resource_group`, mas trave também no runner:

```bash
sudo sed -i 's/^concurrent = .*/concurrent = 1/' /etc/gitlab-runner/config.toml
sudo systemctl restart gitlab-runner
```

---

## 3. Arquivo de ambiente

Os segredos ficam **na VPS**, não em variáveis do GitLab. O pipeline só lê o
arquivo; nunca escreve nele.

```bash
sudo mkdir -p /srv/kaju-dev
sudo chown root:gitlab-runner /srv/kaju-dev
sudo chmod 750 /srv/kaju-dev

sudo -e /srv/kaju-dev/.env       # cole o conteúdo de .env.dev.example e preencha

sudo chown root:gitlab-runner /srv/kaju-dev/.env
sudo chmod 640 /srv/kaju-dev/.env
sudo -u gitlab-runner cat /srv/kaju-dev/.env > /dev/null && echo "runner consegue ler"
```

O template está em [`.env.dev.example`](../.env.dev.example) na raiz do repo.

Pontos que costumam quebrar:

- `DATABASE_URL` usa host **`postgres`** e porta **5432** (nome do serviço na
  rede do compose), não `localhost:5433`.
- `NEXTAUTH_URL` é a URL pública `https://...`, não `127.0.0.1:3001`.
- Todos os `SQL_SERVER_PROD_*` são obrigatórios:
  [`knex-top-manager-producao.ts`](../src/lib/top-manager/db/knex-top-manager-producao.ts)
  lança erro já no import se algum estiver vazio, e o container morre no boot.

---

## 4. Rota do container até o SQL Server (WireGuard)

O `wg0` é uma interface **do host**. Containers na rede bridge não alcançam os
peers da VPN por padrão: o pacote sai com IP de origem `172.28.10.x`, que não
está no `AllowedIPs` da outra ponta, então a resposta nunca volta.

A correção é mascarar **apenas** a subnet do dev ao sair pela `wg0`.

### 4.1 Descobrir o IP do SQL Server na VPN

```bash
sudo wg show
```

Use o IP que aparece em `allowed ips` do peer do SQL Server. Guarde como
`SQL_IP` — é ele que vai em `SQL_SERVER_*_HOST`.

### 4.2 Aplicar a regra agora (sem derrubar a VPN)

```bash
sudo iptables -t nat -C POSTROUTING -s 172.28.10.0/24 -o wg0 -j MASQUERADE 2>/dev/null \
  || sudo iptables -t nat -A POSTROUTING -s 172.28.10.0/24 -o wg0 -j MASQUERADE

sudo iptables -t nat -L POSTROUTING -n --line-numbers | grep 172.28.10
```

### 4.3 Persistir a regra

Adicione ao bloco `[Interface]` de `/etc/wireguard/wg0.conf`:

```ini
PostUp   = iptables -t nat -A POSTROUTING -s 172.28.10.0/24 -o %i -j MASQUERADE
PostDown = iptables -t nat -D POSTROUTING -s 172.28.10.0/24 -o %i -j MASQUERADE
```

Não precisa reiniciar o `wg-quick@wg0` agora (isso derrubaria todos os peers do
hub) — a regra do passo 4.2 já está valendo, e o `PostUp` garante que ela volte
no próximo boot.

> A regra é restrita a `-s 172.28.10.0/24` de propósito. Um `MASQUERADE` amplo
> na `wg0` faria o hub reescrever também o tráfego que ele roteia entre peers.

### 4.4 Testar (depois do primeiro deploy, com a rede criada)

```bash
docker run --rm --network kaju-dev busybox \
  sh -c 'nc -w 3 -z 10.10.0.10 1433 && echo ABERTO || echo FECHADO'
```

Se der `FECHADO`: confira o firewall do lado do SQL Server e se
`net.ipv4.ip_forward` está em `1` (`sysctl net.ipv4.ip_forward`).

---

## 5. DNS, reverse proxy e TLS

Aponte `dev.SEU-DOMINIO` (A record) para o IP da VPS e adicione o vhost no proxy
que já serve produção.

### nginx

`/etc/nginx/sites-available/kaju-dev` (depois `ln -s` para `sites-enabled`):

```nginx
server {
    listen 80;
    server_name dev.SEU-DOMINIO;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    http2 on;
    server_name dev.SEU-DOMINIO;

    ssl_certificate     /etc/letsencrypt/live/dev.SEU-DOMINIO/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dev.SEU-DOMINIO/privkey.pem;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }
}
```

```bash
sudo certbot --nginx -d dev.SEU-DOMINIO
sudo nginx -t && sudo systemctl reload nginx
```

### Caddy

```caddyfile
dev.SEU-DOMINIO {
    reverse_proxy 127.0.0.1:3001
}
```

### Traefik

Sem vhost de arquivo — adicione labels ao serviço `app` em
`docker-compose.dev.yml`, remova o mapeamento de portas e ligue o container
também à rede do Traefik.

Depois, troque `https://dev.SEU-DOMINIO` pela URL real nos dois blocos
`environment:` de [`.gitlab-ci.yml`](../.gitlab-ci.yml).

---

## 6. Google OAuth

No Google Cloud Console, no mesmo OAuth Client usado hoje, adicione:

- **Authorized JavaScript origins:** `https://dev.SEU-DOMINIO`
- **Authorized redirect URIs:** `https://dev.SEU-DOMINIO/api/auth/callback/google`

Sem isso o login quebra com `redirect_uri_mismatch`.

---

## 7. Primeiro deploy

1. Faça merge/push dos arquivos de CI em `develop`.
2. Acompanhe o pipeline em **CI/CD → Pipelines**.
3. O job `migrate` aplica as migrations e roda o seed (27 UFs + 5.570
   municípios) automaticamente — não há passo manual.
4. Confira:

```bash
curl -s http://127.0.0.1:3001/api/health          # na VPS
curl -s https://dev.SEU-DOMINIO/api/health        # de fora
```

Resposta esperada: `{"status":"ok","commit":"<sha-curto>"}`.

---

## 8. Operação do dia a dia

Atalho útil na VPS:

```bash
alias dcdev='docker compose --env-file /srv/kaju-dev/.env -p kaju-dev -f docker-compose.dev.yml'
```

| Tarefa | Comando |
| --- | --- |
| Logs ao vivo | `dcdev logs -f app` |
| Status | `dcdev ps` |
| Reiniciar só a app | `dcdev restart app` |
| Derrubar (mantém o banco) | `dcdev down` |
| Derrubar **e apagar o banco** | `dcdev down -v` |
| psql no banco de dev | `docker exec -it kaju-dev-postgres psql -U kaju -d kaju_dev` |
| Rodar o seed à mão | `dcdev run --rm migrate npx prisma db seed` |
| Ver imagens disponíveis | `docker images kaju-app` |

**Acessar o Postgres de dev da sua máquina** (ele só escuta no loopback da VPS):

```bash
ssh -L 5433:127.0.0.1:5433 usuario@VPS
# depois: postgresql://kaju:senha@localhost:5433/kaju_dev
```

**Rollback:** no pipeline do commit bom, ou em qualquer pipeline, rode o job
manual `rollback` com a variável `ROLLBACK_TAG` = `dev-<sha-curto>`
(**Run pipeline** → adicione a variável, ou use "Run job with variables").
As tags disponíveis saem de `docker images kaju-app` — o job `cleanup` mantém as
5 mais recentes.

---

## 9. ⚠️ A imagem de produção provavelmente contém um `.env`

Isto apareceu ao montar o pipeline e **não é sobre o ambiente de dev** — é sobre
a imagem de produção que está rodando hoje.

O `.env` tinha sido retirado do `.dockerignore` (commit `1085004`, *"remove env
from dockerignore"*), então o `COPY . .` do estágio `builder` copiava o `.env`
da máquina de quem buildava para dentro da imagem. Era só assim que o build
passava: o `prisma.config.ts` faz `import "dotenv/config"` e aborta se
`DATABASE_URL` não resolver.

Ou seja: **qualquer imagem de produção construída desde aquele commit tem um
`.env` real assado dentro dela** — credenciais de banco, `NEXTAUTH_SECRET`,
segredo do Google OAuth, chave do Resend e as senhas do SQL Server.

O que já foi corrigido aqui:

- `.env` e `.env.*` voltaram para o `.dockerignore`.
- O estágio `builder` exporta placeholders descartáveis (`DATABASE_URL`,
  `SQL_SERVER_*`, `RESEND_API_KEY`) apenas dentro do `RUN` do build. Eles não
  viram `ENV` da imagem — conferido com `docker image inspect`.

O que ainda depende de você:

```bash
# Confirme na imagem de produção que está no ar hoje
docker run --rm --entrypoint sh <imagem-de-prod> -c 'cat /app/.env'
```

Se aparecer conteúdo, trate como vazamento: **rotacione** `NEXTAUTH_SECRET`, a
senha do Postgres de produção, o `GOOGLE_CLIENT_SECRET`, a `RESEND_API_KEY` e as
senhas do SQL Server, e reconstrua a imagem de produção com este `Dockerfile`
corrigido.

---

## 10. Dívidas conhecidas

Nenhuma bloqueia o deploy, mas vale endereçar:

- **`biome check` falha** (118 erros / 148 avisos, quase tudo formatação). Por
  isso o job `lint` está com `allow_failure: true`. Rode `npm run format`, limpe
  o resto e troque para bloqueante.
- **`npm install` no `Dockerfile`, não `npm ci`.** O `package-lock.json` está
  versionado, então `npm ci` daria builds reproduzíveis. Não troquei porque o
  mesmo estágio `builder` serve produção e a mudança quebraria o build se o
  lockfile estiver fora de sincronia.
- **`node:22-bookworm-slim` vs `engines.node: 24.12.0`** no `package.json`. Dev
  e prod compartilham a imagem base, então mantive a paridade — mas o ambiente
  de CI não é o Node que o time usa localmente.
- **Sem downtime zero.** `compose up -d app` recria o container; há alguns
  segundos de 502. Aceitável para dev.
- **Migrations não têm rollback automático.** O job `rollback` volta a imagem,
  não o schema. Migration destrutiva exige intervenção manual no banco.
