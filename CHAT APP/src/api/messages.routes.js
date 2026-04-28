import express from 'express';
import { addMessage } from '../storage/messages.store.js';
import { sendText } from '../whatsapp/sendText.js';

const router = express.Router();

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