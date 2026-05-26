"use client";

import { useQuery } from "@tanstack/react-query";

import { getFinanceDataQueryKey } from "@/lib/query-keys";
import type { FinanceData, FinanceQueryInput } from "@/lib/finance-types";

export function useFinanceDataQuery({
  input,
  initialData,
  initialInput,
}: {
  input?: FinanceQueryInput;
  initialData: FinanceData;
  initialInput?: FinanceQueryInput;
}) {
  const normalizedInput = normalizeFinanceQueryInput(input);
  const normalizedInitialInput = normalizeFinanceQueryInput(initialInput);
  const isInitialQuery =
    normalizedInput.month === normalizedInitialInput.month && normalizedInput.year === normalizedInitialInput.year;

  return useQuery({
    queryKey: getFinanceDataQueryKey(input),
    queryFn: () => fetchFinanceData(input),
    initialData: isInitialQuery ? initialData : undefined,
  });
}

export async function fetchFinanceData(input?: FinanceQueryInput) {
  const params = new URLSearchParams();

  if (input?.month) {
    params.set("month", input.month);
  }

  if (input?.year) {
    params.set("year", String(input.year));
  }

  const response = await fetch(`/api/finance-data${params.size ? `?${params}` : ""}`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar os dados financeiros.");
  }

  return (await response.json()) as FinanceData;
}

function normalizeFinanceQueryInput(input?: FinanceQueryInput) {
  return {
    month: input?.month ?? null,
    year: input?.year ?? null,
  };
}
