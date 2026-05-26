import { NextResponse } from "next/server";

import { runFinanceWhatsappAgent } from "@/lib/ai/finance-agent";
import { normalizeRemoteJid, normalizeWhatsappPhone, sendEvolutionTextMessage } from "@/lib/integrations/evolution";
import {
  cancelPendingWhatsappAction,
  confirmPendingWhatsappAction,
  createPendingWhatsappTransaction,
  getActivePendingWhatsappAction,
  isCancelMessage,
  isConfirmMessage,
  recordIncomingWhatsappMessage,
} from "@/lib/services/whatsapp-actions";

export async function POST(request: Request) {
  const secret = process.env.EVOLUTION_WEBHOOK_SECRET;
  const requestSecret = new URL(request.url).searchParams.get("secret") ?? request.headers.get("x-evolution-secret");

  if (secret && requestSecret !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const payload = (await request.json()) as unknown;
  const message = parseEvolutionMessage(payload);

  if (!message || message.fromMe || message.remoteJid.includes("@g.us")) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const configuredInstance = process.env.EVOLUTION_INSTANCE_NAME;

  if (configuredInstance && message.instanceName && configuredInstance !== message.instanceName) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const allowedPhone = process.env.WHATSAPP_ALLOWED_PHONE ? normalizeWhatsappPhone(process.env.WHATSAPP_ALLOWED_PHONE) : null;

  if (allowedPhone && message.phone !== allowedPhone) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const record = await recordIncomingWhatsappMessage({
    messageId: message.messageId,
    instanceName: message.instanceName || configuredInstance || "default",
    remoteJid: message.remoteJid,
    phone: message.phone,
    text: message.text,
    event: message.event,
    rawPayload: payload,
  });

  if (record.duplicate) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  if (!message.text) {
    await sendEvolutionTextMessage({
      number: message.phone,
      text: "Por enquanto eu entendo apenas texto. Envie o gasto ou ganho em linguagem natural.",
    });

    return NextResponse.json({ ok: true });
  }

  const pendingAction = await getActivePendingWhatsappAction(message.phone);

  if (pendingAction && isConfirmMessage(message.text)) {
    await confirmPendingWhatsappAction(pendingAction);
    await sendEvolutionTextMessage({ number: message.phone, text: "Lancamento registrado com sucesso." });

    return NextResponse.json({ ok: true, confirmed: true });
  }

  if (pendingAction && isCancelMessage(message.text)) {
    await cancelPendingWhatsappAction(pendingAction);
    await sendEvolutionTextMessage({ number: message.phone, text: "Lancamento cancelado." });

    return NextResponse.json({ ok: true, cancelled: true });
  }

  if (!pendingAction && (isConfirmMessage(message.text) || isCancelMessage(message.text))) {
    await sendEvolutionTextMessage({
      number: message.phone,
      text: "Nao ha lancamento pendente para confirmar. Envie um gasto ou ganho primeiro.",
    });

    return NextResponse.json({ ok: true });
  }

  const agentResult = await runFinanceWhatsappAgent({ text: message.text, phone: message.phone });

  if (agentResult.kind === "transaction_proposal") {
    await createPendingWhatsappTransaction({
      phone: message.phone,
      sourceMessageId: message.messageId,
      summary: agentResult.summary,
      payload: agentResult.payload,
    });
    await sendEvolutionTextMessage({ number: message.phone, text: agentResult.summary });

    return NextResponse.json({ ok: true, proposed: true });
  }

  if (agentResult.kind === "clarification") {
    await sendEvolutionTextMessage({ number: message.phone, text: agentResult.message });
  }

  return NextResponse.json({ ok: true, ignored: agentResult.kind === "ignored" });
}

function parseEvolutionMessage(payload: unknown) {
  const root = asObject(payload);
  const data = asObject(root?.data);

  if (!root || !data) {
    return null;
  }

  const key = asObject(data.key);
  const message = asObject(data.message);
  const remoteJid = getString(key, "remoteJid") || getString(data, "remoteJid");
  const messageId = getString(key, "id") || getString(data, "id") || getString(data, "messageId");

  if (!remoteJid || !messageId) {
    return null;
  }

  return {
    event: getString(root, "event"),
    instanceName: getString(root, "instance") || getString(root, "instanceName") || getString(data, "instance"),
    remoteJid,
    phone: normalizeRemoteJid(remoteJid),
    messageId,
    fromMe: getBoolean(key, "fromMe"),
    text: extractMessageText(message),
  };
}

function extractMessageText(message: JsonObject | null) {
  if (!message) {
    return null;
  }

  const directText = getString(message, "conversation");

  if (directText) {
    return directText.trim();
  }

  const nestedText =
    getString(asObject(message.extendedTextMessage), "text") ||
    getString(asObject(message.imageMessage), "caption") ||
    getString(asObject(message.documentMessage), "caption") ||
    getString(asObject(message.videoMessage), "caption") ||
    getString(asObject(message.buttonsResponseMessage), "selectedDisplayText") ||
    getString(asObject(message.listResponseMessage), "title");

  return nestedText?.trim() || null;
}

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : null;
}

function getString(object: JsonObject | null, key: string) {
  const value = object?.[key];

  return typeof value === "string" ? value : null;
}

function getBoolean(object: JsonObject | null, key: string) {
  const value = object?.[key];

  return typeof value === "boolean" ? value : false;
}
