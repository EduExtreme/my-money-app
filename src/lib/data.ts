import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";

import { getDb, isDatabaseConfigured } from "@/db/client";
import { accounts, categories, salaries, transactionGroups, transactions } from "@/db/schema";
import type { FinanceData, SalaryWithMeta, TransactionWithMeta } from "@/lib/finance-types";
import { demoAccounts, demoCategories, demoSalaries, demoTransactions } from "./demo-data";
import { getCurrentMonth, getCurrentYear, getShortMonthLabel, getYearMonths } from "./dates";

export async function getFinanceData(month = getCurrentMonth(), year = getCurrentYear(), organizationId?: string): Promise<FinanceData> {
  try {
    if (!isDatabaseConfigured) {
      return buildFinanceData({
        month,
        year,
        accountsData: demoAccounts,
        categoriesData: demoCategories,
        transactionsData: demoTransactions.map((transaction) => enrichDemoTransaction(transaction)),
        salariesData: demoSalaries.map((salary) => enrichDemoSalary(salary)),
        mode: "demo" as const,
        databaseMessage: "Configure DATABASE_URL para conectar ao NeonDB. Exibindo dados de exemplo.",
      });
    }

    const db = getDb();
    if (!organizationId) {
      throw new Error("Família não identificada para carregar os dados financeiros.");
    }

    const [accountsData, categoriesData, transactionsData, salariesData] = await Promise.all([
      db.select().from(accounts).where(eq(accounts.organizationId, organizationId)).orderBy(desc(accounts.createdAt)),
      db.select().from(categories).where(eq(categories.organizationId, organizationId)).orderBy(desc(categories.createdAt)),
      db
        .select({
          id: transactions.id,
          groupId: transactions.groupId,
          accountId: transactions.accountId,
          categoryId: transactions.categoryId,
          description: transactions.description,
          type: transactions.type,
          amountCents: transactions.amountCents,
          transactionDate: transactions.transactionDate,
          competencyMonth: transactions.competencyMonth,
          installmentNumber: transactions.installmentNumber,
          installmentTotal: transactions.installmentTotal,
          status: transactions.status,
          notes: transactions.notes,
          groupTotalAmountCents: transactionGroups.totalAmountCents,
          groupInstallmentCount: transactionGroups.installmentCount,
          groupFirstDate: transactionGroups.firstDate,
          groupNotes: transactionGroups.notes,
          accountName: accounts.name,
          accountType: accounts.type,
          accountColor: accounts.color,
          categoryName: categories.name,
          categoryColor: categories.color,
        })
        .from(transactions)
        .innerJoin(transactionGroups, eq(transactions.groupId, transactionGroups.id))
        .innerJoin(accounts, eq(transactions.accountId, accounts.id))
        .innerJoin(categories, eq(transactions.categoryId, categories.id))
        .where(eq(transactions.organizationId, organizationId))
        .orderBy(desc(transactions.transactionDate), desc(transactions.id)),
      db
        .select({
          id: salaries.id,
          name: salaries.name,
          amountCents: salaries.amountCents,
          paymentDay: salaries.paymentDay,
          startMonth: salaries.startMonth,
          endMonth: salaries.endMonth,
          accountId: salaries.accountId,
          categoryId: salaries.categoryId,
          status: salaries.status,
          notes: salaries.notes,
          accountName: accounts.name,
          accountType: accounts.type,
          categoryName: categories.name,
          categoryColor: categories.color,
        })
        .from(salaries)
        .innerJoin(accounts, eq(salaries.accountId, accounts.id))
        .innerJoin(categories, eq(salaries.categoryId, categories.id))
        .where(eq(salaries.organizationId, organizationId))
        .orderBy(desc(salaries.createdAt), desc(salaries.id)),
    ]);

    return buildFinanceData({
      month,
      year,
      accountsData,
      categoriesData,
      transactionsData,
      salariesData,
      mode: "database" as const,
      databaseMessage: null,
    });
  } catch (error) {
    return buildFinanceData({
      month,
      year,
      accountsData: demoAccounts,
      categoriesData: demoCategories,
      transactionsData: demoTransactions.map((transaction) => enrichDemoTransaction(transaction)),
      salariesData: demoSalaries.map((salary) => enrichDemoSalary(salary)),
      mode: "error" as const,
      databaseMessage:
        error instanceof Error
          ? `Não foi possível ler o NeonDB: ${error.message}`
          : "Não foi possível ler o NeonDB.",
    });
  }
}

