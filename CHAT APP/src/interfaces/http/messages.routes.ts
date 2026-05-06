import express from "express";
import { usecases } from "../../container.js";

const router = express.Router();

router.post("/:leadId/text", async (req, res, next) => {
  try {
    const dealerId = (req.headers["x-dealer-id"] as string) || (req.query.dealerId as string);
    if (!dealerId) return res.status(400).json({ error: "Falta dealerId" });
    const { text } = req.body || {};
    if (!text) return res.status(400).json({ error: "Falta text" });
    await usecases.sendTextAndStore(dealerId, req.params.leadId, text);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Test sin DB para validar credenciales de WhatsApp
router.post("/test", async (req, res, next) => {
  try {
    const { to, text } = req.body || {};
    if (!to || !text) return res.status(400).json({ error: "Faltan to y text" });
    await usecases["waSendText" as any]?.(to, text);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
