"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/session";
import { inviteUser, PERMISSIONS } from "@/lib/invite";
import { syncAvisos } from "@/lib/avisos-sync";
import { createAdminClient } from "@/lib/supabase/admin";

const str = (f: FormData, k: string, max = 200) => String(f.get(k) ?? "").trim().slice(0, max);

function orgFields(f: FormData) {
  const kind = str(f, "kind");
  const units = parseInt(str(f, "plan_units"), 10);
  const staff = parseInt(str(f, "staff_count"), 10);
  return {
    name: str(f, "name", 160),
    kind: kind === "comercio" ? "comercio" : "empresa",
    plan: str(f, "plan", 80),
    plan_units: Number.isFinite(units) ? units : 15,
    staff_count: Number.isFinite(staff) ? staff : null,
    referente_medico: str(f, "referente_medico", 120) || null,
    sheet_company_key: str(f, "sheet_company_key", 160) || null,
    has_aviso_medico: f.get("has_aviso_medico") === "on",
    has_ruta_saludable: f.get("has_ruta_saludable") === "on",
    has_academia: f.get("has_academia") === "on",
    has_campanas: f.get("has_campanas") === "on",
  };
}

export async function createOrg(f: FormData) {
  const { supabase } = await requireStaff();
  const fields = orgFields(f);
  if (!fields.name || !fields.plan) redirect("/admin?error=datos");
  const { data, error } = await supabase.from("organizations").insert(fields).select("id").single();
  if (error || !data) redirect("/admin?error=fallo");
  revalidatePath("/admin");
  redirect(`/admin/org/${data.id}?ok=org`);
}

export async function updateOrg(f: FormData) {
  const { supabase } = await requireStaff();
  const id = str(f, "id");
  const fields = orgFields(f);
  if (!id || !fields.name || !fields.plan) redirect(`/admin/org/${id}?error=datos`);
  const { error } = await supabase.from("organizations").update(fields).eq("id", id);
  if (error) redirect(`/admin/org/${id}?error=fallo`);
  revalidatePath(`/admin/org/${id}`);
  redirect(`/admin/org/${id}?ok=org`);
}

export async function inviteToOrg(f: FormData) {
  await requireStaff();
  const orgId = str(f, "org_id");
  const email = str(f, "email").toLowerCase();
  const fullName = str(f, "full_name", 120);
  const permission = str(f, "permission");
  if (!orgId || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !fullName || !(permission in PERMISSIONS)) redirect(`/admin/org/${orgId}?error=datos`);
  const { error } = await inviteUser({ email, fullName, roleTitle: str(f, "role_title", 80), permission: permission as "admin", orgId });
  if (error) redirect(`/admin/org/${orgId}?error=invitar`);
  revalidatePath(`/admin/org/${orgId}`);
  redirect(`/admin/org/${orgId}?ok=invitado`);
}

export async function updateRequestStatus(f: FormData) {
  const { supabase } = await requireStaff();
  const id = Number(str(f, "id"));
  const status = str(f, "status");
  if (!id || !["recibido", "coordinado", "realizado", "resultados", "cancelado"].includes(status)) redirect("/admin/pedidos?error=datos");
  const { error } = await supabase.from("requests").update({ status, status_detail: str(f, "status_detail", 200) || null }).eq("id", id);
  if (error) redirect("/admin/pedidos?error=fallo");
  revalidatePath("/admin/pedidos");
  redirect("/admin/pedidos?ok=estado");
}

const SERVICES = ["aviso_medico", "ruta_saludable", "academia", "campanas"];
const CATEGORIES = ["certificado", "kit", "campana", "programa", "otro"];

export async function uploadDocument(f: FormData) {
  await requireStaff();
  const file = f.get("file");
  const orgId = str(f, "org_id");
  const category = str(f, "category");
  const title = str(f, "title", 160);
  if (!(file instanceof File) || file.size === 0 || !title || !CATEGORIES.includes(category)) redirect("/admin/documentos?error=datos");
  if (file.size > 4 * 1024 * 1024) redirect("/admin/documentos?error=datos");

  const folder = orgId || "general";
  const safeName = file.name.normalize("NFD").replace(/[^\w.-]+/g, "_").slice(-80);
  const path = `${folder}/${Date.now()}-${safeName}`;
  const admin = createAdminClient();
  const { error: upErr } = await admin.storage.from("documentos").upload(path, file, { contentType: file.type || "application/octet-stream" });
  if (upErr) redirect("/admin/documentos?error=fallo");

  const req = str(f, "requires_service");
  const { error } = await admin.from("documents").insert({
    org_id: orgId || null,
    category,
    title,
    description: str(f, "description", 300) || null,
    storage_path: path,
    requires_service: SERVICES.includes(req) ? req : null,
  });
  if (error) redirect("/admin/documentos?error=fallo");
  revalidatePath("/admin/documentos");
  redirect("/admin/documentos?ok=doc");
}

export async function runSync() {
  await requireStaff();
  try {
    await syncAvisos();
  } catch {
    redirect("/admin?error=fallo");
  }
  revalidatePath("/admin");
  redirect("/admin?ok=sync");
}
