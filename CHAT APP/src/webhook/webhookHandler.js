import { sendText } from "../whatsapp/sendText.js";
import { sendInteractive } from "../whatsapp/sendInteractive.js";
import { buildInteractive } from "../whatsapp/buildInteractive.js";
import { generateAIResponse } from "../ai/generateAIResponse.js";

import { upsertLead } from "../storage/leads.store.js";
import { addMessage } from "../storage/messages.store.js";

import { getSession, updateSession } from "../sessions/sessionStore.js";
import { detectModelsFromText } from "../catalog/detectModel.js";
import { classifyIntent } from "../ml/intentClassifier.js";
import { processMessage } from "../engine/conversationEngine.js";

// ✅ Deduplicación de inbound por wamid (evita duplicados)
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

// ✅ Fallback si OpenAI no está
function fallbackReply(intent, session) {
  switch (intent) {
    case "ASK_NAME":
      return "Hola 👋 Antes de ayudarte, ¿podrías decirme tu nombre?";
    case "WIZ_USE_CASE":
      return "¿Para qué lo vas a usar? (por ejemplo Uber/Apps, familiar, primer auto, carga)";
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

export default async function webhookHandler(req, res) {
  try {
    // ✅ Responder 200 siempre (webhook)
    res.sendStatus(200);

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

    // ===== Texto + choiceId (para wizard) =====
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

    // ✅ Guardar inbound SIEMPRE (para dashboard)
    addMessage(from, {
      sender: "user",
      type: "text",
      content: message.type === "interactive" ? `[selección] ${text}` : text,
      created_at: new Date(),
      message_id: inboundId
    });

    // ✅ Sesión SIEMPRE existente
    const session = getSession(from);

    // 🔇 Si está en modo humano, bot silenciado (pero ya guardamos inbound)
    if (session.mode === "human" || session.handoff === true) {
      console.log("🧑‍💼 Modo humano activo, bot silenciado para:", from);
      return;
    }

    // ✅ Señales (ANTES de usar intentSignal)
    const detectedModels = detectModelsFromText(text) || [];
    const intentSignal = classifyIntent(text);

    const meta = { name, detectedModels, intentSignal, choiceId };

    // ✅ Persistencia mínima del lead (evita FK issues y completa datos)
    upsertLead({
      id: from,
      customer_name: session.customerName || name || null,
      phone: from,
      status: "handoff", // podés diferenciar luego si querés
      intent: intentSignal || null,
      model_interest: session.selectedModel || null,
      purchase_type: session.purchaseType || null,
      handoff_at: new Date(),
      last_message_at: new Date()
    });

    // ✅ Engine decide
    const result = processMessage(session, text, meta);

    // ✅ Persistir sesión
    updateSession(from, result.session);

    // ✅ Si engine pide wizard → enviar interactive y cortar acá
    const interactive = buildInteractive(result.intent);
    if (interactive) {
      await sendInteractive(from, interactive);

      addMessage(from, {
        sender: "bot",
        type: "text",
        content: "[interactive]",
        created_at: new Date()
      });

      return;
    }

    // ✅ HANDOFF: mensaje de cierre corto
    if (result.intent === "HANDOFF" || result.session.handoff === true) {
      if (result.session.handoffNotified) {
        updateSession(from, { ...result.session, mode: "human", handoff: true });
        return;
      }

      const updated = {
        ...result.session,
        handoff: true,
        handoffNotified: true,
        mode: "human"
      };
      updateSession(from, updated);

      upsertLead({
        id: from,
        customer_name: updated.customerName || name || "Cliente",
        phone: from,
        status: "handoff",
        intent: intentSignal || null,
        model_interest: updated.selectedModel || null,
        purchase_type: updated.purchaseType || null,
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

      await sendText(from, closeMsg);

      addMessage(from, {
        sender: "bot",
        type: "text",
        content: closeMsg,
        created_at: new Date()
      });

      return;
    }

    // ✅ Si NO es handoff: IA si hay key, sino fallback
    let reply;

    if (!process.env.OPENAI_API_KEY) {
      reply = fallbackReply(result.intent, result.session);
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
        reply = fallbackReply(result.intent, result.session);
      }
    }

    await sendText(from, reply);

    addMessage(from, {
      sender: "bot",
      type: "text",
      content: reply,
      created_at: new Date()
    });

  } catch (err) {
    console.error("❌ Error en webhookHandler:", err?.response?.data || err);
  }
}
``