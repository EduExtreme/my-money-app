import "server-only";

import { google } from "@ai-sdk/google";
import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";

import { getBasicFormData } from "@/lib/data";
import { formatDateInput, getCurrentDateInput } from "@/lib/dates";
import { formatCurrency } from "@/lib/money";
import { whatsappTransactionPayloadSchema, type WhatsappTransactionPayload } from "@/lib/services/whatsapp-actions";

type FinanceAgentResult =
  | {
      kind: "transaction_proposal";
      summary: string;
      payload: WhatsappTransactionPayload;
    }
  | {
      kind: "clarification";
      message: string;
    }
  | {
      kind: "ignored";
      message: string;
    };

const transactionProposalInputSchema = z.object({
  description: z.string().describe("Short transaction description in Portuguese."),
  type: z.enum(["income", "expense"]).describe("income for money received, expense for money spent."),
  amountCents: z.number().int().positive().describe("Total amount in BRL cents."),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Transaction date in yyyy-MM-dd."),
  accountHint: z.string().optional().describe("Account hint from user, such as pix, cartao, debito, banco or cash."),
  categoryHint: z.string().optional().describe("Category hint from user, such as mercado, transporte, salario."),
  installments: z.number().int().min(1).max(360).describe("Number of installments. Use 1 unless user says parcelado."),
  status: z.enum(["planned", "paid"]).describe("paid for past/today completed transactions, planned for future expenses."),
  notes: z.string().optional().describe("Optional short note."),
});

export async function runFinanceWhatsappAgent(input: { text: string; phone: string }): Promise<FinanceAgentResult> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return {
      kind: "clarification",
      message: "Gemini ainda nao esta configurado. Defina GOOGLE_GENERATIVE_AI_API_KEY no .env.local.",
    } satisfies FinanceAgentResult;
  }

  let agentResult: FinanceAgentResult | null = null;
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const tools = {
    get_finance_context: tool({
      description: "Get available accounts and categories from My Money App before proposing a transaction.",
      inputSchema: z.object({}),
      execute: async () => {
        const context = await getBasicFormData();

        return {
          mode: context.mode,
          accounts: context.accounts.map((account) => ({ id: account.id, name: account.name, type: account.type })),
          categories: context.categories.map((category) => ({ id: category.id, name: category.name, type: category.type })),
        };
      },
    }),
    propose_transaction: tool({
      description: "Propose one financial transaction from the user's WhatsApp message. This does not save anything.",
      inputSchema: transactionProposalInputSchema,
      strict: true,
      execute: async (proposal) => {
        agentResult = await buildTransactionProposal(proposal);

        return agentResult;
      },
    }),
    ask_clarification: tool({
      description: "Ask a short question when the message is missing value, type, date, account or category.",
      inputSchema: z.object({
        message: z.string().describe("Short question in Portuguese."),
      }),
      execute: async ({ message }) => {
        agentResult = { kind: "clarification", message };

        return agentResult;
      },
    }),
    ignore_message: tool({
      description: "Ignore messages that are not about registering income or expenses.",
      inputSchema: z.object({
        reason: z.string().optional(),
      }),
      execute: async ({ reason }) => {
        agentResult = {
          kind: "ignored",
          message: reason || "Mensagem ignorada porque nao parece ser um lancamento financeiro.",
        };

        return agentResult;
      },
    }),
  };

  const result = await generateText({
    model: google(modelName),
    tools,
    stopWhen: stepCountIs(4),
    toolChoice: "required",
    temperature: 0.1,
    system: [
      "Voce e um agente financeiro do My Money App.",
      "Interprete mensagens de WhatsApp em portugues brasileiro.",
      "Sempre use uma tool. Nunca diga que salvou algo diretamente.",
      "Para gastos, use type expense. Para dinheiro recebido, use type income.",
      "Valores devem ser convertidos para centavos de BRL.",
      "Se o usuario disser hoje, use a data atual informada. Se disser uma data futura, use status planned.",
      "Compras parceladas devem usar installments com o total de parcelas informado.",
      "Se faltar o valor ou nao for claramente uma transacao, use ask_clarification ou ignore_message.",
      "Todas as transacoes precisam de confirmacao humana depois, entao a tool propose_transaction apenas cria uma proposta.",
    ].join("\n"),
    prompt: [
      `Data atual: ${getCurrentDateInput()}`,
      `Telefone do usuario: ${input.phone}`,
      `Mensagem: ${input.text}`,
    ].join("\n"),
  });

  return agentResult ?? ({ kind: "clarification", message: result.text || "Nao consegui entender esse lancamento." } satisfies FinanceAgentResult);
}

