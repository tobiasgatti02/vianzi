import express, { Request, Response, NextFunction } from "express";
import { usecases } from "../../container.js";

const router = express.Router();

router.post("/:leadId/text", async (req: Request, res: Response, next: NextFunction) => {
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
router.post("/test", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { to, text } = req.body || {};
    if (!to || !text) return res.status(400).json({ error: "Faltan to y text" });
    const wa: ((a: string, b: string) => Promise<void>) | undefined = (usecases as any).waSendText;
    await wa?.(to, text);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
