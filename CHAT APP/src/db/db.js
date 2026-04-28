import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Guardamos el DB en /data/app.db (persistente)
const dataDir = path.resolve(__dirname, "../../data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "app.db");

// ✅ export nombrado
export const db = new Database(dbPath);

// performance + integridad
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Migración (tablas)
db.exec(`
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  customer_name TEXT,
  phone TEXT,
  status TEXT,
  intent TEXT,
  model_brand TEXT,
  model_name TEXT,
  purchase_type TEXT,
  handoff_at TEXT,
  last_message_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_last_message_at ON leads(last_message_at);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT,
  media_url TEXT,
  created_at TEXT NOT NULL,
  message_id TEXT,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_message_id ON messages(message_id)
  WHERE message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_lead_created ON messages(lead_id, created_at);
`);

function ensureColumn(table, column, ddl) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  const exists = cols.some(c => c.name === column);
  if (!exists) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}

// Campos CRM
ensureColumn("leads", "outcome_status", "outcome_status TEXT");       // contactado|seguimiento|venta|no_interesado|null
ensureColumn("leads", "notes", "notes TEXT");                         // notas internas
ensureColumn("leads", "next_contact_at", "next_contact_at TEXT");     // ISO string
ensureColumn("leads", "last_human_action_at", "last_human_action_at TEXT"); // ISO string