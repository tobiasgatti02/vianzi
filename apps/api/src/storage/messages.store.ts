import { query } from "../db/db.js";

type Message = {
  sender: string;
  type: string;
  content?: string | null;
  media_url?: string | null;
  created_at?: Date | string;
  message_id?: string | null;
};

export async function addMessage(
  dealerId: string,
  leadId: string,
  message: Message
): Promise<void> {
  await query(
    `
    INSERT INTO leads (dealer_id, id, phone, status, last_message_at)
    VALUES ($1, $2, $2, 'handoff', NOW())
    ON CONFLICT (dealer_id, id)
    DO UPDATE SET last_message_at = NOW()
    `,
    [dealerId, leadId]
  );

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
      message.message_id ?? null,
    ]
  );

  await query(
    `
    UPDATE leads
    SET last_message_at = NOW()
    WHERE dealer_id = $1 AND id = $2
    `,
    [dealerId, leadId]
  );
}

export async function getMessagesByLead(dealerId: string, leadId: string) {
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
