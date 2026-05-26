import type { Account, Category, Salary, Transaction } from "@/db/schema";

import { addMonthsToDateInput, getCompetencyMonth, getCurrentDateInput } from "./dates";

const today = getCurrentDateInput();
const currentMonth = getCompetencyMonth(today);

export const demoAccounts: Account[] = [
  {
    id: 1,
    name: "Cartao Neon",
    type: "credit_card",
    institution: "Banco Principal",
    color: "#39ff14",
    creditLimitCents: 500000,
    closingDay: 25,
    dueDay: 5,
    createdAt: new Date(),
  },
  {
    id: 2,
    name: "Pix Principal",
    type: "pix",
    institution: "Conta Corrente",
    color: "#00d4ff",
    creditLimitCents: null,
    closingDay: null,
    dueDay: null,
    createdAt: new Date(),
  },
  {
    id: 3,
    name: "Debito",
    type: "debit_card",
    institution: "Conta Corrente",
    color: "#a855f7",
    creditLimitCents: null,
    closingDay: null,
    dueDay: null,
    createdAt: new Date(),
  },
];

export const demoCategories: Category[] = [
  { id: 1, name: "Salario", type: "income", color: "#39ff14", createdAt: new Date() },
  { id: 2, name: "Freelance", type: "income", color: "#22c55e", createdAt: new Date() },
  { id: 3, name: "Mercado", type: "expense", color: "#ff3b30", createdAt: new Date() },
  { id: 4, name: "Transporte", type: "expense", color: "#fb7185", createdAt: new Date() },
  { id: 5, name: "Moradia", type: "expense", color: "#f97316", createdAt: new Date() },
  { id: 6, name: "Eletronicos", type: "expense", color: "#ef4444", createdAt: new Date() },
];

export const demoTransactions: Transaction[] = [
  createDemoTransaction(1, 1, 2, 1, "Salario mensal", "income", 850000, today, 1, 1, "paid"),
  createDemoTransaction(2, 2, 1, 3, "Notebook", "expense", 33333, today, 1, 6, "planned"),
  createDemoTransaction(3, 2, 1, 3, "Notebook", "expense", 33333, addMonthsToDateInput(today, 1), 2, 6, "planned"),
  createDemoTransaction(4, 2, 1, 3, "Notebook", "expense", 33333, addMonthsToDateInput(today, 2), 3, 6, "planned"),
  createDemoTransaction(5, 2, 1, 3, "Notebook", "expense", 33333, addMonthsToDateInput(today, 3), 4, 6, "planned"),
  createDemoTransaction(6, 2, 1, 3, "Notebook", "expense", 33333, addMonthsToDateInput(today, 4), 5, 6, "planned"),
  createDemoTransaction(7, 2, 1, 3, "Notebook", "expense", 33333, addMonthsToDateInput(today, 5), 6, 6, "planned"),
  createDemoTransaction(8, 3, 2, 4, "Uber e metro", "expense", 64000, today, 1, 1, "paid"),
  createDemoTransaction(9, 4, 3, 5, "Aluguel", "expense", 220000, today, 1, 1, "paid"),
];

export const demoSalaries: Salary[] = [
  {
    id: 1,
    name: "Salario principal",
    amountCents: 620000,
    paymentDay: 5,
    startMonth: currentMonth,
    endMonth: null,
    accountId: 2,
    categoryId: 1,
    status: "active",
    notes: null,
    createdAt: new Date(),
  },
];

function createDemoTransaction(
  id: number,
  groupId: number,
  accountId: number,
  categoryId: number,
  description: string,
  type: "income" | "expense",
  amountCents: number,
  transactionDate: string,
  installmentNumber: number,
  installmentTotal: number,
  status: "planned" | "paid",
): Transaction {
  return {
    id,
    groupId,
    accountId,
    categoryId,
    description,
    type,
    amountCents,
    transactionDate,
    competencyMonth: getCompetencyMonth(transactionDate),
    installmentNumber,
    installmentTotal,
    status,
    notes: null,
    paidAt: status === "paid" ? new Date() : null,
    createdAt: new Date(),
  };
}

export { currentMonth as demoCurrentMonth };
