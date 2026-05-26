"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { getDb, getTransactionDb } from "@/db/client";
import { accounts, categories, salaries, transactionGroups, transactions } from "@/db/schema";
import { addMonthsToDateInput, getCompetencyMonth } from "@/lib/dates";
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
  const values = accountFormSchema.parse(Object.fromEntries(formData));
  const creditLimitCents = values.creditLimit ? parseCurrencyToCents(values.creditLimit) : null;

  await getDb().insert(accounts).values({
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
  const values = categoryFormSchema.parse(Object.fromEntries(formData));

  await getDb().insert(categories).values(values);

  revalidatePath("/categories");
  revalidatePath("/");
  return actionSuccess();
}

export async function createTransaction(formData: FormData) {
  const values = transactionFormSchema.parse(Object.fromEntries(formData));
  await createTransactionRecord(values);

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/reports");
  return actionSuccess();
}

export async function updateTransactionGroup(formData: FormData) {
  const values = updateTransactionGroupFormSchema.parse(Object.fromEntries(formData));
  const totalAmountCents = parseCurrencyToCents(values.amount);

  if (!Number.isFinite(totalAmountCents) || totalAmountCents <= 0) {
    throw new Error("Informe um valor maior que zero.");
  }

  const installmentCount = values.type === "expense" ? values.installments : 1;
  const installmentAmountCents =
    installmentCount > 1 ? splitIntoEqualInstallments(totalAmountCents, installmentCount) : totalAmountCents;
  const db = getTransactionDb();
  await db.transaction(async (tx) => {
    const rows = buildInstallmentRows({
      groupId: values.groupId,
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
      .where(eq(transactionGroups.id, values.groupId));
    await tx.delete(transactions).where(eq(transactions.groupId, values.groupId));
    await tx.insert(transactions).values(rows);
  });

  revalidateFinancePaths();
  return actionSuccess();
}

export async function deleteTransactionGroup(formData: FormData) {
  const values = deleteTransactionGroupFormSchema.parse(Object.fromEntries(formData));

  await getDb().delete(transactionGroups).where(eq(transactionGroups.id, values.groupId));

  revalidateFinancePaths();
  return actionSuccess();
}

export async function createSalary(formData: FormData) {
  const values = salaryFormSchema.parse(Object.fromEntries(formData));
  const amountCents = parseCurrencyToCents(values.amount);

  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    throw new Error("Informe um salario maior que zero.");
  }

  await getDb().insert(salaries).values({
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
  revalidatePath("/salaries");
  return actionSuccess();
}

export async function updateSalary(formData: FormData) {
  const values = updateSalaryFormSchema.parse(Object.fromEntries(formData));
  const amountCents = parseCurrencyToCents(values.amount);

  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    throw new Error("Informe um salario maior que zero.");
  }

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
    .where(eq(salaries.id, values.salaryId));

  revalidateFinancePaths();
  revalidatePath("/salaries");
  return actionSuccess();
}

export async function deleteSalary(formData: FormData) {
  const values = deleteSalaryFormSchema.parse(Object.fromEntries(formData));

  await getDb().delete(salaries).where(eq(salaries.id, values.salaryId));

  revalidateFinancePaths();
  revalidatePath("/salaries");
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

function revalidateFinancePaths() {
  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/reports");
  revalidatePath("/salaries");
}
