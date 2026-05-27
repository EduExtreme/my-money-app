"use client";

import { parseAsInteger, useQueryState } from "nuqs";

import { AnnualTrendChart, BreakdownChart } from "@/components/charts";
import { YearFilter } from "@/components/query-filters";
import { DatabaseBanner, MetricCard, SectionHeader } from "@/components/ui";
import { getCurrentMonth, getCurrentYear, getMonthLabel } from "@/lib/dates";
import { useFinanceDataQuery } from "@/lib/finance-query";
import type { FinanceData } from "@/lib/finance-types";

export function ReportsPageClient({
  initialData,
  initialMonth,
  initialYear,
}: {
  initialData: FinanceData;
  initialMonth: string;
  initialYear: number;
}) {
  const [year] = useQueryState("year", parseAsInteger.withDefault(initialYear));
  const selectedYear = year || getCurrentYear();
  const selectedMonth = `${selectedYear}-${getCurrentMonth().slice(5, 7)}`;
  const query = useFinanceDataQuery({
    input: { month: selectedMonth, year: selectedYear },
    initialInput: { month: initialMonth, year: initialYear },
    initialData,
  });
  const data = query.data ?? initialData;

  return (
    <div>
      <DatabaseBanner message={data.databaseMessage} mode={data.mode} />
      <SectionHeader eyebrow="analytics" title="Relatórios anuais">
        <YearFilter year={selectedYear} />
      </SectionHeader>

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Entradas no ano" value={data.metrics.annualIncome} caption="Inclui salários mensais ativos" />
        <MetricCard title="Saídas no ano" value={data.metrics.annualExpense} tone="red" />
        <MetricCard title="Saldo anual" value={data.metrics.annualBalance} tone={data.metrics.annualBalance >= 0 ? "green" : "red"} />
        <MetricCard title="Média mensal de saídas" value={data.metrics.averageMonthlyExpense} tone="neutral" />
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-2">
        <article className="glass-panel rounded-[1.7rem] p-5">
          <p className="text-sm text-[#96a59b]">Melhor mês</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#10b981]">{getMonthLabel(data.metrics.bestMonth.monthKey)}</h2>
          <p className="mt-1 text-sm text-[#96a59b]">Maior saldo do ano selecionado.</p>
        </article>
        <article className="glass-panel rounded-[1.7rem] p-5">
          <p className="text-sm text-[#96a59b]">Pior mês</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#ff4d4d]">{getMonthLabel(data.metrics.worstMonth.monthKey)}</h2>
          <p className="mt-1 text-sm text-[#96a59b]">Menor saldo do ano selecionado.</p>
        </article>
      </section>

      <section className="mb-6 glass-panel rounded-[1.7rem] p-5">
        <h2 className="text-xl font-semibold text-white">Evolução anual</h2>
        <AnnualTrendChart data={data.annualTrend} />
      </section>

      <section className="glass-panel rounded-[1.7rem] p-5">
        <h2 className="text-xl font-semibold text-white">Categorias mais caras</h2>
        <p className="mt-1 text-sm text-[#96a59b]">Soma anual das saídas por categoria.</p>
        <BreakdownChart data={data.breakdowns.annualByCategory} />
      </section>
    </div>
  );
}
