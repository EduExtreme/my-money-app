import { connection } from "next/server";

import { ReportsPageClient } from "@/components/reports-page-client";
import { getFinanceData } from "@/lib/data";
import { getCurrentMonth, getCurrentYear } from "@/lib/dates";
import { serializeForClient } from "@/lib/finance-serialization";
import { getSearchParam, type SearchParams } from "@/lib/search-params";

export default async function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  await connection();

  const params = await searchParams;
  const selectedYear = Number(getSearchParam(params.year) ?? getCurrentYear());
  const selectedMonth = `${selectedYear}-${getCurrentMonth().slice(5, 7)}`;
  const data = serializeForClient(await getFinanceData(selectedMonth, selectedYear));

  return <ReportsPageClient initialData={data} initialMonth={selectedMonth} initialYear={selectedYear} />;
}
