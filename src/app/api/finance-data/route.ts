import { z } from "zod";

import { getFinanceData } from "@/lib/data";
import { serializeForClient } from "@/lib/finance-serialization";

const financeQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = financeQuerySchema.safeParse({
    month: url.searchParams.get("month") ?? undefined,
    year: url.searchParams.get("year") ?? undefined,
  });

  if (!parsed.success) {
    return Response.json({ error: "Filtros invalidos." }, { status: 400 });
  }

  const data = await getFinanceData(parsed.data.month, parsed.data.year);

  return Response.json(serializeForClient(data));
}
