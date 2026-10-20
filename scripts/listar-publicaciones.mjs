// Lista las últimas publicaciones de la Comunidad (cualquier estado) para no repetir temas.
// Uso: npm run listar-publicaciones
import { createClient } from "@supabase/supabase-js";

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data, error } = await admin.from("posts").select("status, audience, category, title, created_at").order("created_at", { ascending: false }).limit(80);
if (error) {
  console.error(error.message);
  process.exit(1);
}
for (const p of data) console.log(`${p.created_at.slice(0, 10)} | ${p.status} | ${p.audience.join("+")} | ${p.category} | ${p.title}`);
