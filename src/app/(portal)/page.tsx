import Link from "next/link";
import { Flash } from "@/components/Flash";
import { Icon } from "@/components/Icon";
import { canSeeAbsences, requireOrg } from "@/lib/session";
import { firstName, fmtLongToday, STATUS } from "@/lib/format";

export default async function Inicio({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase, org, profile } = await requireOrg();

  const [{ data: requests }, { data: news }, { data: campaigns }] = await Promise.all([
    supabase.from("requests").select("id, type, collaborator, status, status_detail").eq("org_id", org.id).order("created_at", { ascending: false }).limit(4),
    supabase.from("news").select("id, title, body").order("published_at", { ascending: false }).limit(3),
    supabase.from("documents").select("id, title, description").eq("category", "campana").order("created_at", { ascending: false }).limit(1),
  ]);

  let absent: { today: number; active: number; pendingCert: number } | null = null;
  if (org.has_aviso_medico && canSeeAbsences(profile)) {
    const { data: avisos } = await supabase
      .from("avisos")
      .select("received_at, status, certificate_status")
      .eq("org_id", org.id)
      .order("received_at", { ascending: false })
      .limit(500);
    const todayAR = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
    const list = avisos ?? [];
    absent = {
      today: list.filter((a) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date(a.received_at)) === todayAR).length,
      active: list.filter((a) => (a.status ?? "").toLowerCase().startsWith("activ") || (a.status ?? "").toLowerCase().includes("seguimiento")).length,
      pendingCert: list.filter((a) => (a.certificate_status ?? "").toLowerCase().startsWith("pend")).length,
    };
  }

  const services: [string, boolean, string][] = [
    ["Médico del trabajo referente", true, "Incluido"],
    ["Atención en sedes y telemedicina", true, org.kind === "empresa" ? "Con UP" : "Con prestaciones"],
    ["Seguimiento de licencias y accidentes", true, "Incluido"],
    ["Aviso Médico por WhatsApp", org.has_aviso_medico, org.has_aviso_medico ? "Activo" : "Sumar"],
    ["Ruta Saludable", org.has_ruta_saludable, org.has_ruta_saludable ? "Activo" : "Sumar"],
    ["Campañas de salud", org.has_campanas, org.has_campanas ? "Incluido" : "Sumar"],
    ["Academia IDT", org.has_academia, org.has_academia ? "Activo" : "Consultar"],
  ];

  const qa = [
    ["/gestiones", "clip", "Pedir un examen o turno", "Preocupacional, periódico, consulta", false],
    ["/accidentes", "alert", "Avisar un accidente", "A quién llamar y qué hacer", true],
    ["/documentos", "doc", "Descargar documentos", "Certificado, campañas, kit", false],
    ["/equipo", "team", "Hablar con mi equipo", "Coordinación, comercial, médicos", false],
  ] as const;

  return (
    <>
      <div className="head row-h" style={{ alignItems: "flex-end", marginBottom: 0 }}>
        <div>
          <h1>Hola{profile.full_name ? `, ${firstName(profile.full_name)}` : ""}</h1>
          <p>
            {org.name} · {org.plan}
          </p>
        </div>
        <span className="small muted" style={{ textTransform: "capitalize" }}>{fmtLongToday()}</span>
      </div>
      <Flash ok={sp.ok} error={sp.error} />

      {absent && (
        <section className="card">
          <div className="row-h">
            <h2>Ausencias</h2>
            <Link className="small" href="/ausencias">Ver detalle</Link>
          </div>
          <div className="grid g3">
            <div className="kpi"><b>{absent.today}</b><span>Avisos de hoy</span></div>
            <div className="kpi"><b>{absent.active}</b><span>Licencias activas</span></div>
            <div className="kpi"><b>{absent.pendingCert}</b><span>Certificados pendientes</span></div>
          </div>
        </section>
      )}

      <div className="grid g4">
        {qa.map(([href, icon, title, sub, alert]) => (
          <Link key={href} className={"qa" + (alert ? " alert" : "")} href={href}>
            <span className="ic"><Icon name={icon} /></span>
            <b>{title}</b>
            <span>{sub}</span>
          </Link>
        ))}
      </div>

      <div className="grid g2">
        <section className="card">
          <div className="row-h">
            <h2>Pedidos en curso</h2>
            <Link className="small" href="/gestiones">Ver todos</Link>
          </div>
          {requests && requests.length > 0 ? (
            <div className="list">
              {requests.map((r) => (
                <div className="li" key={r.id}>
                  <div className="grow">
                    <b>{r.type}</b>
                    <span>{r.collaborator}{r.status_detail ? ` · ${r.status_detail}` : ""}</span>
                  </div>
                  <span className={"chip " + (STATUS[r.status]?.tone ?? "off")}>{STATUS[r.status]?.label ?? r.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">Todavía no hay pedidos. <Link href="/gestiones">Hacé el primero</Link>.</p>
          )}
        </section>

        <section className="card">
          <div className="row-h">
            <h2>Tu servicio</h2>
            <span className="chip info">{org.plan}</span>
          </div>
          <p className="small muted" style={{ marginBottom: 12 }}>
            {org.plan_units} {org.kind === "empresa" ? "UP" : "prestaciones"} por mes. Se renueva el 1 de cada mes.
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
      </div>

      <div className="grid g2">
        <section className="card">
          <h2>Campaña del mes</h2>
          {campaigns && campaigns[0] ? (
            <div className="list">
              <div className="li">
                <div className="grow">
                  <b>{campaigns[0].title}</b>
                  <span>{campaigns[0].description}</span>
                </div>
                <a className="btn sec" href={`/api/documentos/${campaigns[0].id}`}><Icon name="down" />Descargar</a>
              </div>
            </div>
          ) : (
            <p className="muted">No hay una campaña cargada este mes.</p>
          )}
        </section>
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
      </div>
    </>
  );
}