async function buildTransactionProposal(input: z.infer<typeof transactionProposalInputSchema>): Promise<FinanceAgentResult> {
  const context = await getBasicFormData();

  if (context.mode !== "database") {
    return {
      kind: "clarification",
      message: "Nao consegui acessar o banco de dados para registrar lancamentos reais.",
    };
  }

  const account = resolveAccount(context.accounts, input.accountHint, input.type);
  const category = resolveCategory(context.categories, input.type, input.categoryHint || input.description);

  if (!account || !category) {
    return {
      kind: "clarification",
      message: "Nao encontrei conta ou categoria compativel. Cadastre uma conta/categoria ou informe melhor onde lancar.",
    };
  }

  const payload = whatsappTransactionPayloadSchema.parse({
    description: input.description,
    type: input.type,
    amount: formatAmountForInput(input.amountCents),
    transactionDate: input.transactionDate,
    accountId: account.id,
    categoryId: category.id,
    installments: input.type === "expense" ? input.installments : 1,
    status: input.status,
    notes: input.notes,
  });
  const summary = [
    "Confirma registrar?",
    "",
    `${input.type === "expense" ? "Saida" : "Entrada"}: ${payload.description}`,
    `Valor: ${formatCurrency(input.amountCents)}`,
    `Data: ${formatDateInput(payload.transactionDate)}`,
    `Conta: ${account.name}`,
    `Categoria: ${category.name}`,
    `Parcelas: ${payload.installments}`,
    `Status: ${payload.status === "paid" ? "Pago" : "Planejado"}`,
    "",
    "Responda SIM para confirmar ou NAO para cancelar.",
  ].join("\n");

  return {
    kind: "transaction_proposal",
    summary,
    payload,
  };
}

function resolveAccount(accounts: Array<{ id: number; name: string; type: string }>, hint: string | undefined, type: "income" | "expense") {
  const normalizedHint = normalizeText(hint || "");

  if (normalizedHint) {
    const byName = accounts.find((account) => normalizeText(account.name).includes(normalizedHint));

    if (byName) {
      return byName;
    }

    const byType = accounts.find((account) => accountTypeAliases(account.type).some((alias) => normalizedHint.includes(alias)));

    if (byType) {
      return byType;
    }
  }

  if (type === "income") {
    return accounts.find((account) => account.type !== "credit_card") ?? accounts[0] ?? null;
  }

  return accounts[0] ?? null;
}

function resolveCategory(categories: Array<{ id: number; name: string; type: string }>, type: "income" | "expense", hint: string) {
  const typedCategories = categories.filter((category) => category.type === type);
  const normalizedHint = normalizeText(hint);
  const direct = typedCategories.find((category) => {
    const categoryName = normalizeText(category.name);

    return categoryName.includes(normalizedHint) || normalizedHint.includes(categoryName);
  });

  if (direct) {
    return direct;
  }

  const alias = categoryAliases.find((item) => item.terms.some((term) => normalizedHint.includes(term)) && item.type === type);

  if (alias) {
    const category = typedCategories.find((item) => normalizeText(item.name).includes(alias.category));

    if (category) {
      return category;
    }
  }

  return typedCategories[0] ?? null;
}

function accountTypeAliases(type: string) {
  const aliases: Record<string, string[]> = {
    credit_card: ["cartao", "credito", "credit"],
    debit_card: ["debito", "debit"],
    pix: ["pix"],
    bank: ["banco", "conta"],
    cash: ["dinheiro", "cash"],
  };

  return aliases[type] ?? [];
}

const categoryAliases = [
  { type: "expense", category: "mercado", terms: ["mercado", "supermercado", "atacadao", "carrefour", "extra", "pao de acucar"] },
  { type: "expense", category: "transporte", terms: ["uber", "99", "metro", "onibus", "gasolina", "combustivel", "transporte"] },
  { type: "expense", category: "moradia", terms: ["aluguel", "condominio", "luz", "agua", "internet", "moradia"] },
  { type: "expense", category: "assinaturas", terms: ["netflix", "spotify", "prime", "assinatura", "mensalidade"] },
  { type: "income", category: "salario", terms: ["salario", "pagamento", "ordenado"] },
  { type: "income", category: "freelance", terms: ["freela", "freelance", "cliente", "projeto"] },
] as const;

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatAmountForInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}
