"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { createSalary, deleteSalary, updateSalary } from "@/app/actions";
import { AppButton } from "@/components/app-button";
import { FormInput, FormMonthPicker, FormSelect, type SelectOption } from "@/components/form-fields";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { objectToFormData } from "@/lib/form-data";
import { getSalaryStatusLabel, salaryStatuses } from "@/lib/options";
import { invalidateFinanceQueries } from "@/lib/query-keys";
import { salaryFormSchema, updateSalaryFormSchema, type SalaryFormValues, type UpdateSalaryFormValues } from "@/lib/validations";

type Option = {
  id: number;
  name: string;
  type: string;
};

export type SalaryActionData = {
  id: number;
  name: string;
  amountCents: number;
  paymentDay: number;
  startMonth: string;
  endMonth: string | null;
  accountId: number;
  categoryId: number;
  status: string;
  notes: string | null;
};

export function CreateSalaryForm({
  accounts,
  categories,
  disabled,
  selectedMonth,
}: {
  accounts: Option[];
  categories: Option[];
  disabled: boolean;
  selectedMonth: string;
}) {
  const queryClient = useQueryClient();
  const form = useForm<SalaryFormValues>({
    resolver: zodResolver(salaryFormSchema),
    defaultValues: {
      name: "",
      amount: "",
      paymentDay: 5,
      startMonth: selectedMonth,
      endMonth: "",
      accountId: accounts[0]?.id ? String(accounts[0].id) : "",
      categoryId: categories[0]?.id ? String(categories[0].id) : "",
      status: "active",
      notes: "",
    },
  });
  const mutation = useMutation({
    mutationFn: (values: SalaryFormValues) => createSalary(objectToFormData(values)),
    onSuccess: async () => {
      form.reset();
      await invalidateFinanceQueries(queryClient);
    },
  });

  return (
    <form className="mt-5 grid gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
      <SalaryFields accounts={accounts} categories={categories} disabled={disabled || mutation.isPending} form={form} />
      {mutation.error ? <p className="rounded-2xl border border-[#ff3131]/30 bg-[#ff3131]/10 p-3 text-sm text-[#ffd6d6]">{mutation.error.message}</p> : null}
      <AppButton
        className="inline-flex items-center justify-center rounded-2xl bg-[#39ff14] px-5 py-3 text-sm font-bold text-[#041006] transition hover:bg-[#7cff65] disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/40"
        disabled={disabled || mutation.isPending}
        type="submit"
      >
        Salvar salario
      </AppButton>
    </form>
  );
}

