"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { deleteUser, EMAIL_RE, inviteUser, PERMISSIONS } from "@/lib/invite";
import { requireOrg } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_POR_VEZ = 25;

async function requireAdmin() {
  const s = await requireOrg();
  if (s.profile.permission !== "admin" && !s.profile.is_idt_staff) redirect("/usuarios?error=permiso");
  return s;
}

/** Rol elegido en el formulario: "colaborador" o uno de los permisos del equipo. */
function parseRole(value: string) {
  if (value === "colaborador") return { userType: "colaborador" as const, permission: "todo" as const };
  if (value in PERMISSIONS) return { userType: "cliente" as const, permission: value as "admin" };
  return null;
}

export async function invitePerson(f: FormData) {
  const { org } = await requireAdmin();
  const email = String(f.get("email") ?? "").trim().toLowerCase();
  const fullName = String(f.get("full_name") ?? "").trim().slice(0, 120);
  const roleTitle = String(f.get("role_title") ?? "").trim().slice(0, 80);
  const role = parseRole(String(f.get("permission") ?? ""));
  if (!EMAIL_RE.test(email) || !fullName || !role) redirect("/usuarios?error=datos#sumar");
  const { error } = await inviteUser({ email, fullName, roleTitle, permission: role.permission, orgId: org.id, userType: role.userType });
  if (error) redirect("/usuarios?error=invitar#sumar");
  revalidatePath("/usuarios");
  redirect("/usuarios?ok=invitado");
}

/** Cambia el rol de alguien de la organización (por ejemplo, un segundo dueño pasa a Administrador). */
export async function changeRole(f: FormData) {
  const { org, profile } = await requireAdmin();
  const id = String(f.get("id") ?? "");
  const role = parseRole(String(f.get("permission") ?? ""));
  if (!id || !role) redirect("/usuarios?error=datos#personas");
  if (id === profile.id) redirect("/usuarios?error=propio#personas");
  const admin = createAdminClient();
  const { data: p } = await admin.from("profiles").select("org_id, is_idt_staff").eq("id", id).single();
  if (!p || p.org_id !== org.id || p.is_idt_staff) redirect("/usuarios?error=permiso#personas");
  const { error } = await admin.from("profiles").update({ user_type: role.userType, permission: role.permission }).eq("id", id);
  if (error) redirect("/usuarios?error=fallo#personas");
  revalidatePath("/usuarios");
  redirect("/usuarios?ok=rol#personas");
}

/** Una línea por persona: "Nombre Apellido, correo" (también acepta ; o tabulación, como al pegar desde Excel). */
function parseLines(text: string) {
  const out: { name: string; email: string }[] = [];
  const bad: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const email = (line.match(/[^\s,;<>]+@[^\s,;<>]+\.[^\s,;<>]+/) ?? [""])[0].toLowerCase();
    const name = line.replace(email, "").replace(/[,;\t<>]+/g, " ").replace(/\s+/g, " ").trim();
    if (!EMAIL_RE.test(email) || !name) bad.push(line);
    else out.push({ name: name.slice(0, 120), email });
  }
  return { out, bad };
}

export async function inviteCollaborators(f: FormData) {
  const { org } = await requireAdmin();
  const { out, bad } = parseLines(String(f.get("lista") ?? ""));
  if (out.length === 0) redirect("/usuarios?error=datos#colaboradores");
  let ok = 0;
  let failed = bad.length;
  for (const p of out.slice(0, MAX_POR_VEZ)) {
    const { error } = await inviteUser({ email: p.email, fullName: p.name, roleTitle: "", permission: "todo", orgId: org.id, userType: "colaborador" });
    if (error) failed++;
    else ok++;
  }
  const pending = Math.max(0, out.length - MAX_POR_VEZ);
  revalidatePath("/usuarios");
  redirect(`/usuarios?invitados=${ok}&fallidos=${failed}&pendientes=${pending}#colaboradores`);
}

/** Quita el acceso al portal de cualquier persona de la organización, salvo a uno mismo y al personal de IDT. */
export async function removePerson(f: FormData) {
  const { org, profile } = await requireAdmin();
  const id = String(f.get("id") ?? "");
  if (id === profile.id) redirect("/usuarios?error=propio#personas");
  const { data: p } = await createAdminClient().from("profiles").select("id, org_id, is_idt_staff").eq("id", id).single();
  if (!p || p.org_id !== org.id || p.is_idt_staff) redirect("/usuarios?error=permiso#personas");
  const { error } = await deleteUser(id);
  if (error) redirect("/usuarios?error=fallo#personas");
  revalidatePath("/usuarios");
  redirect("/usuarios?ok=quitado#personas");
}
