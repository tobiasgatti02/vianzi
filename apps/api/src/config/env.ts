import dotenv from "dotenv";
import fs from "node:fs";

if (fs.existsSync(".env.local")) dotenv.config({ path: ".env.local" });
dotenv.config();

const required = ["WHATSAPP_TOKEN", "WHATSAPP_PHONE_ID"] as const;
const missing = required.filter((k) => !process.env[k] || process.env[k] === "undefined");
if (missing.length) {
  throw new Error(
    `Faltan variables de entorno: ${missing.join(", ")}. Definilas en .env/.env.local o en el entorno.`
  );
}

export type Env = {
  WHATSAPP_TOKEN: string;
  WHATSAPP_PHONE_ID: string;
  DATABASE_URL?: string;
  OPENAI_API_KEY?: string;
};

export const env: Env = {
  WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN!,
  WHATSAPP_PHONE_ID: process.env.WHATSAPP_PHONE_ID!,
  DATABASE_URL: process.env.DATABASE_URL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
};
