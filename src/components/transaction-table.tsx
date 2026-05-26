import { getAccountTypeLabel, getStatusLabel, getTransactionTypeLabel } from "@/lib/options";
import { formatCurrency } from "@/lib/money";
import { getMonthLabel } from "@/lib/dates";
import type { TransactionWithMeta } from "@/lib/finance-types";
import { TransactionRowActions, type TransactionActionOptions } from "./transaction-row-actions";

export function TransactionTable({
  transactions,
  actionOptions,
  carryOverMonth,
}: {
  transactions: TransactionWithMeta[];
  actionOptions?: TransactionActionOptions;
  carryOverMonth?: string;
}) {
  if (!transactions.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-[#96a59b]">
        Nenhuma transacao encontrada para esse filtro.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-separate border-spacing-y-2 text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.2em] text-[#96a59b]">
          <tr>
            <th className="px-4 py-2">Descricao</th>
            <th className="px-4 py-2">Tipo</th>
            <th className="px-4 py-2">Conta</th>
            <th className="px-4 py-2">Categoria</th>
            <th className="px-4 py-2">Parcela</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2 text-right">Valor</th>
            {actionOptions ? <th className="px-4 py-2 text-right">Acoes</th> : null}
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => {
            const carryOverOriginMonth = transaction.groupFirstDate.slice(0, 7);
            const isCarryOver = Boolean(carryOverMonth && carryOverOriginMonth < carryOverMonth);

            return (
              <tr key={transaction.id} className="bg-white/[0.035] text-[#e9f6ec]">
                <td className="rounded-l-2xl px-4 py-3">
                  <div className="font-medium text-white">{transaction.description}</div>
                  <div className="text-xs text-[#96a59b]">{transaction.transactionDate}</div>
                </td>
                <td className="px-4 py-3">{getTransactionTypeLabel(transaction.type)}</td>
                <td className="px-4 py-3">
                  <div>{transaction.accountName}</div>
                  <div className="text-xs text-[#96a59b]">{getAccountTypeLabel(transaction.accountType)}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ background: transaction.categoryColor }} />
                    {transaction.categoryName}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {transaction.installmentNumber}/{transaction.installmentTotal}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-[#dce8df]">
                    {getStatusLabel(transaction.status)}
                  </span>
                </td>
                <td className={`px-4 py-3 text-right font-semibold ${actionOptions ? "" : "rounded-r-2xl"} ${transaction.type === "expense" ? "text-[#ff4d4d]" : "text-[#39ff14]"}`}>
                  <div>
                    {transaction.type === "expense" ? "-" : "+"}
                    {formatCurrency(transaction.amountCents)}
                  </div>
                  {isCarryOver ? (
                    <div className="mt-1 text-xs font-normal text-[#ffb4b4]">
                      vem de {getMonthLabel(carryOverOriginMonth)}
                    </div>
                  ) : null}
                </td>
                {actionOptions ? (
                  <td className="rounded-r-2xl px-4 py-3">
                    <TransactionRowActions
                      options={actionOptions}
                      transaction={{
                        groupId: transaction.groupId,
                        accountId: transaction.accountId,
                        categoryId: transaction.categoryId,
                        description: transaction.description,
                        type: transaction.type,
                        status: transaction.status,
                        notes: transaction.notes,
                        groupTotalAmountCents: transaction.groupTotalAmountCents,
                        groupInstallmentCount: transaction.groupInstallmentCount,
                        groupFirstDate: transaction.groupFirstDate,
                        groupNotes: transaction.groupNotes,
                      }}
                    />
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
