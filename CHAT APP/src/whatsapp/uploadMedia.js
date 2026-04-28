import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

export async function uploadMedia(filePath, mimeType) {
  const absPath = path.resolve(filePath);

  // Validaciones duras
  if (!fs.existsSync(absPath)) {
    throw new Error(`Archivo no existe: ${absPath}`);
  }
  const stat = fs.statSync(absPath);
  if (!stat.size || stat.size <= 0) {
    throw new Error(`Archivo vacío: ${absPath}`);
  }

  const form = new FormData();
  form.append('messaging_product', 'whatsapp');

  // ✅ Campo file real + metadata explícita
  form.append('file', fs.createReadStream(absPath), {
    filename: 'audio.ogg',
    contentType: mimeType || 'audio/ogg'
  });

  // ✅ (Opcional) type, ayuda a Meta a validar
  form.append('type', mimeType || 'audio/ogg');

  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/media`;

  const res = await axios.post(url, form, {
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      ...form.getHeaders()
    }
  });

  return res.data.id;
}