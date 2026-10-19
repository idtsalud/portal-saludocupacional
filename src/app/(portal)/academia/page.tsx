import { Icon } from "@/components/Icon";
import { requireOrg } from "@/lib/session";
import { waLink } from "@/lib/format";

export default async function Academia() {
  const { org } = await requireOrg();
  const wa = waLink("5491126320855");
  const msg = encodeURIComponent(`Hola, soy de ${org.name}. Quiero consultar por capacitaciones de la Academia IDT.`);
  return (
    <>
      <div className="head">
        <h1>Academia IDT</h1>
        <p>Capacitación con evaluación y certificado firmado por el médico del trabajo.</p>
      </div>
      <div className="grid g3">
        <section className="card"><h3>Aula en Campana</h3><p className="small muted" style={{ marginTop: 6 }}>Tercer piso de la sede de Av. Ameghino 325. Tu equipo viene y se lleva el certificado.</p></section>
        <section className="card"><h3>In company</h3><p className="small muted" style={{ marginTop: 6 }}>Vamos a tu planta, depósito u oficina.</p></section>
        <section className="card"><h3>Online</h3><p className="small muted" style={{ marginTop: 6 }}>Curso, evaluación y certificado desde el celular. Para equipos en viaje o en turnos.</p></section>
      </div>
      <section className="card" style={{ display: "grid", gap: 12 }}>
        <h2>{org.has_academia ? "Pedí una capacitación" : "Sumá la Academia a tu plan"}</h2>
        <p className="muted">Contanos qué tema, para cuántas personas y en qué modalidad, y te armamos la propuesta.</p>
        {wa && <div><a className="btn pri" href={`${wa}?text=${msg}`} target="_blank" rel="noopener noreferrer"><Icon name="chat" />Escribir por WhatsApp</a></div>}
      </section>
    </>
  );
}
