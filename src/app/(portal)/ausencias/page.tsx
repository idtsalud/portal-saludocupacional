import Link from "next/link";
import { redirect } from "next/navigation";
import { AutoRefresh } from "@/components/AutoRefresh";
import { Icon } from "@/components/Icon";
import { PrintButton } from "@/components/PrintButton";
import { shownStatus } from "@/lib/medico";
import { loadMonth, monthLabel, parseMonth, restDays, shiftMonth, summarize, ymd } from "@/lib/ausentismo";
import { canSeeAbsences, requireOrg } from "@/lib/session";
import { fmtDate, fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const yn = (v: boolean | null) => (v == null ? <span className="muted">—</span> : v ? <span className="chip ok">Sí</span> : <span className="chip warn">No</span>);
const shortDay = (d: string) => `${d.slice(8)}/${d.slice(5, 7)}`;

export default async function Ausencias({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase, org, profile, has } = await requireOrg();
  if (!has("aviso_medico") || !canSeeAbsences(profile)) redirect("/");

  const m = parseMonth(sp.mes);
  const isCurrent = m === ymd(new Date()).slice(0, 7);
  const prev = shiftMonth(m, -1);
  const [{ avisos, canSeeMotivo }, { avisos: prevAvisos }] = await Promise.all([loadMonth(supabase, org.id, m), loadMonth(supabase, org.id, prev)]);
  const s = summarize(avisos, m);
  const delta = s.total - prevAvisos.length;

  // Ausentes hoy: también cuenta reposos de avisos del mes anterior que siguen vigentes.
  const absentToday = isCurrent ? [...s.absentToday, ...summarize(prevAvisos, prev).absentToday] : [];
  const maxDay = Math.max(1, ...s.perDay.map((d) => d.count));

  return (
    <>
      {isCurrent && <AutoRefresh seconds={300} />}
      <div className="head">
        <div>
          <h1>Ausentismo</h1>
          <p>Los avisos que tu equipo manda a Aviso Médico, en vivo. Se actualizan cada 10 minutos.</p>
        </div>
        <div className="head-actions no-print">
          <a className="btn sec" href={`/api/ausencias/csv?mes=${m}`}><Icon name="down" />Descargar Excel</a>
          <PrintButton />
        </div>
      </div>

      <div className="month-nav no-print">
        <Link className="btn ghost" href={`/ausencias?mes=${prev}`} aria-label="Mes anterior">‹ {monthLabel(prev)}</Link>
        <b>{monthLabel(m)}{isCurrent ? " · en curso" : ""}</b>
        {!isCurrent ? <Link className="btn ghost" href={`/ausencias?mes=${shiftMonth(m, 1)}`} aria-label="Mes siguiente">{monthLabel(shiftMonth(m, 1))} ›</Link> : <span />}
      </div>
      <p className="print-only"><b>{org.name}</b> · Reporte de ausentismo · {monthLabel(m)}</p>

      <div className="kpi-grid">
        <section className="card kpi">
          <b>{s.total}</b>
          <span>Avisos del mes</span>
          <small className={delta > 0 ? "up" : delta < 0 ? "down" : ""}>{delta === 0 ? "Igual que" : delta > 0 ? `${delta} más que` : `${-delta} menos que`} {monthLabel(prev).split(" ")[0].toLowerCase()}</small>
        </section>
        <section className="card kpi"><b>{s.people.length}</b><span>Personas con aviso</span></section>
        <section className="card kpi"><b>{s.restDays}</b><span>Días de reposo indicados</span><small>{s.withRest} avisos con reposo</small></section>
        <section className="card kpi"><b>{s.noCert}</b><span>Sin certificado</span><small>{s.toEvaluate} en seguimiento médico</small></section>
        {isCurrent && <section className="card kpi alert-kpi"><b>{absentToday.length}</b><span>Con reposo hoy</span></section>}
        {s.notifiedPct != null && <section className="card kpi"><b>{s.notifiedPct}%</b><span>Avisaron a su supervisor</span></section>}
      </div>

      {isCurrent && absentToday.length > 0 && (
        <section className="card">
          <h2>Con reposo hoy</h2>
          <div className="list">
            {absentToday.map((a) => (
              <div className="li" key={a.id}>
                <div className="grow"><b>{a.collaborator}</b><span>Reposo del {shortDay(a.rest_from!)} al {shortDay(a.rest_to ?? a.rest_from!)}{canSeeMotivo && a.motivo ? ` · ${a.motivo}` : ""}</span></div>
                <span className="chip info">Vuelve el {shortDay(new Date(Date.parse(a.rest_to ?? a.rest_from!) + 86400000).toISOString().slice(0, 10))}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="split">
        <section className="card">
          <h2>Avisos por día</h2>
          <div className="day-bars" role="img" aria-label={`Avisos por día de ${monthLabel(m)}`}>
            {s.perDay.map((d) => (
              <div key={d.day} className="day-bar" title={`${d.day}: ${d.count} avisos`}>
                <span style={{ height: `${(d.count / maxDay) * 100}%` }} className={d.count ? "on" : ""} />
                <small>{d.day % 5 === 1 ? d.day : ""}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="card">
          <h2>Por persona</h2>
          {s.people.length > 0 ? (
            <div className="tbl">
              <table>
                <thead><tr><th>Colaborador</th><th className="num">Avisos</th><th className="num">Días de reposo</th><th>Último aviso</th></tr></thead>
                <tbody>
                  {s.people.map((p) => (
                    <tr key={p.name}><td><b>{p.name}</b></td><td className="num">{p.avisos}</td><td className="num">{p.restDays}</td><td className="num">{fmtDate(p.last)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">Sin avisos este mes.</p>
          )}
        </section>
      </div>

      <section className="card">
        <h2>Detalle de avisos</h2>
        <p className="small muted" style={{ marginBottom: 12 }}>
          Recorrido de cada aviso: avisó a su supervisor → avisó a Aviso Médico → consulta médica → certificado y reposo.
        </p>
        {avisos.length > 0 ? (
          <div className="tbl">
            <table>
              <thead>
                <tr>
                  <th>Colaborador</th><th>Aviso</th>
                  {canSeeMotivo && <th>Motivo</th>}
                  <th>Avisó al supervisor</th><th>Consultó médico</th><th>Certificado</th><th>Reposo</th><th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {avisos.map((a) => (
                  <tr key={a.id}>
                    <td><b>{a.collaborator}</b></td>
                    <td className="num">{fmtDateTime(a.received_at)}</td>
                    {canSeeMotivo && <td>{a.motivo ?? "—"}</td>}
                    <td>{yn(a.notified_employer)}</td>
                    <td>{yn(a.consulted_doctor)}</td>
                    <td>{a.certificate_status ? <span className={"chip " + (a.certificate_status === "Recibido" ? "ok" : "warn")}>{a.certificate_status}</span> : "—"}</td>
                    <td className="num">{a.rest_from ? `${shortDay(a.rest_from)} al ${shortDay(a.rest_to ?? a.rest_from)} · ${restDays(a)} d` : a.rest_indicated === false ? "Sin reposo" : a.rest_indicated ? "Sí" : "—"}</td>
                    <td><span className={"chip " + shownStatus(a).tone}>{shownStatus(a).label}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No hubo avisos en {monthLabel(m).toLowerCase()}.</p>
        )}
        {!canSeeMotivo && (
          <p className="note" style={{ marginTop: 12 }}>
            <Icon name="shield" />
            <span>El motivo es un dato de salud: lo ve el equipo médico de IDT.</span>
          </p>
        )}
      </section>
    </>
  );
}
