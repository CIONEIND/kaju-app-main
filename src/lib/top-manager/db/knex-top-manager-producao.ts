import knex, { type Knex } from "knex";

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function requiredEnvNumber(name: string): number {
  const value = Number.parseInt(requiredEnv(name), 10);

  if (Number.isNaN(value)) {
    throw new Error(`Environment variable ${name} must be a valid number.`);
  }

  return value;
}

function optionalEnv(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

const sqlServerProdHost = requiredEnv("SQL_SERVER_HOST");
const sqlServerProdUser = requiredEnv("SQL_SERVER_USER");
const sqlServerProdPass = requiredEnv("SQL_SERVER_PASS");
const sqlServerProdPort = requiredEnvNumber("SQL_SERVER_PORT");

// Optional on purpose. A named instance is resolved through the SQL Server
// Browser service (UDP 1434), which only exists on the DBA-managed server —
// tedious ignores `port` entirely once `instanceName` is set. Locally there is
// no browser service, so leaving SQL_SERVER_PROD_INSTANCE_NAME empty omits the
// key and the connection goes straight to host:port.
const sqlServerProdInstanceName = optionalEnv("SQL_SERVER_INSTANCE_NAME");

const knexConfig: Knex.Config = {
  client: "mssql",
  connection: {
    server: sqlServerProdHost,
    user: sqlServerProdUser,
    password: sqlServerProdPass,
    port: sqlServerProdPort,
    database: "TopManager",
    options: {
      ...(sqlServerProdInstanceName
        ? { instanceName: sqlServerProdInstanceName }
        : {}),
      encrypt: true,
      trustServerCertificate: true,
    },
    connectTimeout: 10000,        // fail a new connection quickly
    enableKeepAlive: true,        // mysql2: TCP keepalive on the socket
    keepAliveInitialDelay: 10000,
  },
  pool: {
    min: 0, // Keep at least 2 connections open ready to go
    max: 10, // Never open more than 10 simultaneous connections
    createTimeoutMillis: 3000,
    acquireTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
    propagateCreateError: false
  },
};

const globalForKnex = globalThis as unknown as {
  dbProducao: Knex | undefined;
  dbProducaoConfigKey: string | undefined;
  dbDesenvolvimento: Knex | undefined;
};

const dbProducaoConfigKey = [
  sqlServerProdHost,
  sqlServerProdUser,
  sqlServerProdPort,
  sqlServerProdInstanceName ?? "",
].join(":");

export const topManagerProducao =
  globalForKnex.dbProducaoConfigKey === dbProducaoConfigKey &&
  globalForKnex.dbProducao
    ? globalForKnex.dbProducao
    : knex(knexConfig);

if (process.env.NODE_ENV !== "production") {
  globalForKnex.dbProducao = topManagerProducao;
  globalForKnex.dbProducaoConfigKey = dbProducaoConfigKey;
}
