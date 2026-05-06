import express, { Request, Response, NextFunction } from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";

import { uploadMedia } from "../whatsapp/uploadMedia.js";
import { sendAudio } from "../whatsapp/sendAudio.js";
import { addMessage } from "../storage/messages.store.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post(
  "/:leadId/audio",
  upload.single("audio"),
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const leadId = req.params.leadId;
      const file = req.file as Express.Multer.File | undefined;
      if (!file || !file.size || file.size <= 0) {
        return res.status(400).json({ error: "empty_audio_file" });
      }

      const absPath = path.resolve(file.path);
      const mimeType = file.mimetype || "audio/ogg";

      const mediaId = await uploadMedia(absPath, mimeType);
      await sendAudio(leadId, mediaId);

      await addMessage(
        // DealerId: si no está, usa header/query opcional; aquí conservamos firma legacy
        (req.headers["x-dealer-id"] as string) || (req.query.dealerId as string),
        leadId,
        {
          sender: "human",
          type: "audio",
          media_url: mediaId,
          created_at: new Date(),
        } as any
      );

      fs.unlinkSync(absPath);

      res.json({ ok: true, mediaId });
    } catch (err: any) {
      console.error("❌ Audio upload/send error:", err?.response?.data || err);
      res
        .status(500)
        .json({ error: "audio_failed", detail: err?.response?.data || String(err) });
    }
  }
);

export default router;
