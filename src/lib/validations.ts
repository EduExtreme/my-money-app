import { z } from "zod";

const optionalNumber = z.preprocess((value) => (value === "" ? undefined : value), z.coerce.number().int().optional());
const optionalText = z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), z.string().trim().optional());

export const currencyStringSchema = z
  .string()
  .trim()
  .min(1, "Informe um valor.")
  .regex(/^R?\$?\s?\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$|^\d+(\.\d{1,2})?$/, "Informe um valor em BRL valido.");

export const accountFormSchema = z.object({
  name: z.string().trim().min(2, "Informe um nome."),
  type: z.enum(["credit_card", "debit_card", "pix", "bank", "cash"]),
  institution: optionalText,
  color: z.string().trim().min(4, "Informe uma cor."),
  creditLimit: z.union([currencyStringSchema, z.literal("")]).optional(),
  closingDay: optionalNumber.refine((value) => value === undefined || (value >= 1 && value <= 31), "Dia invalido."),
  dueDay: optionalNumber.refine((value) => value === undefined || (value >= 1 && value <= 31), "Dia invalido."),
});

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Informe um nome."),
  type: z.enum(["income", "expense"]),
  color: z.string().trim().min(4, "Informe uma cor."),
});

export const transactionFormSchema = z.object({
  description: z.string().trim().min(2, "Informe uma descricao."),
  type: z.enum(["income", "expense"]),
  amount: currencyStringSchema,
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data valida."),
  accountId: z.coerce.number().int().positive("Selecione uma conta."),
  categoryId: z.coerce.number().int().positive("Selecione uma categoria."),
  installments: z.coerce.number().int().min(1, "Minimo de 1 parcela.").max(360, "Maximo de 360 parcelas."),
  status: z.enum(["planned", "paid"]),
  notes: optionalText,
});

export const updateTransactionGroupFormSchema = transactionFormSchema.extend({
  groupId: z.coerce.number().int().positive(),
});

export const futureExpenseFormSchema = transactionFormSchema.extend({
  type: z.literal("expense"),
  status: z.literal("planned"),
});

export const futureExpensePlannerFormSchema = z.object({
  description: z.string().trim().min(2, "Informe uma descricao."),
  amount: currencyStringSchema,
  startMonth: z.string().regex(/^\d{4}-\d{2}$/, "Informe o mes inicial."),
  day: z.coerce.number().int().min(1, "Dia invalido.").max(31, "Dia invalido."),
  accountId: z.coerce.number().int().positive("Selecione uma conta."),
  categoryId: z.coerce.number().int().positive("Selecione uma categoria."),
  installments: z.coerce.number().int().min(1, "Minimo de 1 parcela.").max(360, "Maximo de 360 parcelas."),
  notes: optionalText,
});

export const deleteTransactionGroupFormSchema = z.object({
  groupId: z.coerce.number().int().positive(),
});

export const salaryFormSchema = z.object({
  name: z.string().trim().min(2, "Informe um nome."),
  amount: currencyStringSchema,
  paymentDay: z.coerce.number().int().min(1, "Dia invalido.").max(31, "Dia invalido."),
  startMonth: z.string().regex(/^\d{4}-\d{2}$/, "Informe o mes inicial."),
  endMonth: z.union([z.string().regex(/^\d{4}-\d{2}$/), z.literal("")]).optional(),
  accountId: z.coerce.number().int().positive("Selecione uma conta."),
  categoryId: z.coerce.number().int().positive("Selecione uma categoria."),
  status: z.enum(["active", "inactive"]),
  notes: optionalText,
});

export const updateSalaryFormSchema = salaryFormSchema.extend({
  salaryId: z.coerce.number().int().positive(),
});

export const deleteSalaryFormSchema = z.object({
  salaryId: z.coerce.number().int().positive(),
});

export type AccountFormValues = z.input<typeof accountFormSchema>;
export type CategoryFormValues = z.input<typeof categoryFormSchema>;
export type TransactionFormValues = z.input<typeof transactionFormSchema>;
export type UpdateTransactionGroupFormValues = z.input<typeof updateTransactionGroupFormSchema>;
export type FutureExpenseFormValues = z.input<typeof futureExpenseFormSchema>;
export type FutureExpensePlannerFormValues = z.input<typeof futureExpensePlannerFormSchema>;
export type SalaryFormValues = z.input<typeof salaryFormSchema>;
export type UpdateSalaryFormValues = z.input<typeof updateSalaryFormSchema>;
