import { db } from "../db/db.js";

export function upsertLead(lead) {
  const stmt = db.prepare(`
    INSERT INTO leads (
      id, customer_name, phone, status, intent,
      model_brand, model_name, purchase_type,
      handoff_at, last_message_at,
      outcome_status, notes, next_contact_at, last_human_action_at
    )
    VALUES (
      @id, @customer_name, @phone, @status, @intent,
      @model_brand, @model_name, @purchase_type,
      @handoff_at, @last_message_at,
      @outcome_status, @notes, @next_contact_at, @last_human_action_at
    )
    ON CONFLICT(id) DO UPDATE SET
      customer_name=excluded.customer_name,
      phone=excluded.phone,
      status=excluded.status,
      intent=excluded.intent,
      model_brand=excluded.model_brand,
      model_name=excluded.model_name,
      purchase_type=excluded.purchase_type,
      handoff_at=excluded.handoff_at,
      last_message_at=excluded.last_message_at,
      outcome_status=excluded.outcome_status,
      notes=excluded.notes,
      next_contact_at=excluded.next_contact_at,
      last_human_action_at=excluded.last_human_action_at
  `);

  stmt.run({
    id: lead.id,
    customer_name: lead.customer_name ?? null,
    phone: lead.phone ?? lead.id,
    status: lead.status ?? null,
    intent: lead.intent ?? null,

    model_brand: lead.model_interest?.brand ?? lead.model_brand ?? null,
    model_name: lead.model_interest?.model ?? lead.model_name ?? null,

    purchase_type: lead.purchase_type ?? null,
    handoff_at: lead.handoff_at ? new Date(lead.handoff_at).toISOString() : null,
    last_message_at: lead.last_message_at ? new Date(lead.last_message_at).toISOString() : new Date().toISOString(),

    outcome_status: lead.outcome_status ?? null,
    notes: lead.notes ?? null,
    next_contact_at: lead.next_contact_at ? new Date(lead.next_contact_at).toISOString() : null,
    last_human_action_at: lead.last_human_action_at ? new Date(lead.last_human_action_at).toISOString() : null,
  });
}

export function getHandoffLeads() {
  const rows = db.prepare(`
    SELECT *
    FROM leads
    WHERE status = 'handoff'
    ORDER BY datetime(last_message_at) DESC
  `).all();

  return rows.map(mapLeadRow);
}

export function getLeadById(id) {
  const row = db.prepare(`SELECT * FROM leads WHERE id = ?`).get(id);
  return row ? mapLeadRow(row) : null;
}

export function updateLead(id, data) {
  const current = getLeadById(id);
  if (!current) return;

  upsertLead({
    ...current,
    ...data,
    id
  });
}

function mapLeadRow(row) {
  return {
    id: row.id,
    customer_name: row.customer_name,
    phone: row.phone,
    status: row.status,
    intent: row.intent,
    model_interest: row.model_name ? { brand: row.model_brand, model: row.model_name } : null,
    purchase_type: row.purchase_type,
    handoff_at: row.handoff_at,
    last_message_at: row.last_message_at,

    // CRM
    outcome_status: row.outcome_status,
    notes: row.notes,
    next_contact_at: row.next_contact_at,
    last_human_action_at: row.last_human_action_at
  };
}