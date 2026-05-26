import "server-only";

import { getTransactionDb } from "@/db/client";
import { transactionGroups, transactions } from "@/db/schema";
import { addMonthsToDateInput, getCompetencyMonth } from "@/lib/dates";
import { parseCurrencyToCents, splitIntoEqualInstallments } from "@/lib/money";

export type CreateTransactionInput = {
  description: string;
  type: "income" | "expense";
  amount: string;
  transactionDate: string;
  accountId: number;
  categoryId: number;
  installments: number;
  status: "planned" | "paid";
  notes?: string;
};

export async function createTransactionRecord(values: CreateTransactionInput) {
  const totalAmountCents = parseCurrencyToCents(values.amount);

  if (!Number.isFinite(totalAmountCents) || totalAmountCents <= 0) {
    throw new Error("Informe um valor maior que zero.");
  }

  const installmentCount = values.type === "expense" ? values.installments : 1;
  const installmentAmountCents =
    installmentCount > 1 ? splitIntoEqualInstallments(totalAmountCents, installmentCount) : totalAmountCents;
  const db = getTransactionDb();

  await db.transaction(async (tx) => {
    const [group] = await tx
      .insert(transactionGroups)
      .values({
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
      .returning({ id: transactionGroups.id });

    const rows = buildInstallmentRows({
      groupId: group.id,
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

    await tx.insert(transactions).values(rows);
  });
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
