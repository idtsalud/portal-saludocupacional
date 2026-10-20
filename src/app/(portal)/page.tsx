import Link from "next/link";
import { Benefit } from "@/components/Benefit";
import { Flash } from "@/components/Flash";
import { Icon } from "@/components/Icon";
import { canSeeAbsences, requireOrg } from "@/lib/session";
import { firstName, fmtLongToday } from "@/lib/format";
import { waComercial } from "@/lib/contacto";
import type { ServiceKey } from "@/lib/services";

const TZ = "America/Argentina/Buenos_Aires";
const ymd = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);

export default async function Inicio({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase, org, profile, has } = await requireOrg();
  const comercio = org.kind === "comercio";

  const [{ data: news }, { data: campaigns }, { data: catalog }, { count: collaborators }] = await Promise.all([
    supabase.from("news").select("id, title, body").order("published_at", { ascending: false }).limit(3),
    supabase.from("documents").select("id, title, description").eq("category", "campana").order("created_at", { ascending: false }).limit(1),
    supabase.from("services").select("key, name, audience").eq("active", true).in("audience", ["cliente", "ambos"]).order("sort"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("org_id", org.id).eq("user_type", "colaborador"),
  ]);

  let absent: { today: number; active: number; pendingCert: number } | null = null;
  if (has("aviso_medico") && canSeeAbsences(profile)) {
    const { data: avisos } = await supabase
      .from("avisos")
      .select("received_at, status, certificate_status")
      .eq("org_id", org.id)
      .order("received_at", { ascending: false })
      .limit(500);
    const list = avisos ?? [];
    const today = ymd(new Date());
    absent = {
      today: list.filter((a) => ymd(new Date(a.received_at)) === today).length,
      active: list.filter((a) => /activ|seguim/i.test(a.status ?? "")).length,
      pendingCert: list.filter((a) => /^pend/i.test(a.certificate_status ?? "")).length,
    };
  }

  const unitsLabel = comercio ? "prestaciones" : "UP";
  const services = (catalog ?? [])
    .map((s): [string, boolean, string] => {
      const on = has(s.key as ServiceKey);
      const label = !on ? "Sumar" : s.key === "atencion_sedes" || s.key === "telemedicina" ? `Con ${unitsLabel}` : "Incluido";
      return [s.name as string, on, label];
    })
    .sort((a, b) => Number(b[1]) - Number(a[1]));
  const contracted = services.filter((s) => s[1]);

  const header = (
    <>
      <div className="head">
        <div>
          <h1>Hola{profile.full_name ? `, ${firstName(profile.full_name)}` : ""}</h1>
          <p>{org.name} · {org.plan}</p>
        </div>
        <span className="date small muted">{fmtLongToday()}</span>
      </div>
      <Flash ok={sp.ok} error={sp.error} />
    </>
  );

  const absences = absent && (
    <section className="card">
      <div className="row-h">
        <h2>Ausencias {comercio ? "de tus empleados" : "de tu equipo"}</h2>
        <Link href="/ausencias">Ver detalle</Link>
      </div>
      <div className="kpis">
        <div className="kpi"><b>{absent.today}</b><span>Avisos de hoy</span></div>
        <div className="kpi"><b>{absent.active}</b><span>Licencias activas</span></div>
        <div className="kpi"><b>{absent.pendingCert}</b><span>Certificados pendientes</span></div>
      </div>
    </section>
  );

  const newsCard = (
    <section className="card">
      <h2>Novedades de IDT</h2>
      <div className="list">
        {(news ?? []).map((n) => (
          <div className="li" key={n.id}>
            <div className="grow"><b>{n.title}</b><span>{n.body}</span></div>
          </div>
        ))}
      </div>
    </section>
  );

  /* ───────────── Comercio: lo del día a día, sin datos de más ───────────── */
  if (comercio) {
    const faltaMsg = `Hola, soy de ${org.name}. Un empleado faltó y me trajo un certificado. ¿Cómo sigo?\nNombre del empleado:\nDías del certificado:`;
    return (
      <>
        {header}
        <div className="grid g4">
          <Link className="qa" href="/gestiones">
            <span className="ic"><Icon name="clip" /></span>
            <b>Necesito un turno o un preocupacional</b>
            <span>Te lo pedimos por WhatsApp en un minuto</span>
          </Link>
          <Link className="qa alert" href="/accidentes">
            <span className="ic"><Icon name="alert" /></span>
            <b>Alguien se lastimó</b>
            <span>Qué hacer, también fines de semana</span>
          </Link>
          {has("aviso_medico") ? (
            <Link className="qa" href="/ausencias">
              <span className="ic"><Icon name="pulse" /></span>
              <b>¿Quién faltó hoy?</b>
              <span>Los avisos de tus empleados</span>
            </Link>
          ) : (
            <a className="qa" href={waComercial(faltaMsg)} target="_blank" rel="noopener noreferrer">
              <span className="ic wa"><Icon name="whatsapp" /></span>
              <b>Un empleado faltó con certificado</b>
              <span>Consultalo con tu médico referente</span>
            </a>
          )}
          <Link className="qa" href="/usuarios">
            <span className="ic"><Icon name="users" /></span>
            <b>Mis empleados</b>
            <span>{collaborators ? `${collaborators} con acceso al portal` : "Dales acceso al portal"}</span>
          </Link>
        </div>

        <Benefit orgName={org.name} />
        {absences}

        <div className="split">
          <section className="card">
            <div className="row-h">
              <h2>Lo que tenés con tu plan</h2>
              <span className="chip info">{org.plan}</span>
            </div>
            <p className="small muted" style={{ marginBottom: 16 }}>
              {org.plan_units} {unitsLabel} por mes para consultas y estudios. Se renuevan el 1 de cada mes.
              {org.referente_medico ? ` Tu médico referente es ${org.referente_medico}.` : ""}
            </p>
            <ul className="checklist">
              {contracted.map(([name]) => <li key={name}><Icon name="check" /><span>{name}</span></li>)}
            </ul>
          </section>
          {newsCard}
        </div>
      </>
    );
  }

  /* ───────────── Empresa ───────────── */
  const qa = [
    ["/gestiones", "clip", "Pedir turno o estudio", "Turnos, preocupacionales y cotizaciones", false],
    ["/accidentes", "alert", "Hubo un accidente", "Qué hacer, también fines de semana", true],
    ["/usuarios", "users", "Colaboradores", collaborators ? `${collaborators} con acceso al portal` : "Dales acceso al portal", false],
    ["/documentos", "doc", "Mis documentos", "Certificado, campañas y kits", false],
  ] as const;

  return (
    <>
      {header}
      <div className="grid g4">
        {qa.map(([href, icon, title, sub, alert]) => (
          <Link key={href} className={"qa" + (alert ? " alert" : "")} href={href}>
            <span className="ic"><Icon name={icon} /></span>
            <b>{title}</b>
            <span>{sub}</span>
          </Link>
        ))}
      </div>

      {absences}
      <Benefit orgName={org.name} />

      <div className="split">
        <section className="card">
          <div className="row-h">
            <h2>Tu servicio</h2>
            <span className="chip info">{org.plan}</span>
          </div>
          <p className="small muted" style={{ marginBottom: 16 }}>
            {org.plan_units} UP por mes. Se renueva el 1 de cada mes.
            {org.referente_medico ? ` Médico referente: ${org.referente_medico}.` : ""}
          </p>
          <div className="list">
            {services.map(([name, on, label]) => (
              <div className="li" key={name}>
                <div className="grow"><b>{name}</b></div>
                <span className={"chip " + (on ? "ok" : "off")}>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="grid" style={{ alignContent: "start" }}>
          <section className="card">
            <h2>Campaña del mes</h2>
            {campaigns && campaigns[0] ? (
              <div className="list">
                <div className="li">
                  <div className="grow"><b>{campaigns[0].title}</b><span>{campaigns[0].description}</span></div>
                  <a className="btn sec" href={`/api/documentos/${campaigns[0].id}`}><Icon name="down" />Descargar</a>
                </div>
              </div>
            ) : (
              <p className="muted">Todavía no hay una campaña cargada este mes.</p>
            )}
          </section>
          {newsCard}
        </div>
      </div>
    </>
  );
}
