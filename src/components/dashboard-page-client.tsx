"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarDays, TrendingDown, TrendingUp } from "lucide-react";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";

import { AnnualTrendChart, BreakdownChart } from "@/components/charts";
import { DashboardFilters } from "@/components/query-filters";
import { TransactionTable } from "@/components/transaction-table";
import { DatabaseBanner, MetricCard, SectionHeader } from "@/components/ui";
import { getCurrentMonth, getCurrentYear, getMonthLabel } from "@/lib/dates";
import { useFinanceDataQuery } from "@/lib/finance-query";
import type { FinanceData } from "@/lib/finance-types";
import { formatCurrency } from "@/lib/money";

export function DashboardPageClient({
  initialData,
  initialMonth,
  initialYear,
}: {
  initialData: FinanceData;
  initialMonth: string;
  initialYear: number;
}) {
  const [filters] = useQueryStates({
    month: parseAsString.withDefault(initialMonth),
    year: parseAsInteger.withDefault(initialYear),
  });
  const query = useFinanceDataQuery({
    input: { month: filters.month || getCurrentMonth(), year: filters.year || getCurrentYear() },
    initialInput: { month: initialMonth, year: initialYear },
    initialData,
  });
  const data = query.data ?? initialData;
  const actionOptions = {
    accounts: data.accounts.map((account) => ({ id: account.id, name: account.name, type: account.type })),
    categories: data.categories.map((category) => ({ id: category.id, name: category.name, type: category.type })),
    canMutate: data.mode === "database",
  };

  return (
    <div>
      <DatabaseBanner message={data.databaseMessage} mode={data.mode} />

      <SectionHeader eyebrow="overview" title="Controle financeiro em tempo real">
        <DashboardFilters month={filters.month} year={filters.year} />
      </SectionHeader>

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Entradas do mes" value={data.metrics.monthlyIncome} caption={`Inclui ${formatCurrency(data.metrics.monthlySalaryIncome)} em salarios`} />
        <MetricCard title="Saidas do mes" value={data.metrics.monthlyExpense} tone="red" caption="Inclui parcelas ja geradas" />
        <MetricCard title="Resultado mensal" value={data.metrics.monthlyBalance} tone={data.metrics.monthlyBalance >= 0 ? "green" : "red"} caption="Entradas menos saidas" />
        <MetricCard title="Economia" value={data.metrics.monthlySavingsRate} kind="percent" tone={data.metrics.monthlySavingsRate >= 0 ? "green" : "red"} caption="Saldo dividido por entradas" />
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="glass-panel rounded-[1.7rem] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#39ff14]/75">ano {data.selectedYear}</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Entradas vs saidas</h2>
            </div>
            <CalendarDays className="size-5 text-[#39ff14]" />
          </div>
          <AnnualTrendChart data={data.annualTrend} />
        </div>

        <div className="grid gap-4">
          <article className="glass-panel rounded-[1.7rem] p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-[#39ff14]/10 text-[#39ff14]">
                <TrendingUp className="size-5" />
              </span>
              <div>
                <p className="text-sm text-[#96a59b]">Total anual</p>
                <strong className="text-2xl text-[#39ff14]">{formatCurrency(data.metrics.annualBalance)}</strong>
              </div>
            </div>
          </article>
          <article className="glass-panel rounded-[1.7rem] p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-[#ff3131]/10 text-[#ff4d4d]">
                <TrendingDown className="size-5" />
              </span>
              <div>
                <p className="text-sm text-[#96a59b]">Divida futura parcelada</p>
                <strong className="text-2xl text-[#ff4d4d]">{formatCurrency(data.metrics.futureDebt)}</strong>
              </div>
            </div>
          </article>
          <article className="glass-panel rounded-[1.7rem] p-5">
            <p className="text-sm text-[#96a59b]">Cartao no mes</p>
            <strong className="mt-2 block text-2xl text-white">{formatCurrency(data.metrics.creditCardExpense)}</strong>
            <p className="mt-2 text-sm text-[#96a59b]">Gastos em contas do tipo cartao de credito.</p>
          </article>
        </div>
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="glass-panel rounded-[1.7rem] p-5">
          <h2 className="text-xl font-semibold text-white">Gastos por categoria</h2>
          <p className="mt-1 text-sm text-[#96a59b]">Top categorias do mes selecionado.</p>
          <BreakdownChart data={data.breakdowns.byCategory} />
        </div>
        <div className="glass-panel rounded-[1.7rem] p-5">
          <h2 className="text-xl font-semibold text-white">Gastos por conta</h2>
          <p className="mt-1 text-sm text-[#96a59b]">Cartao, debito, Pix, banco e dinheiro.</p>
          <BreakdownChart data={data.breakdowns.byAccount} />
        </div>
      </section>

      <section className="glass-panel rounded-[1.7rem] p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Movimentos do mes</h2>
            <p className="mt-1 text-sm text-[#96a59b]">Entradas, saidas e parcelas com competencia em {getMonthLabel(data.selectedMonth)}.</p>
          </div>
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#39ff14]" href={`/transactions?month=${data.selectedMonth}`}>
            Ver tudo <ArrowUpRight className="size-4" />
          </Link>
        </div>
        <TransactionTable actionOptions={actionOptions} transactions={data.monthlyTransactions.slice(0, 8)} />
      </section>
    </div>
  );
}
