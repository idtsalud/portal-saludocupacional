"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { deleteUser, EMAIL_RE, inviteUser, PERMISSIONS } from "@/lib/invite";
import { requireOrg } from "@/lib/session";

const MAX_POR_VEZ = 25;

async function requireAdmin() {
  const s = await requireOrg();
  if (s.profile.permission !== "admin" && !s.profile.is_idt_staff) redirect("/usuarios?error=permiso");
  return s;
}

export async function inviteTeamMember(f: FormData) {
  const { org } = await requireAdmin();
  const email = String(f.get("email") ?? "").trim().toLowerCase();
  const fullName = String(f.get("full_name") ?? "").trim().slice(0, 120);
  const roleTitle = String(f.get("role_title") ?? "").trim().slice(0, 80);
  const permission = String(f.get("permission") ?? "todo");
  if (!EMAIL_RE.test(email) || !fullName || !(permission in PERMISSIONS)) redirect("/usuarios?error=datos");
  const { error } = await inviteUser({ email, fullName, roleTitle, permission: permission as "todo", orgId: org.id });
  if (error) redirect("/usuarios?error=invitar");
  revalidatePath("/usuarios");
  redirect("/usuarios?ok=invitado");
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

export async function removeCollaborator(f: FormData) {
  const { supabase, org } = await requireAdmin();
  const id = String(f.get("id") ?? "");
  const { data: p } = await supabase.from("profiles").select("id, org_id, user_type").eq("id", id).single();
  if (!p || p.org_id !== org.id || p.user_type !== "colaborador") redirect("/usuarios?error=permiso");
  const { error } = await deleteUser(id);
  if (error) redirect("/usuarios?error=fallo#colaboradores");
  revalidatePath("/usuarios");
  redirect("/usuarios?ok=quitado#colaboradores");
}
