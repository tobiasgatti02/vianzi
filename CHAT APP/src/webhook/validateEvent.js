// src/webhook/validateEvent.js

export function isValidIncomingEvent(body) {
  try {
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    // Solo procesamos mensajes de texto reales
    if (!value?.messages?.length) return false;

    const message = value.messages[0];
    if (message.type !== 'text') return false;

    return true;
  } catch {
    return false;
  }
}
