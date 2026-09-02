export const DESE_SUBJECT_PREFIX = "[DESE]";

const PRODUCTION_APP_ENVS = new Set(["prod", "producao", "production"]);

/**
 * O ambiente de dese roda um build standalone com `NODE_ENV=production`, igual à
 * produção — quem separa os dois é `APP_ENV`, definido em docker-compose.dev.yml.
 *
 * Sem `APP_ENV`, cai no `NODE_ENV`: o `next dev` da máquina do desenvolvedor
 * também conta como dese, e só a produção (que sobe pelo estágio `runner` do
 * Dockerfile, com `NODE_ENV=production` e sem `APP_ENV`) fica de fora.
 *
 * Lido a cada chamada, não no topo do módulo, para não correr o risco de o valor
 * ser capturado durante o `next build`.
 */
export function isDeseEnvironment(): boolean {
  const appEnv = process.env.APP_ENV?.trim().toLowerCase();

  if (appEnv) return !PRODUCTION_APP_ENVS.has(appEnv);

  return process.env.NODE_ENV !== "production";
}

/**
 * Prefixa o assunto com `[DESE]` fora da produção, para que ninguém confunda um
 * e-mail de teste com um e-mail real. Idempotente: não empilha o prefixo.
 */
export function applyDeseSubjectPrefix(subject: string): string {
  const trimmed = subject.trim();

  if (!isDeseEnvironment()) return trimmed;
  if (/^\[dese\]/i.test(trimmed)) return trimmed;

  return `${DESE_SUBJECT_PREFIX} ${trimmed}`;
}
