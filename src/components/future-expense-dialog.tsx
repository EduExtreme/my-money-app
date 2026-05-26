"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog } from "@base-ui/react/dialog";
import { CalendarPlus, X } from "lucide-react";
import { useRef } from "react";
import { useForm } from "react-hook-form";

import { createTransaction } from "@/app/actions";
import { AppButton } from "@/components/app-button";
import { FormInput, FormSelect } from "@/components/form-fields";
import { createDateInputFromMonthDay } from "@/lib/dates";
import { objectToFormData } from "@/lib/form-data";
import { getAccountTypeLabel, getTransactionTypeLabel } from "@/lib/options";
import { invalidateFinanceQueries } from "@/lib/query-keys";
import { futureExpensePlannerFormSchema, type FutureExpensePlannerFormValues } from "@/lib/validations";

type Option = {
  id: number;
  name: string;
  type: string;
};

export function FutureExpenseDialog({
  accounts,
  categories,
  selectedMonth,
  disabled,
}: {
  accounts: Option[];
  categories: Option[];
  selectedMonth: string;
  disabled: boolean;
}) {
  const queryClient = useQueryClient();
  const dialogActionsRef = useRef<Dialog.Root.Actions | null>(null);
  const form = useForm<FutureExpensePlannerFormValues>({
    resolver: zodResolver(futureExpensePlannerFormSchema),
    defaultValues: {
      description: "",
      amount: "",
      startMonth: selectedMonth,
      day: 1,
      accountId: accounts[0]?.id ? String(accounts[0].id) : "",
      categoryId: categories[0]?.id ? String(categories[0].id) : "",
      installments: 1,
      notes: "",
    },
  });
  const mutation = useMutation({
    mutationFn: (values: FutureExpensePlannerFormValues) => {
      const transactionDate = createDateInputFromMonthDay(String(values.startMonth), Number(values.day));

      return createTransaction(
        objectToFormData({
          description: values.description,
          type: "expense",
          amount: values.amount,
          transactionDate,
          accountId: values.accountId,
          categoryId: values.categoryId,
          installments: values.installments,
          status: "planned",
          notes: values.notes,
        }),
      );
    },
    onSuccess: async () => {
      dialogActionsRef.current?.close();
      form.reset();
      await invalidateFinanceQueries(queryClient);
    },
  });
  const isDisabled = disabled || mutation.isPending;

  return (
    <Dialog.Root actionsRef={dialogActionsRef}>
      <Dialog.Trigger className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#39ff14] px-4 py-2.5 text-sm font-bold text-[#041006] transition hover:bg-[#7cff65]">
        <CalendarPlus className="size-4" />
        Novo gasto futuro
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm" />
        <Dialog.Viewport className="fixed inset-0 z-50 overflow-y-auto p-4">
          <div className="flex min-h-full items-center justify-center">
            <Dialog.Popup className="glass-panel w-full max-w-3xl rounded-[1.7rem] p-5 text-left text-[#eefbf1]">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <Dialog.Title className="text-2xl font-semibold text-white">Novo gasto futuro</Dialog.Title>
                  <Dialog.Description className="mt-2 text-sm text-[#96a59b]">
                    Escolha o mes inicial do gasto. Se tiver parcelas, elas serao geradas a partir desse mes.
                  </Dialog.Description>
                </div>
                <Dialog.Close
                  aria-label="Fechar"
                  className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white transition hover:border-[#ff3131]/40 hover:text-[#ff7070]"
                  type="button"
                >
                  <X className="size-5" />
                </Dialog.Close>
              </div>

              <form className="grid gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormInput form={form} name="description" label="Descricao" placeholder="IPTU, viagem, matricula..." disabled={isDisabled} />
                  <FormInput form={form} name="amount" label="Valor total" inputMode="decimal" placeholder="800,00" disabled={isDisabled} />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <FormInput form={form} name="startMonth" label="Mes inicial" type="month" disabled={isDisabled} />
                  <FormInput form={form} name="day" label="Dia" type="number" min={1} max={31} disabled={isDisabled} />
                  <FormInput form={form} name="installments" label="Parcelas" type="number" min={1} max={360} disabled={isDisabled} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormSelect
                    form={form}
                    name="accountId"
                    label="Conta"
                    disabled={isDisabled}
                    options={accounts.map((account) => ({ value: String(account.id), label: `${account.name} - ${getAccountTypeLabel(account.type)}` }))}
                  />
                  <FormSelect
                    form={form}
                    name="categoryId"
                    label="Categoria"
                    disabled={isDisabled}
                    options={categories.map((category) => ({ value: String(category.id), label: `${category.name} - ${getTransactionTypeLabel(category.type)}` }))}
                  />
                </div>
                <FormInput form={form} name="notes" label="Observacoes" placeholder="Opcional" disabled={isDisabled} />
                {mutation.error ? <p className="rounded-2xl border border-[#ff3131]/30 bg-[#ff3131]/10 p-3 text-sm text-[#ffd6d6]">{mutation.error.message}</p> : null}
                <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Dialog.Close className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10" type="button">
                    Cancelar
                  </Dialog.Close>
                  <AppButton className="rounded-2xl bg-[#39ff14] px-5 py-3 text-sm font-bold text-[#041006] transition hover:bg-[#7cff65] disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/40" disabled={isDisabled} type="submit">
                    Salvar gasto futuro
                  </AppButton>
                </div>
              </form>
            </Dialog.Popup>
          </div>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
