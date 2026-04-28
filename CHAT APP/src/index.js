import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import webhookHandler from './webhook/webhookHandler.js';
import leadsRoutes from './api/leads.routes.js';
import messagesRoutes from './api/messages.routes.js';
import audioRoutes from './api/audio.routes.js';

dotenv.config();

// ✅ 1) CREAR APP ANTES DE USAR app.use / app.post
const app = express();

// ✅ 2) MIDDLEWARES
app.use(express.json());

// ✅ CORS para que el dashboard (5173) pueda llamar al backend (3000)
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ 3) RUTAS (DESPUÉS de crear app)
app.post('/webhook', webhookHandler);

app.use('/leads', leadsRoutes);
app.use('/messages', messagesRoutes);
app.use('/audio', audioRoutes);

// ✅ 4) LISTEN
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listo en puerto ${PORT}`);
});
