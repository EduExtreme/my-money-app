import { connection } from "next/server";

import { AccountsPageClient } from "@/components/accounts-page-client";
import { getFinanceData } from "@/lib/data";
import { serializeForClient } from "@/lib/finance-serialization";

export default async function AccountsPage() {
  await connection();

  const data = serializeForClient(await getFinanceData());

  return <AccountsPageClient initialData={data} />;
}
