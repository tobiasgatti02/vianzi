import { sendText } from "../whatsapp/sendText.js";
import { sendInteractive } from "../whatsapp/sendInteractive.js";
import { buildInteractive } from "../whatsapp/buildInteractive.js";
import { generateAIResponse } from "../ai/generateAIResponse.js";

import { getDealerBySlug } from "../storage/dealers.store.js";

import { upsertLead } from "../storage/leads.store.js";
import { addMessage } from "../storage/messages.store.js";

import { getSession, updateSession } from "../sessions/sessionStore.js";
import { detectModelsFromText } from "../catalog/detectModel.js";
import { classifyIntent } from "../ml/intentClassifier.js";
import { processMessage } from "../engine/conversationEngine.js";

/**
 * ✅ Deduplicación de inbound por wamid (evita duplicados por retries del webhook)
 */
const processedInbound = new Map(); // messageId -> timestamp
const DEDUPE_TTL_MS = 10 * 60 * 1000;
function isDuplicateInbound(messageId) {
  const now = Date.now();
  for (const [id, ts] of processedInbound.entries()) {
    if (now - ts > DEDUPE_TTL_MS) processedInbound.delete(id);
  }
  if (processedInbound.has(messageId)) return true;
  processedInbound.set(messageId, now);
  return false;
}

/**
 * ✅ Fallback si OpenAI no está (o falla). No divaga, es corto y funcional.
 */
function fallbackReply(intent) {
  switch (intent) {
    case "ASK_NAME":
      return "Hola 👋 Antes de ayudarte, ¿cómo te llamás?";
    case "ASK_NAME_CONFIRM":
      return "Hola 👋 ¿Te llamás así?";
    case "WIZ_USE_CASE":
      return "¿Para qué lo vas a usar? (Uber/Apps, familiar, primer auto, carga)";
    case "WIZ_MODEL":
      return "¿Qué modelo te interesa? (Cronos, Pulse, Strada, Toro)";
    case "WIZ_VERSION":
      return "¿Qué versión te interesa? (Base, Intermedia o Full)";
    case "WIZ_PAYMENT":
      return "¿Pensás pagar contado o con cuotas?";
    case "WIZ_TIMING":
      return "¿Cuándo te gustaría avanzar? (hoy / esta semana / este mes)";
    default:
      return "Dale, contame modelo y forma de pago y lo resolvemos.";
  }
}

/**
 * ✅ Compatibilidad: algunos módulos tuyos pueden estar con firma vieja o nueva.
 * - sendText(creds,to,msg) o sendText(to,msg)
 * - sendInteractive(creds,to,obj) o sendInteractive(to,obj)
 * - upsertLead(dealerId,lead) o upsertLead(lead)
 * - addMessage(dealerId,leadId,msg) o addMessage(leadId,msg)
 */
async function safeSendText(creds, to, msg) {
  try {
    if (sendText.length >= 3) return await sendText(creds, to, msg);
    return await sendText(to, msg);
  } catch (e) {
    throw e;
  }
}

async function safeSendInteractive(creds, to, interactive) {
  try {
    if (sendInteractive.length >= 3) return await sendInteractive(creds, to, interactive);
    return await sendInteractive(to, interactive);
  } catch (e) {
    throw e;
  }
}

async function safeUpsertLead(dealerId, lead) {
  if (upsertLead.length >= 2) return await upsertLead(dealerId, lead);
  return await upsertLead(lead);
}

async function safeAddMessage(dealerId, leadId, msg) {
  if (addMessage.length >= 3) return await addMessage(dealerId, leadId, msg);
  return await addMessage(leadId, msg);
}

