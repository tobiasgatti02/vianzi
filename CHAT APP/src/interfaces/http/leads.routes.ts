import express, { Request, Response, NextFunction } from "express";
import { usecases } from "../../container.js";
import { prisma } from "../../infrastructure/db/prisma.js";

const router = express.Router();

const isUUID = (v: any) =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dealerId = (req.headers["x-dealer-id"] as string) || (req.query.dealerId as string);
    if (!dealerId || !isUUID(dealerId)) {
      return res
        .status(400)
        .json({ error: "dealerId inválido o ausente (x-dealer-id o ?dealerId=)" });
    }
    const leads = await usecases.getHandoffLeads(dealerId);
    res.json(leads);
  } catch (err) {
    next(err as any);
  }
});

// Back-compat: /leads/handoff → mismo resultado que "/"
router.get(
  "/handoff",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dealerId = (req.headers["x-dealer-id"] as string) || (req.query.dealerId as string);
      if (!dealerId || !isUUID(dealerId)) {
        return res
          .status(400)
          .json({ error: "dealerId inválido o ausente (x-dealer-id o ?dealerId=)" });
      }
      const leads = await usecases.getHandoffLeads(dealerId);
      res.json(leads);
    } catch (err) {
      next(err as any);
    }
  }
);

router.get(
  ":id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dealerId = (req.headers["x-dealer-id"] as string) || (req.query.dealerId as string);
      if (!dealerId || !isUUID(dealerId)) {
        return res.status(400).json({ error: "dealerId inválido o ausente" });
      }
      const lead = await usecases.getLeadById(dealerId, String(req.params.id));
      if (!lead) return res.status(404).json({ error: "Lead no encontrado" });
      const messages = await usecases.getMessagesByLead(dealerId, String(req.params.id));
      res.json({ lead, messages });
    } catch (err) {
      next(err as any);
    }
  }
);

export default router;
// Seed endpoint protegido con ADMIN_BOOTSTRAP_SECRET
router.post(
  "/seed",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const secret = (req.headers["x-admin-secret"] as string) || (req.query.adminSecret as string);
      if (!secret || secret !== process.env.ADMIN_BOOTSTRAP_SECRET) {
        return res.status(403).json({ error: "forbidden" });
      }
      const dealerId = (req.body?.dealerId as string) || (req.query.dealerId as string);
      if (!dealerId || !isUUID(dealerId)) {
        return res.status(400).json({ error: "dealerId requerido y debe ser UUID" });
      }
      const slug = (req.body?.slug as string) || "demo";
      const name = (req.body?.name as string) || "Demo Dealer";
      const phoneId = process.env.WHATSAPP_PHONE_ID || "000000000000000";
      const waToken = process.env.WHATSAPP_TOKEN || "token";
      const verify = process.env.WEBHOOK_VERIFY_TOKEN || "verifytoken";

      await prisma.dealer.upsert({
        where: { id: dealerId },
        update: { slug, name },
        create: {
          id: dealerId,
          slug,
          name,
          whatsappPhoneNumberId: phoneId,
          whatsappToken: waToken,
          webhookVerifyToken: verify,
          active: true,
        },
      });

      const leadId = (req.body?.leadId as string) || "54911TEST";
      await prisma.lead.upsert({
        where: { dealerId_id: { dealerId, id: leadId } },
        update: { status: "handoff", lastMessageAt: new Date() },
        create: {
          dealerId,
          id: leadId,
          customerName: "Juan Pérez",
          phone: leadId,
          status: "handoff",
          lastMessageAt: new Date(),
        } as any,
      });

      res.json({ ok: true, dealerId, leadId });
    } catch (err) {
      next(err as any);
    }
  }
);
