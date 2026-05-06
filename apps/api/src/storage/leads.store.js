import { query } from "../db/db.js";

// Upsert lead (multi-tenant)
export async function upsertLead(dealerId, lead) {
  const modelBrand = lead.model_interest?.brand ?? lead.model_brand ?? null;
  const modelName = lead.model_interest?.model ?? lead.model_name ?? null;

  await query(
    `
    INSERT INTO leads (
      dealer_id, id, customer_name, phone, status, intent,
      model_brand, model_name, purchase_type,
      use_case, version_tier, timing,
      handoff_at, last_message_at,
      outcome_status, notes, next_contact_at, last_human_action_at
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,
      $7,$8,$9,
      $10,$11,$12,
      $13,$14,
      $15,$16,$17,$18
    )
    ON CONFLICT (dealer_id, id) DO UPDATE SET
      customer_name = EXCLUDED.customer_name,
      phone = EXCLUDED.phone,
      status = EXCLUDED.status,
      intent = EXCLUDED.intent,
      model_brand = EXCLUDED.model_brand,
      model_name = EXCLUDED.model_name,
      purchase_type = EXCLUDED.purchase_type,
      use_case = EXCLUDED.use_case,
      version_tier = EXCLUDED.version_tier,
      timing = EXCLUDED.timing,
      handoff_at = EXCLUDED.handoff_at,
      last_message_at = EXCLUDED.last_message_at,
      outcome_status = EXCLUDED.outcome_status,
      notes = EXCLUDED.notes,
      next_contact_at = EXCLUDED.next_contact_at,
      last_human_action_at = EXCLUDED.last_human_action_at
    `,
    [
      dealerId,
      lead.id,
      lead.customer_name ?? null,
      lead.phone ?? lead.id,
      lead.status ?? null,
      lead.intent ?? null,

      modelBrand,
      modelName,
      lead.purchase_type ?? null,

      lead.use_case ?? null,
      lead.version_tier ?? null,
      lead.timing ?? null,

      lead.handoff_at ? new Date(lead.handoff_at) : null,
      lead.last_message_at ? new Date(lead.last_message_at) : new Date(),

      lead.outcome_status ?? null,
      lead.notes ?? null,
      lead.next_contact_at ? new Date(lead.next_contact_at) : null,
      lead.last_human_action_at ? new Date(lead.last_human_action_at) : null
    ]
  );
}

// Leads en handoff (solo del dealer)
export async function getHandoffLeads(dealerId) {
  const r = await query(
    `
    SELECT *
    FROM leads
    WHERE dealer_id = $1 AND status = 'handoff'
    ORDER BY last_message_at DESC NULLS LAST
    `,
    [dealerId]
  );

  return r.rows.map(mapLeadRow);
}

// Detalle lead (solo del dealer)
export async function getLeadById(dealerId, id) {
  const r = await query(
    `SELECT * FROM leads WHERE dealer_id = $1 AND id = $2`,
    [dealerId, id]
  );

  const row = r.rows[0];
  return row ? mapLeadRow(row) : null;
}

// Update parcial (solo del dealer)
export async function updateLead(dealerId, id, data) {
  const current = await getLeadById(dealerId, id);
  if (!current) return;

  await upsertLead(dealerId, {
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

    model_interest: row.model_name
      ? { brand: row.model_brand, model: row.model_name }
      : null,

    purchase_type: row.purchase_type,
    use_case: row.use_case,
    version_tier: row.version_tier,
    timing: row.timing,

    handoff_at: row.handoff_at,
    last_message_at: row.last_message_at,

    // CRM
    outcome_status: row.outcome_status,
    notes: row.notes,
    next_contact_at: row.next_contact_at,
    last_human_action_at: row.last_human_action_at
  };
}