export async function getBasicFormData(organizationId?: string) {
  const data = await getFinanceData(undefined, undefined, organizationId);

  return {
    accounts: data.accounts,
    categories: data.categories,
    salaries: data.salaries,
    mode: data.mode,
    databaseMessage: data.databaseMessage,
  };
}

export async function getMonthlyTransactionCount(month: string, organizationId?: string) {
  if (!isDatabaseConfigured) {
    return demoTransactions.filter((transaction) => transaction.competencyMonth === month).length;
  }

  const db = getDb();
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transactions)
    .where(
      organizationId
        ? and(eq(transactions.competencyMonth, month), eq(transactions.organizationId, organizationId))
        : eq(transactions.competencyMonth, month),
    );

  return result?.count ?? 0;
}

function buildFinanceData(input: {
  month: string;
  year: number;
  accountsData: typeof demoAccounts;
  categoriesData: typeof demoCategories;
  transactionsData: TransactionWithMeta[];
  salariesData: SalaryWithMeta[];
  mode: "database" | "demo" | "error";
  databaseMessage: string | null;
}) {
  const activeTransactions = input.transactionsData.filter((transaction) => transaction.status !== "cancelled");
  const monthlyTransactions = activeTransactions.filter(
    (transaction) => transaction.competencyMonth === input.month,
  );
  const annualTransactions = activeTransactions.filter((transaction) =>
    transaction.competencyMonth.startsWith(String(input.year)),
  );
  const monthlySalaries = getActiveSalariesForMonth(input.salariesData, input.month);
  const yearMonths = getYearMonths(input.year);
  const monthlyTransactionIncome = sumByType(monthlyTransactions, "income");
  const monthlySalaryIncome = sumSalaries(monthlySalaries);
  const monthlyIncome = monthlyTransactionIncome + monthlySalaryIncome;
  const monthlyExpense = sumByType(monthlyTransactions, "expense");
  const annualTransactionIncome = sumByType(annualTransactions, "income");
  const annualSalaryIncome = yearMonths.reduce(
    (total, yearMonth) => total + sumSalaries(getActiveSalariesForMonth(input.salariesData, yearMonth)),
    0,
  );
  const annualIncome = annualTransactionIncome + annualSalaryIncome;
  const annualExpense = sumByType(annualTransactions, "expense");
  const futureDebt = activeTransactions
    .filter((transaction) => transaction.type === "expense" && transaction.competencyMonth > input.month)
    .reduce((total, transaction) => total + transaction.amountCents, 0);
  const creditCardExpense = monthlyTransactions
    .filter((transaction) => transaction.type === "expense" && transaction.accountType === "credit_card")
    .reduce((total, transaction) => total + transaction.amountCents, 0);
  const monthlySavingsRate = monthlyIncome > 0 ? (monthlyIncome - monthlyExpense) / monthlyIncome : 0;

  const annualTrend = yearMonths.map((yearMonth) => {
    const items = activeTransactions.filter((transaction) => transaction.competencyMonth === yearMonth);
    const income = sumByType(items, "income") + sumSalaries(getActiveSalariesForMonth(input.salariesData, yearMonth));
    const expense = sumByType(items, "expense");

    return {
      month: getShortMonthLabel(yearMonth),
      monthKey: yearMonth,
      income,
      expense,
      balance: income - expense,
    };
  });

  const bestMonth = annualTrend.reduce((best, item) => (item.balance > best.balance ? item : best), annualTrend[0]);
  const worstMonth = annualTrend.reduce((worst, item) => (item.balance < worst.balance ? item : worst), annualTrend[0]);

  return {
    mode: input.mode,
    databaseMessage: input.databaseMessage,
    selectedMonth: input.month,
    selectedYear: input.year,
    accounts: input.accountsData,
    categories: input.categoriesData,
    salaries: input.salariesData,
    monthlySalaries,
    transactions: input.transactionsData,
    monthlyTransactions,
    annualTransactions,
    futureTransactions: activeTransactions
      .filter((transaction) => transaction.type === "expense" && transaction.competencyMonth > input.month)
      .sort((a, b) => a.transactionDate.localeCompare(b.transactionDate)),
    metrics: {
      monthlyIncome,
      monthlyTransactionIncome,
      monthlySalaryIncome,
      monthlyExpense,
      monthlyBalance: monthlyIncome - monthlyExpense,
      monthlySavingsRate,
      annualIncome,
      annualTransactionIncome,
      annualSalaryIncome,
      annualExpense,
      annualBalance: annualIncome - annualExpense,
      averageMonthlyExpense: annualExpense / 12,
      futureDebt,
      creditCardExpense,
      bestMonth,
      worstMonth,
    },
    breakdowns: {
      byCategory: groupSum(monthlyTransactions.filter((transaction) => transaction.type === "expense"), "categoryName"),
      byAccount: groupSum(monthlyTransactions.filter((transaction) => transaction.type === "expense"), "accountName"),
      annualByCategory: groupSum(
        annualTransactions.filter((transaction) => transaction.type === "expense"),
        "categoryName",
      ),
    },
    annualTrend,
  };
}

