import express from "express";
import { usecases } from "../../container.js";

const router = express.Router();

const isUUID = (v: any) =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

router.get("/", async (req, res, next) => {
  try {
    const dealerId = (req.headers["x-dealer-id"] as string) || (req.query.dealerId as string);
    if (!dealerId || !isUUID(dealerId)) {
      return res.status(400).json({ error: "dealerId inválido o ausente (x-dealer-id o ?dealerId=)" });
    }
    const leads = await usecases.getHandoffLeads(dealerId);
    res.json(leads);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const dealerId = (req.headers["x-dealer-id"] as string) || (req.query.dealerId as string);
    if (!dealerId || !isUUID(dealerId)) {
      return res.status(400).json({ error: "dealerId inválido o ausente" });
    }
    const lead = await usecases.getLeadById(dealerId, req.params.id);
    if (!lead) return res.status(404).json({ error: "Lead no encontrado" });
    const messages = await usecases.getMessagesByLead(dealerId, req.params.id);
    res.json({ lead, messages });
  } catch (err) {
    next(err);
  }
});

export default router;
