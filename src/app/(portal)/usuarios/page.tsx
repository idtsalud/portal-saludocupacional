import { Flash } from "@/components/Flash";
import { Icon } from "@/components/Icon";
import { SubmitButton } from "@/components/SubmitButton";
import { PermissionPicker } from "@/components/PermissionPicker";
import { PERMISSION_INFO, collaboratorRole, roleLabel } from "@/lib/invite";
import { requireOrg } from "@/lib/session";
import { changeRole, inviteCollaborators, invitePerson, removePerson } from "./actions";

export default async function Usuarios({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase, org, profile } = await requireOrg();
  const comercio = org.kind === "comercio";
  const { data: people } = await supabase
    .from("profiles")
    .select("id, full_name, role_title, permission, user_type, is_idt_staff")
    .eq("org_id", org.id)
    .order("created_at");
  const all = (people ?? []).filter((p) => !p.is_idt_staff || p.id === profile.id);
  const team = all.filter((p) => p.user_type !== "colaborador");
  const collaborators = all.filter((p) => p.user_type === "colaborador");
  const canInvite = profile.permission === "admin" || profile.is_idt_staff;
  const word = comercio ? "empleados" : "colaboradores";
  const roleOptions: [string, string][] = [["colaborador", collaboratorRole(comercio).label], ...Object.entries(PERMISSION_INFO).map(([k, v]) => [k, v.label] as [string, string])];

  const invited = Number(sp.invitados ?? NaN);
  const failed = Number(sp.fallidos ?? 0);
  const pending = Number(sp.pendientes ?? 0);

  const personRow = (p: (typeof all)[number]) => {
    const self = p.id === profile.id;
    const current = p.user_type === "colaborador" ? "colaborador" : p.permission;
    return (
      <div className="li person" key={p.id}>
        <div className="grow">
          <b>{p.full_name || "Sin nombre"}{self && <span className="small muted"> (vos)</span>}</b>
          {p.role_title && <span>{p.role_title}</span>}
        </div>
        {canInvite && !self ? (
          <div className="person-actions">
            <form action={changeRole} className="role-form">
              <input type="hidden" name="id" value={p.id} />
              <select name="permission" defaultValue={current} aria-label={`Rol de ${p.full_name}`}>
                {roleOptions.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <button className="btn sec" type="submit">Cambiar</button>
            </form>
            <form action={removePerson}>
              <input type="hidden" name="id" value={p.id} />
              <button className="btn ghost" type="submit" style={{ color: "var(--danger)" }}>Quitar acceso</button>
            </form>
          </div>
        ) : (
          <span className={"chip " + (p.permission === "admin" && p.user_type !== "colaborador" ? "info" : "off")}>{roleLabel(p, comercio)}</span>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="head">
        <div>
          <h1>{comercio ? "Mis empleados" : "Colaboradores y usuarios"}</h1>
          <p>Cada persona entra con su propio usuario y ve solo lo que le corresponde según su rol.</p>
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

      {canInvite && (
        <div className="split">
          <section className="card" id="sumar" style={{ scrollMarginTop: 20 }}>
            <h2>Sumar una persona</h2>
            <p className="muted" style={{ marginBottom: 14 }}>
              Un {comercio ? "empleado" : "colaborador"}, otro dueño o socio, alguien de RR.HH. o un encargado. Elegí qué rol tiene y le llega un correo para crear su contraseña.
            </p>
            <form className="f" action={invitePerson}>
              <div className="two">
                <label htmlFor="full_name">Nombre y apellido<input id="full_name" name="full_name" required maxLength={120} /></label>
                <label htmlFor="email">Correo<input id="email" name="email" type="email" required /></label>
              </div>
              <PermissionPicker comercio={comercio} defaultValue="colaborador" />
              <label htmlFor="role_title">Puesto (opcional)<input id="role_title" name="role_title" placeholder={comercio ? "Ej.: socio, encargado, cajero" : "Ej.: RR.HH., socio, operario"} maxLength={80} /></label>
              <SubmitButton>Enviar invitación</SubmitButton>
            </form>
          </section>

          <section className="card" id="colaboradores" style={{ scrollMarginTop: 20 }}>
            <h2>Sumar varios {word} a la vez</h2>
            <p className="muted" style={{ marginBottom: 14 }}>
              Entran todos con rol {collaboratorRole(comercio).label}. Escribí una persona por línea: nombre y correo personal, separados por coma. También podés pegar dos columnas desde Excel.
            </p>
            <form className="f" action={inviteCollaborators}>
              <label htmlFor="lista">
                Personas
                <textarea id="lista" name="lista" rows={6} placeholder={"María Gómez, maria.gomez@gmail.com\nJuan Pérez, juanperez@hotmail.com"} required />
              </label>
              <SubmitButton className="btn sec">Enviar invitaciones</SubmitButton>
            </form>
            <p className="note" style={{ marginTop: 12 }}>
              <Icon name="info" />
              <span>Se envían hasta 25 por vez. Si alguno tiene que ser administrador, después le cambiás el rol en la lista.</span>
            </p>
          </section>
        </div>
      )}

      <section className="card" id="personas" style={{ scrollMarginTop: 20 }}>
        <div className="row-h">
          <h2>{comercio ? "Quién administra el portal" : "Equipo que administra el portal"}</h2>
          <span className="chip info">{team.length}</span>
        </div>
        <p className="muted" style={{ marginBottom: 12 }}>Pueden ver el portal del negocio según su rol. Puede haber más de un Administrador, por ejemplo dos dueños.</p>
        <div className="list">{team.map(personRow)}</div>
      </section>

      <section className="card">
        <div className="row-h">
          <h2>{comercio ? "Empleados" : "Colaboradores"} con acceso</h2>
          <span className="chip info">{collaborators.length}</span>
        </div>
        <p className="muted" style={{ marginBottom: 12 }}>{collaboratorRole(comercio).help}</p>
        {collaborators.length > 0 ? (
          <div className="list">{collaborators.map(personRow)}</div>
        ) : (
          <p className="muted">Todavía no invitaste a ningún {comercio ? "empleado" : "colaborador"}.</p>
        )}
      </section>

      {canInvite && (
        <details className="card roles-help">
          <summary><b>¿Qué puede hacer cada rol?</b></summary>
          <ul className="checklist" style={{ marginTop: 12 }}>
            {roleOptions.map(([k, label]) => (
              <li key={k}><Icon name="check" /><span><b>{label}:</b> {k === "colaborador" ? collaboratorRole(comercio).help : PERMISSION_INFO[k].help}</span></li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
