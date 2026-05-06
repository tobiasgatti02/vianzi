import "./config/env.js"; // carga env y valida

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

import webhookHandler from "./webhook/webhookHandler.js";
import leadsRoutes from "./interfaces/http/leads.routes.js";
import messagesRoutes from "./interfaces/http/messages.routes.js";
import audioRoutes from "./api/audio.routes.js";
import { initDb } from "./db/initDb.js";
import healthRoutes from "./interfaces/http/health.routes.js";

export async function createServer() {
  const app = express();

  app.use(express.json());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Webhooks
  app.get("/webhook/:slug", webhookHandler);
  app.post("/webhook/:slug", webhookHandler);
  app.post("/webhook", webhookHandler);

  // Rutas API
  app.use("/", healthRoutes);
  app.use("/leads", leadsRoutes);
  app.use("/messages", messagesRoutes);
  app.use("/audio", audioRoutes);

  // Error handler
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    console.error("🔥 Error no manejado:", err);
    res.status(500).json({ error: err?.message || "Error interno" });
  });

  // Inicializar DB (no detiene el arranque si falla)
  try {
    await initDb();
    console.log("🗄️  DB inicializada correctamente");
  } catch (err) {
    console.warn("⚠️  No se pudo inicializar la DB:", (err as any)?.message || err);
  }

  return app;
}
