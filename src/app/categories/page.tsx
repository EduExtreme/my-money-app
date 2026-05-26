import { connection } from "next/server";

import { CategoriesPageClient } from "@/components/categories-page-client";
import { getFinanceData } from "@/lib/data";
import { serializeForClient } from "@/lib/finance-serialization";

export default async function CategoriesPage() {
  await connection();

  const data = serializeForClient(await getFinanceData());

  return <CategoriesPageClient initialData={data} />;
}
