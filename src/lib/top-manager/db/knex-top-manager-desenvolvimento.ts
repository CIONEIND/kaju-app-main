import knex, { Knex } from 'knex';




const knexConfig: Knex.Config = {
  client: 'mssql',
  connection: {
    server: process.env.SQL_SERVER_PROD_HOST,     
    user: process.env.SQL_SERVER_PROD_USER,    
    password: process.env.SQL_SERVER_PROD_PASS,
    port: parseInt(process.env.SQL_SERVER_PROD_PORT!),
    database: "TopTESTE",
    options: {
      // instanceName: process.env.SQL_SERVER_DEV_INSTANCE_NAME!,
      encrypt: true,
      trustServerCertificate: true 
    },
    connectTimeout: 10000,        // fail a new connection quickly
    enableKeepAlive: true,        // mysql2: TCP keepalive on the socket
    keepAliveInitialDelay: 10000,
  },
  pool: {
    min: 0,  // Keep at least 2 connections open ready to go
    max: 10, // Never open more than 10 simultaneous connections
    createTimeoutMillis: 3000,
    acquireTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
  }
};

const globalForKnex = globalThis as unknown as {
  dbProducao: Knex | undefined;
  dbDesenvolvimento: Knex | undefined;
};

export const topManagerDesenvolvimento = globalForKnex.dbDesenvolvimento ?? knex(knexConfig);

if (process.env.NODE_ENV !== 'production') {
  globalForKnex.dbDesenvolvimento = topManagerDesenvolvimento;
}
