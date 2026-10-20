import Link from "next/link";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { requireStaff } from "@/lib/session";
import { fmtDateTime } from "@/lib/format";
import { getPlans } from "@/lib/plans";
import { createOrg } from "./actions";

type OrgRow = { id: string; name: string; kind: string; plan: string; staff_count: number | null; has_aviso_medico: boolean; sheet_company_key: string | null };

function ClientTable({ title, rows, users }: { title: string; rows: OrgRow[]; users: Map<string, number> }) {
  return (
    <section className="card">
      <div className="row-h">
        <h2>{title}</h2>
        <span className="chip info">{rows.length}</span>
      </div>
      {rows.length > 0 ? (
        <div className="tbl">
          <table>
            <thead><tr><th>Nombre</th><th>Plan</th><th>Personas</th><th>Usuarios en el portal</th><th>Aviso Médico</th></tr></thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/admin/org/${o.id}`}><b>{o.name}</b></Link></td>
                  <td>{o.plan}</td>
                  <td className="num">{o.staff_count ?? "—"}</td>
                  <td>{users.get(o.id) ? <span className="num">{users.get(o.id)}</span> : <span className="chip warn">Sin administrador</span>}</td>
                  <td><span className={"chip " + (o.has_aviso_medico ? "ok" : "off")}>{o.has_aviso_medico ? "Sí" : "No"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">Todavía no hay.</p>
      )}
    </section>
  );
}

export default async function AdminHome({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase } = await requireStaff();
  const [{ data: orgs }, { data: sync }, { data: people }, plans] = await Promise.all([
    supabase.from("organizations").select("id, name, kind, plan, staff_count, has_aviso_medico, sheet_company_key").order("name"),
    supabase.from("sync_state").select("last_synced_at, last_error, rows_read").eq("id", "avisos").single(),
    supabase.from("profiles").select("org_id").eq("user_type", "cliente").eq("is_idt_staff", false),
    getPlans(supabase, true),
  ]);
  // Las organizaciones de demostración no son clientes reales.
  const isDemo = (o: OrgRow) => /de demostraci[oó]n$/i.test(o.name);
  const all = ((orgs ?? []) as OrgRow[]).filter((o) => !isDemo(o));
  const demos = ((orgs ?? []) as OrgRow[]).filter(isDemo);
  const users = new Map<string, number>();
  (people ?? []).forEach((p) => p.org_id && users.set(p.org_id, (users.get(p.org_id) ?? 0) + 1));
  const withAviso = all.filter((o) => o.has_aviso_medico);

  return (
    <>
      <div className="head">
        <div>
          <h1>Clientes</h1>
          <p>Empresas y comercios con acceso al portal.</p>
        </div>
        <Link className="btn sec" href="/admin/planes">Ver y editar planes</Link>
      </div>
      <Flash ok={sp.ok} error={sp.error} />

      <ClientTable title="Empresas" rows={all.filter((o) => o.kind === "empresa")} users={users} />
      <ClientTable title="Comercios" rows={all.filter((o) => o.kind === "comercio")} users={users} />
      {demos.length > 0 && (
        <p className="small muted">
          Clientes de demostración (para probar el portal):{" "}
          {demos.map((o, i) => <span key={o.id}>{i > 0 && " · "}<Link href={`/admin/org/${o.id}`}>{o.name}</Link></span>)}
        </p>
      )}

      <div className="grid g2">
        <section className="card" id="nuevo">
          <h2>Cargar un cliente nuevo</h2>
          <form className="f" action={createOrg}>
            <label htmlFor="name">Nombre de la empresa o comercio<input id="name" name="name" required maxLength={160} /></label>
            <div className="two">
              <label htmlFor="preset">
                Plan
                <select id="preset" name="preset" defaultValue={plans.find((p) => p.kind === "empresa")?.key}>
                  <optgroup label="Empresas">
                    {plans.filter((p) => p.kind === "empresa").map((p) => <option key={p.key} value={p.key}>{p.name} · {p.units} UP</option>)}
                  </optgroup>
                  <optgroup label="Comercios">
                    {plans.filter((p) => p.kind === "comercio").map((p) => <option key={p.key} value={p.key}>{p.name} · {p.units} UP</option>)}
                  </optgroup>
                </select>
              </label>
              <label htmlFor="staff_count">Cantidad de personas<input id="staff_count" name="staff_count" type="number" min={0} /></label>
            </div>
            <label className="check">
              <input type="checkbox" name="aviso_medico" />
              <span>Suma Aviso Médico aunque su plan no lo incluya</span>
            </label>
            <fieldset className="perm-picker">
              <legend>Administrador del cliente (opcional)</legend>
              <div className="two">
                <label htmlFor="admin_name">Nombre y apellido<input id="admin_name" name="admin_name" maxLength={120} /></label>
                <label htmlFor="admin_email">Correo<input id="admin_email" name="admin_email" type="email" /></label>
              </div>
              <label htmlFor="admin_role">Puesto<input id="admin_role" name="admin_role" placeholder="Ej.: RR.HH., Dueño" maxLength={80} /></label>
              <p className="small muted">Si completás el correo, le llega una invitación para crear su contraseña. Entra como Administrador: ve todo y puede sumar a su equipo.</p>
            </fieldset>
            <p className="small muted">Se cargan los servicios y las UP del plan. Después los podés ajustar en la ficha del cliente.</p>
            <SubmitButton>Crear cliente</SubmitButton>
          </form>
        </section>
        <section className="card" style={{ display: "grid", gap: 10, alignContent: "start" }}>
          <h2>Avisos desde la planilla de Aviso Médico</h2>
          <p className="small">
            Última recepción: <b>{sync?.last_synced_at ? fmtDateTime(sync.last_synced_at) : "todavía ninguna"}</b>
            {sync?.rows_read != null ? ` · ${sync.rows_read} filas leídas` : ""}
          </p>
          {sync?.last_error && <p className="small muted">{sync.last_error}</p>}
          <p className="small muted">
            La planilla envía los avisos al portal cada 10 minutos. Cada aviso se asigna al cliente cuyo &quot;Nombre en la planilla&quot; coincide con la columna empresa.
          </p>
          <ul className="checklist small">
            {withAviso.map((o) => (
              <li key={o.id}><span>{o.name}: {o.sheet_company_key ? `se asigna lo que llegue como "${o.sheet_company_key}"` : "falta completar el nombre en la planilla"}</span></li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
