import axios from "axios";
import FormData from "form-data";
import fs from "node:fs";
import path from "node:path";

export async function uploadMedia(filePath: string, mimeType?: string): Promise<string> {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) throw new Error(`Archivo no existe: ${absPath}`);
  const stat = fs.statSync(absPath);
  if (!stat.size || stat.size <= 0) throw new Error(`Archivo vacío: ${absPath}`);

  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("file", fs.createReadStream(absPath), {
    filename: "audio.ogg",
    contentType: mimeType || "audio/ogg",
  } as any);
  form.append("type", mimeType || "audio/ogg");

  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_TOKEN;
  if (!phoneId || !token) throw new Error("Faltan credenciales WhatsApp");

  const url = `https://graph.facebook.com/v18.0/${phoneId}/media`;
  const res = await axios.post(url, form, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...(form as any).getHeaders?.(),
    },
    maxBodyLength: Infinity,
  });
  return res.data.id;
}
