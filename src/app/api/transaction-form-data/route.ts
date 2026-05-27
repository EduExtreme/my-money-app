import { getBasicFormData } from "@/lib/data";
import { getCurrentFamily } from "@/lib/auth-session";

export async function GET() {
  const family = await getCurrentFamily();

  if (!family) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const data = await getBasicFormData(family.organizationId);

  return Response.json({
    accounts: data.accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
    })),
    categories: data.categories.map((category) => ({
      id: category.id,
      name: category.name,
      type: category.type,
    })),
    mode: data.mode,
    databaseMessage: data.databaseMessage,
  });
}
