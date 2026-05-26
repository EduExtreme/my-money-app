"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { createAccount } from "@/app/actions";
import { AppButton } from "@/components/app-button";
import { FormInput, FormSelect } from "@/components/form-fields";
import { objectToFormData } from "@/lib/form-data";
import { accountTypes } from "@/lib/options";
import { invalidateFinanceQueries } from "@/lib/query-keys";
import { accountFormSchema, type AccountFormValues } from "@/lib/validations";

export function AccountForm({ disabled }: { disabled: boolean }) {
  const queryClient = useQueryClient();
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: "",
      type: "credit_card",
      institution: "",
      color: "#39ff14",
      creditLimit: "",
      closingDay: "",
      dueDay: "",
    },
  });
  const mutation = useMutation({
    mutationFn: (values: AccountFormValues) => createAccount(objectToFormData(values)),
    onSuccess: async () => {
      form.reset();
      await invalidateFinanceQueries(queryClient);
    },
  });
  const isDisabled = disabled || mutation.isPending;

  return (
    <form className="mt-5 grid gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
      <FormInput form={form} name="name" label="Nome" placeholder="Cartao principal" disabled={isDisabled} />
      <FormSelect
        form={form}
        name="type"
        label="Tipo"
        disabled={isDisabled}
        options={accountTypes.map((type) => ({ value: type.value, label: type.label }))}
      />
      <FormInput form={form} name="institution" label="Instituicao" placeholder="Banco, carteira ou operadora" disabled={isDisabled} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormInput form={form} name="color" label="Cor" type="color" disabled={isDisabled} />
        <FormInput form={form} name="creditLimit" label="Limite" placeholder="5000,00" disabled={isDisabled} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormInput form={form} name="closingDay" label="Fechamento" type="number" min={1} max={31} disabled={isDisabled} />
        <FormInput form={form} name="dueDay" label="Vencimento" type="number" min={1} max={31} disabled={isDisabled} />
      </div>
      {mutation.error ? <p className="rounded-2xl border border-[#ff3131]/30 bg-[#ff3131]/10 p-3 text-sm text-[#ffd6d6]">{mutation.error.message}</p> : null}
      <AppButton className="inline-flex items-center justify-center rounded-2xl bg-[#39ff14] px-5 py-3 text-sm font-bold text-[#041006] transition hover:bg-[#7cff65] disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/40" disabled={isDisabled} type="submit">
        Salvar conta
      </AppButton>
    </form>
  );
}
