"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { createTransaction } from "@/app/actions";
import { AppButton } from "@/components/app-button";
import { FormDatePicker, FormInput, FormSelect } from "@/components/form-fields";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getCurrentDateInput } from "@/lib/dates";
import { objectToFormData } from "@/lib/form-data";
import { getAccountTypeLabel, getTransactionTypeLabel, transactionStatuses, transactionTypes } from "@/lib/options";
import { invalidateFinanceQueries, queryKeys } from "@/lib/query-keys";
import { transactionFormSchema, type TransactionFormValues } from "@/lib/validations";

type FormOption = {
  id: number;
  name: string;
  type: string;
};

type FormDataResponse = {
  accounts: FormOption[];
  categories: FormOption[];
  mode: "database" | "demo" | "error";
  databaseMessage: string | null;
};

export function NewTransactionDialog({
  className = "inline-flex items-center justify-center gap-2 rounded-2xl bg-[#10b981] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#059669]",
  label = "Nova transação",
}: {
  className?: string;
  label?: string;
}) {
  const queryClient = useQueryClient();
  // The shadcn dialog is controlled so server mutation success can close it programmatically.
  const [open, setOpen] = useState(false);
  const formDataQuery = useQuery({
    queryKey: queryKeys.transactionFormData,
    queryFn: async () => {
      const response = await fetch("/api/transaction-form-data", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Não foi possível carregar contas e categorias.");
      }

      return (await response.json()) as FormDataResponse;
    },
  });
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      description: "",
      type: "expense",
      amount: "",
      transactionDate: getCurrentDateInput(),
      accountId: "",
      categoryId: "",
      installments: 1,
      status: "planned",
      notes: "",
    },
  });
  const mutation = useMutation({
    mutationFn: (values: TransactionFormValues) => createTransaction(objectToFormData(values)),
    onSuccess: async () => {
      setOpen(false);
      form.reset();
      await invalidateFinanceQueries(queryClient);
    },
  });
  const data = formDataQuery.data;
  const disabled =
    formDataQuery.isPending || !data || data.mode !== "database" || data.accounts.length === 0 || data.categories.length === 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={className}>
        <PlusCircle className="size-4" />
        {label}
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="glass-panel max-h-[calc(100vh-2rem)] w-full max-w-4xl overflow-y-auto rounded-[1.7rem] p-5 text-left text-[#eefbf1] sm:max-w-4xl">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <DialogTitle className="text-2xl font-semibold text-white">Nova transação</DialogTitle>
                  <DialogDescription className="mt-2 text-sm text-[#96a59b]">
                    Cadastre entradas, saídas e compras parceladas sem sair da tela atual.
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

              {formDataQuery.isPending ? <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-[#c8d5cc]">Carregando contas e categorias...</p> : null}
              {formDataQuery.error ? <p className="rounded-2xl border border-[#ff3131]/30 bg-[#ff3131]/10 p-4 text-sm text-[#ffd6d6]">{formDataQuery.error.message}</p> : null}
              {data?.databaseMessage ? <p className="rounded-2xl border border-[#ff3131]/30 bg-[#ff3131]/10 p-4 text-sm text-[#ffd6d6]">{data.databaseMessage}</p> : null}

              <form
                className="mt-5 grid gap-4"
                onSubmit={form.handleSubmit((values) => {
                  mutation.mutate(values);
                })}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <FormInput form={form} name="description" label="Descrição" placeholder="Notebook, mercado, cliente..." disabled={disabled} />
                  <FormSelect
                    form={form}
                    name="type"
                    label="Tipo"
                    disabled={disabled}
                    options={transactionTypes.map((type) => ({ value: type.value, label: type.label }))}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <FormInput form={form} name="amount" label="Valor total" inputMode="decimal" placeholder="1200,00" disabled={disabled} />
                  <FormInput form={form} name="installments" label="Parcelas" type="number" min={1} max={360} disabled={disabled} />
                  <FormDatePicker form={form} name="transactionDate" label="Data" disabled={disabled} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormSelect
                    form={form}
                    name="accountId"
                    label="Conta"
                    disabled={disabled}
                    options={(data?.accounts ?? []).map((account) => ({
                      value: String(account.id),
                      label: `${account.name} - ${getAccountTypeLabel(account.type)}`,
                    }))}
                  />
                  <FormSelect
                    form={form}
                    name="categoryId"
                    label="Categoria"
                    disabled={disabled}
                    options={(data?.categories ?? []).map((category) => ({
                      value: String(category.id),
                      label: `${category.name} - ${getTransactionTypeLabel(category.type)}`,
                    }))}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormSelect
                    form={form}
                    name="status"
                    label="Status inicial"
                    disabled={disabled}
                    options={transactionStatuses.map((status) => ({ value: status.value, label: status.label }))}
                  />
                  <FormInput form={form} name="notes" label="Observações" placeholder="Opcional" disabled={disabled} />
                </div>

                {data && (data.accounts.length === 0 || data.categories.length === 0) ? (
                  <p className="rounded-2xl border border-[#ff3131]/30 bg-[#ff3131]/10 p-3 text-sm text-[#ffd6d6]">
                    Cadastre ao menos uma conta e uma categoria antes de registrar transações.
                  </p>
                ) : null}
                {mutation.error ? <p className="rounded-2xl border border-[#ff3131]/30 bg-[#ff3131]/10 p-3 text-sm text-[#ffd6d6]">{mutation.error.message}</p> : null}

                <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <DialogClose className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10" type="button">
                    Cancelar
                  </DialogClose>
                  <AppButton className="rounded-2xl bg-[#10b981] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#059669] disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/40" disabled={disabled || mutation.isPending} type="submit">
                    Salvar transação
                  </AppButton>
                </div>
              </form>
      </DialogContent>
    </Dialog>
  );
}
