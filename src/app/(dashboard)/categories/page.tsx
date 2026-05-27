import { connection } from "next/server";

import { CategoriesPageClient } from "@/components/categories-page-client";
import { getFinanceData } from "@/lib/data";
import { requireFamily } from "@/lib/auth-session";
import { serializeForClient } from "@/lib/finance-serialization";

export default async function CategoriesPage() {
  await connection();

  const family = await requireFamily();
  const data = serializeForClient(await getFinanceData(undefined, undefined, family.organizationId));

  return <CategoriesPageClient initialData={data} />;
}
