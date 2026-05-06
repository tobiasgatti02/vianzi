import { query } from "../db/db.js";

/**
 * addMessage(dealerId, leadId, message)
 * - Asegura que exista el lead (para no romper FK).
 * - Inserta el mensaje con dedupe por (dealer_id, message_id).
 * - Actualiza last_message_at del lead.
 */
export async function addMessage(dealerId, leadId, message) {
  // 1) Asegurar lead mínimo (para FK dealer_id + lead_id)
  await query(
    `
    INSERT INTO leads (dealer_id, id, phone, status, last_message_at)
    VALUES ($1, $2, $2, 'handoff', NOW())
    ON CONFLICT (dealer_id, id)
    DO UPDATE SET last_message_at = NOW()
    `,
    [dealerId, leadId]
  );

  // 2) Insertar mensaje (dedupe por dealer_id + message_id)
  // Nota: en tu schema ya definimos UNIQUE (dealer_id, message_id)
  await query(
    `
    INSERT INTO messages (dealer_id, lead_id, sender, type, content, media_url, created_at, message_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (dealer_id, message_id) DO NOTHING
    `,
    [
      dealerId,
      leadId,
      message.sender,
      message.type,
      message.content ?? null,
      message.media_url ?? null,
      message.created_at ? new Date(message.created_at) : new Date(),
      message.message_id ?? null
    ]
  );

  // 3) Mantener actualizado last_message_at del lead
  await query(
    `
    UPDATE leads
    SET last_message_at = NOW()
    WHERE dealer_id = $1 AND id = $2
    `,
    [dealerId, leadId]
  );
}

/**
 * getMessagesByLead(dealerId, leadId)
 * - Devuelve mensajes ordenados por fecha (ASC), aislados por dealer.
 */
export async function getMessagesByLead(dealerId, leadId) {
  const r = await query(
    `
    SELECT sender, type, content, media_url, created_at, message_id
    FROM messages
    WHERE dealer_id = $1 AND lead_id = $2
    ORDER BY created_at ASC
    `,
    [dealerId, leadId]
  );

  return r.rows;
}