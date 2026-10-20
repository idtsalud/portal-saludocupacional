import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Avisos que envía la planilla "Aviso Medico - IDT" (hoja Avisos) desde su Apps Script.
 * Solo llegan estos campos: el motivo y cualquier dato de salud se quedan en la planilla.
 */
export type IncomingAviso = {
  id_aviso: string;
  fecha_hora: string;
  empresa: string;
  colaborador: string;
  certificado?: string;
  reposo_indicado?: string;
  estado?: string;
};

export type IngestResult = { read: number; saved: number; skippedNoCompany: number; skippedInvalid: number; companiesWithoutMatch: string[] };

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const yes = (v?: string) => (v ? /^s[ií]/i.test(v.trim()) : null);

export async function ingestAvisos(rows: IncomingAviso[]): Promise<IngestResult> {
  const admin = createAdminClient();
  const { data: orgs } = await admin.from("organizations").select("id, sheet_company_key").not("sheet_company_key", "is", null);
  const orgByKey = new Map((orgs ?? []).map((o) => [norm(o.sheet_company_key as string), o.id as string]));

  const records: Record<string, unknown>[] = [];
  const unmatched = new Set<string>();
  let skippedNoCompany = 0;
  let skippedInvalid = 0;
  for (const r of rows) {
    const id = String(r.id_aviso ?? "").trim();
    const received = new Date(String(r.fecha_hora ?? ""));
    const collaborator = String(r.colaborador ?? "").trim();
    if (!id || isNaN(received.getTime()) || !collaborator) { skippedInvalid++; continue; }
    const orgId = orgByKey.get(norm(String(r.empresa ?? "")));
    if (!orgId) { skippedNoCompany++; unmatched.add(String(r.empresa ?? "").trim()); continue; }
    const cert = yes(r.certificado);
    records.push({
      org_id: orgId,
      external_id: id.slice(0, 80),
      received_at: received.toISOString(),
      collaborator: collaborator.slice(0, 160),
      days: null,
      certificate_status: cert == null ? null : cert ? "Recibido" : "Pendiente",
      rest_indicated: yes(r.reposo_indicado),
      status: String(r.estado ?? "").trim().slice(0, 80) || null,
      synced_at: new Date().toISOString(),
    });
  }

  let saved = 0;
  for (let i = 0; i < records.length; i += 500) {
    const chunk = records.slice(i, i + 500);
    const { error } = await admin.from("avisos").upsert(chunk, { onConflict: "external_id" });
    if (error) {
      await admin.from("sync_state").update({ last_error: `No se pudieron guardar los avisos: ${error.message}`.slice(0, 500) }).eq("id", "avisos");
      throw new Error(error.message);
    }
    saved += chunk.length;
  }

  const companiesWithoutMatch = [...unmatched].filter(Boolean);
  await admin
    .from("sync_state")
    .update({
      last_synced_at: new Date().toISOString(),
      rows_read: rows.length,
      last_error: companiesWithoutMatch.length
        ? `Avisos de empresas sin organización en el portal: ${companiesWithoutMatch.join(", ")}. Si son clientes, completá su "Nombre en la planilla".`
        : null,
    })
    .eq("id", "avisos");

  return { read: rows.length, saved, skippedNoCompany, skippedInvalid, companiesWithoutMatch };
}

/** Estado legible: "PENDIENTE_EVALUACION" → "Pendiente de evaluación". */
export function prettyStatus(s: string | null) {
  if (!s) return "—";
  if (/^PENDIENTE_EVALUACION$/i.test(s)) return "Pendiente de evaluación";
  const t = s.replace(/_/g, " ").toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}
