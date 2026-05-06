import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { query } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initDb() {
  const schemaPath = path.resolve(__dirname, "./schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");
  await query(sql);
}