import "server-only";

import { addMinutes } from "date-fns";
import { and, desc, eq, gt } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/client";
import { whatsappMessages, whatsappPendingActions, type WhatsappPendingAction } from "@/db/schema";
import { createTransactionRecord } from "@/lib/services/transactions";

export const whatsappTransactionPayloadSchema = z.object({
  description: z.string().trim().min(2),
  type: z.enum(["income", "expense"]),
  amount: z.string().trim().min(1),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  accountId: z.number().int().positive(),
  categoryId: z.number().int().positive(),
  installments: z.number().int().min(1).max(360),
  status: z.enum(["planned", "paid"]),
  notes: z.string().trim().optional(),
});

export type WhatsappTransactionPayload = z.infer<typeof whatsappTransactionPayloadSchema>;

export async function recordIncomingWhatsappMessage(input: {
  messageId: string;
  instanceName: string;
  remoteJid: string;
  phone: string;
  text: string | null;
  event: string | null;
  rawPayload: unknown;
}) {
  const db = getDb();
  const existing = await db
    .select({ id: whatsappMessages.id })
    .from(whatsappMessages)
    .where(eq(whatsappMessages.messageId, input.messageId))
    .limit(1);

  if (existing.length) {
    return { duplicate: true } as const;
  }

  await db.insert(whatsappMessages).values({
    messageId: input.messageId,
    instanceName: input.instanceName,
    remoteJid: input.remoteJid,
    phone: input.phone,
    direction: "inbound",
    text: input.text,
    event: input.event,
    rawPayload: input.rawPayload,
  });

  return { duplicate: false } as const;
}

export async function createPendingWhatsappTransaction(input: {
  phone: string;
  sourceMessageId: string;
  summary: string;
  payload: WhatsappTransactionPayload;
}) {
  const db = getDb();
  const now = new Date();

  await db
    .update(whatsappPendingActions)
    .set({ status: "superseded", resolvedAt: now })
    .where(and(eq(whatsappPendingActions.phone, input.phone), eq(whatsappPendingActions.status, "pending")));

  const [action] = await db
    .insert(whatsappPendingActions)
    .values({
      phone: input.phone,
      status: "pending",
      actionType: "create_transaction",
      summary: input.summary,
      payload: input.payload,
      sourceMessageId: input.sourceMessageId,
      expiresAt: addMinutes(now, 30),
    })
    .returning();

  return action;
}

export async function getActivePendingWhatsappAction(phone: string) {
  const db = getDb();
  const [action] = await db
    .select()
    .from(whatsappPendingActions)
    .where(
      and(
        eq(whatsappPendingActions.phone, phone),
        eq(whatsappPendingActions.status, "pending"),
        gt(whatsappPendingActions.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(whatsappPendingActions.createdAt))
    .limit(1);

  return action ?? null;
}

export async function confirmPendingWhatsappAction(action: WhatsappPendingAction) {
  if (action.actionType !== "create_transaction") {
    throw new Error("Acao pendente nao suportada.");
  }

  const payload = whatsappTransactionPayloadSchema.parse(action.payload);
  await createTransactionRecord(payload);

  await getDb()
    .update(whatsappPendingActions)
    .set({ status: "confirmed", resolvedAt: new Date() })
    .where(eq(whatsappPendingActions.id, action.id));
}

export async function cancelPendingWhatsappAction(action: WhatsappPendingAction) {
  await getDb()
    .update(whatsappPendingActions)
    .set({ status: "cancelled", resolvedAt: new Date() })
    .where(eq(whatsappPendingActions.id, action.id));
}

export function isConfirmMessage(text: string) {
  return ["sim", "s", "confirmar", "confirma", "ok", "pode", "yes"].includes(normalizeReply(text));
}

export function isCancelMessage(text: string) {
  return ["nao", "n", "cancelar", "cancela", "no"].includes(normalizeReply(text));
}

function normalizeReply(text: string) {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
