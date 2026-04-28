export function classifyIntent(textRaw) {
  const text = textRaw.toLowerCase();

  // 🔥 Compra inmediata
  if (
    text.includes("cerrar hoy") ||
    text.includes("tengo efectivo") ||
    text.includes("lo compro") ||
    text.includes("hoy mismo")
  ) {
    return "BUY_NOW";
  }

  // 💳 Interés en financiación
  if (
    text.includes("cuota") ||
    text.includes("financiar") ||
    text.includes("plan") ||
    text.includes("mensual")
  ) {
    return "FINANCE_INTENT";
  }

  // 💵 Contado
  if (
    text.includes("contado") ||
    text.includes("efectivo") ||
    text.includes("transferencia")
  ) {
    return "CASH_INTENT";
  }

  // 💸 Objeción de precio
  if (
    text.includes("caro") ||
    text.includes("no llego") ||
    text.includes("se me complica") ||
    text.includes("muy alto")
  ) {
    return "PRICE_OBJECTION";
  }

  // ❄️ Riesgo de abandono
  if (
    text.includes("después vemos") ||
    text.includes("lo pienso") ||
    text.includes("más adelante")
  ) {
    return "ABANDON_RISK";
  }

  // 🟡 Explorando
  return "EXPLORING";
}