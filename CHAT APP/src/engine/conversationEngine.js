export function processMessage(session, textRaw, meta = {}) {
  const text = (textRaw || "").trim();
  const t = text.toLowerCase();

  const updated = { ...session };
  if (!updated.stage) updated.stage = "START";
  if (!updated.mode) updated.mode = "bot";
  if (updated.handoff !== true) updated.handoff = false;

  // ========= Helpers =========
  const hasModel = () => Boolean(updated.selectedModel?.model);
  const hasUse = () => Boolean(updated.useCase);
  const hasPay = () => Boolean(updated.purchaseType);
  const hasTiming = () => Boolean(updated.timing);
  const hasVersion = () => Boolean(updated.versionTier);

  const isYesNext = () =>
    /^(si|sí|dale|ok|oka|okey|contame|contame\.)$/i.test(text) ||
    /(contame|dale|ok|bárbaro|genial|seguimos|listo)/i.test(t);

  const wantsChangeModel = () =>
    /(cambiar|cambio|en vez de|prefiero|mejor|otro modelo|otro auto)/i.test(text);

  // ========= Capture “anytime” (sin divagar) =========
  // Nombre (si viene)
  if (!updated.customerName && meta.name) updated.customerName = meta.name;

  // Modelo por detector (solo setea si no hay modelo o si el usuario pide cambiar)
  if (meta.detectedModels?.length) {
    if (!hasModel() || wantsChangeModel()) {
      updated.selectedModel = meta.detectedModels[0];
    }
  } else {
    // fallback rápido por texto (por si el detector falla)
    if (!hasModel() || wantsChangeModel()) {
      if (/\bcronos\b/i.test(text)) updated.selectedModel = { brand: "Fiat", model: "Cronos" };
      else if (/\bpulse\b/i.test(text)) updated.selectedModel = { brand: "Fiat", model: "Pulse" };
      else if (/\bstrada\b/i.test(text)) updated.selectedModel = { brand: "Fiat", model: "Strada" };
      else if (/\btoro\b/i.test(text)) updated.selectedModel = { brand: "Fiat", model: "Toro" };
    }
  }

  // Uso
  if (!hasUse()) {
    if (/uber|cabify|didi|apps|remis|taxi/i.test(text)) updated.useCase = "Trabajo (Apps)";
    else if (/familia|chicos|viaje|vacaciones/i.test(text)) updated.useCase = "Familiar";
    else if (/primer auto|mi primer/i.test(text)) updated.useCase = "Primer auto";
    else if (/carga|herramientas|reparto/i.test(text)) updated.useCase = "Trabajo / Carga";
    else if (/mixto|ciudad y ruta/i.test(text)) updated.useCase = "Uso mixto";
  }

  // Pago
  if (!hasPay()) {
    if (/contado|efectivo|transferencia/i.test(text)) updated.purchaseType = "cash";
    else if (/financ|cuota|cuotas/i.test(text)) updated.purchaseType = "finance";
  }

  // Urgencia
  if (!hasTiming()) {
    if (/hoy|ya|urgente/i.test(text)) updated.timing = "hoy";
    else if (/semana/i.test(text)) updated.timing = "esta_semana";
    else if (/mes/i.test(text)) updated.timing = "este_mes";
  }

  // ========= Advance function (la clave anti-loop) =========
  const advance = () => {
    // si falta nombre → pedir nombre
    if (!updated.customerName) return "ASK_NAME";
    // Wizard 4 pasos
    if (!hasUse()) return "WIZ_USE_CASE";
    if (!hasModel()) return "WIZ_MODEL";
    // Nuevo paso: versión (si hay modelo pero no hay versionTier)
    if (!hasVersion()) return "WIZ_VERSION";
    if (!hasPay()) return "WIZ_PAYMENT";
    if (!hasTiming()) return "WIZ_TIMING";
    // listo: handoff
    updated.handoff = true;
    return "HANDOFF";
  };

  // ========= Rule: nunca volver a preguntar modelo si ya existe =========
  // Si por algún motivo stage quedó atrasado, lo reencaminamos
  // (esto mata el problema de “pregunta modelo otra vez”)
  if (hasModel() && updated.stage === "WIZ_MODEL" && !wantsChangeModel() && isYesNext()) {
    // si dice "contame/dale" y ya hay modelo, seguí al próximo paso
    updated.stage = advance();
  }

  // ========= State machine =========
  switch (updated.stage) {
    case "START": {
      updated.stage = advance();
      return { intent: updated.stage, data: {}, session: updated, rawText: textRaw };
    }

    case "ASK_NAME": {
      const cand = text.trim();
      if (cand.length >= 2) {
        updated.customerName = cand;
        updated.stage = advance();
        return { intent: updated.stage, data: {}, session: updated, rawText: textRaw };
      }
      return { intent: "ASK_NAME", data: {}, session: updated, rawText: textRaw };
    }

    // PASO 1: USO
    case "WIZ_USE_CASE": {
      const cid = meta.choiceId;
      const map = {
        USE_UBER: "Trabajo (Apps)",
        USE_FAM: "Familiar",
        USE_FIRST: "Primer auto",
        USE_CARGO: "Trabajo / Carga",
        USE_MIX: "Uso mixto",
        USE_OTHER: "Otro"
      };
      if (cid && map[cid]) {
        updated.useCase = map[cid];
        updated.stage = advance();
        return { intent: updated.stage, data: {}, session: updated, rawText: textRaw };
      }
      // fallback texto libre
      if (text.length > 2) {
        updated.useCase = updated.useCase || text;
        updated.stage = advance();
        return { intent: updated.stage, data: {}, session: updated, rawText: textRaw };
      }
      return { intent: "WIZ_USE_CASE", data: {}, session: updated, rawText: textRaw };
    }

    // PASO 2: MODELO
    case "WIZ_MODEL": {
      // si ya hay modelo, JAMÁS re-preguntar
      if (hasModel() && !wantsChangeModel()) {
        updated.stage = advance();
        return { intent: updated.stage, data: {}, session: updated, rawText: textRaw };
      }

      const cid = meta.choiceId;
      const map = {
        MOD_CRONOS: { brand: "Fiat", model: "Cronos" },
        MOD_PULSE: { brand: "Fiat", model: "Pulse" },
        MOD_STRADA: { brand: "Fiat", model: "Strada" },
        MOD_TORO: { brand: "Fiat", model: "Toro" },
        MOD_OTHER: null
      };

      if (cid && Object.prototype.hasOwnProperty.call(map, cid)) {
        updated.selectedModel = map[cid];
        updated.stage = advance();
        return { intent: updated.stage, data: {}, session: updated, rawText: textRaw };
      }

      // fallback por texto/detector ya lo setea arriba
      if (hasModel()) {
        updated.stage = advance();
        return { intent: updated.stage, data: {}, session: updated, rawText: textRaw };
      }

      return { intent: "WIZ_MODEL", data: {}, session: updated, rawText: textRaw };
    }

    // NUEVO PASO: VERSIÓN (no inventamos nombres; usamos tiers)
    case "WIZ_VERSION": {
      const cid = meta.choiceId;
      const map = {
        VER_BASE: "base",
        VER_INTER: "intermedia",
        VER_FULL: "full",
        VER_HELP: "no_se"
      };

      if (cid && map[cid]) {
        updated.versionTier = map[cid];
        updated.stage = advance();
        return { intent: updated.stage, data: {}, session: updated, rawText: textRaw };
      }

      // fallback texto libre
      if (/base|entry|intermedia|medio|full|tope|premium/i.test(t)) {
        if (/full|tope|premium/i.test(t)) updated.versionTier = "full";
        else if (/intermedia|medio/i.test(t)) updated.versionTier = "intermedia";
        else updated.versionTier = "base";
        updated.stage = advance();
        return { intent: updated.stage, data: {}, session: updated, rawText: textRaw };
      }

      // Si el usuario dice "contame/dale" acá, pedimos que elija (no volvemos a modelo)
      if (isYesNext()) {
        return { intent: "WIZ_VERSION", data: {}, session: updated, rawText: textRaw };
      }

      return { intent: "WIZ_VERSION", data: {}, session: updated, rawText: textRaw };
    }

    // PASO 3: PAGO (3 botones)
    case "WIZ_PAYMENT": {
      const cid = meta.choiceId;
      const map = { PAY_CASH: "cash", PAY_FIN: "finance", PAY_HELP: null };

      if (cid && Object.prototype.hasOwnProperty.call(map, cid)) {
        updated.purchaseType = map[cid];
        updated.stage = advance();
        return { intent: updated.stage, data: {}, session: updated, rawText: textRaw };
      }

      if (hasPay()) {
        updated.stage = advance();
        return { intent: updated.stage, data: {}, session: updated, rawText: textRaw };
      }

      return { intent: "WIZ_PAYMENT", data: {}, session: updated, rawText: textRaw };
    }

    // PASO 4: URGENCIA (3 botones)
    case "WIZ_TIMING": {
      const cid = meta.choiceId;
      const map = { TIM_TODAY: "hoy", TIM_WEEK: "esta_semana", TIM_MONTH: "este_mes" };

      if (cid && map[cid]) {
        updated.timing = map[cid];
        updated.stage = advance();
        return { intent: updated.stage, data: {}, session: updated, rawText: textRaw };
      }

      if (hasTiming()) {
        updated.stage = advance();
        return { intent: updated.stage, data: {}, session: updated, rawText: textRaw };
      }

      return { intent: "WIZ_TIMING", data: {}, session: updated, rawText: textRaw };
    }

    case "HANDOFF": {
      updated.handoff = true;
      return { intent: "HANDOFF", data: {}, session: updated, rawText: textRaw };
    }

    default: {
      updated.stage = advance();
      return { intent: updated.stage, data: {}, session: updated, rawText: textRaw };
    }
  }
}
``