import { getBasicFormData } from "@/lib/data";

export async function GET() {
  const data = await getBasicFormData();

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
