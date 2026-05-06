import express, { Request, Response } from "express";
const router = express.Router();

router.get("/healthz", (_req: Request, res: Response) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

export default router;
