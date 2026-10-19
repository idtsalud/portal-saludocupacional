import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Flash } from "@/components/Flash";
import { Icon } from "@/components/Icon";
import { SubmitButton } from "@/components/SubmitButton";
import { inviteUser, PERMISSIONS } from "@/lib/invite";
import { requireOrg } from "@/lib/session";

async function invite(formData: FormData) {
  "use server";
  const { org, profile } = await requireOrg();
  if (profile.permission !== "admin" && !profile.is_idt_staff) redirect("/usuarios?error=permiso");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("full_name") ?? "").trim().slice(0, 120);
  const roleTitle = String(formData.get("role_title") ?? "").trim().slice(0, 80);
  const permission = String(formData.get("permission") ?? "todo");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !fullName || !(permission in PERMISSIONS)) redirect("/usuarios?error=datos");

  const { error } = await inviteUser({ email, fullName, roleTitle, permission: permission as "todo", orgId: org.id });
  if (error) redirect("/usuarios?error=invitar");
  revalidatePath("/usuarios");
  redirect("/usuarios?ok=invitado");
}

export default async function Usuarios({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase, org, profile } = await requireOrg();
  const { data: people } = await supabase
    .from("profiles")
    .select("id, full_name, role_title, permission")
    .eq("org_id", org.id)
    .order("created_at");
  const canInvite = profile.permission === "admin" || profile.is_idt_staff;

  return (
    <>
      <div className="head">
        <h1>Usuarios</h1>
        <p>Cada persona entra con su propio usuario. Nadie comparte contraseña.</p>
      </div>
      <Flash ok={sp.ok} error={sp.error} />
      <section className="card">
        <h2>Personas con acceso</h2>
        <div className="tbl">
          <table>
            <thead><tr><th>Nombre</th><th>Rol</th><th>Permiso</th></tr></thead>
            <tbody>
              {(people ?? []).map((p) => (
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
          <h2>Invitar a alguien</h2>
          <form className="f" action={invite}>
            <div className="two">
              <label htmlFor="full_name">Nombre y apellido<input id="full_name" name="full_name" required maxLength={120} /></label>
              <label htmlFor="email">Correo<input id="email" name="email" type="email" required /></label>
            </div>
            <div className="two">
              <label htmlFor="role_title">Rol en la empresa<input id="role_title" name="role_title" placeholder="RR.HH., Higiene y Seguridad, Gerencia" maxLength={80} /></label>
              <label htmlFor="permission">
                Permiso
                <select id="permission" name="permission" defaultValue="todo">
                  {Object.entries(PERMISSIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
            </div>
            <SubmitButton>Enviar invitación</SubmitButton>
          </form>
          <p className="note" style={{ marginTop: 12 }}>
            <Icon name="shield" />
            <span>Nadie de la empresa ve diagnósticos: eso queda en la historia clínica, con acceso médico.</span>
          </p>
        </section>
      )}
    </>
  );
}
