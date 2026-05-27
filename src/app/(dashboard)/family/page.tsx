import { eq, and } from "drizzle-orm";
import { connection } from "next/server";

import { getAuthDb } from "@/db/client";
import { member, user, invitation } from "@/db/schema";
import { requireFamily } from "@/lib/auth-session";
import { getCurrentMonth } from "@/lib/dates";
import { getFinanceData } from "@/lib/data";
import { serializeForClient } from "@/lib/finance-serialization";
import { getSearchParam, type SearchParams } from "@/lib/search-params";
import { FamilyPageClient } from "@/components/family-page-client";

export default async function FamilyPage({ searchParams }: { searchParams: SearchParams }) {
  await connection();

  const params = await searchParams;
  const selectedMonth = getSearchParam(params.month) ?? getCurrentMonth();
  const family = await requireFamily();

  // Fetch all family members
  const members = await getAuthDb()
    .select({
      id: member.id,
      role: member.role,
      createdAt: member.createdAt,
      name: user.name,
      email: user.email,
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, family.organizationId));

  // Fetch sent invitations for the active organization
  const sentInvitations = await getAuthDb()
    .select({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    })
    .from(invitation)
    .where(eq(invitation.organizationId, family.organizationId));

  // Fetch received invitations for the current user's email
  const receivedInvitations = await getAuthDb()
    .select({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      inviterName: user.name,
    })
    .from(invitation)
    .innerJoin(user, eq(invitation.inviterId, user.id))
    .where(and(eq(invitation.email, family.userEmail.toLowerCase()), eq(invitation.status, "pending")));

  // Fetch all monthly finance and salary data for the active organization
  const financeData = serializeForClient(
    await getFinanceData(selectedMonth, Number(selectedMonth.slice(0, 4)), family.organizationId)
  );

  return (
    <FamilyPageClient
      initialData={financeData}
      initialMonth={selectedMonth}
      family={family}
      members={members}
      sentInvitations={sentInvitations}
      receivedInvitations={receivedInvitations}
    />
  );
}
