import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { addDays } from "date-fns";

import { getAuthDb } from "@/db/client";
import { familyProfiles, member, organization } from "@/db/schema";
import { auth } from "@/lib/auth";

export type CurrentFamily = {
  userId: string;
  userName: string;
  userEmail: string;
  organizationId: string;
  organizationName: string;
  role: string;
  isOwner: boolean;
  subscriptionStatus: string;
  trialEndsAt: Date;
  hasPremiumAccess: boolean;
};

export async function getCurrentFamily(): Promise<CurrentFamily | null> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return null;
  }

  const db = getAuthDb();
  const activeOrganizationId = session.session.activeOrganizationId;
  let rows = await db
    .select({
      organizationId: member.organizationId,
      organizationName: organization.name,
      role: member.role,
      subscriptionStatus: familyProfiles.subscriptionStatus,
      trialEndsAt: familyProfiles.trialEndsAt,
    })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .leftJoin(familyProfiles, eq(member.organizationId, familyProfiles.organizationId))
    .where(
      activeOrganizationId
        ? and(eq(member.userId, session.user.id), eq(member.organizationId, activeOrganizationId))
        : eq(member.userId, session.user.id),
    )
    .limit(1);
  
  let family = rows[0];

  // Self-healing: if the user doesn't have any organization or membership, create one!
  if (!family) {
    const organizationId = crypto.randomUUID();
    const name = `${session.user.name || "Minha"} Familia`;
    const slug = `${slugify(name)}-${organizationId.slice(0, 8)}`;
    const trialEndsAt = addDays(new Date(), 7);

    await db.insert(organization).values({
      id: organizationId,
      name,
      slug,
    });
    await db.insert(member).values({
      id: crypto.randomUUID(),
      organizationId,
      userId: session.user.id,
      role: "owner",
    });
    await db.insert(familyProfiles).values({
      organizationId,
      leaderUserId: session.user.id,
      plan: "trial",
      subscriptionStatus: "trialing",
      trialEndsAt,
    });

    // Re-query to get the fresh organization & family information
    rows = await db
      .select({
        organizationId: member.organizationId,
        organizationName: organization.name,
        role: member.role,
        subscriptionStatus: familyProfiles.subscriptionStatus,
        trialEndsAt: familyProfiles.trialEndsAt,
      })
      .from(member)
      .innerJoin(organization, eq(member.organizationId, organization.id))
      .leftJoin(familyProfiles, eq(member.organizationId, familyProfiles.organizationId))
      .where(eq(member.userId, session.user.id))
      .limit(1);
    
    family = rows[0];
    if (!family) {
      return null;
    }
  }

  // Self-healing: if the family profile is missing in the database, insert a default one!
  if (!family.subscriptionStatus) {
    const trialEndsAt = addDays(new Date(), 7);
    await db.insert(familyProfiles).values({
      organizationId: family.organizationId,
      leaderUserId: session.user.id,
      plan: "trial",
      subscriptionStatus: "trialing",
      trialEndsAt,
    });
    family.subscriptionStatus = "trialing";
    family.trialEndsAt = trialEndsAt;
  }

  const hasPremiumAccess = family.subscriptionStatus === "active" || (family.trialEndsAt ? family.trialEndsAt > new Date() : false);

  return {
    userId: session.user.id,
    userName: session.user.name,
    userEmail: session.user.email,
    organizationId: family.organizationId,
    organizationName: family.organizationName,
    role: family.role,
    isOwner: family.role === "owner",
    subscriptionStatus: family.subscriptionStatus!,
    trialEndsAt: family.trialEndsAt!,
    hasPremiumAccess,
  };
}

export async function requireFamily() {
  const family = await getCurrentFamily();

  if (!family) {
    redirect("/login");
  }

  return family;
}

export async function requirePremiumFamily() {
  const family = await requireFamily();

  if (!family.hasPremiumAccess) {
    redirect("/family?upgrade=1");
  }

  return family;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "familia";
}
