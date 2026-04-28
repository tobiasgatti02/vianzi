import axios from 'axios';
import express from 'express';
import { processMessage } from './engine/conversationEngine.js';
import { sendWhatsAppMessage } from './whatsapp.js';
import { STATES } from './engine/states.js';
import { vehicles } from './data/vehicles.js';



export async function sendWhatsAppMessage(to, text) {
  await axios.post(
  `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
  {
    messaging_product: 'whatsapp',
    to: from,
    text: { body: 'Mensaje de prueba' }
  },
  {
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    }
  }
);

const app = express();
app.use(express.json());

const sessions = {}; // 🚧 luego Redis

// ✅ Verificación webhook Meta
app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === 'verify_token') {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

// ✅ Recepción mensajes
app.post('/webhook', async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (!message) return res.sendStatus(200);

    const from = message.from; // teléfono cliente
    const text = message.text?.body || '';

    // 👉 obtener o crear sesión
    if (!sessions[from]) {
      sessions[from] = {
        step: STATES.START,
        exampleQuota: vehicles.fiatCronos.exampleQuota
      };
    }

    const result = processMessage(sessions[from], text);
    sessions[from] = result.session;

    await sendWhatsAppMessage(from, result.text);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(200);
  }
});

app.listen(3000, () => {
  console.log('✅ WhatsApp Bot corriendo');
})};