import { Flash } from "@/components/Flash";
import { Icon } from "@/components/Icon";
import { SubmitButton } from "@/components/SubmitButton";
import { PERMISSIONS } from "@/lib/invite";
import { PermissionPicker } from "@/components/PermissionPicker";
import { requireOrg } from "@/lib/session";
import { inviteCollaborators, inviteTeamMember, removeCollaborator } from "./actions";

export default async function Usuarios({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase, org, profile } = await requireOrg();
  const comercio = org.kind === "comercio";
  const { data: people } = await supabase
    .from("profiles")
    .select("id, full_name, role_title, permission, user_type")
    .eq("org_id", org.id)
    .order("created_at");
  const team = (people ?? []).filter((p) => p.user_type !== "colaborador");
  const collaborators = (people ?? []).filter((p) => p.user_type === "colaborador");
  const canInvite = profile.permission === "admin" || profile.is_idt_staff;
  const word = comercio ? "empleados" : "colaboradores";

  const invited = Number(sp.invitados ?? NaN);
  const failed = Number(sp.fallidos ?? 0);
  const pending = Number(sp.pendientes ?? 0);

  return (
    <>
      <div className="head">
        <div>
          <h1>{comercio ? "Mis empleados" : "Colaboradores y usuarios"}</h1>
          <p>Cada persona entra con su propio usuario y ve solo lo que le corresponde.</p>
        </div>
      </div>
      <Flash ok={sp.ok} error={sp.error} />
      {Number.isFinite(invited) && (
        <p className={"flash " + (failed ? "err" : "ok")} role="status">
          Enviamos {invited} invitación{invited === 1 ? "" : "es"}.
          {failed ? ` ${failed} no se pudieron enviar: revisá que cada línea tenga nombre y correo.` : ""}
          {pending ? ` Quedaron ${pending} sin enviar: se mandan hasta 25 por vez, volvé a pegarlas.` : ""}
        </p>
      )}

      <section className="card" id="colaboradores" style={{ scrollMarginTop: 20 }}>
        <div className="row-h">
          <h2>{comercio ? "Empleados" : "Colaboradores"} con acceso</h2>
          <span className="chip info">{collaborators.length}</span>
        </div>
        <p className="muted" style={{ marginBottom: 16 }}>
          Ven su espacio de salud: aviso médico, turnos, telemedicina y los beneficios que tenés contratados. No ven datos de la empresa ni de sus compañeros.
        </p>
        {collaborators.length > 0 ? (
          <div className="list">
            {collaborators.map((p) => (
              <div className="li" key={p.id}>
                <div className="grow"><b>{p.full_name || "Sin nombre"}</b></div>
                {canInvite && (
                  <form action={removeCollaborator}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="btn ghost" type="submit" style={{ color: "var(--danger)" }}>Quitar acceso</button>
                  </form>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">Todavía no invitaste a ningún {comercio ? "empleado" : "colaborador"}.</p>
        )}
      </section>

      {canInvite && (
        <section className="card">
          <h2>Invitar {word}</h2>
          <p className="muted" style={{ marginBottom: 14 }}>
            Escribí una persona por línea: nombre y correo personal, separados por coma. También podés copiar y pegar dos columnas desde Excel.
          </p>
          <form className="f" action={inviteCollaborators}>
            <label htmlFor="lista">
              Personas
              <textarea id="lista" name="lista" rows={6} placeholder={"María Gómez, maria.gomez@gmail.com\nJuan Pérez, juanperez@hotmail.com"} required />
            </label>
            <SubmitButton>Enviar invitaciones</SubmitButton>
          </form>
          <p className="note" style={{ marginTop: 12 }}>
            <Icon name="info" />
            <span>Cada persona recibe un correo para crear su contraseña. Se envían hasta 25 por vez.</span>
          </p>
        </section>
      )}

      <div className="split">
        <section className="card">
          <h2>{comercio ? "Quién administra el portal" : "Equipo que administra el portal"}</h2>
          <div className="tbl">
            <table>
              <thead><tr><th>Nombre</th><th>Puesto</th><th>Permiso</th></tr></thead>
              <tbody>
                {team.map((p) => (
                  <tr key={p.id}>
                    <td><b>{p.full_name || "Sin nombre"}</b>{p.id === profile.id && <span className="small muted"> (vos)</span>}</td>
                    <td>{p.role_title}</td>
                    <td><span className={"chip " + (p.permission === "admin" ? "info" : "off")}>{PERMISSIONS[p.permission]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        {canInvite && (
          <section className="card">
            <h2>Sumar a alguien del equipo</h2>
            <p className="muted" style={{ marginBottom: 14 }}>Para RR.HH., Higiene y Seguridad o un socio: ve el portal de la empresa.</p>
            <form className="f" action={inviteTeamMember}>
              <label htmlFor="full_name">Nombre y apellido<input id="full_name" name="full_name" required maxLength={120} /></label>
              <label htmlFor="email">Correo<input id="email" name="email" type="email" required /></label>
              <label htmlFor="role_title">Puesto (opcional)<input id="role_title" name="role_title" placeholder="Ej.: RR.HH., socio, encargado" maxLength={80} /></label>
              <PermissionPicker defaultValue="todo" />
              <SubmitButton className="btn sec">Enviar invitación</SubmitButton>
            </form>
          </section>
        )}
      </div>
    </>
  );
}
