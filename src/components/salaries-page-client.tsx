"use client";

import { Banknote, CalendarDays } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";

import { MonthFilter } from "@/components/query-filters";
import { CreateSalaryForm, SalaryRowActions } from "@/components/salary-row-actions";
import { DatabaseBanner, EmptyState, MetricCard, SectionHeader } from "@/components/ui";
import { getCurrentMonth, getMonthLabel } from "@/lib/dates";
import { useFinanceDataQuery } from "@/lib/finance-query";
import type { FinanceData } from "@/lib/finance-types";
import { formatCurrency } from "@/lib/money";
import { getAccountTypeLabel, getSalaryStatusLabel } from "@/lib/options";

export function SalariesPageClient({
  initialData,
  initialMonth,
}: {
  initialData: FinanceData;
  initialMonth: string;
}) {
  const [month] = useQueryState("month", parseAsString.withDefault(initialMonth));
  const selectedMonth = month || getCurrentMonth();
  const query = useFinanceDataQuery({
    input: { month: selectedMonth, year: Number(selectedMonth.slice(0, 4)) },
    initialInput: { month: initialMonth, year: Number(initialMonth.slice(0, 4)) },
    initialData,
  });
  const data = query.data ?? initialData;
  const accounts = data.accounts.map((account) => ({ id: account.id, name: account.name, type: account.type }));
  const incomeCategories = data.categories
    .filter((category) => category.type === "income")
    .map((category) => ({ id: category.id, name: category.name, type: category.type }));
  const disabled = data.mode !== "database" || accounts.length === 0 || incomeCategories.length === 0;

  return (
    <div>
      <DatabaseBanner message={data.databaseMessage} mode={data.mode} />
      <SectionHeader eyebrow="receitas fixas" title="Salarios mensais">
        <MonthFilter month={selectedMonth} />
      </SectionHeader>

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <MetricCard title="Salarios ativos no mes" value={data.metrics.monthlySalaryIncome} caption={getMonthLabel(selectedMonth)} />
        <MetricCard title="Contas do mes" value={data.metrics.monthlyExpense} tone="red" caption="Saidas e parcelas do mes" />
        <MetricCard
          title="Depois das contas"
          value={data.metrics.monthlySalaryIncome - data.metrics.monthlyExpense}
          tone={data.metrics.monthlySalaryIncome - data.metrics.monthlyExpense >= 0 ? "green" : "red"}
          caption="Salarios menos saidas do mes"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.78fr]">
        <section className="glass-panel rounded-[1.7rem] p-5">
          <h2 className="mb-4 text-xl font-semibold text-white">Salarios cadastrados</h2>
          {data.salaries.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-separate border-spacing-y-2 text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.2em] text-[#96a59b]">
                  <tr>
                    <th className="px-4 py-2">Nome</th>
                    <th className="px-4 py-2">Periodo</th>
                    <th className="px-4 py-2">Conta</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right">Valor</th>
                    <th className="px-4 py-2 text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {data.salaries.map((salary) => (
                    <tr key={salary.id} className="bg-white/[0.035] text-[#e9f6ec]">
                      <td className="rounded-l-2xl px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid size-10 place-items-center rounded-2xl bg-[#39ff14]/10 text-[#39ff14]">
                            <Banknote className="size-5" />
                          </span>
                          <div>
                            <div className="font-medium text-white">{salary.name}</div>
                            <div className="text-xs text-[#96a59b]">Dia {salary.paymentDay}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-2 text-[#c8d5cc]">
                          <CalendarDays className="size-4 text-[#39ff14]" />
                          {salary.startMonth} ate {salary.endMonth ?? "indefinido"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{salary.accountName}</div>
                        <div className="text-xs text-[#96a59b]">{getAccountTypeLabel(salary.accountType)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-[#dce8df]">
                          {getSalaryStatusLabel(salary.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[#39ff14]">{formatCurrency(salary.amountCents)}</td>
                      <td className="rounded-r-2xl px-4 py-3">
                        <SalaryRowActions
                          accounts={accounts}
                          categories={incomeCategories}
                          disabled={disabled}
                          salary={{
                            id: salary.id,
                            name: salary.name,
                            amountCents: salary.amountCents,
                            paymentDay: salary.paymentDay,
                            startMonth: salary.startMonth,
                            endMonth: salary.endMonth,
                            accountId: salary.accountId,
                            categoryId: salary.categoryId,
                            status: salary.status,
                            notes: salary.notes,
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Nenhum salario cadastrado" description="Cadastre salarios para que eles entrem automaticamente nas entradas do mes e descontem das contas." />
          )}
        </section>

        <section className="glass-panel rounded-[1.7rem] p-5">
          <h2 className="text-xl font-semibold text-white">Novo salario</h2>
          <p className="mt-1 text-sm text-[#96a59b]">
            O valor entra automaticamente em todos os meses ativos. Se voce ja lancou esse salario em Transacoes, exclua o lancamento antigo para nao duplicar a entrada.
          </p>
          {data.mode === "database" && (accounts.length === 0 || incomeCategories.length === 0) ? (
            <p className="mt-5 rounded-2xl border border-[#ff3131]/30 bg-[#ff3131]/10 p-3 text-sm text-[#ffd6d6]">
              Cadastre uma conta e uma categoria de entrada antes de adicionar salarios.
            </p>
          ) : null}
          <CreateSalaryForm accounts={accounts} categories={incomeCategories} disabled={disabled} selectedMonth={selectedMonth} />
        </section>
      </div>
    </div>
  );
}
