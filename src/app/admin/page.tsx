import Link from "next/link";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { requireStaff } from "@/lib/session";
import { fmtDateTime } from "@/lib/format";
import { getPlans } from "@/lib/plans";
import { createOrg } from "./actions";

type OrgRow = { id: string; name: string; kind: string; plan: string; staff_count: number | null; has_aviso_medico: boolean; sheet_company_key: string | null };
type AdminRow = { org_id: string; status: string; monthly_price: number | null; cuit: string | null; next_due: string | null };
const money = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
const STATUS_CHIP: Record<string, [string, string]> = { activo: ["ok", "Activo"], bonificado: ["info", "Bonificado"], baja: ["off", "Baja"] };

function ClientTable({ title, rows, users, admin }: { title: string; rows: OrgRow[]; users: Map<string, number>; admin: Map<string, AdminRow> }) {
  return (
    <section className="card">
      <div className="row-h">
        <h2>{title}</h2>
        <span className="chip info">{rows.length}</span>
      </div>
      {rows.length > 0 ? (
        <div className="tbl">
          <table>
            <thead><tr><th>Nombre</th><th>Estado</th><th>Plan</th><th className="num">Valor mensual</th><th>Usuarios en el portal</th><th>Aviso Médico</th></tr></thead>
            <tbody>
              {rows.map((o) => {
                const a = admin.get(o.id);
                const [tone, label] = STATUS_CHIP[a?.status ?? "activo"];
                return (
                <tr key={o.id} className={a?.status === "baja" ? "status-baja" : ""}>
                  <td><Link href={`/admin/org/${o.id}`}><b>{o.name}</b></Link></td>
                  <td><span className={"chip " + tone}>{label}</span></td>
                  <td>{o.plan}</td>
                  <td className="num">{a?.monthly_price ? money(a.monthly_price) : "—"}</td>
                  <td>{users.get(o.id) ? <span className="num">{users.get(o.id)}</span> : <span className="chip warn">Sin administrador</span>}</td>
                  <td><span className={"chip " + (o.has_aviso_medico ? "ok" : "off")}>{o.has_aviso_medico ? "Sí" : "No"}</span></td>
                </tr>
                );
              })}
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
  const [{ data: orgs }, { data: sync }, { data: people }, plans, { data: adminRows }] = await Promise.all([
    supabase.from("organizations").select("id, name, kind, plan, staff_count, has_aviso_medico, sheet_company_key").order("name"),
    supabase.from("sync_state").select("last_synced_at, last_error, rows_read").eq("id", "avisos").single(),
    supabase.from("profiles").select("org_id").eq("user_type", "cliente").eq("is_idt_staff", false),
    getPlans(supabase, true),
    supabase.from("org_admin").select("org_id, status, monthly_price, cuit, next_due"),
  ]);
  const admin = new Map(((adminRows ?? []) as AdminRow[]).map((a) => [a.org_id, a]));
  // Las organizaciones de demostración no son clientes reales.
  const isDemo = (o: OrgRow) => /de demostraci[oó]n$/i.test(o.name);
  const all = ((orgs ?? []) as OrgRow[]).filter((o) => !isDemo(o));
  const demos = ((orgs ?? []) as OrgRow[]).filter(isDemo);
  const users = new Map<string, number>();
  (people ?? []).forEach((p) => p.org_id && users.set(p.org_id, (users.get(p.org_id) ?? 0) + 1));
  const withAviso = all.filter((o) => o.has_aviso_medico);

  // Salud del negocio
  const statusOf = (o: OrgRow) => admin.get(o.id)?.status ?? "activo";
  const active = all.filter((o) => statusOf(o) === "activo");
  const revenue = active.reduce((s, o) => s + (admin.get(o.id)?.monthly_price ?? 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const in45 = new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10);
  const dueSoon = all.filter((o) => { const d = admin.get(o.id)?.next_due; return d && d >= today && d <= in45; });
  const noCuit = all.filter((o) => statusOf(o) !== "baja" && !admin.get(o.id)?.cuit);

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

      <section className="health">
        <div className="card kpi"><b>{money(revenue)}</b><span>Facturación mensual (clientes activos, sin IVA)</span></div>
        <div className="card kpi"><b>{active.length}</b><span>Clientes activos</span><small>{active.filter((o) => o.kind === "empresa").length} empresas · {active.filter((o) => o.kind === "comercio").length} comercios</small></div>
        <div className="card kpi"><b>{all.filter((o) => statusOf(o) === "bonificado").length}</b><span>Bonificados</span><small>{all.filter((o) => statusOf(o) === "baja").length} de baja</small></div>
        <div className="card kpi"><b>{dueSoon.length}</b><span>Vencimientos en 45 días</span><small>{noCuit.length} sin CUIT cargado</small></div>
      </section>

      <ClientTable title="Empresas" rows={all.filter((o) => o.kind === "empresa")} users={users} admin={admin} />
      <ClientTable title="Comercios" rows={all.filter((o) => o.kind === "comercio")} users={users} admin={admin} />
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
