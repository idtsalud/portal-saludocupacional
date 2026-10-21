import "server-only";
import type { createClient } from "@/lib/supabase/server";

type Supa = Awaited<ReturnType<typeof createClient>>;

export const TZ = "America/Argentina/Buenos_Aires";
export const ymd = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);

export type Aviso = {
  id: number;
  received_at: string;
  collaborator: string;
  notified_employer: boolean | null;
  consulted_doctor: boolean | null;
  certificate_status: string | null;
  rest_indicated: boolean | null;
  rest_from: string | null;
  rest_to: string | null;
  status: string | null;
  motivo: string | null;
};

/** Mes pedido (AAAA-MM) o el actual. */
export function parseMonth(m?: string) {
  const current = ymd(new Date()).slice(0, 7);
  return m && /^\d{4}-(0[1-9]|1[0-2])$/.test(m) && m <= current ? m : current;
}

export function shiftMonth(m: string, delta: number) {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export const monthLabel = (m: string) => {
  const [y, mo] = m.split("-").map(Number);
  const s = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, mo - 1, 15)));
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const daysInMonth = (m: string) => {
  const [y, mo] = m.split("-").map(Number);
  return new Date(Date.UTC(y, mo, 0)).getUTCDate();
};

/** Días de reposo dentro del mes (cuenta desde/hasta inclusive, recortado al mes). */
export function restDaysInMonth(a: Pick<Aviso, "rest_from" | "rest_to">, m: string) {
  if (!a.rest_from) return 0;
  const start = a.rest_from > `${m}-01` ? a.rest_from : `${m}-01`;
  const lastDay = `${m}-${String(daysInMonth(m)).padStart(2, "0")}`;
  const to = a.rest_to ?? a.rest_from;
  const end = to < lastDay ? to : lastDay;
  if (end < start) return 0;
  return Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
}

export const restDays = (a: Pick<Aviso, "rest_from" | "rest_to">) =>
  a.rest_from ? Math.round((Date.parse(a.rest_to ?? a.rest_from) - Date.parse(a.rest_from)) / 86400000) + 1 : null;

/** Avisos del mes de una organización, con el motivo si la empresa tiene permiso para verlo. */
export async function loadMonth(supabase: Supa, orgId: string, m: string) {
  const from = new Date(`${m}-01T00:00:00-03:00`).toISOString();
  const to = new Date(`${shiftMonth(m, 1)}-01T00:00:00-03:00`).toISOString();
  const fields = "id, received_at, collaborator, notified_employer, consulted_doctor, certificate_status, rest_indicated, rest_from, rest_to, status";
  let res = await supabase.from("avisos").select(fields).eq("org_id", orgId).gte("received_at", from).lt("received_at", to).order("received_at", { ascending: false }).limit(5000);
  // Antes de la migración 0006 no existen las columnas de trazabilidad.
  if (res.error) res = (await supabase.from("avisos").select("id, received_at, collaborator, certificate_status, rest_indicated, status").eq("org_id", orgId).gte("received_at", from).lt("received_at", to).order("received_at", { ascending: false }).limit(5000)) as typeof res;
  const rows = (res.data ?? []) as Omit<Aviso, "motivo">[];

  const { data: motivos, error: mErr } = rows.length
    ? await supabase.from("aviso_motivos").select("aviso_id, motivo").in("aviso_id", rows.map((r) => r.id))
    : { data: [], error: null };
  const motivoById = new Map((motivos ?? []).map((x) => [x.aviso_id as number, x.motivo as string]));
  const avisos: Aviso[] = rows.map((r) => ({
    ...r,
    notified_employer: r.notified_employer ?? null,
    consulted_doctor: r.consulted_doctor ?? null,
    rest_from: r.rest_from ?? null,
    rest_to: r.rest_to ?? null,
    motivo: motivoById.get(r.id) ?? null,
  }));
  return { avisos, canSeeMotivo: !mErr && motivoById.size > 0 };
}

export function summarize(avisos: Aviso[], m: string) {
  const today = ymd(new Date());
  const people = new Map<string, { name: string; avisos: number; restDays: number; last: string }>();
  for (const a of avisos) {
    const key = a.collaborator.trim().toLowerCase();
    const p = people.get(key) ?? { name: a.collaborator, avisos: 0, restDays: 0, last: a.received_at };
    p.avisos++;
    p.restDays += restDaysInMonth(a, m);
    if (a.received_at > p.last) p.last = a.received_at;
    people.set(key, p);
  }
  const perDay = Array.from({ length: daysInMonth(m) }, (_, i) => ({ day: i + 1, count: 0 }));
  for (const a of avisos) {
    const d = ymd(new Date(a.received_at));
    if (d.startsWith(m)) perDay[Number(d.slice(8)) - 1].count++;
  }
  const withNotice = avisos.filter((a) => a.notified_employer != null);
  return {
    total: avisos.length,
    people: [...people.values()].sort((a, b) => b.avisos - a.avisos || b.restDays - a.restDays),
    restDays: avisos.reduce((s, a) => s + restDaysInMonth(a, m), 0),
    withRest: avisos.filter((a) => a.rest_indicated).length,
    noCert: avisos.filter((a) => a.certificate_status === "Pendiente").length,
    toEvaluate: avisos.filter((a) => /pendiente/i.test(a.status ?? "")).length,
    absentToday: avisos.filter((a) => a.rest_from && a.rest_from <= today && (a.rest_to ?? a.rest_from) >= today),
    notifiedPct: withNotice.length ? Math.round((withNotice.filter((a) => a.notified_employer).length / withNotice.length) * 100) : null,
    perDay,
  };
}
