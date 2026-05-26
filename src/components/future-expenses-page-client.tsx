"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronDown } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";

import { FutureExpenseDialog } from "@/components/future-expense-dialog";
import { MonthFilter } from "@/components/query-filters";
import { TransactionTable } from "@/components/transaction-table";
import { DatabaseBanner, MetricCard, SectionHeader } from "@/components/ui";
import { getCurrentMonth, getMonthLabel } from "@/lib/dates";
import { useFinanceDataQuery } from "@/lib/finance-query";
import type { FinanceData } from "@/lib/finance-types";
import { formatCurrency } from "@/lib/money";

export function FutureExpensesPageClient({
  initialData,
  initialMonth,
}: {
  initialData: FinanceData;
  initialMonth: string;
}) {
  const [month] = useQueryState("month", parseAsString.withDefault(initialMonth));
  const selectedMonth = month || initialMonth;
  const query = useFinanceDataQuery({
    input: { month: selectedMonth, year: Number(selectedMonth.slice(0, 4)) },
    initialInput: { month: initialMonth, year: Number(initialMonth.slice(0, 4)) },
    initialData,
  });
  const data = query.data ?? initialData;
  const currentMonth = getCurrentMonth();
  const expenses = data.transactions.filter(
    (transaction) =>
      transaction.type === "expense" &&
      transaction.status === "planned" &&
      transaction.competencyMonth === selectedMonth &&
      transaction.competencyMonth >= currentMonth,
  );
  const accounts = data.accounts.map((account) => ({ id: account.id, name: account.name, type: account.type }));
  const expenseCategories = data.categories
    .filter((category) => category.type === "expense")
    .map((category) => ({ id: category.id, name: category.name, type: category.type }));
  const actionOptions = {
    accounts,
    categories: data.categories.map((category) => ({ id: category.id, name: category.name, type: category.type })),
    canMutate: data.mode === "database",
  };
  const totalPlanned = expenses.reduce((total, transaction) => total + transaction.amountCents, 0);
  const carriedFromPreviousMonthsTotal = expenses
    .filter((transaction) => transaction.groupFirstDate.slice(0, 7) < selectedMonth)
    .reduce((total, transaction) => total + transaction.amountCents, 0);
  const selectedYearEndMonth = `${selectedMonth.slice(0, 4)}-12`;
  const plannedUntilYearEndTransactions = data.transactions.filter(
    (transaction) =>
      transaction.type === "expense" &&
      transaction.status === "planned" &&
      transaction.competencyMonth >= selectedMonth &&
      transaction.competencyMonth <= selectedYearEndMonth,
  );
  const plannedUntilYearEndTotal = plannedUntilYearEndTransactions.reduce((total, transaction) => total + transaction.amountCents, 0);
  const plannedUntilYearEndBreakdown = Array.from(
    plannedUntilYearEndTransactions
      .reduce((map, transaction) => {
        const item = map.get(transaction.competencyMonth) ?? {
          month: transaction.competencyMonth,
          count: 0,
          totalCents: 0,
        };

        item.count += 1;
        item.totalCents += transaction.amountCents;
        map.set(transaction.competencyMonth, item);

        return map;
      }, new Map<string, { month: string; count: number; totalCents: number }>())
      .values(),
  ).sort((a, b) => a.month.localeCompare(b.month));
  const projectedBalance = data.metrics.monthlySalaryIncome + data.metrics.monthlyTransactionIncome - totalPlanned;
  const disabled = data.mode !== "database" || accounts.length === 0 || expenseCategories.length === 0;

  return (
    <div>
      <DatabaseBanner message={data.databaseMessage} mode={data.mode} />
      <SectionHeader eyebrow="planejamento" title="Gastos Futuros">
        <div className="flex flex-col gap-3 sm:flex-row">
          <MonthFilter month={selectedMonth} />
          <FutureExpenseDialog accounts={accounts} categories={expenseCategories} disabled={disabled} selectedMonth={selectedMonth} />
        </div>
      </SectionHeader>

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Planejado no mes"
          value={totalPlanned}
          tone="red"
          caption={
            carriedFromPreviousMonthsTotal > 0
              ? `${formatCurrency(carriedFromPreviousMonthsTotal)} vem de meses anteriores`
              : `Sem valores de meses anteriores em ${getMonthLabel(selectedMonth)}`
          }
        />
        <MetricCard title="Gastos planejados" value={expenses.length} kind="number" tone="neutral" caption="Lancamentos previstos" />
        <MetricCard
          title="Planejamento ate o fim do ano"
          value={plannedUntilYearEndTotal}
          tone="red"
          caption={`Despesas planejadas de ${getMonthLabel(selectedMonth)} ate dezembro`}
        />
        <MetricCard title="Saldo projetado" value={projectedBalance} tone={projectedBalance >= 0 ? "green" : "red"} caption="Entradas previstas menos gastos" />
      </section>

      <Collapsible.Root defaultOpen={false} className="mb-6 glass-panel rounded-[1.7rem] p-5">
        <Collapsible.Trigger className="group flex w-full items-center justify-between gap-4 text-left">
          <div>
            <h2 className="text-xl font-semibold text-white">Composicao do planejamento ate o fim do ano</h2>
            <p className="mt-1 text-sm text-[#96a59b]">
              Soma das despesas planejadas de {getMonthLabel(selectedMonth)} ate dezembro, agrupadas por mes.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <strong className="text-2xl text-[#ff4d4d]">{formatCurrency(plannedUntilYearEndTotal)}</strong>
            <ChevronDown className="size-5 text-[#39ff14] transition group-data-[panel-open]:rotate-180" />
          </div>
        </Collapsible.Trigger>

        <Collapsible.Panel className="pt-4">
          {plannedUntilYearEndBreakdown.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-separate border-spacing-y-2 text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.2em] text-[#96a59b]">
                  <tr>
                    <th className="px-4 py-2">Mes</th>
                    <th className="px-4 py-2 text-right">Parcelas</th>
                    <th className="px-4 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {plannedUntilYearEndBreakdown.map((item) => (
                    <tr key={item.month} className="bg-white/[0.035] text-[#e9f6ec]">
                      <td className="rounded-l-2xl px-4 py-3 font-medium text-white">{getMonthLabel(item.month)}</td>
                      <td className="px-4 py-3 text-right text-[#c8d5cc]">{item.count}</td>
                      <td className="rounded-r-2xl px-4 py-3 text-right font-semibold text-[#ff4d4d]">{formatCurrency(item.totalCents)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="text-white">
                    <td className="px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#96a59b]">Total</td>
                    <td className="px-4 py-3 text-right text-sm text-[#96a59b]">
                      {plannedUntilYearEndBreakdown.reduce((total, item) => total + item.count, 0)} parcelas
                    </td>
                    <td className="px-4 py-3 text-right text-lg font-bold text-[#ff4d4d]">{formatCurrency(plannedUntilYearEndTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-white/15 p-5 text-center text-sm text-[#96a59b]">
              Nenhuma despesa planejada encontrada ate o fim do ano.
            </p>
          )}
        </Collapsible.Panel>
      </Collapsible.Root>

      {data.mode === "database" && (accounts.length === 0 || expenseCategories.length === 0) ? (
        <p className="mb-6 rounded-2xl border border-[#ff3131]/30 bg-[#ff3131]/10 p-3 text-sm text-[#ffd6d6]">
          Cadastre uma conta e uma categoria de saida antes de planejar gastos futuros.
        </p>
      ) : null}

      <section className="glass-panel rounded-[1.7rem] p-5">
        <h2 className="text-xl font-semibold text-white">Gastos previstos para {getMonthLabel(selectedMonth)}</h2>
        <p className="mt-1 text-sm text-[#96a59b]">Inclui despesas planejadas e parcelas que caem no mes selecionado.</p>
        <div className="mt-4">
          <TransactionTable actionOptions={actionOptions} carryOverMonth={selectedMonth} transactions={expenses} />
        </div>
      </section>
    </div>
  );
}
