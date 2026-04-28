const sessions = new Map();

/**
 * Siempre devuelve una sesión válida
 */
export function getSession(phone) {
  if (!sessions.has(phone)) {
    const session = {
      phone,
      stage: 'START',
      customerName: null,
      selectedModel: null,
      purchaseType: null,
      handoff: false,
      createdAt: new Date(),
      lastMessageAt: new Date(),
      // dentro de getSession() cuando crea la sesión nueva:
      
      handoffNotified: false,
      mode: 'bot',
      selectedModel: null,
      customerName: null,
      purchaseType: null,
    };

    sessions.set(phone, session);
    return session;
  }

  return sessions.get(phone);

  
}

/**
 * Reemplaza la sesión completa (fuente de verdad)
 */
export function updateSession(phone, session) {
  if (!session) return;
  session.lastMessageAt = new Date();
  sessions.set(phone, session);
}