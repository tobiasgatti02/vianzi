import { query } from "../db/db.js";

export async function getDealerBySlug(slug: string) {
  const r = await query("select * from dealers where slug=$1 and active=true", [slug]);
  return r.rows[0] || null;
}

export async function getDealerById(id: string) {
  const r = await query("select * from dealers where id=$1 and active=true", [id]);
  return r.rows[0] || null;
}
