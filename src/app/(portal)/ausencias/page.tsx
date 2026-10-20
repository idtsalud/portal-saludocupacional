import { redirect } from "next/navigation";
import { Icon } from "@/components/Icon";
import { syncIfStale } from "@/lib/avisos-sync";
import { canSeeAbsences, requireOrg } from "@/lib/session";
import { fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const TZ = "America/Argentina/Buenos_Aires";
const ymd = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
const ym = (d: Date) => ymd(d).slice(0, 7);
const MONTH = new Intl.DateTimeFormat("es-AR", { timeZone: TZ, month: "short" });

export default async function Ausencias() {
  const { supabase, org, profile, has } = await requireOrg();
  if (!has("aviso_medico") || !canSeeAbsences(profile)) redirect("/");

  await syncIfStale(10);

  const since = new Date();
  since.setMonth(since.getMonth() - 6);
  const { data } = await supabase
    .from("avisos")
    .select("id, received_at, collaborator, days, certificate_status, status")
    .eq("org_id", org.id)
    .gte("received_at", since.toISOString())
    .order("received_at", { ascending: false })
    .limit(2000);
  const avisos = data ?? [];

  const today = ymd(new Date());
  const todays = avisos.filter((a) => ymd(new Date(a.received_at)) === today);
  const active = avisos.filter((a) => /activ|seguim/i.test(a.status ?? ""));
  const pending = avisos.filter((a) => /^pend/i.test(a.certificate_status ?? ""));

  // Avisos por mes, últimos 6 meses
  const months: { key: string; label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push({ key: ym(d), label: MONTH.format(d).replace(".", ""), count: 0 });
  }
  for (const a of avisos) {
    const m = months.find((x) => x.key === ym(new Date(a.received_at)));
    if (m) m.count++;
  }
  const max = Math.max(1, ...months.map((m) => m.count));
  const W = 520, H = 200, pad = 28, bw = 46;
  const gap = (W - pad * 2 - bw * months.length) / (months.length - 1);

  const recent = avisos.slice(0, 30);
  const tone = (s: string | null) => (/^pend/i.test(s ?? "") ? "warn" : /recib/i.test(s ?? "") ? "ok" : "off");

  return (
    <>
      <div className="head">
        <h1>Ausencias</h1>
        <p>Los avisos que tu equipo manda por WhatsApp, ordenados por el asistente de Aviso Médico.</p>
      </div>
      <div className="grid g3">
        <section className="card kpi"><b>{todays.length}</b><span>Avisos de hoy</span></section>
        <section className="card kpi"><b>{active.length}</b><span>Licencias activas</span></section>
        <section className="card kpi"><b>{pending.length}</b><span>Certificados pendientes</span></section>
      </div>

      <section className="card">
        <h2>Últimos avisos</h2>
        {recent.length > 0 ? (
          <div className="tbl">
            <table>
              <thead><tr><th>Colaborador</th><th>Aviso</th><th>Días</th><th>Certificado</th><th>Estado</th></tr></thead>
              <tbody>
                {recent.map((a) => (
                  <tr key={a.id}>
                    <td><b>{a.collaborator}</b></td>
                    <td className="num">{fmtDateTime(a.received_at)}</td>
                    <td className="num">{a.days ?? "—"}</td>
                    <td>{a.certificate_status ? <span className={"chip " + tone(a.certificate_status)}>{a.certificate_status}</span> : "—"}</td>
                    <td>{a.status ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">Todavía no hay avisos de tu equipo en los últimos 6 meses.</p>
        )}
        <p className="note" style={{ marginTop: 12 }}>
          <Icon name="shield" />
          <span>RR.HH. ve el estado, los días y si llegó el certificado. El diagnóstico lo ve solo el equipo médico.</span>
        </p>
      </section>

      <section className="card">
        <h2>Avisos por mes</h2>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Cantidad de avisos de ausencia por mes, últimos seis meses">
          <line x1={pad} x2={W - pad} y1={H - 28} y2={H - 28} stroke="var(--line)" />
          {months.map((m, i) => {
            const h = Math.round((m.count / max) * (H - 60));
            const x = pad + i * (bw + gap);
            const y = H - 28 - h;
            return (
              <g key={m.key}>
                <rect x={x} y={y} width={bw} height={h} rx={6} fill="var(--brand)" opacity={i === months.length - 1 ? 0.5 : 1} />
                <text x={x + bw / 2} y={y - 7} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--ink)">{m.count}</text>
                <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize="12" fill="var(--muted)">{m.label}</text>
              </g>
            );
          })}
        </svg>
        <p className="small muted">El mes actual está incompleto.</p>
      </section>
    </>
  );
}
