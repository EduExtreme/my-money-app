"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";

import { getDb, getTransactionDb } from "@/db/client";
import { accounts, categories, salaries, transactionGroups, transactions, invitation, member, user, session } from "@/db/schema";
import { addMonthsToDateInput, getCompetencyMonth } from "@/lib/dates";
import { requirePremiumFamily, requireFamily } from "@/lib/auth-session";
import { auth } from "@/lib/auth";
import { parseCurrencyToCents, splitIntoEqualInstallments } from "@/lib/money";
import { createTransactionRecord } from "@/lib/services/transactions";
import {
  accountFormSchema,
  categoryFormSchema,
  deleteSalaryFormSchema,
  deleteTransactionGroupFormSchema,
  salaryFormSchema,
  transactionFormSchema,
  updateSalaryFormSchema,
  updateTransactionGroupFormSchema,
} from "@/lib/validations";

export async function createAccount(formData: FormData) {
  const family = await requirePremiumFamily();
  const values = accountFormSchema.parse(Object.fromEntries(formData));
  const creditLimitCents = values.creditLimit ? parseCurrencyToCents(values.creditLimit) : null;

  await getDb().insert(accounts).values({
    organizationId: family.organizationId,
    createdByUserId: family.userId,
    name: values.name,
    type: values.type,
    institution: values.institution || null,
    color: values.color,
    creditLimitCents: Number.isFinite(creditLimitCents) ? creditLimitCents : null,
    closingDay: normalizeOptionalNumber(values.closingDay),
    dueDay: normalizeOptionalNumber(values.dueDay),
  });

  revalidatePath("/accounts");
  revalidatePath("/");
  return actionSuccess();
}

export async function createCategory(formData: FormData) {
  const family = await requirePremiumFamily();
  const values = categoryFormSchema.parse(Object.fromEntries(formData));

  await getDb().insert(categories).values({ ...values, organizationId: family.organizationId, createdByUserId: family.userId });

  revalidatePath("/categories");
  revalidatePath("/");
  return actionSuccess();
}

export async function createTransaction(formData: FormData) {
  const family = await requirePremiumFamily();
  const values = transactionFormSchema.parse(Object.fromEntries(formData));
  await assertAccountAndCategoryBelongToFamily(family.organizationId, values.accountId, values.categoryId);
  await createTransactionRecord({ ...values, organizationId: family.organizationId, createdByUserId: family.userId });

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/reports");
  return actionSuccess();
}

export async function updateTransactionGroup(formData: FormData) {
  const family = await requirePremiumFamily();
  const values = updateTransactionGroupFormSchema.parse(Object.fromEntries(formData));
  const totalAmountCents = parseCurrencyToCents(values.amount);

  if (!Number.isFinite(totalAmountCents) || totalAmountCents <= 0) {
    throw new Error("Informe um valor maior que zero.");
  }

  const installmentCount = values.type === "expense" ? values.installments : 1;
  const installmentAmountCents =
    installmentCount > 1 ? splitIntoEqualInstallments(totalAmountCents, installmentCount) : totalAmountCents;
  const db = getTransactionDb();
  await assertAccountAndCategoryBelongToFamily(family.organizationId, values.accountId, values.categoryId);
  await assertTransactionGroupBelongsToFamily(family.organizationId, values.groupId);
  await db.transaction(async (tx) => {
    const rows = buildInstallmentRows({
      groupId: values.groupId,
      organizationId: family.organizationId,
      createdByUserId: family.userId,
      accountId: values.accountId,
      categoryId: values.categoryId,
      description: values.description,
      type: values.type,
      amountCents: installmentAmountCents,
      firstDate: values.transactionDate,
      installmentCount,
      status: values.status,
      notes: values.notes || null,
    });

    await tx
      .update(transactionGroups)
      .set({
        description: values.description,
        type: values.type,
        totalAmountCents,
        installmentAmountCents,
        installmentCount,
        firstDate: values.transactionDate,
        accountId: values.accountId,
        categoryId: values.categoryId,
        notes: values.notes || null,
      })
      .where(and(eq(transactionGroups.id, values.groupId), eq(transactionGroups.organizationId, family.organizationId)));
    await tx
      .delete(transactions)
      .where(and(eq(transactions.groupId, values.groupId), eq(transactions.organizationId, family.organizationId)));
    await tx.insert(transactions).values(rows);
  });

  revalidateFinancePaths();
  return actionSuccess();
}

export async function deleteTransactionGroup(formData: FormData) {
  const family = await requirePremiumFamily();
  const values = deleteTransactionGroupFormSchema.parse(Object.fromEntries(formData));

  await getDb()
    .delete(transactionGroups)
    .where(and(eq(transactionGroups.id, values.groupId), eq(transactionGroups.organizationId, family.organizationId)));

  revalidateFinancePaths();
  return actionSuccess();
}

