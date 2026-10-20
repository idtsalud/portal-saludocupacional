import Link from "next/link";
import { Icon } from "@/components/Icon";
import { requireColaborador } from "@/lib/session";
import { firstName } from "@/lib/format";
import { CONTACTO, waAvisoMedico, waComercial } from "@/lib/contacto";
import type { ServiceKey } from "@/lib/services";

type Care = { key: ServiceKey; icon: string; title: string; text: string; cta: string; msg: string };

export default async function InicioColaborador() {
  const { supabase, org, profile, has } = await requireColaborador();
  const nombre = profile.full_name || "un colaborador";
  const yo = `${nombre} (${org.name})`;

  const { data: campaigns } = has("campanas")
    ? await supabase.from("documents").select("id, title, description").eq("category", "campana").order("created_at", { ascending: false }).limit(3)
    : { data: [] as { id: string; title: string; description: string | null }[] };

  const care: Care[] = [
    { key: "telemedicina", icon: "phone", title: "Consulta por telemedicina", text: "Un médico te atiende a distancia, sin salir de tu casa.", cta: "Pedir telemedicina", msg: `Hola, soy ${yo}. Quiero una consulta por telemedicina.` },
    { key: "atencion_sedes", icon: "pin", title: "Turno en Zárate o Campana", text: "Consultas y estudios en las sedes de IDT.", cta: "Pedir turno", msg: `Hola, soy ${yo}. Quiero un turno en la sede de:\nMotivo:` },
    { key: "medico_referente", icon: "heart", title: "Hablar con el médico de tu empresa", text: "El médico del trabajo referente te orienta sobre tu salud y tus licencias.", cta: "Escribirle", msg: `Hola, soy ${yo}. Quiero hablar con el médico referente.` },
    { key: "medicheck", icon: "microscope", title: "Medicheck", text: "Un chequeo médico completo en una sola visita.", cta: "Consultar", msg: `Hola, soy ${yo}. Quiero información sobre Medicheck.` },
  ];
  const myCare = care.filter((c) => has(c.key));

  return (
    <>
      <div className="head">
        <div>
          <h1>Hola, {firstName(nombre)}</h1>
          <p>Tu espacio de salud, gracias a {org.name} y SaludOcupacional.</p>
        </div>
      </div>

      {has("aviso_medico") ? (
        <section className="benefit" aria-label="Aviso Médico">
          <span className="badge" aria-hidden="true"><Icon name="whatsapp" /></span>
          <div>
            <h2>¿No vas a poder ir a trabajar?</h2>
            <p>Avisá por WhatsApp a Aviso Médico: te pregunta lo necesario, registra tu aviso y te pide el certificado. Número: {CONTACTO.avisoMedicoTexto}.</p>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            <a className="btn light" href={waAvisoMedico(`Hola, soy ${yo}. Hoy no voy a poder ir a trabajar.`)} target="_blank" rel="noopener noreferrer">
              <Icon name="whatsapp" />Avisar por WhatsApp
            </a>
            <a className="btn sec" href="/api/contacto/aviso-medico" style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,.35)" }}>
              <Icon name="down" />Agendar el contacto
            </a>
          </div>
        </section>
      ) : (
        <section className="card">
          <h2>¿No vas a poder ir a trabajar?</h2>
          <p className="muted" style={{ marginTop: 6 }}>Avisale a tu empleador como lo hacés siempre y guardá el certificado médico.</p>
        </section>
      )}

      {myCare.length > 0 && (
        <section id="salud" style={{ display: "grid", gap: 16, scrollMarginTop: 20 }}>
          <h2>Salud y atención</h2>
          <div className="grid g2">
            {myCare.map((c) => (
              <section className="card howto" key={c.key}>
                <div className="top-row">
                  <span className="ic"><Icon name={c.icon} /></span>
                  <div><h3>{c.title}</h3><p>{c.text}</p></div>
                </div>
                <div className="actions">
                  <a className="btn wa" href={waComercial(c.msg)} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" />{c.cta}</a>
                </div>
              </section>
            ))}
          </div>
        </section>
      )}

      {has("nume") && (
        <section className="card" id="nume" style={{ scrollMarginTop: 20 }}>
          <div className="row-h">
            <h2>NUME · tu bienestar, las 24 horas</h2>
            <span className="chip ok">Incluido</span>
          </div>
          <p className="muted" style={{ marginBottom: 16 }}>Una plataforma de salud y bienestar para vos, desde el celular.</p>
          <ul className="checklist" style={{ marginBottom: 20 }}>
            {[
              "Consultas médicas virtuales las 24 horas",
              "Pediatra y veterinario a toda hora",
              "Apoyo psicológico y salud mental",
              "Nutrición y planes de bienestar físico",
              "Más de 500 meditaciones y herramientas para dormir mejor",
              "Cursos de bienestar financiero",
            ].map((t) => <li key={t}><Icon name="check" /><span>{t}</span></li>)}
          </ul>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <a className="btn pri" href={CONTACTO.numeUrl} target="_blank" rel="noopener noreferrer"><Icon name="ext" />Entrar a NUME</a>
            <a className="btn sec" href={waComercial(`Hola, soy ${yo}. Quiero activar mi acceso a NUME.`)} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" />Pedir mi acceso</a>
          </div>
        </section>
      )}

      <div className="split">
        {has("academia") ? (
          <section className="card" id="academia" style={{ scrollMarginTop: 20 }}>
            <h2>Academia IDT</h2>
            <p className="muted" style={{ marginBottom: 16 }}>Capacitaciones con evaluación y certificado firmado por el médico del trabajo. Online, desde el celular, o en el aula de Campana.</p>
            <a className="btn sec" href={waComercial(`Hola, soy ${yo}. Quiero ver las capacitaciones de la Academia IDT.`)} target="_blank" rel="noopener noreferrer"><Icon name="cap" />Ver mis capacitaciones</a>
          </section>
        ) : (
          <section className="card">
            <h2>Sedes de IDT</h2>
            <p className="muted" style={{ marginBottom: 16 }}>Campana (Av. Ameghino 325) y Zárate (R. Noya 670).</p>
            <Link className="btn sec" href="/colaborador/sedes"><Icon name="pin" />Ver horarios y cómo llegar</Link>
          </section>
        )}
        <section className="card">
          <h2>Si te accidentás trabajando</h2>
          <ol className="steps red" style={{ marginTop: 6 }}>
            <li><div><b>Si es grave, llamá al 107</b><span>Emergencias médicas (SAME), o al 911.</span></div></li>
            <li><div><b>Avisale a tu empleador</b><span>Hace la denuncia a la ART y te indica dónde atenderte.</span></div></li>
            <li><div><b>Guardá todos los papeles</b><span>Constancias, estudios y certificado.</span></div></li>
          </ol>
        </section>
      </div>

      {campaigns && campaigns.length > 0 && (
        <section className="card">
          <h2>Campañas de salud</h2>
          <div className="list">
            {campaigns.map((c) => (
              <div className="li" key={c.id}>
                <div className="grow"><b>{c.title}</b><span>{c.description}</span></div>
                <a className="btn sec" href={`/api/documentos/${c.id}`}><Icon name="down" />Descargar</a>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
