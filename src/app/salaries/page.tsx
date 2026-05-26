import { connection } from "next/server";

import { SalariesPageClient } from "@/components/salaries-page-client";
import { getFinanceData } from "@/lib/data";
import { getCurrentMonth } from "@/lib/dates";
import { serializeForClient } from "@/lib/finance-serialization";
import { getSearchParam, type SearchParams } from "@/lib/search-params";

export default async function SalariesPage({ searchParams }: { searchParams: SearchParams }) {
  await connection();

  const params = await searchParams;
  const selectedMonth = getSearchParam(params.month) ?? getCurrentMonth();
  const data = serializeForClient(await getFinanceData(selectedMonth, Number(selectedMonth.slice(0, 4))));

  return <SalariesPageClient initialData={data} initialMonth={selectedMonth} />;
}