export async function createSalary(formData: FormData) {
  const family = await requirePremiumFamily();
  const values = salaryFormSchema.parse(Object.fromEntries(formData));
  const db = getDb();
  const activeMembers = await db
    .select({ name: user.name })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, family.organizationId));

  const memberNames = activeMembers.map((m) => m.name);
  if (!memberNames.includes(values.name)) {
    throw new Error("Você só pode adicionar salários para membros ativos da família.");
  }
  const amountCents = parseCurrencyToCents(values.amount);

  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    throw new Error("Informe um salário maior que zero.");
  }

  await assertAccountAndCategoryBelongToFamily(family.organizationId, values.accountId, values.categoryId);
  await getDb().insert(salaries).values({
    organizationId: family.organizationId,
    createdByUserId: family.userId,
    name: values.name,
    amountCents,
    paymentDay: values.paymentDay,
    startMonth: values.startMonth,
    endMonth: normalizeOptionalText(values.endMonth),
    accountId: values.accountId,
    categoryId: values.categoryId,
    status: values.status,
    notes: values.notes || null,
  });

  revalidateFinancePaths();
  revalidatePath("/family");
  return actionSuccess();
}

export async function updateSalary(formData: FormData) {
  const family = await requirePremiumFamily();
  const values = updateSalaryFormSchema.parse(Object.fromEntries(formData));
  const db = getDb();
  const activeMembers = await db
    .select({ name: user.name })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, family.organizationId));

  const memberNames = activeMembers.map((m) => m.name);
  if (!memberNames.includes(values.name)) {
    throw new Error("Você só pode adicionar salários para membros ativos da família.");
  }
  const amountCents = parseCurrencyToCents(values.amount);

  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    throw new Error("Informe um salário maior que zero.");
  }

  await assertAccountAndCategoryBelongToFamily(family.organizationId, values.accountId, values.categoryId);
  await getDb()
    .update(salaries)
    .set({
      name: values.name,
      amountCents,
      paymentDay: values.paymentDay,
      startMonth: values.startMonth,
      endMonth: normalizeOptionalText(values.endMonth),
      accountId: values.accountId,
      categoryId: values.categoryId,
      status: values.status,
      notes: values.notes || null,
    })
    .where(and(eq(salaries.id, values.salaryId), eq(salaries.organizationId, family.organizationId)));

  revalidateFinancePaths();
  revalidatePath("/family");
  return actionSuccess();
}

export async function deleteSalary(formData: FormData) {
  const family = await requirePremiumFamily();
  const values = deleteSalaryFormSchema.parse(Object.fromEntries(formData));

  await getDb().delete(salaries).where(and(eq(salaries.id, values.salaryId), eq(salaries.organizationId, family.organizationId)));

  revalidateFinancePaths();
  revalidatePath("/family");
  return actionSuccess();
}

function actionSuccess() {
  return {
    ok: true,
  } as const;
}

function normalizeOptionalNumber(value: number | "" | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeOptionalText(value: string | undefined) {
  return value && value.trim() ? value.trim() : null;
}

function buildInstallmentRows(input: {
  groupId: number;
  organizationId: string;
  createdByUserId: string;
  accountId: number;
  categoryId: number;
  description: string;
  type: "income" | "expense";
  amountCents: number;
  firstDate: string;
  installmentCount: number;
  status: "planned" | "paid";
  notes: string | null;
}) {
  return Array.from({ length: input.installmentCount }, (_, index) => {
    const transactionDate = addMonthsToDateInput(input.firstDate, index);

    return {
      organizationId: input.organizationId,
      createdByUserId: input.createdByUserId,
      groupId: input.groupId,
      accountId: input.accountId,
      categoryId: input.categoryId,
      description: input.description,
      type: input.type,
      amountCents: input.amountCents,
      transactionDate,
      competencyMonth: getCompetencyMonth(transactionDate),
      installmentNumber: index + 1,
      installmentTotal: input.installmentCount,
      status: input.status,
      notes: input.notes,
      paidAt: input.status === "paid" ? new Date() : null,
    };
  });
}

async function assertAccountAndCategoryBelongToFamily(organizationId: string, accountId: number, categoryId: number) {
  const db = getDb();
  const [account] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.id, accountId), eq(accounts.organizationId, organizationId)))
    .limit(1);
  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.organizationId, organizationId)))
    .limit(1);

  if (!account || !category) {
    throw new Error("Conta ou categoria não pertence a esta família.");
  }
}

async function assertTransactionGroupBelongsToFamily(organizationId: string, groupId: number) {
  const [group] = await getDb()
    .select({ id: transactionGroups.id })
    .from(transactionGroups)
    .where(and(eq(transactionGroups.id, groupId), eq(transactionGroups.organizationId, organizationId)))
    .limit(1);

  if (!group) {
    throw new Error("Transação não encontrada para esta família.");
  }
}

function revalidateFinancePaths() {
  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/reports");
  revalidatePath("/family");
}

