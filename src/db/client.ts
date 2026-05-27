import "server-only";

import { neon, neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleServerless } from "drizzle-orm/neon-serverless";
import ws from "ws";

import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
let transactionPool: Pool | null = null;

neonConfig.webSocketConstructor = ws;

export const isDatabaseConfigured = Boolean(databaseUrl);

export function getDb() {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL não configurada. Crie .env.local com a URL do NeonDB.");
  }

  const sql = neon(databaseUrl);
  return drizzleHttp(sql, { schema });
}

export function getAuthDb() {
  return getDb();
}

export function getTransactionDb() {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL não configurada. Crie .env.local com a URL do NeonDB.");
  }

  transactionPool ??= new Pool({ connectionString: databaseUrl });
  return drizzleServerless(transactionPool, { schema });
}
