import { db } from "../db/db.js";

export function addMessage(leadId, message) {
  // 1) Asegurar que el lead exista (mínimo) para no romper FK
  db.prepare(`
    INSERT OR IGNORE INTO leads (
      id, phone, status, last_message_at
    ) VALUES (?, ?, 'handoff', ?)
  `).run(
    leadId,
    leadId,
    new Date().toISOString()
  );

  // 2) Insertar mensaje (dedupe por message_id si existe)
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO messages (
      lead_id, sender, type, content, media_url, created_at, message_id
    )
    VALUES (
      @lead_id, @sender, @type, @content, @media_url, @created_at, @message_id
    )
  `);

  stmt.run({
    lead_id: leadId,
    sender: message.sender,
    type: message.type,
    content: message.content ?? null,
    media_url: message.media_url ?? null,
    created_at: message.created_at
      ? new Date(message.created_at).toISOString()
      : new Date().toISOString(),
    message_id: message.message_id ?? null
  });

  // 3) Mantener actualizado el "last_message_at"
  db.prepare(`
    UPDATE leads
    SET last_message_at = ?
    WHERE id = ?
  `).run(new Date().toISOString(), leadId);
}

export function getMessagesByLead(leadId) {
  return db.prepare(`
    SELECT sender, type, content, media_url, created_at, message_id
    FROM messages
    WHERE lead_id = ?
    ORDER BY datetime(created_at) ASC
  `).all(leadId);
}