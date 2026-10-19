import "server-only";
import { createHash } from "node:crypto";
import { JWT } from "google-auth-library";
import { createAdminClient } from "@/lib/supabase/admin";
import { AVISOS_COLUMNS } from "./avisos-config";

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

function findCol(header: string[], candidates: readonly string[]) {
  const h = header.map(norm);
  for (const c of candidates) {
    const i = h.indexOf(norm(c));
    if (i >= 0) return i;
  }
  return -1;
}

/** Fechas de Google Sheets: "19/10/2026 07:12:00", "2026-10-19", o número de serie. Hora de Argentina. */
function parseDate(v: string): Date | null {
  if (!v) return null;
  const s = v.trim();
  if (/^\d+(\.\d+)?$/.test(s)) {
    const ms = Math.round((Number(s) - 25569) * 86400 * 1000);
    return new Date(ms + 3 * 3600 * 1000);
  }
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) {
    const y = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    const iso = `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}T${(m[4] ?? "0").padStart(2, "0")}:${m[5] ?? "00"}:${m[6] ?? "00"}-03:00`;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

async function readSheet(): Promise<string[][]> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const sheetId = process.env.AVISOS_SHEET_ID;
  const range = process.env.AVISOS_SHEET_RANGE ?? "A:Z";
  if (!email || !key || !sheetId) throw new Error("Falta configurar Google Sheets (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, AVISOS_SHEET_ID).");

  const jwt = new JWT({ email, key, scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"] });
  const { token } = await jwt.getAccessToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}?valueRenderOption=FORMATTED_VALUE`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!res.ok) throw new Error(`Google Sheets respondió ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { values?: string[][] };
  return json.values ?? [];
}

export type SyncResult = { read: number; saved: number; skippedNoCompany: number; skippedInvalid: number };

/** Lee la planilla y guarda/actualiza los avisos de las organizaciones que tienen Aviso Médico. */
export async function syncAvisos(): Promise<SyncResult> {
  const admin = createAdminClient();
  try {
    const rows = await readSheet();
    if (rows.length < 2) return await finish(admin, { read: 0, saved: 0, skippedNoCompany: 0, skippedInvalid: 0 });

    const [header, ...data] = rows;
    const col = {
      id: findCol(header, AVISOS_COLUMNS.id),
      company: findCol(header, AVISOS_COLUMNS.company),
      receivedAt: findCol(header, AVISOS_COLUMNS.receivedAt),
      collaborator: findCol(header, AVISOS_COLUMNS.collaborator),
      days: findCol(header, AVISOS_COLUMNS.days),
      certificate: findCol(header, AVISOS_COLUMNS.certificate),
      status: findCol(header, AVISOS_COLUMNS.status),
    };
    if (col.company < 0 || col.receivedAt < 0 || col.collaborator < 0) {
      throw new Error(`La planilla no tiene las columnas mínimas (empresa, fecha, colaborador). Encabezado leído: ${header.join(" | ")}`);
    }

    const { data: orgs } = await admin
      .from("organizations")
      .select("id, sheet_company_key")
      .eq("has_aviso_medico", true)
      .not("sheet_company_key", "is", null);
    const orgByKey = new Map((orgs ?? []).map((o) => [norm(o.sheet_company_key as string), o.id as string]));

    const records: Record<string, unknown>[] = [];
    let skippedNoCompany = 0;
    let skippedInvalid = 0;
    for (const r of data) {
      const cell = (i: number) => (i >= 0 ? String(r[i] ?? "").trim() : "");
      const orgId = orgByKey.get(norm(cell(col.company)));
      if (!orgId) { skippedNoCompany++; continue; }
      const received = parseDate(cell(col.receivedAt));
      const collaborator = cell(col.collaborator);
      if (!received || !collaborator) { skippedInvalid++; continue; }
      const rawId = cell(col.id);
      const externalId = rawId || createHash("sha256").update(`${cell(col.company)}|${cell(col.receivedAt)}|${collaborator}`).digest("hex").slice(0, 32);
      const daysNum = parseInt(cell(col.days), 10);
      records.push({
        org_id: orgId,
        external_id: externalId,
        received_at: received.toISOString(),
        collaborator: collaborator.slice(0, 160),
        days: Number.isFinite(daysNum) ? daysNum : null,
        certificate_status: cell(col.certificate).slice(0, 60) || null,
        status: cell(col.status).slice(0, 60) || null,
        synced_at: new Date().toISOString(),
      });
    }

    let saved = 0;
    for (let i = 0; i < records.length; i += 500) {
      const chunk = records.slice(i, i + 500);
      const { error } = await admin.from("avisos").upsert(chunk, { onConflict: "external_id" });
      if (error) throw new Error(`No se pudieron guardar los avisos: ${error.message}`);
      saved += chunk.length;
    }
    return await finish(admin, { read: data.length, saved, skippedNoCompany, skippedInvalid });
  } catch (e) {
    await admin.from("sync_state").update({ last_error: (e as Error).message.slice(0, 500) }).eq("id", "avisos");
    throw e;
  }
}

async function finish(admin: ReturnType<typeof createAdminClient>, r: SyncResult) {
  await admin.from("sync_state").update({ last_synced_at: new Date().toISOString(), last_error: null, rows_read: r.read }).eq("id", "avisos");
  return r;
}

/** Sincroniza solo si pasaron más de `minutes` desde la última vez. Se usa al abrir la pantalla de ausencias. */
export async function syncIfStale(minutes = 10) {
  if (!process.env.AVISOS_SHEET_ID) return;
  const admin = createAdminClient();
  const { data } = await admin.from("sync_state").select("last_synced_at").eq("id", "avisos").single();
  const last = data?.last_synced_at ? new Date(data.last_synced_at).getTime() : 0;
  if (Date.now() - last < minutes * 60 * 1000) return;
  try { await syncAvisos(); } catch { /* el error queda en sync_state y se ve en Administración */ }
}
