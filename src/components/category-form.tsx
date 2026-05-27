"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { createCategory } from "@/app/actions";
import { AppButton } from "@/components/app-button";
import { FormInput, FormSelect } from "@/components/form-fields";
import { objectToFormData } from "@/lib/form-data";
import { transactionTypes } from "@/lib/options";
import { invalidateFinanceQueries } from "@/lib/query-keys";
import { categoryFormSchema, type CategoryFormValues } from "@/lib/validations";

export function CategoryForm({ disabled }: { disabled: boolean }) {
  const queryClient = useQueryClient();
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      type: "expense",
      color: "#10b981",
    },
  });
  const mutation = useMutation({
    mutationFn: (values: CategoryFormValues) => createCategory(objectToFormData(values)),
    onSuccess: async () => {
      form.reset();
      await invalidateFinanceQueries(queryClient);
    },
  });
  const isDisabled = disabled || mutation.isPending;

  return (
    <form className="mt-5 grid gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
      <FormInput form={form} name="name" label="Nome" placeholder="Mercado" disabled={isDisabled} />
      <FormSelect
        form={form}
        name="type"
        label="Tipo"
        disabled={isDisabled}
        options={transactionTypes.map((type) => ({ value: type.value, label: type.label }))}
      />
      <FormInput form={form} name="color" label="Cor" type="color" disabled={isDisabled} />
      {mutation.error ? <p className="rounded-2xl border border-[#ff3131]/30 bg-[#ff3131]/10 p-3 text-sm text-[#ffd6d6]">{mutation.error.message}</p> : null}
      <AppButton className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/40" disabled={isDisabled} type="submit">
        Salvar categoria
      </AppButton>
    </form>
  );
}
