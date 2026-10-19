import { Icon } from "@/components/Icon";
import { requireOrg } from "@/lib/session";
import { waLink } from "@/lib/format";

const initials = (n: string) => n.replace(/^Dr\.?\s*/i, "").split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

export default async function Equipo() {
  const { supabase, org } = await requireOrg();
  const { data: team } = await supabase.from("team_contacts").select("id, name, role, description, whatsapp, email").order("sort");

  return (
    <>
      <div className="head">
        <h1>Mi equipo IDT</h1>
        <p>Las personas que atienden a {org.name}.</p>
      </div>
      <section className="card">
        <div className="person">
          <span className="av">MR</span>
          <div>
            <h3>Médico referente de tu empresa</h3>
            <p className="small muted">{org.referente_medico ?? "Te lo asignamos en los próximos días"}</p>
          </div>
        </div>
      </section>
      <div className="grid g3">
        {(team ?? []).map((p) => {
          const wa = waLink(p.whatsapp);
          return (
            <section className="card" key={p.id}>
              <div className="person">
                <span className="av">{initials(p.name)}</span>
                <div><h3>{p.name}</h3><p className="small muted">{p.role}</p></div>
              </div>
              {p.description && <p className="small" style={{ margin: "12px 0" }}>{p.description}</p>}
              {wa && (
                <a className="btn sec" href={`${wa}?text=${encodeURIComponent(`Hola ${p.name.split(" ")[0]}, te escribo de ${org.name}.`)}`} target="_blank" rel="noopener noreferrer">
                  <Icon name="chat" />Escribir por WhatsApp
                </a>
              )}
              {p.email && <p className="small" style={{ marginTop: 8 }}>{p.email}</p>}
            </section>
          );
        })}
      </div>
    </>
  );
}
