import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

import { uploadMedia } from '../whatsapp/uploadMedia.js';
import { sendAudio } from '../whatsapp/sendAudio.js';
import { addMessage } from '../storage/messages.store.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/:leadId/audio', upload.single('audio'), async (req, res) => {
  try {
    const leadId = req.params.leadId;
    const file = req.file;
    console.log("🎧 req.file:", {
    originalname: file?.originalname,
    mimetype: file?.mimetype,
    size: file?.size,
      path: file?.path
    });

  if (!file || !file.size || file.size <= 0) {
    return res.status(400).json({ error: "empty_audio_file" });
  }

    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const absPath = path.resolve(file.path);

    // Muchos browsers mandan webm; Meta puede rechazar. Forzamos ogg si tu UI lo genera.
    const mimeType = file.mimetype || 'audio/ogg';

    const mediaId = await uploadMedia(absPath, mimeType);
    await sendAudio(leadId, mediaId);

    addMessage(leadId, {
      sender: 'human',
      type: 'audio',
      media_url: mediaId,
      created_at: new Date()
    });

    fs.unlinkSync(absPath);

    res.json({ ok: true, mediaId });
  } catch (err) {
    console.error('❌ Audio upload/send error:', err?.response?.data || err);
    res.status(500).json({ error: 'audio_failed', detail: err?.response?.data || String(err) });
  }
});

export default router;