// Carga publicaciones de la Comunidad como BORRADOR desde un archivo JSON (nunca las publica).
// Uso: npm run cargar-borradores -- ruta\al\archivo.json
// El JSON es un array de { audience, category, format, title, summary, body, image_url?, media_url?, sources, nota_para_revisor? }
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const AUDIENCES = ["empresa", "comercio", "colaborador"];
const CATEGORIES = ["Salud ocupacional", "Seguridad e higiene", "Recursos humanos", "Medicina laboral", "Normativa", "Campaña de salud", "Bienestar", "Podcast"];
const FORMATS = ["nota", "tip", "noticia", "podcast", "video", "capacitacion"];

const file = process.argv[2];
if (!file) {
  console.error("Uso: npm run cargar-borradores -- archivo.json");
  process.exit(1);
}
const items = JSON.parse(readFileSync(file, "utf8").replace(/^﻿/, ""));
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const httpsOrNull = (u) => (typeof u === "string" && /^https:\/\/\S+$/.test(u) ? u : null);
let ok = 0;
for (const it of items) {
  const audience = (it.audience ?? []).filter((a) => AUDIENCES.includes(a));
  const sources = (it.sources ?? []).filter((s) => s && /^https?:\/\//.test(s.url)).map((s) => ({ title: String(s.title || s.url).slice(0, 200), url: s.url }));
  const problems = [];
  if (!it.title) problems.push("sin título");
  if (!audience.length) problems.push("sin público");
  if (!CATEGORIES.includes(it.category)) problems.push(`categoría inválida (${it.category})`);
  if (!FORMATS.includes(it.format ?? "nota")) problems.push(`formato inválido (${it.format})`);
  if (!sources.length) problems.push("sin fuentes");
  if (problems.length) {
    console.log(`SALTEADO  "${it.title ?? "(sin título)"}": ${problems.join(", ")}`);
    continue;
  }
  // La nota para el revisor queda al principio del cuerpo, marcada, para que IDT la vea y la borre antes de publicar.
  const reviewer = it.nota_para_revisor ? `**[Para revisar antes de publicar: ${String(it.nota_para_revisor).replace(/\n/g, " ")}]**\n\n` : "";
  const { data: dup } = await admin.from("posts").select("id").eq("title", it.title).limit(1);
  if (dup && dup.length) {
    console.log(`YA EXISTE "${it.title}"`);
    continue;
  }
  const { error } = await admin.from("posts").insert({
    status: "borrador",
    audience,
    category: it.category,
    format: it.format ?? "nota",
    title: String(it.title).slice(0, 200),
    summary: String(it.summary ?? "").slice(0, 400),
    body: reviewer + String(it.body ?? ""),
    image_url: httpsOrNull(it.image_url),
    media_url: httpsOrNull(it.media_url),
    sources,
    author: "Equipo SaludOcupacional",
  });
  if (error) console.log(`ERROR     "${it.title}": ${error.message}`);
  else {
    ok++;
    console.log(`BORRADOR  "${it.title}" (${audience.join(", ")})`);
  }
}
console.log(`\n${ok} borrador(es) cargado(s). Revisalos en Administración → Comunidad.`);
