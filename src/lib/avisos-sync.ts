import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Avisos que envía la planilla "Aviso Medico - IDT" (hoja Avisos) desde su Apps Script.
 * No llegan DNI ni teléfono. El motivo se guarda aparte (aviso_motivos) y la empresa lo ve solo si IDT lo habilita.
 */
export type IncomingAviso = {
  id_aviso: string;
  fecha_hora: string;
  empresa: string;
  colaborador: string;
  aviso_empresa?: string;
  motivo?: string;
  consulto_medico?: string;
  certificado?: string;
  reposo_indicado?: string;
  reposo_desde?: string;
  reposo_hasta?: string;
  estado?: string;
};

export type IngestResult = { read: number; saved: number; skippedNoCompany: number; skippedInvalid: number; skippedBefore: number; companiesWithoutMatch: string[] };

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const yes = (v?: string) => (v && v.trim() ? /^s[ií]/i.test(v.trim()) : null);

/** Fecha del día en Argentina (AAAA-MM-DD) desde "07/10/2026", "2026-10-07" o una fecha ISO con hora. */
export function toDay(v?: string): string | null {
  const t = String(v ?? "").trim();
  if (!t) return null;
  const dmy = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const d = new Date(t);
  return isNaN(d.getTime()) ? null : new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(d);
}

export async function ingestAvisos(rows: IncomingAviso[]): Promise<IngestResult> {
  const admin = createAdminClient();
  type OrgKey = { id: string; sheet_company_key: string; avisos_desde?: string | null };
  const withDate = await admin.from("organizations").select("id, sheet_company_key, avisos_desde").not("sheet_company_key", "is", null);
  // Antes de correr la migración 0005 no existe avisos_desde: se toman todos los avisos.
  const orgs: OrgKey[] | null = withDate.error
    ? (await admin.from("organizations").select("id, sheet_company_key").not("sheet_company_key", "is", null)).data
    : withDate.data;
  const orgByKey = new Map((orgs ?? []).map((o) => [norm(o.sheet_company_key), o]));
  let skippedBefore = 0;
  // Antes de correr la migración 0006 no existen las columnas de trazabilidad: se guarda lo básico.
  const full = !(await admin.from("avisos").select("rest_from").limit(1)).error;

  const records: Record<string, unknown>[] = [];
  const motivos = new Map<string, { org_id: string; motivo: string }>();
  const unmatched = new Set<string>();
  let skippedNoCompany = 0;
  let skippedInvalid = 0;
  for (const r of rows) {
    const id = String(r.id_aviso ?? "").trim();
    const received = new Date(String(r.fecha_hora ?? ""));
    const collaborator = String(r.colaborador ?? "").trim();
    if (!id || isNaN(received.getTime()) || !collaborator) { skippedInvalid++; continue; }
    const org = orgByKey.get(norm(String(r.empresa ?? "")));
    if (!org) { skippedNoCompany++; unmatched.add(String(r.empresa ?? "").trim()); continue; }
    // Avisos anteriores al inicio del servicio (por ejemplo, pruebas en la planilla) no se toman.
    if (org.avisos_desde && received < new Date(org.avisos_desde)) { skippedBefore++; continue; }
    const cert = yes(r.certificado);
    records.push({
      org_id: org.id,
      external_id: id.slice(0, 80),
      received_at: received.toISOString(),
      collaborator: collaborator.slice(0, 160),
      days: null,
      certificate_status: cert == null ? null : cert ? "Recibido" : "Pendiente",
      rest_indicated: yes(r.reposo_indicado),
      status: String(r.estado ?? "").trim().slice(0, 80) || null,
      synced_at: new Date().toISOString(),
      ...(full
        ? {
            notified_employer: yes(r.aviso_empresa),
            consulted_doctor: yes(r.consulto_medico),
            rest_from: toDay(r.reposo_desde),
            rest_to: toDay(r.reposo_hasta),
          }
        : {}),
    });
    const motivo = String(r.motivo ?? "").trim();
    if (full && motivo) motivos.set(id.slice(0, 80), { org_id: org.id, motivo: motivo.slice(0, 300) });
  }

  let saved = 0;
  for (let i = 0; i < records.length; i += 500) {
    const chunk = records.slice(i, i + 500);
    const { data: savedRows, error } = await admin.from("avisos").upsert(chunk, { onConflict: "external_id" }).select("id, external_id");
    if (error) {
      await admin.from("sync_state").update({ last_error: `No se pudieron guardar los avisos: ${error.message}`.slice(0, 500) }).eq("id", "avisos");
      throw new Error(error.message);
    }
    saved += chunk.length;
    const motivoRows = (savedRows ?? []).flatMap((a) => {
      const m = motivos.get(a.external_id as string);
      return m ? [{ aviso_id: a.id, ...m }] : [];
    });
    if (motivoRows.length) await admin.from("aviso_motivos").upsert(motivoRows, { onConflict: "aviso_id" });
  }

  const companiesWithoutMatch = [...unmatched].filter(Boolean);
  await admin
    .from("sync_state")
    .update({
      last_synced_at: new Date().toISOString(),
      rows_read: rows.length,
      last_error: companiesWithoutMatch.length
        ? `Avisos de empresas que no son clientes del portal: ${companiesWithoutMatch.join(", ")}. Si son clientes, completá su "Nombre en la planilla".`
        : null,
    })
    .eq("id", "avisos");

  return { read: rows.length, saved, skippedNoCompany, skippedInvalid, skippedBefore, companiesWithoutMatch };
}

/** Estado legible: "PENDIENTE_EVALUACION" → "Pendiente de evaluación". */
export function prettyStatus(s: string | null) {
  if (!s) return "—";
  if (/^PENDIENTE_EVALUACION$/i.test(s)) return "Pendiente de evaluación";
  const t = s.replace(/_/g, " ").toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}
