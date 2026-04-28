// src/whatsapp/handleErrors.js

export function handleWhatsAppError(err) {
  const code = err?.response?.data?.error?.code;

  switch (code) {
    case 131030:
      console.warn('[WHATSAPP] Destinatario no permitido');
      break;
    case 131047:
      console.warn('[WHATSAPP] Rate limit');
      break;
    default:
      console.error('[WHATSAPP] Error desconocido', err.response?.data || err);
  }
}