export function SalaryRowActions({
  salary,
  accounts,
  categories,
  disabled,
}: {
  salary: SalaryActionData;
  accounts: Option[];
  categories: Option[];
  disabled: boolean;
}) {
  const queryClient = useQueryClient();
  // The shadcn dialog is controlled so server mutation success can close it programmatically.
  const [open, setOpen] = useState(false);
  const form = useForm<UpdateSalaryFormValues>({
    resolver: zodResolver(updateSalaryFormSchema),
    defaultValues: {
      salaryId: salary.id,
      name: salary.name,
      amount: formatCentsForInput(salary.amountCents),
      paymentDay: salary.paymentDay,
      startMonth: salary.startMonth,
      endMonth: salary.endMonth ?? "",
      accountId: String(salary.accountId),
      categoryId: String(salary.categoryId),
      status: salary.status as "active" | "inactive",
      notes: salary.notes ?? "",
    },
  });
  const updateMutation = useMutation({
    mutationFn: (values: UpdateSalaryFormValues) => updateSalary(objectToFormData(values)),
    onSuccess: async () => {
      setOpen(false);
      await invalidateFinanceQueries(queryClient);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteSalary(objectToFormData({ salaryId: salary.id })),
    onSuccess: async () => {
      await invalidateFinanceQueries(queryClient);
    },
  });

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
          aria-label={`Editar ${salary.name}`}
          className="grid size-9 place-items-center rounded-xl border border-[#39ff14]/25 bg-[#39ff14]/10 text-[#39ff14] transition hover:bg-[#39ff14]/20"
        >
          <Pencil className="size-4" />
        </DialogTrigger>
        <DialogContent showCloseButton={false} className="glass-panel max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-[1.7rem] p-5 text-left text-[#eefbf1] sm:max-w-3xl">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <DialogTitle className="text-2xl font-semibold text-white">Editar salario</DialogTitle>
                    <DialogDescription className="mt-2 text-sm text-[#96a59b]">
                      Salarios ativos entram automaticamente nas entradas de todos os meses dentro do periodo definido.
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
                  <SalaryFields accounts={accounts} categories={categories} disabled={updateMutation.isPending} form={form} />
                  {updateMutation.error ? <p className="rounded-2xl border border-[#ff3131]/30 bg-[#ff3131]/10 p-3 text-sm text-[#ffd6d6]">{updateMutation.error.message}</p> : null}
                  <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <DialogClose className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10" type="button">
                      Cancelar
                    </DialogClose>
                    <AppButton className="rounded-2xl bg-[#39ff14] px-5 py-3 text-sm font-bold text-[#041006] transition hover:bg-[#7cff65] disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/40" disabled={updateMutation.isPending} type="submit">
                      Salvar salario
                    </AppButton>
                  </div>
                </form>
        </DialogContent>
      </Dialog>

      <AppButton
        aria-label={`Excluir ${salary.name}`}
        className="grid size-9 place-items-center rounded-xl border border-[#ff3131]/25 bg-[#ff3131]/10 text-[#ff4d4d] transition hover:bg-[#ff3131]/20 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={deleteMutation.isPending}
        type="button"
        onClick={() => {
          if (window.confirm("Excluir este salario mensal dos calculos?")) {
            deleteMutation.mutate();
          }
        }}
      >
        <Trash2 className="size-4" />
      </AppButton>
    </div>
  );
}

function SalaryFields<T extends SalaryFormValues | UpdateSalaryFormValues>({
  form,
  accounts,
  categories,
  disabled,
}: {
  form: import("react-hook-form").UseFormReturn<T>;
  accounts: Option[];
  categories: Option[];
  disabled: boolean;
}) {
  const accountOptions = toOptions(accounts, (account) => account.name);
  const categoryOptions = toOptions(categories, (category) => category.name);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput form={form} name={"name" as import("react-hook-form").FieldPath<T>} label="Nome" placeholder="Salario principal" disabled={disabled} />
        <FormInput form={form} name={"amount" as import("react-hook-form").FieldPath<T>} label="Valor mensal" inputMode="decimal" placeholder="6200,00" disabled={disabled} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FormInput form={form} name={"paymentDay" as import("react-hook-form").FieldPath<T>} label="Dia de pagamento" type="number" min={1} max={31} disabled={disabled} />
        <FormMonthPicker form={form} name={"startMonth" as import("react-hook-form").FieldPath<T>} label="Mes inicial" disabled={disabled} />
        <FormMonthPicker form={form} name={"endMonth" as import("react-hook-form").FieldPath<T>} label="Mes final" disabled={disabled} clearable />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormSelect form={form} name={"accountId" as import("react-hook-form").FieldPath<T>} label="Conta de recebimento" options={accountOptions} disabled={disabled} />
        <FormSelect form={form} name={"categoryId" as import("react-hook-form").FieldPath<T>} label="Categoria" options={categoryOptions} disabled={disabled} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormSelect
          form={form}
          name={"status" as import("react-hook-form").FieldPath<T>}
          label="Status"
          options={salaryStatuses.map((status) => ({ value: status.value, label: getSalaryStatusLabel(status.value) }))}
          disabled={disabled}
        />
        <FormInput form={form} name={"notes" as import("react-hook-form").FieldPath<T>} label="Observacoes" placeholder="Opcional" disabled={disabled} />
      </div>
    </>
  );
}

function toOptions(items: Option[], label: (item: Option) => string): SelectOption[] {
  return items.map((item) => ({ value: String(item.id), label: label(item) }));
}

function formatCentsForInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}
