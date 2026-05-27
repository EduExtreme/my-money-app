import { connection } from "next/server";

import { FutureExpensesPageClient } from "@/components/future-expenses-page-client";
import { getFinanceData } from "@/lib/data";
import { requireFamily } from "@/lib/auth-session";
import { addMonthsToDateInput, getCurrentDateInput } from "@/lib/dates";
import { serializeForClient } from "@/lib/finance-serialization";
import { getSearchParam, type SearchParams } from "@/lib/search-params";

export default async function FutureExpensesPage({ searchParams }: { searchParams: SearchParams }) {
  await connection();

  const params = await searchParams;
  const defaultMonth = addMonthsToDateInput(getCurrentDateInput(), 1).slice(0, 7);
  const selectedMonth = getSearchParam(params.month) ?? defaultMonth;
  const family = await requireFamily();
  const data = serializeForClient(await getFinanceData(selectedMonth, Number(selectedMonth.slice(0, 4)), family.organizationId));

  return <FutureExpensesPageClient initialData={data} initialMonth={selectedMonth} />;
}