export default async function webhookHandler(req, res) {
  try {
    /**
     * 1) Resolver dealer por slug (multi-concesionario)
     */
    

    /**
     * 2) Verificación GET del webhook (Meta)
     *    IMPORTANTE: debe responder el challenge, NO sendStatus(200) fijo
     */
    if (req.method === "GET") {
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      if (mode === "subscribe" && token === dealer.webhook_verify_token) {
        return res.status(200).send(challenge);
      }
      return res.sendStatus(403);
    }

    /**
     * 3) POST: responder 200 rápido para que Meta no reintente.
     */
    res.sendStatus(200);

    /**
     * 4) Parse webhook payload
     */
    const body = req.body;
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    const message = value?.messages?.[0];
    if (!message) return;
    if (message.type !== "text" && message.type !== "interactive") return;

    const inboundId = message.id;
    if (isDuplicateInbound(inboundId)) {
      console.log("🔁 Inbound duplicado ignorado:", inboundId);
      return;
    }

    const from = message.from;
    const name = value?.contacts?.[0]?.profile?.name || null;

    // ===== Texto + choiceId (wizard) =====
    let text = "";
    let choiceId = null;

    if (message.type === "text") {
      text = message.text?.body || "";
    } else {
      const btn = message.interactive?.button_reply;
      const lst = message.interactive?.list_reply;
      choiceId = btn?.id || lst?.id || null;
      text = btn?.title || lst?.title || "";
    }

    console.log("📨 Entrante:", from, text);

    /**
     * 5) Session aislada por concesionario (evita cruces)
     */
    const sessionKey = `${dealer.id}:${from}`;
    const session = getSession(sessionKey);

    // Guardar candidate name si viene del perfil
    if (!session.customerName && name && !session.customerNameCandidate) {
      session.customerNameCandidate = name;
      updateSession(sessionKey, session);
    }

    /**
     * 6) Guardar inbound SIEMPRE para dashboard (persistencia)
     */
    await safeAddMessage(dealer.id, from, {
      sender: "user",
      type: "text",
      content: message.type === "interactive" ? `[selección] ${text}` : text,
      created_at: new Date(),
      message_id: inboundId
    });

    /**
     * 7) Si está en modo humano/handoff, el bot NO responde, pero ya guardó el inbound
     */
    if (session.mode === "human" || session.handoff === true) {
      console.log("🧑‍💼 Modo humano activo, bot silenciado para:", from);
      return;
    }

    /**
     * 8) Señales para engine
     */
    const detectedModels = detectModelsFromText(text) || [];
    const intentSignal = classifyIntent(text);

    const meta = { name, detectedModels, intentSignal, choiceId };

    /**
     * 9) Engine decide
     */
    const result = processMessage(session, text, meta);

    /**
     * 10) Persistir sesión
     */
    updateSession(sessionKey, result.session);

    /**
     * 11) Persistencia mínima del lead (para que quede trazabilidad)
     *     Guardamos use_case/version_tier/timing si el engine los trae
     */
    await safeUpsertLead(dealer.id, {
      id: from,
      customer_name: result.session.customerName || session.customerName || name || null,
      phone: from,
      status: result.session.handoff ? "handoff" : "handoff",
      intent: intentSignal || null,
      model_interest: result.session.selectedModel || session.selectedModel || null,
      purchase_type: result.session.purchaseType || session.purchaseType || null,
      use_case: result.session.useCase || null,
      version_tier: result.session.versionTier || null,
      timing: result.session.timing || null,
      handoff_at: result.session.handoff ? new Date() : null,
      last_message_at: new Date()
    });

    /**
     * =======================
     * ROUTER DE RESPUESTAS
     * =======================
     */

    // 1) Confirmación de nombre por botones
    if (result.intent === "ASK_NAME_CONFIRM") {
      const interactive = buildInteractive("ASK_NAME_CONFIRM", result.session);
      await safeSendInteractive(creds, from, interactive);

      await safeAddMessage(dealer.id, from, {
        sender: "bot",
        type: "text",
        content: "[interactive:name_confirm]",
        created_at: new Date()
      });

      return;
    }

    // 2) Pedir nombre por texto (sin IA)
    if (result.intent === "ASK_NAME") {
      const msg = "Hola 👋 Antes de ayudarte, ¿cómo te llamás?";
      await safeSendText(creds, from, msg);

      await safeAddMessage(dealer.id, from, {
        sender: "bot",
        type: "text",
        content: msg,
        created_at: new Date()
      });

      return;
    }

    // 3) Wizard: si el intent tiene menú, mandar interactive y cortar
    const wizardInteractive = buildInteractive(result.intent, result.session);
    if (wizardInteractive) {
      await safeSendInteractive(creds, from, wizardInteractive);

      await safeAddMessage(dealer.id, from, {
        sender: "bot",
        type: "text",
        content: `[interactive:${result.intent}]`,
        created_at: new Date()
      });

      return;
    }

    // 4) HANDOFF: mensaje corto, una sola vez
    if (result.intent === "HANDOFF" || result.session.handoff === true) {
      if (result.session.handoffNotified) {
        updateSession(sessionKey, { ...result.session, mode: "human", handoff: true });
        return;
      }

      const updated = {
        ...result.session,
        handoff: true,
        handoffNotified: true,
        mode: "human"
      };
      updateSession(sessionKey, updated);

      await safeUpsertLead(dealer.id, {
        id: from,
        customer_name: updated.customerName || name || "Cliente",
        phone: from,
        status: "handoff",
        intent: intentSignal || null,
        model_interest: updated.selectedModel || null,
        purchase_type: updated.purchaseType || null,
        use_case: updated.useCase || null,
        version_tier: updated.versionTier || null,
        timing: updated.timing || null,
        handoff_at: new Date(),
        last_message_at: new Date()
      });

      const nombre = updated.customerName ? `, ${updated.customerName}` : "";
      const modelo = updated.selectedModel?.model ? `**${updated.selectedModel.model}**` : "tu modelo";
      const pago =
        updated.purchaseType === "cash" ? "**contado**" :
        updated.purchaseType === "finance" ? "**cuotas**" :
        "**forma de pago**";
      const cuando =
        updated.timing === "hoy" ? "hoy" :
        updated.timing === "esta_semana" ? "esta semana" :
        updated.timing === "este_mes" ? "este mes" :
        "en estos días";

      const closeMsg =
        `¡Listo${nombre}! ✅\n` +
        `Quedó registrado: ${modelo} · ${pago} · ${cuando}.\n` +
        `Te pasa un asesor para cerrar. ¿Preferís hoy o mañana?`;

      await safeSendText(creds, from, closeMsg);

      await safeAddMessage(dealer.id, from, {
        sender: "bot",
        type: "text",
        content: closeMsg,
        created_at: new Date()
      });

      return;
    }

    // 5) IA (solo si no es wizard ni handoff)
    let reply;

    if (!process.env.OPENAI_API_KEY) {
      reply = fallbackReply(result.intent);
      console.warn("⚠️ OPENAI_API_KEY no está definida: usando fallback.");
    } else {
      try {
        reply = await generateAIResponse(
          result.intent,
          result.data,
          text,
          {
            customerName: result.session.customerName || name || null,
            model: result.session.selectedModel || null,
            purchaseType: result.session.purchaseType || null,
            forcedStep: result.intent
          }
        );
      } catch (e) {
        console.error("⚠️ OpenAI falló, usando fallback:", e?.message || e);
        reply = fallbackReply(result.intent);
      }
    }

    await safeSendText(creds, from, reply);

    await safeAddMessage(dealer.id, from, {
      sender: "bot",
      type: "text",
      content: reply,
      created_at: new Date()
    });

  } catch (err) {
    console.error("❌ Error en webhookHandler:", err?.response?.data || err);
  }
}