import "./config/env.js"; // ✅ SIEMPRE PRIMERO

import express from "express";
import cors from "cors";

import webhookHandler from "./webhook/webhookHandler.js";
import leadsRoutes from "./api/leads.routes.js";
import messagesRoutes from "./api/messages.routes.js";
import audioRoutes from "./api/audio.routes.js";

import { initDb } from "./db/initDb.js";

const app = express();

// ✅ MIDDLEWARES
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ WEBHOOKS
app.get("/webhook/:slug", webhookHandler);  // verify token
app.post("/webhook/:slug", webhookHandler); // mensajes
app.post("/webhook", webhookHandler);

// ✅ RUTAS
app.use("/leads", leadsRoutes);
app.use("/messages", messagesRoutes);
app.use("/audio", audioRoutes);

// ✅ DB INIT (después de cargar env)
await initDb();
app.use((err, req, res, next) => {
  console.error("🔥 Error no manejado:", err);
  res.status(500).json({ error: err.message || "Error interno" });
});
// ✅ LISTEN
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listo en puerto ${PORT}`);
});