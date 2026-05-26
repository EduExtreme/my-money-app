"use client";

import { CategoryForm } from "@/components/category-form";
import { DatabaseBanner, EmptyState, SectionHeader } from "@/components/ui";
import { useFinanceDataQuery } from "@/lib/finance-query";
import type { FinanceData } from "@/lib/finance-types";
import { getTransactionTypeLabel } from "@/lib/options";

export function CategoriesPageClient({ initialData }: { initialData: FinanceData }) {
  const query = useFinanceDataQuery({ initialData });
  const data = query.data ?? initialData;
  const disabled = data.mode !== "database";

  return (
    <div>
      <DatabaseBanner message={data.databaseMessage} mode={data.mode} />
      <SectionHeader eyebrow="cadastros" title="Categorias financeiras" />

      <div className="grid gap-6 lg:grid-cols-[1fr_0.72fr]">
        <section className="glass-panel rounded-[1.7rem] p-5">
          <h2 className="mb-4 text-xl font-semibold text-white">Categorias</h2>
          {data.categories.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.categories.map((category) => (
                <article key={category.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                  <span className="mb-4 block size-3 rounded-full" style={{ background: category.color }} />
                  <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                  <p className={category.type === "expense" ? "text-sm text-[#ff7a7a]" : "text-sm text-[#39ff14]"}>
                    {getTransactionTypeLabel(category.type)}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Nenhuma categoria" description="Crie categorias para separar receitas, custos fixos, cartao, lazer e investimentos." />
          )}
        </section>

        <section className="glass-panel rounded-[1.7rem] p-5">
          <h2 className="text-xl font-semibold text-white">Nova categoria</h2>
          <CategoryForm disabled={disabled} />
        </section>
      </div>
    </div>
  );
}
