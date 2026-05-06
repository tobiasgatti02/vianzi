import express from "express";
import { getHandoffLeads, getLeadById, updateLead } from "../storage/leads.store.js";
import { getMessagesByLead } from "../storage/messages.store.js";

const router = express.Router();
const isUUID = (v) =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

router.get("/:id/messages", async (req, res, next) => {
  try {
    const dealerId = req.dealerId || req.headers["x-dealer-id"] || req.query.dealerId;

    // ✅ Si mandan dealerId, debe ser UUID
    if (dealerId && !isUUID(dealerId)) {
      return res.status(400).json({
        error: "dealerId inválido. Debe ser un UUID (ej: 550e8400-e29b-41d4-a716-446655440000).",
        recibido: dealerId,
      });
    }

    // ⚠️ Si tu leadId en DB es UUID, descomentá esto:
    // if (!isUUID(req.params.id)) {
    //   return res.status(400).json({ error: "id de lead inválido. Debe ser UUID.", recibido: req.params.id });
    // }

    const messages = await getMessagesByLead(dealerId, req.params.id);
    res.json(messages);
  } catch (err) {
    next(err);
  }
});
/**
 * ✅ GET /leads
 * Endpoint base para que el dashboard pueda listar leads.
 * Si todavía no tenés "getAllLeads", devolvemos handoff como fallback.
 * (Si querés TODOS los leads, decime cómo los guardás y lo ajusto.)
 */
router.get("/", (req, res) => {
  // Fallback: si tu app considera "handoff" como los leads a mostrar
  const leads = getHandoffLeads();
  res.json(leads);
});

/**
 * ✅ GET /leads/handoff
 */
router.get("/handoff", (req, res) => {
  res.json(getHandoffLeads());
});

/**
 * ✅ GET /leads/:id
 * Ya lo importabas pero no lo estabas usando.
 */
router.get("/:id", (req, res) => {
  const lead = getLeadById(req.params.id);
  if (!lead) return res.status(404).json({ error: "Lead no encontrado" });
  res.json(lead);
});

/**
 * ✅ GET /leads/:id/messages
 * Ojo: dealerId puede venir por req.dealerId, header o query.
 */
router.get("/:id/messages", async (req, res, next) => {
  try {
    const dealerId =
      req.dealerId ||
      req.headers["x-dealer-id"] ||
      req.query.dealerId;

    const messages = await getMessagesByLead(dealerId, req.params.id);
    res.json(messages);
  } catch (err) {
    next(err);
  }
});

/**
 * ✅ POST /leads/:id/outcome
 */
router.post("/:id/outcome", (req, res) => {
  updateLead(req.params.id, { outcome: req.body, status: "closed" });
  res.json({ ok: true });
});

export default router;