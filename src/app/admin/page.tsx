import Link from "next/link";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { requireStaff } from "@/lib/session";
import { fmtDateTime } from "@/lib/format";
import { getPlans } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { createOrg, loginAsTestUser } from "./actions";

export default async function AdminHome({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase } = await requireStaff();
  const [{ data: orgs }, { data: sync }, plans] = await Promise.all([
    supabase.from("organizations").select("id, name, kind, plan, staff_count, has_aviso_medico, sheet_company_key, active").order("name"),
    supabase.from("sync_state").select("last_synced_at, last_error, rows_read").eq("id", "avisos").single(),
    getPlans(supabase, true),
  ]);
  const withAviso = (orgs ?? []).filter((o) => o.has_aviso_medico);

  // Usuarios de prueba: correos prueba-…@saludocupacional.com.ar
  const { data: users } = await createAdminClient().auth.admin.listUsers({ perPage: 1000 });
  const testUsers = (users?.users ?? []).filter((u) => /^prueba-[a-z0-9-]+@saludocupacional\.com\.ar$/.test(u.email ?? ""));
  const { data: testProfiles } = testUsers.length
    ? await supabase.from("profiles").select("id, full_name, user_type, org_id, organizations(name, kind)").in("id", testUsers.map((u) => u.id))
    : { data: [] };
  const testRows = (testProfiles ?? []).map((p) => {
    const o = p.organizations as unknown as { name: string; kind: string } | null;
    return {
      email: testUsers.find((u) => u.id === p.id)?.email ?? "",
      name: p.full_name as string,
      view: p.user_type === "colaborador" ? `Colaborador de ${o?.kind === "comercio" ? "comercio" : "empresa"}` : o?.kind === "comercio" ? "Comercio" : "Empresa",
      org: o?.name ?? "",
    };
  }).sort((a, b) => a.view.localeCompare(b.view));

  return (
    <>
      <div className="head">
        <div>
          <h1>Organizaciones</h1>
          <p>Empresas y comercios con acceso al portal.</p>
        </div>
        <Link className="btn sec" href="/admin/planes">Ver y editar planes</Link>
      </div>
      <Flash ok={sp.ok} error={sp.error} />

      <section className="card">
        <div className="tbl">
          <table>
            <thead><tr><th>Nombre</th><th>Tipo</th><th>Plan</th><th>Personas</th><th>Aviso Médico</th></tr></thead>
            <tbody>
              {(orgs ?? []).map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/admin/org/${o.id}`}><b>{o.name}</b></Link></td>
                  <td>{o.kind === "empresa" ? "Empresa" : "Comercio"}</td>
                  <td>{o.plan}</td>
                  <td className="num">{o.staff_count ?? "—"}</td>
                  <td><span className={"chip " + (o.has_aviso_medico ? "ok" : "off")}>{o.has_aviso_medico ? "Sí" : "No"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid g2">
        <section className="card">
          <h2>Nueva organización</h2>
          <form className="f" action={createOrg}>
            <label htmlFor="name">Nombre<input id="name" name="name" required maxLength={160} /></label>
            <div className="two">
              <label htmlFor="preset">
                Plan
                <select id="preset" name="preset" defaultValue={plans[0]?.key}>
                  <optgroup label="Comercios">
                    {plans.filter((p) => p.kind === "comercio").map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
                  </optgroup>
                  <optgroup label="Empresas">
                    {plans.filter((p) => p.kind === "empresa").map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
                  </optgroup>
                </select>
              </label>
              <label htmlFor="staff_count">Cantidad de personas<input id="staff_count" name="staff_count" type="number" min={0} /></label>
            </div>
            <p className="small muted">Se cargan los servicios y las UP del plan. Después los podés ajustar en la ficha del cliente.</p>
            <SubmitButton>Crear organización</SubmitButton>
          </form>
        </section>
        <section className="card" style={{ display: "grid", gap: 10, alignContent: "start" }}>
          <h2>Avisos desde la planilla de Aviso Médico</h2>
          <p className="small">
            Última recepción: <b>{sync?.last_synced_at ? fmtDateTime(sync.last_synced_at) : "todavía ninguna"}</b>
            {sync?.rows_read != null ? ` · ${sync.rows_read} avisos leídos` : ""}
          </p>
          {sync?.last_error && <p className="flash err">{sync.last_error}</p>}
          <p className="small muted">
            La planilla envía los avisos al portal cada 10 minutos. Cada aviso se asigna a la organización cuyo &quot;Nombre en la planilla&quot; coincide con la columna empresa.
          </p>
          <ul className="checklist small">
            {withAviso.map((o) => (
              <li key={o.id}><span>{o.name}: {o.sheet_company_key ? `se asigna lo que llegue como "${o.sheet_company_key}"` : "falta completar el nombre en la planilla"}</span></li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card">
        <h2>Ver el portal como un usuario de prueba</h2>
        <p className="small muted" style={{ marginBottom: 14 }}>
          Te abre el portal tal como lo ve cada perfil. Se cierra tu sesión de administración: para volver, tocá Salir y entrá con tu correo y contraseña.
        </p>
        <div className="grid g4">
          {testRows.map((t) => (
            <form key={t.email} action={loginAsTestUser} className="qa" style={{ cursor: "default" }}>
              <input type="hidden" name="email" value={t.email} />
              <b>{t.view}</b>
              <span>{t.name} · {t.org}</span>
              <SubmitButton className="btn sec">Entrar como este usuario</SubmitButton>
            </form>
          ))}
        </div>
      </section>
    </>
  );
}
