import type { QueryClient } from "@tanstack/react-query";

import type { FinanceQueryInput } from "@/lib/finance-types";

export const queryKeys = {
  accounts: ["accounts"] as const,
  categories: ["categories"] as const,
  finance: ["finance"] as const,
  futureExpenses: ["future-expenses"] as const,
  salaries: ["salaries"] as const,
  transactionFormData: ["transaction-form-data"] as const,
  transactions: ["transactions"] as const,
};

export function getFinanceDataQueryKey(input?: FinanceQueryInput) {
  return [queryKeys.finance[0], input?.month ?? null, input?.year ?? null] as const;
}

export function invalidateFinanceQueries(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts }),
    queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
    queryClient.invalidateQueries({ queryKey: queryKeys.finance }),
    queryClient.invalidateQueries({ queryKey: queryKeys.futureExpenses }),
    queryClient.invalidateQueries({ queryKey: queryKeys.salaries }),
    queryClient.invalidateQueries({ queryKey: queryKeys.transactionFormData }),
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions }),
  ]);
}
