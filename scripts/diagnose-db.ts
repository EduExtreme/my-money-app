import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set in environment!");
    return;
  }

  const sql = neon(databaseUrl);
  const db = drizzleHttp(sql, { schema });

  console.log("--- USERS ---");
  const users = await db.select().from(schema.user).limit(10);
  console.log(JSON.stringify(users, null, 2));

  console.log("--- MEMBERS ---");
  const members = await db.select().from(schema.member).limit(10);
  console.log(JSON.stringify(members, null, 2));

  console.log("--- ORGANIZATIONS ---");
  const orgs = await db.select().from(schema.organization).limit(10);
  console.log(JSON.stringify(orgs, null, 2));

  console.log("--- FAMILY PROFILES ---");
  const profiles = await db.select().from(schema.familyProfiles).limit(10);
  console.log(JSON.stringify(profiles, null, 2));
}

main().catch(console.error);
