"use client";

import { parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";

import { NewTransactionDialog } from "@/components/new-transaction-dialog";
import { TransactionsFilters } from "@/components/query-filters";
import { TransactionTable } from "@/components/transaction-table";
import { DatabaseBanner, MetricCard, SectionHeader } from "@/components/ui";
import { getCurrentMonth, getMonthLabel } from "@/lib/dates";
import { useFinanceDataQuery } from "@/lib/finance-query";
import type { FinanceData } from "@/lib/finance-types";

export function TransactionsPageClient({
  initialData,
  initialMonth,
  initialType,
}: {
  initialData: FinanceData;
  initialMonth: string;
  initialType: "all" | "income" | "expense";
}) {
  const [filters] = useQueryStates({
    month: parseAsString.withDefault(initialMonth),
    type: parseAsStringEnum(["all", "income", "expense"] as const).withDefault(initialType),
  });
  const selectedMonth = filters.month || getCurrentMonth();
  const query = useFinanceDataQuery({
    input: { month: selectedMonth, year: Number(selectedMonth.slice(0, 4)) },
    initialInput: { month: initialMonth, year: Number(initialMonth.slice(0, 4)) },
    initialData,
  });
  const data = query.data ?? initialData;
  const actionOptions = {
    accounts: data.accounts.map((account) => ({ id: account.id, name: account.name, type: account.type })),
    categories: data.categories.map((category) => ({ id: category.id, name: category.name, type: category.type })),
    canMutate: data.mode === "database",
  };
  const transactions = data.transactions.filter((transaction) => {
    const isMonth = transaction.competencyMonth === selectedMonth;
    const isType = filters.type === "all" || transaction.type === filters.type;

    return isMonth && isType;
  });

  return (
    <div>
      <DatabaseBanner message={data.databaseMessage} mode={data.mode} />
      <SectionHeader eyebrow="ledger" title="Transações">
        <NewTransactionDialog className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#10b981] px-4 py-2.5 text-sm font-bold text-[#041006] transition hover:bg-[#059669]" />
      </SectionHeader>

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <MetricCard title="Entradas" value={data.metrics.monthlyIncome} caption={`Salários + transações em ${getMonthLabel(selectedMonth)}`} />
        <MetricCard title="Saídas" value={data.metrics.monthlyExpense} tone="red" caption="Total do filtro mensal" />
        <MetricCard title="Saldo" value={data.metrics.monthlyBalance} tone={data.metrics.monthlyBalance >= 0 ? "green" : "red"} caption="Resultado do mês" />
      </section>

      <section className="glass-panel rounded-[1.7rem] p-5">
        <TransactionsFilters month={selectedMonth} type={filters.type} />
        <TransactionTable actionOptions={actionOptions} transactions={transactions} />
      </section>
    </div>
  );
}
