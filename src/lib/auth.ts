import "server-only";

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { dash } from "@better-auth/infra";
import { addDays } from "date-fns";
import { eq } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { organization as organizationPlugin } from "better-auth/plugins";

import { getAuthDb } from "@/db/client";
import * as schema from "@/db/schema";

export const FAMILY_MEMBER_LIMIT = 3;
export const PREMIUM_PRICE_CENTS = 1999;

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || process.env.APP_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(getAuthDb(), {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [organizationPlugin(), dash({ apiKey: process.env.BETTER_AUTH_API_KEY })],
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          const db = getAuthDb();
          const organizationId = crypto.randomUUID();
          const name = `${createdUser.name || "Minha"} Familia`;
          const slug = `${slugify(name)}-${organizationId.slice(0, 8)}`;
          const trialEndsAt = addDays(new Date(), 7);

          await db.insert(schema.organization).values({
            id: organizationId,
            name,
            slug,
          });
          await db.insert(schema.member).values({
            id: crypto.randomUUID(),
            organizationId,
            userId: createdUser.id,
            role: "owner",
          });
          await db.insert(schema.familyProfiles).values({
            organizationId,
            leaderUserId: createdUser.id,
            plan: "trial",
            subscriptionStatus: "trialing",
            trialEndsAt,
          });
        },
      },
    },
    session: {
      create: {
        before: async (newSession) => {
          const db = getAuthDb();
          const [firstMembership] = await db
            .select({ organizationId: schema.member.organizationId })
            .from(schema.member)
            .where(eq(schema.member.userId, newSession.userId))
            .limit(1);

          if (!firstMembership) {
            return;
          }

          return {
            data: {
              ...newSession,
              activeOrganizationId: firstMembership.organizationId,
            },
          };
        },
      },
    },
  },
});

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "familia";
}