export async function inviteMember(formData: FormData) {
  const family = await requirePremiumFamily();
  
  if (!family.isOwner) {
    throw new Error("Apenas o líder da família pode convidar membros.");
  }

  const email = formData.get("email") as string;
  if (!email || !email.trim() || !email.includes("@")) {
    throw new Error("Informe um e-mail válido.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  
  if (normalizedEmail === family.userEmail.toLowerCase()) {
    throw new Error("Você não pode convidar a si mesmo.");
  }

  const db = getDb();

  // 1. Check if the user is already a member
  const [existingUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, normalizedEmail))
    .limit(1);

  if (existingUser) {
    const [existingMember] = await db
      .select()
      .from(member)
      .where(and(eq(member.organizationId, family.organizationId), eq(member.userId, existingUser.id)))
      .limit(1);

    if (existingMember) {
      throw new Error("Este usuário já é membro desta família.");
    }
  }

  // 2. Count active members and pending invitations
  const activeMembers = await db
    .select()
    .from(member)
    .where(eq(member.organizationId, family.organizationId));

  const pendingInvitations = await db
    .select()
    .from(invitation)
    .where(and(eq(invitation.organizationId, family.organizationId), eq(invitation.status, "pending")));

  if (activeMembers.length + pendingInvitations.length >= 3) {
    throw new Error("Você atingiu o limite de membros na família (máximo 3 pessoas, incluindo o líder).");
  }

  // 3. Check if there's already a pending invitation for this email
  const [existingInvite] = await db
    .select()
    .from(invitation)
    .where(and(eq(invitation.organizationId, family.organizationId), eq(invitation.email, normalizedEmail), eq(invitation.status, "pending")))
    .limit(1);

  if (existingInvite) {
    throw new Error("Já existe um convite pendente para este e-mail.");
  }

  // 4. Create the invitation
  const inviteId = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await db.insert(invitation).values({
    id: inviteId,
    organizationId: family.organizationId,
    email: normalizedEmail,
    role: "member",
    status: "pending",
    expiresAt,
    inviterId: family.userId,
  });

  revalidatePath("/family");
  return actionSuccess();
}

export async function cancelInvitation(formData: FormData) {
  const family = await requirePremiumFamily();

  if (!family.isOwner) {
    throw new Error("Apenas o líder da família pode cancelar convites.");
  }

  const invitationId = formData.get("invitationId") as string;
  if (!invitationId) {
    throw new Error("ID do convite inválido.");
  }

  await getDb()
    .delete(invitation)
    .where(and(eq(invitation.id, invitationId), eq(invitation.organizationId, family.organizationId)));

  revalidatePath("/family");
  return actionSuccess();
}

export async function acceptInvitation(formData: FormData) {
  const currentSession = await auth.api.getSession({ headers: await headers() });
  if (!currentSession?.user) {
    throw new Error("Não autorizado.");
  }

  const invitationId = formData.get("invitationId") as string;
  if (!invitationId) {
    throw new Error("ID do convite inválido.");
  }

  const db = getDb();

  // 1. Fetch the invitation
  const [invite] = await db
    .select()
    .from(invitation)
    .where(eq(invitation.id, invitationId))
    .limit(1);

  if (!invite) {
    throw new Error("Convite não encontrado.");
  }

  if (invite.status !== "pending") {
    throw new Error("Este convite já foi aceito ou expirou.");
  }

  if (invite.expiresAt < new Date()) {
    throw new Error("Este convite expirou.");
  }

  if (invite.email.toLowerCase() !== currentSession.user.email.toLowerCase()) {
    throw new Error("Este convite não foi enviado para o seu e-mail.");
  }

  // 2. Validate member limit of target organization (active + pending)
  const activeMembers = await db
    .select()
    .from(member)
    .where(eq(member.organizationId, invite.organizationId));

  if (activeMembers.length >= 3) {
    throw new Error("A família de destino já atingiu o limite de membros.");
  }

  // 3. Add user as member
  await db.insert(member).values({
    id: crypto.randomUUID(),
    organizationId: invite.organizationId,
    userId: currentSession.user.id,
    role: invite.role || "member",
  });

  // 4. Delete or mark as accepted
  await db
    .delete(invitation)
    .where(eq(invitation.id, invitationId));

  // 5. Update session active organization
  await db
    .update(session)
    .set({ activeOrganizationId: invite.organizationId })
    .where(eq(session.userId, currentSession.user.id));

  revalidatePath("/");
  revalidatePath("/family");
  return actionSuccess();
}

export async function rejectInvitation(formData: FormData) {
  const currentSession = await auth.api.getSession({ headers: await headers() });
  if (!currentSession?.user) {
    throw new Error("Não autorizado.");
  }

  const invitationId = formData.get("invitationId") as string;
  if (!invitationId) {
    throw new Error("ID do convite inválido.");
  }

  const db = getDb();

  // 1. Fetch the invitation
  const [invite] = await db
    .select()
    .from(invitation)
    .where(eq(invitation.id, invitationId))
    .limit(1);

  if (!invite) {
    throw new Error("Convite não encontrado.");
  }

  if (invite.email.toLowerCase() !== currentSession.user.email.toLowerCase()) {
    throw new Error("Este convite não foi enviado para o seu e-mail.");
  }

  // 2. Delete invitation
  await db
    .delete(invitation)
    .where(eq(invitation.id, invitationId));

  revalidatePath("/family");
  return actionSuccess();
}
