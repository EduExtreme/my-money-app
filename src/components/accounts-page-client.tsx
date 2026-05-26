"use client";

import { CreditCard } from "lucide-react";

import { AccountForm } from "@/components/account-form";
import { DatabaseBanner, EmptyState, SectionHeader } from "@/components/ui";
import { useFinanceDataQuery } from "@/lib/finance-query";
import type { FinanceData } from "@/lib/finance-types";
import { formatCurrency } from "@/lib/money";
import { getAccountTypeLabel } from "@/lib/options";

export function AccountsPageClient({ initialData }: { initialData: FinanceData }) {
  const query = useFinanceDataQuery({ initialData });
  const data = query.data ?? initialData;
  const disabled = data.mode !== "database";

  return (
    <div>
      <DatabaseBanner message={data.databaseMessage} mode={data.mode} />
      <SectionHeader eyebrow="cadastros" title="Contas e meios de pagamento" />

      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <section className="glass-panel rounded-[1.7rem] p-5">
          <h2 className="mb-4 text-xl font-semibold text-white">Contas registradas</h2>
          {data.accounts.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {data.accounts.map((account) => (
                <article key={account.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="grid size-11 place-items-center rounded-2xl" style={{ background: `${account.color}22`, color: account.color }}>
                      <CreditCard className="size-5" />
                    </span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-[#a7b4ac]">{getAccountTypeLabel(account.type)}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">{account.name}</h3>
                  <p className="text-sm text-[#96a59b]">{account.institution ?? "Sem instituicao"}</p>
                  {account.type === "credit_card" ? (
                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-[#c4d0c8]">
                      <span>Limite: {formatCurrency(account.creditLimitCents ?? 0)}</span>
                      <span>Fecha: {account.closingDay ?? "-"}</span>
                      <span>Vence: {account.dueDay ?? "-"}</span>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Nenhuma conta cadastrada" description="Cadastre cartoes, Pix, debito, banco ou dinheiro para comecar a registrar transacoes." />
          )}
        </section>

        <section className="glass-panel rounded-[1.7rem] p-5">
          <h2 className="text-xl font-semibold text-white">Nova conta</h2>
          <p className="mt-1 text-sm text-[#96a59b]">Para cartao de credito, preencha limite, fechamento e vencimento.</p>
          <AccountForm disabled={disabled} />
        </section>
      </div>
    </div>
  );
}
