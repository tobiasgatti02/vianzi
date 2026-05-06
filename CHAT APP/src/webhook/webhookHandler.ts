import { Request, Response } from "express";
import { getDealerBySlug } from "../storage/dealers.store.js";
import { addMessage } from "../storage/messages.store.js";
import { classifyIntent } from "../ml/intentClassifier.js";
import { detectModelsFromText } from "../catalog/detectModel.js";

const processedInbound = new Map<string, number>();
const DEDUPE_TTL_MS = 10 * 60 * 1000;

function isDuplicateInbound(messageId: string) {
  const now = Date.now();
  for (const [id, ts] of processedInbound.entries()) {
    if (now - ts > DEDUPE_TTL_MS) processedInbound.delete(id);
  }
  if (processedInbound.has(messageId)) return true;
  processedInbound.set(messageId, now);
  return false;
}

export default async function webhookHandler(req: Request, res: Response) {
  try {
    const slug = (req.params as any)?.slug || req.query.slug;
    const dealer = slug ? await getDealerBySlug(String(slug)) : null;

    // GET verify
    if (req.method === "GET") {
      const mode = req.query["hub.mode"] as string | undefined;
      const token = req.query["hub.verify_token"] as string | undefined;
      const challenge = req.query["hub.challenge"] as string | undefined;

      if (mode === "subscribe" && dealer && token === dealer.webhook_verify_token) {
        return res.status(200).send(challenge ?? "");
      }
      return res.sendStatus(403);
    }

    // Respond fast for POST to avoid retries
    res.sendStatus(200);

    if (!dealer) return;

    const body: any = req.body;
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];
    if (!message) return;

    const inboundId = message.id as string;
    if (!inboundId || isDuplicateInbound(inboundId)) return;

    const from = String(message.from);
    const name: string | null = value?.contacts?.[0]?.profile?.name || null;
    let text = "";

    if (message.type === "text") {
      text = message.text?.body || "";
    } else if (message.type === "interactive") {
      const btn = message.interactive?.button_reply;
      const lst = message.interactive?.list_reply;
      const choice = btn?.title || lst?.title || "";
      text = choice;
    } else {
      return; // ignore other types here
    }

    // Minimal enrichment
    const detectedModels = detectModelsFromText(text) || [];
    const intentSignal = classifyIntent(text);

    // Persist inbound for dashboard
    await addMessage(dealer.id, from, {
      sender: "user",
      type: "text",
      content: text,
      created_at: new Date(),
      message_id: inboundId,
    } as any);

    // Auto-replies can be re-added once engine is fully migrated
    // For now, store inbound only to avoid coupling with legacy engine
    // console.log("Inbound:", { from, name, text, intentSignal, detectedModels });
  } catch (err: any) {
    console.error("❌ Error en webhookHandler:", err?.response?.data || err);
  }
}
