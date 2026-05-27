import "server-only";

export function normalizeWhatsappPhone(value: string) {
  return value.replace(/\D/g, "");
}

export function normalizeRemoteJid(value: string) {
  return normalizeWhatsappPhone(value.split("@")[0] ?? value);
}

export async function sendEvolutionTextMessage(input: { number: string; text: string }) {
  const apiUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, "");
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instanceName = process.env.EVOLUTION_INSTANCE_NAME;

  if (!apiUrl || !apiKey || !instanceName) {
    return { sent: false, reason: "Evolution API não configurada." } as const;
  }

  const response = await fetch(`${apiUrl}/message/sendText/${instanceName}`, {
    method: "POST",
    headers: {
      apikey: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      number: normalizeWhatsappPhone(input.number),
      text: input.text,
      delay: 500,
      linkPreview: false,
    }),
  });

  if (!response.ok) {
    return { sent: false, reason: await response.text() } as const;
  }

  return { sent: true } as const;
}
