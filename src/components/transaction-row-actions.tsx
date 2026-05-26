"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { deleteTransactionGroup, updateTransactionGroup } from "@/app/actions";
import { AppButton } from "@/components/app-button";
import { FormDatePicker, FormInput, FormSelect } from "@/components/form-fields";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { objectToFormData } from "@/lib/form-data";
import { getAccountTypeLabel, getStatusLabel, getTransactionTypeLabel, transactionStatuses, transactionTypes } from "@/lib/options";
import { invalidateFinanceQueries } from "@/lib/query-keys";
import { updateTransactionGroupFormSchema, type UpdateTransactionGroupFormValues } from "@/lib/validations";

export type TransactionActionOption = {
  id: number;
  name: string;
  type: string;
};

export type TransactionActionOptions = {
  accounts: TransactionActionOption[];
  categories: TransactionActionOption[];
  canMutate: boolean;
};

export type TransactionActionData = {
  groupId: number;
  accountId: number;
  categoryId: number;
  description: string;
  type: string;
  status: string;
  notes: string | null;
  groupTotalAmountCents: number;
  groupInstallmentCount: number;
  groupFirstDate: string;
  groupNotes: string | null;
};

export function TransactionRowActions({
  transaction,
  options,
}: {
  transaction: TransactionActionData;
  options: TransactionActionOptions;
}) {
  const queryClient = useQueryClient();
  // The shadcn dialog is controlled so server mutation success can close it programmatically.
  const [open, setOpen] = useState(false);
  // Deletion uses a confirmation dialog instead of a browser alert to keep UI consistent.
  const [deleteOpen, setDeleteOpen] = useState(false);
  const form = useForm<UpdateTransactionGroupFormValues>({
    resolver: zodResolver(updateTransactionGroupFormSchema),
    defaultValues: {
      groupId: transaction.groupId,
      description: transaction.description,
      type: transaction.type as "income" | "expense",
      amount: formatCentsForInput(transaction.groupTotalAmountCents),
      transactionDate: transaction.groupFirstDate,
      accountId: String(transaction.accountId),
      categoryId: String(transaction.categoryId),
      installments: transaction.groupInstallmentCount,
      status: transaction.status as "planned" | "paid",
      notes: transaction.groupNotes ?? transaction.notes ?? "",
    },
  });
  const updateMutation = useMutation({
    mutationFn: (values: UpdateTransactionGroupFormValues) => updateTransactionGroup(objectToFormData(values)),
    onSuccess: async () => {
      setOpen(false);
      await invalidateFinanceQueries(queryClient);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteTransactionGroup(objectToFormData({ groupId: transaction.groupId })),
    onSuccess: async () => {
      setDeleteOpen(false);
      await invalidateFinanceQueries(queryClient);
    },
  });
  const disabled = !options.canMutate || options.accounts.length === 0 || options.categories.length === 0;

  if (disabled) {
    return (
      <div className="flex justify-end gap-2">
        <AppButton className="grid size-9 cursor-not-allowed place-items-center rounded-xl border border-white/10 text-white/30" disabled type="button">
          <Pencil className="size-4" />
        </AppButton>
        <AppButton className="grid size-9 cursor-not-allowed place-items-center rounded-xl border border-white/10 text-white/30" disabled type="button">
          <Trash2 className="size-4" />
        </AppButton>
      </div>
    );
  }

  return (
    <div className="flex justify-end gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          aria-label={`Editar ${transaction.description}`}
          className="grid size-9 place-items-center rounded-xl border border-[#39ff14]/25 bg-[#39ff14]/10 text-[#39ff14] transition hover:bg-[#39ff14]/20"
        >
          <Pencil className="size-4" />
        </DialogTrigger>
        <DialogContent showCloseButton={false} className="glass-panel max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-[1.7rem] p-5 text-left text-[#eefbf1] sm:max-w-3xl">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <DialogTitle className="text-2xl font-semibold text-white">Editar transacao</DialogTitle>
                    <DialogDescription className="mt-2 text-sm text-[#96a59b]">
                      Alterar estes dados recria todas as parcelas da compra ou entrada selecionada.
                    </DialogDescription>
                  </div>
                  <DialogClose
                    aria-label="Fechar"
                    className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white transition hover:border-[#ff3131]/40 hover:text-[#ff7070]"
                    type="button"
                  >
                    <X className="size-5" />
                  </DialogClose>
                </div>

                <form className="grid gap-4" onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormInput form={form} name="description" label="Descricao" disabled={updateMutation.isPending} />
                    <FormSelect
                      form={form}
                      name="type"
                      label="Tipo"
                      disabled={updateMutation.isPending}
                      options={transactionTypes.map((type) => ({ value: type.value, label: type.label }))}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <FormInput form={form} name="amount" label="Valor total" inputMode="decimal" disabled={updateMutation.isPending} />
                    <FormInput form={form} name="installments" label="Parcelas" type="number" min={1} max={360} disabled={updateMutation.isPending} />
                    <FormDatePicker form={form} name="transactionDate" label="Data" disabled={updateMutation.isPending} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormSelect
                      form={form}
                      name="accountId"
                      label="Conta"
                      disabled={updateMutation.isPending}
                      options={options.accounts.map((account) => ({
                        value: String(account.id),
                        label: `${account.name} - ${getAccountTypeLabel(account.type)}`,
                      }))}
                    />
                    <FormSelect
                      form={form}
                      name="categoryId"
                      label="Categoria"
                      disabled={updateMutation.isPending}
                      options={options.categories.map((category) => ({
                        value: String(category.id),
                        label: `${category.name} - ${getTransactionTypeLabel(category.type)}`,
                      }))}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormSelect
                      form={form}
                      name="status"
                      label="Status"
                      disabled={updateMutation.isPending}
                      options={transactionStatuses.map((status) => ({ value: status.value, label: getStatusLabel(status.value) }))}
                    />
                    <FormInput form={form} name="notes" label="Observacoes" disabled={updateMutation.isPending} />
                  </div>
                  {updateMutation.error ? <p className="rounded-2xl border border-[#ff3131]/30 bg-[#ff3131]/10 p-3 text-sm text-[#ffd6d6]">{updateMutation.error.message}</p> : null}

                  <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <DialogClose className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10" type="button">
                      Cancelar
                    </DialogClose>
                    <AppButton className="rounded-2xl bg-[#39ff14] px-5 py-3 text-sm font-bold text-[#041006] transition hover:bg-[#7cff65] disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/40" disabled={updateMutation.isPending} type="submit">
                      Salvar alteracoes
                    </AppButton>
                  </div>
                </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger
          aria-label={`Excluir ${transaction.description}`}
          className="grid size-9 place-items-center rounded-xl border border-[#ff3131]/25 bg-[#ff3131]/10 text-[#ff4d4d] transition hover:bg-[#ff3131]/20 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={deleteMutation.isPending}
          type="button"
        >
          <Trash2 className="size-4" />
        </DialogTrigger>
        <DialogContent showCloseButton={false} className="glass-panel w-full max-w-md rounded-[1.7rem] p-5 text-left text-[#eefbf1] sm:max-w-md">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-2xl font-semibold text-white">Excluir transacao?</DialogTitle>
              <DialogDescription className="mt-2 text-sm text-[#96a59b]">
                Esta acao exclui a transacao e todas as parcelas relacionadas. Nao sera possivel desfazer.
              </DialogDescription>
            </div>
            <DialogClose
              aria-label="Fechar"
              className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white transition hover:border-[#ff3131]/40 hover:text-[#ff7070]"
              type="button"
            >
              <X className="size-5" />
            </DialogClose>
          </div>

          {deleteMutation.error ? <p className="rounded-2xl border border-[#ff3131]/30 bg-[#ff3131]/10 p-3 text-sm text-[#ffd6d6]">{deleteMutation.error.message}</p> : null}

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <DialogClose className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10" type="button">
              Cancelar
            </DialogClose>
            <AppButton
              className="rounded-2xl bg-[#ff3131] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#ff5c5c] disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/40"
              disabled={deleteMutation.isPending}
              type="button"
              onClick={() => deleteMutation.mutate()}
            >
              Excluir transacao
            </AppButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatCentsForInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}
