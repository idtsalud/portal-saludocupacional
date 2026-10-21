import Link from "next/link";
import { AutoRefresh } from "@/components/AutoRefresh";
import { Flash } from "@/components/Flash";
import { requireMedico } from "@/lib/session";
import { fmtDateTime } from "@/lib/format";
import { MEDICAL_STATUS, shownStatus } from "@/lib/medico";
import { restDays, ymd } from "@/lib/ausentismo";
import { updateMedicalStatus } from "./actions";

export const dynamic = "force-dynamic";

type Row = {
  id: number;
  org_id: string;
  received_at: string;
  collaborator: string;
  notified_employer: boolean | null;
  consulted_doctor: boolean | null;
  certificate_status: string | null;
  rest_indicated: boolean | null;
  rest_from: string | null;
  rest_to: string | null;
  status: string | null;
  medical_status: string | null;
  medical_note: string | null;
  medical_updated_at: string | null;
};

const yn = (v: boolean | null) => (v == null ? "—" : v ? "Sí" : "No");
const shortDay = (d: string) => `${d.slice(8)}/${d.slice(5, 7)}`;
const isDemo = (name: string) => /de demostraci[oó]n\)?$/i.test(name);

export default async function MedicoBandeja({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase } = await requireMedico();
  const ver = sp.ver === "todos" ? "todos" : "pendientes";
  const dias = [7, 30, 90].includes(Number(sp.dias)) ? Number(sp.dias) : 30;
  const since = new Date(Date.now() - dias * 86400000).toISOString();

  const [{ data: orgRows }, { data: avisoRows }] = await Promise.all([
    supabase.from("organizations").select("id, name"),
    supabase
      .from("avisos")
      .select("id, org_id, received_at, collaborator, notified_employer, consulted_doctor, certificate_status, rest_indicated, rest_from, rest_to, status, medical_status, medical_note, medical_updated_at")
      .gte("received_at", since)
      .order("received_at", { ascending: false })
      .limit(1000),
  ]);
  const orgName = new Map((orgRows ?? []).map((o) => [o.id as string, o.name as string]));
  const all = ((avisoRows ?? []) as Row[]).filter((a) => !isDemo(orgName.get(a.org_id) ?? ""));
  const orgsWithAvisos = [...new Set(all.map((a) => a.org_id))].map((id) => ({ id, name: orgName.get(id) ?? "—" })).sort((a, b) => a.name.localeCompare(b.name));
  const empresa = sp.empresa && orgsWithAvisos.some((o) => o.id === sp.empresa) ? sp.empresa : "";

  const byOrg = empresa ? all.filter((a) => a.org_id === empresa) : all;
  const pending = byOrg.filter((a) => shownStatus(a).open);
  const list = ver === "pendientes" ? pending : byOrg;

  const { data: motivos } = list.length ? await supabase.from("aviso_motivos").select("aviso_id, motivo").in("aviso_id", list.map((a) => a.id)) : { data: [] };
  const motivoBy = new Map((motivos ?? []).map((m) => [m.aviso_id as number, m.motivo as string]));

  const today = ymd(new Date());
  const todays = byOrg.filter((a) => ymd(new Date(a.received_at)) === today).length;
  const onRest = byOrg.filter((a) => a.rest_from && a.rest_from <= today && (a.rest_to ?? a.rest_from) >= today).length;
  const noCert = byOrg.filter((a) => a.certificate_status === "Pendiente").length;

  const qs = (extra: Record<string, string>) => {
    const p = new URLSearchParams({ ...(empresa ? { empresa } : {}), ver, dias: String(dias), ...extra });
    return `/medico?${p.toString()}`;
  };
  const back = qs({});

  return (
    <>
      <AutoRefresh seconds={300} />
      <div className="head">
        <div>
          <h1>Avisos de las empresas</h1>
          <p>Lo que llega a Aviso Médico, en vivo. Cada estado que cargues lo ve la empresa en su portal.</p>
        </div>
      </div>
      <Flash ok={sp.ok} error={sp.error} />

      <div className="stat-grid">
        <div className="card stat warn"><span className="stat-label">Pendientes</span><b className="stat-value">{pending.length}</b><span className="stat-detail">Sin cerrar el seguimiento</span></div>
        <div className="card stat"><span className="stat-label">Avisos de hoy</span><b className="stat-value">{todays}</b></div>
        <div className="card stat"><span className="stat-label">Con reposo hoy</span><b className="stat-value">{onRest}</b></div>
        <div className="card stat"><span className="stat-label">Sin certificado</span><b className="stat-value">{noCert}</b><span className="stat-detail">Últimos {dias} días</span></div>
      </div>

      <form className="card filters" method="get" action="/medico">
        <label htmlFor="empresa">
          Empresa
          <select id="empresa" name="empresa" defaultValue={empresa}>
            <option value="">Todas</option>
            {orgsWithAvisos.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </label>
        <label htmlFor="ver">
          Mostrar
          <select id="ver" name="ver" defaultValue={ver}>
            <option value="pendientes">Solo pendientes</option>
            <option value="todos">Todos</option>
          </select>
        </label>
        <label htmlFor="dias">
          Período
          <select id="dias" name="dias" defaultValue={String(dias)}>
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
          </select>
        </label>
        <button className="btn sec" type="submit">Filtrar</button>
      </form>

      {list.length === 0 ? (
        <section className="card">
          <p className="muted">{ver === "pendientes" ? "No hay avisos pendientes. " : "No hay avisos en este período. "}<Link href={qs({ ver: "todos" })}>Ver todos</Link></p>
        </section>
      ) : (
        <div className="medico-list">
          {list.map((a) => {
            const st = shownStatus(a);
            return (
              <article className="card medico-item" key={a.id} id={`aviso-${a.id}`}>
                <div className="medico-head">
                  <div>
                    <b>{a.collaborator}</b>
                    <span className="muted small"> · {orgName.get(a.org_id)} · {fmtDateTime(a.received_at)}</span>
                  </div>
                  <span className={"chip " + st.tone}>{st.label}</span>
                </div>
                <dl className="medico-facts">
                  <div><dt>Motivo</dt><dd>{motivoBy.get(a.id) ?? "—"}</dd></div>
                  <div><dt>Avisó al supervisor</dt><dd>{yn(a.notified_employer)}</dd></div>
                  <div><dt>Consultó médico</dt><dd>{yn(a.consulted_doctor)}</dd></div>
                  <div><dt>Certificado</dt><dd>{a.certificate_status ?? "—"}</dd></div>
                  <div><dt>Reposo</dt><dd>{a.rest_from ? `${shortDay(a.rest_from)} al ${shortDay(a.rest_to ?? a.rest_from)} · ${restDays(a)} d` : a.rest_indicated ? "Sí" : a.rest_indicated === false ? "No" : "—"}</dd></div>
                </dl>
                <form className="medico-form" action={updateMedicalStatus}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="back" value={back} />
                  <select name="medical_status" defaultValue={a.medical_status ?? "pendiente_contacto"} aria-label={`Estado del aviso de ${a.collaborator}`}>
                    {Object.entries(MEDICAL_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <input name="medical_note" defaultValue={a.medical_note ?? ""} placeholder="Nota interna (opcional)" aria-label="Nota interna" maxLength={500} />
                  <button className="btn" type="submit">Guardar</button>
                </form>
                {a.medical_updated_at && <p className="small muted">Último cambio: {fmtDateTime(a.medical_updated_at)}</p>}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
