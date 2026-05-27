import { connection } from "next/server";

import { AccountsPageClient } from "@/components/accounts-page-client";
import { getFinanceData } from "@/lib/data";
import { requireFamily } from "@/lib/auth-session";
import { serializeForClient } from "@/lib/finance-serialization";

export default async function AccountsPage() {
  await connection();

  const family = await requireFamily();
  const data = serializeForClient(await getFinanceData(undefined, undefined, family.organizationId));

  return <AccountsPageClient initialData={data} />;
}
