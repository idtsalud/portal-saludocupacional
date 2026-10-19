import { notFound } from "next/navigation";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { PERMISSIONS } from "@/lib/invite";
import { requireStaff } from "@/lib/session";
import { inviteToOrg, updateOrg } from "../../actions";
import { OrgFields } from "../../OrgFields";

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
  const { data: people } = await supabase.from("profiles").select("id, full_name, role_title, permission").eq("org_id", id).order("created_at");

  return (
    <>
      <div className="head">
        <h1>{org.name}</h1>
        <p>{org.kind === "empresa" ? "Empresa" : "Comercio"} · {org.plan}</p>
      </div>
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid g2">
        <section className="card">
          <h2>Datos y servicios</h2>
          <form className="f" action={updateOrg}>
            <input type="hidden" name="id" value={org.id} />
            <OrgFields org={org} />
            <SubmitButton>Guardar cambios</SubmitButton>
          </form>
        </section>
        <div className="grid" style={{ alignContent: "start" }}>
          <section className="card">
            <h2>Usuarios</h2>
            {people && people.length > 0 ? (
              <div className="list">
                {people.map((p) => (
                  <div className="li" key={p.id}>
                    <div className="grow"><b>{p.full_name || "Sin nombre"}</b><span>{p.role_title}</span></div>
                    <span className="chip off">{PERMISSIONS[p.permission]}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">Todavía no hay usuarios. Invitá al primero, idealmente con permiso Administra.</p>
            )}
          </section>
          <section className="card">
            <h2>Invitar usuario</h2>
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
        </div>
      </div>
    </>
  );
}
