import express from 'express';
import { addMessage } from '../storage/messages.store.js';
import { sendText } from '../whatsapp/sendText.js';

const router = express.Router();

// ✅ Test endpoint sin DB para validar envío WhatsApp
router.post('/test', async (req, res, next) => {
  try {
    const { to, text } = req.body || {};
    if (!to || !text) {
      return res.status(400).json({ error: 'Faltan campos: to y text' });
    }
    await sendText(to, text);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post('/:leadId/text', async (req, res) => {
  const { text } = req.body;
  const leadId = req.params.leadId;

  await sendText(leadId, text);

  addMessage(leadId, {
    sender: 'human',
    type: 'text',
    content: text,
    created_at: new Date()
  });

  res.json({ ok: true });
});

export default router;