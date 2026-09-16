import knex, { type Knex } from "knex";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function requiredEnvNumber(name: string): number {
  const value = Number.parseInt(requiredEnv(name), 10);
  if (Number.isNaN(value))
    throw new Error(`Environment variable ${name} must be a valid number.`);
  return value;
}

function optionalEnv(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

// Ambiente: prod/producao/production → TopManager; qualquer outro → TopTESTE
const APP_ENV = (process.env.APP_ENV ?? "dev").toLowerCase();
const isProduction = ["prod", "producao", "production"].includes(APP_ENV);

const sqlServerHost = requiredEnv("SQL_SERVER_HOST");
const sqlServerUser = requiredEnv("SQL_SERVER_USER");
const sqlServerPass = requiredEnv("SQL_SERVER_PASS");
const sqlServerPort = requiredEnvNumber("SQL_SERVER_PORT");
const sqlServerInstanceName = optionalEnv("SQL_SERVER_INSTANCE_NAME");

const database = isProduction ? "TopManager" : "TopTESTE";

const knexConfig: Knex.Config = {
  client: "mssql",
  connection: {
    server: sqlServerHost,
    user: sqlServerUser,
    password: sqlServerPass,
    port: sqlServerPort,
    database:database,
    options: {
      ...(sqlServerInstanceName ? { instanceName: sqlServerInstanceName } : {}),
      encrypt: true,
      trustServerCertificate: true,
    },
    connectTimeout: 10000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  },
  pool: {
    min: 0,
    max: 10,
    createTimeoutMillis: 3000,
    acquireTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
    propagateCreateError: false,
  },
};

const globalForKnex = globalThis as unknown as {
  topManager: Knex | undefined;
  topManagerKey: string | undefined;
};

const configKey = [
  sqlServerHost,
  sqlServerUser,
  sqlServerPort,
  database,
  sqlServerInstanceName ?? "",
].join(":");

export const topManager =
  globalForKnex.topManagerKey === configKey && globalForKnex.topManager
    ? globalForKnex.topManager
    : knex(knexConfig);

if (process.env.NODE_ENV !== "production") {
  globalForKnex.topManager = topManager;
  globalForKnex.topManagerKey = configKey;
}