function enrichDemoTransaction(transaction: (typeof demoTransactions)[number]): TransactionWithMeta {
  const account = demoAccounts.find((item) => item.id === transaction.accountId);
  const category = demoCategories.find((item) => item.id === transaction.categoryId);

  return {
    ...transaction,
    groupTotalAmountCents: transaction.amountCents * transaction.installmentTotal,
    groupInstallmentCount: transaction.installmentTotal,
    groupFirstDate: transaction.transactionDate,
    groupNotes: null,
    accountName: account?.name ?? "Conta de Exemplo",
    accountType: account?.type ?? "pix",
    accountColor: account?.color ?? "#10b981",
    categoryName: category?.name ?? "Categoria de Exemplo",
    categoryColor: category?.color ?? "#10b981",
  };
}

function enrichDemoSalary(salary: (typeof demoSalaries)[number]): SalaryWithMeta {
  const account = demoAccounts.find((item) => item.id === salary.accountId);
  const category = demoCategories.find((item) => item.id === salary.categoryId);

  return {
    ...salary,
    accountName: account?.name ?? "Conta de Exemplo",
    accountType: account?.type ?? "pix",
    categoryName: category?.name ?? "Categoria de Exemplo",
    categoryColor: category?.color ?? "#10b981",
  };
}

function sumSalaries(items: SalaryWithMeta[]) {
  return items.reduce((total, salary) => total + salary.amountCents, 0);
}

function getActiveSalariesForMonth(items: SalaryWithMeta[], month: string) {
  return items.filter((salary) => {
    if (salary.status !== "active") {
      return false;
    }

    const started = salary.startMonth <= month;
    const notEnded = !salary.endMonth || salary.endMonth >= month;

    return started && notEnded;
  });
}

function sumByType(items: TransactionWithMeta[], type: "income" | "expense") {
  return items
    .filter((item) => item.type === type)
    .reduce((total, item) => total + item.amountCents, 0);
}

function groupSum(items: TransactionWithMeta[], key: "categoryName" | "accountName") {
  const map = new Map<string, number>();

  for (const item of items) {
    map.set(item[key], (map.get(item[key]) ?? 0) + item.amountCents);
  }

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}
