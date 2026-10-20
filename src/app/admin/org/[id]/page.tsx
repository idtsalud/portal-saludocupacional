import { notFound } from "next/navigation";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { PERMISSIONS } from "@/lib/invite";
import { getPlans } from "@/lib/plans";
import { requireStaff } from "@/lib/session";
import { applyPreset, inviteToOrg, updateOrg, updateOrgServices } from "../../actions";
import { OrgFields } from "../../OrgFields";

const AUDIENCE: Record<string, string> = { cliente: "Para la empresa o comercio", ambos: "Para la empresa y sus colaboradores", colaborador: "Para los colaboradores" };

export default async function OrgDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase } = await requireStaff();
  const { data: org } = await supabase.from("organizations").select("*").eq("id", id).single();
  if (!org) notFound();
  const [{ data: people }, { data: catalog }, { data: enabled }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role_title, permission, user_type").eq("org_id", id).order("created_at"),
    supabase.from("services").select("key, name, description, audience").eq("active", true).order("sort"),
    supabase.from("org_services").select("service_key").eq("org_id", id),
  ]);
  const on = new Set((enabled ?? []).map((r) => r.service_key as string));
  const groups = ["cliente", "ambos", "colaborador"].map((a) => [a, (catalog ?? []).filter((s) => s.audience === a)] as const);
  const plans = await getPlans(supabase, true);
  const currentPreset = org.plan_key ?? plans.find((p) => p.name === org.plan)?.key;

  return (
    <>
      <div className="head">
        <div>
          <h1>{org.name}</h1>
          <p>{org.kind === "empresa" ? "Empresa" : "Comercio"} · {org.plan}</p>
        </div>
      </div>
      <Flash ok={sp.ok} error={sp.error} />

      <div className="split">
        <section className="card">
          <div className="row-h">
            <h2>Servicios habilitados</h2>
            <span className="chip info">{on.size} activos</span>
          </div>
          <form className="f" action={applyPreset} style={{ marginBottom: 22 }}>
            <input type="hidden" name="id" value={org.id} />
            <div className="two" style={{ alignItems: "end" }}>
              <label htmlFor="preset">
                Aplicar los servicios de un plan
                <select id="preset" name="preset" defaultValue={currentPreset ?? ""}>
                  <option value="" disabled>Elegí un plan</option>
                  {plans.map((p) => <option key={p.key} value={p.key}>{p.name} ({p.kind === "empresa" ? "empresa" : "comercio"} · {p.units} UP)</option>)}
                </select>
              </label>
              <SubmitButton className="btn sec">Aplicar plan</SubmitButton>
            </div>
          </form>
          <form className="f" action={updateOrgServices}>
            <input type="hidden" name="id" value={org.id} />
            {groups.map(([aud, items]) =>
              items.length ? (
                <fieldset key={aud} style={{ border: 0, padding: 0, margin: "0 0 10px", display: "grid", gap: 10 }}>
                  <legend className="small muted" style={{ fontWeight: 700, marginBottom: 8 }}>{AUDIENCE[aud]}</legend>
                  {items.map((s) => (
                    <label className="check" key={s.key} style={{ alignItems: "flex-start" }}>
                      <input type="checkbox" name="svc" value={s.key} defaultChecked={on.has(s.key)} style={{ marginTop: 4 }} />
                      <span><b>{s.name}</b><br /><span className="small muted" style={{ fontWeight: 400 }}>{s.description}</span></span>
                    </label>
                  ))}
                </fieldset>
              ) : null,
            )}
            <SubmitButton>Guardar servicios</SubmitButton>
          </form>
        </section>

        <div className="grid" style={{ alignContent: "start" }}>
          <section className="card">
            <h2>Usuarios</h2>
            {people && people.length > 0 ? (
              <div className="list">
                {people.map((p) => (
                  <div className="li" key={p.id}>
                    <div className="grow"><b>{p.full_name || "Sin nombre"}</b><span>{p.user_type === "colaborador" ? "Colaborador" : p.role_title}</span></div>
                    <span className="chip off">{p.user_type === "colaborador" ? "Colaborador" : PERMISSIONS[p.permission]}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">Todavía no hay usuarios. Invitá al primero, idealmente con permiso Administra.</p>
            )}
          </section>
          <section className="card">
            <h2>Invitar usuario del cliente</h2>
            <form className="f" action={inviteToOrg}>
              <input type="hidden" name="org_id" value={org.id} />
              <label htmlFor="full_name">Nombre y apellido<input id="full_name" name="full_name" required /></label>
              <label htmlFor="email">Correo<input id="email" name="email" type="email" required /></label>
              <div className="two">
                <label htmlFor="role_title">Rol<input id="role_title" name="role_title" placeholder="RR.HH., Dueño" /></label>
                <label htmlFor="permission">
                  Permiso
                  <select id="permission" name="permission" defaultValue="admin">
                    {Object.entries(PERMISSIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </label>
              </div>
              <SubmitButton>Enviar invitación</SubmitButton>
            </form>
          </section>
          <section className="card">
            <h2>Datos del cliente</h2>
            <form className="f" action={updateOrg}>
              <input type="hidden" name="id" value={org.id} />
              <OrgFields org={org} />
              <SubmitButton className="btn sec">Guardar datos</SubmitButton>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
