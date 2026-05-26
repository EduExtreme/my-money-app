import { connection } from "next/server";

import { TransactionsPageClient } from "@/components/transactions-page-client";
import { getFinanceData } from "@/lib/data";
import { getCurrentMonth } from "@/lib/dates";
import { serializeForClient } from "@/lib/finance-serialization";
import { getSearchParam, type SearchParams } from "@/lib/search-params";

export default async function TransactionsPage({ searchParams }: { searchParams: SearchParams }) {
  await connection();

  const params = await searchParams;
  const selectedMonth = getSearchParam(params.month) ?? getCurrentMonth();
  const selectedType = (getSearchParam(params.type) ?? "all") as "all" | "income" | "expense";
  const data = serializeForClient(await getFinanceData(selectedMonth, Number(selectedMonth.slice(0, 4))));

  return <TransactionsPageClient initialData={data} initialMonth={selectedMonth} initialType={selectedType} />;
}
