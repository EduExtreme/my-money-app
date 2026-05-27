export const accountTypes = [
  { value: "credit_card", label: "Cartão de crédito" },
  { value: "debit_card", label: "Cartão de débito" },
  { value: "pix", label: "Pix" },
  { value: "bank", label: "Conta bancária" },
  { value: "cash", label: "Dinheiro" },
] as const;

export const transactionTypes = [
  { value: "income", label: "Entrada" },
  { value: "expense", label: "Saída" },
] as const;

export const transactionStatuses = [
  { value: "planned", label: "Previsto" },
  { value: "paid", label: "Pago" },
] as const;

export const salaryStatuses = [
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
] as const;

export function getAccountTypeLabel(type: string) {
  return accountTypes.find((item) => item.value === type)?.label ?? type;
}

export function getTransactionTypeLabel(type: string) {
  return transactionTypes.find((item) => item.value === type)?.label ?? type;
}

export function getStatusLabel(status: string) {
  return transactionStatuses.find((item) => item.value === status)?.label ?? status;
}

export function getSalaryStatusLabel(status: string) {
  return salaryStatuses.find((item) => item.value === status)?.label ?? status;
}
