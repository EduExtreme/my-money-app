import { config } from "dotenv";

import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import { accounts, categories } from "./schema";

config({ path: ".env.local" });
config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL nao configurada.");
}

const db = drizzle(neon(databaseUrl));

async function main() {
  const [{ count: accountCount }] = await db.select({ count: sql<number>`count(*)::int` }).from(accounts);
  const [{ count: categoryCount }] = await db.select({ count: sql<number>`count(*)::int` }).from(categories);

  if (accountCount === 0) {
    await db.insert(accounts).values([
      {
        name: "Cartao Neon",
        type: "credit_card",
        institution: "Banco Principal",
        color: "#39ff14",
        creditLimitCents: 500000,
        closingDay: 25,
        dueDay: 5,
      },
      {
        name: "Pix Principal",
        type: "pix",
        institution: "Conta Corrente",
        color: "#00d4ff",
      },
      {
        name: "Debito",
        type: "debit_card",
        institution: "Conta Corrente",
        color: "#a855f7",
      },
    ]);
  }

  if (categoryCount === 0) {
    await db.insert(categories).values([
      { name: "Salario", type: "income", color: "#39ff14" },
      { name: "Freelance", type: "income", color: "#22c55e" },
      { name: "Mercado", type: "expense", color: "#ff3b30" },
      { name: "Transporte", type: "expense", color: "#fb7185" },
      { name: "Moradia", type: "expense", color: "#f97316" },
      { name: "Assinaturas", type: "expense", color: "#ef4444" },
    ]);
  }

  console.log("Seed concluido.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
