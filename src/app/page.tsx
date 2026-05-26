import { connection } from "next/server";

import { DashboardPageClient } from "@/components/dashboard-page-client";
import { getFinanceData } from "@/lib/data";
import { getCurrentMonth, getCurrentYear } from "@/lib/dates";
import { serializeForClient } from "@/lib/finance-serialization";
import { getSearchParam, type SearchParams } from "@/lib/search-params";

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  await connection();

  const params = await searchParams;
  const selectedMonth = getSearchParam(params.month) ?? getCurrentMonth();
  const selectedYear = Number(getSearchParam(params.year) ?? selectedMonth.slice(0, 4) ?? getCurrentYear());
  const data = serializeForClient(await getFinanceData(selectedMonth, selectedYear));

  return <DashboardPageClient initialData={data} initialMonth={selectedMonth} initialYear={selectedYear} />;
}
