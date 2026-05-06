import pg from "pg";
const { Pool } = pg;

const cs = process.env.DATABASE_URL;
if (!cs) {
  throw new Error(
    "DATABASE_URL no está definida (revisar .env/.env.local y el directorio desde el que ejecutás)."
  );
}

const needsSSL = /neon\.tech|sslmode=require/i.test(cs) || process.env.PGSSLMODE === "require";
export const pool = new Pool({
  connectionString: cs,
  ssl: needsSSL ? { rejectUnauthorized: false } : undefined,
});

export async function query<T = any>(sql: string, params: any[] = []) {
  return pool.query<T>(sql, params);
}
