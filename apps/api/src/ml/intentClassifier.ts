export function classifyIntent(textRaw: string) {
  const text = (textRaw || "").toLowerCase();

  if (
    text.includes("cerrar hoy") ||
    text.includes("tengo efectivo") ||
    text.includes("lo compro") ||
    text.includes("hoy mismo")
  ) {
    return "BUY_NOW";
  }

  if (
    text.includes("cuota") ||
    text.includes("financiar") ||
    text.includes("plan") ||
    text.includes("mensual")
  ) {
    return "FINANCE_INTENT";
  }

  if (
    text.includes("contado") ||
    text.includes("efectivo") ||
    text.includes("transferencia")
  ) {
    return "CASH_INTENT";
  }

  if (
    text.includes("caro") ||
    text.includes("no llego") ||
    text.includes("se me complica") ||
    text.includes("muy alto")
  ) {
    return "PRICE_OBJECTION";
  }

  if (
    text.includes("después vemos") ||
    text.includes("lo pienso") ||
    text.includes("más adelante")
  ) {
    return "ABANDON_RISK";
  }

  return "EXPLORING";
}
