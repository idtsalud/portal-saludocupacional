import { Icon } from "@/components/Icon";
import { requireOrg } from "@/lib/session";

const GROUPS: [string, string][] = [
  ["certificado", "Certificado de servicio"],
  ["kit", "Kits"],
  ["programa", "Programas"],
  ["campana", "Campañas de salud"],
  ["otro", "Otros"],
];

export default async function Documentos() {
  const { supabase, org } = await requireOrg();
  // Las reglas de la base ya filtran: documentos propios y generales de los servicios contratados.
  const { data: docs } = await supabase
    .from("documents")
    .select("id, category, title, description, created_at")
    .order("created_at", { ascending: false });

  const all = docs ?? [];
  return (
    <>
      <div className="head">
        <h1>Documentos</h1>
        <p>Solo ves los documentos de {org.name} y los generales de los servicios que tenés contratados.</p>
      </div>
      {all.length === 0 && <section className="card"><p className="muted">Todavía no hay documentos cargados.</p></section>}
      {GROUPS.map(([cat, label]) => {
        const items = all.filter((d) => d.category === cat);
        if (items.length === 0) return null;
        return (
          <section className="card" key={cat}>
            <h2>{label}</h2>
            <div className="list">
              {items.map((d) => (
                <div className="li" key={d.id}>
                  <span className="ic"><Icon name="doc" /></span>
                  <div className="grow"><b>{d.title}</b><span>{d.description}</span></div>
                  <a className="btn sec" href={`/api/documentos/${d.id}`}><Icon name="down" />Descargar</a>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
