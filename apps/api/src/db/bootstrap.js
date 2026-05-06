import bcrypt from "bcrypt";
import { query } from "./db.js";

export async function bootstrap({ secret, dealer, user }) {
  if (!process.env.ADMIN_BOOTSTRAP_SECRET || secret !== process.env.ADMIN_BOOTSTRAP_SECRET) {
    throw new Error("Bootstrap secret inválido");
  }

  const d = await query(
    `insert into dealers (slug, name, whatsapp_phone_number_id, whatsapp_token, webhook_verify_token, openai_api_key)
     values ($1,$2,$3,$4,$5,$6)
     returning id`,
    [
      dealer.slug,
      dealer.name,
      dealer.whatsapp_phone_number_id,
      dealer.whatsapp_token,
      dealer.webhook_verify_token,
      dealer.openai_api_key || null
    ]
  );

  const dealerId = d.rows[0].id;
  const hash = await bcrypt.hash(user.password, 10);

  await query(
    `insert into users (dealer_id, email, password_hash, role)
     values ($1,$2,$3,$4)`,
    [dealerId, user.email, hash, user.role || "admin"]
  );

  return { dealer_id: dealerId };
}